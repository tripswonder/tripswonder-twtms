// =========================================================
// TWTMS v2
// AUTHENTICATION + MODULE ACCESS GUARD
// assets/js/auth/auth-guard.js
// =========================================================
//
// OWNER
// - Full access to all admin modules.
//
// ADMIN
// - Access only to modules assigned by Owner.
//
// CLIENT
// - Cannot access admin pages.
//
// ALSO HANDLES
// - Automatic current-page permission detection
// - Sidebar/navigation filtering
// - Direct URL protection
// - Inactive account protection
// - Redirect to first allowed module
//
// =========================================================


// =========================================================
// FIREBASE
// =========================================================

import {
    auth,
    db
} from "../firebase/firebase-config.js";


import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// =========================================================
// ADMIN MODULE DEFINITIONS
// =========================================================
//
// Firestore permission keys:
//
// dashboard
// packages
// bookings
// customers
// payments
// invoices
// resortBookings
// reports
//
// =========================================================

const ADMIN_MODULES = {

    dashboard: {
        permission: "dashboard",
        file: "dashboard.html"
    },

    packages: {
        permission: "packages",
        file: "packages.html"
    },

    bookings: {
        permission: "bookings",
        file: "bookings.html"
    },

    customers: {
        permission: "customers",
        file: "customers.html"
    },

    payments: {
        permission: "payments",
        file: "payments.html"
    },

    invoices: {
        permission: "invoices",
        file: "invoices.html"
    },

    resortBookings: {
        permission: "resortBookings",
        file: "resort-bookings.html"
    },

    reports: {
        permission: "reports",
        file: "reports.html"
    }

};


// =========================================================
// OWNER-ONLY ADMIN PROFILE SECTIONS
// =========================================================

const OWNER_ONLY_HASHES = [

    "page-access",

    "page-setup",

    "legal-policies",

    "system-settings"

];


// =========================================================
// MODULE ORDER
// =========================================================
//
// Used when an Admin is redirected to the first module
// they are allowed to access.
//
// =========================================================

const ADMIN_MODULE_ORDER = [

    "dashboard",

    "packages",

    "bookings",

    "customers",

    "payments",

    "invoices",

    "resortBookings",

    "reports"

];


// =========================================================
// GET USER PROFILE
// =========================================================

async function getUserProfile(
    user
) {

    if (!user) {
        return null;
    }


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


    if (
        !userSnapshot.exists()
    ) {

        return null;
    }


    return userSnapshot.data();

}


// =========================================================
// NORMALIZE ROLE
// =========================================================

function normalizeRole(
    role
) {

    return String(
        role || "client"
    )
        .trim()
        .toLowerCase();

}


// =========================================================
// CURRENT FILE NAME
// =========================================================

function getCurrentFileName() {

    const pathname =
        window.location.pathname;


    const fileName =
        pathname
            .split("/")
            .pop();


    return String(
        fileName || ""
    )
        .trim()
        .toLowerCase();

}


// =========================================================
// GET FILE FROM HREF
// =========================================================

function getFileFromHref(
    href
) {

    if (!href) {
        return "";
    }


    try {

        const url =
            new URL(
                href,
                window.location.href
            );


        return String(
            url.pathname
                .split("/")
                .pop() ||
            ""
        )
            .trim()
            .toLowerCase();

    }

    catch {

        return "";

    }

}


// =========================================================
// GET MODULE CONFIG BY FILE
// =========================================================

function getModuleByFile(
    fileName
) {

    const cleanFile =
        String(
            fileName || ""
        )
            .trim()
            .toLowerCase();


    for (
        const [
            moduleKey,
            config
        ]
        of Object.entries(
            ADMIN_MODULES
        )
    ) {

        if (
            config.file.toLowerCase() ===
            cleanFile
        ) {

            return {

                moduleKey,

                ...config

            };

        }

    }


    return null;

}


// =========================================================
// GET CURRENT PAGE PERMISSION
// =========================================================

function getCurrentPagePermission() {

    const currentFile =
        getCurrentFileName();


    const module =
        getModuleByFile(
            currentFile
        );


    return (
        module?.permission ||
        null
    );

}


// =========================================================
// CHECK MODULE PERMISSION
// =========================================================

