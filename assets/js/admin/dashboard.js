// =========================================================
// TWTMS v2
// ADMIN DASHBOARD
// Consolidated module: dashboard UI + Page Access UI
// =========================================================

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";

import {
    requireAuth,
    logout
} from "../auth/auth-guard.js";

import {
    db
} from "../firebase/firebase-config.js";

import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    showLoading,
    hideLoading,
    showLoadingError
} from "../shared/loading-screen.js";


// =========================================================
// PAGE ACCESS UI
// =========================================================

const pageAccessBtn =
    document.getElementById("pageAccessBtn");

const pageAccessModal =
    document.getElementById("pageAccessModal");

const pageAccessBackdrop =
    document.getElementById("pageAccessBackdrop");

const closePageAccessBtn =
    document.getElementById("closePageAccessBtn");

const addAdminBtn =
    document.getElementById("addAdminBtn");

const addAdminModal =
    document.getElementById("addAdminModal");

const addAdminBackdrop =
    document.getElementById("addAdminBackdrop");

const closeAddAdminBtn =
    document.getElementById("closeAddAdminBtn");

const cancelAddAdminBtn =
    document.getElementById("cancelAddAdminBtn");

const addAdminForm =
    document.getElementById("addAdminForm");

const addAdminMessage =
    document.getElementById("addAdminMessage");

const permissionCount =
    document.getElementById("permissionCount");

const permissionToggles =
    document.querySelectorAll(
        ".permission-toggle"
    );

// =========================================================
// GLOBAL DASHBOARD LOADING
// =========================================================

showLoading({

    title:
        "Loading Dashboard...",

    message:
        "Please wait while we prepare your Trips Wonder dashboard.",

    retry:
        () => window.location.reload()

});

// =========================================================
// MODAL HELPERS
// =========================================================

function openModal(modal) {

    if (!modal) return;

    modal.classList.add("is-open");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "modal-open"
    );

}


function closeModal(modal) {

    if (!modal) return;

    modal.classList.remove("is-open");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    if (
        !pageAccessModal.classList.contains("is-open") &&
        !addAdminModal.classList.contains("is-open")
    ) {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


// =========================================================
// PAGE ACCESS
// =========================================================

if (pageAccessBtn) {

    pageAccessBtn.addEventListener(
        "click",
        () => {

            openModal(
                pageAccessModal
            );

        }
    );

}


if (closePageAccessBtn) {

    closePageAccessBtn.addEventListener(
        "click",
        () => {

            closeModal(
                pageAccessModal
            );

        }
    );

}


if (pageAccessBackdrop) {

    pageAccessBackdrop.addEventListener(
        "click",
        () => {

            closeModal(
                pageAccessModal
            );

        }
    );

}


// =========================================================
// ADD NEW ADMIN
// =========================================================

if (addAdminBtn) {

    addAdminBtn.addEventListener(
        "click",
        () => {

            closeModal(
                pageAccessModal
            );

            openModal(
                addAdminModal
            );

        }
    );

}


if (closeAddAdminBtn) {

    closeAddAdminBtn.addEventListener(
        "click",
        () => {

            closeModal(
                addAdminModal
            );

        }
    );

}


if (cancelAddAdminBtn) {

    cancelAddAdminBtn.addEventListener(
        "click",
        () => {

            closeModal(
                addAdminModal
            );

        }
    );

}


if (addAdminBackdrop) {

    addAdminBackdrop.addEventListener(
        "click",
        () => {

            closeModal(
                addAdminModal
            );

        }
    );

}


// =========================================================
// PERMISSION COUNT
// =========================================================

function updatePermissionCount() {

    if (!permissionCount) {
        return;
    }

    const checked =
        document.querySelectorAll(
            ".permission-toggle:checked"
        ).length;

    permissionCount.textContent =
        `${checked} of 6 modules selected`;

}


permissionToggles.forEach(
    (toggle) => {

        toggle.addEventListener(
            "change",
            updatePermissionCount
        );

    }
);


updatePermissionCount();


// =========================================================
// ESC KEY
// =========================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key !== "Escape") {
            return;
        }

        if (
            pageAccessModal &&
            pageAccessModal.classList.contains("is-open")
        ) {

            closeModal(
                pageAccessModal
            );

        }

        if (
            addAdminModal &&
            addAdminModal.classList.contains("is-open")
        ) {

            closeModal(
                addAdminModal
            );

        }

    }
);


// =========================================================
// ADD ADMIN FORM
// =========================================================

