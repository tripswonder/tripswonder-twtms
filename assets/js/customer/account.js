"use strict";

import {
    auth,
    db,
    functions
} from "../firebase/firebase-config.js";

import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut,
    reload
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

const accountName =
    document.getElementById("accountName");

const accountEmail =
    document.getElementById("accountEmail");

const emailVerificationStatus =
    document.getElementById(
        "emailVerificationStatus"
    );

const verifyEmailButton =
    document.getElementById(
        "verifyEmailButton"
    );

const logoutButton =
    document.querySelector(".account-logout");

const logoutModal =
    document.getElementById("logoutModal");

const logoutModalCancel =
    document.getElementById("logoutModalCancel");

const logoutModalConfirm =
    document.getElementById("logoutModalConfirm");

const logoutModalBackdrop =
    logoutModal?.querySelector(".logout-modal-backdrop");

let unsubscribeProfile =
    null;

let logoutInProgress =
    false;

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {
            window.location.href =
                "../../index.html";
            return;
        }

        renderAuthFallback(
            user
        );

        /*
         * Refresh Firebase Auth first so we always
         * get the latest email verification status.
         */
        try {

            await reload(
                user
            );

        } catch (error) {

            console.error(
                "ACCOUNT AUTH REFRESH ERROR:",
                error
            );

        }


        renderEmailVerificationStatus(
            auth.currentUser || user
        );


        subscribeCustomerProfile(
            user.uid
        );

    }
);

function renderAuthFallback(user) {

    const fallbackName =
        user.displayName ||
        user.email?.split("@")[0] ||
        "Trips Wonder Member";

    if (accountName) {
        accountName.textContent =
            fallbackName;
    }

    if (accountEmail) {
        accountEmail.textContent =
            user.email ||
            "No email address";
    }
}

function subscribeCustomerProfile(uid) {

    unsubscribeProfile?.();

    unsubscribeProfile =
        onSnapshot(
            doc(
                db,
                "users",
                uid
            ),
            snapshot => {

                if (!snapshot.exists()) {
                    return;
                }

                const profile =
                    snapshot.data();

                const fullName =
                    [
                        profile.firstName,
                        profile.lastName
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .trim();

                if (accountName) {
                    accountName.textContent =
                        fullName ||
                        profile.displayName ||
                        auth.currentUser?.displayName ||
                        "Trips Wonder Member";
                }

                if (accountEmail) {
                    accountEmail.textContent =
                        profile.email ||
                        auth.currentUser?.email ||
                        "No email address";
                }
            },
            error => {
                console.error(
                    "CUSTOMER ACCOUNT PROFILE ERROR:",
                    error
                );
            }
        );
}

document.addEventListener(
    "click",
    event => {

        const actionButton =
            event.target.closest(
                "[data-account-action]"
            );

        if (!actionButton) {
            return;
        }

        const routes = {
            notifications:
                "account-notifications.html",
            "travel-preferences":
                "account-preferences.html",
            terms:
                "terms.html",
            privacy:
                "privacy.html"
        };

        const destination =
            routes[
                actionButton.dataset.accountAction
            ];

        if (destination) {
            window.location.href =
                destination;
        }
    }
);

function renderEmailVerificationStatus(
    user
) {

    if (
        !user ||
        !emailVerificationStatus
    ) {
        return;
    }


    if (
        user.emailVerified === true
    ) {

        emailVerificationStatus.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            Verified
        `;

        emailVerificationStatus.classList.remove(
            "not-verified"
        );

        emailVerificationStatus.classList.add(
            "verified"
        );


        if (verifyEmailButton) {
            verifyEmailButton.hidden =
                true;
        }


        return;
    }


    emailVerificationStatus.innerHTML = `
        <i class="fa-solid fa-circle-exclamation"></i>
        Email not verified
    `;

    emailVerificationStatus.classList.remove(
        "verified"
    );

    emailVerificationStatus.classList.add(
        "not-verified"
    );


    if (verifyEmailButton) {
        verifyEmailButton.hidden =
            false;
    }

}


async function refreshEmailVerificationStatus() {

    const user =
        auth.currentUser;


    if (!user) {
        return;
    }


    try {

        await reload(
            user
        );


        renderEmailVerificationStatus(
            auth.currentUser
        );


    } catch (error) {

        console.error(
            "REFRESH EMAIL VERIFICATION ERROR:",
            error
        );

    }

}


async function sendVerificationEmail() {

    const user =
        auth.currentUser;

    if (
        !user ||
        !verifyEmailButton
    ) {
        return;
    }


    // Already verified
    if (
        user.emailVerified === true
    ) {

        renderEmailVerificationStatus(
            user
        );

        return;
    }


    const cooldownKey =
        `verificationEmailCooldown_${user.uid}`;

    const cooldownSeconds =
        60;

    const lastSent =
        Number(
            localStorage.getItem(
                cooldownKey
            ) || 0
        );

    const elapsedSeconds =
        Math.floor(
            (
                Date.now() -
                lastSent
            ) / 1000
        );


    // -----------------------------------------
    // COOLDOWN CHECK
    // -----------------------------------------

    if (
        lastSent &&
        elapsedSeconds <
        cooldownSeconds
    ) {

        const remaining =
            cooldownSeconds -
            elapsedSeconds;

        alert(
            `Please wait ${remaining} seconds before requesting another verification email.`
        );

        return;
    }


    const originalHTML =
        verifyEmailButton.innerHTML;


    try {

        verifyEmailButton.disabled =
            true;

        verifyEmailButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Sending...</span>
        `;


        const sendClientVerificationEmail =
            httpsCallable(
                functions,
                "sendClientVerificationEmail"
            );


        await sendClientVerificationEmail();


        // Save cooldown
        localStorage.setItem(
            cooldownKey,
            String(
                Date.now()
            )
        );


        if (
            emailVerificationStatus
        ) {

            emailVerificationStatus.innerHTML = `
                <i class="fa-regular fa-envelope-circle-check"></i>
                Verification email sent
            `;

            emailVerificationStatus.classList.remove(
                "verified"
            );

            emailVerificationStatus.classList.add(
                "not-verified"
            );

        }


        verifyEmailButton.innerHTML = `
            <i class="fa-solid fa-check"></i>
            <span>Email Sent</span>
        `;


        startVerificationCooldown(
            verifyEmailButton,
            originalHTML,
            cooldownSeconds
        );


    } catch (error) {

        console.error(
            "SEND VERIFICATION EMAIL ERROR:",
            error
        );


        verifyEmailButton.disabled =
            false;

        verifyEmailButton.innerHTML =
            originalHTML;


        alert(
            error?.message ||
            "Unable to send verification email. Please try again."
        );

    }

}

function startVerificationCooldown(
    button,
    originalHTML,
    seconds
) {

    if (!button) {
        return;
    }


    let remaining =
        seconds;


    button.disabled =
        true;


    const updateButton =
        () => {

            if (
                auth.currentUser?.emailVerified ===
                true
            ) {

                button.hidden =
                    true;

                return;
            }


            if (
                remaining <=
                0
            ) {

                button.disabled =
                    false;

                button.innerHTML =
                    originalHTML;

                return;
            }


            button.innerHTML = `
                <i class="fa-regular fa-clock"></i>
                <span>
                    Resend in ${remaining}s
                </span>
            `;


            remaining -=
                1;


            window.setTimeout(
                updateButton,
                1000
            );

        };


    updateButton();

}

function openLogoutModal() {

    if (!logoutModal || logoutInProgress) {
        return;
    }

    logoutModal.hidden =
        false;

    logoutModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "logout-modal-open"
    );

    requestAnimationFrame(
        () => {
            logoutModal.classList.add(
                "show"
            );

            logoutModalCancel?.focus();
        }
    );
}

