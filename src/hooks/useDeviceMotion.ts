import { useState, useEffect } from 'react';

/**
 * Hook pour détecter les mouvements du téléphone via gyroscope/accéléromètre
 * Retourne les angles d'inclinaison pour simuler le mouvement du liquide
 */
export const useDeviceMotion = () => {
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        const handleMotion = (event: DeviceOrientationEvent) => {
            if (event.beta !== null && event.gamma !== null) {
                // beta: inclinaison avant/arrière (-180 à 180)
                // gamma: inclinaison gauche/droite (-90 à 90)

                // Limiter les valeurs pour éviter des mouvements trop extrêmes
                const clampedBeta = Math.max(-45, Math.min(45, event.beta));
                const clampedGamma = Math.max(-45, Math.min(45, event.gamma));

                setTilt({
                    x: clampedGamma / 45, // Normaliser entre -1 et 1
                    y: clampedBeta / 45
                });
            }
        };

        const requestPermission = async () => {
            // Pour iOS 13+, demander la permission
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                try {
                    const permission = await (DeviceOrientationEvent as any).requestPermission();
                    if (permission === 'granted') {
                        setHasPermission(true);
                        window.addEventListener('deviceorientation', handleMotion);
                    }
                } catch (error) {
                    console.log('Permission refusée pour le gyroscope');
                }
            } else {
                // Pour Android et anciens navigateurs
                setHasPermission(true);
                window.addEventListener('deviceorientation', handleMotion);
            }
        };

        requestPermission();

        return () => {
            window.removeEventListener('deviceorientation', handleMotion);
        };
    }, []);

    return { tilt, hasPermission };
};
