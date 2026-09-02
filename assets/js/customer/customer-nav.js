/* ==========================================================
   TRIPS WONDER — SHARED CUSTOMER NAVIGATION
   FINAL FUNCTIONAL VERSION

   RULE:
   - home.html remains untouched.
   - All other customer modules use the shared desktop header.
   - Mobile uses the shared bottom navigation.
========================================================== */

import {
    auth,
    db
} from "../firebase/firebase-config.js";

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


const CUSTOMER_NAV_ITEMS = [
    {
        id: "home",
        label: "Home",
        href: "home.html",
        icon: "fa-solid fa-house"
    },
    {
        id: "explore",
        label: "Explore",
        href: "home.html#explore",
        icon: "fa-regular fa-compass"
    },
    {
        id: "tours",
        label: "Tours",
        href: "tours.html",
        icon: "fa-solid fa-suitcase"
    },
    {
        id: "my-trip",
        label: "My Trip",
        href: "my-trip.html",
        icon: "fa-regular fa-calendar-check"
    },
    {
        id: "promos",
        label: "Promos",
        href: "promo.html",
        icon: "fa-solid fa-tag"
    }
];


const DEFAULT_CUSTOMER_BRANDING = {
    businessName: "Trips Wonder",
    businessLogo: "../../assets/images/logo.png",
    businessTagline: "Travel & Tours"
};


const state = {
    user: null,
    profile: {},
    branding: {},
    unsubscribeBranding: null,
    unsubscribeProfile: null,
    unsubscribeNotifications: null,
    unsubscribeConversation: null
};


function getCurrentFileName() {

    return (
        window.location.pathname
            .split("/")
            .pop() ||
        "home.html"
    )
    .toLowerCase();
}


function isHomeModule() {

    return getCurrentFileName() ===
        "home.html";
}


function getCurrentCustomerModule() {

    const fileName =
        getCurrentFileName();

    const hash =
        String(
            window.location.hash ||
            ""
        )
        .toLowerCase();

    if (
        fileName === "home.html" &&
        hash === "#explore"
    ) {
        return "explore";
    }

    if (fileName === "home.html") {
        return "home";
    }

    if (fileName === "tours.html") {
        return "tours";
    }

    if (fileName === "my-trip.html") {
        return "my-trip";
    }

    if (fileName === "promo.html") {
        return "promos";
    }

    return "";
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function setBadge(
    element,
    count
) {

    if (!element) {
        return;
    }

    const safeCount =
        Math.max(
            0,
            Number(count || 0)
        );

    element.textContent =
        safeCount > 99
            ? "99+"
            : String(safeCount);

    element.hidden =
        safeCount === 0;
}


/* ==========================================================
   MOBILE NAV
========================================================== */

function createMobileNav() {

    const currentModule =
        getCurrentCustomerModule();

    return `
        <nav
            class="bottom-nav"
            aria-label="Customer navigation"
        >
            <div class="customer-nav-menu">

                ${
                    CUSTOMER_NAV_ITEMS
                        .map(
                            item => `

                                <a
                                    href="${item.href}"
                                    class="bottom-nav-item${
                                        item.id === currentModule
                                            ? " active"
                                            : ""
                                    }"
                                    aria-label="${item.label}"
                                    title="${item.label}"
                                    data-module="${item.id}"
                                    ${
                                        item.id === currentModule
                                            ? 'aria-current="page"'
                                            : ""
                                    }
                                >
                                    <span class="bottom-icon">
                                        <i
                                            class="${item.icon}"
                                            aria-hidden="true"
                                        ></i>
                                    </span>

                                    <span class="bottom-label">
                                        ${item.label}
                                    </span>
                                </a>

                            `
                        )
                        .join("")
                }

            </div>
        </nav>
    `;
}


/* ==========================================================
   DESKTOP HEADER
========================================================== */

