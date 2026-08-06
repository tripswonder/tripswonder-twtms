// =========================================
// Firestore Database
// =========================================

import {

    db

} from "./firebase-config.js";

import {

    collection,

    doc,

    getDoc,

    getDocs,

    addDoc,

    updateDoc,

    deleteDoc,

    setDoc,

    query,

    where,

    orderBy

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// =========================================
// Export Firestore Functions
// =========================================

export {

    db,

    collection,

    doc,

    getDoc,

    getDocs,

    addDoc,

    updateDoc,

    deleteDoc,

    setDoc,

    query,

    where,

    orderBy

};
