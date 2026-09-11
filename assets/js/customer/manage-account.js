"use strict";

import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    doc,
    onSnapshot,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    onAuthStateChanged,
    reload,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


// ==========================================================
// DOM — PROFILE
// ==========================================================

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


// ==========================================================
// DOM — PERSONAL INFORMATION
// ==========================================================

const personalInformationModal =
    document.getElementById(
        "personalInformationModal"
    );

const personalInformationForm =
    document.getElementById(
        "personalInformationForm"
    );

const personalFirstName =
    document.getElementById(
        "personalFirstName"
    );

const personalLastName =
    document.getElementById(
        "personalLastName"
    );

const personalInformationClose =
    document.getElementById(
        "personalInformationClose"
    );

const personalInformationCancel =
    document.getElementById(
        "personalInformationCancel"
    );

const personalInformationSave =
    document.getElementById(
        "personalInformationSave"
    );

const personalInformationMessage =
    document.getElementById(
        "personalInformationMessage"
    );

const personalModalBackdrop =
    personalInformationModal?.querySelector(
        "[data-close-personal-modal]"
    );


// ==========================================================
// DOM — CONTACT DETAILS
// ==========================================================

const contactDetailsModal =
    document.getElementById(
        "contactDetailsModal"
    );

const contactDetailsForm =
    document.getElementById(
        "contactDetailsForm"
    );

const contactEmail =
    document.getElementById(
        "contactEmail"
    );

const contactMobile =
    document.getElementById(
        "contactMobile"
    );

const contactEmailVerification =
    document.getElementById(
        "contactEmailVerification"
    );

const contactDetailsClose =
    document.getElementById(
        "contactDetailsClose"
    );

const contactDetailsCancel =
    document.getElementById(
        "contactDetailsCancel"
    );

const contactDetailsSave =
    document.getElementById(
        "contactDetailsSave"
    );

const contactDetailsMessage =
    document.getElementById(
        "contactDetailsMessage"
    );

const contactModalBackdrop =
    contactDetailsModal?.querySelector(
        "[data-close-contact-modal]"
    );


// ==========================================================
// STATE
// ==========================================================

let unsubscribeProfile =
    null;

let currentProfile =
    null;

let personalInformationSaving =
    false;

let contactDetailsSaving =
    false;


// ==========================================================
// AUTH STATE
// ==========================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../../index.html";

            return;
        }


        renderAllAuthData(
            user
        );


        try {

            await reload(
                user
            );

        } catch (error) {

            console.error(
                "MANAGE ACCOUNT AUTH REFRESH ERROR:",
                error
            );

        }


        const currentUser =
            auth.currentUser ||
            user;


        renderAllAuthData(
            currentUser
        );


        subscribeCustomerProfile(
            currentUser.uid
        );

    }
);


// ==========================================================
// RENDER AUTH DATA
// ==========================================================

function renderAllAuthData(
    user
) {

    if (!user) {
        return;
    }


    renderAuthUser(
        user
    );

    renderEmailStatus(
        user
    );

    renderProvider(
        user
    );

    renderProfilePhoto(
        user
    );

    renderContactEmailStatus(
        user
    );

}


