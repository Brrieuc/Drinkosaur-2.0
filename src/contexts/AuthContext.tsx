/// <reference path="../firebase.d.ts" />

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signInAnonymously as firebaseSignInAnonymous, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../firebase';
import { User, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence, EmailAuthProvider, linkWithCredential, updatePassword, reauthenticateWithCredential } from 'firebase/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    signIn: () => Promise<void>;
    signInAnonymous: () => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    signUpWithEmail: (email: string, pass: string) => Promise<void>;
    linkEmailToAccount: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const stayConnected = window.localStorage.getItem('drinkosaur_stay_connected') !== 'false';
        setPersistence(auth, stayConnected ? browserLocalPersistence : browserSessionPersistence)
            .catch((e) => console.error("Persistence Error:", e));

        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            setUser(authUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        setError(null);
        try {
            const result = await signInWithPopup(auth, googleProvider);
            if (result?.user) setUser(result.user);
        } catch (err: any) {
            if (err.code === 'auth/popup-blocked') {
                setError("La fenêtre a été bloquée par votre navigateur. Autorisez les pop-ups pour drinkosaur.vercel.app, ou utilisez la connexion par Email.");
            } else if (err.code === 'auth/popup-closed-by-user') {
                setError("Connexion annulée.");
            } else if (err.code === 'auth/cancelled-popup-request') {
                // Ignore
            } else {
                setError("Erreur : " + err.message);
            }
        }
    };

    const signInAnonymous = async () => {
        setError(null);
        try {
            const result = await firebaseSignInAnonymous(auth);
            if (result?.user) setUser(result.user);
        } catch (err: any) {
            setError("Erreur de connexion anonyme : " + err.message);
        }
    };

    const signInWithEmail = async (email: string, pass: string) => {
        setError(null);
        try {
            const result = await signInWithEmailAndPassword(auth, email, pass);
            if (result?.user) setUser(result.user);
        } catch (err: any) {
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
            return { success: true, message: "Email lié avec succès !" };
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') return { success: false, message: "Cet email est déjà associé à un autre compte." };
            if (err.code === 'auth/weak-password') return { success: false, message: "Le mot de passe doit faire au moins 6 caractères." };
            if (err.code === 'auth/provider-already-linked') return { success: false, message: "Un email est déjà associé à ce compte." };
            return { success: false, message: err.message };
        }
    };

    const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
        if (!user || !user.email) return { success: false, message: "Vous devez être connecté avec un email." };
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            return { success: true, message: "Mot de passe modifié avec succès !" };
        } catch (err: any) {
            if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') return { success: false, message: "Mot de passe actuel incorrect." };
            if (err.code === 'auth/weak-password') return { success: false, message: "Le nouveau mot de passe doit faire au moins 6 caractères." };
            if (err.code === 'auth/too-many-requests') return { success: false, message: "Trop d'essais. Réessayez plus tard." };
            return { success: false, message: err.message };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, error, signIn, signInAnonymous, signInWithEmail, signUpWithEmail, linkEmailToAccount, changePassword, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * Hook to consume the AuthContext.
 * Must be used inside <AuthProvider>.
 */
export const useAuthContext = (): AuthContextType => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuthContext must be used within <AuthProvider>");
    return ctx;
};
