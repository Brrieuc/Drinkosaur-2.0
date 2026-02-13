import React, { useState, useMemo } from 'react';
import { X, Trophy, Star, Check } from 'lucide-react';
import { WonAward } from '../types';
import { AWARD_DEFINITIONS } from '../constants/awards';

const MONTH_NAMES_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface TrophyHallProps {
    wonAwards: WonAward[];
    selectedBadges: string[];   // Up to 3 awardIds
    onUpdateBadges: (badges: string[]) => void;
    onClose: () => void;
    language: 'en' | 'fr';
}

/** Group awards by awardId, stacking duplicates */
interface StackedAward {
    awardId: string;
    count: number;
    instances: WonAward[];  // All instances of this award
}

export const TrophyHall: React.FC<TrophyHallProps> = ({
    wonAwards,
    selectedBadges,
    onUpdateBadges,
    onClose,
    language
}) => {
    const [selectedDetail, setSelectedDetail] = useState<WonAward | null>(null);
    const [expandedStack, setExpandedStack] = useState<string | null>(null);
    const [badges, setBadges] = useState<string[]>(selectedBadges);

    const isFrench = language === 'fr';
    const monthNames = isFrench ? MONTH_NAMES_FR : MONTH_NAMES_EN;

    const t = {
        title: isFrench ? 'Hall des Trophées' : 'Trophy Hall',
        subtitle: isFrench ? 'Vos awards remportées' : 'Your earned awards',
        empty: isFrench ? 'Aucun trophée pour le moment' : 'No trophies yet',
        emptyDesc: isFrench ? 'Participez aux awards dans vos groupes pour gagner des trophées !' : 'Participate in group awards to earn trophies!',
        badges: isFrench ? 'Badges Affichés' : 'Displayed Badges',
        badgesDesc: isFrench ? 'Sélectionnez jusqu\'à 3 awards comme badges visibles par vos amis' : 'Select up to 3 awards as badges visible to your friends',
        save: isFrench ? 'Enregistrer' : 'Save',
        group: isFrench ? 'Groupe' : 'Group',
        stat: isFrench ? 'Stat' : 'Stat',
        wonIn: isFrench ? 'Gagné dans' : 'Won in',
        times: isFrench ? 'fois' : 'times',
        tapToSelect: isFrench ? 'Maintenez pour sélectionner comme badge' : 'Long press to select as badge',
        selectedAsBadge: isFrench ? 'Sélectionné comme badge' : 'Selected as badge',
    };

    // Stack awards by awardId
    const stacked = useMemo<StackedAward[]>(() => {
        const map = new Map<string, WonAward[]>();
        for (const award of wonAwards) {
            const existing = map.get(award.awardId) || [];
            existing.push(award);
            map.set(award.awardId, existing);
        }
        return Array.from(map.entries())
            .map(([awardId, instances]) => ({
                awardId,
                count: instances.length,
                instances: instances.sort((a, b) => b.wonAt - a.wonAt),
            }))
            .sort((a, b) => b.count - a.count); // Most won first
    }, [wonAwards]);

    const getAwardDef = (awardId: string) => AWARD_DEFINITIONS.find(a => a.id === awardId);

    const toggleBadge = (awardId: string) => {
        let newBadges: string[];
        if (badges.includes(awardId)) {
            newBadges = badges.filter(b => b !== awardId);
        } else if (badges.length < 3) {
            newBadges = [...badges, awardId];
        } else {
            // Replace the oldest badge
            newBadges = [...badges.slice(1), awardId];
        }
        setBadges(newBadges);
    };

    const handleSaveBadges = () => {
        onUpdateBadges(badges);
    };

    const badgesChanged = JSON.stringify(badges) !== JSON.stringify(selectedBadges);

    return (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-3xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)]">
                <button
                    onClick={onClose}
                    className="p-3 bg-white/5 rounded-2xl text-white/60 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <X size={22} />
                </button>
                <div className="text-center">
                    <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2 justify-center">
                        <Trophy size={20} className="text-amber-400" />
                        {t.title}
                    </h2>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">{t.subtitle}</p>
                </div>
                <div className="w-12" />
            </div>

            {/* Badge Selection Bar */}
            {stacked.length > 0 && (
                <div className="px-6 mb-4">
                    <div className="glass-panel-3d p-4 rounded-3xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Star size={14} className="text-amber-400" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{t.badges}</span>
                            </div>
                            {badgesChanged && (
                                <button
                                    onClick={handleSaveBadges}
                                    className="px-4 py-1.5 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all animate-fade-in"
                                >
                                    {t.save}
                                </button>
                            )}
                        </div>
                        <p className="text-[9px] text-white/20 font-medium mb-3">{t.badgesDesc}</p>
                        <div className="flex gap-3 justify-center">
                            {[0, 1, 2].map(i => {
                                const badgeId = badges[i];
                                const def = badgeId ? getAwardDef(badgeId) : null;
                                return (
                                    <div
                                        key={i}
                                        className={`w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all ${def
                                                ? 'border-amber-500/50 bg-amber-500/10'
                                                : 'border-white/10 bg-white/[0.02]'
                                            }`}
                                    >
                                        {def ? (
                                            <div className="relative w-full h-full p-2">
                                                <img
                                                    src={def.imageUrl}
                                                    alt={def.name}
                                                    className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                                                />
                                                <button
                                                    onClick={() => toggleBadge(badgeId!)}
                                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-white/10 text-xs font-black">+</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-40 no-scrollbar scroll-smooth">
                {stacked.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center border border-white/10">
                            <Trophy size={40} className="text-white/20" />
                        </div>
                        <div>
                            <p className="text-white/40 text-sm font-bold mb-2">{t.empty}</p>
                            <p className="text-white/20 text-xs max-w-xs">{t.emptyDesc}</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        {stacked.map((stack) => {
                            const def = getAwardDef(stack.awardId);
                            if (!def) return null;
                            const isBadge = badges.includes(stack.awardId);

                            return (
                                <div key={stack.awardId} className="relative">
                                    <button
                                        onClick={() => {
                                            if (stack.count === 1) {
                                                setSelectedDetail(stack.instances[0]);
                                            } else {
                                                setExpandedStack(expandedStack === stack.awardId ? null : stack.awardId);
                                            }
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            toggleBadge(stack.awardId);
                                        }}
                                        className={`w-full aspect-square rounded-[24px] overflow-hidden relative group active:scale-95 transition-all ${isBadge
                                                ? 'ring-2 ring-amber-400 bg-gradient-to-br from-amber-500/15 to-orange-500/10'
                                                : 'bg-gradient-to-br from-white/10 to-white/[0.02]'
                                            }`}
                                    >
                                        {/* Border */}
                                        <div className="absolute inset-0 border border-white/10 rounded-[24px] pointer-events-none" />

                                        {/* Badge indicator */}
                                        {isBadge && (
                                            <div className="absolute top-2 left-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center z-20 shadow-lg">
                                                <Check size={10} className="text-black" strokeWidth={3} />
                                            </div>
                                        )}

                                        {/* Multi-count badge */}
                                        {stack.count > 1 && (
                                            <div className="absolute bottom-2 right-2 z-20 bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[11px] font-black px-2 py-0.5 rounded-lg shadow-lg border border-amber-400/50 min-w-[28px] text-center">
                                                {stack.count}x
                                            </div>
                                        )}

                                        {/* Stacking visual: slightly offset shadows behind for multi-wins */}
                                        {stack.count > 1 && (
                                            <>
                                                <div className="absolute inset-2 bg-white/5 rounded-2xl -rotate-3 scale-95 pointer-events-none" />
                                                {stack.count > 2 && (
                                                    <div className="absolute inset-2 bg-white/3 rounded-2xl rotate-3 scale-90 pointer-events-none" />
                                                )}
                                            </>
                                        )}

                                        {/* Award Image */}
                                        <div className="relative w-full h-full p-4 flex flex-col items-center justify-center gap-1 z-10">
                                            <img
                                                src={def.imageUrl}
                                                alt={def.name}
                                                className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                            />
                                            <span className="text-[8px] font-black text-amber-400/80 uppercase tracking-wider truncate max-w-full leading-tight text-center">
                                                {isFrench ? def.name_fr : def.name}
                                            </span>
                                        </div>
                                    </button>

                                    {/* Tap to add as badge */}
                                    <button
                                        onClick={() => toggleBadge(stack.awardId)}
                                        className="w-full mt-1 text-center"
                                    >
                                        <span className={`text-[8px] font-bold uppercase tracking-wider ${isBadge ? 'text-amber-400/60' : 'text-white/15'}`}>
                                            {isBadge ? '★' : '☆'}
                                        </span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Expanded Stack Modal — shows all instances of a stacked award */}
            {expandedStack && (() => {
                const stack = stacked.find(s => s.awardId === expandedStack);
                if (!stack) return null;
                const def = getAwardDef(stack.awardId);
                if (!def) return null;

                return (
                    <div
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-3xl flex items-end justify-center animate-fade-in"
                        onClick={() => setExpandedStack(null)}
                    >
                        <div
                            className="w-full max-w-lg bg-gradient-to-b from-[#1a1a2e] to-[#0d0d1a] rounded-t-[40px] border-t border-white/10 shadow-2xl overflow-hidden animate-slide-up"
                            onClick={(e) => e.stopPropagation()}
                            style={{ maxHeight: '70vh' }}
                        >
                            {/* Header */}
                            <div className="p-6 flex items-center gap-4 border-b border-white/5">
                                <img src={def.imageUrl} alt={def.name} className="w-16 h-16 object-contain drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]" />
                                <div>
                                    <h3 className="text-lg font-black text-amber-400 uppercase tracking-wider">
                                        {isFrench ? def.name_fr : def.name}
                                    </h3>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">
                                        {isFrench ? `Remporté ${stack.count} ${t.times}` : `Won ${stack.count} ${t.times}`}
                                    </p>
                                </div>
                            </div>

                            {/* Instances */}
                            <div className="p-6 overflow-y-auto no-scrollbar space-y-3" style={{ maxHeight: 'calc(70vh - 120px)' }}>
                                {stack.instances.map((instance, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => { setSelectedDetail(instance); setExpandedStack(null); }}
                                        className="w-full glass-panel-3d p-4 rounded-3xl flex items-center gap-4 hover:bg-white/5 transition-all active:scale-[0.98] text-left"
                                    >
                                        <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20 text-amber-400 font-black text-sm shrink-0">
                                            #{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{instance.groupName}</p>
                                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
                                                {monthNames[instance.month]} {instance.year}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs text-amber-400/80 font-bold">{instance.value}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Detail Modal — shows a single award instance */}
            {selectedDetail && (() => {
                const def = getAwardDef(selectedDetail.awardId);
                if (!def) return null;

                return (
                    <div
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-8 animate-fade-in"
                        onClick={() => setSelectedDetail(null)}
                    >
                        <div
                            className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0a0a15] rounded-[40px] p-8 border border-white/10 shadow-2xl max-w-sm w-full animate-scale-in"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close */}
                            <button
                                onClick={() => setSelectedDetail(null)}
                                className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />

                            <div className="relative flex flex-col items-center text-center gap-5">
                                {/* Award Image */}
                                <div className="w-28 h-28 animate-float-slow">
                                    <img
                                        src={def.imageUrl}
                                        alt={def.name}
                                        className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]"
                                    />
                                </div>

                                {/* Title */}
                                <div>
                                    <h3 className="text-2xl font-black text-amber-400 uppercase tracking-wider mb-2">
                                        {isFrench ? def.name_fr : def.name}
                                    </h3>
                                    <p className="text-white/40 text-xs font-medium leading-relaxed">
                                        {isFrench ? def.description_fr : def.description}
                                    </p>
                                </div>

                                {/* Stat */}
                                <div className="w-full p-5 rounded-3xl bg-amber-500/10 border border-amber-500/20">
                                    <div className="flex items-center gap-3 justify-center">
                                        <div className="text-center">
                                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-1">{t.stat}</p>
                                            <p className="text-xl font-black text-amber-400">{selectedDetail.value}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Group & Date */}
                                <div className="w-full space-y-2">
                                    <div className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-2xl">
                                        <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">{t.group}</span>
                                        <span className="text-sm font-bold text-white">{selectedDetail.groupName}</span>
                                    </div>
                                    <div className="bg-white/5 px-4 py-2 rounded-full text-center">
                                        <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                                            {monthNames[selectedDetail.month]} {selectedDetail.year}
                                        </span>
                                    </div>
                                </div>

                                {/* Toggle Badge Button */}
                                <button
                                    onClick={() => toggleBadge(selectedDetail.awardId)}
                                    className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${badges.includes(selectedDetail.awardId)
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : 'bg-white/5 text-white/40 border border-white/10 hover:border-amber-500/30 hover:text-amber-400'
                                        }`}
                                >
                                    {badges.includes(selectedDetail.awardId) ? '★ ' + t.selectedAsBadge : '☆ ' + t.tapToSelect}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
