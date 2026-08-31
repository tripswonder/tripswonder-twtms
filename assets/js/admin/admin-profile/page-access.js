// =========================================================
// TWTMS
// ADMIN PROFILE — PAGE ACCESS
// assets/js/admin/admin-profile/page-access.js
// =========================================================
//
// OWNER ONLY ADMIN MANAGEMENT
//
// FEATURES
// ---------------------------------------------------------
// 1. Verify Owner access
// 2. Load Admin accounts
// 3. Create Admin account
// 4. Click Admin card to edit
// 5. Update Admin information
// 6. Update account status
// 7. Update module permissions
// 8. Password show / hide
// 9. Hide Owner-only sections from Admin accounts
//
// FIREBASE CALLABLE FUNCTIONS
// ---------------------------------------------------------
// createAdminAccount
// updateAdminAccount
//
// =========================================================


// =========================================================
// FIREBASE CONFIG
// =========================================================

import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
    collection,
    query,
    where,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";


// =========================================================
// FIREBASE FUNCTIONS
// =========================================================

const functions =
    getFunctions();


const createAdminAccount =
    httpsCallable(
        functions,
        "createAdminAccount"
    );


const updateAdminAccount =
    httpsCallable(
        functions,
        "updateAdminAccount"
    );


// =========================================================
// DOM
// =========================================================

const pageAccessSection =
    document.getElementById(
        "pageAccessSection"
    );


const addAdminButton =
    document.getElementById(
        "addAdminButton"
    );


const adminFormCard =
    document.getElementById(
        "adminFormCard"
    );


const closeAdminFormButton =
    document.getElementById(
        "closeAdminFormButton"
    );


const cancelAdminButton =
    document.getElementById(
        "cancelAdminButton"
    );


const adminAccountForm =
    document.getElementById(
        "adminAccountForm"
    );


const adminAccountsList =
    document.getElementById(
        "adminAccountsList"
    );


const pageAccessMessage =
    document.getElementById(
        "pageAccessMessage"
    );


const toggleAdminPassword =
    document.getElementById(
        "toggleAdminPassword"
    );


const adminTemporaryPassword =
    document.getElementById(
        "adminTemporaryPassword"
    );


const createAdminButton =
    document.getElementById(
        "createAdminButton"
    );


const adminFirstName =
    document.getElementById(
        "adminFirstName"
    );


const adminLastName =
    document.getElementById(
        "adminLastName"
    );


const adminEmail =
    document.getElementById(
        "adminEmail"
    );


const adminContactNumber =
    document.getElementById(
        "adminContactNumber"
    );


const adminRole =
    document.getElementById(
        "adminRole"
    );


const adminStatus =
    document.getElementById(
        "adminStatus"
    );


// =========================================================
// FORM HEADER
// =========================================================

const adminFormTitle =
    adminFormCard?.querySelector(
        ".page-access-card-header h3"
    );


const adminFormDescription =
    adminFormCard?.querySelector(
        ".page-access-card-header p"
    );


// =========================================================
// PASSWORD FIELD WRAPPER
// =========================================================

const adminPasswordField =
    adminTemporaryPassword?.closest(
        ".page-access-field"
    );


// =========================================================
// MODULE DEFINITIONS
// =========================================================

const MODULES = {

    dashboard: {
        label: "Dashboard"
    },

    bookings: {
        label: "Bookings"
    },

    packages: {
        label: "Packages"
    },

    payments: {
        label: "Payments"
    },

    invoices: {
        label: "Invoices"
    },

    resortBookings: {
        label: "Resort Bookings"
    },

    customers: {
        label: "Customers"
    },

    reports: {
        label: "Reports"
    }

};


// =========================================================
// OWNER-ONLY SECTIONS
// =========================================================

const OWNER_ONLY_SECTIONS = [

    "page-access",

    "page-setup",

    "legal-policies",

    "system-settings"

];


// =========================================================
// STATE
// =========================================================

let currentUser =
    null;


let currentProfile =
    null;


let ownerVerified =
    false;


let formMode =
    "create";


