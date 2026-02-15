import { useEffect, useState } from 'react';
import { messaging, getToken, onMessage, db, doc, updateDoc } from '../firebase';
import { UserProfile } from '../types';

const VAPID_KEY = 'OP3oOA0c72CvJbFml_5P6SGEV6mF7teoKCAdfHCaMQ4';

export const useNotifications = (userProfile: UserProfile | null) => {
    const [token, setToken] = useState<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>(
        typeof window !== 'undefined' ? Notification.permission : 'default'
    );

    const requestPermission = async () => {
        if (!messaging) return;

        try {
            const status = await Notification.requestPermission();
            setPermission(status);

            if (status === 'granted') {
                const registration = await navigator.serviceWorker.ready;
                const currentToken = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration: registration
                });

                if (currentToken) {
                    setToken(currentToken);
                    if (userProfile?.uid) {
                        await saveTokenToFirestore(userProfile.uid, currentToken);
                    }
                } else {
                    console.log('No registration token available. Request permission to generate one.');
                }
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
        }
    };

    const saveTokenToFirestore = async (uid: string, fcmToken: string) => {
        try {
            const userRef = doc(db, 'users', uid);
            await updateDoc(userRef, {
                fcmToken: fcmToken,
                notificationsEnabled: true,
                lastTokenUpdate: new Date().toISOString()
            });
        } catch (err) {
            console.error('Error saving token to firestore:', err);
        }
    };

    useEffect(() => {
        if (userProfile?.uid && permission === 'granted' && messaging) {
            // Refresh token or ensure it's saved
            requestPermission();
        }
    }, [userProfile?.uid]);

    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            // You could show a toast here if you want
            if (payload.notification) {
                new Notification(payload.notification.title || 'Drinkosaur', {
                    body: payload.notification.body,
                    icon: '/drinkosaur.png'
                });
            }
        });

        return () => unsubscribe();
    }, []);

    return {
        permission,
        token,
        requestPermission
    };
};
