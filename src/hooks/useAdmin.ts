import { useState } from 'react';
import { UserProfile, Drink } from '../types';
import { db, collection, getDocs, doc, updateDoc, getDoc } from '../firebase';

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

    // Update specific fields of a user
    const adminUpdateUser = async (uid: string, updates: Partial<UserProfile>): Promise<boolean> => {
        setLoading(true);
        try {
            const userRef = doc(db, "users", uid);
            await updateDoc(userRef, updates);
            console.log(`[Admin] Updated user ${uid}`, updates);
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
            // Drinks are stored in a single document 'drinks/{uid}' with a 'list' field
            // We verify if the document exists first
            const drinksDocRef = doc(db, "drinks", uid);
            const docSnap = await getDoc(drinksDocRef);

            if (docSnap.exists()) {
                // We clear the list instead of deleting the doc to keep structure
                await updateDoc(drinksDocRef, { list: [] });
                console.log(`[Admin] Wiped drinks for ${uid}`);
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

    // Toggle Ban Status
    const adminToggleBan = async (uid: string, currentStatus: boolean | undefined): Promise<boolean> => {
        const newStatus = !currentStatus;
        if (newStatus && !window.confirm("Ban this user? They will lose access.")) return false;

        return await adminUpdateUser(uid, { isBanned: newStatus });
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
            const newDrinks = currentDrinks.filter(d => d.id !== drinkId);
            const docRef = doc(db, "drinks", uid);
            await updateDoc(docRef, { list: newDrinks });
            console.log(`[Admin] Deleted drink ${drinkId} for ${uid}`);
            return true;
        } catch (err: any) {
            console.error("[Admin] Delete drink failed:", err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        adminGetAllUsers,
        adminUpdateUser,
        adminWipeDrinks,
        adminToggleBan,
        adminGetUserDrinks,
        adminUpdateDrink,
        adminDeleteDrink
    };
};
