import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, signOut } from '../firebase';
import { User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        // Handle redirect result
        getRedirectResult(auth).catch((err) => {
            console.error("Redirect Error:", err);
            setError(err.message);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        try {
            console.log("Starting Google Sign-In...");
            // Detect if mobile to use redirect, otherwise popup
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                await signInWithRedirect(auth, googleProvider);
            } else {
                await signInWithPopup(auth, googleProvider);
            }
        } catch (err: any) {
            console.error("Auth Error:", err.code, err.message);
            setError(err.message);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (err: any) {
            setError(err.message);
        }
    };

    return { user, loading, error, signIn, logout };
};
