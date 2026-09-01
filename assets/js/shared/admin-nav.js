// =========================================================
// TRIPS WONDER - SHARED ADMIN NAVIGATION
// Admin pages only
// =========================================================

import {
    auth
} from "../firebase/firebase-config.js";

import {
    getUserProfile,
    hasModulePermission,
    logout
} from "../auth/auth-guard.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    doc,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    db
} from "../firebase/firebase-config.js";


// =========================================================
// ADMIN NAV ITEMS
// =========================================================

const ADMIN_NAV_ITEMS = [
    {
        id: "dashboard",
        label: "Dashboard",
        href: "dashboard.html",
        icon: "fa-solid fa-chart-pie",
        permission: "dashboard",
        available: true
    },
    {
        id: "packages",
        label: "Packages",
        href: "packages.html",
        icon: "fa-solid fa-suitcase",
        permission: "packages",
        available: true
    },
    {
        id: "bookings",
        label: "Bookings",
        href: "bookings.html",
        icon: "fa-regular fa-calendar-check",
        permission: "bookings",
        available: true
    },
    {
        id: "trip-operations",
        label: "Trip Operations",
        href: "trip-operations.html",
        icon: "fa-solid fa-route",
        permission: "tripOperations",
        available: true
    },
    {
        id: "customers",
        label: "Customers",
        href: "customers.html",
        icon: "fa-solid fa-user-group",
        permission: "customers",
        available: true
    },
    {
        id: "messages",
        label: "Messages",
        href: "messages.html",
        icon: "fa-regular fa-message",
        permission: "messages",
        available: true
    },
    {
        id: "notifications",
        label: "Notifications",
        href: "notifications.html",
        icon: "fa-regular fa-bell",
        permission: "bookings",
        available: true
    },
    {
        id: "promo",
        label: "Promo",
        href: "promo.html",
        icon: "fa-solid fa-tags",
        permission: "promo",
        available: true
    },
    {
        id: "payments",
        label: "Payments",
        href: "payments.html",
        icon: "fa-regular fa-credit-card",
        permission: "payments",
        available: true
    },
    {
        id: "invoices",
        label: "Invoices",
        href: "invoices.html",
        icon: "fa-solid fa-file-invoice",
        permission: "invoices",
        available: true
    },
    {
        id: "resort-bookings",
        label: "Resort Bookings",
        href: "resort-bookings.html",
        icon: "fa-solid fa-building",
        permission: "resortBookings",
        available: true
    },
    {
        id: "reports",
        label: "Reports",
        href: "reports.html",
        icon: "fa-solid fa-chart-line",
        permission: "reports",
        available: true
    }
];


// =========================================================
// HELPERS
// =========================================================

function normalizeRole(value) {
    return String(value || "client")
        .trim()
        .toLowerCase();
}

function getCurrentFileName() {
    return window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();
}

function getDisplayName(user, profile) {
    const fullName = [
        profile?.firstName || "",
        profile?.lastName || ""
    ].join(" ").trim();

    return (
        fullName ||
        profile?.name ||
        profile?.displayName ||
        user?.displayName ||
        "Admin"
    );
}

function getInitials(value) {
    const words = String(value || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!words.length) return "A";

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}

function canShowItem(profile, item) {
    const role = normalizeRole(profile?.role);

    if (role === "owner") {
        return true;
    }

    if (role !== "admin") {
        return false;
    }

    // Admin must have an explicit permission.
    return hasModulePermission(
        profile,
        item.permission
    );
}

function showAdminNavToast(message) {
    let toast = document.getElementById(
        "adminNavToast"
    );

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "adminNavToast";
        toast.className = "admin-nav-toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(
        window.__adminNavToastTimer
    );

    window.__adminNavToastTimer =
        setTimeout(
            () => toast.classList.remove("show"),
            2200
        );
}


// =========================================================
// SHARED ADMIN LOGOUT MODAL
// =========================================================

let adminLogoutInProgress = false;

