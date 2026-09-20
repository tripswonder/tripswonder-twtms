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
        group: "main",
        href: "dashboard.html",
        icon: "fa-solid fa-chart-pie",
        permission: "dashboard",
        available: true
    },
    {
        id: "packages",
        label: "Packages",
        group: "main",
        href: "packages.html",
        icon: "fa-solid fa-suitcase",
        permission: "packages",
        available: true
    },
    {
        id: "bookings",
        label: "Bookings",
        group: "main",
        href: "bookings.html",
        icon: "fa-regular fa-calendar-check",
        permission: "bookings",
        available: true
    },
    {
        id: "trip-operations",
        label: "Trip Operations",
        group: "main",
        href: "trip-operations.html",
        icon: "fa-solid fa-route",
        permission: "tripOperations",
        available: true
    },
    {
        id: "customers",
        label: "Customers",
        group: "customers",
        href: "customers.html",
        icon: "fa-solid fa-user-group",
        permission: "customers",
        available: true
    },
    {
        id: "messages",
        label: "Messages",
        group: "customers",
        href: "messages.html",
        icon: "fa-regular fa-message",
        permission: "messages",
        available: true
    },
    {
        id: "notifications",
        label: "Notifications",
        group: "customers",
        href: "notifications.html",
        icon: "fa-regular fa-bell",
        permission: "bookings",
        available: true
    },
    {
        id: "promo",
        label: "Promo",
        group: "management",
        href: "promo.html",
        icon: "fa-solid fa-tags",
        permission: "promo",
        available: true
    },
    {
        id: "payments",
        label: "Payments",
        group: "management",
        href: "payments.html",
        icon: "fa-regular fa-credit-card",
        permission: "payments",
        available: true
    },
    {
        id: "tour-pricing",
        label: "Tour Pricing",
        group: "management",
        href: "tour-pricing.html",
        icon: "fa-solid fa-file-invoice",
        permission: "tourPricing",
        available: true
    },
    {
        id: "resort-bookings",
        label: "Resort Bookings",
        group: "management",
        href: "resort-bookings.html",
        icon: "fa-solid fa-building",
        permission: "resortBookings",
        available: true
    },
    {
        id: "reports",
        label: "Reports",
        group: "analytics",
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
            "adminHeaderAccountBtn"
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
// SHARED ADMIN SHELL / HEADER
// =========================================================

const ADMIN_NAV_GROUPS = [
    { id: "main", label: "MAIN" },
    { id: "management", label: "MANAGEMENT" },
    { id: "customers", label: "CUSTOMERS" },
    { id: "analytics", label: "ANALYTICS" }
];

function getCurrentNavItem(items = ADMIN_NAV_ITEMS) {
    const currentFile = getCurrentFileName();
    return items.find(
        item => item.href.toLowerCase() === currentFile
    ) || null;
}

function getProfilePhoto(user, profile) {
    return String(
        profile?.photoURL ||
        profile?.profilePhoto ||
        profile?.avatarURL ||
        user?.photoURL ||
        ""
    ).trim();
}

function renderHeaderAvatar(user, profile, displayName) {
    const photoURL = getProfilePhoto(user, profile);

    if (photoURL) {
        return `
            <img
                src="${photoURL}"
                alt="${displayName}"
                class="admin-header-avatar-image"
                referrerpolicy="no-referrer"
            >
        `;
    }

    return `
        <span class="admin-header-avatar-fallback">
            ${getInitials(displayName)}
        </span>
    `;
}

function ensureSharedAdminHeader(user, profile, visibleItems) {
    const main = document.querySelector(
        "body.admin-shared-nav-page .main"
    );

    if (!main) return;

    let header = document.getElementById(
        "sharedAdminHeader"
    );

    if (!header) {
        header = document.createElement("header");
        header.id = "sharedAdminHeader";
        header.className = "admin-topbar";
        main.prepend(header);
    }

    const currentItem =
        getCurrentNavItem(visibleItems) ||
        getCurrentNavItem();

    const displayName =
        getDisplayName(user, profile);

    const role =
        normalizeRole(profile?.role);

    const pageTitle =
        currentItem?.label ||
        document.title.split("|")[0].trim() ||
        "Admin";

    header.innerHTML = `
        <div class="admin-topbar-left">
            <button
                type="button"
                class="admin-mobile-logo-toggle"
                id="adminMobileLogoToggle"
                aria-label="Open navigation"
                aria-expanded="false"
            >
                <img
                    src="/assets/images/logo.png"
                    alt="Trips Wonder"
                    data-mobile-admin-logo
                >
            </button>
        </div>

        <div class="admin-topbar-center">
            <div
                class="admin-global-search"
                id="adminGlobalSearch"
            >
                <i class="fa-solid fa-magnifying-glass"></i>

                <input
                    type="search"
                    id="adminGlobalSearchInput"
                    placeholder="Search bookings, customers, payments..."
                    autocomplete="off"
                    aria-label="Search admin modules"
                >

                <kbd>Ctrl K</kbd>

                <div
                    class="admin-global-search-panel"
                    id="adminGlobalSearchPanel"
                    hidden
                ></div>
            </div>
        </div>

        <div class="admin-topbar-actions">
            <a
                href="messages.html"
                class="admin-topbar-icon-btn"
                title="Messages"
                aria-label="Messages"
            >
                <i class="fa-regular fa-message"></i>
                <b
                    class="admin-header-action-badge"
                    id="sharedAdminMessageBadge"
                    hidden
                ></b>
            </a>

            <a
                href="notifications.html"
                class="admin-topbar-icon-btn"
                title="Notifications"
                aria-label="Notifications"
            >
                <i class="fa-regular fa-bell"></i>
                <b
                    class="admin-header-action-badge"
                    id="sharedAdminNotificationBadge"
                    hidden
                    aria-hidden="true"
                ></b>
            </a>

            <div class="admin-header-account">
                <button
                    type="button"
                    class="admin-header-account-btn"
                    id="adminHeaderAccountBtn"
                    aria-haspopup="menu"
                    aria-expanded="false"
                >
                    <span class="admin-header-avatar">
                        ${renderHeaderAvatar(
                            user,
                            profile,
                            displayName
                        )}
                    </span>

                    <span class="admin-header-account-copy">
                        <strong>${displayName}</strong>
                        <small>
                            ${role === "owner"
                                ? "Owner"
                                : "Administrator"}
                        </small>
                    </span>

                    <i class="fa-solid fa-chevron-down"></i>
                </button>

                <div
                    class="admin-header-account-menu"
                    id="adminHeaderAccountMenu"
                    role="menu"
                    hidden
                >
                    <div class="admin-account-menu-head">
                        <span class="admin-header-avatar large">
                            ${renderHeaderAvatar(
                                user,
                                profile,
                                displayName
                            )}
                        </span>

                        <div>
                            <strong>${displayName}</strong>
                            <span>
                                ${role === "owner"
                                    ? "Owner"
                                    : "Administrator"}
                            </span>
                        </div>
                    </div>

                    <a
                        href="admin-profile.html"
                        role="menuitem"
                    >
                        <i class="fa-regular fa-user"></i>
                        <span>My Profile</span>
                    </a>

                    <a
                        href="settings.html"
                        role="menuitem"
                    >
                        <i class="fa-solid fa-gear"></i>
                        <span>Account Settings</span>
                    </a>

                    <div class="admin-account-menu-divider"></div>

                    <button
                        type="button"
                        id="sharedAdminHeaderLogoutBtn"
                        class="admin-account-menu-logout"
                        role="menuitem"
                    >
                        <i class="fa-solid fa-right-from-bracket"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    initializeSharedAdminHeader(
        user,
        profile,
        visibleItems
    );
}

function initializeSharedAdminHeader(
    user,
    profile,
    visibleItems
) {
    const body = document.body;
    const sidebar =
        document.getElementById("adminSidebar");
    const overlay =
        document.getElementById("adminSidebarOverlay");
    const toggle =
        document.getElementById("adminMobileLogoToggle");

    const sidebarBrand =
        document.querySelector(
            ".admin-sidebar-brand"
        );
    const accountButton =
        document.getElementById("adminHeaderAccountBtn");
    const accountMenu =
        document.getElementById("adminHeaderAccountMenu");
    const headerLogout =
        document.getElementById(
            "sharedAdminHeaderLogoutBtn"
        );
    const searchInput =
        document.getElementById(
            "adminGlobalSearchInput"
        );
    const searchPanel =
        document.getElementById(
            "adminGlobalSearchPanel"
        );

    const isMobile = () =>
        window.matchMedia("(max-width: 900px)").matches;

    const closeMobileNav = () => {
        body.classList.remove("admin-mobile-nav-open");
        toggle?.setAttribute("aria-expanded", "false");
    };

    const syncDesktopState = () => {
        if (isMobile()) {
            body.classList.remove("admin-nav-expanded");
            return;
        }

        const savedState =
            localStorage.getItem(
                "twtmsAdminNavExpanded"
            );

        const expanded =
            savedState === null
                ? true
                : savedState === "true";

        body.classList.toggle(
            "admin-nav-expanded",
            expanded
        );

        toggle?.setAttribute(
            "aria-expanded",
            String(expanded)
        );
    };

    syncDesktopState();

    if (sidebarBrand) {
        sidebarBrand.setAttribute(
            "role",
            "button"
        );
        sidebarBrand.setAttribute(
            "tabindex",
            "0"
        );
        sidebarBrand.setAttribute(
            "aria-label",
            "Toggle navigation"
        );

        const toggleDesktopSidebar = () => {
            if (isMobile()) return;

            const expanded =
                !body.classList.contains(
                    "admin-nav-expanded"
                );

            body.classList.toggle(
                "admin-nav-expanded",
                expanded
            );

            localStorage.setItem(
                "twtmsAdminNavExpanded",
                String(expanded)
            );
        };

        sidebarBrand.addEventListener(
            "click",
            toggleDesktopSidebar
        );

        sidebarBrand.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    toggleDesktopSidebar();
                }
            }
        );
    }

    toggle?.addEventListener("click", () => {
        if (isMobile()) {
            const willOpen =
                !body.classList.contains(
                    "admin-mobile-nav-open"
                );

            body.classList.toggle(
                "admin-mobile-nav-open",
                willOpen
            );

            toggle.setAttribute(
                "aria-expanded",
                String(willOpen)
            );

            return;
        }

        const expanded =
            !body.classList.contains(
                "admin-nav-expanded"
            );

        body.classList.toggle(
            "admin-nav-expanded",
            expanded
        );

        localStorage.setItem(
            "twtmsAdminNavExpanded",
            String(expanded)
        );

        toggle.setAttribute(
            "aria-expanded",
            String(expanded)
        );
    });

    overlay?.addEventListener(
        "click",
        closeMobileNav
    );

    sidebar
        ?.querySelectorAll(".admin-sidebar-link")
        .forEach(link => {
            link.addEventListener(
                "click",
                closeMobileNav
            );
        });

    window.addEventListener(
        "resize",
        syncDesktopState,
        { passive: true }
    );

    accountButton?.addEventListener(
        "click",
        event => {
            event.stopPropagation();

            const willOpen =
                accountMenu?.hidden !== false;

            if (accountMenu) {
                accountMenu.hidden =
                    !willOpen;
            }

            accountButton.setAttribute(
                "aria-expanded",
                String(willOpen)
            );
        }
    );

    document.addEventListener(
        "click",
        event => {
            if (
                accountMenu &&
                !accountMenu.hidden &&
                !event.target.closest(
                    ".admin-header-account"
                )
            ) {
                accountMenu.hidden = true;
                accountButton?.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }

            if (
                searchPanel &&
                !searchPanel.hidden &&
                !event.target.closest(
                    ".admin-global-search"
                )
            ) {
                searchPanel.hidden = true;
            }
        }
    );

    headerLogout?.addEventListener(
        "click",
        openAdminLogoutModal
    );

    function renderSearchResults(value = "") {
        if (!searchPanel) return;

        const term =
            String(value || "")
                .trim()
                .toLowerCase();

        const results =
            visibleItems.filter(item =>
                !term ||
                item.label
                    .toLowerCase()
                    .includes(term)
            );

        searchPanel.innerHTML = `
            <div class="admin-search-panel-label">
                ${term ? "SEARCH RESULTS" : "QUICK ACCESS"}
            </div>

            ${
                results.length
                    ? results
                        .slice(0, 8)
                        .map(item => `
                            <a
                                href="${item.href}"
                                class="admin-search-result"
                            >
                                <span class="admin-search-result-icon">
                                    <i class="${item.icon}"></i>
                                </span>
                                <span>
                                    <strong>${item.label}</strong>
                                    <small>Open admin module</small>
                                </span>
                                <i class="fa-solid fa-arrow-right"></i>
                            </a>
                        `)
                        .join("")
                    : `
                        <div class="admin-search-empty">
                            <i class="fa-regular fa-folder-open"></i>
                            <span>No matching admin module.</span>
                        </div>
                    `
            }
        `;

        searchPanel.hidden = false;
    }

    searchInput?.addEventListener(
        "focus",
        () => renderSearchResults(
            searchInput.value
        )
    );

    searchInput?.addEventListener(
        "input",
        () => renderSearchResults(
            searchInput.value
        )
    );

    document.addEventListener(
        "keydown",
        event => {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault();
                searchInput?.focus();
                renderSearchResults(
                    searchInput?.value || ""
                );
            }

            if (event.key === "Escape") {
                if (searchPanel) {
                    searchPanel.hidden = true;
                }

                if (accountMenu) {
                    accountMenu.hidden = true;
                }

                accountButton?.setAttribute(
                    "aria-expanded",
                    "false"
                );

                closeMobileNav();
            }
        }
    );
}

function renderGroupedNavigation(visibleItems, currentFile) {
    return ADMIN_NAV_GROUPS
        .map(group => {
            const groupOrder = {
                main: [
                    "dashboard",
                    "bookings",
                    "packages",
                    "trip-operations"
                ],
                management: [
                    "payments",
                    "tour-pricing",
                    "resort-bookings",
                    "promo"
                ],
                customers: [
                    "customers",
                    "messages",
                    "notifications"
                ],
                analytics: [
                    "reports"
                ]
            };

            const order =
                groupOrder[group.id] || [];

            const items =
                visibleItems
                    .filter(
                        item => item.group === group.id
                    )
                    .sort(
                        (a, b) =>
                            order.indexOf(a.id) -
                            order.indexOf(b.id)
                    );

            if (!items.length) return "";

            return `
                <div class="admin-sidebar-group">
                    <div class="admin-sidebar-menu-title">
                        ${group.label}
                    </div>

                    <div class="admin-sidebar-group-links">
                        ${items.map(item => {
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
                                    data-tooltip="${item.label}"
                                    title="${item.label}"
                                >
                                    <i class="${item.icon}"></i>
                                    <span>${item.label}</span>
                                    ${
                                        item.id === "bookings"
                                            ? '<b class="admin-sidebar-count-badge" id="sharedAdminBookingBadge" hidden></b>'
                                            : item.id === "messages"
                                                ? '<b class="admin-sidebar-count-badge" id="sharedAdminSidebarMessageBadge" hidden></b>'
                                                : item.id === "notifications"
                                                    ? '<b class="admin-sidebar-count-badge" id="sharedAdminSidebarNotificationBadge" hidden></b>'
                                                    : ""
                                    }
                                </a>
                            `;
                        }).join("")}
                    </div>
                </div>
            `;
        })
        .join("");
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
                <strong id="sharedAdminBusinessName">
                    Trips Wonder
                </strong>
                <span id="sharedAdminSystemName">
                    ADMIN MANAGEMENT
                </span>
            </div>
        </div>

        <nav
            class="admin-sidebar-menu"
            aria-label="Admin Navigation"
        >
            ${renderGroupedNavigation(
                visibleItems,
                currentFile
            )}
        </nav>

        <div class="admin-sidebar-footnote">
            <span>TWTMS</span>
            <small>Trips Wonder</small>
        </div>
    `;

    ensureSharedAdminHeader(
        user,
        profile,
        visibleItems
    );

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
            "sharedAdminHeaderLogoutBtn"
        );

    const logoutModal =
        ensureAdminLogoutModal();

    const logoutConfirmButton =
        document.getElementById(
            "sharedAdminLogoutConfirm"
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

    const sidebarBadge =
        document.getElementById(
            "sharedAdminSidebarNotificationBadge"
        );

    if (!badge && !sidebarBadge) {
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

    const badgeText =
        unreadCount > 99
            ? "99+"
            : String(unreadCount);

    [badge, sidebarBadge]
        .filter(Boolean)
        .forEach(element => {
            element.hidden = !hasUnread;
            element.setAttribute(
                "aria-hidden",
                String(!hasUnread)
            );
            element.textContent =
                hasUnread ? badgeText : "";
        });

    if (!hasUnread) {
        return;
    }
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
