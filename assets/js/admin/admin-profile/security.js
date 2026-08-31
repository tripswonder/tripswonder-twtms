/* =========================================================
   TWTMS v2
   TRIPS WONDER - ADMIN PROFILE SECURITY
   =========================================================
   Handles:

   - Firebase Authentication
   - Change Email Address
   - Change Password
   - Re-authentication
   - Email verification status
   - Password validation
   - Show / Hide Password
   - Security status
   - Firebase error handling

   IMPORTANT:
   This module is loaded inside admin-profile.html.
   It does NOT control Admin Profile navigation.
   ========================================================= */

"use strict";


/* =========================================================
   FIREBASE STATE
========================================================= */

let securityAuth = null;
let securityUser = null;

let securityFirebaseReady = false;

let emailChangeRunning = false;
let passwordChangeRunning = false;


/* =========================================================
   FIREBASE AUTH MODULE
========================================================= */

let firebaseOnAuthStateChanged = null;

let firebaseSignInWithEmailAndPassword = null;
let firebaseReauthenticateWithCredential = null;
let firebaseEmailAuthProvider = null;

let firebaseVerifyBeforeUpdateEmail = null;
let firebaseUpdateEmail = null;

let firebaseUpdatePassword = null;


/* =========================================================
   FIREBASE SDK
========================================================= */

const FIREBASE_AUTH_URL =
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


/* =========================================================
   INITIALIZE SECURITY MODULE
========================================================= */

async function initializeSecurity() {

    console.log(
        "TWTMS Security module initializing..."
    );


    /*
     * Initialize UI first.
     */

    initializePasswordToggles();

    initializePasswordValidation();

    initializeEmailForm();

    initializePasswordForm();


    /*
     * Firebase initialization.
     */

    await initializeSecurityFirebase();
}


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

async function initializeSecurityFirebase() {

    try {

        /*
         * Use the existing Firebase configuration.
         *
         * This must be the same firebase-config.js
         * already used by admin-profile.js.
         */

        const firebaseConfig =
            await import(
                "../../firebase/firebase-config.js"
            );


        securityAuth =
            firebaseConfig.auth;


        if (!securityAuth) {

            throw new Error(
                "Firebase Auth instance was not found."
            );
        }


        /*
         * Load Firebase Authentication functions.
         */

        const authModule =
            await import(
                FIREBASE_AUTH_URL
            );


        firebaseOnAuthStateChanged =
            authModule.onAuthStateChanged;


        firebaseSignInWithEmailAndPassword =
            authModule.signInWithEmailAndPassword;


        firebaseReauthenticateWithCredential =
            authModule.reauthenticateWithCredential;


        firebaseEmailAuthProvider =
            authModule.EmailAuthProvider;


        firebaseVerifyBeforeUpdateEmail =
            authModule.verifyBeforeUpdateEmail;


        firebaseUpdateEmail =
            authModule.updateEmail;


        firebaseUpdatePassword =
            authModule.updatePassword;


        securityFirebaseReady =
            true;


        console.log(
            "TWTMS SECURITY: Firebase Authentication initialized."
        );


        initializeSecurityAuthListener();


    } catch (error) {

        console.error(
            "TWTMS SECURITY FIREBASE INITIALIZATION ERROR:",
            error
        );


        showSecurityMessage(
            "Unable to initialize account security.",
            "error"
        );
    }
}


/* =========================================================
   AUTH LISTENER
========================================================= */

function initializeSecurityAuthListener() {

    if (
        !securityFirebaseReady ||
        !securityAuth ||
        !firebaseOnAuthStateChanged
    ) {

        return;
    }


    firebaseOnAuthStateChanged(
        securityAuth,
        (user) => {

            securityUser =
                user;


            if (!user) {

                updateSecurityUIForSignedOutUser();

                return;
            }


            console.log(
                "TWTMS SECURITY AUTH USER:",
                user.uid
            );


            updateSecurityAccountInfo(
                user
            );


            updateSecurityStatus(
                user
            );
        }
    );
}


/* =========================================================
   UPDATE SECURITY ACCOUNT INFORMATION
========================================================= */

function updateSecurityAccountInfo(
    user
) {

    if (!user) {

        return;
    }


    /*
     * Current Email
     */

    const currentEmail =
        document.getElementById(
            "currentEmail"
        );


    if (currentEmail) {

        currentEmail.value =
            user.email ||
            "";
    }


    /*
     * Optional security email field
     */

    const securityAccountEmail =
        document.getElementById(
            "securityAccountEmail"
        );


    if (securityAccountEmail) {

        securityAccountEmail.textContent =
            user.email ||
            "No email address";
    }


    /*
     * Connected Account
     *
     * Admin Profile may already have this.
     * We update it if present.
     */

    const connectedAccountEmail =
        document.getElementById(
            "connectedAccountEmail"
        );


    if (connectedAccountEmail) {

        connectedAccountEmail.textContent =
            user.email ||
            "No authenticated account";
    }
}


