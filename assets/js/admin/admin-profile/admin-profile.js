/* =========================================================
   TWTMS v2
   TRIPS WONDER - ADMIN PROFILE
   =========================================================
   FILE:
   assets/js/admin/admin-profile/admin-profile.js

   RESPONSIBILITIES:
   - Firebase Authentication
   - Firestore users/{uid}
   - First Name / Last Name
   - Contact Number
   - Email display
   - Role
   - Account Status
   - Account Created
   - Account ID
   - Connected Account
   - Profile Photo
   - Firebase Storage upload
   - Save Profile
   - Settings Navigation
   - Back Button

   NOTE:
   - Change Email / Password are handled by security.js
   - Page Setup is handled by page-setup.js
   ========================================================= */

"use strict";

/* =========================================================
   FIREBASE
   ========================================================= */

let auth = null;
let db = null;
let storage = null;

let currentUser = null;
let currentProfile = null;

let firebaseReady = false;
let profileSaving = false;
let selectedPhotoFile = null;
let selectedPhotoPreviewURL = null;


/* =========================================================
   ROLE-BASED SETTINGS ACCESS
   =========================================================

   OWNER ONLY:
   - Page Setup
   - Page Access
   - Legal & Policies
   - System Settings

   ADMIN CAN ACCESS:
   - My Profile
   - Security
   - Account Activity
   ========================================================= */

const OWNER_ONLY_SETTINGS_SECTIONS = new Set([
    "page-setup",
    "page-access",
    "legal",
    "system"
]);


function normalizeSettingsSectionName(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
}


function isOwnerProfile(profile = currentProfile) {

    return String(profile?.role || "")
        .trim()
        .toLowerCase() === "owner";
}


function isOwnerOnlySettingsSection(sectionName) {

    return OWNER_ONLY_SETTINGS_SECTIONS.has(
        normalizeSettingsSectionName(sectionName)
    );
}


function replaceSettingsHash(sectionName = "profile") {

    const newHash =
        `#${sectionName}`;


    if (window.location.hash === newHash) {
        return;
    }


    try {

        window.history.replaceState(
            null,
            "",
            newHash
        );

    } catch (error) {

        console.warn(
            "TWTMS ADMIN PROFILE: Unable to replace settings hash.",
            error
        );
    }
}


function hideOwnerOnlyElement(element) {

    if (!element) {
        return;
    }


    element.hidden =
        true;


    /*
     * Some profile CSS rules use display:flex.
     * Force hidden Owner-only items to stay hidden.
     */

    element.style.setProperty(
        "display",
        "none",
        "important"
    );


    element.setAttribute(
        "aria-hidden",
        "true"
    );


    if (
        element.classList.contains(
            "settings-nav-item"
        )
    ) {

        element.setAttribute(
            "tabindex",
            "-1"
        );


        element.classList.remove(
            "active"
        );


        element.removeAttribute(
            "aria-current"
        );
    }
}


function showOwnerOnlyElement(element) {

    if (!element) {
        return;
    }


    element.hidden =
        false;


    element.style.removeProperty(
        "display"
    );


    element.removeAttribute(
        "aria-hidden"
    );


    element.removeAttribute(
        "tabindex"
    );
}


function openProfileSectionSafely() {

    replaceSettingsHash(
        "profile"
    );


    const profileNav =
        document.querySelector(
            '.settings-nav-item[data-settings-section="profile"]'
        );


    if (profileNav) {

        profileNav.click();

        return;
    }


    const sections =
        document.querySelectorAll(
            ".settings-section[data-settings-section]"
        );


    sections.forEach(
        (section) => {

            const isProfile =
                section.dataset.settingsSection ===
                "profile";


            section.hidden =
                !isProfile;


            section.classList.toggle(
                "active",
                isProfile
            );
        }
    );
}