function renderAuthUser(
    user
) {

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


// ==========================================================
// FIRESTORE PROFILE
// ==========================================================

function subscribeCustomerProfile(
    uid
) {

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

                    currentProfile =
                        null;

                    return;
                }


                const profile =
                    snapshot.data();


                currentProfile =
                    profile;


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


// ==========================================================
// PROVIDERS / VERIFICATION
// ==========================================================

function getProviderIds(
    user
) {

    return (
        user?.providerData ||
        []
    ).map(
        provider =>
            provider.providerId
    );

}


function isSocialProvider(
    user
) {

    const providerIds =
        getProviderIds(
            user
        );


    return (
        providerIds.includes(
            "google.com"
        ) ||
        providerIds.includes(
            "facebook.com"
        )
    );

}


function isVerifiedAccount(
    user
) {

    return Boolean(
        user?.emailVerified ===
            true ||
        isSocialProvider(
            user
        )
    );

}


function renderEmailStatus(
    user
) {

    if (
        !user ||
        !emailStatus
    ) {
        return;
    }


    if (
        isVerifiedAccount(
            user
        )
    ) {

        emailStatus.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            <span>Verified</span>
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
        <span>Email not verified</span>
    `;


    emailStatus.classList.remove(
        "verified"
    );

    emailStatus.classList.add(
        "not-verified"
    );

}


function renderContactEmailStatus(
    user
) {

    if (!user) {
        return;
    }


    if (contactEmail) {

        contactEmail.value =
            user.email ||
            "";

    }


    if (
        !contactEmailVerification
    ) {
        return;
    }


    if (
        isVerifiedAccount(
            user
        )
    ) {

        contactEmailVerification.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            Verified
        `;


        contactEmailVerification.classList.remove(
            "not-verified"
        );

        contactEmailVerification.classList.add(
            "verified"
        );


        return;

    }


    contactEmailVerification.innerHTML = `
        <i class="fa-solid fa-circle-exclamation"></i>
        Not verified
    `;


    contactEmailVerification.classList.remove(
        "verified"
    );

    contactEmailVerification.classList.add(
        "not-verified"
    );

}


// ==========================================================
// CONNECTED PROVIDER
// ==========================================================

function renderProvider(
    user
) {

    if (!user) {
        return;
    }


    const providerIds =
        getProviderIds(
            user
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

    else if (
        providerIds.length >
        0
    ) {

        providerText =
            "Connected Account";

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


// ==========================================================
// PROFILE PHOTO
// ==========================================================

function renderProfilePhoto(
    user
) {

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


    image.referrerPolicy =
        "no-referrer";


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


// ==========================================================
// GENERIC MODAL HELPERS
// ==========================================================

function updateModalBodyState() {

    const anyOpen =
        personalInformationModal
            ?.classList
            .contains(
                "show"
            ) ||
        contactDetailsModal
            ?.classList
            .contains(
                "show"
            );


    document.body.classList.toggle(
        "manage-modal-open",
        Boolean(
            anyOpen
        )
    );

}


function openModal(
    modal,
    focusTarget
) {

    if (!modal) {
        return;
    }


    modal.hidden =
        false;


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    requestAnimationFrame(
        () => {

            modal.classList.add(
                "show"
            );


            updateModalBodyState();


            focusTarget?.focus();

        }
    );

}


function closeModal(
    modal
) {

    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    updateModalBodyState();


    window.setTimeout(
        () => {

            if (
                !modal.classList.contains(
                    "show"
                )
            ) {

                modal.hidden =
                    true;

            }

        },
        180
    );

}


// ==========================================================
// PERSONAL INFORMATION — HELPERS
// ==========================================================

function getFallbackNameParts() {

    const displayName =
        auth.currentUser
            ?.displayName
            ?.trim() ||
        "";


    const parts =
        displayName
            .split(/\s+/)
            .filter(Boolean);


    if (
        parts.length ===
        0
    ) {

        return {
            firstName: "",
            lastName: ""
        };

    }


    if (
        parts.length ===
        1
    ) {

        return {
            firstName:
                parts[0],

            lastName:
                ""
        };

    }


    return {

        firstName:
            parts[0],

        lastName:
            parts
                .slice(1)
                .join(" ")

    };

}


function validatePersonalName(
    value
) {

    return /^[\p{L}\p{M}.' -]+$/u.test(
        value
    );

}


function clearPersonalInformationMessage() {

    if (
        !personalInformationMessage
    ) {
        return;
    }


    personalInformationMessage.hidden =
        true;


    personalInformationMessage.textContent =
        "";


    personalInformationMessage.className =
        "manage-form-message";

}


function showPersonalInformationMessage(
    message,
    type = "error"
) {

    if (
        !personalInformationMessage
    ) {
        return;
    }


    personalInformationMessage.hidden =
        false;


    personalInformationMessage.textContent =
        message;


    personalInformationMessage.className =
        `manage-form-message ${type}`;

}


// ==========================================================
// PERSONAL INFORMATION — OPEN / CLOSE
// ==========================================================

function openPersonalInformationModal() {

    if (
        !personalInformationModal ||
        !auth.currentUser
    ) {
        return;
    }


    const fallback =
        getFallbackNameParts();


    if (personalFirstName) {

        personalFirstName.value =
            currentProfile?.firstName ||
            fallback.firstName ||
            "";

    }


    if (personalLastName) {

        personalLastName.value =
            currentProfile?.lastName ||
            fallback.lastName ||
            "";

    }


    clearPersonalInformationMessage();


    openModal(
        personalInformationModal,
        personalFirstName
    );

}


function closePersonalInformationModal() {

    if (
        personalInformationSaving
    ) {
        return;
    }


    closeModal(
        personalInformationModal
    );

}


// ==========================================================
// PERSONAL INFORMATION — FORM STATE
// ==========================================================

function setPersonalInformationFormDisabled(
    disabled
) {

    if (personalFirstName) {
        personalFirstName.disabled =
            disabled;
    }


    if (personalLastName) {
        personalLastName.disabled =
            disabled;
    }


    if (personalInformationSave) {
        personalInformationSave.disabled =
            disabled;
    }


    if (personalInformationCancel) {
        personalInformationCancel.disabled =
            disabled;
    }


    if (personalInformationClose) {
        personalInformationClose.disabled =
            disabled;
    }

}


// ==========================================================
// PERSONAL INFORMATION — SAVE
// ==========================================================

async function savePersonalInformation(
    event
) {

    event.preventDefault();


    const user =
        auth.currentUser;


    if (
        !user ||
        personalInformationSaving
    ) {
        return;
    }


    const firstName =
        personalFirstName
            ?.value
            .trim() ||
        "";


    const lastName =
        personalLastName
            ?.value
            .trim() ||
        "";


    clearPersonalInformationMessage();


    if (!firstName) {

        showPersonalInformationMessage(
            "Please enter your first name."
        );


        personalFirstName?.focus();

        return;
    }


    if (
        firstName.length >
        50 ||
        !validatePersonalName(
            firstName
        )
    ) {

        showPersonalInformationMessage(
            "Please enter a valid first name."
        );


        personalFirstName?.focus();

        return;
    }


    if (!lastName) {

        showPersonalInformationMessage(
            "Please enter your last name."
        );


        personalLastName?.focus();

        return;
    }


    if (
        lastName.length >
        50 ||
        !validatePersonalName(
            lastName
        )
    ) {

        showPersonalInformationMessage(
            "Please enter a valid last name."
        );


        personalLastName?.focus();

        return;
    }


    const fullName =
        `${firstName} ${lastName}`
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    const originalButtonHTML =
        personalInformationSave
            ?.innerHTML ||
        "";


    try {

        personalInformationSaving =
            true;


        setPersonalInformationFormDisabled(
            true
        );


        if (
            personalInformationSave
        ) {

            personalInformationSave.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Saving...</span>
            `;

        }


        await setDoc(

            doc(
                db,
                "users",
                user.uid
            ),

            {
                firstName,
                lastName,
                displayName:
                    fullName,
                updatedAt:
                    serverTimestamp()
            },

            {
                merge: true
            }

        );


        await updateProfile(
            user,
            {
                displayName:
                    fullName
            }
        );


        currentProfile = {

            ...(currentProfile || {}),

            firstName,
            lastName,
            displayName:
                fullName

        };


        if (accountName) {

            accountName.textContent =
                fullName;

        }


        showPersonalInformationMessage(
            "Personal information updated successfully.",
            "success"
        );


        if (
            personalInformationSave
        ) {

            personalInformationSave.innerHTML = `
                <i class="fa-solid fa-check"></i>
                <span>Saved</span>
            `;

        }


        window.setTimeout(
            () => {

                personalInformationSaving =
                    false;


                setPersonalInformationFormDisabled(
                    false
                );


                if (
                    personalInformationSave
                ) {

                    personalInformationSave.innerHTML =
                        originalButtonHTML;

                }


                closePersonalInformationModal();

            },
            800
        );


    } catch (error) {

        console.error(
            "SAVE PERSONAL INFORMATION ERROR:",
            error
        );


        personalInformationSaving =
            false;


        setPersonalInformationFormDisabled(
            false
        );


        if (
            personalInformationSave
        ) {

            personalInformationSave.innerHTML =
                originalButtonHTML;

        }


        showPersonalInformationMessage(
            error?.code ===
                "permission-denied"
                ? "Your account does not have permission to update this information."
                : "Unable to save your information. Please try again."
        );

    }

}


// ==========================================================
// CONTACT DETAILS — PHONE NORMALIZATION
// ==========================================================

function normalizePhoneInput(
    value
) {

    let digits =
        String(
            value ||
            ""
        ).replace(
            /\D/g,
            ""
        );


    if (
        digits.startsWith(
            "63"
        ) &&
        digits.length >=
            12
    ) {

        digits =
            digits.slice(
                2
            );

    }


    if (
        digits.startsWith(
            "0"
        )
    ) {

        digits =
            digits.slice(
                1
            );

    }


    return digits.slice(
        0,
        10
    );

}


function getStoredPhoneForInput() {

    return normalizePhoneInput(
        currentProfile?.phone ||
        currentProfile?.mobileNumber ||
        currentProfile?.contactNumber ||
        ""
    );

}


// ==========================================================
// CONTACT DETAILS — MESSAGE
// ==========================================================

function clearContactDetailsMessage() {

    if (
        !contactDetailsMessage
    ) {
        return;
    }


    contactDetailsMessage.hidden =
        true;


    contactDetailsMessage.textContent =
        "";


    contactDetailsMessage.className =
        "manage-form-message";

}


function showContactDetailsMessage(
    message,
    type = "error"
) {

    if (
        !contactDetailsMessage
    ) {
        return;
    }


    contactDetailsMessage.hidden =
        false;


    contactDetailsMessage.textContent =
        message;


    contactDetailsMessage.className =
        `manage-form-message ${type}`;

}


// ==========================================================
// CONTACT DETAILS — OPEN / CLOSE
// ==========================================================

function openContactDetailsModal() {

    const user =
        auth.currentUser;


    if (
        !user ||
        !contactDetailsModal
    ) {
        return;
    }


    if (contactEmail) {

        contactEmail.value =
            user.email ||
            currentProfile?.email ||
            "";

    }


    if (contactMobile) {

        contactMobile.value =
            getStoredPhoneForInput();

    }


    renderContactEmailStatus(
        user
    );


    clearContactDetailsMessage();


    openModal(
        contactDetailsModal,
        contactMobile
    );

}


function closeContactDetailsModal() {

    if (
        contactDetailsSaving
    ) {
        return;
    }


    closeModal(
        contactDetailsModal
    );

}


// ==========================================================
// CONTACT DETAILS — FORM STATE
// ==========================================================

function setContactDetailsFormDisabled(
    disabled
) {

    if (contactMobile) {
        contactMobile.disabled =
            disabled;
    }


    if (contactDetailsSave) {
        contactDetailsSave.disabled =
            disabled;
    }


    if (contactDetailsCancel) {
        contactDetailsCancel.disabled =
            disabled;
    }


    if (contactDetailsClose) {
        contactDetailsClose.disabled =
            disabled;
    }

}


// ==========================================================
// CONTACT DETAILS — SAVE
// ==========================================================

async function saveContactDetails(
    event
) {

    event.preventDefault();


    const user =
        auth.currentUser;


    if (
        !user ||
        contactDetailsSaving
    ) {
        return;
    }


    const mobileDigits =
        normalizePhoneInput(
            contactMobile?.value
        );


    clearContactDetailsMessage();


    if (
        !/^9\d{9}$/.test(
            mobileDigits
        )
    ) {

        showContactDetailsMessage(
            "Please enter a valid Philippine mobile number."
        );


        contactMobile?.focus();

        return;
    }


    /*
     * Store the familiar PH local format because existing
     * Trips Wonder booking code reads profile.phone.
     */
    const phone =
        `0${mobileDigits}`;


    const originalButtonHTML =
        contactDetailsSave
            ?.innerHTML ||
        "";


    try {

        contactDetailsSaving =
            true;


        setContactDetailsFormDisabled(
            true
        );


        if (
            contactDetailsSave
        ) {

            contactDetailsSave.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Saving...</span>
            `;

        }


        await setDoc(

            doc(
                db,
                "users",
                user.uid
            ),

            {
                phone,
                updatedAt:
                    serverTimestamp()
            },

            {
                merge: true
            }

        );


        currentProfile = {

            ...(currentProfile || {}),

            phone

        };


        showContactDetailsMessage(
            "Contact details updated successfully.",
            "success"
        );


        if (
            contactDetailsSave
        ) {

            contactDetailsSave.innerHTML = `
                <i class="fa-solid fa-check"></i>
                <span>Saved</span>
            `;

        }


        window.setTimeout(
            () => {

                contactDetailsSaving =
                    false;


                setContactDetailsFormDisabled(
                    false
                );


                if (
                    contactDetailsSave
                ) {

                    contactDetailsSave.innerHTML =
                        originalButtonHTML;

                }


                closeContactDetailsModal();

            },
            800
        );


    } catch (error) {

        console.error(
            "SAVE CONTACT DETAILS ERROR:",
            error
        );


        contactDetailsSaving =
            false;


        setContactDetailsFormDisabled(
            false
        );


        if (
            contactDetailsSave
        ) {

            contactDetailsSave.innerHTML =
                originalButtonHTML;

        }


        showContactDetailsMessage(
            error?.code ===
                "permission-denied"
                ? "Your account does not have permission to update your contact details."
                : "Unable to save your contact details. Please try again."
        );

    }

}


// ==========================================================
// CONTACT INPUT
// ==========================================================

contactMobile?.addEventListener(
    "input",
    () => {

        contactMobile.value =
            normalizePhoneInput(
                contactMobile.value
            );

    }
);


// ==========================================================
// ACCOUNT ACTIONS
// ==========================================================

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

            case "personal-information":

                openPersonalInformationModal();

                break;


            case "contact-details":

                openContactDetailsModal();

                break;


            case "travel-preferences":

                window.location.href =
                    "account-preferences.html";

                break;


            case "privacy":

                window.location.href =
                    "../../privacy-policy.html";

                break;


            case "security":

                console.log(
                    "PASSWORD & SECURITY"
                );

                break;


            case "connected-accounts":

                console.log(
                    "CONNECTED ACCOUNTS"
                );

                break;


            case "pickup-location":

                console.log(
                    "PICKUP LOCATION"
                );

                break;


            case "delete-account":

                console.log(
                    "DELETE ACCOUNT"
                );

                break;


            default:

                console.warn(
                    "UNKNOWN MANAGE ACCOUNT ACTION:",
                    action
                );

                break;

        }

    }
);


// ==========================================================
// PERSONAL INFORMATION EVENTS
// ==========================================================

personalInformationForm
    ?.addEventListener(
        "submit",
        event => {

            void savePersonalInformation(
                event
            );

        }
    );


personalInformationClose
    ?.addEventListener(
        "click",
        closePersonalInformationModal
    );


personalInformationCancel
    ?.addEventListener(
        "click",
        closePersonalInformationModal
    );


personalModalBackdrop
    ?.addEventListener(
        "click",
        closePersonalInformationModal
    );


// ==========================================================
// CONTACT DETAILS EVENTS
// ==========================================================

contactDetailsForm
    ?.addEventListener(
        "submit",
        event => {

            void saveContactDetails(
                event
            );

        }
    );


contactDetailsClose
    ?.addEventListener(
        "click",
        closeContactDetailsModal
    );


contactDetailsCancel
    ?.addEventListener(
        "click",
        closeContactDetailsModal
    );


contactModalBackdrop
    ?.addEventListener(
        "click",
        closeContactDetailsModal
    );


// ==========================================================
// KEYBOARD
// ==========================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {
            return;
        }


        if (
            personalInformationModal
                ?.classList
                .contains(
                    "show"
                ) &&
            !personalInformationSaving
        ) {

            closePersonalInformationModal();

            return;
        }


        if (
            contactDetailsModal
                ?.classList
                .contains(
                    "show"
                ) &&
            !contactDetailsSaving
        ) {

            closeContactDetailsModal();

        }

    }
);


// ==========================================================
// REFRESH AUTH ON FOCUS
// ==========================================================

window.addEventListener(
    "focus",
    async () => {

        const user =
            auth.currentUser;


        if (!user) {
            return;
        }


        try {

            await reload(
                user
            );


            const currentUser =
                auth.currentUser;


            if (!currentUser) {
                return;
            }


            renderEmailStatus(
                currentUser
            );


            renderContactEmailStatus(
                currentUser
            );


            renderProvider(
                currentUser
            );


        } catch (error) {

            console.error(
                "MANAGE ACCOUNT REFRESH ERROR:",
                error
            );

        }

    }
);


// ==========================================================
// CLEANUP
// ==========================================================

window.addEventListener(
    "beforeunload",
    () => {

        unsubscribeProfile?.();

    }
);
