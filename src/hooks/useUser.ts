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
                        try {
                            window.localStorage.setItem('drinkosaur_user', JSON.stringify(updatedProfile));
                        } catch (e) {
                            console.warn("Storage Blocked:", e);
                        }
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

    // Upload avatar to Firebase Storage
    const uploadAvatar = async (base64Image: string): Promise<string> => {
        if (!authUser) throw new Error("Not logged in");
        console.log("[uploadAvatar] Uploading to Firebase Storage...");

        try {
            // Create a unique filename based on UID and timestamp
            const timestamp = Date.now();
            const storageRef = ref(storage, `avatars/${authUser.uid}_${timestamp}.jpg`);

            // Upload the base64 string (data_url format)
            await uploadString(storageRef, base64Image, 'data_url');

            // Get the download URL
            const downloadURL = await getDownloadURL(storageRef);
            console.log("[uploadAvatar] Upload success, URL:", downloadURL);
            return downloadURL;
        } catch (error) {
            console.error("[uploadAvatar] Upload failed:", error);
            throw error;
        }
    };

    const saveUserProfile = async (newProfile: Partial<UserProfile>): Promise<{ success: boolean, error?: string }> => {
        console.log("[saveUserProfile] Called with:", JSON.stringify(newProfile, null, 2));
        console.log("[saveUserProfile] Current userProfile.customPhotoURL:", userProfile.customPhotoURL);
        console.log("[saveUserProfile] Current userProfile.photoURL:", userProfile.photoURL);

        // 1. Username changed check
        if (newProfile.username && newProfile.username !== userProfile.username) {
            const cleanUsername = newProfile.username.trim().toLowerCase();
            if (cleanUsername.length < 3) return { success: false, error: "Username too short" };

            const usersRef = collection(db, "users");
            const q = query(usersRef, where("username", "==", cleanUsername));
            // Only check if username is actually being updated
            if (userProfile.username !== cleanUsername) {
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    return { success: false, error: "Username already taken" };
                }
            }
            newProfile.username = cleanUsername;
        }

        // 2. Prepare merged profile
        const tempProfile = { ...userProfile, ...newProfile };
        const mergedProfile = {
            ...tempProfile,
            // Ensure photoURL is always consistent with customPhotoURL
            photoURL: tempProfile.customPhotoURL || tempProfile.photoURL || authUser?.photoURL || '',
            // Ensure displayName is prioritized correctly
            displayName: tempProfile.displayName || authUser?.displayName || ''
        };

        console.log("[saveUserProfile] Merged customPhotoURL:", mergedProfile.customPhotoURL);
        console.log("[saveUserProfile] Merged photoURL:", mergedProfile.photoURL);

        // 3. Update State & Local Storage
        setUserProfile(mergedProfile);
        try {
            window.localStorage.setItem('drinkosaur_user', JSON.stringify(mergedProfile));
        } catch (e) {
            console.warn("Storage Blocked:", e);
        }

        // 4. Update Firestore if auth
        if (authUser) {
            try {
                const firestorePayload = {
                    ...newProfile, // Only updatable fields
                    // FORCE update computed fields to ensure consistency in DB
                    photoURL: mergedProfile.photoURL,
                    displayName: mergedProfile.displayName,
                    email: authUser.email?.toLowerCase()
                };
                console.log("[saveUserProfile] Firestore payload:", JSON.stringify(firestorePayload, null, 2));
                await setDoc(doc(db, "users", authUser.uid), firestorePayload, { merge: true });
                console.log("[saveUserProfile] Firestore write SUCCESS");
                return { success: true };
            } catch (e) {
                console.error("[saveUserProfile] Firestore write FAILED:", e);
                return { success: false, error: "Failed to save profile" };
            }
        }
        return { success: true };
    };

    return [userProfile, saveUserProfile, uploadAvatar] as const;
};