function applyRoleBasedSettingsAccess(
    profile = currentProfile
) {

    if (!profile) {
        return;
    }


    const owner =
        isOwnerProfile(
            profile
        );


    console.log(
        "TWTMS ADMIN PROFILE ACCESS ROLE:",
        owner
            ? "owner"
            : "admin"
    );


    /* =====================================================
       NAVIGATION ITEMS
    ===================================================== */

    const navItems =
        document.querySelectorAll(
            ".settings-nav-item[data-settings-section]"
        );


    navItems.forEach(
        (item) => {

            const sectionName =
                normalizeSettingsSectionName(
                    item.dataset.settingsSection
                );


            if (
                !isOwnerOnlySettingsSection(
                    sectionName
                )
            ) {
                return;
            }


            if (owner) {

                showOwnerOnlyElement(
                    item
                );

            } else {

                hideOwnerOnlyElement(
                    item
                );
            }
        }
    );


    /* =====================================================
       CONTENT SECTIONS
    ===================================================== */

    const sections =
        document.querySelectorAll(
            ".settings-section[data-settings-section]"
        );


    sections.forEach(
        (section) => {

            const sectionName =
                normalizeSettingsSectionName(
                    section.dataset.settingsSection
                );


            if (
                !isOwnerOnlySettingsSection(
                    sectionName
                )
            ) {
                return;
            }


            if (!owner) {

                hideOwnerOnlyElement(
                    section
                );
            }
        }
    );


    /* =====================================================
       MANUAL HASH PROTECTION
    ===================================================== */

    const currentHash =
        normalizeSettingsSectionName(
            window.location.hash
                .replace("#", "")
        );


    if (
        !owner &&
        isOwnerOnlySettingsSection(
            currentHash
        )
    ) {

        console.warn(
            "TWTMS ADMIN PROFILE: Owner-only section blocked:",
            currentHash
        );


        openProfileSectionSafely();
    }
}


/* =========================================================
   FINAL SETTINGS SECTION VISIBILITY GUARD
   Keeps exactly one settings content section visible.
   This also prevents Page Setup / Page Access modules from
   appearing underneath My Profile during initialization.
   ========================================================= */

let settingsVisibilitySyncing = false;
let settingsVisibilityObserver = null;

function getActiveSettingsSectionName() {

    const activeNav =
        document.querySelector(
            ".settings-nav-item.active[data-settings-section]"
        );

    const activeFromNav =
        normalizeSettingsSectionName(
            activeNav?.dataset?.settingsSection
        );

    if (activeFromNav) {
        return activeFromNav;
    }


    const hash =
        normalizeSettingsSectionName(
            window.location.hash
                .replace("#", "")
        );

    if (hash) {
        return hash;
    }


    return "profile";
}


function enforceSingleSettingsSection() {

    if (settingsVisibilitySyncing) {
        return;
    }

    settingsVisibilitySyncing =
        true;

    try {

        let activeSection =
            getActiveSettingsSectionName();


        /*
         * If an Admin somehow has an Owner-only hash/active item,
         * force the page back to My Profile.
         */
        if (
            currentProfile &&
            !isOwnerProfile(
                currentProfile
            ) &&
            isOwnerOnlySettingsSection(
                activeSection
            )
        ) {

            activeSection =
                "profile";

            replaceSettingsHash(
                "profile"
            );
        }


        const navItems =
            document.querySelectorAll(
                ".settings-nav-item[data-settings-section]"
            );

        navItems.forEach(
            (item) => {

                const sectionName =
                    normalizeSettingsSectionName(
                        item.dataset.settingsSection
                    );

                const isActive =
                    sectionName ===
                    activeSection;

                item.classList.toggle(
                    "active",
                    isActive
                );

                item.setAttribute(
                    "aria-current",
                    isActive
                        ? "page"
                        : "false"
                );
            }
        );


        const sections =
            document.querySelectorAll(
                ".settings-section[data-settings-section]"
            );

        sections.forEach(
            (section) => {

                const sectionName =
                    normalizeSettingsSectionName(
                        section.dataset.settingsSection
                    );

                const isOwnerOnly =
                    isOwnerOnlySettingsSection(
                        sectionName
                    );

                const blockedForAdmin =
                    currentProfile &&
                    !isOwnerProfile(
                        currentProfile
                    ) &&
                    isOwnerOnly;

                const shouldShow =
                    !blockedForAdmin &&
                    sectionName ===
                        activeSection;

                section.hidden =
                    !shouldShow;

                section.classList.toggle(
                    "active",
                    shouldShow
                );

                section.setAttribute(
                    "aria-hidden",
                    String(
                        !shouldShow
                    )
                );
            }
        );

    } finally {

        settingsVisibilitySyncing =
            false;
    }
}


