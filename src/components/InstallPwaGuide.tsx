import React, { useEffect, useState } from 'react';
import { Share, PlusSquare, MoreVertical, Download, Smartphone, ArrowRight } from 'lucide-react';

interface InstallPwaGuideProps {
    language: 'en' | 'fr';
    onComplete: () => void;
}

export const InstallPwaGuide: React.FC<InstallPwaGuideProps> = ({ language, onComplete }) => {
    const [isStandalone, setIsStandalone] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [showGuide, setShowGuide] = useState(true);

    useEffect(() => {
        // Detect if running in standalone mode (PWA)
        const isInStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(isInStandalone);

        // Detect iOS
        const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIosDevice);

        const isAndroid = /android/i.test(navigator.userAgent);

        // If already standalone OR not mobile (desktop), skip guide immediately
        if (isInStandalone || (!isIosDevice && !isAndroid)) {
            onComplete();
        }
    }, [onComplete]);

    if (isStandalone || !showGuide) return null;

    const t = {
        title: language === 'fr' ? 'Installer l\'App' : 'Install App',
        subtitle: language === 'fr' ? 'Pour une meilleure expérience, ajoutez Drinkosaur à votre écran d\'accueil.' : 'For the best experience, add Drinkosaur to your home screen.',
        iosStep1: language === 'fr' ? '1. Touchez le bouton Partager' : '1. Tap the Share button',
        iosStep2: language === 'fr' ? '2. Faites défiler vers le bas' : '2. Scroll down',
        iosStep3: language === 'fr' ? '3. "Sur l\'écran d\'accueil"' : '3. "Add to Home Screen"',
        androidStep1: language === 'fr' ? '1. Touchez le menu (⋮)' : '1. Tap the menu (⋮)',
        androidStep2: language === 'fr' ? '2. Sélectionnez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"' : '2. Select "Install App" or "Add to Home Screen"',
        continue: language === 'fr' ? 'Continuer vers l\'application' : 'Continue to App',
        skip: language === 'fr' ? 'Plus tard' : 'Skip',
        why: language === 'fr' ? 'Pourquoi ?' : 'Why?',
        whyDesc: language === 'fr' ? 'Cela permet d\'utiliser l\'application en plein écran, sans la barre du navigateur, et d\'y accéder plus rapidement.' : 'This allows you to use the app in full screen, without the browser bar, and access it faster.'
    };

    return (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
            <div className="w-full max-w-md bg-[#0f0f13] border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6 animate-float">
                        <Smartphone size={32} className="text-white" />
                    </div>

                    <h2 className="text-2xl font-black text-white mb-3 italic uppercase tracking-tight">{t.title}</h2>
                    <p className="text-white/40 text-sm font-medium mb-8 leading-relaxed max-w-xs">{t.subtitle}</p>

                    <div className="w-full bg-white/5 rounded-2xl p-6 border border-white/5 mb-8 text-left space-y-4">
                        {isIOS ? (
                            // iOS Instructions
                            <>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Share size={20} />
                                    </div>
                                    <span className="text-white font-bold text-sm">{t.iosStep1}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40">
                                        <ArrowRight size={20} className="rotate-90" />
                                    </div>
                                    <span className="text-white font-bold text-sm">{t.iosStep2}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40">
                                        <PlusSquare size={20} />
                                    </div>
                                    <span className="text-white font-bold text-sm">{t.iosStep3}</span>
                                </div>
                            </>
                        ) : (
                            // Android Instructions
                            <>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/40">
                                        <MoreVertical size={20} />
                                    </div>
                                    <span className="text-white font-bold text-sm">{t.androidStep1}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <Download size={20} />
                                    </div>
                                    <span className="text-white font-bold text-sm">{t.androidStep2}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            setShowGuide(false);
                            onComplete();
                        }}
                        className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mb-4"
                    >
                        {t.continue}
                    </button>

                    <button
                        onClick={() => {
                            setShowGuide(false);
                            onComplete();
                        }}
                        className="text-xs text-white/30 font-bold uppercase tracking-widest hover:text-white transition-colors"
                    >
                        {t.skip}
                    </button>
                </div>
            </div>
        </div>
    );
};
