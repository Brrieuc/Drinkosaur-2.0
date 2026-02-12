
import { useState, useEffect } from 'react';
import { auth, googleProvider, signInWithPopup, signOut } from '../firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
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