function initializeSettingsVisibilityGuard() {

    enforceSingleSettingsSection();


    window.addEventListener(
        "twtms:settings-section-change",
        () => {

            window.requestAnimationFrame(
                enforceSingleSettingsSection
            );
        }
    );


    window.addEventListener(
        "hashchange",
        () => {

            window.requestAnimationFrame(
                enforceSingleSettingsSection
            );
        }
    );


    const settingsMain =
        document.querySelector(
            ".settings-main"
        );

    if (
        settingsMain &&
        typeof MutationObserver !==
            "undefined"
    ) {

        settingsVisibilityObserver =
            new MutationObserver(
                (mutations) => {

                    if (settingsVisibilitySyncing) {
                        return;
                    }

                    const sectionChanged =
                        mutations.some(
                            (mutation) => {

                                const target =
                                    mutation.target;

                                return (
                                    target instanceof
                                        HTMLElement &&
                                    target.matches(
                                        ".settings-section[data-settings-section]"
                                    )
                                );
                            }
                        );

                    if (!sectionChanged) {
                        return;
                    }

                    window.requestAnimationFrame(
                        enforceSingleSettingsSection
                    );
                }
            );

        settingsVisibilityObserver.observe(
            settingsMain,
            {
                subtree: true,
                attributes: true,
                attributeFilter: [
                    "hidden",
                    "class"
                ]
            }
        );
    }


    /*
     * Other profile modules are ES modules and initialize
     * independently. Re-check after the first render cycle.
     */
    window.addEventListener(
        "load",
        () => {

            window.requestAnimationFrame(
                enforceSingleSettingsSection
            );

            window.setTimeout(
                enforceSingleSettingsSection,
                150
            );

            window.setTimeout(
                enforceSingleSettingsSection,
                500
            );
        },
        {
            once: true
        }
    );
}


/* =========================================================
   FIREBASE SDK FUNCTIONS
   ========================================================= */

let onAuthStateChanged = null;

let firestoreDoc = null;
let firestoreGetDoc = null;
let firestoreUpdateDoc = null;
let firestoreServerTimestamp = null;

let storageRef = null;
let storageUploadBytes = null;
let storageGetDownloadURL = null;


/* =========================================================
   FIREBASE SDK URLS
   ========================================================= */

const FIREBASE_AUTH_URL =
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const FIREBASE_FIRESTORE_URL =
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const FIREBASE_STORAGE_URL =
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";


/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

async function initializeFirebase() {

    try {

        /*
         * IMPORTANT:
         * Firebase is already initialized by
         * firebase-config.js.
         *
         * We only import the existing instances.
         */

        const firebaseConfigModule =
            await import(
                "../../firebase/firebase-config.js"
            );


        auth =
            firebaseConfigModule.auth;

        db =
            firebaseConfigModule.db;

        storage =
            firebaseConfigModule.storage;


        /* =====================================================
           AUTH MODULE
        ===================================================== */

        const authModule =
            await import(
                FIREBASE_AUTH_URL
            );


        onAuthStateChanged =
            authModule.onAuthStateChanged;


        /* =====================================================
           FIRESTORE MODULE
        ===================================================== */

        const firestoreModule =
            await import(
                FIREBASE_FIRESTORE_URL
            );


        firestoreDoc =
            firestoreModule.doc;

        firestoreGetDoc =
            firestoreModule.getDoc;

        firestoreUpdateDoc =
            firestoreModule.updateDoc;

        firestoreServerTimestamp =
            firestoreModule.serverTimestamp;


        /* =====================================================
           STORAGE MODULE
        ===================================================== */

        const storageModule =
            await import(
                FIREBASE_STORAGE_URL
            );


        storageRef =
            storageModule.ref;

        storageUploadBytes =
            storageModule.uploadBytes;

        storageGetDownloadURL =
            storageModule.getDownloadURL;


        firebaseReady =
            true;


        console.log(
            "Trips Wonder Admin Profile initialized with Firebase / Firestore / Storage."
        );


        initializeAuthListener();

    } catch (error) {

        console.error(
            "TWTMS ADMIN PROFILE FIREBASE INITIALIZATION ERROR:",
            error
        );


        showProfileMessage(
            "Unable to initialize Firebase. Please refresh the page.",
            "error"
        );
    }
}


/* =========================================================
   AUTH LISTENER
   ========================================================= */

function initializeAuthListener() {

    if (
        !firebaseReady ||
        !auth ||
        !onAuthStateChanged
    ) {

        return;
    }


    onAuthStateChanged(
        auth,
        async (user) => {

            if (!user) {

                currentUser =
                    null;

                currentProfile =
                    null;


                console.warn(
                    "TWTMS ADMIN PROFILE: No authenticated user."
                );


                showProfileMessage(
                    "No authenticated account found.",
                    "error"
                );


                return;
            }


            currentUser =
                user;


            console.log(
                "TWTMS ADMIN PROFILE AUTH USER:",
                user.uid
            );


            /*
             * Update connected account immediately.
             */

            updateConnectedAccount(
                user
            );


            /*
             * Load Firestore profile.
             */

            await loadFirebaseProfile();
        }
    );
}


/* =========================================================
   LOAD FIRESTORE PROFILE
   ========================================================= */

