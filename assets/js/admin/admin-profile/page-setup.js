/* =========================================================
   TRIPS WONDER
   PAGE SETUP
   Business / Website Configuration

   FINAL VERSION

   Handles:
   - Business information
   - Business contact
   - Social accounts
   - Business address
   - Business logo
   - Firestore load/save
   - LocalStorage fallback
   - Logo preview
   - Reset
   - Validation
   - Automatic form creation
   - No duplicate initialization
========================================================= */

"use strict";

/* =========================================================
   GLOBAL STATE
========================================================= */

let pageSetupInitialized = false;

let pageSetupAuth = null;
let pageSetupDb = null;
let pageSetupStorage = null;

let pageSetupUser = null;

let firestoreDoc = null;
let firestoreGetDoc = null;
let firestoreSetDoc = null;

let storageRef = null;
let storageUploadBytes = null;
let storageGetDownloadURL = null;

let pageSetupFirebaseReady = false;
let pageSetupSaving = false;

let pageSetupElements = {};


/* =========================================================
   FIREBASE SDK
========================================================= */

const FIREBASE_AUTH_URL =
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const FIREBASE_FIRESTORE_URL =
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const FIREBASE_STORAGE_URL =
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";


/* =========================================================
   FIRESTORE LOCATION
========================================================= */

const PAGE_SETUP_COLLECTION =
    "systemSettings";

const PAGE_SETUP_DOCUMENT =
    "general";


/* =========================================================
   LOCAL STORAGE
========================================================= */

const PAGE_SETUP_LOCAL_KEY =
    "tripsWonderPageSettings";


/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const defaultPageSetupSettings = {

    businessName:
        "Trips Wonder Travel and Tours",

    businessDescription:
        "Proudly Filipino-owned travel agency offering organized and affordable travel experiences.",

    businessEmail:
        "tripswondertour@gmail.com",

    businessContact:
        "",

    facebookPage:
        "Trips Wonder Travel and Tours",

    tiktokAccount:
        "@tripswondertour",

    businessAddress:
        "",

    businessLogo:
        "../../assets/images/logo.png"
};


/* =========================================================
   INITIALIZE
========================================================= */

async function initializePageSetup() {

    if (pageSetupInitialized) {
        return;
    }

    pageSetupInitialized = true;

    console.log(
        "TWMS Page Setup initializing..."
    );


    /*
     * Make sure the Page Setup section exists.
     */

    const section =
        document.getElementById(
            "pageSetupSection"
        );

    if (!section) {

        console.warn(
            "Page Setup: #pageSetupSection was not found."
        );

        return;
    }


    /*
     * Build the form if HTML does not
     * already contain it.
     */

    ensurePageSetupMarkup();


    /*
     * Collect DOM elements.
     */

    collectPageSetupElements();


    /*
     * Initialize events.
     */

    initializePageSetupEvents();


    /*
     * Load local data first.
     * This makes the page immediately usable.
     */

    loadLocalSettings();


    /*
     * Initialize Firebase.
     */

    await initializePageSetupFirebase();


    console.log(
        "Trips Wonder Page Setup initialized."
    );
}


/* =========================================================
   ENSURE PAGE SETUP MARKUP
========================================================= */

