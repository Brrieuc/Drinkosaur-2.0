
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut } from "firebase/auth";
import {
  getFirestore, doc, setDoc, getDoc, collection,
  query, where, getDocs, updateDoc, arrayUnion,
  onSnapshot, deleteDoc, arrayRemove
} from "firebase/firestore";

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
const googleProvider = new GoogleAuthProvider();
// Force account selection to refresh session handling
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  auth, db, googleProvider, signInWithPopup, signInWithRedirect, signOut,
  doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc,
  arrayUnion, onSnapshot, deleteDoc, arrayRemove
};
