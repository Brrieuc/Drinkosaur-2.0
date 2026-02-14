
import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Drink } from '../types';
import {
    BEER_LIBRARY, SPIRIT_LIBRARY, COCKTAIL_LIBRARY, GENERIC_BEERS, GENERIC_WINES,
    BEER_PRESETS, SHOT_SIZES, GLASS_SHAPES, MIXERS,
    DrinkReference, MixerReference
} from '../constants';
import { Search, ChevronLeft, X, Zap, Clock, Check } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface AddDrinkProps {
    onAdd: (drink: Drink) => void;
    onClose: () => void;
    language?: 'en' | 'fr';
}

type DrinkType = 'beer' | 'wine' | 'cocktail' | 'shot';
type Step = 'type' | 'brand' | 'glass' | 'pour' | 'confirm' | 'timestamp';

const GlassView = React.memo(({ glassId, alcoholVol, mixerVol = 0, color1, color2 = 'transparent', interactive = false, onInteract = () => { } }: any) => {
    const glass = GLASS_SHAPES.find(g => g.id === glassId) || GLASS_SHAPES[0];
    const containerRef = useRef<HTMLDivElement>(null);

    // Map physical volume % to visual height % (Accounting for glass shape)
    const getVisualHeightPercent = useCallback((volPercent: number) => {
        const p = Math.max(0, Math.min(1, volPercent / 100));
        let h = p;
        if (glass.fillType === 'cone') h = Math.pow(p, 1 / 3); // V = (1/3)πr²h -> h ~ V^(1/3)
        if (glass.fillType === 'bowl') h = Math.pow(p, 1 / 2); // Paraboloid approx -> h ~ V^(1/2)
        return h * 100;
    }, [glass]);

    const handleInteraction = (e: any) => {
        if (!interactive || !containerRef.current) return;

        // Prevent scrolling on touch
        if (e.cancelable) e.preventDefault();

        const rect = containerRef.current.getBoundingClientRect();
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Interaction area is the glass region inside padding
        const padding = 20;
        const usableHeight = rect.height - (padding * 2);
        const relativeY = (rect.bottom - padding) - clientY;

        // Visual height ratio (0 to 1)
        const visualRatio = Math.max(0, Math.min(1, relativeY / usableHeight));

        // Convert visual height back to physical volume ratio
        let volRatio = visualRatio;
        if (glass.fillType === 'cone') volRatio = Math.pow(visualRatio, 3);
        if (glass.fillType === 'bowl') volRatio = Math.pow(visualRatio, 2);

        onInteract(volRatio * glass.capacity);
    };

    const totalVol = alcoholVol + mixerVol;
    const alcVisualH = getVisualHeightPercent((alcoholVol / glass.capacity) * 100);
    const totalVisualH = getVisualHeightPercent((totalVol / glass.capacity) * 100);

    // Map viewBox coordinates
    const drawH = (glass.liquidBottom - glass.liquidTop);
    const alcOffset = (alcVisualH / 100) * drawH;
    const totalOffset = (totalVisualH / 100) * drawH;

    return (
        <div
            ref={containerRef}
            className="relative w-64 h-80 mx-auto cursor-ns-resize touch-none select-none flex items-center justify-center p-5"
            onMouseDown={handleInteraction}
            onMouseMove={(e) => e.buttons === 1 && handleInteraction(e)}
            onTouchStart={handleInteraction}
            onTouchMove={handleInteraction}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-2xl">
                <defs>
                    <clipPath id={`glass-clip-${glassId}`}>
                        <path d={glass.mask || glass.path} />
                    </clipPath>
                </defs>

                {/* Glass Body Background */}
                <path d={glass.path} fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

                {/* Liquid Layer 1: Alcohol */}
                <rect
                    x="0"
                    y={glass.liquidBottom - alcOffset}
                    width="100"
                    height={alcOffset}
                    fill={color1}
                    clipPath={`url(#glass-clip-${glassId})`}
                    opacity={0.8}
                />

                {/* Liquid Layer 2: Mixer */}
                <rect
                    x="0"
                    y={glass.liquidBottom - totalOffset}
                    width="100"
                    height={totalOffset - alcOffset}
                    fill={color2}
                    clipPath={`url(#glass-clip-${glassId})`}
                    opacity={0.8}
                />

                {/* Glass Highlights & Reflections */}
                <path d={glass.path} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                <rect x="30" y="10" width="2" height="40" fill="white" opacity="0.1" rx="1" />
                <rect x="70" y="15" width="1" height="20" fill="white" opacity="0.05" rx="0.5" />
            </svg>
        </div>
    );
});