if (addAdminForm) {

    addAdminForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const createButton =
                document.getElementById(
                    "createAdminBtn"
                );

            const name =
                document.getElementById(
                    "newAdminName"
                )?.value.trim();

            const email =
                document.getElementById(
                    "newAdminEmail"
                )?.value.trim();

            const password =
                document.getElementById(
                    "newAdminPassword"
                )?.value;

            const confirmPassword =
                document.getElementById(
                    "confirmAdminPassword"
                )?.value;


            // =====================================================
            // VALIDATION
            // =====================================================

            if (
                !name ||
                !email ||
                !password ||
                !confirmPassword
            ) {

                if (addAdminMessage) {

                    addAdminMessage.hidden = false;

                    addAdminMessage.textContent =
                        "Please complete all required fields.";

                }

                return;

            }


            if (password !== confirmPassword) {

                if (addAdminMessage) {

                    addAdminMessage.hidden = false;

                    addAdminMessage.textContent =
                        "Passwords do not match.";

                }

                return;

            }


            if (password.length < 6) {

                if (addAdminMessage) {

                    addAdminMessage.hidden = false;

                    addAdminMessage.textContent =
                        "Password must be at least 6 characters.";

                }

                return;

            }


            // =====================================================
            // GET PERMISSIONS
            // =====================================================

            const permissions = {};


            document
                .querySelectorAll(
                    ".permission-toggle"
                )
                .forEach(
                    (toggle) => {

                        permissions[
                            toggle.dataset.permission
                        ] = toggle.checked;

                    }
                );


            console.log(
                "TWTMS CREATE ADMIN DATA:",
                {
                    name,
                    email,
                    permissions
                }
            );


            try {

                // =================================================
                // BUTTON LOADING
                // =================================================

                if (createButton) {

                    createButton.disabled = true;

                    createButton.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Creating...
                    `;

                }


                if (addAdminMessage) {

                    addAdminMessage.hidden = true;

                }


                // =================================================
                // FIREBASE FUNCTION
                // =================================================

                const functions =
                    getFunctions();


                const createAdmin =
                    httpsCallable(
                        functions,
                        "createAdminAccount"
                    );


                // =================================================
                // CREATE ADMIN
                // =================================================

                const result =
                    await createAdmin({

                        name,
                        email,
                        password,
                        permissions

                    });


                console.log(
                    "TWTMS ADMIN CREATED:",
                    result
                );


                // =================================================
                // SUCCESS
                // =================================================

                if (addAdminMessage) {

                    addAdminMessage.hidden = false;

                    addAdminMessage.textContent =
                        "Administrator account created successfully.";

                }


                // Reset form

                addAdminForm.reset();


                // Update permission counter

                updatePermissionCount();


                // Close modal after success

                setTimeout(
                    () => {

                        closeModal(
                            addAdminModal
                        );

                    },
                    1200
                );


            }

            catch (error) {

                console.error(
                    "TWTMS CREATE ADMIN ERROR:",
                    error
                );


                if (addAdminMessage) {

                    addAdminMessage.hidden = false;

                    addAdminMessage.textContent =
                        error?.message ||
                        "Unable to create administrator account.";

                }

            }

            finally {

                if (createButton) {

                    createButton.disabled = false;

                    createButton.innerHTML = `
                        <i class="fa-solid fa-user-plus"></i>
                        Create Account
                    `;

                }

            }

        }
    );

}


// =========================================================
// DOM
// =========================================================

const logoutButton =
    document.getElementById("logoutBtn");

const adminName =
    document.getElementById("adminName");

const welcomeText =
    document.getElementById("welcomeText");

const accountName =
    document.getElementById("accountName");

const accountEmail =
    document.getElementById("accountEmail");

const accountRole =
    document.getElementById("accountRole");

const ownerAccessName =
    document.getElementById("ownerAccessName");

const taskAdminList =
    document.getElementById("taskAdminList");


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

    return String(value ?? "")
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
// PERMISSION LABELS
// =========================================================

const permissionLabels = {

    dashboard:
        "Dashboard",

    bookings:
        "Bookings",

    customers:
        "Customers",

    packages:
        "Packages",

    payments:
        "Payments",

    reports:
        "Reports"

};


// =========================================================
// LOAD ADMIN PROFILE
// =========================================================

function loadAdminProfile(
    user,
    profile
) {

    const fullName = [

        profile.firstName || "",

        profile.lastName || ""

    ]
        .join(" ")
        .trim();


    const displayName =
        fullName || "Admin";


    if (adminName) {

        adminName.textContent =
            displayName;

    }


    if (welcomeText) {

        welcomeText.textContent =
            `Welcome back, ${displayName}!`;

    }


    if (accountName) {

        accountName.textContent =
            displayName;

    }


    if (accountEmail) {

        accountEmail.textContent =
            profile.email ||
            user.email ||
            "—";

    }


    if (accountRole) {

        accountRole.textContent =
            profile.role === "owner"
                ? "Owner Access"
                : "Administrator";

    }


    if (ownerAccessName) {

        ownerAccessName.textContent =
            displayName;

    }


    console.log(
        "TWTMS ADMIN AUTHENTICATED:",
        user.uid
    );


    console.log(
        "TWTMS ADMIN PROFILE:",
        profile
    );


    console.log(
        "TWTMS ADMIN ROLE:",
        profile.role
    );

}


// =========================================================
// RENDER TASK ACCESS ADMINS
// =========================================================

function renderTaskAdmins(snapshot) {

    if (!taskAdminList) {

        return;

    }


    const admins = [];


    snapshot.forEach(
        (docSnapshot) => {

            const data =
                docSnapshot.data();


            admins.push({

                uid:
                    docSnapshot.id,

                ...data

            });

        }
    );


    // =====================================================
    // NO ADMIN ACCOUNTS
    // =====================================================

    if (admins.length === 0) {

        taskAdminList.innerHTML = `

            <div class="empty-task-access">

                <div class="empty-task-icon">

                    <i class="fa-solid fa-user-shield"></i>

                </div>

                <strong>
                    No administrator accounts
                </strong>

                <span>
                    Add an administrator to assign
                    page access.
                </span>

            </div>

        `;

        return;

    }


    // =====================================================
    // RENDER ADMIN CARDS
    // =====================================================

    taskAdminList.innerHTML =
        admins
            .map(
                renderSingleAdminCard
            )
            .join("");

}


// =========================================================
// RENDER SINGLE ADMIN CARD
// =========================================================

function renderSingleAdminCard(admin) {

    const fullName = [

        admin.firstName || "",

        admin.lastName || ""

    ]
        .join(" ")
        .trim() || "Admin";


    const email =
        admin.email || "—";


    const permissions =
        admin.permissions || {};


    const activePermissions =
        Object.keys(permissionLabels)
            .filter(
                (permission) =>
                    permissions[permission] === true
            );


    const permissionHtml =
        activePermissions.length
            ? activePermissions
                .map(
                    (permission) => `
                        <span class="task-permission-pill">
                            ${escapeHtml(
                                permissionLabels[
                                    permission
                                ]
                            )}
                        </span>
                    `
                )
                .join("")
            : `
                <span class="task-permission-empty">
                    No page access assigned
                </span>
            `;


    return `

        <div
            class="task-admin-card"
            data-admin-uid="${escapeHtml(
                admin.uid
            )}"
        >

            <div class="task-admin-person">

                <div class="access-avatar admin">

                    <i class="fa-solid fa-user-shield"></i>

                </div>


                <div class="access-person">

                    <strong>
                        ${escapeHtml(fullName)}
                    </strong>

                    <span>
                        ${escapeHtml(email)}
                    </span>

                </div>

            </div>


            <div class="full-access-badge">

                <i class="fa-solid fa-shield-halved"></i>

                <span>
                    Assigned Access
                </span>

            </div>


            <div class="task-admin-access">

                <div class="task-admin-access-label">
                    Assigned Access
                </div>

                <div class="task-permission-list">

                    ${permissionHtml}

                </div>

            <div class="full-access-badge">

    <i class="fa-solid fa-shield-halved"></i>

    <span>
        Assigned Access
    </span>

</div>

    `;

}


// =========================================================
// LOAD TASK ACCESS ADMINS
// =========================================================
//
// OWNER ONLY
//
// Uses a Firestore realtime listener.
// Kapag may bagong admin na ginawa,
// automatic na mag-uupdate ang list.
// =========================================================

function loadTaskAccessAdmins(profile) {

    if (!taskAdminList) {

        return;

    }


    // =====================================================
    // OWNER CHECK
    // =====================================================

    if (
        profile.role !== "owner"
    ) {

        taskAdminList.innerHTML = `

            <div class="empty-task-access">

                <div class="empty-task-icon">

                    <i class="fa-solid fa-lock"></i>

                </div>

                <strong>
                    Owner access required
                </strong>

                <span>
                    Only the Owner can manage
                    task access accounts.
                </span>

            </div>

        `;

        return;

    }


    // =====================================================
    // ADMIN QUERY
    // =====================================================

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


    // =====================================================
    // REALTIME LISTENER
    // =====================================================

    onSnapshot(

        adminsQuery,

        renderTaskAdmins,

        (error) => {

            console.error(
                "TWTMS TASK ACCESS LIST ERROR:",
                error
            );


            taskAdminList.innerHTML = `

                <div class="empty-task-access">

                    <div class="empty-task-icon">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                    </div>

                    <strong>
                        Unable to load admin accounts
                    </strong>

                    <span>
                        Please refresh the page
                        and try again.
                    </span>

                </div>

            `;

        }

    );

}


// =========================================================
// MANAGE ACCESS MODAL
// =========================================================

let activeAdminData = null;


// =========================================================
// CREATE MANAGE ACCESS MODAL
// =========================================================

function createManageAccessModal(admin) {

    const existingModal =
        document.getElementById(
            "manageAccessModal"
        );


    if (existingModal) {

        existingModal.remove();

    }


    const fullName = [

        admin.firstName || "",

        admin.lastName || ""

    ]
        .join(" ")
        .trim() || "Admin";


    const email =
        admin.email || "—";


    const permissions =
        admin.permissions || {};


    const permissionKeys = [

        "dashboard",

        "bookings",

        "customers",

        "packages",

        "payments",

        "reports"

    ];


    activeAdminData = {

        uid:
            admin.uid,

        firstName:
            admin.firstName || "",

        lastName:
            admin.lastName || "",

        email:
            email,

        permissions:
            {
                ...permissions
            }

    };


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "manageAccessModal";


    modal.className =
        "manage-access-overlay";


    modal.innerHTML = `

        <div
            class="manage-access-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manageAccessTitle"
        >

            <!-- =========================================
                 HEADER
            ========================================== -->

            <div class="manage-access-header">

                <div>

                    <div class="manage-access-eyebrow">
                        ADMINISTRATION
                    </div>

                    <h2 id="manageAccessTitle">
                        Manage Page Access
                    </h2>

                    <p>
                        Assign the pages this administrator
                        can manage.
                    </p>

                </div>


                <button
                    type="button"
                    class="manage-access-close"
                    id="manageAccessCloseBtn"
                    aria-label="Close"
                >

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>


            <!-- =========================================
                 ADMIN PROFILE
            ========================================== -->

            <div class="manage-access-profile">

                <div class="access-avatar admin">

                    <i class="fa-solid fa-user-shield"></i>

                </div>


                <div class="access-person">

                    <strong>
                        ${escapeHtml(fullName)}
                    </strong>

                    <span>
                        ${escapeHtml(email)}
                    </span>

                </div>

            </div>


            <!-- =========================================
                 PERMISSION LIST
            ========================================== -->

            <div class="manage-access-body">

                ${permissionKeys
                    .map(
                        (permission) => {

                            const checked =
                                permissions[
                                    permission
                                ] === true;


                            return `

                                <label
                                    class="manage-permission-row"
                                >

                                    <div class="manage-permission-info">

                                        <strong>
                                            ${escapeHtml(
                                                permissionLabels[
                                                    permission
                                                ]
                                            )}
                                        </strong>

                                        <span>
                                            Allow access to
                                            ${escapeHtml(
                                                permissionLabels[
                                                    permission
                                                ]
                                            )}
                                        </span>

                                    </div>


                                    <div class="manage-permission-toggle">

                                        <input
                                            type="checkbox"
                                            class="manage-permission-checkbox"
                                            data-permission="${escapeHtml(
                                                permission
                                            )}"
                                            ${checked
                                                ? "checked"
                                                : ""}
                                        >

                                        <span
                                            class="manage-toggle-ui"
                                        ></span>

                                    </div>

                                </label>

                            `;

                        }
                    )
                    .join("")}

            </div>


            <!-- =========================================
                 FOOTER
            ========================================== -->

            <div class="manage-access-footer">

                <button
                    type="button"
                    class="manage-access-cancel"
                    id="manageAccessCancelBtn"
                >

                    Cancel

                </button>


                <button
                    type="button"
                    class="manage-access-save"
                    id="manageAccessSaveBtn"
                >

                    <i class="fa-solid fa-check"></i>

                    Save Changes

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    // =====================================================
    // OPEN
    // =====================================================

    requestAnimationFrame(
        () => {

            modal.classList.add(
                "show"
            );

        }
    );


    // =====================================================
    // CLOSE BUTTON
    // =====================================================

    const closeButton =
        document.getElementById(
            "manageAccessCloseBtn"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeManageAccessModal
        );

    }


    // =====================================================
    // CANCEL
    // =====================================================

    const cancelButton =
        document.getElementById(
            "manageAccessCancelBtn"
        );


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeManageAccessModal
        );

    }


    // =====================================================
    // BACKDROP
    // =====================================================

    modal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === modal
            ) {

                closeManageAccessModal();

            }

        }
    );


    // =====================================================
    // SAVE
    // =====================================================

    const saveButton =
        document.getElementById(
            "manageAccessSaveBtn"
        );


    if (saveButton) {

        saveButton.addEventListener(
            "click",
            saveAdminPermissions
        );

    }

}