function hasModulePermission(
    profile,
    permission
) {

    if (!profile) {
        return false;
    }


    const role =
        normalizeRole(
            profile.role
        );


    // -----------------------------------------------------
    // OWNER = FULL ACCESS
    // -----------------------------------------------------

    if (
        role === "owner"
    ) {

        return true;

    }


    // -----------------------------------------------------
    // ONLY ADMIN USES MODULE PERMISSIONS
    // -----------------------------------------------------

    if (
    role === "client"
) {

    return (
        !requiredPermission
    );

}


if (
    role !== "admin"
) {

    return false;

}


    const permissions =
        profile.permissions ||
        {};


    return (
        permissions[
            permission
        ] === true
    );

}


// =========================================================
// FIRST ALLOWED ADMIN MODULE
// =========================================================

function getFirstAllowedAdminModule(
    profile
) {

    if (!profile) {
        return null;
    }


    const role =
        normalizeRole(
            profile.role
        );


    // -----------------------------------------------------
    // OWNER DEFAULT
    // -----------------------------------------------------

    if (
        role === "owner"
    ) {

        return ADMIN_MODULES.dashboard;

    }


    if (
        role !== "admin"
    ) {

        return null;

    }


    for (
        const moduleKey
        of ADMIN_MODULE_ORDER
    ) {

        const config =
            ADMIN_MODULES[
                moduleKey
            ];


        if (
            hasModulePermission(
                profile,
                config.permission
            )
        ) {

            return config;

        }

    }


    return null;

}


// =========================================================
// REDIRECT ADMIN TO FIRST ALLOWED MODULE
// =========================================================

async function redirectAdminToAllowedModule(
    profile
) {

    const firstAllowed =
        getFirstAllowedAdminModule(
            profile
        );


    // -----------------------------------------------------
    // NO ACCESS ASSIGNED
    // -----------------------------------------------------

    if (
        !firstAllowed
    ) {

        alert(
            "Your administrator account does not have any module access assigned. Please contact the Owner."
        );


        await signOut(
            auth
        );


        window.location.replace(
            "../../index.html"
        );


        return;

    }


    const currentFile =
        getCurrentFileName();


    // -----------------------------------------------------
    // PREVENT REDIRECT LOOP
    // -----------------------------------------------------

    if (
        currentFile ===
        firstAllowed.file.toLowerCase()
    ) {

        return;

    }


    window.location.replace(
        firstAllowed.file
    );

}


// =========================================================
// HIDE LINK
// =========================================================
//
// Uses display:none !important because some sidebar CSS
// uses display:flex, which can override the browser's
// default [hidden] behavior.
//
// =========================================================

function hideNavigationLink(
    link
) {

    if (!link) {
        return;
    }


    link.hidden =
        true;


    link.style.setProperty(
        "display",
        "none",
        "important"
    );


    link.setAttribute(
        "aria-hidden",
        "true"
    );


    link.setAttribute(
        "tabindex",
        "-1"
    );

}


// =========================================================
// SHOW LINK
// =========================================================

function showNavigationLink(
    link
) {

    if (!link) {
        return;
    }


    link.hidden =
        false;


    link.style.removeProperty(
        "display"
    );


    link.removeAttribute(
        "aria-hidden"
    );


    link.removeAttribute(
        "tabindex"
    );

}


// =========================================================
// APPLY MODULE NAVIGATION
// =========================================================
//
// OWNER:
// Show every operational module.
//
// ADMIN:
// Show only assigned modules.
//
// =========================================================

function applyModuleNavigation(
    profile
) {

    if (!profile) {
        return;
    }


    const role =
        normalizeRole(
            profile.role
        );


    const links =
        document.querySelectorAll(
            "a[href]"
        );


    // =====================================================
    // OWNER
    // =====================================================

    if (
        role === "owner"
    ) {

        links.forEach(
            link => {

                const fileName =
                    getFileFromHref(
                        link.getAttribute(
                            "href"
                        )
                    );


                const module =
                    getModuleByFile(
                        fileName
                    );


                if (
                    module
                ) {

                    showNavigationLink(
                        link
                    );

                }

            }
        );


        console.log(
            "AUTH GUARD: Owner navigation enabled."
        );


        return;

    }


    // =====================================================
    // ADMIN
    // =====================================================

    if (
        role !== "admin"
    ) {

        return;

    }


    links.forEach(
        link => {

            const href =
                link.getAttribute(
                    "href"
                );


            const fileName =
                getFileFromHref(
                    href
                );


            const module =
                getModuleByFile(
                    fileName
                );


            // -------------------------------------------------
            // NOT AN OPERATIONAL MODULE
            //
            // Example:
            // admin-profile.html
            // -------------------------------------------------

            if (
                !module
            ) {

                return;

            }


            const allowed =
                hasModulePermission(
                    profile,
                    module.permission
                );


            if (
                allowed
            ) {

                showNavigationLink(
                    link
                );

            }

            else {

                hideNavigationLink(
                    link
                );

            }

        }
    );


    console.log(
        "AUTH GUARD: Admin navigation filtered.",
        profile.permissions || {}
    );

}