let selectedAdminUid =
    null;


let selectedAdminData =
    null;


let savingAdmin =
    false;


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// =========================================================
// SHOW MESSAGE
// =========================================================

function showMessage(
    message,
    type = "success"
) {

    if (!pageAccessMessage) {
        return;
    }


    pageAccessMessage.hidden =
        false;


    pageAccessMessage.textContent =
        message;


    pageAccessMessage.classList.remove(
        "page-access-message-success",
        "page-access-message-error",
        "page-access-message-warning"
    );


    if (
        type === "error"
    ) {

        pageAccessMessage.classList.add(
            "page-access-message-error"
        );

    }

    else if (
        type === "warning"
    ) {

        pageAccessMessage.classList.add(
            "page-access-message-warning"
        );

    }

    else {

        pageAccessMessage.classList.add(
            "page-access-message-success"
        );

    }

}


// =========================================================
// HIDE MESSAGE
// =========================================================

function hideMessage() {

    if (!pageAccessMessage) {
        return;
    }


    pageAccessMessage.hidden =
        true;


    pageAccessMessage.textContent =
        "";


    pageAccessMessage.classList.remove(
        "page-access-message-success",
        "page-access-message-error",
        "page-access-message-warning"
    );

}


// =========================================================
// RESET PASSWORD DISPLAY
// =========================================================

function resetPasswordField() {

    if (
        adminTemporaryPassword
    ) {

        adminTemporaryPassword.type =
            "password";

    }


    if (
        toggleAdminPassword
    ) {

        toggleAdminPassword.innerHTML =
            '<i class="fa-regular fa-eye"></i>';

    }

}


// =========================================================
// RESET MODULE CHECKBOXES
// =========================================================

function resetModuleCheckboxes() {

    document
        .querySelectorAll(
            'input[name="moduleAccess"]'
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    false;

            }
        );

}


// =========================================================
// APPLY MODULE PERMISSIONS
// =========================================================

function applyModulePermissions(
    permissions = {}
) {

    resetModuleCheckboxes();


    document
        .querySelectorAll(
            'input[name="moduleAccess"]'
        )
        .forEach(
            checkbox => {

                const key =
                    checkbox.dataset.module ||
                    checkbox.value;


                checkbox.checked =
                    permissions[key] === true;

            }
        );

}


// =========================================================
// CREATE MODE
// =========================================================

function setCreateMode() {

    formMode =
        "create";


    selectedAdminUid =
        null;


    selectedAdminData =
        null;


    if (
        adminFormTitle
    ) {

        adminFormTitle.textContent =
            "Create Admin Account";

    }


    if (
        adminFormDescription
    ) {

        adminFormDescription.textContent =
            "Create a new administrator and choose which modules they can access.";

    }


    if (
        adminAccountForm
    ) {

        adminAccountForm.reset();

    }


    resetModuleCheckboxes();


    if (
        adminEmail
    ) {

        adminEmail.readOnly =
            false;

    }


    if (
        adminTemporaryPassword
    ) {

        adminTemporaryPassword.disabled =
            false;

        adminTemporaryPassword.required =
            true;

        adminTemporaryPassword.value =
            "";

    }


    if (
        adminPasswordField
    ) {

        adminPasswordField.hidden =
            false;

    }


    if (
        adminRole
    ) {

        adminRole.value =
            "admin";

    }


    if (
        adminStatus
    ) {

        adminStatus.value =
            "active";

    }


    resetPasswordField();


    updateSubmitButton();

}


// =========================================================
// EDIT MODE
// =========================================================