function createDesktopHeader() {

    const currentModule =
        getCurrentCustomerModule();

    return `
        <header
            class="customer-shared-header"
            aria-label="Trips Wonder customer header"
        >

            <div class="customer-shared-header-left">

                <a
                    href="home.html"
                    class="customer-shared-brand"
                    aria-label="Trips Wonder Home"
                >
                    <img
                        id="sharedCustomerBusinessLogo"
                        src="${DEFAULT_CUSTOMER_BRANDING.businessLogo}"
                        alt="${DEFAULT_CUSTOMER_BRANDING.businessName}"
                        data-default-src="${DEFAULT_CUSTOMER_BRANDING.businessLogo}"
                    >
                </a>


                <form
                    class="customer-shared-search"
                    id="customerSharedSearchForm"
                    role="search"
                >
                    <i class="fa-solid fa-magnifying-glass"></i>

                    <input
                        id="customerSharedSearchInput"
                        type="search"
                        placeholder="Search tours, destinations, packages..."
                        autocomplete="off"
                    >

                    <button
                        type="button"
                        class="customer-shared-search-clear"
                        id="customerSharedSearchClear"
                        aria-label="Clear search"
                        hidden
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </form>

            </div>


            <nav
                class="customer-shared-center-nav"
                aria-label="Customer modules"
            >

                ${
                    CUSTOMER_NAV_ITEMS
                        .map(
                            item => `

                                <a
                                    href="${item.href}"
                                    class="customer-shared-center-item${
                                        item.id === currentModule
                                            ? " active"
                                            : ""
                                    }"
                                    aria-label="${item.label}"
                                    title="${item.label}"
                                    ${
                                        item.id === currentModule
                                            ? 'aria-current="page"'
                                            : ""
                                    }
                                >
                                    <i
                                        class="${item.icon}"
                                        aria-hidden="true"
                                    ></i>
                                </a>

                            `
                        )
                        .join("")
                }

            </nav>


            <div class="customer-shared-actions">

                <a
                    href="message.html"
                    class="customer-shared-action"
                    aria-label="Messages"
                    title="Messages"
                >
                    <i class="fa-regular fa-comment-dots"></i>

                    <span
                        class="customer-shared-badge"
                        id="customerSharedMessageBadge"
                        hidden
                    >
                        0
                    </span>
                </a>


                <a
                    href="message.html#notifications"
                    class="customer-shared-action"
                    aria-label="Notifications"
                    title="Notifications"
                >
                    <i class="fa-regular fa-bell"></i>

                    <span
                        class="customer-shared-badge"
                        id="customerSharedNotificationBadge"
                        hidden
                    >
                        0
                    </span>
                </a>


                <a
                    href="account.html"
                    class="customer-shared-profile"
                    aria-label="Account"
                    title="Account"
                >

                    <span
                        class="customer-shared-avatar"
                        id="customerSharedAvatar"
                    >
                        <i class="fa-solid fa-user"></i>
                    </span>

                </a>

            </div>

        </header>
    `;
}


/* ==========================================================
   RENDER
========================================================== */

function renderCustomerNav(
    containerId = "customerBottomNav"
) {

    const container =
        document.getElementById(
            containerId
        );

    if (!container) {

        console.warn(
            `Customer navigation container "#${containerId}" was not found.`
        );

        return;
    }


    /*
     * HOME PROTECTION
     *
     * Home already has its approved own desktop header / rail.
     * We only keep the existing shared mobile bottom nav there.
     */
    if (isHomeModule()) {

        document.body.classList.add(
            "customer-home-nav-protected"
        );

        document.body.classList.remove(
            "customer-shared-nav-page"
        );

        container.innerHTML =
            createMobileNav();

        return;
    }


    document.body.classList.add(
        "customer-shared-nav-page"
    );

    document.body.classList.remove(
        "customer-home-nav-protected"
    );


    container.innerHTML =
        createDesktopHeader() +
        createMobileNav();


    bindSharedHeader();
    applyCustomerBranding(
        state.branding
    );
    applyCustomerProfile(
        state.profile
    );
}


