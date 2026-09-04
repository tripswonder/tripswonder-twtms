/*************************************************
 * ================================================
 * TWTMS v2
 * Firebase Login Module
 * assets/js/auth/login.js
 * ================================================
 */

import { login } from "../firebase/firebase-auth.js";

import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// ================================================
// DOM
// ================================================

const form =
    document.getElementById("loginForm");

const username =
    document.getElementById("username");

const password =
    document.getElementById("password");

const remember =
    document.getElementById("rememberMe");

const button =
    form.querySelector("button[type='submit']");

const togglePassword =
    document.getElementById("togglePassword");

const forgotPassword =
    document.querySelector(".forgot-password");


// ================================================
// STATE
// ================================================

let processing = false;


// ================================================
// URL CONTEXT
// ================================================

const loginParams =
    new URLSearchParams(
        window.location.search
    );

const emailFromUrl =
    (loginParams.get("email") || "")
        .trim()
        .toLowerCase();

const pendingBookingReference =
    (loginParams.get("booking") || "")
        .trim();

const loginSource =
    (loginParams.get("from") || "")
        .trim()
        .toLowerCase();


// ================================================
// PASSWORD TOGGLE
// ================================================

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        () => {

            const icon =
                togglePassword.querySelector("i");


            if (
                password.type === "password"
            ) {

                password.type = "text";


                if (icon) {

                    icon.classList.remove(
                        "fa-eye"
                    );

                    icon.classList.add(
                        "fa-eye-slash"
                    );

                }


                togglePassword.setAttribute(
                    "aria-label",
                    "Hide Password"
                );


            } else {

                password.type = "password";


                if (icon) {

                    icon.classList.remove(
                        "fa-eye-slash"
                    );

                    icon.classList.add(
                        "fa-eye"
                    );

                }


                togglePassword.setAttribute(
                    "aria-label",
                    "Show Password"
                );

            }

        }
    );

}


// ================================================
// EMAIL PREFILL
// ================================================

const savedEmail =
    localStorage.getItem(
        "rememberEmail"
    );


/*
 * Priority:
 * 1. Email passed from registration
 * 2. Remembered email
 */

if (
    emailFromUrl &&
    username
) {

    username.value =
        emailFromUrl;

} else if (
    savedEmail &&
    username
) {

    username.value =
        savedEmail;


    if (remember) {

        remember.checked =
            true;

    }

}


// ================================================
// LOGIN
// ================================================