function ensurePageSetupMarkup() {

    const section =
        document.getElementById(
            "pageSetupSection"
        );

    if (!section) {
        return;
    }


    /*
     * If the form already exists,
     * do not create another one.
     */

    if (
        section.querySelector(
            "#pageSetupForm"
        )
    ) {

        return;
    }


    /*
     * Clear the placeholder only.
     */

    section.innerHTML = `
        <div class="section-heading">

            <h2>
                Page Setup
            </h2>

            <p>
                Manage your business and page information.
            </p>

        </div>


        <div class="page-setup-card">

            <form
                id="pageSetupForm"
                class="page-setup-form"
                autocomplete="off"
            >

                <!-- =====================================
                     BUSINESS INFORMATION
                ====================================== -->

                <div class="page-setup-block">

                    <div class="page-setup-block-header">

                        <div class="page-setup-block-icon">
                            <i class="fa-solid fa-building"></i>
                        </div>

                        <div>

                            <h3>
                                Business Information
                            </h3>

                            <p>
                                Basic information displayed
                                throughout your website and
                                booking system.
                            </p>

                        </div>

                    </div>


                    <div class="page-setup-grid">

                        <div class="form-group">

                            <label for="businessName">
                                Business Name
                            </label>

                            <input
                                type="text"
                                id="businessName"
                                name="businessName"
                                placeholder="Business name"
                                autocomplete="organization"
                            >

                        </div>


                        <div class="form-group form-group-full">

                            <label for="businessDescription">
                                Business Description
                            </label>

                            <textarea
                                id="businessDescription"
                                name="businessDescription"
                                rows="4"
                                placeholder="Business description"
                            ></textarea>

                        </div>

                    </div>

                </div>


                <!-- =====================================
                     CONTACT INFORMATION
                ====================================== -->

                <div class="page-setup-block">

                    <div class="page-setup-block-header">

                        <div class="page-setup-block-icon">
                            <i class="fa-solid fa-address-book"></i>
                        </div>

                        <div>

                            <h3>
                                Contact Information
                            </h3>

                            <p>
                                Contact details used for
                                your business.
                            </p>

                        </div>

                    </div>


                    <div class="page-setup-grid">

                        <div class="form-group">

                            <label for="businessEmail">
                                Business Email
                            </label>

                            <input
                                type="email"
                                id="businessEmail"
                                name="businessEmail"
                                placeholder="business@email.com"
                                autocomplete="email"
                            >

                        </div>


                        <div class="form-group">

                            <label for="businessContact">
                                Contact Number
                            </label>

                            <input
                                type="tel"
                                id="businessContact"
                                name="businessContact"
                                placeholder="09XXXXXXXXX"
                                autocomplete="tel"
                            >

                        </div>


                        <div class="form-group form-group-full">

                            <label for="businessAddress">
                                Business Address
                            </label>

                            <textarea
                                id="businessAddress"
                                name="businessAddress"
                                rows="3"
                                placeholder="Business address"
                                autocomplete="street-address"
                            ></textarea>

                        </div>

                    </div>

                </div>


                <!-- =====================================
                     SOCIAL MEDIA
                ====================================== -->

                <div class="page-setup-block">

                    <div class="page-setup-block-header">

                        <div class="page-setup-block-icon">
                            <i class="fa-solid fa-share-nodes"></i>
                        </div>

                        <div>

                            <h3>
                                Social Media
                            </h3>

                            <p>
                                Social media accounts displayed
                                on your website.
                            </p>

                        </div>

                    </div>


                    <div class="page-setup-grid">

                        <div class="form-group">

                            <label for="facebookPage">
                                Facebook Page
                            </label>

                            <input
                                type="text"
                                id="facebookPage"
                                name="facebookPage"
                                placeholder="Facebook page name"
                                autocomplete="off"
                            >

                        </div>


                        <div class="form-group">

                            <label for="tiktokAccount">
                                TikTok Account
                            </label>

                            <input
                                type="text"
                                id="tiktokAccount"
                                name="tiktokAccount"
                                placeholder="@username"
                                autocomplete="off"
                            >

                        </div>

                    </div>

                </div>


                <!-- =====================================
                     BUSINESS LOGO
                ====================================== -->

                <div class="page-setup-block">

                    <div class="page-setup-block-header">

                        <div class="page-setup-block-icon">
                            <i class="fa-solid fa-image"></i>
                        </div>

                        <div>

                            <h3>
                                Business Logo
                            </h3>

                            <p>
                                Upload the logo used throughout
                                your website.
                            </p>

                        </div>

                    </div>


                    <div class="page-setup-logo-area">

                        <div class="page-setup-logo-preview">

                            <img
                                id="businessLogoPreview"
                                src="../../assets/images/logo.png"
                                alt="Business Logo"
                            >

                        </div>


                        <div class="page-setup-logo-actions">

                            <input
                                type="file"
                                id="businessLogoInput"
                                accept="image/jpeg,image/png,image/webp"
                                hidden
                            >


                            <button
                                type="button"
                                id="changeBusinessLogoButton"
                                class="page-setup-secondary-button"
                            >

                                <i class="fa-solid fa-image"></i>

                                Change Logo

                            </button>


                            <p>
                                JPG, PNG or WEBP.
                                Maximum 2MB.
                            </p>

                        </div>

                    </div>

                </div>


                <!-- =====================================
                     FORM MESSAGE
                ====================================== -->

                <div
                    id="pageSetupMessage"
                    class="page-setup-message"
                    hidden
                    role="status"
                    aria-live="polite"
                ></div>


                <!-- =====================================
                     ACTIONS
                ====================================== -->

                <div class="page-setup-actions">

                    <button
                        type="button"
                        id="resetPageSetupButton"
                        class="page-setup-reset-button"
                    >

                        <i class="fa-solid fa-rotate-left"></i>

                        Reset

                    </button>


                    <button
                        type="submit"
                        id="savePageSetupButton"
                        class="page-setup-save-button"
                    >

                        <i class="fa-solid fa-check"></i>

                        Save Changes

                    </button>

                </div>

            </form>

        </div>
    `;
}


