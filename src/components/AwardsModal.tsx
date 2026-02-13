import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Trophy, Loader2, Award } from 'lucide-react';
import { AWARD_DEFINITIONS, ComputedAward } from '../constants/awards';

const MONTH_NAMES_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface AwardsModalProps {
    groupId: string;
    groupName: string;
    awards: ComputedAward[];
    loading: boolean;
    selectedMonth: { month: number; year: number };
    onFetchAwards: (groupId: string, month: number, year: number) => void;
    onClose: () => void;
    language: 'en' | 'fr';
    myUid: string;
}

export const AwardsModal: React.FC<AwardsModalProps> = ({
    groupId,
    groupName,
    awards,
    loading,
    selectedMonth,
    onFetchAwards,
    onClose,
    language,
    myUid
}) => {
    const [revealedIndex, setRevealedIndex] = useState(-1);
    const [isRevealing, setIsRevealing] = useState(false);
    const [selectedAward, setSelectedAward] = useState<ComputedAward | null>(null);

    const monthNames = language === 'fr' ? MONTH_NAMES_FR : MONTH_NAMES_EN;

    // Fetch awards on mount
    useEffect(() => {
        onFetchAwards(groupId, selectedMonth.month, selectedMonth.year);
    }, []);

    const navigateMonth = (direction: -1 | 1) => {
        let newMonth = selectedMonth.month + direction;
        let newYear = selectedMonth.year;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        if (newMonth > 11) { newMonth = 0; newYear++; }

        // Don't go to future months
        const now = new Date();
        if (newYear > now.getFullYear() || (newYear === now.getFullYear() && newMonth >= now.getMonth())) {
            return;
        }

        setRevealedIndex(-1);
        setIsRevealing(false);
        setSelectedAward(null);
        onFetchAwards(groupId, newMonth, newYear);
    };

    const handleRevealAll = () => {
        if (isRevealing || awards.length === 0) return;
        setIsRevealing(true);
        setRevealedIndex(-1);

        let i = 0;
        const interval = setInterval(() => {
            setRevealedIndex(i);
            i++;
            if (i >= awards.length) {
                clearInterval(interval);
                setIsRevealing(false);
            }
        }, 300);
    };

    const getAwardDef = (awardId: string) => {
        return AWARD_DEFINITIONS.find(a => a.id === awardId);
    };

    const canGoForward = (() => {
        const now = new Date();
        let nextMonth = selectedMonth.month + 1;
        let nextYear = selectedMonth.year;
        if (nextMonth > 11) { nextMonth = 0; nextYear++; }
        return nextYear < now.getFullYear() || (nextYear === now.getFullYear() && nextMonth < now.getMonth());
    })();

    return (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-2xl flex flex-col animate-fade-in">
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
                        {language === 'fr' ? 'Awards' : 'Awards'}
                    </h2>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">{groupName}</p>
                </div>
                <div className="w-12" /> {/* Spacer for centering */}
            </div>

            {/* Month Selector */}
            <div className="flex items-center justify-center gap-6 mb-6 px-6">
                <button
                    onClick={() => navigateMonth(-1)}
                    className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center min-w-[160px]">
                    <h3 className="text-lg font-black text-white">
                        {monthNames[selectedMonth.month]}
                    </h3>
                    <p className="text-[10px] text-white/30 font-bold">{selectedMonth.year}</p>
                </div>
                <button
                    onClick={() => navigateMonth(1)}
                    disabled={!canGoForward}
                    className="p-3 bg-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-95 disabled:opacity-20"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-40 no-scrollbar scroll-smooth">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="animate-spin text-amber-400" size={48} />
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                            {language === 'fr' ? 'Calcul des awards...' : 'Computing awards...'}
                        </p>
                    </div>
                ) : awards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
                        <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center border border-white/10">
                            <Award size={40} className="text-white/20" />
                        </div>
                        <div>
                            <p className="text-white/40 text-sm font-bold mb-2">
                                {language === 'fr' ? 'Aucun award pour ce mois' : 'No awards for this month'}
                            </p>
                            <p className="text-white/20 text-xs">
                                {language === 'fr'
                                    ? 'Les membres du groupe n\'ont pas encore assez de données.'
                                    : 'Group members don\'t have enough data yet.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Reveal Button */}
                        {revealedIndex < 0 && !isRevealing && (
                            <div className="mb-8 animate-fade-in">
                                <button
                                    onClick={handleRevealAll}
                                    className="w-full py-5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-3xl font-black text-sm uppercase tracking-[0.2em] text-white shadow-[0_0_60px_rgba(245,158,11,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <Trophy size={20} />
                                    {language === 'fr' ? 'Révéler les Awards' : 'Reveal Awards'}
                                </button>
                            </div>
                        )}

                        {/* Awards Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {awards.map((award, index) => {
                                const def = getAwardDef(award.awardId);
                                if (!def) return null;
                                const isRevealed = index <= revealedIndex;
                                const isMyAward = award.recipientUid === myUid;

                                return (
                                    <div
                                        key={award.awardId}
                                        onClick={() => isRevealed && setSelectedAward(award)}
                                        className={`relative rounded-[28px] overflow-hidden transition-all duration-500 cursor-pointer active:scale-95 ${isRevealed
                                                ? 'opacity-100 translate-y-0'
                                                : revealedIndex >= 0
                                                    ? 'opacity-20 translate-y-4 pointer-events-none'
                                                    : 'opacity-40 pointer-events-none blur-sm'
                                            } ${isMyAward && isRevealed ? 'ring-2 ring-amber-400/50' : ''}`}
                                        style={{
                                            animationDelay: `${index * 100}ms`,
                                        }}
                                    >
                                        {/* Card Background */}
                                        <div className={`absolute inset-0 ${isRevealed ? 'bg-gradient-to-br from-white/10 to-white/[0.02]' : 'bg-white/5'}`} />
                                        <div className="absolute inset-0 border border-white/10 rounded-[28px]" />

                                        {/* Shimmer effect on reveal */}
                                        {isRevealed && index === revealedIndex && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent animate-shimmer" />
                                        )}

                                        <div className="relative p-4 flex flex-col items-center text-center gap-3">
                                            {/* Award Image */}
                                            <div className={`relative w-20 h-20 transition-all duration-700 ${isRevealed ? 'scale-100' : 'scale-50'}`}>
                                                {isRevealed ? (
                                                    <img
                                                        src={def.imageUrl}
                                                        alt={def.name}
                                                        className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-float-slow"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-white/5 rounded-full flex items-center justify-center">
                                                        <span className="text-3xl">❓</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Award Name */}
                                            <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-400/90 leading-tight">
                                                {isRevealed ? (language === 'fr' ? def.name_fr : def.name) : '???'}
                                            </h4>

                                            {/* Winner Info */}
                                            {isRevealed && (
                                                <div className="flex flex-col items-center gap-1 animate-fade-in-up">
                                                    <img
                                                        src={award.recipientPhoto || 'https://via.placeholder.com/150'}
                                                        className={`w-8 h-8 rounded-full border-2 object-cover shadow-lg ${isMyAward ? 'border-amber-400' : 'border-white/20'}`}
                                                        alt={award.recipientName}
                                                    />
                                                    <span className={`text-[10px] font-black truncate max-w-full ${isMyAward ? 'text-amber-400' : 'text-white/70'}`}>
                                                        @{award.recipientName}
                                                    </span>
                                                    <span className="text-[9px] text-white/30 font-bold">
                                                        {award.value}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Award Detail Modal */}
            {selectedAward && (() => {
                const def = getAwardDef(selectedAward.awardId);
                if (!def) return null;
                const isMyAward = selectedAward.recipientUid === myUid;

                return (
                    <div
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-3xl flex items-center justify-center p-8 animate-fade-in"
                        onClick={() => setSelectedAward(null)}
                    >
                        <div
                            className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0a0a15] rounded-[40px] p-8 border border-white/10 shadow-2xl max-w-sm w-full animate-scale-in"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Close */}
                            <button
                                onClick={() => setSelectedAward(null)}
                                className="absolute top-4 right-4 p-2 text-white/30 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Glow effect */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />

                            <div className="relative flex flex-col items-center text-center gap-6">
                                {/* Award Image - Large */}
                                <div className="w-32 h-32 animate-float">
                                    <img
                                        src={def.imageUrl}
                                        alt={def.name}
                                        className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]"
                                    />
                                </div>

                                {/* Title */}
                                <div>
                                    <h3 className="text-2xl font-black text-amber-400 uppercase tracking-wider mb-2">
                                        {language === 'fr' ? def.name_fr : def.name}
                                    </h3>
                                    <p className="text-white/40 text-xs font-medium leading-relaxed">
                                        {language === 'fr' ? def.description_fr : def.description}
                                    </p>
                                </div>

                                {/* Winner */}
                                <div className={`w-full p-5 rounded-3xl border ${isMyAward ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={selectedAward.recipientPhoto || 'https://via.placeholder.com/150'}
                                            className={`w-14 h-14 rounded-full border-2 object-cover shadow-xl ${isMyAward ? 'border-amber-400' : 'border-white/20'}`}
                                            alt={selectedAward.recipientName}
                                        />
                                        <div className="flex-1 text-left">
                                            <h4 className={`font-black text-lg ${isMyAward ? 'text-amber-400' : 'text-white'}`}>
                                                @{selectedAward.recipientName}
                                                {isMyAward && (
                                                    <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-black">
                                                        {language === 'fr' ? 'VOUS' : 'YOU'}
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="text-white/40 text-sm font-bold mt-1">{selectedAward.value}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Month badge */}
                                <div className="bg-white/5 px-4 py-2 rounded-full">
                                    <span className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                                        {monthNames[selectedAward.month]} {selectedAward.year}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