function setEditMode(
    uid,
    data
) {

    formMode =
        "edit";


    selectedAdminUid =
        uid;


    selectedAdminData =
        data;


    if (
        adminFormTitle
    ) {

        adminFormTitle.textContent =
            "Edit Admin Account";

    }


    if (
        adminFormDescription
    ) {

        adminFormDescription.textContent =
            "Update administrator information, status and module access.";

    }


    // -----------------------------------------------------
    // FIRST NAME
    // -----------------------------------------------------

    if (
        adminFirstName
    ) {

        adminFirstName.value =
            data.firstName ||
            getNameParts(
                data.name
            ).firstName;

    }


    // -----------------------------------------------------
    // LAST NAME
    // -----------------------------------------------------

    if (
        adminLastName
    ) {

        adminLastName.value =
            data.lastName ||
            getNameParts(
                data.name
            ).lastName;

    }


    // -----------------------------------------------------
    // EMAIL
    // -----------------------------------------------------

    if (
        adminEmail
    ) {

        adminEmail.value =
            data.email ||
            "";

        // Email editing will use a separate secure
        // function later.
        adminEmail.readOnly =
            true;

    }


    // -----------------------------------------------------
    // PHONE
    // -----------------------------------------------------

    if (
        adminContactNumber
    ) {

        adminContactNumber.value =
            data.phone ||
            "";

    }


    // -----------------------------------------------------
    // ROLE
    // -----------------------------------------------------

    if (
        adminRole
    ) {

        adminRole.value =
            "admin";

    }


    // -----------------------------------------------------
    // STATUS
    // -----------------------------------------------------

    if (
        adminStatus
    ) {

        adminStatus.value =
            String(
                data.status ||
                "active"
            )
                .toLowerCase();

    }


    // -----------------------------------------------------
    // PASSWORD
    //
    // Password does NOT belong in Edit mode.
    // -----------------------------------------------------

    if (
        adminTemporaryPassword
    ) {

        adminTemporaryPassword.value =
            "";

        adminTemporaryPassword.required =
            false;

        adminTemporaryPassword.disabled =
            true;

    }


    if (
        adminPasswordField
    ) {

        adminPasswordField.hidden =
            true;

    }


    // -----------------------------------------------------
    // PERMISSIONS
    // -----------------------------------------------------

    applyModulePermissions(
        data.permissions ||
        {}
    );


    updateSubmitButton();

}


// =========================================================
// GET NAME PARTS
// =========================================================

function getNameParts(
    fullName
) {

    const cleanName =
        String(
            fullName ||
            ""
        )
            .trim();


    if (!cleanName) {

        return {

            firstName: "",

            lastName: ""

        };

    }


    const parts =
        cleanName.split(
            /\s+/
        );


    const firstName =
        parts.shift() ||
        "";


    const lastName =
        parts.join(
            " "
        );


    return {

        firstName,

        lastName

    };

}


// =========================================================
// OPEN CREATE ADMIN
// =========================================================

function openCreateAdminForm() {

    if (
        !ownerVerified
    ) {

        showMessage(
            "Only the Owner can create administrator accounts.",
            "error"
        );

        return;

    }


    if (
        !adminFormCard
    ) {

        return;

    }


    hideMessage();


    setCreateMode();


    adminFormCard.hidden =
        false;


    adminFormCard.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}


// =========================================================
// OPEN EDIT ADMIN
// =========================================================

function openEditAdminForm(
    uid,
    data
) {

    if (
        !ownerVerified
    ) {

        showMessage(
            "Only the Owner can manage administrator accounts.",
            "error"
        );

        return;

    }


    if (
        !adminFormCard
    ) {

        return;

    }


    hideMessage();


    setEditMode(
        uid,
        data
    );


    adminFormCard.hidden =
        false;


    console.log(
        "TWTMS ADMIN EDIT:",
        uid,
        data
    );


    adminFormCard.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}


// =========================================================
// CLOSE FORM
// =========================================================

function closeAdminForm() {

    if (
        !adminFormCard
    ) {

        return;

    }


    adminFormCard.hidden =
        true;


    hideMessage();


    setCreateMode();

}


// =========================================================
// PASSWORD TOGGLE
// =========================================================

function togglePasswordVisibility() {

    if (
        !adminTemporaryPassword ||
        adminTemporaryPassword.disabled
    ) {

        return;

    }


    const isPassword =
        adminTemporaryPassword.type ===
        "password";


    adminTemporaryPassword.type =
        isPassword
            ? "text"
            : "password";


    if (
        toggleAdminPassword
    ) {

        toggleAdminPassword.innerHTML =
            isPassword
                ? '<i class="fa-regular fa-eye-slash"></i>'
                : '<i class="fa-regular fa-eye"></i>';

    }

}


