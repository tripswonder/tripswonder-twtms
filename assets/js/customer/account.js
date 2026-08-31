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

let unsubscribeProfile =
    null;

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

logoutButton?.addEventListener(
    "click",
    async () => {

        const confirmed =
            window.confirm(
                "Are you sure you want to log out?"
            );

        if (!confirmed) {
            return;
        }

        const originalHTML =
            logoutButton.innerHTML;

        logoutButton.disabled =
            true;

        logoutButton.innerHTML =
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

            window.alert(
                "Unable to log out. Please try again."
            );

            logoutButton.disabled =
                false;

            logoutButton.innerHTML =
                originalHTML;
        }
    }
);
