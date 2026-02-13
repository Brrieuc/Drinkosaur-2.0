import React, { useMemo, useState } from 'react';
import { BacStatus, Drink, UserProfile, FriendGroup } from '../types';
import { Clock, Zap, AlertTriangle, TrendingUp, BarChart3, Inbox, Bell } from 'lucide-react';
import { BacChartModal } from './BacChartModal';
import { StatsModal } from './StatsModal';
import { NotificationsModal } from './NotificationsModal';
import { FriendRequest } from '../hooks/useSocial';


interface DashboardProps {
  status: BacStatus;
  language?: 'en' | 'fr';
  drinks?: Drink[];
  user?: UserProfile;
  incomingRequests?: FriendRequest[];
  groupInvites?: FriendGroup[];
  onRespondRequest?: (requestId: string, accept: boolean) => void;
  onAcceptGroup?: (groupId: string) => void;
  onDeclineGroup?: (groupId: string) => void;
}

// NOTE: Dashboard now needs full drinks/user props for the modal chart, 
// but to maintain compatibility with App.tsx without breaking changes immediately,
// we will handle optional props gracefully.
// However, App.tsx should ideally pass these. We will update App.tsx in a real scenario,
// but for this specific "change", we assume App.tsx passes them or we don't show chart if missing.

export const Dashboard: React.FC<DashboardProps> = ({
  status,
  language = 'en',
  drinks = [],
  user,
  incomingRequests = [],
  groupInvites = [],
  onRespondRequest,
  onAcceptGroup,
  onDeclineGroup
}) => {
  const [showChartModal, setShowChartModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const isFrench = language === 'fr';

  const notificationCount = incomingRequests.length + groupInvites.length;

  const t = {
    bacLevel: isFrench ? 'Taux Alcool' : 'BAC Level',
    soberAt: isFrench ? 'Sobre à' : 'Sober At',
    limitLoad: isFrench ? 'Charge Limite' : 'Limit Load',
    unitDesc: isFrench ? 'Grammes par Litre' : 'g/100ml',
    drivingWarning: 'Ne prenez pas le volant',
    peak: isFrench ? 'Pic' : 'Peak',
    at: isFrench ? 'à' : '@',
    stats: isFrench ? 'Stats' : 'Stats'
  };

  // Logic for display value and unit
  // EN: Uses % (g/100ml). FR: Uses g/L.
  // Conversion: 1% = 10 g/L.
  const displayValue = isFrench ? status.currentBac * 10 : status.currentBac;
  const displayUnit = isFrench ? 'g/L' : '%';
  const displayDecimals = isFrench ? 2 : 3; // 0.50 g/L vs 0.050 %

  // Peak Logic
  const displayPeak = isFrench ? status.peakBac * 10 : status.peakBac;
  const showPeak = status.peakBac > status.currentBac + 0.005; // Only show if peak is significantly higher
  const peakTimeStr = status.peakTime
    ? new Date(status.peakTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Warning Logic: France limit is 0.5 g/L
  const showDrivingWarning = isFrench && displayValue >= 0.5;

  const soberTimeStr = useMemo(() => {
    if (!status.soberTimestamp) return null;
    return new Date(status.soberTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [status.soberTimestamp]);

  // Visual scaling: Assume 0.20% (or 2.0 g/L) is max for full visual height
  const liquidHeight = Math.min((status.currentBac / 0.20) * 100, 100);

  // Dynamic gradient based on consumed drinks
  const { gradientStyle, glowStyle } = useMemo(() => {
    const defaultGradient = 'linear-gradient(to top, #22d3ee, #3b82f6, #6366f1)';

    if (status.currentBac <= 0 || drinks.length === 0) {
      return {
        gradientStyle: { background: defaultGradient },
        glowStyle: { background: 'rgb(59, 130, 246)' }
      };
    }

    const now = Date.now();
    const activeDrinks = drinks
      .filter(d => d.timestamp > now - 12 * 60 * 60 * 1000)
      .sort((a, b) => a.timestamp - b.timestamp);

    const colors = activeDrinks
      .map(d => d.color || '#FCD34D')
      .filter((c, i, self) => self.indexOf(c) === i);

    if (colors.length === 0) {
      return {
        gradientStyle: { background: defaultGradient },
        glowStyle: { background: 'rgb(59, 130, 246)' }
      };
    }

    if (colors.length === 1) {
      const c = colors[0];
      return {
        gradientStyle: { background: `linear-gradient(to top, ${c}, ${c}dd)` },
        glowStyle: { background: c }
      };
    }

    const gradientStr = `linear-gradient(to top, ${colors.join(', ')})`;
    return {
      gradientStyle: { background: gradientStr },
      glowStyle: { background: colors[colors.length - 1] }
    };
  }, [drinks, status.currentBac]);

  return (
    <div className="w-full h-full flex flex-col p-6 animate-fade-in relative overflow-hidden">

      {/* Chart Modal */}
      {showChartModal && user && (
        <BacChartModal drinks={drinks} user={user} onClose={() => setShowChartModal(false)} />
      )}

      {/* Stats Modal */}
      {showStats && user && (
        <StatsModal drinks={drinks} user={user} onClose={() => setShowStats(false)} />
      )}

      {/* Stats Modal */}
      {showStats && user && (
        <StatsModal drinks={drinks} user={user} onClose={() => setShowStats(false)} />
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <NotificationsModal
          requests={incomingRequests}
          invites={groupInvites}
          onClose={() => setShowNotifications(false)}
          onRespondRequest={(id, accept) => onRespondRequest?.(id, accept)}
          onAcceptGroup={(id) => onAcceptGroup?.(id)}
          onDeclineGroup={(id) => onDeclineGroup?.(id)}
          language={language}
        />
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 mb-4 z-10 pt-2">
        {/* Top Row: Logo & Status */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj3GwalK-_8qkiqtJ9wxjVPg7C3VGn-slPe3XK-DNhm4iSq2f0VBeOEjanUW_uoncmzZu74szYMJhs_o8xYV0RU3g-HZTflVBgh9Tj8wSy43r1MiQrgyrp8HIQJyP6wBQu5bT5tFCrLhskSvzeL8flCHnZ6T-7kheSEkcwm6fQuSGZE-LKrBq6KbB_pg4k/s16000/drinkosaur.png"
              alt="Logo"
              className="w-10 h-10 rounded-xl shadow-lg border border-white/10"
            />
            <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg">
              Drinkosaur
            </h1>
          </div>
          <div className={`px-4 py-2 rounded-2xl glass-panel-3d flex items-center gap-2 border border-white/10 relative overflow-hidden group`}>
            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${status.color.split(' ')[1].replace('to-', 'text-')} animate-pulse`} />
            <span className="text-white font-semibold text-xs uppercase tracking-widest">{status.statusMessage}</span>
          </div>
        </div>

        {/* Action Row: Stats (Left) & Inbox (Right) */}
        <div className="flex justify-between items-center px-1">
          <button
            onClick={() => setShowStats(true)}
            className="w-12 h-12 rounded-full glass-panel-3d flex items-center justify-center text-purple-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-lg relative group"
            aria-label="Statistics"
          >
            <BarChart3 size={20} className="group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={() => setShowNotifications(true)}
            className="w-12 h-12 rounded-full glass-panel-3d flex items-center justify-center text-blue-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-lg relative group"
            aria-label="Notifications"
          >
            <Inbox size={20} className="group-hover:scale-110 transition-transform" />
            {notificationCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border-2 border-[#1a1a2e]">
                {notificationCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main 3D Sphere Gauge */}
      <div className="flex-1 flex flex-col items-center justify-center relative -mt-4">

        {/* Driving Warning Banner (Specific to French limit) */}
        {showDrivingWarning && (
          <div className="absolute top-6 z-50">
            <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full backdrop-blur-md flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={14} />
              <span className="text-red-200 font-medium text-[10px] uppercase tracking-widest">
                {t.drivingWarning}
              </span>
            </div>
          </div>
        )}

        {/* Glow behind the sphere */}
        <div
          className="absolute w-64 h-64 rounded-full blur-[80px] opacity-40 animate-pulse"
          style={glowStyle}
        />

        {/* The Sphere Container (Clickable) */}
        <div
          onClick={() => user && setShowChartModal(true)}
          className="relative w-72 h-72 md:w-80 md:h-80 glass-sphere rounded-full overflow-hidden flex items-center justify-center transform transition-all duration-500 hover:scale-[1.02] cursor-pointer active:scale-95 group"
        >

          {/* Hint that it is clickable */}
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none" />

          {/* Specular Highlight (Reflection) Top Left */}
          <div className="absolute top-[10%] left-[10%] w-[40%] h-[25%] bg-gradient-to-b from-white/40 to-transparent rounded-[100%] rotate-[-45deg] blur-[2px] z-20 pointer-events-none" />

          {/* Liquid Container */}
          <div className="absolute bottom-0 left-0 right-0 z-0 transition-all duration-1000 ease-in-out w-full" style={{ height: `${liquidHeight}%`, maxHeight: '100%' }}>
            {/* The Liquid Surface (Wave) */}
            <div className="absolute -top-4 left-0 w-[200%] h-8 bg-white/30 rounded-[100%] animate-[liquid-wave_6s_linear_infinite]" />
            <div className="absolute -top-4 left-[-10%] w-[200%] h-8 bg-white/20 rounded-[100%] animate-[liquid-wave_9s_linear_infinite_reverse]" />

            {/* The Liquid Body */}
            <div
              className="w-full h-full opacity-90 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]"
              style={gradientStyle}
            ></div>

            {/* Bubbles */}
            <div className="absolute bottom-0 w-full h-full overflow-hidden">
              <div className="absolute bottom-[-10px] left-[20%] w-2 h-2 bg-white/40 rounded-full animate-[float_4s_infinite]" />
              <div className="absolute bottom-[-10px] left-[50%] w-3 h-3 bg-white/30 rounded-full animate-[float_6s_infinite_0.5s]" />
              <div className="absolute bottom-[-10px] left-[80%] w-1 h-1 bg-white/50 rounded-full animate-[float_3s_infinite_1s]" />
            </div>
          </div>

          {/* Inner Shadow Overlay for Volume */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.6)] z-10 pointer-events-none border border-white/5"></div>

          {/* Value Display */}
          <div className="relative z-20 text-center flex flex-col items-center drop-shadow-2xl">
            <div className="flex items-baseline justify-center">
              <span className="text-7xl font-black text-white tracking-tighter" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                {displayValue.toFixed(displayDecimals)}
              </span>
              <span className="text-2xl font-bold text-white/50 ml-1">{displayUnit}</span>
            </div>

            <div className="flex flex-col items-center mt-2">
              <span className="text-white/90 text-sm font-bold tracking-[0.2em] uppercase backdrop-blur-sm px-3 py-1 rounded-full bg-black/20 border border-white/5">
                {t.bacLevel}
              </span>
              <span className="text-white/40 text-[10px] font-mono mt-1 tracking-wider opacity-60">
                {t.unitDesc}
              </span>

              {/* Moved Peak Display Here */}
              {showPeak && (
                <div className="mt-2 flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-full border border-white/5 animate-pulse">
                  <TrendingUp size={10} className="text-red-300" />
                  <span className="text-[10px] text-red-100 font-mono">
                    {t.peak}: {displayPeak.toFixed(displayDecimals)} {t.at} {peakTimeStr}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Data Pills */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-10">
          <div className="glass-panel-3d p-4 rounded-[24px] flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
            <div className="text-blue-300 mb-2 p-2 bg-blue-500/20 rounded-full"><Clock size={16} /></div>
            <div className="text-white font-bold text-lg">{soberTimeStr || '--:--'}</div>
            <div className="text-[10px] text-blue-200/60 uppercase tracking-wider font-semibold">{t.soberAt}</div>
          </div>
          <div className="glass-panel-3d p-4 rounded-[24px] flex flex-col items-center justify-center group hover:bg-white/5 transition-colors">
            <div className="text-pink-300 mb-2 p-2 bg-pink-500/20 rounded-full"><Zap size={16} /></div>
            <div className="text-white font-bold text-lg">{Math.round(liquidHeight)}%</div>
            <div className="text-[10px] text-pink-200/60 uppercase tracking-wider font-semibold">{t.limitLoad}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
