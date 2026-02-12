/// <reference path="../firebase.d.ts" />

import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signInWithRedirect, signInAnonymously, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase';
import { User, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, getRedirectResult } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsubscribe: () => void;

        const initAuth = async () => {
            try {
                // 1. Set Persistence
                const stayConnected = window.localStorage.getItem('drinkosaur_stay_connected') !== 'false';
                await setPersistence(auth, stayConnected ? browserLocalPersistence : browserSessionPersistence);

                // 2. Setup Listener. Wait to process redirect until we know standard auth state is empty.
                unsubscribe = onAuthStateChanged(auth, async (authUser) => {
                    if (authUser) {
                        // Standard Flow: User is already logged in (or persistence kicked in)
                        console.log("Auth State: Logged In");
                        setUser(authUser);
                        setLoading(false);
                    } else {
                        // Edge Case Flow: No user found. Check if this is a return from a Redirect.
                        console.log("Auth State: No User. Checking for Redirect Result...");
                        try {
                            const result = await getRedirectResult(auth);
                            if (result?.user) {
                                console.log("Redirect Success:", result.user.email);
                                setUser(result.user);
                            } else {
                                // Really no user
                                setUser(null);
                            }
                        } catch (e) {
                            console.error("Redirect Check Error:", e);
                            setUser(null);
                        } finally {
                            setLoading(false);
                        }
                    }
                });

            } catch (e: any) {
                console.error("Auth Init Failed:", e);
                setLoading(false);
            }
        };

        initAuth();

        return () => {
            if (unsubscribe) unsubscribe();
        };
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

    const signInWithEmail = async (email: string, pass: string) => {
        setError(null);
        try {
            const result = await signInWithEmailAndPassword(auth, email, pass);
            if (result?.user) setUser(result.user);
        } catch (err: any) {
            console.error("Email Sign-In Error:", err);
            // Firebase returns english error codes, map them to french if needed or just generic messages
            if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
                setError("Email ou mot de passe incorrect.");
            } else if (err.code === "auth/too-many-requests") {
                setError("Trop d'essais. Réessayez plus tard.");
            } else {
                setError(err.message);
            }
        }
    };

    const signUpWithEmail = async (email: string, pass: string) => {
        setError(null);
        try {
            const result = await createUserWithEmailAndPassword(auth, email, pass);
            if (result?.user) setUser(result.user);
        } catch (err: any) {
            console.error("Email Sign-Up Error:", err);
            if (err.code === "auth/email-already-in-use") {
                setError("Cet email est déjà utilisé.");
            } else if (err.code === "auth/weak-password") {
                setError("Le mot de passe doit faire au moins 6 caractères.");
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

    return { user, loading, error, signIn, signInAnonymous, signInWithEmail, signUpWithEmail, logout };
};
