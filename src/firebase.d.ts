
declare module 'firebase/app' {
    export function initializeApp(config: any): any;
}

declare module 'firebase/auth' {
    export function getAuth(app?: any): any;
    export class GoogleAuthProvider {
        constructor();
        setCustomParameters(params: any): void;
    }
    export function signInWithPopup(auth: any, provider: any): Promise<any>;
    export function signInAnonymously(auth: any): Promise<any>;
    export function createUserWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
    export function signInWithEmailAndPassword(auth: any, email: string, password: string): Promise<any>;
    export function getRedirectResult(auth: any): Promise<any>;
    export function onAuthStateChanged(auth: any, next: (user: any) => void, error?: (error: any) => void): any;
    export function signOut(auth: any): Promise<void>;
    export function setPersistence(auth: any, persistence: any): Promise<void>;
    export const browserLocalPersistence: any;
    export const browserSessionPersistence: any;
    export interface User {
        uid: string;
        email: string | null;
        displayName: string | null;
        photoURL: string | null;
    }
}

declare module 'firebase/firestore' {
    export function getFirestore(app?: any): any;
    export function doc(db: any, collection: string, ...pathSegments: string[]): any;
    export function setDoc(reference: any, data: any, options?: any): Promise<void>;
    export function getDoc(reference: any): Promise<any>;
    export function updateDoc(reference: any, data: any): Promise<void>;
    export function collection(db: any, path: string): any;
    export function query(collection: any, ...queryConstraints: any[]): any;
    export function where(fieldPath: string, opStr: string, value: any): any;
    export function getDocs(query: any): Promise<any>;
    export function arrayUnion(...elements: any[]): any;
    export function arrayRemove(...elements: any[]): any;
    export function onSnapshot(reference: any, observer: (snapshot: any) => void, error?: (error: any) => void): any;
    export function deleteDoc(reference: any): Promise<void>;
    export function addDoc(reference: any, data: any): Promise<any>;
}

declare module 'firebase/storage' {
    export function getStorage(app?: any): any;
    export function ref(storage: any, path: string): any;
    export function uploadString(reference: any, data: string, format: string): Promise<any>;
    export function getDownloadURL(reference: any): Promise<string>;
}