/* =========================================================
   SECURITY STATUS
========================================================= */

function updateSecurityStatus(
    user
) {

    const statusElement =
        document.getElementById(
            "securityStatus"
        );


    if (!statusElement) {

        return;
    }


    if (!user) {

        statusElement.textContent =
            "Not Connected";

        statusElement.classList.remove(
            "secure"
        );

        statusElement.classList.add(
            "warning"
        );

        return;
    }


    /*
     * Firebase email verification.
     */

    if (user.emailVerified) {

        statusElement.textContent =
            "Secure";

        statusElement.classList.add(
            "secure"
        );

        statusElement.classList.remove(
            "warning"
        );

    } else {

        statusElement.textContent =
            "Verification Required";

        statusElement.classList.remove(
            "secure"
        );

        statusElement.classList.add(
            "warning"
        );
    }
}


/* =========================================================
   SIGNED OUT UI
========================================================= */

function updateSecurityUIForSignedOutUser() {

    const currentEmail =
        document.getElementById(
            "currentEmail"
        );


    if (currentEmail) {

        currentEmail.value =
            "";
    }


    const connectedAccountEmail =
        document.getElementById(
            "connectedAccountEmail"
        );


    if (connectedAccountEmail) {

        connectedAccountEmail.textContent =
            "No authenticated account";
    }


    updateSecurityStatus(
        null
    );
}


/* =========================================================
   EMAIL FORM
========================================================= */

function initializeEmailForm() {

    const form =
        document.getElementById(
            "securityEmailForm"
        );


    if (!form) {

        console.warn(
            "TWTMS SECURITY: Email form not found."
        );

        return;
    }


    if (
        form.dataset.securityInitialized ===
        "true"
    ) {

        return;
    }


    form.dataset.securityInitialized =
        "true";


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            await changeEmailAddress();
        }
    );
}


/* =========================================================
   CHANGE EMAIL ADDRESS
========================================================= */

async function changeEmailAddress() {

    if (emailChangeRunning) {

        return;
    }


    if (
        !securityFirebaseReady ||
        !securityAuth
    ) {

        showSecurityMessage(
            "Firebase Authentication is not ready yet.",
            "error"
        );

        return;
    }


    const user =
        securityAuth.currentUser;


    if (!user) {

        showSecurityMessage(
            "No authenticated account was found.",
            "error"
        );

        return;
    }


    /*
     * Current password
     */

    const currentPassword =
        getInputValue(
            "emailCurrentPassword"
        );


    /*
     * New email
     */

    const newEmail =
        getInputValue(
            "newEmail"
        );


    /*
     * Confirm email
     */

    const confirmEmail =
        getInputValue(
            "confirmEmail"
        );


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!currentPassword) {

        showSecurityMessage(
            "Please enter your current password.",
            "error"
        );

        focusInput(
            "emailCurrentPassword"
        );

        return;
    }


    if (!newEmail) {

        showSecurityMessage(
            "Please enter your new email address.",
            "error"
        );

        focusInput(
            "newEmail"
        );

        return;
    }


    if (
        !isValidEmail(
            newEmail
        )
    ) {

        showSecurityMessage(
            "Please enter a valid email address.",
            "error"
        );

        focusInput(
            "newEmail"
        );

        return;
    }


    if (
        newEmail.toLowerCase() !==
        confirmEmail.toLowerCase()
    ) {

        showSecurityMessage(
            "The email addresses do not match.",
            "error"
        );

        focusInput(
            "confirmEmail"
        );

        return;
    }


    if (
        newEmail.toLowerCase() ===
        String(
            user.email || ""
        ).toLowerCase()
    ) {

        showSecurityMessage(
            "The new email address is the same as your current email.",
            "error"
        );

        return;
    }


    emailChangeRunning =
        true;


    const button =
        document.getElementById(
            "changeEmailButton"
        );


    setButtonLoading(
        button,
        true,
        "Changing Email..."
    );


    try {

        /*
         * =================================================
         * STEP 1
         * RE-AUTHENTICATE
         * =================================================
         */

        showSecurityMessage(
            "Verifying your current password...",
            "info"
        );


        const credential =
            firebaseEmailAuthProvider.credential(
                user.email,
                currentPassword
            );


        await firebaseReauthenticateWithCredential(
            user,
            credential
        );


        /*
         * =================================================
         * STEP 2
         * SEND EMAIL VERIFICATION
         * =================================================
         *
         * Firebase now recommends
         * verifyBeforeUpdateEmail().
         *
         * This sends a verification link to
         * the new email address.
         */

        if (
            typeof firebaseVerifyBeforeUpdateEmail ===
            "function"
        ) {

            showSecurityMessage(
                "Sending verification email...",
                "info"
            );


            await firebaseVerifyBeforeUpdateEmail(
                user,
                newEmail
            );


            /*
             * IMPORTANT:
             *
             * Firebase keeps the existing email
             * until the new address is verified.
             */

            showSecurityMessage(
                "Verification email sent. Open the verification link sent to your new email address to complete the change.",
                "success"
            );


        } else {

            /*
             * Fallback for Firebase environments
             * where verifyBeforeUpdateEmail is unavailable.
             */

            await firebaseUpdateEmail(
                user,
                newEmail
            );


            showSecurityMessage(
                "Email address updated successfully.",
                "success"
            );
        }


        /*
         * Clear sensitive fields.
         */

        clearInput(
            "emailCurrentPassword"
        );

        clearInput(
            "newEmail"
        );

        clearInput(
            "confirmEmail"
        );


        /*
         * Update current email display.
         *
         * If verification is required,
         * this will remain the old email
         * until Firebase confirms the new one.
         */

        updateSecurityAccountInfo(
            securityAuth.currentUser
        );


    } catch (error) {

        console.error(
            "TWTMS SECURITY CHANGE EMAIL ERROR:",
            error
        );


        handleFirebaseSecurityError(
            error,
            "email"
        );


    } finally {

        emailChangeRunning =
            false;


        setButtonLoading(
            button,
            false,
            "Change Email Address"
        );
    }
}


