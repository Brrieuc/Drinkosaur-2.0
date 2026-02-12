/// <reference path="../firebase.d.ts" />

import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, signInAnonymously, signOut } from '../firebase';
import { User, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, getRedirectResult } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // If the user previously chose NOT to stay connected, use session
                const stayConnected = window.localStorage.getItem('drinkosaur_stay_connected') !== 'false';
                await setPersistence(auth, stayConnected ? browserLocalPersistence : browserSessionPersistence);

                // Handle Redirect Result (for Mobile Flow)
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    console.log("Redirect Sign-In Success:", result.user.email);
                    setUser(result.user);
                }
            } catch (e: any) {
                console.error("Auth Init Error:", e);
                // Don't show technical redirect errors to user unless critical
                if (e.code !== 'auth/popup-closed-by-user') {
                    setError(e.message);
                }
            }
        };

        init();

        const unsubscribe = onAuthStateChanged(auth, (authUser: any) => {
            console.log("Auth State Changed:", authUser ? "User Logged In" : "No User");
            setUser(authUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        setError(null);
        try {
            // Mobile Optimization: Use Redirect on iOS/Android to avoid popup blocking & improve UX
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                console.log("Mobile device detected: Using Redirect Sign-In");
                await signInWithRedirect(auth, googleProvider);
                // Flow stops here, page will redirect
                return;
            }

            console.log("Desktop detected: Attempting Popup Sign-In...");
            const result = await signInWithPopup(auth, googleProvider);
            if (result?.user) {
                console.log("Popup Sign-In Success:", result.user.email);
                setUser(result.user);
            }
        } catch (err: any) {
            console.error("Sign-In Error:", err.code, err.message);

            if (err.code === 'auth/popup-blocked') {
                // Determine if we should suggest redirect
                setError("La fenêtre a été bloquée. Essayez de désactiver le bloqueur de pop-up ou utilisez le mode 'Invité'.");
            } else if (err.code === 'auth/popup-closed-by-user') {
                setError("Connexion annulée.");
            } else {
                setError("Erreur : " + err.message);
            }
        }
    };

    const signInAnonymous = async () => {
        setError(null);
        try {
            console.log("Attempting Anonymous Sign-In...");
            const result = await signInAnonymously(auth);
            if (result?.user) {
                setUser(result.user);
            }
        } catch (err: any) {
            console.error("Anonymous Sign-In Error:", err);
            setError("Erreur de connexion anonyme : " + err.message);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return { user, loading, error, signIn, signInAnonymous, logout };
};
