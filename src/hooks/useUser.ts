
import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc, db } from '../firebase';

export const useUser = () => {
    const defaultProfile: UserProfile = {
        weightKg: 0,
        gender: 'male',
        isSetup: false,
        language: 'en',
        drinkingSpeed: 'average'
    };

    // Local state
    const [userProfile, setUserProfile] = useState<UserProfile>(() => {
        try {
            const item = window.localStorage.getItem('drinkosaur_user');
            return item ? { ...defaultProfile, ...JSON.parse(item) } : defaultProfile;
        } catch (error) {
            console.error(error);
            return defaultProfile;
        }
    });

    const { user: authUser } = useAuth();

    // Sync with Firestore when auth user changes
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (authUser) {
                try {
                    const docRef = doc(db, "users", authUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const remoteData = docSnap.data() as UserProfile;
                        // Always keep displayName and photoURL fresh from Google if available
                        const updatedProfile = {
                            ...defaultProfile,
                            ...remoteData,
                            displayName: authUser.displayName || remoteData.displayName,
                            photoURL: authUser.photoURL || remoteData.photoURL
                        };
                        setUserProfile(updatedProfile);
                        window.localStorage.setItem('drinkosaur_user', JSON.stringify(updatedProfile));
                    } else {
                        // Init new user with Google info
                        const newProfile = {
                            ...userProfile,
                            displayName: authUser.displayName || '',
                            photoURL: authUser.photoURL || ''
                        };
                        setUserProfile(newProfile);
                        await setDoc(docRef, { ...newProfile, email: authUser.email?.toLowerCase() });
                    }
                } catch (e) {
                    console.error("Error fetching user profile:", e);
                }
            }
        };

        fetchUserProfile();
    }, [authUser]);

    // Save function that updates both LocalStorage and Firestore (if logged in)
    const saveUserProfile = async (newProfile: UserProfile) => {
        // 1. Update State
        setUserProfile(newProfile);

        // 2. Update Local Storage
        window.localStorage.setItem('drinkosaur_user', JSON.stringify(newProfile));

        // 3. Update Firestore if auth
        if (authUser) {
            try {
                await setDoc(doc(db, "users", authUser.uid), {
                    ...newProfile,
                    email: authUser.email?.toLowerCase()
                });
            } catch (e) {
                console.error("Error saving profile to firestore:", e);
            }
        }
    };

    return [userProfile, saveUserProfile] as const;
};