/* =========================================================
   PASSWORD FORM
========================================================= */

function initializePasswordForm() {

    const form =
        document.getElementById(
            "securityPasswordForm"
        );


    if (!form) {

        console.warn(
            "TWTMS SECURITY: Password form not found."
        );

        return;
    }


    if (
        form.dataset.securityInitialized ===
        "true"
    ) {

        return;
    }


    form.dataset.securityInitialized =
        "true";


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            await changePassword();
        }
    );
}


/* =========================================================
   CHANGE PASSWORD
========================================================= */

async function changePassword() {

    if (passwordChangeRunning) {

        return;
    }


    if (
        !securityFirebaseReady ||
        !securityAuth
    ) {

        showSecurityMessage(
            "Firebase Authentication is not ready yet.",
            "error"
        );

        return;
    }


    const user =
        securityAuth.currentUser;


    if (!user) {

        showSecurityMessage(
            "No authenticated account was found.",
            "error"
        );

        return;
    }


    const currentPassword =
        getInputValue(
            "currentPassword"
        );


    const newPassword =
        getInputValue(
            "newPassword"
        );


    const confirmPassword =
        getInputValue(
            "confirmPassword"
        );


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!currentPassword) {

        showSecurityMessage(
            "Please enter your current password.",
            "error"
        );

        focusInput(
            "currentPassword"
        );

        return;
    }


    if (!newPassword) {

        showSecurityMessage(
            "Please enter your new password.",
            "error"
        );

        focusInput(
            "newPassword"
        );

        return;
    }


    const validation =
        validatePassword(
            newPassword
        );


    if (!validation.valid) {

        showSecurityMessage(
            "Please meet all password requirements.",
            "error"
        );

        return;
    }


    if (
        newPassword !==
        confirmPassword
    ) {

        showSecurityMessage(
            "The new passwords do not match.",
            "error"
        );

        focusInput(
            "confirmPassword"
        );

        return;
    }


    if (
        newPassword ===
        currentPassword
    ) {

        showSecurityMessage(
            "Your new password must be different from your current password.",
            "error"
        );

        return;
    }


    passwordChangeRunning =
        true;


    const button =
        document.getElementById(
            "changePasswordButton"
        );


    setButtonLoading(
        button,
        true,
        "Changing Password..."
    );


    try {

        /*
         * =================================================
         * STEP 1
         * RE-AUTHENTICATE
         * =================================================
         */

        showSecurityMessage(
            "Verifying your current password...",
            "info"
        );


        const credential =
            firebaseEmailAuthProvider.credential(
                user.email,
                currentPassword
            );


        await firebaseReauthenticateWithCredential(
            user,
            credential
        );


        /*
         * =================================================
         * STEP 2
         * UPDATE PASSWORD
         * =================================================
         */

        showSecurityMessage(
            "Updating your password...",
            "info"
        );


        await firebaseUpdatePassword(
            user,
            newPassword
        );


        /*
         * Clear sensitive fields.
         */

        clearInput(
            "currentPassword"
        );

        clearInput(
            "newPassword"
        );

        clearInput(
            "confirmPassword"
        );


        resetPasswordRequirements();


        showSecurityMessage(
            "Password changed successfully.",
            "success"
        );


        /*
         * Password update does not require
         * changing the Firebase user email.
         */

        updateSecurityStatus(
            user
        );


    } catch (error) {

        console.error(
            "TWTMS SECURITY CHANGE PASSWORD ERROR:",
            error
        );


        handleFirebaseSecurityError(
            error,
            "password"
        );


    } finally {

        passwordChangeRunning =
            false;


        setButtonLoading(
            button,
            false,
            "Change Password"
        );
    }
}