/* ==========================================================
   SEARCH
========================================================== */

function bindSharedHeader() {

    const form =
        document.getElementById(
            "customerSharedSearchForm"
        );

    const input =
        document.getElementById(
            "customerSharedSearchInput"
        );

    const clear =
        document.getElementById(
            "customerSharedSearchClear"
        );


    if (
        getCurrentFileName() ===
        "tours.html"
    ) {

        const pageSearch =
            document.getElementById(
                "tourSearch"
            );

        if (
            pageSearch &&
            input
        ) {

            input.value =
                pageSearch.value ||
                "";

            input.addEventListener(
                "input",
                () => {

                    pageSearch.value =
                        input.value;

                    pageSearch.dispatchEvent(
                        new Event(
                            "input",
                            {
                                bubbles: true
                            }
                        )
                    );

                    if (clear) {
                        clear.hidden =
                            !input.value.trim();
                    }
                }
            );
        }
    }


    input?.addEventListener(
        "input",
        () => {

            if (clear) {
                clear.hidden =
                    !input.value.trim();
            }
        }
    );


    clear?.addEventListener(
        "click",
        () => {

            if (!input) {
                return;
            }

            input.value =
                "";

            clear.hidden =
                true;


            if (
                getCurrentFileName() ===
                "tours.html"
            ) {

                const pageSearch =
                    document.getElementById(
                        "tourSearch"
                    );

                if (pageSearch) {

                    pageSearch.value =
                        "";

                    pageSearch.dispatchEvent(
                        new Event(
                            "input",
                            {
                                bubbles: true
                            }
                        )
                    );
                }
            }


            input.focus();
        }
    );


    form?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const term =
                String(
                    input?.value ||
                    ""
                ).trim();


            if (
                getCurrentFileName() ===
                "tours.html"
            ) {

                input?.focus();

                return;
            }


            if (!term) {

                window.location.href =
                    "tours.html";

                return;
            }


            window.location.href =
                `tours.html?search=${encodeURIComponent(
                    term
                )}`;
        }
    );
}


/* ==========================================================
   BRANDING
========================================================== */

