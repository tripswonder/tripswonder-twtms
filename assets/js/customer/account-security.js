"use strict";

import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    EmailAuthProvider,
    onAuthStateChanged,
    reauthenticateWithCredential,
    updateEmail,
    updatePassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const profileForm =
    document.getElementById("profileForm");

const emailForm =
    document.getElementById("emailForm");

const passwordForm =
    document.getElementById("passwordForm");

const firstNameInput =
    document.getElementById("firstName");

const lastNameInput =
    document.getElementById("lastName");

const phoneInput =
    document.getElementById("phone");

const currentEmailInput =
    document.getElementById("currentEmail");

const newEmailInput =
    document.getElementById("newEmail");

const emailPasswordInput =
    document.getElementById("emailPassword");

const currentPasswordInput =
    document.getElementById("currentPassword");

const newPasswordInput =
    document.getElementById("newPassword");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const securityStatus =
    document.getElementById("securityStatus");

let currentUser =
    null;

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {
            window.location.href =
                "../../index.html";
            return;
        }

        currentUser =
            user;

        currentEmailInput.value =
            user.email || "";

        await loadProfile();
    }
);

async function loadProfile() {

    if (!currentUser) {
        return;
    }

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                )
            );

        const profile =
            snapshot.exists()
                ? snapshot.data()
                : {};

        const displayNameParts =
            String(
                currentUser.displayName ||
                ""
            )
                .trim()
                .split(/\s+/);

        firstNameInput.value =
            profile.firstName ||
            displayNameParts[0] ||
            "";

        lastNameInput.value =
            profile.lastName ||
            displayNameParts
                .slice(1)
                .join(" ") ||
            "";

        phoneInput.value =
            profile.phone ||
            profile.contactNumber ||
            "";

        currentEmailInput.value =
            currentUser.email ||
            profile.email ||
            "";

    } catch (error) {

        console.error(
            "CUSTOMER ACCOUNT PROFILE LOAD ERROR:",
            error
        );

        showStatus(
            "Unable to load your account information.",
            "error"
        );
    }
}

profileForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (!currentUser) {
            return;
        }

        const firstName =
            firstNameInput.value.trim();

        const lastName =
            lastNameInput.value.trim();

        const phone =
            phoneInput.value.trim();

        if (!firstName || !lastName) {
            showStatus(
                "First name and last name are required.",
                "error"
            );
            return;
        }

        const button =
            document.getElementById(
                "saveProfileButton"
            );

        setButtonBusy(
            button,
            true,
            "Saving..."
        );

        try {

            const displayName =
                `${firstName} ${lastName}`
                    .trim();

            await setDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                ),
                {
                    firstName,
                    lastName,
                    displayName,
                    phone,
                    email:
                        currentUser.email || "",
                    updatedAt:
                        serverTimestamp()
                },
                {
                    merge: true
                }
            );

            await updateProfile(
                currentUser,
                {
                    displayName
                }
            );

            showStatus(
                "Personal information updated successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "CUSTOMER PROFILE UPDATE ERROR:",
                error
            );

            showStatus(
                getFriendlyError(error),
                "error"
            );

        } finally {

            setButtonBusy(
                button,
                false,
                "Save Personal Information",
                "fa-regular fa-floppy-disk"
            );
        }
    }
);

emailForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (!currentUser) {
            return;
        }

        const newEmail =
            newEmailInput.value
                .trim()
                .toLowerCase();

        const currentPassword =
            emailPasswordInput.value;

        if (
            !newEmail ||
            !currentPassword
        ) {
            showStatus(
                "New email and current password are required.",
                "error"
            );
            return;
        }

        if (
            newEmail ===
            String(
                currentUser.email ||
                ""
            ).toLowerCase()
        ) {
            showStatus(
                "Please enter a different email address.",
                "error"
            );
            return;
        }

        const button =
            document.getElementById(
                "changeEmailButton"
            );

        setButtonBusy(
            button,
            true,
            "Updating..."
        );

        try {

            await reauthenticate(
                currentPassword
            );

            await updateEmail(
                currentUser,
                newEmail
            );

            await setDoc(
                doc(
                    db,
                    "users",
                    currentUser.uid
                ),
                {
                    email:
                        newEmail,
                    updatedAt:
                        serverTimestamp()
                },
                {
                    merge: true
                }
            );

            currentEmailInput.value =
                newEmail;

            newEmailInput.value =
                "";

            emailPasswordInput.value =
                "";

            showStatus(
                "Email address updated successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "CUSTOMER EMAIL UPDATE ERROR:",
                error
            );

            showStatus(
                getFriendlyError(error),
                "error"
            );

        } finally {

            setButtonBusy(
                button,
                false,
                "Change Email",
                "fa-regular fa-envelope"
            );
        }
    }
);

