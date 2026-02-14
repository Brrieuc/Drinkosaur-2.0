/// <reference path="../firebase.d.ts" />

import { useState, useEffect, useCallback } from 'react';
import { db, doc, updateDoc, arrayUnion, query, where, collection, getDocs, onSnapshot, arrayRemove, addDoc, getDoc } from '../firebase';
import { useAuth } from './useAuth';
import { FriendGroup, FriendStatus } from '../types';

export const useGroups = () => {
    const { user: authUser } = useAuth();
    const [groups, setGroups] = useState<FriendGroup[]>([]);
    const [groupInvites, setGroupInvites] = useState<FriendGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authUser) {
            setGroups([]);
            setGroupInvites([]);
            setLoading(false);
            return;
        }

        // 1. Listen to groups where user is a member
        const groupsQuery = query(
            collection(db, "groups"),
            where("memberIds", "array-contains", authUser.uid)
        );
        const unsubscribeGroups = onSnapshot(groupsQuery, (snap: any) => {
            const list: FriendGroup[] = [];
            snap.forEach((doc: any) => {
                list.push({ id: doc.id, ...doc.data() } as FriendGroup);
            });
            setGroups(list);
            setLoading(false);
        });

        // 2. Listen to group invitations
        const invitesQuery = query(
            collection(db, "groups"),
            where("pendingInviteIds", "array-contains", authUser.uid)
        );
        const unsubscribeInvites = onSnapshot(invitesQuery, (snap: any) => {
            const list: FriendGroup[] = [];
            snap.forEach((doc: any) => {
                list.push({ id: doc.id, ...doc.data() } as FriendGroup);
            });
            setGroupInvites(list);
        });

        return () => {
            unsubscribeGroups();
            unsubscribeInvites();
        };
    }, [authUser]);

    const createGroup = useCallback(async (name: string, friendIds: string[], icon?: string) => {
        if (!authUser) throw new Error("Not logged in");
        if (!name.trim()) throw new Error("Group name required");

        const groupData = {
            name: name.trim(),
            icon: icon || null,
            creatorId: authUser.uid,
            memberIds: [authUser.uid], // Creator is always the first member
            pendingInviteIds: friendIds.filter(id => id !== authUser.uid),
            createdAt: Date.now(),
            memberListPublic: true,
            showInGlobalRanking: true
        };

        const docRef = await addDoc(collection(db, "groups"), groupData);
        return docRef.id;
    }, [authUser]);

    const acceptGroupInvite = useCallback(async (groupId: string) => {
        if (!authUser) return;
        const groupRef = doc(db, "groups", groupId);
        await updateDoc(groupRef, {
            memberIds: arrayUnion(authUser.uid),
            pendingInviteIds: arrayRemove(authUser.uid)
        });
    }, [authUser]);

    const declineGroupInvite = useCallback(async (groupId: string) => {
        if (!authUser) return;
        const groupRef = doc(db, "groups", groupId);
        await updateDoc(groupRef, {
            pendingInviteIds: arrayRemove(authUser.uid)
        });
    }, [authUser]);

    const leaveGroup = useCallback(async (groupId: string) => {
        if (!authUser) return;
        const groupRef = doc(db, "groups", groupId);
        await updateDoc(groupRef, {
            memberIds: arrayRemove(authUser.uid)
        });
    }, [authUser]);

    const inviteMemberToGroup = useCallback(async (groupId: string, friendIds: string[]) => {
        if (!authUser) return;
        const groupRef = doc(db, "groups", groupId);
        await updateDoc(groupRef, {
            pendingInviteIds: arrayUnion(...friendIds)
        });
    }, [authUser]);

    const updateGroupIcon = useCallback(async (groupId: string, icon: string) => {
        if (!authUser) return;
        const groupRef = doc(db, "groups", groupId);
        await updateDoc(groupRef, { icon });
    }, [authUser]);

    const updateGroupSettings = useCallback(async (groupId: string, settings: { showInGlobalRanking?: boolean; memberListPublic?: boolean }) => {
        if (!authUser) return;
        const groupRef = doc(db, "groups", groupId);
        await updateDoc(groupRef, settings);
    }, [authUser]);

    const fetchGroupMembersStatus = useCallback(async (groupId: string): Promise<FriendStatus[]> => {
        const groupSnap = await getDoc(doc(db, "groups", groupId));
        if (!groupSnap.exists()) return [];

        const memberIds = groupSnap.data().memberIds as string[];
        if (memberIds.length === 0) return [];

        const statusQuery = query(
            collection(db, "live_status"),
            where("__name__", "in", memberIds.slice(0, 30)) // Firebase limit
        );
        const statusSnap = await getDocs(statusQuery);
        const statuses: FriendStatus[] = [];
        statusSnap.forEach((doc: any) => {
            statuses.push({ uid: doc.id, ...doc.data() } as FriendStatus);
        });

        return statuses.sort((a, b) => b.currentBac - a.currentBac);
    }, []);

    const fetchGroupPendingInvites = useCallback(async (groupId: string): Promise<any[]> => {
        const groupSnap = await getDoc(doc(db, "groups", groupId));
        if (!groupSnap.exists()) return [];

        const pendingIds = groupSnap.data().pendingInviteIds as string[];
        if (!pendingIds || pendingIds.length === 0) return [];

        const q = query(collection(db, "users"), where("__name__", "in", pendingIds.slice(0, 30)));
        const snapshot = await getDocs(q);
        const users: any[] = [];
        snapshot.forEach((doc: any) => {
            users.push({ uid: doc.id, ...doc.data() });
        });
        return users;
    }, []);

    return {
        groups,
        groupInvites,
        loading,
        createGroup,
        acceptGroupInvite,
        declineGroupInvite,
        leaveGroup,
        inviteMemberToGroup,
        fetchGroupMembersStatus,
        updateGroupIcon,
        updateGroupSettings,
        fetchGroupPendingInvites
    };
};
