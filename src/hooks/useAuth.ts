/// <reference path="../firebase.d.ts" />

import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signInAnonymously, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase';
import { User, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, EmailAuthProvider, linkWithCredential, updatePassword, reauthenticateWithCredential } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Set persistence preference
        const stayConnected = window.localStorage.getItem('drinkosaur_stay_connected') !== 'false';
        setPersistence(auth, stayConnected ? browserLocalPersistence : browserSessionPersistence)
            .catch((e) => console.error("Persistence Error:", e));

        // Single source of truth: onAuthStateChanged
        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            console.log("Auth State Changed:", authUser ? "User Logged In" : "No User");
            setUser(authUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        setError(null);
        try {
            // Use Popup on ALL platforms — signInWithRedirect is broken on Safari/iOS
            // due to ITP (Intelligent Tracking Prevention) blocking third-party cookies
            console.log("Attempting Popup Sign-In...");
            const result = await signInWithPopup(auth, googleProvider);
            if (result?.user) {
                console.log("Popup Sign-In Success:", result.user.email);
                setUser(result.user);
            }
        } catch (err: any) {
            console.error("Sign-In Error:", err.code, err.message);

            if (err.code === 'auth/popup-blocked') {
                setError("La fenêtre a été bloquée par votre navigateur. Autorisez les pop-ups pour drinkosaur.vercel.app, ou utilisez la connexion par Email.");
            } else if (err.code === 'auth/popup-closed-by-user') {
                setError("Connexion annulée.");
            } else if (err.code === 'auth/cancelled-popup-request') {
                // Ignore this — happens when user clicks button twice fast
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

    const linkEmailToAccount = async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
        if (!user) return { success: false, message: "Vous devez être connecté pour lier un email." };
        try {
            const credential = EmailAuthProvider.credential(email, pass);
            await linkWithCredential(user, credential);
            return { success: true, message: "Email lié avec succès ! Vous pouvez maintenant vous connecter avec cet email." };
        } catch (err: any) {
            console.error("Link Email Error:", err);
            if (err.code === 'auth/email-already-in-use') {
                return { success: false, message: "Cet email est déjà associé à un autre compte." };
            } else if (err.code === 'auth/weak-password') {
                return { success: false, message: "Le mot de passe doit faire au moins 6 caractères." };
            } else if (err.code === 'auth/provider-already-linked') {
                return { success: false, message: "Un email est déjà associé à ce compte." };
            }
            return { success: false, message: err.message };
        }
    };

    const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        if (!user || !user.email) return { success: false, message: "Vous devez être connecté avec un email." };
        try {
            // Re-authenticate first (required by Firebase for sensitive operations)
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            // Now update password
            await updatePassword(user, newPassword);
            return { success: true, message: "Mot de passe modifié avec succès !" };
        } catch (err: any) {
            console.error("Change Password Error:", err);
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                return { success: false, message: "Mot de passe actuel incorrect." };
            } else if (err.code === 'auth/weak-password') {
                return { success: false, message: "Le nouveau mot de passe doit faire au moins 6 caractères." };
            } else if (err.code === 'auth/too-many-requests') {
                return { success: false, message: "Trop d'essais. Réessayez plus tard." };
            }
            return { success: false, message: err.message };
        }
    };

    return { user, loading, error, signIn, signInAnonymous, signInWithEmail, signUpWithEmail, linkEmailToAccount, changePassword, logout };
};
