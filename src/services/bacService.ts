
import { Drink, UserProfile, BacStatus } from '../types';
import { ALCOHOL_DENSITY, GENDER_CONSTANT, METABOLISM_RATE, METABOLISM_RATES, THEME_COLORS, CONSUMPTION_RATES, ABSORPTION_DELAYS, CARBONATION_FACTOR, FUNNY_EXPRESSIONS } from '../constants';

// --- Watson Formula for Widmark r ---
// Uses Total Body Water (TBW) estimation from Watson (1981) for more individualized calculation.
// Falls back to average GENDER_CONSTANT if height/age not available.
const calculateWidmarkR = (gender: 'male' | 'female', weightKg: number, heightCm?: number, birthDate?: string): number => {
  if (!heightCm || !birthDate) {
    return GENDER_CONSTANT[gender]; // Fallback to simple constant
  }

  // Calculate age from birthDate
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  age = Math.max(18, Math.min(99, age)); // Clamp to reasonable range

  let tbw: number;
  if (gender === 'male') {
    // Watson (1981) — Male
    tbw = 2.447 - 0.09516 * age + 0.1074 * heightCm + 0.3362 * weightKg;
  } else {
    // Watson (1981) — Female
    tbw = -2.097 + 0.1069 * heightCm + 0.2466 * weightKg;
  }

  // r = TBW / (density_water × bodyweight)
  // density_water ≈ 0.8 for the distribution volume ratio
  const r = tbw / (0.8 * weightKg);

  // Clamp to physiologically reasonable range (0.45–0.85)
  return Math.max(0.45, Math.min(0.85, r));
};

// --- Dynamic Absorption Delay ---
// Returns the absorption delay in minutes based on drink type, stomach state, and carbonation.
const getAbsorptionDelayMin = (drink: Drink, stomachState: 'fasting' | 'light' | 'full'): number => {
  const type = drink.type || 'other';
  const delays = ABSORPTION_DELAYS[type] || ABSORPTION_DELAYS.other;
  let delay = delays[stomachState] || delays.light;

  // Carbonated drinks are absorbed faster
  if (drink.carbonated) {
    delay *= CARBONATION_FACTOR;
  }

  return delay;
};

// Helper to get consumption duration
const getConsumptionDurationMs = (drink: Drink, userSpeed: 'slow' | 'average' | 'fast'): number => {
  if (drink.isChug) return 0;
  const type = drink.type || 'other';
  const rates = CONSUMPTION_RATES[type as keyof typeof CONSUMPTION_RATES] || CONSUMPTION_RATES.other;
  const rateMlPerMin = rates[userSpeed];
  const minutes = drink.volumeMl / rateMlPerMin;
  return minutes * 60 * 1000;
};

