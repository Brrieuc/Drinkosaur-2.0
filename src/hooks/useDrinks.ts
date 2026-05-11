
import { useState, useEffect } from 'react';
import { Drink } from '../types';
import { useAuthContext } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, db } from '../firebase';

export const useDrinks = () => {
    // Local state
    const [drinks, setDrinksState] = useState<Drink[]>(() => {
        try {
            const saved = window.localStorage.getItem('drinkosaur_drinks');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to parse drinks", e);
            return [];
        }
    });

    // Guard: block user writes until the initial Firestore sync completes,
    // to avoid local state overwriting remote data mid-flight.
    const [hasSyncedFromFirestore, setHasSyncedFromFirestore] = useState(false);

    const { user: authUser } = useAuthContext();

    // Sync with Firestore when auth user changes
    useEffect(() => {
        if (!authUser) {
            setHasSyncedFromFirestore(false);
            return;
        }

        setHasSyncedFromFirestore(false);

        const fetchDrinks = async () => {
            try {
                const docRef = doc(db, "drinks", authUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const remoteData = docSnap.data();
                    if (remoteData.list) {
                        setDrinksState(remoteData.list);
                        try {
                            window.localStorage.setItem('drinkosaur_drinks', JSON.stringify(remoteData.list));
                        } catch (e) {
                            console.warn("Storage Blocked:", e);
                        }
                    }
                } else {
                    // No remote data yet — push local drinks to initialise the doc
                    setDrinksState(prev => {
                        setDoc(docRef, { list: prev }).catch(e =>
                            console.error("Error initialising drinks in Firestore:", e)
                        );
                        return prev;
                    });
                }
            } catch (e) {
                console.error("Error fetching drinks:", e);
            } finally {
                setHasSyncedFromFirestore(true);
            }
        };

        fetchDrinks();
    }, [authUser]);

    // Wrapper for setDrinks that updates both LocalStorage and Firestore
    const setDrinks = (val: Drink[] | ((prev: Drink[]) => Drink[])) => {
        // Don't allow writes until initial Firestore sync is done
        if (authUser && !hasSyncedFromFirestore) {
            console.warn("useDrinks: ignoring write — Firestore sync not yet complete");
            return;
        }

        setDrinksState(prev => {
            const newDrinks = val instanceof Function ? val(prev) : val;

            // Update Local Storage
            try {
                window.localStorage.setItem('drinkosaur_drinks', JSON.stringify(newDrinks));
            } catch (e) {
                console.warn("Storage Blocked:", e);
            }

            // Update Firestore if authenticated
            if (authUser) {
                setDoc(doc(db, "drinks", authUser.uid), { list: newDrinks }).catch(e =>
                    console.error("Error saving drinks to Firestore:", e)
                );
            }

            return newDrinks;
        });
    };

    return [drinks, setDrinks] as const;
};