// =========================================================
// CURRENT PROFILE
// =========================================================

async function getCurrentProfile(
    user
) {

    if (
        !user
    ) {

        return null;

    }


    const userRef =
        doc(
            db,
            "users",
            user.uid
        );


    const snapshot =
        await getDoc(
            userRef
        );


    if (
        !snapshot.exists()
    ) {

        return null;

    }


    return snapshot.data();

}


// =========================================================
// VERIFY OWNER
// =========================================================

async function verifyOwnerAccess(
    user
) {

    try {

        const profile =
            await getCurrentProfile(
                user
            );


        currentProfile =
            profile;


        if (
            !profile
        ) {

            console.error(
                "TWTMS PAGE ACCESS: User profile not found."
            );


            ownerVerified =
                false;


            return false;

        }


        const role =
            String(
                profile.role ||
                ""
            )
                .trim()
                .toLowerCase();


        console.log(
            "TWTMS PAGE ACCESS ROLE:",
            role
        );


        if (
            role !== "owner"
        ) {

            ownerVerified =
                false;


            console.warn(
                "TWTMS PAGE ACCESS: Owner access required."
            );


            return false;

        }


        ownerVerified =
            true;


        console.log(
            "TWTMS PAGE ACCESS: Owner verified."
        );


        return true;

    }

    catch (
        error
    ) {

        console.error(
            "TWTMS PAGE ACCESS OWNER ERROR:",
            error
        );


        ownerVerified =
            false;


        return false;

    }

}


// =========================================================
// FIND OWNER-ONLY ELEMENTS
// =========================================================

function getOwnerOnlyElements() {

    const selectors = [];


    OWNER_ONLY_SECTIONS.forEach(
        section => {

            selectors.push(
                `[data-section="${section}"]`
            );

            selectors.push(
                `[data-settings-section="${section}"]`
            );

            selectors.push(
                `[data-settings-nav="${section}"]`
            );

            selectors.push(
                `a[href="#${section}"]`
            );

            selectors.push(
                `button[data-target="${section}"]`
            );

            selectors.push(
                `button[data-section="${section}"]`
            );

        }
    );


    return document.querySelectorAll(
        selectors.join(
            ","
        )
    );

}


// =========================================================
// HIDE OWNER-ONLY ACCESS
// =========================================================

function hideOwnerOnlyNavigation() {

    const elements =
        getOwnerOnlyElements();


    elements.forEach(
        element => {

            element.hidden =
                true;

        }
    );


    const currentHash =
        window.location.hash
            .replace(
                "#",
                ""
            );


    if (
        OWNER_ONLY_SECTIONS.includes(
            currentHash
        )
    ) {

        window.location.hash =
            "profile";

    }

}


// =========================================================
// SHOW OWNER-ONLY ACCESS
// =========================================================

function enableOwnerOnlyNavigation() {

    const elements =
        getOwnerOnlyElements();


    elements.forEach(
        element => {

            element.hidden =
                false;

        }
    );

}


// =========================================================
// EMPTY STATE
// =========================================================

function renderEmptyAdmins() {

    if (
        !adminAccountsList
    ) {

        return;

    }


    adminAccountsList.innerHTML = `

        <div class="admin-accounts-empty">

            <div class="admin-accounts-empty-icon">

                <i class="fa-solid fa-user-shield"></i>

            </div>

            <strong>
                No administrator accounts
            </strong>

            <span>
                Create an administrator account to manage access to your system.
            </span>

        </div>

    `;

}


// =========================================================
// INITIALS
// =========================================================

function getInitials(
    firstName,
    lastName
) {

    const first =
        String(
            firstName ||
            ""
        )
            .trim()
            .charAt(0)
            .toUpperCase();


    const last =
        String(
            lastName ||
            ""
        )
            .trim()
            .charAt(0)
            .toUpperCase();


    return (
        `${first}${last}`
        ||
        "AD"
    );

}


