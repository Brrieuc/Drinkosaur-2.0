
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

    const { user: authUser } = useAuthContext();

    // Sync with Firestore when auth user changes
    useEffect(() => {
        const fetchDrinks = async () => {
            if (authUser) {
                try {
                    const docRef = doc(db, "drinks", authUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        // Merging remote data with local if needed, or fully overwriting
                        // For simplicity, let's say remote is source of truth if it exists
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
                        // If no remote data, upload current local drinks to init it
                        await setDoc(docRef, { list: drinks });
                    }
                } catch (e) {
                    console.error("Error fetching drinks:", e);
                }
            }
        };

        fetchDrinks();
    }, [authUser]);

    // Wrapper for setDrinks that updates both LocalStorage and Firestore
    const setDrinks = (val: Drink[] | ((prev: Drink[]) => Drink[])) => {
        setDrinksState(prev => {
            const newDrinks = val instanceof Function ? val(prev) : val;

            // 2. Update Local Storage
            try {
                window.localStorage.setItem('drinkosaur_drinks', JSON.stringify(newDrinks));
            } catch (e) {
                console.warn("Storage Blocked:", e);
            }

            // 3. Update Firestore if auth
            if (authUser) {
                try {
                    setDoc(doc(db, "drinks", authUser.uid), { list: newDrinks });
                } catch (e) {
                    console.error("Error saving drinks to firestore:", e);
                }
            }

            return newDrinks;
        });
    };

    return [drinks, setDrinks] as const;
};