function applyCustomerFavicon(
    settings = {}
) {

    const faviconURL =
        String(
            settings.businessFavicon ||
            ""
        ).trim();

    const fallback =
        "../../favicon.jpeg";

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


function applyCustomerBranding(
    settings = {}
) {

    state.branding =
        settings || {};


    applyCustomerFavicon(
        settings
    );


    const logo =
        document.getElementById(
            "sharedCustomerBusinessLogo"
        );


    if (!logo) {
        return;
    }


    const businessName =
        String(
            settings.businessName ||
            DEFAULT_CUSTOMER_BRANDING.businessName
        ).trim() ||
        DEFAULT_CUSTOMER_BRANDING.businessName;


    const businessLogo =
        String(
            settings.businessLogo ||
            ""
        ).trim();


    const defaultSrc =
        logo.dataset.defaultSrc ||
        DEFAULT_CUSTOMER_BRANDING.businessLogo;


    logo.src =
        businessLogo ||
        defaultSrc;


    logo.alt =
        `${businessName} Logo`;


    logo.onerror =
        () => {

            logo.onerror =
                null;

            logo.src =
                defaultSrc;
        };
}


function subscribeCustomerBranding() {

    state.unsubscribeBranding?.();


    state.unsubscribeBranding =
        onSnapshot(
            doc(
                db,
                "systemSettings",
                "general"
            ),

            snapshot => {

                applyCustomerBranding(
                    snapshot.exists()
                        ? snapshot.data() || {}
                        : {}
                );
            },

            error => {

                console.warn(
                    "CUSTOMER NAV BRANDING ERROR:",
                    error
                );

                applyCustomerBranding();
            }
        );
}


/* ==========================================================
   PROFILE
========================================================== */

function applyCustomerProfile(
    profile = {}
) {

    state.profile =
        profile || {};


    const avatar =
        document.getElementById(
            "customerSharedAvatar"
        );


    if (!avatar) {
        return;
    }


    const photoURL =
        String(
            profile.photoURL ||
            profile.photo ||
            profile.avatar ||
            profile.profilePhoto ||
            ""
        ).trim();


    if (!photoURL) {

        avatar.innerHTML =
            '<i class="fa-solid fa-user"></i>';

        return;
    }


    avatar.innerHTML = `
        <img
            src="${escapeHtml(photoURL)}"
            alt="Profile"
        >
    `;
}


function subscribeCustomerProfile(
    user
) {

    state.unsubscribeProfile?.();


    state.unsubscribeProfile =
        onSnapshot(
            doc(
                db,
                "users",
                user.uid
            ),

            snapshot => {

                applyCustomerProfile(
                    snapshot.exists()
                        ? snapshot.data() || {}
                        : {}
                );
            },

            error => {

                console.warn(
                    "CUSTOMER NAV PROFILE ERROR:",
                    error
                );

                applyCustomerProfile();
            }
        );
}


/* ==========================================================
   NOTIFICATIONS + MESSAGE BADGES
========================================================== */

function subscribeHeaderBadges(
    user
) {

    state.unsubscribeNotifications?.();
    state.unsubscribeConversation?.();


    const notificationsQuery =
        query(
            collection(
                db,
                "notifications"
            ),
            where(
                "customerUid",
                "==",
                user.uid
            )
        );


    state.unsubscribeNotifications =
        onSnapshot(
            notificationsQuery,

            snapshot => {

                const unread =
                    snapshot.docs.filter(
                        item =>
                            item.data()?.isRead !==
                            true
                    ).length;


                setBadge(
                    document.getElementById(
                        "customerSharedNotificationBadge"
                    ),
                    unread
                );
            },

            error => {

                console.warn(
                    "CUSTOMER NAV NOTIFICATION BADGE ERROR:",
                    error
                );
            }
        );


    state.unsubscribeConversation =
        onSnapshot(
            doc(
                db,
                "conversations",
                user.uid
            ),

            snapshot => {

                const unread =
                    snapshot.exists()
                        ? Number(
                            snapshot.data()?.unreadCustomer ||
                            0
                        )
                        : 0;


                setBadge(
                    document.getElementById(
                        "customerSharedMessageBadge"
                    ),
                    unread
                );
            },

            error => {

                console.warn(
                    "CUSTOMER NAV MESSAGE BADGE ERROR:",
                    error
                );
            }
        );
}


/* ==========================================================
   AUTH
========================================================== */

function initCustomerAuthState() {

    if (!auth) {
        return;
    }


    onAuthStateChanged(
        auth,
        user => {

            state.user =
                user || null;


            state.unsubscribeProfile?.();
            state.unsubscribeNotifications?.();
            state.unsubscribeConversation?.();


            state.unsubscribeProfile =
                null;

            state.unsubscribeNotifications =
                null;

            state.unsubscribeConversation =
                null;


            if (
                !user ||
                isHomeModule()
            ) {
                return;
            }


            subscribeCustomerProfile(
                user
            );


            subscribeHeaderBadges(
                user
            );
        }
    );
}


/* ==========================================================
   INIT
========================================================== */

function initCustomerNav() {

    renderCustomerNav();

    subscribeCustomerBranding();

    initCustomerAuthState();
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initCustomerNav,
        {
            once: true
        }
    );

} else {

    initCustomerNav();
}


/* Re-render active state when hash changes. */

window.addEventListener(
    "hashchange",
    () => {

        renderCustomerNav();
    }
);


/* ==========================================================
   CLEANUP
========================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        state.unsubscribeBranding?.();
        state.unsubscribeProfile?.();
        state.unsubscribeNotifications?.();
        state.unsubscribeConversation?.();


        state.unsubscribeBranding =
            null;

        state.unsubscribeProfile =
            null;

        state.unsubscribeNotifications =
            null;

        state.unsubscribeConversation =
            null;
    }
);
