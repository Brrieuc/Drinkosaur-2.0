
// Type definitions for Firebase modules loaded via CDN (esm.sh)
// This file exists to silence TypeScript errors in the IDE when node_modules are not installed.

declare module 'firebase/app' {
    export function initializeApp(config: any): any;
}

declare module 'firebase/auth' {
    export function getAuth(app?: any): any;
    export class GoogleAuthProvider { }
    export function signInWithPopup(auth: any, provider: any): Promise<any>;
    export function signOut(auth: any): Promise<void>;
    export function onAuthStateChanged(auth: any, nextOrObserver: (user: any) => void, error?: (error: any) => void, completed?: () => void): () => void;
    export interface User {
        uid: string;
        displayName: string | null;
        email: string | null;
        photoURL: string | null;
    }
}

declare module 'firebase/firestore' {
    export function getFirestore(app?: any): any;
    export function doc(firestore: any, path: string, ...pathSegments: string[]): any;
    export function getDoc(reference: any): Promise<any>;
    export function setDoc(reference: any, data: any, options?: any): Promise<void>;
    // Add other necessary exports as encountered
}