// =========================================================
// RENDER ADMIN CARD
// =========================================================

function renderAdminItem(
    uid,
    data
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "admin-account-item";


    item.dataset.adminUid =
        uid;


    item.setAttribute(
        "role",
        "button"
    );


    item.setAttribute(
        "tabindex",
        "0"
    );


    item.setAttribute(
        "aria-label",
        "Manage administrator account"
    );


    item.title =
        "Click to manage this administrator";


    item.style.cursor =
        "pointer";


    const nameParts =
        getNameParts(
            data.name
        );


    const firstName =
        data.firstName ||
        nameParts.firstName;


    const lastName =
        data.lastName ||
        nameParts.lastName;


    const fullName =
        [
            firstName,
            lastName
        ]
            .join(
                " "
            )
            .trim()
        ||
        data.name
        ||
        "Administrator";


    const email =
        data.email ||
        "—";


    const status =
        String(
            data.status ||
            "active"
        )
            .toLowerCase();


    const role =
        String(
            data.role ||
            "admin"
        )
            .toLowerCase();


    const statusClass =
        status === "active"
            ? ""
            : " inactive";


    const permissions =
        data.permissions ||
        {};


    const permissionCount =
        Object.values(
            permissions
        )
            .filter(
                value =>
                    value === true
            )
            .length;


    item.innerHTML = `

        <div class="admin-account-info">

            <div class="admin-account-avatar">

                ${escapeHtml(
                    getInitials(
                        firstName,
                        lastName
                    )
                )}

            </div>


            <div class="admin-account-details">

                <strong>
                    ${escapeHtml(
                        fullName
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        email
                    )}
                </span>

            </div>

        </div>


        <div class="admin-account-meta">

            <span class="admin-role-badge">

                ${role === "admin"
                    ? "Admin"
                    : escapeHtml(
                        role
                    )}

            </span>


            <span class="admin-status-badge${statusClass}">

                ${status === "active"
                    ? "Active"
                    : "Inactive"}

            </span>


            <span
                class="admin-role-badge"
                title="Assigned modules"
            >

                ${permissionCount}

                ${permissionCount === 1
                    ? " module"
                    : " modules"}

            </span>

        </div>

    `;


    // =====================================================
    // CLICK CARD
    // =====================================================

    item.addEventListener(
        "click",
        () => {

            openEditAdminForm(
                uid,
                data
            );

        }
    );


    // =====================================================
    // KEYBOARD
    // =====================================================

    item.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();


                openEditAdminForm(
                    uid,
                    data
                );

            }

        }
    );


    return item;

}


// =========================================================
// LOAD ADMINS
// =========================================================

async function loadAdminAccounts() {

    if (
        !ownerVerified
    ) {

        return;

    }


    if (
        !adminAccountsList
    ) {

        return;

    }


    try {

        adminAccountsList.innerHTML = `

            <div class="admin-accounts-empty">

                <div class="admin-accounts-empty-icon">

                    <i class="fa-solid fa-spinner fa-spin"></i>

                </div>

                <strong>
                    Loading administrator accounts...
                </strong>

                <span>
                    Please wait.
                </span>

            </div>

        `;


        const adminsQuery =
            query(
                collection(
                    db,
                    "users"
                ),
                where(
                    "role",
                    "==",
                    "admin"
                )
            );


        const snapshot =
            await getDocs(
                adminsQuery
            );


        if (
            snapshot.empty
        ) {

            renderEmptyAdmins();


            console.log(
                "TWTMS PAGE ACCESS: No admin accounts found."
            );


            return;

        }


        adminAccountsList.innerHTML =
            "";


        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();


                const item =
                    renderAdminItem(
                        documentSnapshot.id,
                        data
                    );


                adminAccountsList.appendChild(
                    item
                );

            }
        );


        console.log(
            "TWTMS PAGE ACCESS: Admin accounts loaded:",
            snapshot.size
        );

    }

    catch (
        error
    ) {

        console.error(
            "TWTMS PAGE ACCESS: Error loading admins:",
            error
        );


        adminAccountsList.innerHTML = `

            <div class="admin-accounts-empty">

                <div class="admin-accounts-empty-icon">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                </div>

                <strong>
                    Unable to load administrator accounts
                </strong>

                <span>
                    ${escapeHtml(
                        getFirebaseErrorMessage(
                            error
                        )
                    )}
                </span>

            </div>

        `;

    }

}