// =========================================================
// SAVE ADMIN PERMISSIONS
// =========================================================

async function saveAdminPermissions() {

    if (!activeAdminData) {

        return;

    }


    const saveButton =
        document.getElementById(
            "manageAccessSaveBtn"
        );


    const permissionCheckboxes =
        document.querySelectorAll(
            ".manage-permission-checkbox"
        );


    const permissions = {};


    permissionCheckboxes.forEach(
        (checkbox) => {

            const permission =
                checkbox.dataset.permission;


            permissions[
                permission
            ] =
                checkbox.checked;

        }
    );


    try {

        if (saveButton) {

            saveButton.disabled =
                true;


            saveButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
            `;

        }


        const adminRef =
            doc(
                db,
                "users",
                activeAdminData.uid
            );


        await updateDoc(

            adminRef,

            {

                permissions,

                updatedAt:
                    new Date()

            }

        );


        console.log(
            "TWTMS ADMIN PERMISSIONS UPDATED:",
            activeAdminData.uid,
            permissions
        );


        closeManageAccessModal();


        alert(
            "Admin permissions updated successfully."
        );

    }

    catch (error) {

        console.error(
            "TWTMS UPDATE PERMISSIONS ERROR:",
            error
        );


        if (saveButton) {

            saveButton.disabled =
                false;


            saveButton.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Save Changes
            `;

        }


        alert(
            "Unable to update permissions. Please try again."
        );

    }

}


