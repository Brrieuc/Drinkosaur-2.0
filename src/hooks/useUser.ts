/// <reference path="../firebase.d.ts" />

import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc, db, collection, query, where, getDocs, storage, ref, uploadString, getDownloadURL } from '../firebase';

export const useUser = () => {
    const defaultProfile: UserProfile = {
        weightKg: 0,
        gender: 'male',
        isSetup: false,
        language: 'en',
        drinkingSpeed: 'average',
        hasSeenTour: false
    };


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

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (authUser) {
                console.log("Checking Firestore profile for:", authUser.uid);
                try {
                    const docRef = doc(db, "users", authUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const remoteData = docSnap.data();
                        const updatedProfile: UserProfile = {
                            ...defaultProfile,
                            ...remoteData,
                            uid: authUser.uid,
                            // Prioritize what we have in DB over what Google says
                            displayName: remoteData.displayName || authUser.displayName || '',
                            photoURL: remoteData.customPhotoURL || remoteData.photoURL || authUser.photoURL || ''
                        };
                        console.log("Profile found & synced:", updatedProfile.username);
                        setUserProfile(updatedProfile);
                        window.localStorage.setItem('drinkosaur_user', JSON.stringify(updatedProfile));
                    } else {
                        console.log("No profile found, creating initial document...");
                        const newProfile: UserProfile = {
                            ...userProfile,
                            uid: authUser.uid,
                            isSetup: false,
                            displayName: authUser.displayName || '',
                            photoURL: authUser.photoURL || ''
                        };
                        setUserProfile(newProfile);
                        // CRITICAL: email is important for admin search but not in the Profile interface
                        await setDoc(docRef, {
                            ...newProfile,
                            email: authUser.email?.toLowerCase(),
                            createdAt: Date.now(),
                            friends: [],
                            groups: []
                        }, { merge: true });
                        console.log("Initial profile created successfully");
                    }
                } catch (e) {
                    console.error("CRITICAL error syncing with Firestore:", e);
                }
            }
        };

        fetchUserProfile();
    }, [authUser]);

    const uploadAvatar = async (base64Image: string): Promise<string> => {
        if (!authUser) throw new Error("Not logged in");

        const storageRef = ref(storage, `avatars/${authUser.uid}_${Date.now()}.jpg`);
        // Remove data:image/jpeg;base64, prefix
        const base64Data = base64Image.split(',')[1];
        await uploadString(storageRef, base64Data, 'base64');
        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
    };

    const saveUserProfile = async (newProfile: UserProfile): Promise<{ success: boolean, error?: string }> => {
        // 1. Username changed check
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

        // 2. Prepare merged profile
        const mergedProfile = { ...userProfile, ...newProfile };

        // 3. Update State & Local Storage
        setUserProfile(mergedProfile);
        window.localStorage.setItem('drinkosaur_user', JSON.stringify(mergedProfile));

        // 4. Update Firestore if auth
        if (authUser) {
            try {
                await setDoc(doc(db, "users", authUser.uid), {
                    ...newProfile, // We only send the changes/profile fields to let Firestore merge handle it too
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

    return [userProfile, saveUserProfile, uploadAvatar] as const;
};