/* =========================================================
   COLLECT ELEMENTS
========================================================= */

function collectPageSetupElements() {

    pageSetupElements = {

        section:
            document.getElementById(
                "pageSetupSection"
            ),

        form:
            document.getElementById(
                "pageSetupForm"
            ),

        businessName:
            document.getElementById(
                "businessName"
            ),

        businessDescription:
            document.getElementById(
                "businessDescription"
            ),

        businessEmail:
            document.getElementById(
                "businessEmail"
            ),

        businessContact:
            document.getElementById(
                "businessContact"
            ),

        facebookPage:
            document.getElementById(
                "facebookPage"
            ),

        tiktokAccount:
            document.getElementById(
                "tiktokAccount"
            ),

        businessAddress:
            document.getElementById(
                "businessAddress"
            ),

        businessLogoPreview:
            document.getElementById(
                "businessLogoPreview"
            ),

        businessLogoInput:
            document.getElementById(
                "businessLogoInput"
            ),

        changeBusinessLogoButton:
            document.getElementById(
                "changeBusinessLogoButton"
            ),

        resetButton:
            document.getElementById(
                "resetPageSetupButton"
            ),

        saveButton:
            document.getElementById(
                "savePageSetupButton"
            ),

        message:
            document.getElementById(
                "pageSetupMessage"
            )
    };


    if (
        !pageSetupElements.form
    ) {

        console.error(
            "Page Setup: Unable to create #pageSetupForm."
        );

    }

}


/* =========================================================
   FIREBASE INITIALIZATION
========================================================= */

async function initializePageSetupFirebase() {

    try {

        /*
         * Use the existing Firebase configuration.
         */

        const firebaseConfig =
            await import(
                "../../firebase/firebase-config.js"
            );


        pageSetupAuth =
            firebaseConfig.auth || null;

        pageSetupDb =
            firebaseConfig.db || null;

        pageSetupStorage =
            firebaseConfig.storage || null;


        /*
         * Firestore functions.
         */

        const firestoreModule =
            await import(
                FIREBASE_FIRESTORE_URL
            );


        firestoreDoc =
            firestoreModule.doc;

        firestoreGetDoc =
            firestoreModule.getDoc;

        firestoreSetDoc =
            firestoreModule.setDoc;


        /*
         * Auth functions.
         */

        const authModule =
            await import(
                FIREBASE_AUTH_URL
            );


        const onAuthStateChanged =
            authModule.onAuthStateChanged;


        /*
         * Storage functions.
         */

        try {

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

        } catch (storageError) {

            console.warn(
                "Page Setup: Firebase Storage unavailable.",
                storageError
            );

        }


        if (
            !pageSetupDb ||
            !firestoreDoc ||
            !firestoreGetDoc ||
            !firestoreSetDoc
        ) {

            console.warn(
                "Page Setup: Firestore unavailable. LocalStorage mode will be used."
            );

            return;

        }


        pageSetupFirebaseReady = true;


        /*
         * Auth listener.
         */

        if (
            pageSetupAuth &&
            onAuthStateChanged
        ) {

            onAuthStateChanged(
                pageSetupAuth,
                async (user) => {

                    pageSetupUser =
                        user || null;


                    if (!user) {

                        console.warn(
                            "Page Setup: No authenticated user."
                        );

                        return;

                    }


                    console.log(
                        "Page Setup authenticated user:",
                        user.uid
                    );


                    /*
                     * Load Firestore settings.
                     */

                    await loadFirestoreSettings();

                }
            );

        } else {

            /*
             * If Auth is unavailable but
             * Firestore is available, still
             * attempt to load the public
             * configuration.
             */

            await loadFirestoreSettings();

        }


        console.log(
            "Trips Wonder Page Setup: Firebase initialized."
        );

    } catch (error) {

        console.warn(
            "Page Setup Firebase initialization failed. Using LocalStorage.",
            error
        );

    }

}


/* =========================================================
   FIRESTORE REFERENCE
========================================================= */