// --- Exponential Absorption Model ---
// Instead of linear absorption, we use an exponential model where most alcohol
// is absorbed early in the window. This better models real GI absorption.
// The total BAC is distributed using: f(t) = k * e^(-k*t), where k is chosen
// so that ~95% is absorbed by the end of the absorption window.
// For discrete simulation: at each step, we compute the fraction absorbed.
const simulateBac = (drinks: Drink[], user: UserProfile, startTime: number, endTime: number, stepMs: number = 60000): { time: number, bac: number }[] => {
  const r = calculateWidmarkR(user.gender, user.weightKg, user.heightCm, user.birthDate);
  const weight = user.weightKg;
  const userSpeed = user.drinkingSpeed || 'average';
  const stomachState = user.stomachState || 'light'; // Default: light meal

  const eliminationRate = user.habitLevel ? METABOLISM_RATES[user.habitLevel] : METABOLISM_RATE;
  const METABOLISM_PER_MS = (eliminationRate / 60) / 60000;

  const sortedDrinks = [...drinks].sort((a, b) => a.timestamp - b.timestamp);

  if (sortedDrinks.length === 0) {
    const points = [];
    for (let t = startTime; t <= endTime; t += stepMs) {
      points.push({ time: t, bac: 0 });
    }
    return points;
  }

  // Build drink events with exponential absorption parameters
  const drinkEvents = sortedDrinks.map(d => {
    const consumptionDurationMs = getConsumptionDurationMs(d, userSpeed);
    const absorptionDelayMin = getAbsorptionDelayMin(d, stomachState);
    const alcoholGrams = d.volumeMl * (d.abv / 100) * ALCOHOL_DENSITY;
    const totalPotentialBac = weight > 0 ? (alcoholGrams / (weight * r)) / 10 : 0;

    // Total absorption window = consumption time + absorption delay
    const absorptionWindowMs = consumptionDurationMs + (absorptionDelayMin * 60 * 1000);

    // k parameter for exponential: chosen so that 95% is absorbed by end of window
    // Integral of k*e^(-kt) from 0 to T = 1 - e^(-kT) = 0.95 → k = -ln(0.05)/T
    const k = -Math.log(0.05) / absorptionWindowMs; // ~= 3 / absorptionWindowMs

    return {
      start: d.timestamp,
      absorptionWindowMs,
      totalPotentialBac,
      k,
    };
  });

  const dataPoints: { time: number, bac: number }[] = [];
  const firstDrinkTime = sortedDrinks[0].timestamp;

  if (startTime < firstDrinkTime) {
    for (let t = startTime; t < firstDrinkTime && t <= endTime; t += stepMs) {
      dataPoints.push({ time: t, bac: 0 });
    }
  }

  let tSim = firstDrinkTime;
  let currentSimBac = 0;

  // Track cumulative absorption per drink event for exponential model
  const cumulativeAbsorbed: number[] = drinkEvents.map(() => 0);

  while (tSim <= endTime) {
    let addedBac = 0;

    for (let i = 0; i < drinkEvents.length; i++) {
      const event = drinkEvents[i];
      const elapsed = tSim - event.start;

      if (elapsed >= 0 && elapsed < event.absorptionWindowMs + stepMs) {
        // Exponential CDF: fraction absorbed at time t = 1 - e^(-k*t)
        const fractionNow = Math.min(1, 1 - Math.exp(-event.k * Math.max(0, elapsed + stepMs)));
        const fractionPrev = cumulativeAbsorbed[i];

        const delta = (fractionNow - fractionPrev) * event.totalPotentialBac;
        if (delta > 0) {
          addedBac += delta;
          cumulativeAbsorbed[i] = fractionNow;
        }
      }
    }

    currentSimBac += addedBac;

    if (currentSimBac > 0) {
      const eliminated = METABOLISM_PER_MS * stepMs;
      currentSimBac = Math.max(0, currentSimBac - eliminated);
    }

    if (tSim >= startTime) {
      dataPoints.push({ time: tSim, bac: currentSimBac });
    }

    tSim += stepMs;
  }

  return dataPoints;
};

export const generateBacTrend = (drinks: Drink[], user: UserProfile, centerTime: number): { time: number, bac: number }[] => {
  // 14 hours total window: 7h before, 7h after
  const startTime = centerTime - (7 * 60 * 60 * 1000);
  const endTime = centerTime + (7 * 60 * 60 * 1000);
  return simulateBac(drinks, user, startTime, endTime, 60000);
};