function closeLogoutModal() {

    if (!logoutModal || logoutInProgress) {
        return;
    }

    logoutModal.classList.remove(
        "show"
    );

    logoutModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "logout-modal-open"
    );

    window.setTimeout(
        () => {
            if (
                !logoutModal.classList.contains(
                    "show"
                )
            ) {
                logoutModal.hidden =
                    true;
            }
        },
        180
    );

    logoutButton?.focus();
}

async function performLogout() {

    if (
        logoutInProgress ||
        !logoutModalConfirm
    ) {
        return;
    }

    logoutInProgress =
        true;

    const originalConfirmHTML =
        logoutModalConfirm.innerHTML;

    logoutModalConfirm.disabled =
        true;

    if (logoutModalCancel) {
        logoutModalCancel.disabled =
            true;
    }

    if (logoutButton) {
        logoutButton.disabled =
            true;
    }

    logoutModalConfirm.innerHTML =
        `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Logging Out...</span>
        `;

    try {

        unsubscribeProfile?.();

        await signOut(auth);

        window.location.href =
            "../../index.html";

    } catch (error) {

        console.error(
            "CUSTOMER LOGOUT ERROR:",
            error
        );

        logoutInProgress =
            false;

        logoutModalConfirm.disabled =
            false;

        if (logoutModalCancel) {
            logoutModalCancel.disabled =
                false;
        }

        if (logoutButton) {
            logoutButton.disabled =
                false;
        }

        logoutModalConfirm.innerHTML =
            originalConfirmHTML;

        alert(
            "Unable to log out. Please try again."
        );
    }
}

logoutButton?.addEventListener(
    "click",
    openLogoutModal
);

logoutModalCancel?.addEventListener(
    "click",
    closeLogoutModal
);

logoutModalConfirm?.addEventListener(
    "click",
    performLogout
);

logoutModalBackdrop?.addEventListener(
    "click",
    closeLogoutModal
);

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
                "Escape" &&
            logoutModal?.classList.contains(
                "show"
            ) &&
            !logoutInProgress
        ) {
            closeLogoutModal();
        }
    }
);

verifyEmailButton?.addEventListener(
    "click",
    () => {

        void sendVerificationEmail();

    }
);

window.addEventListener(
    "focus",
    () => {

        void refreshEmailVerificationStatus();

    }
);


document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            void refreshEmailVerificationStatus();

        }

    }
);
