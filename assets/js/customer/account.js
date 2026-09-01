"use strict";

import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const accountName =
    document.getElementById("accountName");

const accountEmail =
    document.getElementById("accountEmail");

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
    user => {

        if (!user) {
            window.location.href =
                "../../index.html";
            return;
        }

        renderAuthFallback(user);
        subscribeCustomerProfile(user.uid);
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