export const AddDrink: React.FC<AddDrinkProps> = ({ onAdd, onClose, language = 'en' }) => {
    // -- State --
    const [step, setStep] = useState<Step>('type');
    const [drinkType, setDrinkType] = useState<DrinkType | null>(null);

    // Selection States
    const [selectedItem, setSelectedItem] = useState<DrinkReference | null>(null);
    const [selectedMixer, setSelectedMixer] = useState<MixerReference | null>(null);
    const [selectedGlassId, setSelectedGlassId] = useState<string>('');

    // Volume States
    const [alcoholVolume, setAlcoholVolume] = useState<number>(0);
    const [mixerVolume, setMixerVolume] = useState<number>(0);


    // Consumption Style & Time
    const [isChug, setIsChug] = useState(false);
    const [customTimestamp, setCustomTimestamp] = useState<number | null>(null);

    // Manual Date Input State
    const [manualDateMode, setManualDateMode] = useState<'today' | 'yesterday'>('today');
    const [manualTime, setManualTime] = useState<string>('');

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    const handleVolumeInteract = useCallback((val: number) => {
        if (drinkType === 'cocktail' && selectedMixer) {
            setMixerVolume(Math.max(0, val - alcoholVolume));
        } else {
            setAlcoholVolume(val);
        }
    }, [drinkType, selectedMixer, alcoholVolume]);

    // Translations
    const t = {
        chooseType: language === 'fr' ? 'Type de Boisson' : 'Choose Type',
        selectWine: language === 'fr' ? 'Choisir le Vin' : 'Select Wine',
        selectBrand: language === 'fr' ? 'Choisir la Marque' : 'Select Brand',
        selectGlass: language === 'fr' ? 'Choisir le Verre' : 'Select Glass',
        adjustDose: language === 'fr' ? 'Ajuster la Dose' : 'Adjust Dose',
        when: language === 'fr' ? 'Quand ?' : 'When?',
        now: language === 'fr' ? 'Maintenant' : 'Now',
        minsAgo: (m: number) => language === 'fr' ? `il y a ${m} min` : `${m}m ago`,
        hourAgo: language === 'fr' ? 'il y a 1h' : '1h ago',
        customTime: language === 'fr' ? 'Heure précise' : 'Specific Time',
        beer: language === 'fr' ? 'Bière' : 'Beer',
        wine: language === 'fr' ? 'Vin' : 'Wine',
        mix: language === 'fr' ? 'Cocktail' : 'Mix',
        shot: language === 'fr' ? 'Shot' : 'Shot',
        commonTypes: language === 'fr' ? 'Types Communs' : 'Common Types',
        library: language === 'fr' ? 'Bibliothèque' : 'Library',
        search: language === 'fr' ? 'Rechercher...' : 'Search...',
        custom: language === 'fr' ? 'Autre' : 'Custom',
        alcohol: language === 'fr' ? 'Alcool' : 'Alcohol',
        mixer: language === 'fr' ? 'Diluant' : 'Mixer',
        dragMixer: language === 'fr' ? 'Glisser pour diluer' : 'Drag to add mixer',
        dragAdjust: language === 'fr' ? 'Glisser pour ajuster' : 'Drag liquid to adjust',
        addMixer: language === 'fr' ? 'Ajouter Diluant ?' : 'Add Mixer?',
        skipNeat: language === 'fr' ? 'Pur / Passer' : 'Skip / Neat',
        logDrink: language === 'fr' ? 'Ajouter' : 'Log Drink',
        chug: language === 'fr' ? 'Cul-sec / Shot' : 'Chug / Shot',
        today: language === 'fr' ? "Aujourd'hui" : "Today",
        yesterday: language === 'fr' ? "Hier" : "Yesterday",
        confirmCustom: language === 'fr' ? "Confirmer l'heure" : "Confirm Time"
    };

    // -- Helpers --
    // const currentGlass = useMemo(() => GLASS_SHAPES.find(g => g.id === selectedGlassId) || GLASS_SHAPES[0], [selectedGlassId]);

    const filteredLibrary = useMemo(() => {
        let lib: DrinkReference[] = [];
        if (drinkType === 'beer') lib = BEER_LIBRARY;
        else if (drinkType === 'wine') return []; // Generic wines handling handled differently
        else if (drinkType === 'cocktail') lib = [...COCKTAIL_LIBRARY, ...SPIRIT_LIBRARY];
        else lib = SPIRIT_LIBRARY;

        if (!searchTerm) return lib;
        return lib.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [drinkType, searchTerm]);

    // -- Handlers --

    const handleTypeSelect = (type: DrinkType) => {
        setDrinkType(type);
        if (type === 'wine') {
            setStep('brand'); // Go to generic wine selection
        } else {
            setStep('brand');
        }
        // Reset chug state default
        if (type === 'shot') setIsChug(true);
        else setIsChug(false);
    };

    const handleBrandSelect = (item: DrinkReference) => {
        setSelectedItem(item);
        setSearchTerm('');

        if (drinkType === 'beer') {
            setStep('pour'); // Beer goes straight to presets
        } else if (drinkType === 'shot') {
            setStep('pour'); // Shot goes to presets
        } else {
            setStep('glass'); // Wine & Cocktail go to glass select
        }
    };

    const handleGlassSelect = (id: string) => {
        setSelectedGlassId(id);
        setStep('pour');
        // Default start volumes
        if (drinkType === 'wine') setAlcoholVolume(125); // Std glass
        if (drinkType === 'cocktail') setAlcoholVolume(selectedItem?.defaultVolume || 50); // Use default or Std shot
    };

    const finalizeDrink = (volumeOverride?: number) => {
        if (!selectedItem) return;

        let finalName = (language === 'fr' && selectedItem.name_fr) ? selectedItem.name_fr : selectedItem.name;
        let finalVol = volumeOverride !== undefined ? volumeOverride : alcoholVolume;

        if (finalVol <= 0) return;

        let finalAbv = selectedItem.abv;
        let icon = '🍺';
        let type: Drink['type'] = selectedItem.type;

        if (drinkType === 'wine') {
            icon = '🍷';
            type = 'wine';
        } else if (drinkType === 'cocktail') {
            icon = '🍹';
            type = 'cocktail';
            if (selectedMixer) {
                finalName = `${finalName} & ${selectedMixer.name}`;
                const totalVol = finalVol + mixerVolume;
                const pureAlcohol = finalVol * (selectedItem.abv / 100);
                finalAbv = totalVol > 0 ? (pureAlcohol / totalVol) * 100 : selectedItem.abv;
                finalVol = totalVol;
            }
        } else if (drinkType === 'shot') {
            icon = '🥃';
            type = 'spirit';
        }

        onAdd({
            id: uuidv4(),
            name: finalName,
            volumeMl: Math.round(finalVol),
            abv: parseFloat(finalAbv.toFixed(1)),
            timestamp: customTimestamp || Date.now(),
            icon,
            type,
            color: selectedItem.color,
            isChug: isChug || drinkType === 'shot'
        });
        onClose();
    };

    const handleTimeSelect = (offsetMinutes: number) => {
        if (offsetMinutes === 0) setCustomTimestamp(null);
        else setCustomTimestamp(Date.now() - (offsetMinutes * 60 * 1000));
        setStep('type');
    };

    const confirmManualTime = () => {
        if (!manualTime) return;
        const [hours, minutes] = manualTime.split(':').map(Number);
        const date = new Date();
        if (manualDateMode === 'yesterday') {
            date.setDate(date.getDate() - 1);
        }
        date.setHours(hours, minutes, 0, 0);
        setCustomTimestamp(date.getTime());
        setStep('type');
    };




    return (
        <div className="flex flex-col h-full bg-[#050508] text-white animate-fade-in overflow-hidden relative">

            {/* Top Nav */}
            <div className="flex items-center justify-between px-6 py-4 z-50 flex-shrink-0">
                <div className="flex items-center gap-2">
                    {step !== 'type' && step !== 'timestamp' ? (
                        <button onClick={() => setStep('type')} className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/70">
                            <ChevronLeft />
                        </button>
                    ) : <div className="w-10" />}
                </div>

                <h2 className="text-lg font-bold uppercase tracking-widest text-white/80">
                    {step === 'timestamp' && t.when}
                    {step === 'type' && t.chooseType}
                    {step === 'brand' && t.selectBrand}
                    {step === 'glass' && t.selectGlass}
                    {step === 'pour' && t.adjustDose}
                </h2>

                <div className="flex items-center gap-2 -mr-2">
                    {step === 'type' && (
                        <button
                            onClick={() => setStep('timestamp')}
                            className={`p-3 rounded-2xl transition-all active:scale-95 ${customTimestamp ? 'bg-blue-500 text-white shadow-lg shadow-blue-900/40' : 'bg-white/5 hover:bg-white/10 text-white/70'}`}
                        >
                            <Clock size={24} />
                        </button>
                    )}
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-white/70">
                        <X />
                    </button>
                </div>
            </div>

            {customTimestamp && step !== 'timestamp' && (
                <div className="bg-blue-600/20 border-y border-blue-500/30 px-6 py-2 flex items-center justify-center gap-2 text-blue-200 text-sm animate-fade-in">
                    <Clock size={14} />
                    <span>Retroactive: {new Date(customTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            )}

            {/* --- TIMESTAMP STEP --- */}
            {step === 'timestamp' && (
                <div className="flex-1 p-6 flex flex-col gap-4 animate-slide-up pb-32 overflow-y-auto min-h-0 no-scrollbar items-center justify-center">
                    <button onClick={() => handleTimeSelect(0)} className="w-full max-w-sm p-6 rounded-[24px] bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-between hover:scale-105 transition-all">
                        <div className="flex items-center gap-4">
                            <Clock size={24} className="text-emerald-300" />
                            <span className="text-xl font-bold text-emerald-100">{t.now}</span>
                        </div>
                    </button>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        {[15, 30, 45, 60].map(mins => (
                            <button key={mins} onClick={() => handleTimeSelect(mins)} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                <span className="font-bold text-lg">{t.minsAgo(mins)}</span>
                            </button>
                        ))}
                    </div>

                    <div className="w-full max-w-sm mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                        <label className="text-sm text-white/50 mb-4 block uppercase tracking-wider font-bold text-center">{t.customTime}</label>

                        {/* SWAPPED BUTTONS: YESTERDAY LEFT, TODAY RIGHT */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setManualDateMode('yesterday')}
                                className={`flex-1 py-3 rounded-lg font-bold transition-all ${manualDateMode === 'yesterday' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-white/50'}`}
                            >
                                {t.yesterday}
                            </button>
                            <button
                                onClick={() => setManualDateMode('today')}
                                className={`flex-1 py-3 rounded-lg font-bold transition-all ${manualDateMode === 'today' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/10 text-white/50'}`}
                            >
                                {t.today}
                            </button>
                        </div>

                        <input
                            type="time"
                            value={manualTime}
                            onChange={(e) => setManualTime(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg p-4 text-white text-3xl font-mono text-center focus:border-blue-500 outline-none mb-4"
                        />

                        <button
                            onClick={confirmManualTime}
                            disabled={!manualTime}
                            className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 text-white/80"
                        >
                            {t.confirmCustom}
                        </button>
                    </div>
                </div>
            )}

            {/* --- TYPE STEP --- */}
            {step === 'type' && (
                <div className="flex-1 p-6 grid grid-cols-2 gap-4 animate-slide-up pb-32 overflow-y-auto min-h-0 no-scrollbar content-start">
                    <button onClick={() => handleTypeSelect('beer')} className="group relative rounded-[32px] overflow-hidden bg-gradient-to-br from-amber-500/20 to-orange-900/20 border border-amber-500/30 flex flex-col items-center justify-center gap-4 hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(245,158,11,0.1)] aspect-square">
                        <div className="text-6xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform group-hover:-rotate-12 transition-transform">🍺</div>
                        <span className="text-xl font-bold text-amber-100">{t.beer}</span>
                    </button>
                    <button onClick={() => handleTypeSelect('wine')} className="group relative rounded-[32px] overflow-hidden bg-gradient-to-br from-rose-500/20 to-pink-900/20 border border-rose-500/30 flex flex-col items-center justify-center gap-4 hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(244,63,94,0.1)] aspect-square">
                        <div className="text-6xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform group-hover:rotate-12 transition-transform">🍷</div>
                        <span className="text-xl font-bold text-rose-100">{t.wine}</span>
                    </button>
                    <button onClick={() => handleTypeSelect('cocktail')} className="group relative rounded-[32px] overflow-hidden bg-gradient-to-br from-blue-500/20 to-indigo-900/20 border border-blue-500/30 flex flex-col items-center justify-center gap-4 hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(59,130,246,0.1)] aspect-square">
                        <div className="text-6xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform group-hover:-rotate-12 transition-transform">🍸</div>
                        <span className="text-xl font-bold text-blue-100">{t.mix}</span>
                    </button>
                    <button onClick={() => handleTypeSelect('shot')} className="group relative rounded-[32px] overflow-hidden bg-gradient-to-br from-emerald-500/20 to-green-900/20 border border-emerald-500/30 flex flex-col items-center justify-center gap-4 hover:scale-[1.02] transition-transform shadow-[0_0_30px_rgba(16,185,129,0.1)] aspect-square">
                        <div className="text-6xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transform group-hover:rotate-12 transition-transform">🥃</div>
                        <span className="text-xl font-bold text-emerald-100">{t.shot}</span>
                    </button>
                </div>
            )}

            {/* --- BRAND STEP --- */}
            {step === 'brand' && (
                <div className="flex-1 flex flex-col p-6 animate-slide-up min-h-0">
                    {drinkType === 'wine' ? (
                        <div className="grid grid-cols-1 gap-4 overflow-y-auto no-scrollbar pb-32 min-h-0">
                            {GENERIC_WINES.map((wine, i) => (
                                <button key={i} onClick={() => handleBrandSelect({ ...wine, type: 'wine' } as any)} className="p-6 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition-colors flex-shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full shadow-[0_0_15px_currentColor]" style={{ color: wine.color, backgroundColor: wine.color }} />
                                        <span className="text-xl font-bold">{(language === 'fr' && wine.name_fr) ? wine.name_fr : wine.name}</span>
                                    </div>
                                    <span className="text-white/40 font-mono">{wine.abv}%</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="relative mb-6 flex-shrink-0">
                                <Search className="absolute left-4 top-4 text-white/30" size={20} />
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t.search} className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:bg-white/10 transition-all text-lg" autoFocus />
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-32 min-h-0">
                                {drinkType === 'beer' && !searchTerm && (
                                    <div className="mb-6 flex-shrink-0">
                                        <div className="text-xs font-bold text-white/30 mb-2 uppercase tracking-wider">{t.commonTypes}</div>
                                        {GENERIC_BEERS.map((b, i) => (
                                            <button key={i} onClick={() => handleBrandSelect({ ...b, type: 'beer' } as any)} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 mb-2 text-left hover:bg-white/10 flex justify-between">
                                                <span>{(language === 'fr' && b.name_fr) ? b.name_fr : b.name}</span>
                                                <span className="text-white/40">{b.abv}%</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="text-xs font-bold text-white/30 mb-2 uppercase tracking-wider flex-shrink-0">{t.library}</div>
                                {filteredLibrary.map((item, i) => (
                                    <button key={i} onClick={() => handleBrandSelect(item)} className="w-full p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center hover:bg-white/10 group transition-all">
                                        <span className="font-bold text-lg group-hover:pl-2 transition-all">{(language === 'fr' && item.name_fr) ? item.name_fr : item.name}</span>
                                        <span className="text-sm bg-black/30 px-2 py-1 rounded-lg text-white/50">{item.abv}%</span>
                                    </button>
                                ))}
                                <div className="h-10"></div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* --- GLASS STEP --- */}
            {step === 'glass' && (
                <div className="flex-1 flex flex-col animate-slide-up min-h-0">
                    <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 content-start pb-32 no-scrollbar min-h-0">
                        {GLASS_SHAPES.filter(g => drinkType === 'wine' ? g.id.startsWith('wine') || g.id === 'flute' : g.id !== 'shot').map((glass) => (
                            <button key={glass.id} onClick={() => handleGlassSelect(glass.id)} className="aspect-square rounded-[24px] bg-white/5 border border-white/10 hover:bg-white/10 flex flex-col items-center justify-center p-4 gap-2 transition-all hover:scale-105 active:scale-95 flex-shrink-0">
                                <svg viewBox="0 0 100 100" className="w-16 h-16 opacity-80" style={{ overflow: 'visible' }}>
                                    <path d={glass.path} fill="none" stroke="white" strokeWidth="2" />
                                </svg>
                                <span className="text-sm font-medium text-white/70">{(language === 'fr' && (glass as any).name_fr) ? (glass as any).name_fr : glass.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* --- POUR STEP --- */}
            {step === 'pour' && selectedItem && (
                <div className="flex-1 flex flex-col p-6 animate-slide-up relative overflow-y-auto no-scrollbar pb-32 min-h-0">
                    <div className="text-center mb-6 flex-shrink-0">
                        <div className="text-2xl font-bold">{(language === 'fr' && selectedItem.name_fr) ? selectedItem.name_fr : selectedItem.name}</div>
                        <div className="text-white/40">{selectedItem.abv}% ABV</div>
                    </div>

                    {drinkType !== 'shot' && (
                        <button onClick={() => setIsChug(!isChug)} className={`flex items-center justify-center gap-2 p-3 mb-4 rounded-xl border transition-all ${isChug ? 'bg-yellow-500/20 border-yellow-500 text-yellow-200' : 'bg-white/5 border-white/10 text-white/50'}`}>
                            <Zap size={18} fill={isChug ? "currentColor" : "none"} />
                            <span className="text-sm font-bold uppercase tracking-wider">{t.chug}</span>
                        </button>
                    )}

                    {(drinkType === 'beer' || drinkType === 'shot') && (
                        <div className="flex-1 flex flex-col justify-center gap-4">
                            {(drinkType === 'beer' ? BEER_PRESETS : SHOT_SIZES).map((p) => (
                                <button key={p.ml} onClick={() => { setAlcoholVolume(p.ml); finalizeDrink(p.ml); }} className={`p-6 rounded-[24px] border border-white/10 flex items-center justify-between hover:scale-105 transition-all ${drinkType === 'beer' ? 'bg-amber-500/10 hover:bg-amber-500/20' : 'bg-emerald-500/10 hover:bg-emerald-500/20'}`}>
                                    <span className="text-xl font-bold text-white">{language === 'fr' ? ((p as any).label_fr || p.label) : ((p as any).label_en || p.label)}</span>
                                    <span className="text-2xl font-mono text-white/60">{p.ml}<span className="text-sm ml-1">ml</span></span>
                                </button>
                            ))}
                            {/* Custom Input with Validation Button */}
                            <div className="p-4 rounded-[24px] border border-white/10 bg-white/5 flex items-center justify-between">
                                <span className="text-xl font-bold text-white ml-2">{t.custom}</span>
                                <div className="flex items-center gap-2">
                                    <input type="number" className="bg-transparent text-right text-2xl font-mono text-white focus:outline-none w-24 border-b border-white/20 focus:border-white py-1" placeholder="0" onChange={(e) => setAlcoholVolume(Number(e.target.value))} />
                                    <button
                                        onClick={() => alcoholVolume > 0 && finalizeDrink()}
                                        disabled={!alcoholVolume}
                                        className="p-3 bg-blue-500 rounded-full text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-400 transition-colors"
                                    >
                                        <Check size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {(drinkType === 'wine' || drinkType === 'cocktail') && (
                        <div className="flex-1 flex flex-col items-center">
                            <div className="w-full mb-4 flex justify-between items-end bg-black/40 p-4 rounded-[24px] border border-white/5">
                                <div className="text-left">
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{t.alcohol}</div>
                                    <div className="text-3xl font-black font-mono leading-none">{Math.round(alcoholVolume)}<span className="text-xs ml-1 opacity-30">ML</span></div>
                                </div>
                                {drinkType === 'cocktail' && selectedMixer && (
                                    <div className="text-right">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{t.mixer}</div>
                                        <div className="text-3xl font-black font-mono leading-none text-white/60">{Math.round(mixerVolume)}<span className="text-xs ml-1 opacity-30">ML</span></div>
                                    </div>
                                )}
                            </div>

                            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mb-4">
                                {drinkType === 'cocktail' && (!selectedMixer || selectedItem.defaultVolume) ? t.dragAdjust : t.dragMixer}
                            </p>

                            <GlassView
                                glassId={selectedGlassId}
                                alcoholVol={alcoholVolume}
                                mixerVol={mixerVolume}
                                color1={selectedItem.color}
                                color2={selectedMixer?.color || 'transparent'}
                                interactive={true}
                                onInteract={handleVolumeInteract}
                            />

                            {drinkType === 'cocktail' && !selectedMixer && !selectedItem.defaultVolume && (
                                <div className="w-full mt-6 space-y-3">
                                    <div className="text-center">
                                        <button
                                            onClick={() => finalizeDrink()}
                                            className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest border border-white/10 px-4 py-2 rounded-lg transition-colors"
                                        >
                                            {t.skipNeat}
                                        </button>
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2">{t.addMixer}</div>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar pb-10">
                                        {MIXERS.map(m => (
                                            <button
                                                key={m.name}
                                                onClick={() => setSelectedMixer(m)}
                                                className="p-3 rounded-xl bg-white/5 border border-white/5 text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition-colors"
                                            >
                                                <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: m.color }} />
                                                <span className="truncate">{m.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(drinkType === 'wine' || selectedMixer || selectedItem.defaultVolume) && (
                                <button
                                    onClick={() => finalizeDrink()}
                                    className="w-full py-6 mt-8 rounded-[32px] bg-gradient-to-br from-blue-500 to-indigo-700 text-white font-black text-2xl shadow-2xl shadow-blue-900/40 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    aria-label={t.logDrink}
                                >
                                    <Check size={28} /> {t.logDrink}
                                </button>
                            )}
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};