// =========================================================
// GET PERMISSIONS
// =========================================================

function getModulePermissions() {

    const permissions = {};


    Object.keys(
        MODULES
    ).forEach(
        moduleKey => {

            permissions[moduleKey] =
                false;

        }
    );


    document
        .querySelectorAll(
            'input[name="moduleAccess"]'
        )
        .forEach(
            checkbox => {

                const moduleKey =
                    checkbox.dataset.module ||
                    checkbox.value;


                if (
                    Object.prototype.hasOwnProperty.call(
                        permissions,
                        moduleKey
                    )
                ) {

                    permissions[moduleKey] =
                        checkbox.checked;

                }

            }
        );


    return permissions;

}


// =========================================================
// VALIDATE PERMISSIONS
// =========================================================

function validatePermissions(
    permissions
) {

    const selectedCount =
        Object.values(
            permissions
        )
            .filter(
                value =>
                    value === true
            )
            .length;


    if (
        selectedCount === 0
    ) {

        return {

            valid: false,

            message:
                "Please assign at least one module access."

        };

    }


    return {

        valid: true,

        message: ""

    };

}


// =========================================================
// GET FORM DATA
// =========================================================

function getAdminFormData() {

    return {

        firstName:
            adminFirstName?.value
                .trim()
            ||
            "",


        lastName:
            adminLastName?.value
                .trim()
            ||
            "",


        email:
            adminEmail?.value
                .trim()
                .toLowerCase()
            ||
            "",


        phone:
            adminContactNumber?.value
                .trim()
            ||
            "",


        password:
            adminTemporaryPassword?.value
            ||
            "",


        status:
            adminStatus?.value
            ||
            "active",


        permissions:
            getModulePermissions()

    };

}


// =========================================================
// VALIDATE FORM
// =========================================================

function validateAdminForm(
    data
) {

    if (
        !data.firstName
    ) {

        return {

            valid: false,

            message:
                "Please enter the administrator's first name."

        };

    }


    if (
        !data.lastName
    ) {

        return {

            valid: false,

            message:
                "Please enter the administrator's last name."

        };

    }


    if (
        !data.email
    ) {

        return {

            valid: false,

            message:
                "Please enter an email address."

        };

    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
        !emailPattern.test(
            data.email
        )
    ) {

        return {

            valid: false,

            message:
                "Please enter a valid email address."

        };

    }


    if (
        !data.phone
    ) {

        return {

            valid: false,

            message:
                "Please enter a contact number."

        };

    }


    // -----------------------------------------------------
    // PASSWORD REQUIRED ONLY IN CREATE MODE
    // -----------------------------------------------------

    if (
        formMode === "create"
    ) {

        if (
            !data.password
        ) {

            return {

                valid: false,

                message:
                    "Please create a temporary password."

            };

        }


        if (
            data.password.length < 6
        ) {

            return {

                valid: false,

                message:
                    "Temporary password must be at least 6 characters."

            };

        }

    }


    const permissionCheck =
        validatePermissions(
            data.permissions
        );


    if (
        !permissionCheck.valid
    ) {

        return permissionCheck;

    }


    return {

        valid: true,

        message: ""

    };

}


// =========================================================
// UPDATE SUBMIT BUTTON
// =========================================================

function updateSubmitButton() {

    if (
        !createAdminButton
    ) {

        return;

    }


    createAdminButton.disabled =
        false;


    if (
        formMode === "edit"
    ) {

        createAdminButton.innerHTML = `

            <i class="fa-solid fa-check"></i>

            <span>
                Save Changes
            </span>

        `;

    }

    else {

        createAdminButton.innerHTML = `

            <i class="fa-solid fa-user-plus"></i>

            <span>
                Create Admin
            </span>

        `;

    }

}


