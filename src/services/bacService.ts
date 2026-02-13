
import { Drink, UserProfile, BacStatus } from '../types';
import { ALCOHOL_DENSITY, GENDER_CONSTANT, METABOLISM_RATE, THEME_COLORS, CONSUMPTION_RATES, FUNNY_EXPRESSIONS } from '../constants';

// Helper to get duration
const getConsumptionDurationMs = (drink: Drink, userSpeed: 'slow' | 'average' | 'fast'): number => {
  if (drink.isChug) return 0;
  const type = drink.type || 'other';
  const rates = CONSUMPTION_RATES[type as keyof typeof CONSUMPTION_RATES] || CONSUMPTION_RATES.other;
  const rateMlPerMin = rates[userSpeed];
  const minutes = drink.volumeMl / rateMlPerMin;
  return minutes * 60 * 1000;
};

// Common simulation logic generator
const simulateBac = (drinks: Drink[], user: UserProfile, startTime: number, endTime: number, stepMs: number = 60000): { time: number, bac: number }[] => {
  const r = GENDER_CONSTANT[user.gender];
  const weight = user.weightKg;
  const userSpeed = user.drinkingSpeed || 'average';
  const ABSORPTION_DELAY_MIN = 45;
  const METABOLISM_PER_MS = (METABOLISM_RATE / 60) / 60000;

  const sortedDrinks = [...drinks].sort((a, b) => a.timestamp - b.timestamp);

  // Safety: If weight is invalid, we can't calc BAC, but we should return time points with 0 BAC


  if (sortedDrinks.length === 0) {
    const points = [];
    for (let t = startTime; t <= endTime; t += stepMs) {
      points.push({ time: t, bac: 0 });
    }
    return points;
  }

  const drinkEvents = sortedDrinks.map(d => {
    const duration = getConsumptionDurationMs(d, userSpeed);
    const alcoholGrams = d.volumeMl * (d.abv / 100) * ALCOHOL_DENSITY;
    const totalPotentialBac = weight > 0 ? (alcoholGrams / (weight * r)) / 10 : 0;
    const absorptionWindowMs = duration + (ABSORPTION_DELAY_MIN * 60 * 1000);

    return {
      start: d.timestamp,
      end: d.timestamp + absorptionWindowMs,
      bacPerMs: totalPotentialBac / absorptionWindowMs
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

  while (tSim <= endTime) {
    let addedBac = 0;
    for (const event of drinkEvents) {
      if (tSim >= event.start && tSim < event.end) {
        addedBac += event.bacPerMs * stepMs;
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
  return simulateBac(drinks, user, startTime, endTime, 5 * 60 * 1000);
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
    return { currentBac: 0, peakBac: 0, peakTime: null, soberTimestamp: null, statusMessage: t.setup, color: THEME_COLORS.safe };
  }

  const now = Date.now();

  if (drinks.length === 0) {
    return { currentBac: 0, peakBac: 0, peakTime: null, soberTimestamp: null, statusMessage: t.sober, color: THEME_COLORS.safe };
  }

  const sortedDrinks = [...drinks].sort((a, b) => a.timestamp - b.timestamp);
  const simStart = sortedDrinks[0].timestamp;
  const simEnd = Math.max(now + (24 * 60 * 60 * 1000), sortedDrinks[sortedDrinks.length - 1].timestamp + (12 * 60 * 60 * 1000));

  const points = simulateBac(drinks, user, simStart, simEnd, 60000);

  let currentBac = 0;
  let maxBac = 0;
  let maxBacTime: number | null = null;
  let soberTime: number | null = null;

  const nowPoint = points.find(p => p.time >= now);
  currentBac = nowPoint ? nowPoint.bac : 0;

  points.forEach(p => {
    if (p.bac > maxBac) {
      maxBac = p.bac;
      maxBacTime = p.time;
    }
  });

  if (maxBac > 0 && maxBacTime) {
    const soberPoint = points.find(p => p.time > maxBacTime! && p.bac <= 0);
    if (soberPoint) soberTime = soberPoint.time;
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
    // We need a stable index based on the BAC value so it doesn't flicker every minute
    // 0.150 -> Index 0
    // 0.155 -> Index 1
    // Step is 0.005 (which corresponds to 0.05 g/L)
    const step = 0.005;
    const base = 0.15;
    const index = Math.floor((formattedBac - base) / step);
    // Safe modulo
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
    color
  };
};
