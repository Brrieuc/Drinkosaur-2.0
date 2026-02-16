/// <reference path="./firebase.d.ts" />

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  query, where, getDocs, updateDoc, arrayUnion,
  onSnapshot, deleteDoc, arrayRemove, addDoc, orderBy, deleteField
} from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";


const firebaseConfig = {
  apiKey: "AIzaSyBGkKn2DBlD0HLmI3Smc10lJF143Co2_Ew",
  authDomain: "drinkosaur-5cebe.firebaseapp.com",
  projectId: "drinkosaur-5cebe",
  storageBucket: "drinkosaur-5cebe.firebasestorage.app",
  messagingSenderId: "999271625766",
  appId: "1:999271625766:web:b4104448736a297fc7e2e7",
  measurementId: "G-38DLX5ZFKD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Robust initialization for Messaging to prevent crashes on unsupported browsers (old iOS/Safari)
let messaging: any = null;
if (typeof window !== 'undefined') {
  // Use isSupported() promise to safely check for messaging support
  // Note: we export it as a let/variable that will be populated if supported
  isSupported().then(supported => {
    if (supported) {
      try {
        messaging = getMessaging(app);
      } catch (err) {
        console.warn('Firebase Messaging initialization failed:', err);
      }
    }
  }).catch(err => {
    console.warn('Firebase Messaging support check failed:', err);
  });
}

const googleProvider = new GoogleAuthProvider();

// Force account selection to refresh session handling
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  auth, db, storage, googleProvider, signInWithPopup, signInAnonymously, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc,
  arrayUnion, onSnapshot, deleteDoc, arrayRemove, addDoc, orderBy, deleteField,
  ref, uploadString, getDownloadURL,
  messaging, getToken, onMessage
};