function ensureAdminLogoutModal() {
    let modal =
        document.getElementById(
            "sharedAdminLogoutModal"
        );

    if (modal) {
        return modal;
    }

    modal =
        document.createElement(
            "div"
        );

    modal.id =
        "sharedAdminLogoutModal";

    modal.className =
        "admin-logout-modal";

    modal.hidden =
        true;

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    modal.innerHTML = `
        <div
            class="admin-logout-modal-backdrop"
            data-admin-logout-close
        ></div>

        <section
            class="admin-logout-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sharedAdminLogoutTitle"
            aria-describedby="sharedAdminLogoutDescription"
        >
            <div class="admin-logout-modal-icon">
                <i class="fa-solid fa-right-from-bracket"></i>
            </div>

            <span class="admin-logout-modal-eyebrow">
                ADMIN ACCOUNT
            </span>

            <h2 id="sharedAdminLogoutTitle">
                Sign out of TWTMS?
            </h2>

            <p id="sharedAdminLogoutDescription">
                You’ll need to sign in again to access the
                Trips Wonder admin workspace.
            </p>

            <div class="admin-logout-modal-actions">
                <button
                    type="button"
                    class="admin-logout-modal-cancel"
                    id="sharedAdminLogoutCancel"
                    data-admin-logout-close
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="admin-logout-modal-confirm"
                    id="sharedAdminLogoutConfirm"
                >
                    <i class="fa-solid fa-right-from-bracket"></i>
                    <span>Sign Out</span>
                </button>
            </div>
        </section>
    `;

    document.body.appendChild(
        modal
    );

    modal
        .querySelectorAll(
            "[data-admin-logout-close]"
        )
        .forEach(
            element => {
                element.addEventListener(
                    "click",
                    closeAdminLogoutModal
                );
            }
        );

    document.addEventListener(
        "keydown",
        event => {
            if (
                event.key ===
                    "Escape" &&
                modal.classList.contains(
                    "show"
                ) &&
                !adminLogoutInProgress
            ) {
                closeAdminLogoutModal();
            }
        }
    );

    return modal;
}

function openAdminLogoutModal() {
    if (adminLogoutInProgress) {
        return;
    }

    const modal =
        ensureAdminLogoutModal();

    modal.hidden =
        false;

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "admin-logout-modal-open"
    );

    requestAnimationFrame(
        () => {
            modal.classList.add(
                "show"
            );

            document
                .getElementById(
                    "sharedAdminLogoutCancel"
                )
                ?.focus();
        }
    );
}

function closeAdminLogoutModal() {
    if (adminLogoutInProgress) {
        return;
    }

    const modal =
        document.getElementById(
            "sharedAdminLogoutModal"
        );

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

    document.body.classList.remove(
        "admin-logout-modal-open"
    );

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

    document
        .getElementById(
            "sharedAdminLogoutBtn"
        )
        ?.focus();
}

