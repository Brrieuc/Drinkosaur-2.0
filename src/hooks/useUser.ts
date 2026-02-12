/// <reference path="../firebase.d.ts" />

import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc, db, collection, query, where, getDocs } from '../firebase';

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
                        const updatedProfile = {
                            ...defaultProfile,
                            ...remoteData,
                            displayName: authUser.displayName || remoteData.displayName,
                            photoURL: authUser.photoURL || remoteData.photoURL
                        };
                        setUserProfile(updatedProfile);
                        window.localStorage.setItem('drinkosaur_user', JSON.stringify(updatedProfile));
                    } else {
                        // Init new user
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

    // Save profile with username availability check
    const saveUserProfile = async (newProfile: UserProfile): Promise<{ success: boolean, error?: string }> => {
        // 1. If username changed, check availability
        if (newProfile.username && newProfile.username !== userProfile.username) {
            const cleanUsername = newProfile.username.trim().toLowerCase();
            if (cleanUsername.length < 3) return { success: false, error: "Username too short" };

            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", cleanUsername));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                return { success: false, error: "Username already taken" };
            }
            newProfile.username = cleanUsername;
        }

        // 2. Update State
        setUserProfile(newProfile);

        // 3. Update Local Storage
        window.localStorage.setItem('drinkosaur_user', JSON.stringify(newProfile));

        // 4. Update Firestore if auth
        if (authUser) {
            try {
                await setDoc(doc(db, "users", authUser.uid), {
                    ...newProfile,
                    email: authUser.email?.toLowerCase()
                }, { merge: true });
                return { success: true };
            } catch (e) {
                console.error("Error saving profile:", e);
                return { success: false, error: "Failed to save profile" };
            }
        }
        return { success: true };
    };

    return [userProfile, saveUserProfile] as const;
};