function getPageSetupReference() {

    if (
        !pageSetupDb ||
        !firestoreDoc
    ) {

        return null;

    }


    return firestoreDoc(
        pageSetupDb,
        PAGE_SETUP_COLLECTION,
        PAGE_SETUP_DOCUMENT
    );

}


/* =========================================================
   LOAD FIRESTORE SETTINGS
========================================================= */

async function loadFirestoreSettings() {

    if (
        !pageSetupFirebaseReady ||
        !firestoreGetDoc
    ) {

        return;

    }


    try {

        const reference =
            getPageSetupReference();


        if (!reference) {
            return;
        }


        const snapshot =
            await firestoreGetDoc(
                reference
            );


        if (
            !snapshot ||
            !snapshot.exists()
        ) {

            console.log(
                "Page Setup: No Firestore settings found. Using local/default settings."
            );

            return;

        }


        const firestoreData =
            snapshot.data() || {};


        const settings = {

            ...defaultPageSetupSettings,

            ...firestoreData

        };


        saveLocalSettings(
            settings
        );


        populatePageSetupForm(
            settings
        );


        console.log(
            "Trips Wonder Page Setup loaded from Firestore:",
            settings
        );


    } catch (error) {

        console.error(
            "Page Setup: Error loading Firestore settings.",
            error
        );

    }

}


/* =========================================================
   GET LOCAL SETTINGS
========================================================= */

function getLocalSettings() {

    const saved =
        localStorage.getItem(
            PAGE_SETUP_LOCAL_KEY
        );


    if (!saved) {

        return {
            ...defaultPageSetupSettings
        };

    }


    try {

        const parsed =
            JSON.parse(
                saved
            );


        return {

            ...defaultPageSetupSettings,

            ...parsed

        };

    } catch (error) {

        console.warn(
            "Page Setup: Invalid LocalStorage data.",
            error
        );


        return {
            ...defaultPageSetupSettings
        };

    }

}


/* =========================================================
   SAVE LOCAL SETTINGS
========================================================= */

function saveLocalSettings(
    settings
) {

    localStorage.setItem(
        PAGE_SETUP_LOCAL_KEY,
        JSON.stringify(
            settings
        )
    );

}


/* =========================================================
   LOAD LOCAL SETTINGS
========================================================= */

function loadLocalSettings() {

    const settings =
        getLocalSettings();


    populatePageSetupForm(
        settings
    );

}


/* =========================================================
   POPULATE FORM
========================================================= */

function populatePageSetupForm(
    settings
) {

    if (
        pageSetupElements.businessName
    ) {

        pageSetupElements.businessName.value =
            settings.businessName || "";

    }


    if (
        pageSetupElements.businessDescription
    ) {

        pageSetupElements.businessDescription.value =
            settings.businessDescription || "";

    }


    if (
        pageSetupElements.businessEmail
    ) {

        pageSetupElements.businessEmail.value =
            settings.businessEmail || "";

    }


    if (
        pageSetupElements.businessContact
    ) {

        pageSetupElements.businessContact.value =
            settings.businessContact || "";

    }


    if (
        pageSetupElements.facebookPage
    ) {

        pageSetupElements.facebookPage.value =
            settings.facebookPage || "";

    }


    if (
        pageSetupElements.tiktokAccount
    ) {

        pageSetupElements.tiktokAccount.value =
            settings.tiktokAccount || "";

    }


    if (
        pageSetupElements.businessAddress
    ) {

        pageSetupElements.businessAddress.value =
            settings.businessAddress || "";

    }


    if (
        pageSetupElements.businessLogoPreview &&
        settings.businessLogo
    ) {

        pageSetupElements.businessLogoPreview.src =
            settings.businessLogo;

    }

}


/* =========================================================
   COLLECT SETTINGS
========================================================= */

function collectPageSetupSettings() {

    return {

        businessName:
            pageSetupElements.businessName
                ?.value
                ?.trim() || "",

        businessDescription:
            pageSetupElements.businessDescription
                ?.value
                ?.trim() || "",

        businessEmail:
            pageSetupElements.businessEmail
                ?.value
                ?.trim() || "",

        businessContact:
            pageSetupElements.businessContact
                ?.value
                ?.trim() || "",

        facebookPage:
            pageSetupElements.facebookPage
                ?.value
                ?.trim() || "",

        tiktokAccount:
            pageSetupElements.tiktokAccount
                ?.value
                ?.trim() || "",

        businessAddress:
            pageSetupElements.businessAddress
                ?.value
                ?.trim() || "",

        businessLogo:
            pageSetupElements.businessLogoPreview
                ?.src ||
            defaultPageSetupSettings.businessLogo

    };

}