export const calculateBac = (drinks: Drink[], user: UserProfile): BacStatus => {
  const lang = user.language || 'en';
  const t = {
    setup: lang === 'fr' ? 'Profil Requis' : 'Setup Required',
    sober: lang === 'fr' ? 'Sobre' : 'Sober',
    buzzy: lang === 'fr' ? 'Pompette' : 'Buzzy',
    tipsy: lang === 'fr' ? 'Éméché' : 'Tipsy',
    loaded: lang === 'fr' ? 'Chargé' : 'Loaded',
    drunk: lang === 'fr' ? 'Ivre' : 'Drunk'
  };

  if (!user.weightKg || user.weightKg <= 0) {
    return { currentBac: 0, peakBac: 0, peakTime: null, soberTimestamp: null, statusMessage: t.setup, color: THEME_COLORS.safe, limitBac: 0.20 };
  }

  const now = Date.now();

  if (drinks.length === 0) {
    return { currentBac: 0, peakBac: 0, peakTime: null, soberTimestamp: null, statusMessage: t.sober, color: THEME_COLORS.safe, limitBac: 0.20 };
  }

  // 1. Filter: only consider drinks from the last 48 hours for calculation.
  // This ensures simulation remains fast and avoids accumulation of drift from very old drinks.
  const LOOKBACK_WINDOW = 48 * 60 * 60 * 1000;
  const recentDrinks = drinks.filter(d => d.timestamp > now - LOOKBACK_WINDOW);

  if (recentDrinks.length === 0) {
    return { currentBac: 0, peakBac: 0, peakTime: null, soberTimestamp: null, statusMessage: t.sober, color: THEME_COLORS.safe, limitBac: 0.20 };
  }

  const sortedDrinks = [...recentDrinks].sort((a, b) => a.timestamp - b.timestamp);
  const simStart = sortedDrinks[0].timestamp;
  const simEnd = Math.max(now + (24 * 60 * 60 * 1000), sortedDrinks[sortedDrinks.length - 1].timestamp + (12 * 60 * 60 * 1000));

  const points = simulateBac(recentDrinks, user, simStart, simEnd, 60000);

  let currentBac = 0;
  let maxBac = 0;
  let maxBacTime: number | null = null;
  let soberTime: number | null = null;

  const nowPointIndex = points.findIndex(p => p.time >= now);

  if (nowPointIndex !== -1) {
    currentBac = points[nowPointIndex].bac;

    if (currentBac > 0) {
      // Find the start of the current drinking session (backwards from now)
      let sessionStartIndex = 0;
      for (let i = nowPointIndex; i >= 0; i--) {
        if (points[i].bac <= 0) {
          sessionStartIndex = i;
          break;
        }
      }

      // Find the end of the current drinking session (forwards from now)
      let sessionEndIndex = points.length - 1;
      for (let i = nowPointIndex; i < points.length; i++) {
        if (points[i].bac <= 0) {
          sessionEndIndex = i;
          break;
        }
      }

      // Calculate peak only within this active session
      for (let i = sessionStartIndex; i <= sessionEndIndex; i++) {
        if (points[i].bac > maxBac) {
          maxBac = points[i].bac;
          maxBacTime = points[i].time;
        }
      }

      // Sober time is the end of the session, if it's strictly in the future
      if (points[sessionEndIndex].bac <= 0 && points[sessionEndIndex].time > now) {
        soberTime = points[sessionEndIndex].time;
      }
    }
  }

  const formattedBac = Math.max(0, parseFloat(currentBac.toFixed(4)));
  const formattedPeak = Math.max(0, parseFloat(maxBac.toFixed(4)));

  let statusMessage = t.sober;
  let color = THEME_COLORS.safe;

  // Thresholds (in %)
  // 0.05% = 0.5 g/L
  // 0.10% = 1.0 g/L
  // 0.15% = 1.5 g/L

  if (formattedBac > 0.00 && formattedBac < 0.05) {
    statusMessage = t.buzzy;
    color = THEME_COLORS.buzz;
  } else if (formattedBac >= 0.05 && formattedBac < 0.10) {
    statusMessage = t.tipsy;
    color = THEME_COLORS.drunk;
  } else if (formattedBac >= 0.10 && formattedBac < 0.15) {
    statusMessage = t.loaded;
    color = THEME_COLORS.danger;
  } else if (formattedBac >= 0.15) {
    // Funny expressions mode
    const step = 0.005;
    const base = 0.15;
    const index = Math.floor((formattedBac - base) / step);
    const safeIndex = Math.max(0, index) % FUNNY_EXPRESSIONS.length;
    statusMessage = FUNNY_EXPRESSIONS[safeIndex];
    color = THEME_COLORS.danger;
  }

  return {
    currentBac: formattedBac,
    peakBac: formattedPeak,
    peakTime: maxBacTime,
    soberTimestamp: soberTime,
    statusMessage,
    color,
    limitBac: 0.20
  };
};