// =========================================================
// CLOSE MANAGE ACCESS
// =========================================================

function closeManageAccessModal() {

    const modal =
        document.getElementById(
            "manageAccessModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );


        setTimeout(
            () => {

                modal.remove();

            },
            200
        );

    }


    activeAdminData =
        null;

}


// =========================================================
// ADMIN CARD CLICK → MANAGE ACCESS
// =========================================================

document.addEventListener(
    "click",
    (event) => {

        const card =
            event.target.closest(
                ".task-admin-card[data-admin-uid]"
            );

        if (!card) {
            return;
        }


        const uid =
            card.dataset.adminUid;

        if (!uid) {
            return;
        }


        console.log(
            "TWTMS OPEN ADMIN ACCESS:",
            uid
        );


        const adminNameElement =
            card.querySelector(
                ".access-person strong"
            );


        const adminEmailElement =
            card.querySelector(
                ".access-person span"
            );


        const permissionElements =
            card.querySelectorAll(
                ".task-permission-pill"
            );


        const admin = {

            uid,

            firstName:
                adminNameElement
                    ?.textContent
                    ?.trim()
                    ?.split(" ")
                    ?.slice(0, -1)
                    ?.join(" ") || "",

            lastName:
                adminNameElement
                    ?.textContent
                    ?.trim()
                    ?.split(" ")
                    ?.slice(-1)
                    ?.join(" ") || "",

            email:
                adminEmailElement
                    ?.textContent
                    ?.trim() || "",

            permissions: {}

        };


        permissionElements.forEach(
            (element) => {

                const label =
                    element
                        .textContent
                        .trim();


                Object.keys(
                    permissionLabels
                ).forEach(
                    (permission) => {

                        if (
                            permissionLabels[
                                permission
                            ] === label
                        ) {

                            admin.permissions[
                                permission
                            ] = true;

                        }

                    }
                );

            }
        );


        createManageAccessModal(
            admin
        );

    }
);


