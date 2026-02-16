import React, { useState, useEffect } from 'react';
import { Heart, Gift, Users, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { useCharityAds } from '../hooks/useCharityAds';
import { db, doc, updateDoc, getDoc, setDoc, onSnapshot } from '../firebase';
import { UserProfile } from '../types';

interface CharitySupportProps {
    user: UserProfile;
    onUpdateUser: (updates: Partial<UserProfile>) => void;
    language: 'en' | 'fr';
}

export const CharitySupport: React.FC<CharitySupportProps> = ({ user, onUpdateUser, language }) => {
    const [globalImpact, setGlobalImpact] = useState<number>(0);
    const [isUpdating, setIsUpdating] = useState(false);

    // Sync global impact from Firestore
    useEffect(() => {
        const globalDocRef = doc(db, 'stats_global', 'charity');
        const unsubscribe = onSnapshot(globalDocRef, (doc) => {
            if (doc.exists()) {
                setGlobalImpact(doc.data().totalAdsWatched || 0);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleRewarded = async () => {
        setIsUpdating(true);
        try {
            // 1. Update personal count
            const newPersonalCount = (user.adsWatchedCharity || 0) + 1;
            onUpdateUser({ adsWatchedCharity: newPersonalCount });

            // 2. Update global count in Firestore
            const globalDocRef = doc(db, 'stats_global', 'charity');
            const globalDoc = await getDoc(globalDocRef);

            if (globalDoc.exists()) {
                await updateDoc(globalDocRef, {
                    totalAdsWatched: (globalDoc.data().totalAdsWatched || 0) + 1
                });
            } else {
                await setDoc(globalDocRef, { totalAdsWatched: 1 });
            }
        } catch (err) {
            console.error('Failed to update impact:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const { isAdLoaded, showAd, error } = useCharityAds({
        onRewarded: handleRewarded,
        language
    });

    return (
        <div className="bg-white/5 rounded-[32px] border border-white/10 p-6 space-y-6 overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-red-500/10 blur-3xl rounded-full" />

            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                    <Heart className="text-red-500 animate-pulse" fill="currentColor" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight leading-none">
                        {language === 'fr' ? 'Soutenir les Restos du Coeur' : 'Support Restos du Coeur'}
                    </h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                        {language === 'fr' ? '50% des revenus reversés' : '50% of revenue donated'}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <p className="text-sm text-white/60 leading-relaxed">
                    {language === 'fr'
                        ? "Regardez une courte publicité pour aider à financer des repas. Chaque vue compte !"
                        : "Watch a short ad to help fund meals. Every view counts!"}
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                        <Gift className="text-white/20 mx-auto mb-1" size={16} />
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            {language === 'fr' ? 'Mon Impact' : 'My Impact'}
                        </div>
                        <div className="text-xl font-black text-white">
                            {user.adsWatchedCharity || 0}
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                        <Users className="text-white/20 mx-auto mb-1" size={16} />
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                            {language === 'fr' ? 'Impact Global' : 'Global Impact'}
                        </div>
                        <div className="text-xl font-black text-white">
                            {globalImpact}
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={showAd}
                disabled={!isAdLoaded || isUpdating}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isAdLoaded && !isUpdating
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)] active:scale-95'
                        : 'bg-white/10 text-white/20 cursor-not-allowed'
                    }`}
            >
                {!isAdLoaded && !isUpdating ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        {language === 'fr' ? 'Chargement...' : 'Loading...'}
                    </>
                ) : isUpdating ? (
                    <>
                        <Sparkles className="animate-bounce" size={20} />
                        {language === 'fr' ? 'Soutien reçu !' : 'Support received!'}
                    </>
                ) : (
                    <>
                        <Sparkles size={20} />
                        {language === 'fr' ? 'Regarder & Soutenir' : 'Watch & Support'}
                    </>
                )}
            </button>

            {error && (
                <p className="text-center text-[10px] text-red-400 font-bold uppercase tracking-widest">
                    {error}
                </p>
            )}

            <div className="pt-2 border-t border-white/5 flex justify-center">
                <a
                    href="https://www.restosducoeur.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors flex items-center gap-1"
                >
                    {language === 'fr' ? 'En savoir plus' : 'Learn more'} <ExternalLink size={10} />
                </a>
            </div>
        </div>
    );
};