async function loadFirebaseProfile() {

    if (
        !firebaseReady ||
        !currentUser
    ) {

        return;
    }


    try {

        /*
         * IMPORTANT:
         * The user document is:
         *
         * users/{uid}
         *
         * NOT a collection reference.
         */

        const userReference =
            firestoreDoc(
                db,
                "users",
                currentUser.uid
            );


        const snapshot =
            await firestoreGetDoc(
                userReference
            );


        if (!snapshot.exists()) {

            console.error(
                "TWTMS ADMIN PROFILE: Firestore user document not found."
            );


            showProfileMessage(
                "Your account profile was not found in Firestore.",
                "error"
            );


            return;
        }


        currentProfile =
            snapshot.data();


        /*
         * Apply Owner/Admin access only after
         * the Firestore role is available.
         */

        applyRoleBasedSettingsAccess(
            currentProfile
        );


        console.log(
            "TWTMS ADMIN PROFILE LOADED:",
            currentProfile
        );


        renderProfile(
            currentProfile
        );


        /*
         * Re-apply the single-section rule after the
         * Firestore role/profile has finished loading.
         */
        enforceSingleSettingsSection();


    } catch (error) {

        console.error(
            "TWTMS ADMIN PROFILE LOAD ERROR:",
            error
        );


        showProfileMessage(
            "Unable to load your profile information.",
            "error"
        );
    }
}


/* =========================================================
   RENDER PROFILE
   ========================================================= */

function renderProfile(profile) {

    if (!profile) {
        return;
    }


    /* =====================================================
       FIRST NAME
    ===================================================== */

    setInputValue(
        "firstName",
        profile.firstName || ""
    );


    /* =====================================================
       LAST NAME
    ===================================================== */

    setInputValue(
        "lastName",
        profile.lastName || ""
    );


    /* =====================================================
       EMAIL
    ===================================================== */

    const email =
        profile.email ||
        currentUser?.email ||
        "";


    setInputValue(
        "email",
        email
    );


    /* =====================================================
       CONTACT NUMBER
    ===================================================== */

    const phone =
        profile.phone ||
        profile.contactNumber ||
        "";


    setInputValue(
        "contactNumber",
        phone
    );


    /* =====================================================
       ROLE
    ===================================================== */

    const role =
        formatRole(
            profile.role
        );


    setText(
        "role",
        role
    );


    setText(
        "profileRole",
        role
    );


    /* =====================================================
       ACCOUNT STATUS
    ===================================================== */

    const status =
        formatStatus(
            profile.status
        );


    setText(
        "accountStatus",
        status
    );


    setText(
        "profileStatus",
        status
    );


    /* =====================================================
       ACCOUNT CREATED
    ===================================================== */

    const createdDate =
        profile.createdAt ||
        currentUser?.metadata?.creationTime ||
        "";


    setText(
        "accountCreated",
        formatFirestoreDate(
            createdDate
        )
    );


    /* =====================================================
       ACCOUNT ID
    ===================================================== */

    const accountId =
        profile.uid ||
        currentUser?.uid ||
        "—";


    setText(
        "accountId",
        accountId
    );


    /* =====================================================
       CONNECTED ACCOUNT
    ===================================================== */

    updateConnectedAccount(
        currentUser
    );


    /* =====================================================
       PROFILE PHOTO
    ===================================================== */

    updateProfilePhoto(
        profile.photoURL || ""
    );


    /* =====================================================
       SIDEBAR PROFILE
    ===================================================== */

    updateSidebarProfile(
        profile
    );


    /* =====================================================
       ACCOUNT ACTIVITY
    ===================================================== */

    renderAccountActivity(
        profile
    );
}


/* =========================================================
   INPUT HELPER
   ========================================================= */

function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.value =
        value ?? "";
}


/* =========================================================
   TEXT HELPER
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.textContent =
        value ?? "—";
}


/* =========================================================
   FORMAT ROLE
   ========================================================= */