// =========================================================
// OWNER-ONLY PROFILE NAVIGATION
// =========================================================
//
// This protects owner-only sections inside admin-profile.html.
//
// Admin:
// - Page Access hidden
// - Page Setup hidden
// - Legal & Policies hidden
// - System Settings hidden
//
// =========================================================

function applyOwnerOnlyProfileNavigation(
    profile
) {

    if (!profile) {
        return;
    }


    const role =
        normalizeRole(
            profile.role
        );


    OWNER_ONLY_HASHES.forEach(
        section => {

            const selectors = [

                `a[href="#${section}"]`,

                `[data-section="${section}"]`,

                `[data-settings-nav="${section}"]`,

                `button[data-section="${section}"]`,

                `button[data-target="${section}"]`

            ];


            document
                .querySelectorAll(
                    selectors.join(",")
                )
                .forEach(
                    element => {

                        if (
                            role === "owner"
                        ) {

                            showNavigationLink(
                                element
                            );

                        }

                        else {

                            hideNavigationLink(
                                element
                            );

                        }

                    }
                );

        }
    );

}


// =========================================================
// OWNER-ONLY PROFILE DIRECT HASH GUARD
// =========================================================

function enforceOwnerOnlyProfileHash(
    profile
) {

    if (!profile) {
        return true;
    }


    const role =
        normalizeRole(
            profile.role
        );


    if (
        role === "owner"
    ) {

        return true;

    }


    const currentFile =
        getCurrentFileName();


    if (
        currentFile !==
        "admin-profile.html"
    ) {

        return true;

    }


    const currentHash =
        String(
            window.location.hash ||
            ""
        )
            .replace(
                "#",
                ""
            )
            .trim()
            .toLowerCase();


    if (
        OWNER_ONLY_HASHES.includes(
            currentHash
        )
    ) {

        console.warn(
            "AUTH GUARD: Owner-only profile section denied.",
            currentHash
        );


        window.location.hash =
            "profile";


        return false;

    }


    return true;

}


// =========================================================
// VERIFY CURRENT PAGE PERMISSION
// =========================================================

async function verifyCurrentPagePermission(
    profile,
    requiredPermission = null
) {

    const role =
        normalizeRole(
            profile.role
        );


    // -----------------------------------------------------
    // OWNER BYPASS
    // -----------------------------------------------------

    if (
        role === "owner"
    ) {

        return true;

    }


    // -----------------------------------------------------
    // NON ADMIN
    // -----------------------------------------------------

    if (
        role !== "admin"
    ) {

        return false;

    }


    const permission =
        requiredPermission ||
        getCurrentPagePermission();


    // -----------------------------------------------------
    // PAGE HAS NO OPERATIONAL MODULE PERMISSION
    //
    // Example:
    // admin-profile.html
    // -----------------------------------------------------

    if (
        !permission
    ) {

        return true;

    }


    const allowed =
        hasModulePermission(
            profile,
            permission
        );


    console.log(
        "AUTH GUARD PERMISSION CHECK:",
        {
            permission,
            allowed
        }
    );


    if (
        allowed
    ) {

        return true;

    }


    console.warn(
        "AUTH GUARD: Permission denied.",
        permission
    );


    alert(
        "You do not have permission to access this module."
    );


    await redirectAdminToAllowedModule(
        profile
    );


    return false;

}


// =========================================================
// APPLY ACCESS UI
// =========================================================

function applyAccessUI(
    profile
) {

    applyModuleNavigation(
        profile
    );


    applyOwnerOnlyProfileNavigation(
        profile
    );


    enforceOwnerOnlyProfileHash(
        profile
    );

}


// =========================================================
// REQUIRE AUTHENTICATION
// =========================================================

