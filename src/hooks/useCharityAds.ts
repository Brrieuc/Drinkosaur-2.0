import { useState, useEffect, useCallback } from 'react';

declare global {
    interface Window {
        googletag: any;
    }
}

interface UseCharityAdsOptions {
    onRewarded: (reward: any) => void;
    adUnitPath?: string;
    language?: 'en' | 'fr';
}

export const useCharityAds = ({
    onRewarded,
    adUnitPath = '/6499/example/rewarded', // Default test ad unit
    language = 'fr'
}: UseCharityAdsOptions) => {
    const [isAdLoaded, setIsAdLoaded] = useState(false);
    const [isAdShowing, setIsAdShowing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const { googletag } = window;

        googletag.cmd.push(() => {
            // Create a rewarded ad slot
            const rewardedSlot = googletag.defineRewardedSlot(adUnitPath);

            if (rewardedSlot) {
                rewardedSlot.addService(googletag.pubads());

                // Event listener for rewarded event
                googletag.pubads().addEventListener('rewardedSlotReady', (_event: any) => {
                    setIsAdLoaded(true);
                });

                googletag.pubads().addEventListener('rewardedSlotClosed', (_event: any) => {
                    setIsAdLoaded(false);
                    setIsAdShowing(false);
                    // Preload next ad
                    googletag.display(rewardedSlot);
                });

                googletag.pubads().addEventListener('rewardedSlotGranted', (event: any) => {
                    onRewarded(event.payload);
                });

                // Enable services and request the ad
                googletag.enableServices();
                googletag.display(rewardedSlot);
            } else {
                setError(language === 'fr' ? 'Impossible de charger la publicité.' : 'Unable to load advertisement.');
            }
        });

        return () => {
            googletag.cmd.push(() => {
                googletag.destroySlots();
            });
        };
    }, [adUnitPath, onRewarded, language]);

    const showAd = useCallback(() => {
        const { googletag } = window;
        if (isAdLoaded && !isAdShowing) {
            setIsAdShowing(true);
            googletag.cmd.push(() => {
                googletag.pubads().getSlots().forEach((slot: any) => {
                    if (slot.getAdUnitPath() === adUnitPath) {
                        googletag.pubads().makeSlotVisible(slot);
                    }
                });
            });
        } else if (!isAdLoaded) {
            console.warn('Ad not loaded yet');
        }
    }, [isAdLoaded, isAdShowing, adUnitPath]);

    return {
        isAdLoaded,
        isAdShowing,
        showAd,
        error
    };
};
