// =========================================
// Firebase SDK Imports
// =========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";

import {
    getFunctions
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";


// =========================================
// Firebase Configuration
// =========================================

const firebaseConfig = {

    apiKey: "AIzaSyBpUXl_hgMmytwA5Y9b9eJqUtH54Z31EfY",

    authDomain: "twtms-d998e.firebaseapp.com",

    projectId: "twtms-d998e",

    storageBucket: "twtms-d998e.firebasestorage.app",

    messagingSenderId: "810095358692",

    appId: "1:810095358692:web:0ff158ee3feb4e7fd172f1"

};


// =========================================
// Initialize Firebase
// =========================================

const app =
    initializeApp(firebaseConfig);

const auth =
    getAuth(app);

const db =
    getFirestore(app);

const storage =
    getStorage(app);

const functions =
    getFunctions(app);


// =========================================
// Export
// =========================================

export {

    app,

    auth,

    db,

    storage,

    functions

};