function formatRole(
    role
) {

    const value =
        String(
            role || ""
        )
            .trim()
            .toLowerCase();


    if (value === "owner") {

        return "Owner";
    }


    if (
        value === "admin" ||
        value === "administrator"
    ) {

        return "Administrator";
    }


    if (value === "manager") {

        return "Manager";
    }


    if (value === "staff") {

        return "Staff";
    }


    if (value === "client") {

        return "Client";
    }


    if (!value) {

        return "—";
    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}


/* =========================================================
   FORMAT STATUS
   ========================================================= */

function formatStatus(
    status
) {

    const value =
        String(
            status || ""
        )
            .trim()
            .toLowerCase();


    if (value === "active") {

        return "Active";
    }


    if (value === "inactive") {

        return "Inactive";
    }


    if (value === "suspended") {

        return "Suspended";
    }


    if (!value) {

        return "—";
    }


    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}


/* =========================================================
   UPDATE SIDEBAR PROFILE
   ========================================================= */

function updateSidebarProfile(
    profile
) {

    if (!profile) {
        return;
    }


    const firstName =
        profile.firstName ||
        "";


    const lastName =
        profile.lastName ||
        "";


    const fullName =
        `${firstName} ${lastName}`
            .trim() ||
        "Admin";


    const role =
        formatRole(
            profile.role
        );


    const sidebarName =
        document.querySelector(
            ".sidebar .admin-info strong"
        );


    const sidebarRole =
        document.querySelector(
            ".sidebar .admin-info span"
        );


    if (sidebarName) {

        sidebarName.textContent =
            fullName;
    }


    if (sidebarRole) {

        sidebarRole.textContent =
            role;
    }
}


/* =========================================================
   CONNECTED ACCOUNT
   ========================================================= */

function updateConnectedAccount(
    user
) {

    const emailElement =
        document.getElementById(
            "connectedAccountEmail"
        );


    if (!emailElement) {
        return;
    }


    if (!user) {

        emailElement.textContent =
            "No authenticated account";


        return;
    }


    emailElement.textContent =
        user.email ||
        "Authenticated account";
}


/* =========================================================
   PROFILE PHOTO
   ========================================================= */

function updateProfilePhoto(
    photoURL
) {

    const photo =
        document.getElementById(
            "profilePhoto"
        );


    if (!photo) {
        return;
    }


    if (photoURL) {

        photo.src =
            photoURL;


        photo.alt =
            "Admin Profile Photo";


        return;
    }


    /*
     * Keep original logo when there is
     * no uploaded profile photo.
     */

    if (
        !photo.dataset.defaultSrc
    ) {

        photo.dataset.defaultSrc =
            photo.src;
    }


    photo.src =
        photo.dataset.defaultSrc;
}


/* =========================================================
   CHANGE PHOTO BUTTON
   ========================================================= */

function initializePhotoControls() {

    const changeButton =
        document.getElementById(
            "changePhotoButton"
        );


    const input =
        document.getElementById(
            "profilePhotoInput"
        );


    if (
        !changeButton ||
        !input
    ) {

        return;
    }


    if (
        changeButton.dataset.initialized ===
        "true"
    ) {

        return;
    }


    changeButton.dataset.initialized =
        "true";


    changeButton.addEventListener(
        "click",
        () => {

            input.click();
        }
    );


    if (
        input.dataset.initialized ===
        "true"
    ) {

        return;
    }


    input.dataset.initialized =
        "true";


    input.addEventListener(
        "change",
        handlePhotoChange
    );
}


/* =========================================================
   HANDLE PHOTO CHANGE
   ========================================================= */

function handlePhotoChange(
    event
) {

    const file =
        event.target.files?.[0];


    if (!file) {

        return;
    }


    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        showProfileMessage(
            "Please select a JPG, PNG, or WEBP image.",
            "error"
        );


        event.target.value =
            "";


        return;
    }


    const maxSize =
        2 * 1024 * 1024;


    if (
        file.size >
        maxSize
    ) {

        showProfileMessage(
            "Profile photo must not exceed 2MB.",
            "error"
        );


        event.target.value =
            "";


        return;
    }


    selectedPhotoFile =
        file;


    if (
        selectedPhotoPreviewURL
    ) {

        URL.revokeObjectURL(
            selectedPhotoPreviewURL
        );
    }


    selectedPhotoPreviewURL =
        URL.createObjectURL(
            file
        );


    updateProfilePhoto(
        selectedPhotoPreviewURL
    );


    showProfileMessage(
        "Photo selected. Click Save Changes to upload it.",
        "info"
    );
}


/* =========================================================
   UPLOAD PROFILE PHOTO
   ========================================================= */

async function uploadProfilePhoto() {

    if (!selectedPhotoFile) {

        return null;
    }


    if (
        !storage ||
        !storageRef ||
        !storageUploadBytes ||
        !storageGetDownloadURL
    ) {

        throw new Error(
            "Firebase Storage is not available."
        );
    }


    if (!currentUser) {

        throw new Error(
            "No authenticated user found."
        );
    }


    const photoReference =
        storageRef(
            storage,
            `profilePhotos/${currentUser.uid}/profile`
        );


    const metadata = {

        contentType:
            selectedPhotoFile.type,


        customMetadata: {

            uid:
                currentUser.uid,


            purpose:
                "admin-profile-photo"
        }
    };


    console.log(
        "TWTMS PROFILE PHOTO UPLOAD START:",
        photoReference.fullPath
    );


    await storageUploadBytes(
        photoReference,
        selectedPhotoFile,
        metadata
    );


    const downloadURL =
        await storageGetDownloadURL(
            photoReference
        );


    console.log(
        "TWTMS PROFILE PHOTO UPLOAD SUCCESS."
    );


    return downloadURL;
}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