export function requireAuth(
    options = {}
) {

    const {

        allowedRoles = [],

        requiredPermission = null,

        onAuthorized = null

    } = options;


    onAuthStateChanged(
        auth,
        async user => {

            // =================================================
            // NOT LOGGED IN
            // =================================================

            if (
                !user
            ) {

                console.warn(
                    "AUTH GUARD: No authenticated user."
                );


                window.location.replace(
                    "../../index.html"
                );


                return;

            }


            try {

                // =================================================
                // LOAD PROFILE
                // =================================================

                const profile =
                    await getUserProfile(
                        user
                    );


                // =================================================
                // PROFILE NOT FOUND
                // =================================================

                if (
                    !profile
                ) {

                    console.error(
                        "AUTH GUARD: User profile not found."
                    );


                    await signOut(
                        auth
                    );


                    window.location.replace(
                        "../../index.html"
                    );


                    return;

                }


                // =================================================
                // STATUS
                // =================================================

                const status =
                    String(
                        profile.status ||
                        "active"
                    )
                        .trim()
                        .toLowerCase();


                if (
                    status !== "active"
                ) {

                    alert(
                        "Your account is currently inactive."
                    );


                    await signOut(
                        auth
                    );


                    window.location.replace(
                        "../../index.html"
                    );


                    return;

                }


                // =================================================
                // ROLE
                // =================================================

                const role =
                    normalizeRole(
                        profile.role
                    );


                console.log(
                    "AUTH GUARD:",
                    {
                        uid:
                            user.uid,

                        email:
                            user.email,

                        role,

                        permissions:
                            profile.permissions ||
                            {}
                    }
                );


                // =================================================
                // ROLE CHECK
                // =================================================

                if (
                    allowedRoles.length > 0 &&
                    !allowedRoles.includes(
                        role
                    )
                ) {

                    console.warn(
                        "AUTH GUARD: Role access denied.",
                        role
                    );


                    // ---------------------------------------------
                    // CLIENT
                    // ---------------------------------------------

                    if (
                        role === "client"
                    ) {

                        window.location.replace(
                            "../customer/home.html"
                        );


                        return;

                    }


                    // ---------------------------------------------
                    // ADMIN
                    // ---------------------------------------------

                    if (
                        role === "admin"
                    ) {

                        await redirectAdminToAllowedModule(
                            profile
                        );


                        return;

                    }


                    // ---------------------------------------------
                    // UNKNOWN ROLE
                    // ---------------------------------------------

                    await signOut(
                        auth
                    );


                    window.location.replace(
                        "../../index.html"
                    );


                    return;

                }


                // =================================================
                // PAGE PERMISSION
                // =================================================

                const pageAllowed =
                    await verifyCurrentPagePermission(
                        profile,
                        requiredPermission
                    );


                if (
                    !pageAllowed
                ) {

                    return;

                }


                // =================================================
                // APPLY UI PERMISSIONS
                // =================================================

                applyAccessUI(
                    profile
                );


                // =================================================
                // GLOBAL CURRENT USER
                // =================================================

                window.currentUser =
                    user;


                window.currentUserProfile =
                    profile;


                // =================================================
                // AUTHORIZED
                // =================================================

                console.log(
                    "AUTH GUARD: Access granted."
                );


                // =================================================
                // CALLBACK
                // =================================================

                if (
                    typeof onAuthorized ===
                    "function"
                ) {

                    onAuthorized(
                        user,
                        profile
                    );

                }

            }

            catch (
                error
            ) {

                console.error(
                    "AUTH GUARD ERROR:",
                    error
                );


                await signOut(
                    auth
                );


                window.location.replace(
                    "../../index.html"
                );

            }

        }
    );

}


// =========================================================
// WATCH HASH CHANGES
// =========================================================
//
// Prevent Admin from manually typing:
//
// admin-profile.html#page-access
// admin-profile.html#page-setup
// etc.
//
// =========================================================

window.addEventListener(
    "hashchange",
    () => {

        const profile =
            window.currentUserProfile;


        if (
            !profile
        ) {

            return;

        }


        enforceOwnerOnlyProfileHash(
            profile
        );

    }
);


// =========================================================
// LOGOUT
// =========================================================

export async function logout() {

    try {

        await signOut(
            auth
        );


        console.log(
            "AUTH GUARD: Logout successful."
        );


        window.location.replace(
            "../../index.html"
        );

    }

    catch (
        error
    ) {

        console.error(
            "AUTH GUARD LOGOUT ERROR:",
            error
        );


        alert(
            "Unable to logout. Please try again."
        );

    }

}


// =========================================================
// EXPORT HELPERS
// =========================================================

export {

    getUserProfile,

    hasModulePermission,

    getCurrentPagePermission,

    getFirstAllowedAdminModule,

    applyModuleNavigation,

    applyOwnerOnlyProfileNavigation,

    ADMIN_MODULES

};


// =========================================================
// DEBUG
// =========================================================

console.log(
    "TWTMS AUTH GUARD LOADED"
);