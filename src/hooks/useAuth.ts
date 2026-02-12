
import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, signOut } from '../firebase';
import { User, onAuthStateChanged, setPersistence, browserLocalPersistence, getRedirectResult } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 1. Force persistence
        setPersistence(auth, browserLocalPersistence).catch(console.error);

        // 2. Auth state listener
        const unsubscribe = onAuthStateChanged(auth, (authUser: any) => {
            console.log("Auth State Changed:", authUser ? authUser.email : "null");
            setUser(authUser);
            setLoading(false);
        });

        // 3. Handle redirect result (Crucial for mobile)
        getRedirectResult(auth)
            .then((result: any) => {
                if (result?.user) {
                    console.log("Redirect sign-in success:", result.user.email);
                    setUser(result.user);
                }
            })
            .catch((err: any) => {
                console.error("Redirect Result Error:", err);
            });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        setError(null);
        try {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            if (isMobile) {
                console.log("Mobile: Using Redirect");
                await signInWithRedirect(auth, googleProvider);
            } else {
                console.log("Desktop: Using Popup");
                const result = await signInWithPopup(auth, googleProvider);
                if (result.user) setUser(result.user);
            }
        } catch (err: any) {
            console.error("Auth Error:", err.code, err.message);
            if (err.code === 'auth/popup-blocked') {
                setError("Fenêtre bloquée par le navigateur.");
            } else {
                setError(err.message);
            }
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