async function saveProfile() {

    if (profileSaving) {

        return;
    }


    if (
        !firebaseReady ||
        !db ||
        !currentUser
    ) {

        showProfileMessage(
            "Your Firebase account is not ready yet.",
            "error"
        );


        return;
    }


    const firstName =
        document
            .getElementById(
                "firstName"
            )
            ?.value
            .trim() ||
        "";


    const lastName =
        document
            .getElementById(
                "lastName"
            )
            ?.value
            .trim() ||
        "";


    const contactNumber =
        document
            .getElementById(
                "contactNumber"
            )
            ?.value
            .trim() ||
        "";


    /*
     * Email is not editable here.
     */

    const email =
        currentUser.email ||
        currentProfile?.email ||
        "";


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!firstName) {

        showProfileMessage(
            "Please enter your first name.",
            "error"
        );


        document
            .getElementById(
                "firstName"
            )
            ?.focus();


        return;
    }


    if (!lastName) {

        showProfileMessage(
            "Please enter your last name.",
            "error"
        );


        document
            .getElementById(
                "lastName"
            )
            ?.focus();


        return;
    }


    if (
        contactNumber &&
        !isValidPhone(
            contactNumber
        )
    ) {

        showProfileMessage(
            "Please enter a valid Philippine contact number.",
            "error"
        );


        document
            .getElementById(
                "contactNumber"
            )
            ?.focus();


        return;
    }


    profileSaving =
        true;


    const saveButton =
        document.getElementById(
            "saveChangesButton"
        );


    setSaveButtonState(
        saveButton,
        true
    );


    try {

        /* =================================================
           PHOTO
        ================================================= */

        let photoURL =
            currentProfile?.photoURL ||
            "";


        if (selectedPhotoFile) {

            showProfileMessage(
                "Uploading profile photo...",
                "info"
            );


            photoURL =
                await uploadProfilePhoto();
        }


        /* =================================================
           FIRESTORE DOCUMENT
        ================================================= */

        const userReference =
            firestoreDoc(
                db,
                "users",
                currentUser.uid
            );


        /*
         * DO NOT overwrite:
         *
         * role
         * status
         * uid
         * createdAt
         */

        const updateData = {

            firstName:
                firstName,


            lastName:
                lastName,


            phone:
                contactNumber,


            email:
                email,


            updatedAt:
                firestoreServerTimestamp()
        };


        if (photoURL) {

            updateData.photoURL =
                photoURL;
        }


        await firestoreUpdateDoc(
            userReference,
            updateData
        );


        /* =================================================
           UPDATE LOCAL PROFILE
        ================================================= */

        currentProfile = {

            ...currentProfile,


            firstName:
                firstName,


            lastName:
                lastName,


            phone:
                contactNumber,


            email:
                email,


            ...(photoURL
                ? {
                    photoURL:
                        photoURL
                }
                : {})
        };


        selectedPhotoFile =
            null;


        if (
            selectedPhotoPreviewURL
        ) {

            URL.revokeObjectURL(
                selectedPhotoPreviewURL
            );


            selectedPhotoPreviewURL =
                null;
        }


        const photoInput =
            document.getElementById(
                "profilePhotoInput"
            );


        if (photoInput) {

            photoInput.value =
                "";
        }


        renderProfile(
            currentProfile
        );


        showProfileMessage(
            "Profile changes saved successfully.",
            "success"
        );


        console.log(
            "TWTMS ADMIN PROFILE UPDATED:",
            currentUser.uid
        );


    } catch (error) {

        console.error(
            "TWTMS ADMIN PROFILE SAVE ERROR:",
            error
        );


        let message =
            "Unable to save your profile.";


        if (
            error?.code ===
            "storage/unauthorized"
        ) {

            message =
                "Profile photo upload was blocked by Firebase Storage Rules.";

        } else if (
            error?.code ===
            "storage/object-not-found"
        ) {

            message =
                "Firebase Storage could not find the uploaded file.";

        } else if (
            error?.code ===
            "permission-denied" ||
            error?.code ===
            "firestore/permission-denied"
        ) {

            message =
                "You do not have permission to update this profile.";
        }


        showProfileMessage(
            message,
            "error"
        );


    } finally {

        profileSaving =
            false;


        setSaveButtonState(
            saveButton,
            false
        );
    }
}


/* =========================================================
   SAVE BUTTON STATE
   ========================================================= */