/* =========================================================
   PASSWORD TOGGLES
========================================================= */

function initializePasswordToggles() {

    const toggleButtons =
        document.querySelectorAll(
            ".security-password-toggle"
        );


    toggleButtons.forEach(
        (button) => {

            if (
                button.dataset.securityToggleInitialized ===
                "true"
            ) {

                return;
            }


            button.dataset.securityToggleInitialized =
                "true";


            button.addEventListener(
                "click",
                () => {

                    togglePasswordVisibility(
                        button
                    );
                }
            );
        }
    );
}


/* =========================================================
   TOGGLE PASSWORD
========================================================= */

function togglePasswordVisibility(
    button
) {

    const targetId =
        button.dataset.target;


    if (!targetId) {

        return;
    }


    const input =
        document.getElementById(
            targetId
        );


    if (!input) {

        return;
    }


    const icon =
        button.querySelector(
            "i"
        );


    const isPassword =
        input.type ===
        "password";


    input.type =
        isPassword
            ? "text"
            : "password";


    if (icon) {

        icon.classList.toggle(
            "fa-eye",
            !isPassword
        );

        icon.classList.toggle(
            "fa-eye-slash",
            isPassword
        );
    }


    button.setAttribute(
        "aria-label",
        isPassword
            ? "Hide password"
            : "Show password"
    );
}


/* =========================================================
   PASSWORD VALIDATION
========================================================= */

function initializePasswordValidation() {

    const input =
        document.getElementById(
            "newPassword"
        );


    if (!input) {

        return;
    }


    if (
        input.dataset.securityValidationInitialized ===
        "true"
    ) {

        return;
    }


    input.dataset.securityValidationInitialized =
        "true";


    input.addEventListener(
        "input",
        () => {

            validatePassword(
                input.value
            );
        }
    );
}


/* =========================================================
   VALIDATE PASSWORD
========================================================= */

function validatePassword(
    password
) {

    const rules = {

        length:
            password.length >= 8,

        uppercase:
            /[A-Z]/.test(
                password
            ),

        lowercase:
            /[a-z]/.test(
                password
            ),

        number:
            /[0-9]/.test(
                password
            ),

        special:
            /[^A-Za-z0-9]/.test(
                password
            )
    };


    updatePasswordRequirement(
        "requirementLength",
        rules.length
    );


    updatePasswordRequirement(
        "requirementUppercase",
        rules.uppercase
    );


    updatePasswordRequirement(
        "requirementLowercase",
        rules.lowercase
    );


    updatePasswordRequirement(
        "requirementNumber",
        rules.number
    );


    updatePasswordRequirement(
        "requirementSpecial",
        rules.special
    );


    return {

        valid:
            Object.values(
                rules
            ).every(
                Boolean
            ),

        rules:
            rules
    };
}


/* =========================================================
   PASSWORD REQUIREMENT UI
========================================================= */

function updatePasswordRequirement(
    id,
    passed
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;
    }


    const icon =
        element.querySelector(
            "i"
        );


    element.classList.toggle(
        "valid",
        passed
    );


    element.classList.toggle(
        "invalid",
        !passed
    );


    if (icon) {

        icon.classList.toggle(
            "fa-circle-check",
            passed
        );

        icon.classList.toggle(
            "fa-circle",
            !passed
        );

        icon.classList.toggle(
            "fa-regular",
            !passed
        );

        icon.classList.toggle(
            "fa-solid",
            passed
        );
    }
}


/* =========================================================
   RESET PASSWORD REQUIREMENTS
========================================================= */

