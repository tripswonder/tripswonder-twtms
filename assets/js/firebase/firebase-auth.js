// =========================================
// Firebase Authentication
// =========================================

import {

    auth

} from "./firebase-config.js";

import {

    signInWithEmailAndPassword,

    createUserWithEmailAndPassword,

    signOut,

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// =========================================
// LOGIN
// =========================================

export async function login(email, password) {

    return await signInWithEmailAndPassword(

        auth,

        email,

        password

    );

}


// =========================================
// REGISTER
// =========================================

export async function register(email, password) {

    return await createUserWithEmailAndPassword(

        auth,

        email,

        password

    );

}


// =========================================
// LOGOUT
// =========================================

export async function logout() {

    return await signOut(auth);

}


// =========================================
// AUTH LISTENER
// =========================================

export function authListener(callback) {

    return onAuthStateChanged(

        auth,

        callback

    );

}