function setSaveButtonState(
    button,
    loading
) {

    if (!button) {

        return;
    }


    if (loading) {

        button.disabled =
            true;


        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Saving...</span>
        `;

    } else {

        button.disabled =
            false;


        button.innerHTML = `
            <i class="fa-solid fa-check"></i>
            <span>Save Changes</span>
        `;
    }
}


/* =========================================================
   PROFILE FORM
   ========================================================= */

function initializeProfileForm() {

    const form =
        document.getElementById(
            "profileForm"
        );


    if (!form) {

        return;
    }


    if (
        form.dataset.initialized ===
        "true"
    ) {

        return;
    }


    form.dataset.initialized =
        "true";


    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            saveProfile();
        }
    );
}


/* =========================================================
   SETTINGS NAVIGATION
   ========================================================= */

function initializeSettingsNavigation() {

    const navItems =
        document.querySelectorAll(
            ".settings-nav-item"
        );


    const sections =
        document.querySelectorAll(
            ".settings-section"
        );


    if (!navItems.length) {

        console.warn(
            "TWTMS ADMIN PROFILE: Settings navigation items not found."
        );


        return;
    }


    function openSettingsSection(
        sectionName,
        updateHash = true
    ) {

        if (!sectionName) {

            return;
        }


        /* =====================================================
           OWNER-ONLY SECTION GUARD
        ===================================================== */

        if (
            currentProfile &&
            !isOwnerProfile(
                currentProfile
            ) &&
            isOwnerOnlySettingsSection(
                sectionName
            )
        ) {

            console.warn(
                "TWTMS ADMIN PROFILE: Blocked Owner-only section:",
                sectionName
            );


            sectionName =
                "profile";


            updateHash =
                false;


            replaceSettingsHash(
                "profile"
            );
        }


        /* =====================================================
           NAVIGATION
        ===================================================== */

        navItems.forEach(
            (item) => {

                const itemSection =
                    item.dataset.settingsSection;


                const isActive =
                    itemSection ===
                    sectionName;


                item.classList.toggle(
                    "active",
                    isActive
                );


                item.setAttribute(
                    "aria-current",
                    isActive
                        ? "page"
                        : "false"
                );
            }
        );


        /* =====================================================
           CONTENT
        ===================================================== */

        sections.forEach(
            (section) => {

                const sectionNameFromHTML =
                    section.dataset.settingsSection;


                const isActive =
                    sectionNameFromHTML ===
                    sectionName;


                /*
                 * Admin must never re-show an Owner-only
                 * section through the normal navigation code.
                 */

                if (
                    currentProfile &&
                    !isOwnerProfile(
                        currentProfile
                    ) &&
                    isOwnerOnlySettingsSection(
                        sectionNameFromHTML
                    )
                ) {

                    hideOwnerOnlyElement(
                        section
                    );


                    return;
                }


                section.hidden =
                    !isActive;


                section.classList.toggle(
                    "active",
                    isActive
                );
            }
        );


        /* =====================================================
           HASH
        ===================================================== */

        if (updateHash) {

            try {

                const newHash =
                    `#${sectionName}`;


                if (
                    window.location.hash !==
                    newHash
                ) {

                    window.history.replaceState(
                        null,
                        "",
                        newHash
                    );
                }

            } catch (error) {

                console.warn(
                    "TWTMS ADMIN PROFILE: Unable to update URL hash.",
                    error
                );
            }
        }


        /*
         * Give other modules a chance to know
         * which section was opened.
         */

        window.dispatchEvent(
            new CustomEvent(
                "twtms:settings-section-change",
                {
                    detail: {

                        section:
                            sectionName
                    }
                }
            )
        );
    }


    /* =====================================================
       CLICK EVENTS
    ===================================================== */

    navItems.forEach(
        (item) => {

            if (
                item.dataset.navigationInitialized ===
                "true"
            ) {

                return;
            }


            item.dataset.navigationInitialized =
                "true";


            item.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();


                    const sectionName =
                        item.dataset.settingsSection;


                    openSettingsSection(
                        sectionName
                    );
                }
            );
        }
    );


    /* =====================================================
       INITIAL SECTION
    ===================================================== */

    const hash =
        window.location.hash
            .replace("#", "")
            .trim();


    const validHash =
        hash &&
        Array.from(
            navItems
        ).some(
            (item) =>
                item.dataset.settingsSection ===
                hash
        );


    if (validHash) {

        openSettingsSection(
            hash,
            false
        );

    } else {

        const activeNav =
            document.querySelector(
                ".settings-nav-item.active"
            );


        const initialSection =
            activeNav?.dataset.settingsSection ||
            navItems[0]?.dataset.settingsSection ||
            "profile";


        openSettingsSection(
            initialSection,
            false
        );
    }
}


/* =========================================================
   HASH CHANGE
   ========================================================= */

