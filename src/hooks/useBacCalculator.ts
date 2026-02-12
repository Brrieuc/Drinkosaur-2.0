import { useState, useEffect, useRef } from 'react';
import { Drink, BacStatus, UserProfile } from '../types';
import { calculateBac } from '../services/bacService';

const useBacCalculator = (drinks: Drink[], user: UserProfile) => {
    const [bacStatus, setBacStatus] = useState<BacStatus>({
        currentBac: 0,
        peakBac: 0,
        peakTime: null,
        soberTimestamp: null,
        statusMessage: 'Ready',
        color: 'from-emerald-400 to-cyan-400'
    });

    const prevStatusRef = useRef<string>("");
    const [statusChangeToast, setStatusChangeToast] = useState<{ msg: string, type: 'warning' } | null>(null);

    useEffect(() => {
        const updateBac = () => {
            if (user.isSetup) {
                const newStatus = calculateBac(drinks, user);
                setBacStatus(newStatus);

                // Check for status change for notification (only if BAC is increasing or high)
                if (prevStatusRef.current && prevStatusRef.current !== newStatus.statusMessage && newStatus.currentBac > 0.05) {
                    let nextStage = "";
                    // Determine next stage roughly
                    if (newStatus.statusMessage === (user.language === 'fr' ? 'Pompette' : 'Buzzy')) nextStage = user.language === 'fr' ? 'Éméché' : 'Tipsy';
                    else if (newStatus.statusMessage === (user.language === 'fr' ? 'Éméché' : 'Tipsy')) nextStage = user.language === 'fr' ? 'Chargé' : 'Loaded';
                    else if (newStatus.statusMessage === (user.language === 'fr' ? 'Chargé' : 'Loaded')) nextStage = user.language === 'fr' ? 'Ivre' : 'Drunk';
                    else nextStage = user.language === 'fr' ? 'Coma' : 'Blackout';

                    const msg = user.language === 'fr'
                        ? `Il n'y a pas de quoi être fier, vous êtes "${newStatus.statusMessage}" et vous risquez de finir "${nextStage}".`
                        : `Nothing to be proud of, you are "${newStatus.statusMessage}" and might end up "${nextStage}".`;

                    setStatusChangeToast({ msg, type: 'warning' });
                    setTimeout(() => setStatusChangeToast(null), 5000);
                }
                prevStatusRef.current = newStatus.statusMessage;
            }
        };

        updateBac(); // Initial
        const interval = setInterval(updateBac, 60000); // Every minute
        return () => clearInterval(interval);
    }, [drinks, user]);

    return { bacStatus, statusChangeToast };
};

export default useBacCalculator;
