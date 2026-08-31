// =========================================================
// Trips Wonder
// Firebase Authentication Service
// =========================================================

import {
    auth
} from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updatePassword,
    updateEmail,
    reauthenticateWithCredential,
    EmailAuthProvider,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// =========================================================
// LOGIN
// =========================================================

export async function login(email, password) {

    if (!email || !password) {
        throw new Error(
            "Email and password are required."
        );
    }

    return await signInWithEmailAndPassword(
        auth,
        email,
        password
    );
}


// =========================================================
// REGISTER
// =========================================================

export async function register(email, password) {

    if (!email || !password) {
        throw new Error(
            "Email and password are required."
        );
    }

    return await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );
}


// =========================================================
// LOGOUT
// =========================================================

export async function logout() {

    return await signOut(auth);
}


// =========================================================
// AUTH LISTENER
// =========================================================

export function authListener(callback) {

    return onAuthStateChanged(
        auth,
        callback
    );
}


// =========================================================
// GET CURRENT USER
// =========================================================

export function getCurrentUser() {

    return auth.currentUser;
}


// =========================================================
// CHANGE PASSWORD
// =========================================================
//
// Flow:
//
// Current Password
//        ↓
// Re-authenticate Firebase User
//        ↓
// Update Password
//
// =========================================================

export async function changePassword(
    currentPassword,
    newPassword
) {

    const user =
        auth.currentUser;


    if (!user) {

        throw new Error(
            "No authenticated user found."
        );

    }


    if (!user.email) {

        throw new Error(
            "This account does not have an email/password authentication method."
        );

    }


    if (!currentPassword) {

        throw new Error(
            "Current password is required."
        );

    }


    if (!newPassword) {

        throw new Error(
            "New password is required."
        );

    }


    // -----------------------------------------------------
    // Re-authenticate
    // -----------------------------------------------------

    const credential =
        EmailAuthProvider.credential(
            user.email,
            currentPassword
        );


    await reauthenticateWithCredential(
        user,
        credential
    );


    // -----------------------------------------------------
    // Update password
    // -----------------------------------------------------

    await updatePassword(
        user,
        newPassword
    );


    return true;
}


// =========================================================
// CHANGE EMAIL
// =========================================================
//
// Flow:
//
// Current Password
//        ↓
// Re-authenticate Firebase User
//        ↓
// New Email
//        ↓
// Update Firebase Email
//
// =========================================================

export async function changeEmail(
    currentPassword,
    newEmail
) {

    const user =
        auth.currentUser;


    if (!user) {

        throw new Error(
            "No authenticated user found."
        );

    }


    if (!user.email) {

        throw new Error(
            "This account does not have an email/password authentication method."
        );

    }


    if (!currentPassword) {

        throw new Error(
            "Current password is required."
        );

    }


    if (!newEmail) {

        throw new Error(
            "New email address is required."
        );

    }


    // -----------------------------------------------------
    // Normalize email
    // -----------------------------------------------------

    const normalizedEmail =
        newEmail.trim().toLowerCase();


    // -----------------------------------------------------
    // Basic email validation
    // -----------------------------------------------------

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
        !emailPattern.test(
            normalizedEmail
        )
    ) {

        throw new Error(
            "Please enter a valid email address."
        );

    }


    // -----------------------------------------------------
    // Check if same email
    // -----------------------------------------------------

    if (
        normalizedEmail ===
        user.email.toLowerCase()
    ) {

        throw new Error(
            "The new email address is the same as your current email address."
        );

    }


    // -----------------------------------------------------
    // Re-authenticate
    // -----------------------------------------------------

    const credential =
        EmailAuthProvider.credential(
            user.email,
            currentPassword
        );


    await reauthenticateWithCredential(
        user,
        credential
    );


    // -----------------------------------------------------
    // Update Firebase Authentication Email
    // -----------------------------------------------------

    await updateEmail(
        user,
        normalizedEmail
    );


    return {
        success: true,
        email: normalizedEmail
    };
}


// =========================================================
// SEND PASSWORD RESET EMAIL
// =========================================================

export async function sendPasswordReset(
    email
) {

    if (!email) {

        throw new Error(
            "Email address is required."
        );

    }


    const normalizedEmail =
        email.trim().toLowerCase();


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
        !emailPattern.test(
            normalizedEmail
        )
    ) {

        throw new Error(
            "Please enter a valid email address."
        );

    }


    return await sendPasswordResetEmail(
        auth,
        normalizedEmail
    );
}


// =========================================================
// EXPORT AUTH INSTANCE
// =========================================================

export {
    auth
};