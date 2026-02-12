/// <reference path="../firebase.d.ts" />

import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signInAnonymously, signOut } from '../firebase';
import { User, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Default to local persistence unless changed
        const init = async () => {
            try {
                // If the user previously chose NOT to stay connected, use session
                const stayConnected = window.localStorage.getItem('drinkosaur_stay_connected') !== 'false';
                await setPersistence(auth, stayConnected ? browserLocalPersistence : browserSessionPersistence);
            } catch (e) {
                console.error("Persistence Error:", e);
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
            console.log("Attempting Popup Sign-In...");
            const result = await signInWithPopup(auth, googleProvider);
            if (result?.user) {
                console.log("Popup Sign-In Success:", result.user.email);
                setUser(result.user);
            }
        } catch (err: any) {
            console.error("Sign-In Error:", err.code, err.message);

            if (err.code === 'auth/popup-blocked') {
                setError("La fenêtre a été bloquée. Cliquez sur 'Autoriser' en haut de votre écran Safari.");
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