function initializeHashNavigation() {

    if (
        window.__twtmsHashNavigationInitialized
    ) {

        return;
    }


    window.__twtmsHashNavigationInitialized =
        true;


    window.addEventListener(
        "hashchange",
        () => {

            const hash =
                window.location.hash
                    .replace("#", "")
                    .trim();


            if (!hash) {

                return;
            }


            /* =================================================
               OWNER-ONLY HASH GUARD
            ================================================= */

            if (
                currentProfile &&
                !isOwnerProfile(
                    currentProfile
                ) &&
                isOwnerOnlySettingsSection(
                    hash
                )
            ) {

                console.warn(
                    "TWTMS ADMIN PROFILE: Owner-only hash blocked:",
                    hash
                );


                openProfileSectionSafely();


                return;
            }


            const navItem =
                document.querySelector(
                    `.settings-nav-item[data-settings-section="${hash}"]`
                );


            if (navItem) {

                navItem.click();
            }
        }
    );
}


/* =========================================================
   BACK BUTTON
   ========================================================= */

function initializeBackButton() {

    const button =
        document.getElementById(
            "adminProfileBackButton"
        );


    if (!button) {

        return;
    }


    if (
        button.dataset.initialized ===
        "true"
    ) {

        return;
    }


    button.dataset.initialized =
        "true";


    button.addEventListener(
        "click",
        () => {

            if (
                window.history.length >
                1
            ) {

                window.history.back();

            } else {

                window.location.href =
                    "../../pages/admin/dashboard.html";
            }
        }
    );
}


/* =========================================================
   ACCOUNT ACTIVITY
   ========================================================= */

function renderAccountActivity(
    profile
) {

    if (!profile) {

        return;
    }


    setText(
        "lastLogin",
        formatFirestoreDate(
            profile.lastLogin
        )
    );


    setText(
        "lastPasswordUpdate",
        formatFirestoreDate(
            profile.lastPasswordUpdate
        )
    );
}


/* =========================================================
   DATE FORMATTER
   ========================================================= */

function formatFirestoreDate(
    value
) {

    if (!value) {

        return "—";
    }


    try {

        let date =
            null;


        /*
         * Firebase Timestamp
         */

        if (
            typeof value.toDate ===
            "function"
        ) {

            date =
                value.toDate();
        }


        /*
         * JavaScript Date
         */

        else if (
            value instanceof Date
        ) {

            date =
                value;
        }


        /*
         * String
         */

        else if (
            typeof value ===
            "string"
        ) {

            date =
                new Date(
                    value
                );
        }


        /*
         * Timestamp-like object
         */

        else if (
            value.seconds !==
            undefined
        ) {

            date =
                new Date(
                    Number(
                        value.seconds
                    ) *
                    1000
                );
        }


        if (
            !date ||
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "—";
        }


        return new Intl.DateTimeFormat(
            "en-PH",
            {
                month:
                    "long",

                day:
                    "numeric",

                year:
                    "numeric"
            }
        ).format(
            date
        );


    } catch (error) {

        console.error(
            "TWTMS DATE FORMAT ERROR:",
            error
        );


        return "—";
    }
}


/* =========================================================
   PHONE VALIDATION
   ========================================================= */

function isValidPhone(
    phone
) {

    const cleaned =
        String(
            phone
        )
            .replace(
                /[\s()-]/g,
                ""
            );


    /*
     * Supports:
     *
     * 09123456789
     * +639123456789
     */

    return /^(09\d{9}|\+639\d{9})$/.test(
        cleaned
    );
}


/* =========================================================
   PROFILE MESSAGE / TOAST
   ========================================================= */

function showProfileMessage(
    message,
    type = "info"
) {

    let toast =
        document.getElementById(
            "profileToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "profileToast";


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
        window.__twtmsProfileToastTimer
    );


    window.__twtmsProfileToastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3500
        );
}


/* =========================================================
   INITIALIZE MODULE
   ========================================================= */

function initializeAdminProfile() {

    /*
     * UI first.
     */

    initializeSettingsNavigation();


    initializeSettingsVisibilityGuard();


    initializeHashNavigation();


    initializeBackButton();


    initializePhotoControls();


    initializeProfileForm();


    /*
     * Firebase after UI.
     */

    initializeFirebase();
}


/* =========================================================
   PUBLIC API
   ========================================================= */

window.saveProfile =
    saveProfile;


window.saveAdminProfile =
    saveProfile;


/* =========================================================
   ROLE ACCESS PUBLIC API
   ========================================================= */

window.TWTMSAdminProfileAccess = {

    isOwner: () =>
        isOwnerProfile(
            currentProfile
        ),


    isOwnerOnlySection:
        isOwnerOnlySettingsSection,


    apply: () =>
        applyRoleBasedSettingsAccess(
            currentProfile
        )
};


/* =========================================================
   DOM READY
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeAdminProfile,
        {
            once:
                true
        }
    );

} else {

    initializeAdminProfile();
}