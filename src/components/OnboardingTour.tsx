
import React, { useState } from 'react';
import { X, ChevronRight, LayoutDashboard, PlusCircle, Users, Activity, History } from 'lucide-react';

interface OnboardingTourProps {
    language: 'en' | 'fr';
    onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ language, onComplete }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: language === 'fr' ? 'Bienvenue sur Drinkosaur !' : 'Welcome to Drinkosaur!',
            content: language === 'fr'
                ? 'Drinkosaur calcule en temps réel votre taux d\'alcoolémie avec une précision scientifique basée sur votre profil.'
                : 'Drinkosaur calculates your blood alcohol content (BAC) in real-time with scientific precision based on your profile.',
            icon: <Activity className="w-12 h-12 text-pink-500" />,
            color: 'from-pink-500 to-rose-600'
        },
        {
            title: language === 'fr' ? 'Le Moniteur' : 'The Monitor',
            content: language === 'fr'
                ? 'Suivez votre courbe d\'alcoolémie, votre pic prévu et l\'heure à laquelle vous serez sobre.'
                : 'Follow your BAC curve, your projected peak, and the exact time you will be sober.',
            icon: <LayoutDashboard className="w-12 h-12 text-blue-500" />,
            color: 'from-blue-500 to-indigo-600'
        },
        {
            title: language === 'fr' ? 'Ajouter des verres' : 'Adding Drinks',
            content: language === 'fr'
                ? 'Ajoutez vos boissons instantanément ou rétro-saisissez un verre bu plus tôt dans la soirée.'
                : 'Add your drinks instantly or log a drink you had earlier in the evening.',
            icon: <PlusCircle className="w-12 h-12 text-emerald-500" />,
            color: 'from-emerald-500 to-teal-600'
        },
        {
            title: language === 'fr' ? 'L\'aspect Social' : 'Social Features',
            content: language === 'fr'
                ? 'Ajoutez des amis pour suivre leur consommation en direct et veiller les uns sur les autres !'
                : 'Add friends to follow their consumption live and look out for each other!',
            icon: <Users className="w-12 h-12 text-amber-500" />,
            color: 'from-amber-500 to-orange-600'
        }
    ];

    const currentStep = steps[step];

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 backdrop-blur-md bg-black/40 animate-fade-in">
            <div className="glass-panel-3d w-full max-w-md p-8 rounded-[40px] relative overflow-hidden flex flex-col items-center text-center">
                {/* Background Glow */}
                <div className={`absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br ${currentStep.color} opacity-20 blur-3xl rounded-full`} />

                <button
                    onClick={onComplete}
                    className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
                >
                    <X size={20} className="text-white/40" />
                </button>

                <div className="mb-8 p-6 bg-white/5 rounded-[32px] border border-white/10 shadow-inner relative z-10">
                    {currentStep.icon}
                </div>

                <h2 className="text-2xl font-black text-white mb-4 tracking-tight relative z-10">
                    {currentStep.title}
                </h2>

                <p className="text-white/60 text-md leading-relaxed mb-10 min-h-[80px] relative z-10">
                    {currentStep.content}
                </p>

                {/* Progress Indicators */}
                <div className="flex gap-2 mb-8 z-10">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/10'}`}
                        />
                    ))}
                </div>

                <button
                    onClick={() => {
                        if (step < steps.length - 1) setStep(step + 1);
                        else onComplete();
                    }}
                    className={`w-full py-5 rounded-[24px] font-black text-white bg-gradient-to-br ${currentStep.color} shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 z-10`}
                >
                    {step < steps.length - 1 ? (
                        <>
                            {language === 'fr' ? 'Suivant' : 'Next'}
                            <ChevronRight size={20} />
                        </>
                    ) : (
                        language === 'fr' ? 'C\'est parti !' : 'Let\'s go!'
                    )}
                </button>
            </div>
        </div>
    );
};