passwordForm?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (!currentUser) {
            return;
        }

        const currentPassword =
            currentPasswordInput.value;

        const newPassword =
            newPasswordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;

        if (
            newPassword.length < 6
        ) {
            showStatus(
                "New password must be at least 6 characters.",
                "error"
            );
            return;
        }

        if (
            newPassword !==
            confirmPassword
        ) {
            showStatus(
                "New passwords do not match.",
                "error"
            );
            return;
        }

        const button =
            document.getElementById(
                "changePasswordButton"
            );

        setButtonBusy(
            button,
            true,
            "Updating..."
        );

        try {

            await reauthenticate(
                currentPassword
            );

            await updatePassword(
                currentUser,
                newPassword
            );

            passwordForm.reset();

            showStatus(
                "Password updated successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "CUSTOMER PASSWORD UPDATE ERROR:",
                error
            );

            showStatus(
                getFriendlyError(error),
                "error"
            );

        } finally {

            setButtonBusy(
                button,
                false,
                "Change Password",
                "fa-solid fa-key"
            );
        }
    }
);

async function reauthenticate(
    password
) {

    if (
        !currentUser ||
        !currentUser.email
    ) {
        throw new Error(
            "This account cannot be re-authenticated with email and password."
        );
    }

    const credential =
        EmailAuthProvider.credential(
            currentUser.email,
            password
        );

    await reauthenticateWithCredential(
        currentUser,
        credential
    );
}

document.addEventListener(
    "click",
    event => {

        const toggle =
            event.target.closest(
                ".password-toggle"
            );

        if (!toggle) {
            return;
        }

        const input =
            toggle
                .closest(
                    ".password-field"
                )
                ?.querySelector(
                    "input"
                );

        if (!input) {
            return;
        }

        const show =
            input.type ===
            "password";

        input.type =
            show
                ? "text"
                : "password";

        toggle.innerHTML =
            show
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';

        toggle.setAttribute(
            "aria-label",
            show
                ? "Hide password"
                : "Show password"
        );
    }
);

function setButtonBusy(
    button,
    busy,
    label,
    iconClass = "fa-solid fa-spinner fa-spin"
) {

    if (!button) {
        return;
    }

    button.disabled =
        busy;

    button.innerHTML =
        busy
            ? `
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>${label}</span>
            `
            : `
                <i class="${iconClass}"></i>
                <span>${label}</span>
            `;
}

function showStatus(
    message,
    type
) {

    if (!securityStatus) {
        return;
    }

    securityStatus.textContent =
        message;

    securityStatus.className =
        `security-status ${type}`;

    securityStatus.hidden =
        false;

    window.clearTimeout(
        showStatus.timer
    );

    showStatus.timer =
        window.setTimeout(
            () => {
                securityStatus.hidden =
                    true;
            },
            4500
        );

    securityStatus.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

function getFriendlyError(
    error
) {

    const code =
        String(
            error?.code ||
            ""
        );

    if (
        code.includes(
            "wrong-password"
        ) ||
        code.includes(
            "invalid-credential"
        )
    ) {
        return "Current password is incorrect.";
    }

    if (
        code.includes(
            "email-already-in-use"
        )
    ) {
        return "That email address is already being used.";
    }

    if (
        code.includes(
            "invalid-email"
        )
    ) {
        return "Please enter a valid email address.";
    }

    if (
        code.includes(
            "requires-recent-login"
        )
    ) {
        return "Please log in again before changing this security setting.";
    }

    if (
        code.includes(
            "weak-password"
        )
    ) {
        return "Please use a stronger password.";
    }

    if (
        code.includes(
            "too-many-requests"
        )
    ) {
        return "Too many attempts. Please try again later.";
    }

    return (
        error?.message ||
        "Unable to update your account. Please try again."
    );
}