/* =========================================================
   VALIDATION
========================================================= */

function validatePageSetup(
    settings
) {

    if (
        !settings.businessName
    ) {

        showPageSetupMessage(
            "Please enter your business name.",
            "error"
        );


        pageSetupElements.businessName
            ?.focus();


        return false;

    }


    if (
        settings.businessEmail &&
        !isValidEmail(
            settings.businessEmail
        )
    ) {

        showPageSetupMessage(
            "Please enter a valid business email.",
            "error"
        );


        pageSetupElements.businessEmail
            ?.focus();


        return false;

    }


    return true;

}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
            email
        );

}


/* =========================================================
   SAVE SETTINGS
========================================================= */

async function savePageSetup() {

    if (pageSetupSaving) {
        return;
    }


    const settings =
        collectPageSetupSettings();


    if (
        !validatePageSetup(
            settings
        )
    ) {

        return;

    }


    pageSetupSaving = true;


    setPageSetupSavingState(
        true
    );


    try {

        /*
         * Always save locally first.
         * This prevents data loss if Firebase
         * is temporarily unavailable.
         */

        saveLocalSettings(
            settings
        );


        /*
         * Save to Firestore when available.
         */

        if (
            pageSetupFirebaseReady &&
            firestoreSetDoc
        ) {

            const reference =
                getPageSetupReference();


            if (reference) {

                await firestoreSetDoc(
                    reference,
                    {
                        ...settings,
                        updatedAt:
                            new Date()
                    },
                    {
                        merge: true
                    }
                );

            }

        }


        /*
         * Notify other modules.
         */

        window.dispatchEvent(
            new CustomEvent(
                "pageSettingsUpdated",
                {
                    detail:
                        settings
                }
            )
        );


        showPageSetupMessage(
            "Page Setup saved successfully.",
            "success"
        );


        console.log(
            "Trips Wonder Page Setup saved:",
            settings
        );


    } catch (error) {

        console.error(
            "Page Setup save error:",
            error
        );


        /*
         * LocalStorage is already saved,
         * so tell the user that local save
         * succeeded but Firebase failed.
         */

        showPageSetupMessage(
            "Saved locally, but Firebase could not be updated.",
            "warning"
        );

    } finally {

        pageSetupSaving = false;


        setPageSetupSavingState(
            false
        );

    }

}


/* =========================================================
   SAVE BUTTON STATE
========================================================= */

