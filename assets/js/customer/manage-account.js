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
    reload
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// =========================================
// DOM
// =========================================

const accountName =
    document.getElementById(
        "manageAccountName"
    );

const accountEmail =
    document.getElementById(
        "manageAccountEmail"
    );

const emailStatus =
    document.getElementById(
        "manageEmailStatus"
    );

const connectedProvider =
    document.getElementById(
        "manageConnectedProvider"
    );

const securityDescription =
    document.getElementById(
        "manageSecurityDescription"
    );

const profileAvatar =
    document.getElementById(
        "manageProfileAvatar"
    );


// =========================================
// STATE
// =========================================

let unsubscribeProfile =
    null;


// =========================================
// AUTH
// =========================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../../index.html";

            return;
        }


        // Render immediately
        renderAuthUser(user);


        // Refresh Firebase Auth
        try {

            await reload(user);

        } catch (error) {

            console.error(
                "MANAGE ACCOUNT AUTH REFRESH ERROR:",
                error
            );

        }


        const currentUser =
            auth.currentUser || user;


        renderAuthUser(
            currentUser
        );

        renderEmailStatus(
            currentUser
        );

        renderProvider(
            currentUser
        );

        renderProfilePhoto(
            currentUser
        );

        subscribeCustomerProfile(
            currentUser.uid
        );

    }
);


// =========================================
// BASIC AUTH DATA
// =========================================

function renderAuthUser(user) {

    if (!user) {
        return;
    }


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


// =========================================
// FIRESTORE PROFILE
// =========================================

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
                    "MANAGE ACCOUNT PROFILE ERROR:",
                    error
                );

            }

        );

}


// =========================================
// EMAIL STATUS
// =========================================

function renderEmailStatus(user) {

    if (
        !user ||
        !emailStatus
    ) {
        return;
    }


    const providerIds =
        user.providerData.map(
            provider =>
                provider.providerId
        );


    /*
     * Google and Facebook accounts normally
     * already establish identity through their
     * authentication provider.
     */
    const socialProvider =
        providerIds.includes(
            "google.com"
        ) ||
        providerIds.includes(
            "facebook.com"
        );


    if (
        user.emailVerified === true ||
        socialProvider
    ) {

        emailStatus.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>

            <span>
                Verified
            </span>
        `;

        emailStatus.classList.remove(
            "not-verified"
        );

        emailStatus.classList.add(
            "verified"
        );

        return;
    }


    emailStatus.innerHTML = `
        <i class="fa-solid fa-circle-exclamation"></i>

        <span>
            Email not verified
        </span>
    `;

    emailStatus.classList.remove(
        "verified"
    );

    emailStatus.classList.add(
        "not-verified"
    );

}


// =========================================
// CONNECTED PROVIDER
// =========================================

function renderProvider(user) {

    if (!user) {
        return;
    }


    const providerIds =
        user.providerData.map(
            provider =>
                provider.providerId
        );


    let providerText =
        "Email & Password";


    if (
        providerIds.includes(
            "google.com"
        )
    ) {

        providerText =
            "Connected with Google";

    }

    else if (
        providerIds.includes(
            "facebook.com"
        )
    ) {

        providerText =
            "Connected with Facebook";

    }

    else if (
        providerIds.includes(
            "password"
        )
    ) {

        providerText =
            "Email & Password";

    }


    if (connectedProvider) {

        connectedProvider.textContent =
            providerText;

    }


    if (securityDescription) {

        if (
            providerIds.includes(
                "password"
            )
        ) {

            securityDescription.textContent =
                "Password and sign-in security";

        } else {

            securityDescription.textContent =
                "Manage your connected sign-in account";

        }

    }

}


// =========================================
// PROFILE PHOTO
// =========================================

function renderProfilePhoto(user) {

    if (
        !profileAvatar ||
        !user
    ) {
        return;
    }


    if (!user.photoURL) {

        profileAvatar.innerHTML = `
            <i class="fa-solid fa-user"></i>
        `;

        return;
    }


    const image =
        document.createElement(
            "img"
        );


    image.src =
        user.photoURL;

    image.alt =
        user.displayName
            ? `${user.displayName} profile photo`
            : "Profile photo";


    image.addEventListener(
        "error",
        () => {

            profileAvatar.innerHTML = `
                <i class="fa-solid fa-user"></i>
            `;

        },
        {
            once: true
        }
    );


    profileAvatar.replaceChildren(
        image
    );

}


// =========================================
// ACCOUNT ACTIONS
// =========================================

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-manage-action]"
            );


        if (!button) {
            return;
        }


        const action =
            button.dataset.manageAction;


        switch (action) {

            case "travel-preferences":

                window.location.href =
                    "account-preferences.html";

                break;


            case "privacy":

                window.location.href =
                    "privacy.html";

                break;


            /*
             * These sections will get their
             * own edit panels/pages next.
             */

            case "personal-information":
            case "contact-details":
            case "security":
            case "connected-accounts":
            case "pickup-location":
            case "delete-account":

                console.log(
                    "MANAGE ACCOUNT ACTION:",
                    action
                );

                break;

        }

    }
);


// =========================================
// CLEANUP
// =========================================

window.addEventListener(
    "beforeunload",
    () => {

        unsubscribeProfile?.();

    }
);