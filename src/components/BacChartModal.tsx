
import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid, Label } from 'recharts';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Drink, UserProfile } from '../types';
import { generateBacTrend } from '../services/bacService';

interface BacChartModalProps {
  drinks: Drink[];
  user: UserProfile;
  onClose: () => void;
}

export const BacChartModal: React.FC<BacChartModalProps> = ({ drinks, user, onClose }) => {
  const [centerTime, setCenterTime] = useState(Date.now());
  const isFrench = user.language === 'fr';

  // Generate data based on center time
  // User asked for 14h window around center (7h before, 7h after) which matches the update in bacService
  const data = useMemo(() => {
    const rawData = generateBacTrend(drinks, user, centerTime);
    return rawData.map(p => ({
      time: p.time,
      displayTime: new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: isFrench ? parseFloat((p.bac * 10).toFixed(2)) : parseFloat(p.bac.toFixed(3)),
      isFuture: p.time > Date.now()
    }));
  }, [drinks, user, centerTime, isFrench]);

  const t = {
    title: isFrench ? "Évolution" : "Trend",
    past: isFrench ? "←" : "←",
    future: isFrench ? "→" : "→",
    now: isFrench ? "Maintenant" : "Now",
    limit: isFrench ? "Limite (0.5)" : "Limit (0.05%)",
    unit: isFrench ? "g/L" : "%"
  };

  const limitValue = isFrench ? 0.5 : 0.05;
  const now = Date.now();

  // Find Peak and Current
  const currentVal = data.find(d => d.time >= now)?.value || 0;
  const peakVal = Math.max(...data.map(d => d.value));
  const maxValue = Math.max(limitValue * 1.5, peakVal * 1.2);

  // Filter Y Axis ticks to avoid clutter (0, Current, Peak, Limit)
  const yTicks = useMemo(() => {
    const ticks = [0, limitValue, currentVal, peakVal];
    // Dedup and sort
    return [...new Set(ticks.map(v => parseFloat(v.toFixed(2))))].sort((a, b) => a - b);
  }, [limitValue, currentVal, peakVal]);

  // X Axis Ticks (Start, Now, End)
  const xTicks = useMemo(() => {
    if (data.length === 0) return [];
    const start = data[0].time;
    const end = data[data.length - 1].time;
    return [start, now, end];
  }, [data, now]);

  const gradientOffset = useMemo(() => {
    const minTime = data[0]?.time || 0;
    const maxTime = data[data.length - 1]?.time || 1;
    if (maxTime <= minTime) return 0;
    return Math.max(0, Math.min(1, (now - minTime) / (maxTime - minTime)));
  }, [data, now]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 backdrop-blur-md border border-white/20 p-3 rounded-xl shadow-2xl z-50">
          <p className="text-white/70 text-xs mb-1 font-mono">{payload[0].payload.displayTime}</p>
          <p className="text-white font-bold text-xl">
            {payload[0].value} <span className="text-xs font-normal opacity-50 text-fuchsia-300">{t.unit}</span>
          </p>
          {payload[0].payload.isFuture && (
            <div className="mt-1 inline-block">
              <span className="text-[10px] uppercase tracking-wide text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded font-bold border border-indigo-500/30">Estimated</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Body scroll lock (nested)
  useEffect(() => {
    // Already locked by parent, but let's be safe
    if (document.body && document.body.classList) {
      document.body.classList.add('modal-open');
    }
    return () => {
      // Don't remove if parent modal is still open
      const hasOtherModals = document.querySelectorAll('.modal-overlay').length > 1;
      if (!hasOtherModals) {
        document.body.classList.remove('modal-open');
      }
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl animate-fade-in pointer-events-auto">
      <div className="w-full max-w-2xl bg-[#0a0a0a] rounded-[40px] border border-white/10 shadow-2xl relative animate-scale-up max-h-[90vh] flex flex-col modal-container pointer-events-auto overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex flex-col min-w-0">
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white truncate">{t.title}</h3>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none mt-1">Real-time BAC Forecast</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 rounded-2xl border border-white/5">
            <button onClick={() => setCenterTime(prev => prev - (4 * 60 * 60 * 1000))} className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setCenterTime(Date.now())} className="text-[10px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 px-3 py-1 hover:bg-blue-500/10 rounded-lg transition-all">
              {t.now}
            </button>
            <button onClick={() => setCenterTime(prev => prev + (4 * 60 * 60 * 1000))} className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all">
              <ChevronRight size={16} />
            </button>
          </div>

          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-white/40 hover:bg-white/10 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Chart Container */}
        <div className="w-full h-[350px] relative bg-gradient-to-b from-[#0f0f13] to-black">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d946ef" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset={gradientOffset} stopColor="#d946ef" stopOpacity={1} />
                  <stop offset={gradientOffset} stopColor="#8b5cf6" stopOpacity={0.5} />
                  <stop offset="1" stopColor="#8b5cf6" stopOpacity={0.2} />
                </linearGradient>
              </defs>

              {/* Less visible grid */}
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />

              <XAxis
                dataKey="time"
                type="number"
                domain={['dataMin', 'dataMax']}
                ticks={xTicks}
                tickFormatter={(unix) => new Date(unix).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                stroke="rgba(255,255,255,0.1)"
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'Inter' }}
                interval={0}
                dy={10}
              />

              <YAxis
                hide={false}
                domain={[0, maxValue]}
                stroke="rgba(255,255,255,0.1)"
                ticks={yTicks}
                tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'Inter' }}
                width={40}
                tickFormatter={(val) => val.toFixed(2)}
              >
                <Label
                  value={t.unit}
                  position="insideTopLeft"
                  offset={10}
                  fill="rgba(255,255,255,0.2)"
                  fontSize={10}
                  style={{ textTransform: 'uppercase' }}
                />
              </YAxis>

              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1 }} />

              {/* Safe Limit Line */}
              <ReferenceLine y={limitValue} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} />

              {/* Now Line */}
              <ReferenceLine x={now} stroke="#3b82f6" strokeWidth={1} strokeDasharray="2 2" strokeOpacity={0.5} />

              <Area
                type="monotone"
                dataKey="value"
                stroke="url(#strokeGradient)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
                animationDuration={1000}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Info Footer */}
        <div className="p-6 bg-white/5 border-t border-white/5 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-500 flex-shrink-0">
              <AlertTriangle size={18} />
            </div>
            <p className="text-xs text-white/50 leading-relaxed pt-1">
              {isFrench
                ? "Cette courbe est une estimation en g/L basée sur la formule de Widmark. Elle ne prend pas en compte la nourriture ou la fatigue. Ne l'utilisez jamais pour valider votre aptitude à la conduite."
                : "This chart is an estimation based on the Widmark formula. It does not account for food or fatigue. Never use this to validate your ability to drive."}
            </p>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