form.addEventListener(
    "submit",
    async (e) => {

        e.preventDefault();


        if (processing) {

            return;

        }


        const email =
            username.value
                .trim()
                .toLowerCase();

        const userPassword =
            password.value;


        // --------------------------------------------
        // VALIDATION
        // --------------------------------------------

        if (!email) {

            alert(
                "Please enter your email address."
            );

            username.focus();

            return;

        }


        if (!userPassword) {

            alert(
                "Please enter your password."
            );

            password.focus();

            return;

        }


        processing =
            true;

        button.disabled =
            true;

        button.innerHTML =
            `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Signing In...
            `;


        try {

            // ========================================
            // FIREBASE AUTHENTICATION
            // ========================================

            const userCredential =
                await login(
                    email,
                    userPassword
                );


            const user =
                userCredential.user;


            console.log(
                "Firebase login successful:",
                user.uid
            );


            // ========================================
            // GET FIRESTORE PROFILE
            // ========================================

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnapshot =
                await getDoc(
                    userRef
                );


            // ========================================
            // PROFILE NOT FOUND
            // ========================================

            if (
                !userSnapshot.exists()
            ) {

                await signOut(
                    auth
                );


                alert(
                    "Your account profile was not found. Please contact the administrator."
                );


                return;

            }


            const userData =
                userSnapshot.data();


            console.log(
                "User profile:",
                userData
            );


            // ========================================
            // ACCOUNT STATUS
            // ========================================

            const status =
                userData.status ||
                "active";


            if (
                status !== "active"
            ) {

                await signOut(
                    auth
                );


                alert(
                    "Your account is currently inactive. Please contact Trips Wonder Travel & Tours."
                );


                return;

            }


            // ========================================
            // ROLE
            // ========================================

            const role =
                userData.role ||
                "client";


            console.log(
                "User role:",
                role
            );


            // ========================================
            // CLIENT EMAIL VERIFICATION
            // ========================================

            /*
             * IMPORTANT:
             *
             * Owner/Admin accounts continue normally.
             *
             * Only customer/client accounts are required
             * to verify their email before entering the
             * protected customer website.
             */

            if (
                role === "client" &&
                user.emailVerified !== true
            ) {

                console.warn(
                    "LOGIN BLOCKED: EMAIL NOT VERIFIED"
                );


                await signOut(
                    auth
                );


                alert(
                    "Please verify your email first. Open the verification email from Trips Wonder, click the verification link, then sign in again."
                );


                return;

            }


            // ========================================
            // REMEMBER EMAIL
            // ========================================

            if (
                remember &&
                remember.checked
            ) {

                localStorage.setItem(
                    "rememberEmail",
                    email
                );


            } else {

                localStorage.removeItem(
                    "rememberEmail"
                );

            }


            // ========================================
            // STORE BOOKING CONTEXT TEMPORARILY
            // ========================================

            /*
             * We are NOT linking the booking yet.
             *
             * We only preserve the reference so the next
             * step can securely link it after Firestore
             * Rules are updated.
             */

            if (
                role === "client" &&
                loginSource === "booking" &&
                pendingBookingReference
            ) {

                sessionStorage.setItem(
                    "pendingBookingReference",
                    pendingBookingReference
                );

            }


            // ========================================
            // REDIRECT BASED ON ROLE
            // ========================================

            if (
                role === "owner" ||
                role === "admin"
            ) {

                console.log(
                    "Redirecting to Admin Dashboard..."
                );


                window.location.href =
                    "/pages/admin/dashboard.html";


                return;

            }


            if (
                role === "client"
            ) {

                console.log(
                    "Redirecting to Customer Home..."
                );


                window.location.href =
                    "/pages/customer/home.html";


                return;

            }


            // ========================================
            // UNKNOWN ROLE
            // ========================================

            await signOut(
                auth
            );


            alert(
                "Your account role is not configured correctly. Please contact the administrator."
            );


        } catch (error) {

            console.error(
                "LOGIN ERROR:",
                error
            );


            // ========================================
            // FIREBASE ERRORS
            // ========================================

            let message =
                "Unable to sign in. Please try again.";


            switch (
                error.code
            ) {

                case "auth/invalid-credential":

                    message =
                        "Incorrect email or password.";

                    break;


                case "auth/user-not-found":

                    message =
                        "No account was found with this email.";

                    break;


                case "auth/wrong-password":

                    message =
                        "Incorrect password.";

                    break;


                case "auth/invalid-email":

                    message =
                        "Please enter a valid email address.";

                    break;


                case "auth/user-disabled":

                    message =
                        "This account has been disabled.";

                    break;


                case "auth/too-many-requests":

                    message =
                        "Too many login attempts. Please try again later.";

                    break;


                case "permission-denied":

                    message =
                        "Unable to access your account profile. Please contact the administrator.";

                    break;

            }


            alert(
                message
            );


        } finally {

            processing =
                false;

            button.disabled =
                false;

            button.innerHTML =
                `
                    <i class="fa-solid fa-right-to-bracket"></i>
                    <span>Login</span>
                `;

        }

    }
);


// ================================================
// FORGOT PASSWORD
// ================================================

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        (e) => {

            e.preventDefault();


            alert(
                "Password reset will be added next."
            );

        }
    );

}


// ================================================
// DEBUG
// ================================================

console.log(
    "TWTMS AUTH LOGIN MODULE LOADED"
);