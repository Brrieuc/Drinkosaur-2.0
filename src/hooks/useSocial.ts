/// <reference path="../firebase.d.ts" />

import { useState, useEffect } from 'react';
import { db, doc, updateDoc, arrayUnion, query, where, collection, getDocs, onSnapshot, arrayRemove, setDoc } from '../firebase';
import { useAuth } from './useAuth';
import { FriendStatus, BacStatus, UserProfile } from '../types';

export const useSocial = (myBacStatus?: BacStatus, myProfile?: UserProfile) => {
    const { user: authUser } = useAuth();
    const [friends, setFriends] = useState<FriendStatus[]>([]);
    const [friendIds, setFriendIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch friend list (IDs) from user profile
    useEffect(() => {
        if (!authUser) {
            setFriendIds([]);
            setFriends([]);
            setLoading(false);
            return;
        }

        const userRef = doc(db, "users", authUser.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap: any) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setFriendIds(data.friends || []);
            }
        });

        return () => unsubscribe();
    }, [authUser]);

    // 2. Listen to friends' live status
    useEffect(() => {
        if (friendIds.length === 0) {
            setFriends([]);
            setLoading(false);
            return;
        }

        // Firestore 'in' query is limited to 10-30 items depending on version, 
        // but for a small app it's fine for now.
        const statusQuery = query(
            collection(db, "live_status"),
            where("__name__", "in", friendIds)
        );

        const unsubscribe = onSnapshot(statusQuery, (querySnapshot: any) => {
            const statuses: FriendStatus[] = [];
            querySnapshot.forEach((doc: any) => {
                statuses.push({ uid: doc.id, ...doc.data() } as FriendStatus);
            });
            // Sort by BAC (highest first)
            setFriends(statuses.sort((a, b) => b.currentBac - a.currentBac));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [friendIds]);

    // 3. Update my own live status
    useEffect(() => {
        if (!authUser || !myBacStatus || !myProfile) return;

        const updateMyStatus = async () => {
            const statusRef = doc(db, "live_status", authUser.uid);
            await setDoc(statusRef, {
                displayName: myProfile.displayName || authUser.displayName || 'Anonymous',
                photoURL: myProfile.photoURL || authUser.photoURL || '',
                currentBac: myBacStatus.currentBac,
                statusMessage: myBacStatus.statusMessage,
                color: myBacStatus.color,
                lastUpdate: Date.now()
            }, { merge: true });
        };

        const timeout = setTimeout(updateMyStatus, 1000); // Debounce
        return () => clearTimeout(timeout);
    }, [authUser, myBacStatus, myProfile]);

    // 4. Action: Add friend by email
    const addFriendByEmail = async (email: string) => {
        if (!authUser) throw new Error("Not logged in");
        if (email.toLowerCase() === authUser.email?.toLowerCase()) throw new Error("You cannot add yourself");

        // Find user by email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("User not found");
        }

        const targetUser = querySnapshot.docs[0];
        const targetUid = targetUser.id;

        // Add to my friend list
        const myRef = doc(db, "users", authUser.uid);
        await updateDoc(myRef, {
            friends: arrayUnion(targetUid)
        });

        return targetUser.data();
    };

    const removeFriend = async (uid: string) => {
        if (!authUser) return;
        const myRef = doc(db, "users", authUser.uid);
        await updateDoc(myRef, {
            friends: arrayRemove(uid)
        });
    };

    return { friends, addFriendByEmail, removeFriend, loading };
};