async function performAdminLogout(
    logoutButton
) {
    if (adminLogoutInProgress) {
        return;
    }

    const modal =
        ensureAdminLogoutModal();

    const confirmButton =
        document.getElementById(
            "sharedAdminLogoutConfirm"
        );

    const cancelButton =
        document.getElementById(
            "sharedAdminLogoutCancel"
        );

    if (!confirmButton) {
        return;
    }

    adminLogoutInProgress =
        true;

    const originalConfirmHTML =
        confirmButton.innerHTML;

    confirmButton.disabled =
        true;

    if (cancelButton) {
        cancelButton.disabled =
            true;
    }

    if (logoutButton) {
        logoutButton.disabled =
            true;
    }

    confirmButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Signing Out...</span>
    `;

    try {
        stopAdminNotificationBadgeListeners();

        if (unsubscribeBusinessBranding) {
            unsubscribeBusinessBranding();
            unsubscribeBusinessBranding =
                null;
        }

        await logout();

    } catch (error) {
        console.error(
            "SHARED ADMIN NAV LOGOUT ERROR:",
            error
        );

        adminLogoutInProgress =
            false;

        confirmButton.disabled =
            false;

        if (cancelButton) {
            cancelButton.disabled =
                false;
        }

        if (logoutButton) {
            logoutButton.disabled =
                false;
        }

        confirmButton.innerHTML =
            originalConfirmHTML;

        modal.classList.add(
            "show"
        );

        showAdminNavToast(
            "Unable to sign out. Please try again."
        );
    }
}


// =========================================================
// RENDER
// =========================================================

function renderAdminNavigation(
    user,
    profile
) {
    const container =
        document.getElementById(
            "adminSidebar"
        );

    if (!container) {
        console.warn(
            'Shared Admin Nav: "#adminSidebar" was not found.'
        );
        return;
    }

    const currentFile =
        getCurrentFileName();

    const displayName =
        getDisplayName(
            user,
            profile
        );

    const role =
        normalizeRole(
            profile?.role
        );

    const visibleItems =
        ADMIN_NAV_ITEMS.filter(
            item =>
                canShowItem(
                    profile,
                    item
                )
        );

    container.innerHTML = `
        <div class="admin-sidebar-brand">
            <div class="admin-sidebar-logo">
                <img
                    id="sharedAdminBusinessLogo"
                    src="/assets/images/logo.png"
                    alt="Trips Wonder Logo"
                    data-default-src="/assets/images/logo.png"
                >
            </div>

            <div class="admin-sidebar-brand-text">
                <strong id="sharedAdminBusinessName">Trips Wonder</strong>
                <span id="sharedAdminSystemName">Travel Management System</span>
            </div>
        </div>

        <div class="admin-sidebar-menu-title">
            MAIN MENU
        </div>

        <nav
            class="admin-sidebar-menu"
            aria-label="Admin Navigation"
        >
            ${visibleItems.map(item => {
                const isActive =
                    currentFile ===
                    item.href.toLowerCase();

                return `
                    <a
                        href="${item.href}"
                        class="admin-sidebar-link${isActive ? " active" : ""}${!item.available ? " coming-soon" : ""}"
                        data-admin-nav="${item.id}"
                        data-available="${item.available ? "true" : "false"}"
                        ${isActive ? 'aria-current="page"' : ""}
                        title="${item.label}"
                    >
                        <i class="${item.icon}"></i>
                        <span>${item.label}</span>
                        ${
                            item.id === "notifications"
                                ? '<b class="admin-sidebar-notification-badge" id="sharedAdminNotificationBadge" hidden aria-hidden="true"></b>'
                                : ""
                        }
                    </a>
                `;
            }).join("")}
        </nav>

        <div class="admin-sidebar-bottom">

            <a
                href="admin-profile.html"
                class="admin-sidebar-profile"
                id="sharedAdminProfileLink"
                title="Admin Profile"
            >
                <div class="admin-sidebar-avatar">
                    ${getInitials(displayName)}
                </div>

                <div class="admin-sidebar-account">
                    <strong>${displayName}</strong>
                    <span>
                        ${role === "owner"
                            ? "Owner"
                            : "Administrator"}
                    </span>
                </div>
            </a>

            <button
                type="button"
                class="admin-sidebar-logout"
                id="sharedAdminLogoutBtn"
                title="Logout"
            >
                <i class="fa-solid fa-right-from-bracket"></i>
                <span>Logout</span>
            </button>

        </div>
    `;

    container
        .querySelectorAll(
            '.admin-sidebar-link[data-available="false"]'
        )
        .forEach(link => {
            link.addEventListener(
                "click",
                event => {
                    event.preventDefault();

                    const label =
                        link.textContent
                            .trim();

                    showAdminNavToast(
                        `${label} module is coming soon.`
                    );
                }
            );
        });

    const logoutButton =
        document.getElementById(
            "sharedAdminLogoutBtn"
        );

    const logoutModal =
        ensureAdminLogoutModal();

    const logoutConfirmButton =
        document.getElementById(
            "sharedAdminLogoutConfirm"
        );

    logoutButton?.addEventListener(
        "click",
        openAdminLogoutModal
    );

    if (
        logoutConfirmButton &&
        logoutConfirmButton.dataset.bound !==
            "true"
    ) {
        logoutConfirmButton.dataset.bound =
            "true";

        logoutConfirmButton.addEventListener(
            "click",
            () =>
                performAdminLogout(
                    document.getElementById(
                        "sharedAdminLogoutBtn"
                    )
                )
        );
    }

    if (logoutModal) {
        logoutModal.setAttribute(
            "data-ready",
            "true"
        );
    }

    console.log(
        "SHARED ADMIN NAV READY:",
        {
            currentFile,
            role,
            visibleModules:
                visibleItems.map(
                    item => item.id
                )
        }
    );
}


// =========================================================
// CENTRALIZED BUSINESS BRANDING
// Firestore: systemSettings/general
// =========================================================

let unsubscribeBusinessBranding = null;


function applySharedAdminFavicon(
    settings = {}
) {
    const faviconURL =
        String(
            settings.businessFavicon ||
            ""
        ).trim();

    const fallback =
        "../../favicon.jpg";

    let favicon =
        document.querySelector(
            'link[data-twtms-dynamic-favicon]'
        ) ||
        document.querySelector(
            'link[rel~="icon"]'
        );

    if (!favicon) {
        favicon =
            document.createElement(
                "link"
            );

        favicon.rel =
            "icon";

        document.head.appendChild(
            favicon
        );
    }

    favicon.setAttribute(
        "data-twtms-dynamic-favicon",
        "true"
    );

    favicon.href =
        faviconURL ||
        fallback;
}

function applyBusinessBranding(settings = {}) {
    applySharedAdminFavicon(
        settings
    );

    const logo =
        document.getElementById("sharedAdminBusinessLogo");

    const businessNameElement =
        document.getElementById("sharedAdminBusinessName");

    const defaultBusinessName =
        "Trips Wonder";

    const businessName =
        String(settings.businessName || "").trim();

    if (businessNameElement) {
        businessNameElement.textContent =
            businessName || defaultBusinessName;

        businessNameElement.title =
            businessName || defaultBusinessName;
    }

    if (!logo) return;

    const defaultSrc =
        logo.dataset.defaultSrc ||
        "/assets/images/logo.png";

    const businessLogo =
        String(settings.businessLogo || "").trim();

    logo.src =
        businessLogo || defaultSrc;

    logo.alt =
        `${businessName || defaultBusinessName} Logo`;

    logo.onerror = () => {
        logo.onerror = null;
        logo.src = defaultSrc;
    };
}

function initializeBusinessBranding() {
    if (!db) {
        console.warn(
            "SHARED ADMIN NAV: Firestore DB is unavailable."
        );
        return;
    }

    if (unsubscribeBusinessBranding) {
        unsubscribeBusinessBranding();
        unsubscribeBusinessBranding = null;
    }

    const settingsReference =
        doc(
            db,
            "systemSettings",
            "general"
        );

    unsubscribeBusinessBranding =
        onSnapshot(
            settingsReference,
            snapshot => {
                if (!snapshot.exists()) {
                    applyBusinessBranding({});
                    return;
                }

                applyBusinessBranding(
                    snapshot.data() || {}
                );
            },
            error => {
                console.error(
                    "SHARED ADMIN NAV BUSINESS BRANDING ERROR:",
                    error
                );

                applyBusinessBranding({});
            }
        );
}




// =========================================================
// ADMIN BOOKING NOTIFICATION BADGE
// =========================================================
//
// The booking itself is the source of truth.
// Only client website bookings are counted.
//
// Read state is stored per admin in:
// adminNotificationReads/{adminUid}__booking__{bookingId}
// =========================================================

let unsubscribeAdminBookingNotifications = null;
let unsubscribeAdminNotificationReads = null;

let adminBookingNotificationIds = new Set();
let adminReadNotificationKeys = new Set();


function stopAdminNotificationBadgeListeners() {
    if (unsubscribeAdminBookingNotifications) {
        unsubscribeAdminBookingNotifications();
        unsubscribeAdminBookingNotifications = null;
    }

    if (unsubscribeAdminNotificationReads) {
        unsubscribeAdminNotificationReads();
        unsubscribeAdminNotificationReads = null;
    }

    adminBookingNotificationIds = new Set();
    adminReadNotificationKeys = new Set();
}


function updateAdminNotificationBadge() {
    const badge =
        document.getElementById(
            "sharedAdminNotificationBadge"
        );

    if (!badge) {
        return;
    }

    let unreadCount = 0;

    adminBookingNotificationIds.forEach(
        bookingId => {
            const key =
                `booking:${bookingId}`;

            if (
                !adminReadNotificationKeys.has(
                    key
                )
            ) {
                unreadCount += 1;
            }
        }
    );

    const hasUnread =
        unreadCount > 0;

    badge.hidden =
        !hasUnread;

    badge.setAttribute(
        "aria-hidden",
        String(!hasUnread)
    );

    if (!hasUnread) {
        badge.textContent =
            "";
        return;
    }

    badge.textContent =
        unreadCount > 99
            ? "99+"
            : String(unreadCount);
}


function initializeAdminNotificationBadge(
    user,
    profile
) {
    stopAdminNotificationBadgeListeners();

    const role =
        normalizeRole(
            profile?.role
        );

    const canSeeBookingNotifications =
        role === "owner" ||
        (
            role === "admin" &&
            hasModulePermission(
                profile,
                "bookings"
            )
        );

    if (
        !user ||
        !canSeeBookingNotifications
    ) {
        return;
    }

    const websiteBookingsQuery =
        query(
            collection(
                db,
                "bookings"
            ),
            where(
                "bookingSource",
                "==",
                "website"
            )
        );

    unsubscribeAdminBookingNotifications =
        onSnapshot(
            websiteBookingsQuery,
            snapshot => {
                adminBookingNotificationIds =
                    new Set(
                        snapshot.docs.map(
                            bookingDocument =>
                                bookingDocument.id
                        )
                    );

                updateAdminNotificationBadge();
            },
            error => {
                console.error(
                    "SHARED ADMIN NAV BOOKING NOTIFICATION ERROR:",
                    error
                );
            }
        );

    const readStateQuery =
        query(
            collection(
                db,
                "adminNotificationReads"
            ),
            where(
                "adminUid",
                "==",
                user.uid
            )
        );

    unsubscribeAdminNotificationReads =
        onSnapshot(
            readStateQuery,
            snapshot => {
                adminReadNotificationKeys =
                    new Set(
                        snapshot.docs
                            .map(
                                readDocument =>
                                    readDocument.data()
                                        ?.notificationKey
                            )
                            .filter(Boolean)
                    );

                updateAdminNotificationBadge();
            },
            error => {
                console.error(
                    "SHARED ADMIN NAV NOTIFICATION READ ERROR:",
                    error
                );
            }
        );
}


window.addEventListener(
    "beforeunload",
    stopAdminNotificationBadgeListeners
);


// =========================================================
// AUTH PROFILE
// =========================================================

onAuthStateChanged(
    auth,
    async user => {
        if (!user) {
            return;
        }

        try {
            const profile =
                window.currentUserProfile ||
                await getUserProfile(
                    user
                );

            if (!profile) {
                return;
            }

            renderAdminNavigation(
                user,
                profile
            );

            initializeBusinessBranding();

            initializeAdminNotificationBadge(
                user,
                profile
            );
        } catch (error) {
            console.error(
                "SHARED ADMIN NAV PROFILE ERROR:",
                error
            );
        }
    }
);


// =========================================================
// EXPORTS
// =========================================================

export {
    ADMIN_NAV_ITEMS,
    renderAdminNavigation
};