// =========================================================
// SET BUTTON LOADING
// =========================================================

function setSubmitLoading(
    loading
) {

    if (
        !createAdminButton
    ) {

        return;

    }


    createAdminButton.disabled =
        loading;


    if (
        loading
    ) {

        createAdminButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                ${formMode === "edit"
                    ? "Saving..."
                    : "Creating..."}
            </span>

        `;

    }

    else {

        updateSubmitButton();

    }

}


// =========================================================
// CREATE ADMIN
// =========================================================

async function createAdmin(
    data
) {

    const fullName =
        [
            data.firstName,
            data.lastName
        ]
            .join(
                " "
            )
            .trim();


    const result =
        await createAdminAccount({

            name:
                fullName,

            email:
                data.email,

            password:
                data.password,

            permissions:
                data.permissions,

            firstName:
                data.firstName,

            lastName:
                data.lastName,

            phone:
                data.phone,

            status:
                data.status

        });


    console.log(
        "TWTMS ADMIN CREATED:",
        result.data
    );


    // -----------------------------------------------------
    // COMPLETE PROFILE USING UPDATE FUNCTION
    //
    // This guarantees phone/status/new permission structure
    // are synchronized after creation.
    // -----------------------------------------------------

    const newUid =
        result?.data?.uid;


    if (
        newUid
    ) {

        try {

            await updateAdminAccount({

                uid:
                    newUid,

                firstName:
                    data.firstName,

                lastName:
                    data.lastName,

                phone:
                    data.phone,

                status:
                    data.status,

                permissions:
                    data.permissions

            });


            console.log(
                "TWTMS NEW ADMIN PROFILE SYNCHRONIZED:",
                newUid
            );

        }

        catch (
            syncError
        ) {

            console.warn(
                "TWTMS ADMIN CREATED BUT PROFILE SYNC FAILED:",
                syncError
            );

        }

    }


    return result;

}


// =========================================================
// UPDATE ADMIN
// =========================================================

async function updateAdmin(
    data
) {

    if (
        !selectedAdminUid
    ) {

        throw new Error(
            "No administrator account selected."
        );

    }


    const result =
        await updateAdminAccount({

            uid:
                selectedAdminUid,

            firstName:
                data.firstName,

            lastName:
                data.lastName,

            phone:
                data.phone,

            status:
                data.status,

            permissions:
                data.permissions

        });


    console.log(
        "TWTMS ADMIN UPDATED:",
        result.data
    );


    return result;

}


// =========================================================
// SUBMIT FORM
// =========================================================

async function handleAdminSubmit(
    event
) {

    event.preventDefault();


    if (
        savingAdmin
    ) {

        return;

    }


    hideMessage();


    if (
        !ownerVerified
    ) {

        showMessage(
            "Only the Owner can manage administrator accounts.",
            "error"
        );

        return;

    }


    const data =
        getAdminFormData();


    const validation =
        validateAdminForm(
            data
        );


    if (
        !validation.valid
    ) {

        showMessage(
            validation.message,
            "error"
        );

        return;

    }


    savingAdmin =
        true;


    setSubmitLoading(
        true
    );


    try {

        // =================================================
        // EDIT EXISTING ADMIN
        // =================================================

        if (
            formMode === "edit"
        ) {

            await updateAdmin(
                data
            );


            showMessage(
                "Administrator account updated successfully.",
                "success"
            );

        }

        // =================================================
        // CREATE NEW ADMIN
        // =================================================

        else {

            await createAdmin(
                data
            );


            showMessage(
                "Administrator account created successfully.",
                "success"
            );

        }


        // =================================================
        // RELOAD LIST
        // =================================================

        await loadAdminAccounts();


        // =================================================
        // CLOSE AFTER SUCCESS
        // =================================================

        setTimeout(
            () => {

                closeAdminForm();

            },
            800
        );

    }

    catch (
        error
    ) {

        console.error(
            "TWTMS PAGE ACCESS SAVE ERROR:",
            error
        );


        showMessage(
            getFirebaseErrorMessage(
                error
            ),
            "error"
        );

    }

    finally {

        savingAdmin =
            false;


        setSubmitLoading(
            false
        );

    }

}


// =========================================================
// FIREBASE ERROR MESSAGE
// =========================================================

function getFirebaseErrorMessage(
    error
) {

    const code =
        String(
            error?.code ||
            ""
        );


    const message =
        String(
            error?.message ||
            ""
        );


    if (
        code.includes(
            "already-exists"
        ) ||
        code.includes(
            "email-already-in-use"
        )
    ) {

        return (
            "An account with this email address already exists."
        );

    }


    if (
        code.includes(
            "permission-denied"
        )
    ) {

        return (
            "Access denied. Only the Owner can manage administrator accounts."
        );

    }


    if (
        code.includes(
            "unauthenticated"
        )
    ) {

        return (
            "Your session has expired. Please sign in again."
        );

    }


    if (
        code.includes(
            "not-found"
        )
    ) {

        return (
            "Administrator account was not found."
        );

    }


    if (
        code.includes(
            "invalid-argument"
        )
    ) {

        return (
            message ||
            "Some administrator information is invalid."
        );

    }


    if (
        code.includes(
            "internal"
        )
    ) {

        return (
            "The server could not complete the request. Please try again."
        );

    }


    if (
        code.includes(
            "permission-denied"
        )
    ) {

        return (
            "You do not have permission to perform this action."
        );

    }


    if (
        message
    ) {

        return message;

    }


    return (
        "Unable to complete the request. Please try again."
    );

}


// =========================================================
// ADD ADMIN BUTTON
// =========================================================

if (
    addAdminButton
) {

    addAdminButton.addEventListener(
        "click",
        openCreateAdminForm
    );

}


// =========================================================
// CLOSE BUTTON
// =========================================================

if (
    closeAdminFormButton
) {

    closeAdminFormButton.addEventListener(
        "click",
        closeAdminForm
    );

}


// =========================================================
// CANCEL BUTTON
// =========================================================

if (
    cancelAdminButton
) {

    cancelAdminButton.addEventListener(
        "click",
        closeAdminForm
    );

}


// =========================================================
// PASSWORD TOGGLE
// =========================================================

if (
    toggleAdminPassword
) {

    toggleAdminPassword.addEventListener(
        "click",
        togglePasswordVisibility
    );

}


// =========================================================
// FORM SUBMIT
// =========================================================

if (
    adminAccountForm
) {

    adminAccountForm.addEventListener(
        "submit",
        handleAdminSubmit
    );

}


// =========================================================
// ESCAPE KEY
// =========================================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Escape"
        ) {

            return;

        }


        if (
            adminFormCard &&
            !adminFormCard.hidden
        ) {

            closeAdminForm();

        }

    }
);


// =========================================================
// AUTH STATE
// =========================================================

onAuthStateChanged(
    auth,
    async user => {

        currentUser =
            user;


        // -------------------------------------------------
        // NOT SIGNED IN
        // -------------------------------------------------

        if (
            !user
        ) {

            ownerVerified =
                false;


            console.warn(
                "TWTMS PAGE ACCESS: No authenticated user."
            );


            hideOwnerOnlyNavigation();


            return;

        }


        // -------------------------------------------------
        // VERIFY OWNER
        // -------------------------------------------------

        const isOwner =
            await verifyOwnerAccess(
                user
            );


        // -------------------------------------------------
        // ADMIN / NON OWNER
        // -------------------------------------------------

        if (
            !isOwner
        ) {

            hideOwnerOnlyNavigation();


            return;

        }


        // -------------------------------------------------
        // OWNER
        // -------------------------------------------------

        enableOwnerOnlyNavigation();


        // -------------------------------------------------
        // LOAD ADMINS
        // -------------------------------------------------

        await loadAdminAccounts();

    }
);


// =========================================================
// INITIAL STATE
// =========================================================

setCreateMode();


// =========================================================
// INITIAL LOG
// =========================================================

console.log(
    "TWTMS Page Access initialized."
);