function resetPasswordRequirements() {

    const requirements = [

        "requirementLength",

        "requirementUppercase",

        "requirementLowercase",

        "requirementNumber",

        "requirementSpecial"
    ];


    requirements.forEach(
        (id) => {

            updatePasswordRequirement(
                id,
                false
            );
        }
    );
}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}


/* =========================================================
   INPUT HELPERS
========================================================= */

function getInputValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return "";
    }


    return String(
        element.value ||
        ""
    ).trim();
}


function clearInput(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;
    }


    element.value =
        "";
}


function focusInput(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;
    }


    setTimeout(
        () => {

            element.focus();

        },
        50
    );
}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    loadingText
) {

    if (!button) {

        return;
    }


    if (loading) {

        button.disabled =
            true;


        button.dataset.originalHTML =
            button.innerHTML;


        button.innerHTML =
            `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>${loadingText}</span>
            `;

    } else {

        button.disabled =
            false;


        /*
         * Restore original HTML.
         */

        if (
            button.dataset.originalHTML
        ) {

            button.innerHTML =
                button.dataset.originalHTML;
        }
    }
}


/* =========================================================
   FIREBASE SECURITY ERROR HANDLER
========================================================= */

function handleFirebaseSecurityError(
    error,
    operation
) {

    console.error(
        "TWTMS SECURITY FIREBASE ERROR:",
        error
    );


    const code =
        error?.code ||
        "";


    let message =
        "Something went wrong. Please try again.";


    switch (code) {

        /* ================================================
           WRONG PASSWORD
        ================================================ */

        case "auth/wrong-password":

        case "auth/invalid-credential":

        case "auth/invalid-login-credentials":

            message =
                "The current password is incorrect.";

            break;


        /* ================================================
           TOO MANY REQUESTS
        ================================================ */

        case "auth/too-many-requests":

            message =
                "Too many attempts. Please wait a while before trying again.";

            break;


        /* ================================================
           EMAIL ALREADY EXISTS
        ================================================ */

        case "auth/email-already-in-use":

            message =
                "That email address is already being used by another account.";

            break;


        /* ================================================
           INVALID EMAIL
        ================================================ */

        case "auth/invalid-email":

            message =
                "The email address is invalid.";

            break;


        /* ================================================
           RECENT LOGIN REQUIRED
        ================================================ */

        case "auth/requires-recent-login":

            message =
                "For security, please sign in again before making this change.";

            break;


        /* ================================================
           WEAK PASSWORD
        ================================================ */

        case "auth/weak-password":

            message =
                "The password is too weak. Please meet all password requirements.";

            break;


        /* ================================================
           OPERATION NOT ALLOWED
        ================================================ */

        case "auth/operation-not-allowed":

            message =
                "This authentication operation is not enabled in Firebase.";

            break;


        /* ================================================
           USER DISABLED
        ================================================ */

        case "auth/user-disabled":

            message =
                "This account has been disabled.";

            break;


        /* ================================================
           USER NOT FOUND
        ================================================ */

        case "auth/user-not-found":

            message =
                "The authenticated account could not be found.";

            break;


        /* ================================================
           NETWORK
        ================================================ */

        case "auth/network-request-failed":

            message =
                "Network error. Please check your internet connection.";

            break;


        /* ================================================
           DEFAULT
        ================================================ */

        default:

            if (
                operation ===
                "email"
            ) {

                message =
                    "Unable to change the email address. Please try again.";

            } else if (
                operation ===
                "password"
            ) {

                message =
                    "Unable to change the password. Please try again.";
            }
    }


    showSecurityMessage(
        message,
        "error"
    );
}


/* =========================================================
   SECURITY MESSAGE
========================================================= */

function showSecurityMessage(
    message,
    type = "info"
) {

    /*
     * Use the existing profile toast if available.
     */

    let toast =
        document.getElementById(
            "profileToast"
        );


    /*
     * Otherwise create a security toast.
     */

    if (!toast) {

        toast =
            document.getElementById(
                "securityToast"
            );
    }


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "securityToast";


        toast.className =
            "profile-toast";


        document.body.appendChild(
            toast
        );
    }


    toast.className =
        `profile-toast ${type}`;


    toast.textContent =
        message;


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );
        }
    );


    clearTimeout(
        window.__twtmsSecurityToastTimer
    );


    window.__twtmsSecurityToastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            5000
        );
}


/* =========================================================
   PUBLIC API
========================================================= */

window.changeEmailAddress =
    changeEmailAddress;


window.changePassword =
    changePassword;


window.validateSecurityPassword =
    validatePassword;


window.getSecurityUser =
    () => securityUser;


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeSecurity,
        {
            once: true
        }
    );

} else {

    initializeSecurity();
}