function setPageSetupSavingState(
    saving
) {

    const button =
        pageSetupElements.saveButton;


    if (!button) {
        return;
    }


    button.disabled =
        saving;


    if (saving) {

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Saving...
        `;

    } else {

        button.innerHTML = `
            <i class="fa-solid fa-check"></i>
            Save Changes
        `;

    }

}


/* =========================================================
   RESET
========================================================= */

async function resetPageSetup() {

    const confirmed =
        window.confirm(
            "Reset Page Setup to the default information?"
        );


    if (!confirmed) {
        return;
    }


    const settings = {

        ...defaultPageSetupSettings

    };


    try {

        /*
         * Reset local settings.
         */

        saveLocalSettings(
            settings
        );


        /*
         * Reset Firestore if available.
         */

        if (
            pageSetupFirebaseReady &&
            firestoreSetDoc
        ) {

            const reference =
                getPageSetupReference();


            if (reference) {

                await firestoreSetDoc(
                    reference,
                    {
                        ...settings,
                        updatedAt:
                            new Date()
                    },
                    {
                        merge: true
                    }
                );

            }

        }


        populatePageSetupForm(
            settings
        );


        window.dispatchEvent(
            new CustomEvent(
                "pageSettingsUpdated",
                {
                    detail:
                        settings
                }
            )
        );


        showPageSetupMessage(
            "Page Setup has been reset.",
            "success"
        );


    } catch (error) {

        console.error(
            "Page Setup reset error:",
            error
        );


        showPageSetupMessage(
            "Page Setup was reset locally, but Firebase could not be updated.",
            "warning"
        );

    }

}


/* =========================================================
   LOGO PICKER
========================================================= */

function openBusinessLogoPicker() {

    if (
        pageSetupElements.businessLogoInput
    ) {

        pageSetupElements.businessLogoInput.click();

    }

}


/* =========================================================
   LOGO CHANGE
========================================================= */

function handleBusinessLogoChange(
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

        showPageSetupMessage(
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

        showPageSetupMessage(
            "Logo must be 2MB or smaller.",
            "error"
        );


        event.target.value =
            "";


        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function (
            readerEvent
        ) {

            if (
                pageSetupElements.businessLogoPreview
            ) {

                pageSetupElements.businessLogoPreview.src =
                    readerEvent.target.result;

            }

        };


    reader.onerror =
        function () {

            showPageSetupMessage(
                "Unable to read the selected image.",
                "error"
            );

        };


    reader.readAsDataURL(
        file
    );

}


/* =========================================================
   EVENTS
========================================================= */

function initializePageSetupEvents() {

    const form =
        pageSetupElements.form;


    if (!form) {

        console.error(
            "Page Setup: Form is unavailable."
        );

        return;

    }


    /*
     * Form submit
     */

    form.addEventListener(
        "submit",
        function (
            event
        ) {

            event.preventDefault();

            savePageSetup();

        }
    );


    /*
     * Reset
     */

    if (
        pageSetupElements.resetButton
    ) {

        pageSetupElements.resetButton.addEventListener(
            "click",
            resetPageSetup
        );

    }


    /*
     * Change logo
     */

    if (
        pageSetupElements.changeBusinessLogoButton
    ) {

        pageSetupElements.changeBusinessLogoButton.addEventListener(
            "click",
            openBusinessLogoPicker
        );

    }


    /*
     * Logo input
     */

    if (
        pageSetupElements.businessLogoInput
    ) {

        pageSetupElements.businessLogoInput.addEventListener(
            "change",
            handleBusinessLogoChange
        );

    }


    /*
     * Prevent accidental whitespace
     * on business contact.
     */

    if (
        pageSetupElements.businessContact
    ) {

        pageSetupElements.businessContact.addEventListener(
            "input",
            function () {

                this.value =
                    this.value.replace(
                        /[^\d+\-\s()]/g,
                        ""
                    );

            }
        );

    }

}


/* =========================================================
   MESSAGE
========================================================= */

function showPageSetupMessage(
    message,
    type = "success"
) {

    const element =
        pageSetupElements.message;


    if (!element) {

        console.log(
            "Page Setup:",
            message
        );

        return;

    }


    element.hidden =
        false;


    element.textContent =
        message;


    element.className =
        "page-setup-message " +
        `page-setup-message-${type}`;


    /*
     * Automatically hide success messages.
     */

    if (
        type === "success"
    ) {

        window.clearTimeout(
            showPageSetupMessage.timeout
        );


        showPageSetupMessage.timeout =
            window.setTimeout(
                function () {

                    if (element) {

                        element.hidden =
                            true;

                    }

                },
                3500
            );

    }

}


/* =========================================================
   PUBLIC API
========================================================= */

window.TripsWonderPageSettings = {

    get:
        function () {

            return getLocalSettings();

        },


    save:
        async function (
            settings
        ) {

            const current =
                getLocalSettings();


            const merged = {

                ...current,

                ...settings

            };


            saveLocalSettings(
                merged
            );


            /*
             * Also save to Firestore
             * when available.
             */

            if (
                pageSetupFirebaseReady &&
                firestoreSetDoc
            ) {

                try {

                    const reference =
                        getPageSetupReference();


                    if (reference) {

                        await firestoreSetDoc(
                            reference,
                            {
                                ...merged,
                                updatedAt:
                                    new Date()
                            },
                            {
                                merge: true
                            }
                        );

                    }

                } catch (error) {

                    console.error(
                        "Trips Wonder Page Settings API save error:",
                        error
                    );

                }

            }


            window.dispatchEvent(
                new CustomEvent(
                    "pageSettingsUpdated",
                    {
                        detail:
                            merged
                    }
                )
            );


            return merged;

        },


    reset:
        async function () {

            await resetPageSetup();

        }

};


/* =========================================================
   STARTUP
========================================================= */

function startPageSetup() {

    initializePageSetup()
        .catch(
            function (error) {

                console.error(
                    "TWMS Page Setup initialization error:",
                    error
                );

            }
        );

}


/*
 * Supports both cases:
 *
 * 1. Script loaded before DOMContentLoaded
 * 2. Script loaded after DOMContentLoaded
 */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startPageSetup,
        {
            once: true
        }
    );

} else {

    startPageSetup();

}