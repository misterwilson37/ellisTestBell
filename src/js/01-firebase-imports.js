import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signOut, signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, collection, getDocs, writeBatch, setLogLevel, deleteDoc, getDoc, addDoc, serverTimestamp, query, orderBy, limit, getDocFromServer } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// MODIFIED: Removed refFromURL, which was causing the error.
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll, getMetadata, updateMetadata, getBytes } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";


// ===== module exports (6.0.0) =====
export {
    GoogleAuthProvider,
    addDoc,
    collection,
    deleteDoc,
    deleteObject,
    doc,
    getAuth,
    getBytes,
    getDoc,
    getDocFromServer,
    getDocs,
    getDownloadURL,
    getFirestore,
    getMetadata,
    getStorage,
    initializeApp,
    limit,
    listAll,
    onAuthStateChanged,
    onSnapshot,
    orderBy,
    query,
    ref,
    serverTimestamp,
    setDoc,
    setLogLevel,
    signInAnonymously,
    signInWithPopup,
    signOut,
    updateDoc,
    updateMetadata,
    uploadBytes,
    writeBatch,
};
