/// <reference path="../firebase.d.ts" />

import { useState, useEffect } from 'react';
import { db, doc, updateDoc, arrayUnion, query, where, collection, getDocs, onSnapshot, arrayRemove, setDoc, addDoc, deleteDoc } from '../firebase';
import { useAuth } from './useAuth';
import { FriendStatus, BacStatus, UserProfile } from '../types';

export interface FriendRequest {
    id: string;
    from: string;
    fromName: string;
    fromPhoto: string;
    to: string;
    timestamp: number;
}

export const useSocial = (myBacStatus?: BacStatus, myProfile?: UserProfile) => {
    const { user: authUser } = useAuth();
    const [friends, setFriends] = useState<FriendStatus[]>([]);
    const [friendIds, setFriendIds] = useState<string[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch friend list (IDs) from user profile
    useEffect(() => {
        if (!authUser) {
            setFriendIds([]);
            setFriends([]);
            setIncomingRequests([]);
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

        // 1b. Listen to incoming friend requests
        const requestsQuery = query(
            collection(db, "friend_requests"),
            where("to", "==", authUser.uid)
        );
        const unsubRequests = onSnapshot(requestsQuery, (snap: any) => {
            const reqs: FriendRequest[] = [];
            snap.forEach((doc: any) => {
                reqs.push({ id: doc.id, ...doc.data() } as FriendRequest);
            });
            setIncomingRequests(reqs);
        });

        return () => {
            unsubscribe();
            unsubRequests();
        };
    }, [authUser]);

    // 2. Listen to friends' live status
    useEffect(() => {
        if (friendIds.length === 0) {
            setFriends([]);
            setLoading(false);
            return;
        }

        // Firestore "in" query limited to 10-30 IDs usually. 
        // For Drinkosaur, we assume a small number of active friends.
        const statusQuery = query(
            collection(db, "live_status"),
            where("__name__", "in", friendIds)
        );

        const unsubscribe = onSnapshot(statusQuery, (querySnapshot: any) => {
            const statuses: FriendStatus[] = [];
            querySnapshot.forEach((doc: any) => {
                statuses.push({ uid: doc.id, ...doc.data() } as FriendStatus);
            });
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
                displayName: myProfile.username || myProfile.displayName || authUser.displayName || 'Anonymous',
                photoURL: myProfile.customPhotoURL || myProfile.photoURL || authUser.photoURL || '',
                currentBac: myBacStatus.currentBac,
                statusMessage: myBacStatus.statusMessage,
                color: myBacStatus.color,
                lastUpdate: Date.now()
            }, { merge: true });
        };

        const timeout = setTimeout(updateMyStatus, 1000); // Debounce
        return () => clearTimeout(timeout);
    }, [authUser, myBacStatus, myProfile]);

    // 4. Action: SEND friend request
    const addFriendByUsername = async (username: string) => {
        if (!authUser) throw new Error("Not logged in");
        if (!username) throw new Error("Username required");

        const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
        if (myProfile?.username?.toLowerCase() === cleanUsername) {
            throw new Error("You cannot add yourself");
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", cleanUsername));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            throw new Error("User not found");
        }

        const targetUser = querySnapshot.docs[0];
        const targetUid = targetUser.id;

        if (friendIds.includes(targetUid)) {
            throw new Error("Already friends");
        }

        // Check if request already exists
        const reqsRef = collection(db, "friend_requests");
        const reqQuery = query(reqsRef, where("from", "==", authUser.uid), where("to", "==", targetUid));
        const reqSnap = await getDocs(reqQuery);
        if (!reqSnap.empty) {
            throw new Error("Request already sent");
        }

        // Create the request
        await addDoc(reqsRef, {
            from: authUser.uid,
            fromName: myProfile?.username || authUser.displayName || 'Anonymous',
            fromPhoto: myProfile?.customPhotoURL || authUser.photoURL || '',
            to: targetUid,
            timestamp: Date.now()
        });
    };

    // 5. Action: Respond to request
    const respondToRequest = async (requestId: string, accept: boolean) => {
        if (!authUser) return;

        const reqRef = doc(db, "friend_requests", requestId);
        const reqSnap = await getDocs(query(collection(db, "friend_requests"), where("__name__", "==", requestId)));

        if (reqSnap.empty) return;
        const requestData = reqSnap.docs[0].data() as FriendRequest;

        if (accept) {
            // Add to both friends lists
            const myRef = doc(db, "users", authUser.uid);
            const otherRef = doc(db, "users", requestData.from);

            await updateDoc(myRef, { friends: arrayUnion(requestData.from) });
            await updateDoc(otherRef, { friends: arrayUnion(authUser.uid) });
        }

        // Delete the request
        await deleteDoc(reqRef);
    };

    const removeFriend = async (uid: string) => {
        if (!authUser) return;
        const myRef = doc(db, "users", authUser.uid);
        const otherRef = doc(db, "users", uid);

        await updateDoc(myRef, { friends: arrayRemove(uid) });
        await updateDoc(otherRef, { friends: arrayRemove(authUser.uid) });
    };

    const refreshSocial = async () => {
        setLoading(true);
        if (friendIds.length > 0) {
            const statusQuery = query(
                collection(db, "live_status"),
                where("__name__", "in", friendIds)
            );
            const querySnapshot = await getDocs(statusQuery);
            const statuses: FriendStatus[] = [];
            querySnapshot.forEach((doc: any) => {
                statuses.push({ uid: doc.id, ...doc.data() } as FriendStatus);
            });
            setFriends(statuses.sort((a, b) => b.currentBac - a.currentBac));
        }
        setLoading(false);
    };

    return {
        friends,
        incomingRequests,
        addFriendByUsername,
        respondToRequest,
        removeFriend,
        refreshSocial,
        loading
    };
};

