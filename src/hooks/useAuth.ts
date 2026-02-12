
import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut } from '../firebase';
import { User, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Force session persistence to local storage
        setPersistence(auth, browserLocalPersistence).catch(console.error);

        const unsubscribe = onAuthStateChanged(auth, (authUser) => {
            console.log("Auth State Changed - User:", authUser?.email || "null");
            setUser(authUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        setError(null);
        try {
            console.log("Starting Google Sign-In (Popup mode)...");
            // Popup is more reliable on modern iOS Safari than Redirect if the user manually allows it once.
            const result = await signInWithPopup(auth, googleProvider);
            if (result.user) {
                console.log("Sign-in successful:", result.user.email);
                setUser(result.user);
            }
        } catch (err: any) {
            console.error("Auth Error Detail:", err.code, err.message);
            if (err.code === 'auth/popup-blocked') {
                setError("La fenêtre de connexion a été bloquée. Veuillez autoriser les popups pour ce site.");
            } else {
                setError(err.message);
            }
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            console.log("Logged out safely");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return { user, loading, error, signIn, logout };
};
