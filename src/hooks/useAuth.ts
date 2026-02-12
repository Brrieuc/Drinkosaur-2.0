
import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, signOut } from '../firebase';
import { User, onAuthStateChanged, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Essential: Check for redirect results BEFORE the general state change listener
        const initAuth = async () => {
            try {
                // Force persistence once
                await setPersistence(auth, browserLocalPersistence);

                // Check if we just returned from Google
                const result = await getRedirectResult(auth);
                if (result?.user) {
                    console.log("Redirect login successful:", result.user.email);
                    setUser(result.user);
                }
            } catch (err: any) {
                console.error("Auth Init Error:", err.code, err.message);
            } finally {
                // Only after checking redirect, we listen for state changes to avoid race conditions
                const unsubscribe = onAuthStateChanged(auth, (authUser: any) => {
                    setUser(authUser);
                    setLoading(false);
                });
                return unsubscribe;
            }
        };

        const authPromise = initAuth();

        return () => {
            authPromise.then(unsub => unsub && unsub());
        };
    }, []);

    const signIn = async () => {
        setError(null);
        try {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                console.log("Mobile: Triggering Redirect...");
                await signInWithRedirect(auth, googleProvider);
            } else {
                console.log("Desktop: Triggering Popup...");
                const result = await signInWithPopup(auth, googleProvider);
                if (result.user) setUser(result.user);
            }
        } catch (err: any) {
            console.error("Sign-In Error:", err.code, err.message);
            setError(err.message);
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

    return { user, loading, error, signIn, logout };
};