// =========================================================
// KEYBOARD ACCESS
// =========================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key !== "Enter" &&
            event.key !== " "
        ) {
            return;
        }


        const card =
            event.target.closest(
                ".task-admin-card[data-admin-uid]"
            );


        if (!card) {
            return;
        }


        event.preventDefault();

        card.click();

    }
);


// =========================================================
// AUTH GUARD
// =========================================================

// =========================================================
// LIVE DASHBOARD DATA
// =========================================================

const dashboardState = {
    packages: [],
    bookings: [],
    customers: [],
    payments: []
};

let dashboardUnsubscribers = [];


function valueToDate(value) {

    if (!value) return null;

    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;

}


function recordDate(record, fields) {

    for (const field of fields) {

        const date = valueToDate(
            record[field]
        );

        if (date) return date;

    }

    return null;

}


function formatDashboardDate(value) {

    const date = valueToDate(value);

    if (!date) return "—";

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


function formatDashboardMoney(value) {

    return Number(value || 0).toLocaleString(
        "en-PH",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );

}


function normalizedStatus(value) {

    const status = String(value || "pending")
        .trim()
        .toLowerCase();

    if (["approved", "booked", "active"].includes(status)) {
        return "confirmed";
    }

    if (["complete", "done", "finished"].includes(status)) {
        return "completed";
    }

    if (["canceled", "void"].includes(status)) {
        return "cancelled";
    }

    return status;

}


function customerName(record) {

    return record.customerName ||
        record.fullName ||
        record.name ||
        [record.firstName, record.lastName]
            .filter(Boolean)
            .join(" ") ||
        "Guest";

}


function packageName(record) {

    return record.packageName ||
        record.tourName ||
        record.destination ||
        record.title ||
        "Tour Package";

}


function emptyDashboardState(icon, title, message) {

    return `
        <div class="dashboard-empty-state">
            <i class="${escapeHtml(icon)}"></i>
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(message)}</span>
        </div>
    `;

}


function renderOverview() {

    const activePackages =
        dashboardState.packages.filter(
            item => ![
                "inactive",
                "archived",
                "deleted"
            ].includes(
                normalizedStatus(item.status)
            )
        );

    const validPayments =
        dashboardState.payments.filter(
            item => ![
                "void",
                "cancelled",
                "refunded",
                "failed"
            ].includes(
                normalizedStatus(item.status)
            )
        );

    const revenue = validPayments.reduce(
        (total, item) =>
            total + Number(
                item.amount ||
                item.amountPaid ||
                item.paymentAmount ||
                0
            ),
        0
    );

    const values = {
        totalPackages: activePackages.length,
        totalBookings: dashboardState.bookings.length,
        totalCustomers: dashboardState.customers.length,
        totalRevenue: `₱${formatDashboardMoney(revenue)}`
    };

    Object.entries(values).forEach(
        ([id, value]) => {

            const element =
                document.getElementById(id);

            if (element) {
                element.textContent = value;
            }

        }
    );

    [
        "packagesChange",
        "bookingsChange",
        "customersChange",
        "revenueChange"
    ].forEach(
        id => {

            const element =
                document.getElementById(id);

            if (element) {
                element.textContent = "Updated in real time";
            }

        }
    );

}


function renderBookingStatus() {

    const counts = {
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
    };

    dashboardState.bookings.forEach(
        booking => {

            const status =
                normalizedStatus(
                    booking.status ||
                    booking.bookingStatus
                );

            if (Object.hasOwn(counts, status)) {
                counts[status] += 1;
            } else {
                counts.pending += 1;
            }

        }
    );

    const elementIds = {
        pending: "pendingBookingCount",
        confirmed: "confirmedBookingCount",
        completed: "completedBookingCount",
        cancelled: "cancelledBookingCount"
    };

    Object.entries(elementIds).forEach(
        ([status, id]) => {

            const element =
                document.getElementById(id);

            if (element) {
                element.textContent = counts[status];
            }

        }
    );

}


function renderNewBookings() {

    const container =
        document.getElementById("newBookingsList");

    if (!container) return;

    const bookings = [...dashboardState.bookings]
        .sort(
            (a, b) => {

                const aDate = recordDate(
                    a,
                    ["createdAt", "dateCreated", "bookingDate", "updatedAt"]
                );

                const bDate = recordDate(
                    b,
                    ["createdAt", "dateCreated", "bookingDate", "updatedAt"]
                );

                return (bDate?.getTime() || 0) -
                    (aDate?.getTime() || 0);

            }
        )
        .slice(0, 5);

    if (!bookings.length) {

        container.innerHTML = emptyDashboardState(
            "fa-regular fa-calendar-plus",
            "No recent bookings",
            "New customer reservations will appear here automatically."
        );

        return;

    }

    container.innerHTML = bookings.map(
        booking => {

            const createdDate = recordDate(
                booking,
                ["createdAt", "dateCreated", "bookingDate", "updatedAt"]
            );

            const reference =
                booking.bookingReference ||
                booking.reference ||
                booking.id;

            const amount =
                booking.totalAmount ||
                booking.total ||
                booking.packagePrice ||
                0;

            return `
                <div class="booking-item"
                    onclick="window.location.href='bookings.html'">
                    <div class="booking-item-icon">
                        <i class="fa-regular fa-calendar-check"></i>
                    </div>
                    <div class="booking-item-content">
                        <div class="booking-item-top">
                            <strong>${escapeHtml(reference)}</strong>
                            <span class="status-badge new">
                                ${escapeHtml(normalizedStatus(
                                    booking.status || booking.bookingStatus
                                ))}
                            </span>
                        </div>
                        <span class="booking-customer">
                            ${escapeHtml(customerName(booking))}
                        </span>
                        <div class="booking-details">
                            ${escapeHtml(packageName(booking))}
                        </div>
                    </div>
                    <div class="booking-item-right">
                        <span>${escapeHtml(formatDashboardDate(createdDate))}</span>
                        <strong>₱${formatDashboardMoney(amount)}</strong>
                    </div>
                    <i class="fa-solid fa-chevron-right item-arrow"></i>
                </div>
            `;

        }
    ).join("");

}


function renderRecentPayments() {

    const container =
        document.getElementById("recentPaymentsList");

    if (!container) return;

    const payments = [...dashboardState.payments]
        .sort(
            (a, b) => {

                const aDate = recordDate(
                    a,
                    ["paymentDate", "createdAt", "dateCreated", "updatedAt"]
                );

                const bDate = recordDate(
                    b,
                    ["paymentDate", "createdAt", "dateCreated", "updatedAt"]
                );

                return (bDate?.getTime() || 0) -
                    (aDate?.getTime() || 0);

            }
        )
        .slice(0, 5);

    if (!payments.length) {

        container.innerHTML = emptyDashboardState(
            "fa-solid fa-receipt",
            "No recent payments",
            "Recorded payments will appear here automatically."
        );

        return;

    }

    container.innerHTML = payments.map(
        payment => {

            const status = normalizedStatus(
                payment.status || "paid"
            );

            const iconStatus =
                status === "paid" ? "paid" :
                    status === "partial" ? "partial" : "failed";

            const date = recordDate(
                payment,
                ["paymentDate", "createdAt", "dateCreated", "updatedAt"]
            );

            const reference =
                payment.paymentReference ||
                payment.reference ||
                payment.id;

            const amount =
                payment.amount ||
                payment.amountPaid ||
                payment.paymentAmount ||
                0;

            return `
                <div class="payment-item"
                    onclick="window.location.href='payments.html'">
                    <div class="payment-item-icon ${iconStatus}">
                        <i class="fa-solid fa-peso-sign"></i>
                    </div>
                    <div class="payment-item-content">
                        <div class="payment-item-top">
                            <strong>${escapeHtml(reference)}</strong>
                            <span class="payment-status ${iconStatus}">
                                ${escapeHtml(status)}
                            </span>
                        </div>
                        <span class="payment-booking">
                            ${escapeHtml(
                                payment.bookingReference || "No booking reference"
                            )}
                        </span>
                        <div class="payment-details">
                            ${escapeHtml(customerName(payment))}
                        </div>
                    </div>
                    <div class="payment-item-right">
                        <span>${escapeHtml(formatDashboardDate(date))}</span>
                        <strong>₱${formatDashboardMoney(amount)}</strong>
                    </div>
                </div>
            `;

        }
    ).join("");

}


function renderUpcomingTrips() {

    const container =
        document.getElementById("upcomingTripsList");

    if (!container) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = dashboardState.bookings
        .map(
            booking => ({
                ...booking,
                dashboardTravelDate: recordDate(
                    booking,
                    ["travelDate", "tourDate", "departureDate", "startDate"]
                )
            })
        )
        .filter(
            booking => {

                const status = normalizedStatus(
                    booking.status || booking.bookingStatus
                );

                return booking.dashboardTravelDate &&
                    booking.dashboardTravelDate >= today &&
                    !["cancelled", "completed", "void"].includes(status);

            }
        )
        .sort(
            (a, b) =>
                a.dashboardTravelDate - b.dashboardTravelDate
        )
        .slice(0, 5);

    if (!upcoming.length) {

        container.innerHTML = emptyDashboardState(
            "fa-solid fa-route",
            "No upcoming trips",
            "Confirmed future tours will appear here automatically."
        );

        return;

    }

    container.innerHTML = upcoming.map(
        booking => `
            <div class="trip-item">
                <div class="trip-image"
                    style="display:flex;align-items:center;justify-content:center;
                        color:#1760ae;font-size:18px;">
                    <i class="fa-solid fa-location-dot"></i>
                </div>
                <div class="trip-content">
                    <strong>${escapeHtml(packageName(booking))}</strong>
                    <span>${escapeHtml(customerName(booking))}</span>
                </div>
                <div class="trip-right">
                    <strong>${escapeHtml(
                        formatDashboardDate(booking.dashboardTravelDate)
                    )}</strong>
                    <span class="confirmed-text">
                        <span class="status-dot"></span>
                        ${escapeHtml(normalizedStatus(
                            booking.status || booking.bookingStatus
                        ))}
                    </span>
                </div>
            </div>
        `
    ).join("");

}


function renderDashboard() {

    renderOverview();
    renderBookingStatus();
    renderNewBookings();
    renderRecentPayments();
    renderUpcomingTrips();

}


function startDashboardData() {

    dashboardUnsubscribers.forEach(
        unsubscribe => unsubscribe()
    );

    dashboardUnsubscribers = [];

    const collections = [
        "packages",
        "bookings",
        "customers",
        "payments"
    ];

    collections.forEach(
        collectionName => {

            const unsubscribe = onSnapshot(
                collection(db, collectionName),
                snapshot => {

                    dashboardState[collectionName] =
                        snapshot.docs.map(
                            item => ({
                                id: item.id,
                                ...item.data()
                            })
                        );

                    renderDashboard();

                },
                error => {

                    console.error(
                        `DASHBOARD ${collectionName.toUpperCase()} ERROR:`,
                        error
                    );

                }
            );

            dashboardUnsubscribers.push(
                unsubscribe
            );

        }
    );

}


window.addEventListener(
    "beforeunload",
    () => {

        dashboardUnsubscribers.forEach(
            unsubscribe => unsubscribe()
        );

    }
);

requireAuth({

    allowedRoles: [
        "owner",
        "admin"
    ],

    requiredPermission:
        "dashboard",

    onAuthorized: (
        user,
        profile
    ) => {

        try {

            // =============================================
            // LOAD AUTHENTICATED PROFILE
            // =============================================

            loadAdminProfile(
                user,
                profile
            );


            // =============================================
            // OWNER-ONLY TASK ACCESS LIST
            // =============================================

            loadTaskAccessAdmins(
                profile
            );


            // =============================================
            // REALTIME BUSINESS DATA
            // =============================================

            startDashboardData();


            // =============================================
            // DASHBOARD READY
            // =============================================

            hideLoading();


            console.log(
                "TWTMS DASHBOARD: Loading complete."
            );

        }

        catch (error) {

            console.error(
                "TWTMS DASHBOARD INITIALIZATION ERROR:",
                error
            );


            showLoadingError(
                navigator.onLine
                    ? "Unable to prepare the Dashboard. Please try again."
                    : "No internet connection. Check your connection and try again.",

                () =>
                    window.location.reload()
            );

        }

    }

});


// =========================================================
// LOGOUT
// =========================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                window.confirm(
                    "Are you sure you want to logout from TWTMS?"
                );


            if (!confirmed) {

                return;

            }


            logoutButton.disabled =
                true;


            logoutButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                &nbsp; Signing out...
            `;


            try {

                await logout();

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                logoutButton.disabled =
                    false;


                logoutButton.innerHTML = `
                    <i class="fa-solid fa-right-from-bracket"></i>
                    &nbsp; Logout
                `;


                alert(
                    "Unable to logout. Please try again."
                );

            }

        }
    );

}


// =========================================================
// MODULE LOADED
// =========================================================

console.log(
    "TWTMS ADMIN DASHBOARD MODULE LOADED"
);


// =========================================================
// FINAL SAFETY / CLEANUP
// =========================================================
//
// Prevent accidental background scrolling while a modal
// is open.
//
// =========================================================

function syncBodyModalState() {

    const manageModal =
        document.getElementById(
            "manageAccessModal"
        );


    const pageModalOpen =
        pageAccessModal &&
        pageAccessModal.classList.contains(
            "is-open"
        );


    const addAdminModalOpen =
        addAdminModal &&
        addAdminModal.classList.contains(
            "is-open"
        );


    const manageModalOpen =
        !!manageModal &&
        manageModal.classList.contains(
            "show"
        );


    if (
        pageModalOpen ||
        addAdminModalOpen ||
        manageModalOpen
    ) {

        document.body.classList.add(
            "modal-open"
        );

    }

    else {

        document.body.classList.remove(
            "modal-open"
        );

    }

}


// =========================================================
// OBSERVE MANAGE ACCESS MODAL
// =========================================================

const modalObserver =
    new MutationObserver(
        () => {

            syncBodyModalState();

        }
    );


modalObserver.observe(
    document.body,
    {
        childList: true,
        subtree: true
    }
);


// =========================================================
// INITIAL MODAL STATE
// =========================================================

syncBodyModalState();


// =========================================================
// GLOBAL ERROR LOGGING
// =========================================================
//
// Helpful during development.
// Does not interrupt the dashboard.
//
// =========================================================

window.addEventListener(
    "error",
    (event) => {

        console.error(
            "TWTMS DASHBOARD ERROR:",
            event.error || event.message
        );

    }
);


// =========================================================
// UNHANDLED PROMISE ERROR
// =========================================================

window.addEventListener(
    "unhandledrejection",
    (event) => {

        console.error(
            "TWTMS DASHBOARD PROMISE ERROR:",
            event.reason
        );

    }
);


// =========================================================
// FINAL MODULE STATUS
// =========================================================

console.log(
    "=============================================="
);

console.log(
    "TWTMS ADMIN DASHBOARD READY"
);

console.log(
    "Page Access UI: READY"
);

console.log(
    "Admin Access Management: READY"
);

console.log(
    "Firestore Admin Listener: READY"
);

console.log(
    "Authentication Guard: READY"
);

console.log(
    "Logout Handler: READY"
);

console.log(
    "=============================================="
);
