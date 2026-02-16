import { useState } from 'react';
import { UserProfile, Drink } from '../types';
import { db, collection, getDocs, doc, updateDoc, getDoc, setDoc, addDoc, deleteField } from '../firebase';

export const useAdmin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all users for the admin list
    // CAUTION: This reads ALL user documents. In a huge app this would need pagination.
    const adminGetAllUsers = async (): Promise<UserProfile[]> => {
        setLoading(true);
        setError(null);
        try {
            const usersRef = collection(db, "users");
            const snapshot = await getDocs(usersRef);
            const users: UserProfile[] = [];
            snapshot.forEach((docSnap: any) => {
                users.push(docSnap.data() as UserProfile);
            });
            console.log(`[Admin] Fetched ${users.length} users`);
            return users;
        } catch (err: any) {
            console.error("[Admin] Error fetching users:", err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Helper to update live status for real-time consistency
    const updateLiveStatus = async (uid: string, userProfile?: UserProfile, drinks?: Drink[]) => {
        try {
            // Need to fetch if not provided
            let profile = userProfile;
            let currentDrinks = drinks;

            if (!profile) {
                const pSnap = await getDoc(doc(db, "users", uid));
                if (pSnap.exists()) profile = pSnap.data() as UserProfile;
            }
            if (!currentDrinks) {
                const dSnap = await getDoc(doc(db, "drinks", uid));
                currentDrinks = dSnap.exists() ? (dSnap.data().list || []) : [];
            }

            if (profile && currentDrinks) {
                // Calculate BAC
                // We need to dynamic import or duplicate logic if we can't import service. 
                // Assuming we can import calculateBac.
                const { calculateBac } = await import('../services/bacService');
                const status = calculateBac(currentDrinks, profile);

                const statusRef = doc(db, "live_status", uid);

                // We push the FULL data expected by useSocial listeners
                await setDoc(statusRef, {
                    displayName: profile.username || profile.displayName || 'User',
                    photoURL: profile.customPhotoURL || profile.photoURL || '',
                    currentBac: status.currentBac,
                    statusMessage: status.statusMessage,
                    color: status.color,
                    lastUpdate: Date.now(),
                    weightKg: profile.weightKg || 70,
                    gender: profile.gender || 'male',
                    drinkingSpeed: profile.drinkingSpeed || 'average',
                    habitLevel: profile.habitLevel || 'average',
                    drinks: currentDrinks.filter(d => d.timestamp > Date.now() - 24 * 60 * 60 * 1000), // Only last 24h
                    drinkosaurPassConfig: profile.drinkosaurPassConfig || null
                }, { merge: true });
            }
        } catch (err) {
            console.error("[Admin] Failed to update live status:", err);
        }
    };

    // Update specific fields of a user
    const adminUpdateUser = async (uid: string, updates: Partial<UserProfile>): Promise<boolean> => {
        setLoading(true);
        try {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, updates);
            console.log(`[Admin] Updated user ${uid}`, updates);

            // Force update live status
            await updateLiveStatus(uid, { ...updates } as any); // Partial update triggers fetch inside helper if needed? 
            // Actually, we need the full profile to calc BAC. 
            // Let's just call updateLiveStatus(uid) and let it fetch fresh data to be safe.
            await updateLiveStatus(uid);

            return true;
        } catch (err: any) {
            console.error("[Admin] Update failed:", err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Wipe all drinks for a user
    const adminWipeDrinks = async (uid: string): Promise<boolean> => {
        if (!window.confirm("ARE YOU SURE? This will permanently delete ALL drinks for this user. This cannot be undone.")) {
            return false;
        }

        setLoading(true);
        try {
            const drinksDocRef = doc(db, "drinks", uid);
            const docSnap = await getDoc(drinksDocRef);

            if (docSnap.exists()) {
                await updateDoc(drinksDocRef, { list: [] });
                console.log(`[Admin] Wiped drinks for ${uid}`);

                // Update live status (BAC will be 0)
                await updateLiveStatus(uid, undefined, []);
            } else {
                console.log(`[Admin] No drinks document found for ${uid}`);
            }

            return true;
        } catch (err: any) {
            console.error("[Admin] Wipe drinks failed:", err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Fetch user drinks
    const adminGetUserDrinks = async (uid: string): Promise<Drink[]> => {
        setLoading(true);
        try {
            const docRef = doc(db, "drinks", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return (docSnap.data().list || []) as Drink[];
            }
            return [];
        } catch (err: any) {
            console.error("[Admin] Get drinks failed:", err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Update a specific drink
    const adminUpdateDrink = async (uid: string, updatedDrink: Drink, currentDrinks: Drink[]): Promise<boolean> => {
        setLoading(true);
        try {
            const newDrinks = currentDrinks.map(d => d.id === updatedDrink.id ? updatedDrink : d);
            const docRef = doc(db, "drinks", uid);
            await updateDoc(docRef, { list: newDrinks });
            console.log(`[Admin] Updated drink ${updatedDrink.id} for ${uid}`);

            // Sync Live Status
            await updateLiveStatus(uid, undefined, newDrinks);

            return true;
        } catch (err: any) {
            console.error("[Admin] Update drink failed:", err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Delete a specific drink
    const adminDeleteDrink = async (uid: string, drinkId: string, currentDrinks: Drink[]): Promise<boolean> => {
        if (!window.confirm("Delete this drink?")) return false;
        setLoading(true);
        try {
            // 1. Move to deleted (optional for single delete too?) - let's be consistent and add history
            // But for now, let's keep original behavior OR upgrade it. 
            // Let's upgrade it to use soft-delete logic too so restoration works for single deletes.
            const drinkToDelete = currentDrinks.find(d => d.id === drinkId);
            if (drinkToDelete) {
                const deletedRef = doc(db, "deleted_drinks", uid);
                const deletedSnap = await getDoc(deletedRef);
                let currentDeleted = deletedSnap.exists() ? (deletedSnap.data().list || []) : [];
                await setDoc(deletedRef, {
                    list: [...currentDeleted, { ...drinkToDelete, deletedAt: Date.now() }]
                }, { merge: true });
            }

            const newDrinks = currentDrinks.filter(d => d.id !== drinkId);
            const docRef = doc(db, "drinks", uid);
            await updateDoc(docRef, { list: newDrinks });
            console.log(`[Admin] Deleted drink ${drinkId} for ${uid}`);

            await updateLiveStatus(uid, undefined, newDrinks);

            return true;
        } catch (err: any) {
            console.error("[Admin] Delete drink failed:", err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // NEW: Send Admin Message
    const adminSendMessage = async (uid: string, title: string, message: string): Promise<boolean> => {
        setLoading(true);
        try {
            const notifRef = collection(db, `users/${uid}/notifications`);
            await addDoc(notifRef, {
                title,
                message,
                timestamp: Date.now(),
                read: false,
                type: 'admin_message'
            });
            console.log(`[Admin] Message sent to ${uid}`);
            return true;
        } catch (err: any) {
            console.error("[Admin] Failed to send message:", err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Delete multiple drinks
    const adminDeleteDrinks = async (uid: string, drinkIds: string[], currentDrinks: Drink[]): Promise<boolean> => {
        setLoading(true);
        try {
            // 1. Identify drinks to delete
            const drinksToDelete = currentDrinks.filter(d => drinkIds.includes(d.id));
            const remainingDrinks = currentDrinks.filter(d => !drinkIds.includes(d.id));

            // 2. Add to deleted_drinks history
            if (drinksToDelete.length > 0) {
                const deletedRef = doc(db, "deleted_drinks", uid);
                const deletedSnap = await getDoc(deletedRef);
                let currentDeleted = deletedSnap.exists() ? (deletedSnap.data().list || []) : [];

                // Add timestamp to deletion record
                const newDeleted = drinksToDelete.map(d => ({ ...d, deletedAt: Date.now() }));

                await setDoc(deletedRef, {
                    list: [...currentDeleted, ...newDeleted]
                }, { merge: true });
            }

            // 3. Update main drinks list
            const drinksRef = doc(db, "drinks", uid);
            await updateDoc(drinksRef, { list: remainingDrinks });

            // 4. Update Live Status
            await updateLiveStatus(uid, undefined, remainingDrinks);

            console.log(`[Admin] Deleted ${drinkIds.length} drinks for ${uid}`);
            return true;
        } catch (err: any) {
            console.error("[Admin] Delete drinks failed:", err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Restore a deleted drink
    const adminRestoreDrink = async (uid: string, drink: Drink, currentLiveDrinks: Drink[]): Promise<boolean> => {
        setLoading(true);
        try {
            // 1. Remove from deleted_drinks
            const deletedRef = doc(db, "deleted_drinks", uid);
            const deletedSnap = await getDoc(deletedRef);
            if (deletedSnap.exists()) {
                const currentDeleted = deletedSnap.data().list || [];
                // Allow matching by ID even if other fields handled differently
                const newDeleted = currentDeleted.filter((d: any) => d.id !== drink.id);
                await updateDoc(deletedRef, { list: newDeleted });
            }

            // 2. Add back to drinks list (remove extra deletedAt field if present)
            const { deletedAt, ...restoredDrink } = drink as any;
            const newDrinksList = [...currentLiveDrinks, restoredDrink];

            const drinksRef = doc(db, "drinks", uid);
            await updateDoc(drinksRef, { list: newDrinksList });

            // 3. Update Live Status
            await updateLiveStatus(uid, undefined, newDrinksList);

            return true;
        } catch (err: any) {
            console.error("[Admin] Restore failed:", err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Get deleted drinks
    const adminGetDeletedDrinks = async (uid: string): Promise<Drink[]> => {
        try {
            const snap = await getDoc(doc(db, "deleted_drinks", uid));
            if (snap.exists()) {
                return (snap.data().list || []) as Drink[];
            }
            return [];
        } catch (err) {
            console.error(err);
            return [];
        }
    };

    // Toggle Ban Status with Reason
    const adminBanUser = async (uid: string, reason: string): Promise<boolean> => {
        return await adminUpdateUser(uid, {
            isBanned: true,
            banReason: reason,
            banTimestamp: Date.now(),
            banAppealMessage: deleteField(),
            banAppealTimestamp: deleteField()
        } as any);
    };

    const adminUnbanUser = async (uid: string): Promise<boolean> => {
        return await adminUpdateUser(uid, {
            isBanned: false,
            banReason: deleteField(),
            banTimestamp: deleteField(),
            banAppealMessage: deleteField(),
            banAppealTimestamp: deleteField()
        } as any);
    };

    const adminDismissAppeal = async (uid: string): Promise<boolean> => {
        return await adminUpdateUser(uid, {
            banAppealMessage: deleteField(),
            banAppealTimestamp: deleteField()
        } as any);
    };

    return {
        loading,
        error,
        adminGetAllUsers,
        adminUpdateUser,
        adminWipeDrinks,
        adminGetUserDrinks,
        adminUpdateDrink,
        adminDeleteDrink,
        adminSendMessage,
        // New
        adminDeleteDrinks,
        adminRestoreDrink,
        adminGetDeletedDrinks,
        adminBanUser,
        adminUnbanUser,
        adminDismissAppeal
    };
};
