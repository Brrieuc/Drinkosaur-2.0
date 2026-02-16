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
        if (!googletag || !googletag.cmd) {
            console.error('GPT (Googletag) not available');
            setError(language === 'fr' ? 'Services publicitaires non disponibles.' : 'Ad services not available.');
            return;
        }

        googletag.cmd.push(() => {
            try {
                // Create a rewarded ad slot
                const rewardedSlot = googletag.defineRewardedSlot ? googletag.defineRewardedSlot(adUnitPath) : null;

                if (rewardedSlot && typeof rewardedSlot.addService === 'function') {
                    const pubads = googletag.pubads ? googletag.pubads() : null;
                    if (pubads && typeof pubads.addEventListener === 'function') {
                        rewardedSlot.addService(pubads);

                        // Event listener for rewarded event
                        pubads.addEventListener('rewardedSlotReady', (_event: any) => {
                            try {
                                setIsAdLoaded(true);
                                setError(null);
                            } catch (e) {
                                console.error('Error in rewardedSlotReady:', e);
                            }
                        });

                        pubads.addEventListener('rewardedSlotClosed', (_event: any) => {
                            try {
                                setIsAdLoaded(false);
                                setIsAdShowing(false);
                                // Preload next ad
                                googletag.display(rewardedSlot);
                            } catch (e) {
                                console.error('Error in rewardedSlotClosed:', e);
                            }
                        });

                        pubads.addEventListener('rewardedSlotGranted', (event: any) => {
                            try {
                                onRewarded(event.payload);
                            } catch (e) {
                                console.error('Error in rewardedSlotGranted:', e);
                            }
                        });

                        // Enable services and request the ad
                        googletag.enableServices();
                        googletag.display(rewardedSlot);
                    }
                } else {
                    console.warn('Rewarded slot not supported or failed to define.');
                    setError(language === 'fr' ? 'Publicités non supportées sur cet appareil.' : 'Ads not supported on this device.');
                }
            } catch (e) {
                console.error('Error initializing GPT:', e);
            }
        });

        return () => {
            if (googletag && googletag.cmd) {
                googletag.cmd.push(() => {
                    if (typeof googletag.destroySlots === 'function') {
                        googletag.destroySlots();
                    }
                });
            }
        };
    }, [adUnitPath, onRewarded, language]);

    const showAd = useCallback(() => {
        const { googletag } = window;
        if (isAdLoaded && !isAdShowing) {
            setIsAdShowing(true);
            googletag.cmd.push(() => {
                if (googletag && googletag.pubads && typeof googletag.pubads === 'function') {
                    const adsArray = googletag.pubads().getSlots();
                    if (Array.isArray(adsArray)) {
                        adsArray.forEach((slot: any) => {
                            if (slot.getAdUnitPath() === adUnitPath) {
                                googletag.pubads().makeSlotVisible(slot);
                            }
                        });
                    }
                }
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
