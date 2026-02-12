
import React from 'react';
import { Drink } from '../types';
import { Trash2 } from 'lucide-react';

interface DrinkListProps {
  drinks: Drink[];
  onRemove: (id: string) => void;
  language?: 'en' | 'fr';
}

export const DrinkList: React.FC<DrinkListProps> = ({ drinks, onRemove, language = 'en' }) => {
  // 1. Sort by time descending
  const sortedDrinks = [...drinks].sort((a, b) => b.timestamp - a.timestamp);

  const t = {
    history: language === 'fr' ? 'Historique' : 'History',
    noDrinks: language === 'fr' ? 'Aucune boisson enregistrée.' : 'No drinks logged yet.',
    today: language === 'fr' ? "Aujourd'hui" : "Today",
    yesterday: language === 'fr' ? "Hier" : "Yesterday",
    dayBefore: language === 'fr' ? "Avant-hier" : "Day Before Yesterday"
  };

  // 2. Helper to get normalized date key (Start of day timestamp)
  const getDayKey = (ts: number) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  // 3. Group drinks
  const groupedDrinks: { [key: number]: Drink[] } = {};
  sortedDrinks.forEach(drink => {
      const key = getDayKey(drink.timestamp);
      if (!groupedDrinks[key]) groupedDrinks[key] = [];
      groupedDrinks[key].push(drink);
  });

  // 4. Get sorted keys
  const sortedKeys = Object.keys(groupedDrinks).map(Number).sort((a, b) => b - a);

  // 5. Label Generator
  const getHeaderLabel = (dateTs: number) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const diffTime = today.getTime() - dateTs;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (diffDays === 0) return t.today;
      if (diffDays === 1) return t.yesterday;
      if (diffDays === 2) return t.dayBefore;
      
      const d = new Date(dateTs);
      return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="flex flex-col h-full p-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-6">{t.history}</h2>
      
      {sortedDrinks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white/30">
          <p>{t.noDrinks}</p>
        </div>
      ) : (
        <div className="space-y-6 overflow-y-auto no-scrollbar pb-32">
          {sortedKeys.map((dateKey) => (
             <div key={dateKey}>
                 <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3 ml-1 sticky top-0 bg-[#050505] py-2 z-10 backdrop-blur-sm">
                     {getHeaderLabel(dateKey)}
                 </h3>
                 <div className="space-y-3">
                     {groupedDrinks[dateKey].map((drink) => (
                        <div key={drink.id} className="glass-panel p-4 rounded-2xl flex items-center gap-4 transition-all hover:bg-white/15 group">
                          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-2xl border border-white/10">
                            {drink.icon || '🍺'}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{drink.name}</h3>
                            <div className="flex gap-3 text-xs text-white/40">
                              <span>{drink.volumeMl}ml</span>
                              <span>{drink.abv}% ABV</span>
                              <span>{new Date(drink.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => onRemove(drink.id)}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                     ))}
                 </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};
