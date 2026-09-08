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
    loginWithFacebook
} from "../firebase/firebase-auth.js";

import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
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
    authReady: false,
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


async function subscribeCustomerBranding() {

    if (!db) {

        console.warn(
            "CUSTOMER NAV: Firestore DB is unavailable."
        );

        applyCustomerBranding();

        return;
    }


    if (state?.unsubscribeBranding) {

        state.unsubscribeBranding();

        state.unsubscribeBranding =
            null;
    }


    try {

        const settingsReference =
            doc(
                db,
                "systemSettings",
                "general"
            );


        const snapshot =
            await getDoc(
                settingsReference
            );


        if (!snapshot.exists()) {

            applyCustomerBranding();

            return;
        }


        applyCustomerBranding(
            snapshot.data() || {}
        );


    } catch (error) {

        console.warn(
            "CUSTOMER NAV BRANDING LOAD ERROR:",
            error
        );


        /*
         * Branding failure must never break
         * customer navigation.
         */
        applyCustomerBranding();

    }

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
   GUEST MEMBER ACCESS GATE
   ==========================================================

   Public pages remain accessible to everyone.

   When a guest clicks:
   - My Trip
   - Messages
   - Notifications
   - Profile / Account

   stay on the current page and show the Sign In / Register
   modal instead of navigating to a protected module.
========================================================== */

const GUEST_PROTECTED_FILES = new Set([
    "my-trip.html",
    "message.html",
    "account.html",
    "account-security.html",
    "profile.html",
    "payments.html"
]);


function isSignedInCustomer() {

    return Boolean(
        state.user ||
        auth?.currentUser
    );
}


function getProtectedDestination(anchor) {

    if (!anchor) {
        return "";
    }

    const rawHref =
        String(
            anchor.getAttribute("href") ||
            ""
        ).trim();


    if (!rawHref) {
        return "";
    }


    try {

        const url =
            new URL(
                rawHref,
                window.location.href
            );

        const fileName =
            url.pathname
                .split("/")
                .pop()
                ?.toLowerCase() ||
            "";

        return GUEST_PROTECTED_FILES.has(fileName)
            ? fileName
            : "";

    } catch (error) {

        return "";

    }
}


function ensureSharedGuestAuthModal() {

    let modal =
        document.getElementById(
            "sharedGuestAuthModal"
        );


    if (modal) {
        return modal;
    }


    const style =
        document.createElement(
            "style"
        );

    style.id =
        "sharedGuestAuthModalStyle";

    style.textContent = `
        body.shared-guest-auth-open {
            overflow: hidden !important;
        }

        .shared-guest-auth-modal {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(15, 23, 42, .68);
            backdrop-filter: blur(4px);
        }

        .shared-guest-auth-modal[hidden] {
            display: none !important;
        }

        .shared-guest-auth-card {
            position: relative;
            width: min(920px, 96vw);
            max-height: min(720px, 92vh);
            display: grid;
            grid-template-columns: minmax(0, 1.08fr) minmax(300px, .92fr);
            overflow: auto;
            background: #ffffff;
            border-radius: 18px;
            box-shadow: 0 28px 80px rgba(15, 23, 42, .30);
        }

        .shared-guest-auth-left,
        .shared-guest-auth-right {
            padding: 52px 56px;
        }

        .shared-guest-auth-left {
            background: #ffffff;
        }

        .shared-guest-auth-right {
            display: flex;
            flex-direction: column;
            justify-content: center;
            background: #f5f8fc;
        }

        .shared-guest-auth-brand {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 28px;
            color: #0758c7;
            font-size: 18px;
            font-weight: 800;
        }

        .shared-guest-auth-brand img {
            width: 38px;
            height: 38px;
            object-fit: contain;
            border-radius: 50%;
        }

        .shared-guest-auth-close {
            position: absolute;
            top: 20px;
            right: 22px;
            z-index: 2;
            width: 38px;
            height: 38px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            color: #172036;
            background: transparent;
            border: 0;
            border-radius: 50%;
            font-size: 22px;
        }

        .shared-guest-auth-close:hover {
            background: rgba(15, 23, 42, .06);
        }

        .shared-guest-auth-title {
            margin: 0;
            color: #10192f;
            font-size: 31px;
            font-weight: 800;
            line-height: 1.2;
        }

        .shared-guest-auth-benefits {
            display: flex;
            flex-wrap: wrap;
            gap: 12px 22px;
            margin: 18px 0 30px;
            color: #455168;
            font-size: 13px;
        }

        .shared-guest-auth-benefits span {
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .shared-guest-auth-benefits i {
            color: #0874ff;
        }

        .shared-guest-auth-label {
            display: block;
            margin-bottom: 8px;
            color: #334155;
            font-size: 12px;
            font-weight: 700;
        }

        .shared-guest-auth-email {
            width: 100%;
            height: 56px;
            padding: 0 16px;
            color: #172036;
            background: #ffffff;
            border: 1px solid #cfd8e6;
            border-radius: 9px;
            outline: none;
            font: inherit;
        }

        .shared-guest-auth-email:focus {
            border-color: #1671df;
            box-shadow: 0 0 0 3px rgba(22, 113, 223, .10);
        }

        .shared-guest-password-label {
    margin-top: 14px;
}

.shared-guest-password-wrap {
    position: relative;
}

.shared-guest-password-wrap .shared-guest-auth-email {
    padding-right: 46px;
}

.shared-guest-password-toggle {
    position: absolute;
    top: 50%;
    right: 8px;

    width: 34px;
    height: 34px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0;

    transform: translateY(-50%);

    color: #64748b;
    background: transparent;

    border: 0;
    border-radius: 8px;

    font-size: 14px;

    cursor: pointer;
}

.shared-guest-password-toggle:hover {
    background: #f1f5f9;
}

.shared-guest-auth-helper {
    display: flex;
    justify-content: flex-end;

    margin-top: 7px;
}

.shared-guest-forgot-password {
    color: #176de4;

    text-decoration: none;

    font-size: 11px;
    font-weight: 600;
}

.shared-guest-forgot-password:hover {
    text-decoration: underline;
}

.shared-guest-auth-error {
    margin: 9px 0 0;

    color: #dc2626;

    font-size: 11px;
    line-height: 1.45;
}

.shared-guest-auth-primary:disabled {
    opacity: 0.65;
    cursor: not-allowed;
}

        .shared-guest-auth-primary,
        .shared-guest-auth-social {
            width: 100%;
            height: 54px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 12px;
            padding: 0 18px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 15px;
            font-weight: 700;
        }

        .shared-guest-auth-primary {
            color: #ffffff;
            background: #176de4;
            border: 1px solid #176de4;
        }

        .shared-guest-auth-social {
            color: #182137;
            background: #ffffff;
            border: 1px solid #d6deea;
        }

        .shared-guest-auth-social.google {
            color: #ffffff;
            background: #4285f4;
            border-color: #4285f4;
        }

        .shared-guest-auth-separator {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            gap: 12px;
            margin: 22px 0 8px;
            color: #7a869b;
            font-size: 12px;
        }

        .shared-guest-auth-separator::before,
        .shared-guest-auth-separator::after {
            content: "";
            height: 1px;
            background: #e2e8f0;
        }

        .shared-guest-auth-note {
            margin: 20px 0 0;
            color: #718096;
            font-size: 11px;
            line-height: 1.55;
        }

        .shared-guest-auth-illustration {
            width: 112px;
            height: 112px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 30px;
            color: #0874ff;
            background: #e8f1ff;
            border-radius: 28px;
            font-size: 48px;
        }

        .shared-guest-auth-right h3 {
            margin: 0;
            color: #10192f;
            text-align: center;
            font-size: 24px;
            font-weight: 800;
        }

        .shared-guest-auth-right > p {
            max-width: 350px;
            margin: 12px auto 26px;
            color: #6b778d;
            text-align: center;
            font-size: 13px;
            line-height: 1.6;
        }

        .shared-guest-auth-list {
            display: grid;
            gap: 14px;
            max-width: 330px;
            margin: 0 auto;
            color: #536078;
            font-size: 13px;
        }

        .shared-guest-auth-list span {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .shared-guest-auth-list i {
            color: #16a34a;
        }

      @media (max-width: 760px) {

    .shared-guest-auth-modal {
        padding:
            18px
            14px
            calc(86px + env(safe-area-inset-bottom));

        align-items: center;
        justify-content: center;
    }

    .shared-guest-auth-card {
        width: min(100%, 360px);

        min-height: 0;
        max-height: calc(
            100dvh - 130px - env(safe-area-inset-bottom)
        );

        display: block;

        overflow-x: hidden;
        overflow-y: auto;

        background: #ffffff;

        border: 1px solid rgba(226, 232, 240, 0.95);
        border-radius: 22px;

        box-shadow:
            0 22px 60px rgba(15, 23, 42, 0.28);
    }

    .shared-guest-auth-close {
        top: 10px;
        right: 10px;

        width: 30px;
        height: 30px;

        color: #475569;
        background: #f3f6fa;

        font-size: 14px;
    }

    .shared-guest-auth-left {
        padding:
            22px
            16px
            17px;
    }

    .shared-guest-auth-right {
        display: none;
    }

    .shared-guest-auth-brand {
        gap: 7px;

        margin-bottom: 12px;

        font-size: 10px;
    }

    .shared-guest-auth-brand img {
        width: 26px;
        height: 26px;
    }

    .shared-guest-auth-title {
        margin: 0;

        font-size: 18px;
        line-height: 1.25;
    }

    .shared-guest-auth-benefits {
        gap: 6px 11px;

        margin:
            9px
            0
            15px;

        font-size: 7.5px;
    }

    .shared-guest-auth-benefits span {
        gap: 4px;
    }

    .shared-guest-auth-label {
        margin-bottom: 5px;

        font-size: 8.5px;
    }

    .shared-guest-auth-email {
        height: 42px;

        padding: 0 12px;

        border-radius: 9px;

        font-size: 10px;
    }

    .shared-guest-auth-primary,
    .shared-guest-auth-social {
        height: 40px;

        gap: 7px;

        margin-top: 8px;

        padding: 0 12px;

        border-radius: 9px;

        font-size: 9.5px;
    }

    .shared-guest-auth-primary {
        box-shadow:
            0 4px 10px rgba(23, 109, 228, 0.14);
    }

    .shared-guest-auth-separator {
        gap: 9px;

        margin:
            11px
            0
            1px;

        font-size: 7.5px;
    }

    .shared-guest-auth-note {
        margin:
            11px
            3px
            0;

        font-size: 7px;
        line-height: 1.5;
    }

}
    `;


    document.head.appendChild(
        style
    );


    modal =
        document.createElement(
            "div"
        );

    modal.id =
        "sharedGuestAuthModal";

    modal.className =
        "shared-guest-auth-modal";

    modal.hidden =
        true;

    modal.innerHTML = `
        <section
            class="shared-guest-auth-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sharedGuestAuthTitle"
        >
            <button
                type="button"
                class="shared-guest-auth-close"
                data-shared-guest-auth-close
                aria-label="Close"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>

            <div class="shared-guest-auth-left">
                <div class="shared-guest-auth-brand">
                    <img
                        src="../../assets/images/logo.png"
                        alt="Trips Wonder"
                    >
                    <span>Trips Wonder</span>
                </div>

                <h2
                    class="shared-guest-auth-title"
                    id="sharedGuestAuthTitle"
                >
                    Sign in / register
                </h2>

                <div class="shared-guest-auth-benefits">
                    <span>
                        <i class="fa-solid fa-gift"></i>
                        Member travel updates
                    </span>

                    <span>
                        <i class="fa-solid fa-calendar-check"></i>
                        Manage bookings with ease
                    </span>
                </div>

                <label
    class="shared-guest-auth-label"
    for="sharedGuestAuthEmail"
>
    Email address
</label>

<input
    class="shared-guest-auth-email"
    id="sharedGuestAuthEmail"
    type="email"
    placeholder="Enter your email address"
    autocomplete="email"
>

<label
    class="shared-guest-auth-label shared-guest-password-label"
    for="sharedGuestAuthPassword"
>
    Password
</label>

<div class="shared-guest-password-wrap">

    <input
        class="shared-guest-auth-email"
        id="sharedGuestAuthPassword"
        type="password"
        placeholder="Enter your password"
        autocomplete="current-password"
    >

    <button
        type="button"
        class="shared-guest-password-toggle"
        id="sharedGuestPasswordToggle"
        aria-label="Show password"
    >
        <i class="fa-regular fa-eye"></i>
    </button>

</div>

<div class="shared-guest-auth-helper">

    <a
        href="../../login.html?forgot=1"
        class="shared-guest-forgot-password"
    >
        Forgot password?
    </a>

</div>

<button
    type="button"
    class="shared-guest-auth-primary"
    id="sharedGuestAuthSignIn"
>
    Sign In
</button>

<p
    class="shared-guest-auth-error"
    id="sharedGuestAuthError"
    hidden
></p>

                <div class="shared-guest-auth-separator">
                    <span>or</span>
                </div>

                <button
                    type="button"
                    class="shared-guest-auth-social google"
                    id="sharedGuestGoogleSignIn"
                >
                    <i class="fa-brands fa-google"></i>
                    <span>Continue with Google</span>
                </button>

                <button
                    type="button"
                    class="shared-guest-auth-social"
                    id="sharedGuestFacebookSignIn"
                >
                    <i class="fa-brands fa-facebook"></i>
                    <span>Continue with Facebook</span>
                </button>

                <p class="shared-guest-auth-note">
                    You can continue browsing and booking as a guest.
                    Sign in only when you want to access member features
                    or manage your account.
                </p>
            </div>

            <div class="shared-guest-auth-right">
                <div class="shared-guest-auth-illustration">
                    <i class="fa-solid fa-suitcase-rolling"></i>
                </div>

                <h3>Your trips, all in one place</h3>

                <p>
                    Sign in to view your bookings, messages,
                    notifications and travel activity.
                </p>

                <div class="shared-guest-auth-list">
                    <span>
                        <i class="fa-solid fa-check"></i>
                        Manage My Trip
                    </span>

                    <span>
                        <i class="fa-solid fa-check"></i>
                        Send and receive messages
                    </span>

                    <span>
                        <i class="fa-solid fa-check"></i>
                        Access account and notifications
                    </span>
                </div>
            </div>
        </section>
    `;


    document.body.appendChild(
        modal
    );


    modal
        .querySelectorAll(
            "[data-shared-guest-auth-close]"
        )
        .forEach(
            button => {
                button.addEventListener(
                    "click",
                    closeSharedGuestAuthModal
                );
            }
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                modal
            ) {

                closeSharedGuestAuthModal();

            }

        }
    );


    const emailInput =
    modal.querySelector(
        "#sharedGuestAuthEmail"
    );

const passwordInput =
    modal.querySelector(
        "#sharedGuestAuthPassword"
    );

const signInButton =
    modal.querySelector(
        "#sharedGuestAuthSignIn"
    );

const passwordToggle =
    modal.querySelector(
        "#sharedGuestPasswordToggle"
    );

const authError =
    modal.querySelector(
        "#sharedGuestAuthError"
    );

const googleSignInButton =
    modal.querySelector(
        "#sharedGuestGoogleSignIn"
    );

const facebookSignInButton =
    modal.querySelector(
        "#sharedGuestFacebookSignIn"
    );


function showSharedGuestAuthError(
    message = ""
) {

    if (!authError) {
        return;
    }

    authError.textContent =
        String(message || "");

    authError.hidden =
        !message;
}


passwordToggle?.addEventListener(
    "click",
    () => {

        if (!passwordInput) {
            return;
        }

        const isVisible =
            passwordInput.type === "text";

        passwordInput.type =
            isVisible
                ? "password"
                : "text";

        passwordToggle.innerHTML =
            isVisible
                ? '<i class="fa-regular fa-eye"></i>'
                : '<i class="fa-regular fa-eye-slash"></i>';

        passwordToggle.setAttribute(
            "aria-label",
            isVisible
                ? "Show password"
                : "Hide password"
        );
    }
);


async function ensureCustomerProfileForSocial(
    user,
    authProvider = "social"
) {

    const profileReference =
        doc(
            db,
            "users",
            user.uid
        );

    const profileSnapshot =
        await getDoc(
            profileReference
        );

    if (profileSnapshot.exists()) {
        return profileSnapshot.data() || {};
    }

    const displayName =
        String(
            user.displayName ||
            user.email?.split("@")[0] ||
            "Trips Wonder Member"
        ).trim();

    const nameParts =
        displayName
            .split(/\s+/)
            .filter(Boolean);

    const firstName =
        nameParts.shift() ||
        displayName;

    const lastName =
        nameParts.join(" ");

    const profile = {
        uid: user.uid,
        email: user.email || "",
        firstName,
        lastName,
        displayName,
        photoURL: user.photoURL || "",
        role: "client",
        status: "active",
        emailVerified:
            user.emailVerified === true,
        authProvider: String(authProvider || "social"),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };

    await setDoc(
        profileReference,
        profile,
        {
            merge: true
        }
    );

    return profile;
}


async function routeSignedInUser(
    user,
    {
        createCustomerIfMissing = false,
        authProvider = "email"
    } = {}
) {

    const profileReference =
        doc(
            db,
            "users",
            user.uid
        );

    let profileSnapshot =
        await getDoc(
            profileReference
        );

    let profile;

    if (!profileSnapshot.exists()) {

        if (!createCustomerIfMissing) {
            throw new Error(
                "ACCOUNT_PROFILE_NOT_FOUND"
            );
        }

        profile =
            await ensureCustomerProfileForSocial(
                user,
                authProvider
            );

    } else {

        profile =
            profileSnapshot.data() || {};
    }

    const role =
        String(
            profile.role ||
            "client"
        )
        .trim()
        .toLowerCase();

    const status =
        String(
            profile.status ||
            "active"
        )
        .trim()
        .toLowerCase();

    if (status !== "active") {

        await signOut(auth);

        throw new Error(
            "ACCOUNT_INACTIVE"
        );
    }

    if (
        role === "owner" ||
        role === "admin"
    ) {

        window.location.href =
            "/pages/admin/dashboard.html";

        return;
    }

    if (
        role === "client" ||
        role === "customer"
    ) {

        closeSharedGuestAuthModal();

        return;
    }

    await signOut(auth);

    throw new Error(
        "INVALID_ACCOUNT_ROLE"
    );
}


async function performSharedGuestSignIn() {

    const email =
        String(
            emailInput?.value ||
            ""
        ).trim();

    const password =
        String(
            passwordInput?.value ||
            ""
        );

    showSharedGuestAuthError("");

    if (!email) {

        showSharedGuestAuthError(
            "Please enter your email address."
        );

        emailInput?.focus();

        return;
    }

    if (!password) {

        showSharedGuestAuthError(
            "Please enter your password."
        );

        passwordInput?.focus();

        return;
    }

    if (!auth || !signInButton) {
        return;
    }

    const originalButtonHTML =
        signInButton.innerHTML;

    signInButton.disabled =
        true;

    signInButton.innerHTML =
        `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Signing in...</span>
        `;

    try {

        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        await routeSignedInUser(
            userCredential.user
        );

    } catch (error) {

        console.error(
            "CUSTOMER SIGN IN ERROR:",
            error
        );

        let message =
            "Unable to sign in. Please check your email and password.";

        if (
            error?.code ===
            "auth/invalid-credential"
        ) {
            message =
                "Incorrect email or password.";
        }

        if (
            error?.code ===
            "auth/too-many-requests"
        ) {
            message =
                "Too many attempts. Please try again later.";
        }

        if (
            error?.code ===
            "auth/network-request-failed"
        ) {
            message =
                "Network error. Please check your connection and try again.";
        }

        if (
            error?.message ===
            "ACCOUNT_PROFILE_NOT_FOUND"
        ) {
            message =
                "Your account profile was not found. Please contact Trips Wonder support.";
        }

        if (
            error?.message ===
            "ACCOUNT_INACTIVE"
        ) {
            message =
                "This account is currently inactive. Please contact Trips Wonder support.";
        }

        if (
            error?.message ===
            "INVALID_ACCOUNT_ROLE"
        ) {
            message =
                "This account role is not configured correctly.";
        }

        showSharedGuestAuthError(
            message
        );

    } finally {

        signInButton.disabled =
            false;

        signInButton.innerHTML =
            originalButtonHTML;
    }
}


async function performSharedGuestGoogleSignIn() {

    if (
        !auth ||
        !googleSignInButton
    ) {
        return;
    }

    showSharedGuestAuthError("");

    const originalButtonHTML =
        googleSignInButton.innerHTML;

    googleSignInButton.disabled =
        true;

    googleSignInButton.innerHTML =
        `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Connecting to Google...</span>
        `;

    try {

        const provider =
            new GoogleAuthProvider();

        provider.setCustomParameters({
            prompt: "select_account"
        });

        const userCredential =
            await signInWithPopup(
                auth,
                provider
            );

        await routeSignedInUser(
            userCredential.user,
            {
                createCustomerIfMissing: true,
                authProvider: "google"
            }
        );

    } catch (error) {

        if (
            error?.code ===
            "auth/popup-closed-by-user" ||
            error?.code ===
            "auth/cancelled-popup-request"
        ) {
            return;
        }

        console.error(
            "CUSTOMER GOOGLE SIGN IN ERROR:",
            error
        );

        let message =
            "Unable to sign in with Google. Please try again.";

        if (
            error?.code ===
            "auth/popup-blocked"
        ) {
            message =
                "Google sign-in popup was blocked. Please allow popups and try again.";
        }

        if (
            error?.code ===
            "auth/unauthorized-domain"
        ) {
            message =
                "This website domain is not authorized for Google sign-in yet.";
        }

        if (
            error?.code ===
            "auth/account-exists-with-different-credential"
        ) {
            message =
                "An account already exists with this email. Please sign in using your email and password first.";
        }

        if (
            error?.code ===
            "auth/network-request-failed"
        ) {
            message =
                "Network error. Please check your connection and try again.";
        }

        if (
            error?.message ===
            "ACCOUNT_INACTIVE"
        ) {
            message =
                "This account is currently inactive. Please contact Trips Wonder support.";
        }

        if (
            error?.message ===
            "INVALID_ACCOUNT_ROLE"
        ) {
            message =
                "This account role is not configured correctly.";
        }

        showSharedGuestAuthError(
            message
        );

    } finally {

        googleSignInButton.disabled =
            false;

        googleSignInButton.innerHTML =
            originalButtonHTML;
    }
}


async function performSharedGuestFacebookSignIn() {

    if (
        !auth ||
        !facebookSignInButton
    ) {
        return;
    }

    showSharedGuestAuthError("");

    const originalButtonHTML =
        facebookSignInButton.innerHTML;

    facebookSignInButton.disabled =
        true;

    facebookSignInButton.innerHTML =
        `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Connecting to Facebook...</span>
        `;

    try {

        const userCredential =
            await loginWithFacebook();

        await routeSignedInUser(
            userCredential.user,
            {
                createCustomerIfMissing: true,
                authProvider: "facebook"
            }
        );

    } catch (error) {

        if (
            error?.code ===
            "auth/popup-closed-by-user" ||
            error?.code ===
            "auth/cancelled-popup-request"
        ) {
            return;
        }

        console.error(
            "CUSTOMER FACEBOOK SIGN IN ERROR:",
            error
        );

        let message =
            "Unable to sign in with Facebook. Please try again.";

        if (
            error?.code ===
            "auth/popup-blocked"
        ) {
            message =
                "Facebook sign-in popup was blocked. Please allow popups and try again.";
        }

        if (
            error?.code ===
            "auth/unauthorized-domain"
        ) {
            message =
                "This website domain is not authorized for Facebook sign-in yet.";
        }

        if (
            error?.code ===
            "auth/operation-not-allowed"
        ) {
            message =
                "Facebook sign-in is not enabled yet.";
        }

        if (
            error?.code ===
            "auth/account-exists-with-different-credential"
        ) {
            message =
                "An account already exists with this email using another sign-in method.";
        }

        if (
            error?.code ===
            "auth/network-request-failed"
        ) {
            message =
                "Network error. Please check your connection and try again.";
        }

        if (
            error?.message ===
            "ACCOUNT_INACTIVE"
        ) {
            message =
                "This account is currently inactive. Please contact Trips Wonder support.";
        }

        if (
            error?.message ===
            "INVALID_ACCOUNT_ROLE"
        ) {
            message =
                "This account role is not configured correctly.";
        }

        showSharedGuestAuthError(
            message
        );

    } finally {

        facebookSignInButton.disabled =
            false;

        facebookSignInButton.innerHTML =
            originalButtonHTML;
    }
}


googleSignInButton?.addEventListener(
    "click",
    performSharedGuestGoogleSignIn
);

facebookSignInButton?.addEventListener(
    "click",
    performSharedGuestFacebookSignIn
);


signInButton?.addEventListener(
    "click",
    performSharedGuestSignIn
);


passwordInput?.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            event.preventDefault();

            performSharedGuestSignIn();
        }
    }
);


emailInput?.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            event.preventDefault();

            passwordInput?.focus();
        }
    }
);


    return modal;
}


function openSharedGuestAuthModal() {

    if (isSignedInCustomer()) {
        return;
    }


    const modal =
        ensureSharedGuestAuthModal();


    modal.hidden =
        false;

    document.body.classList.add(
        "shared-guest-auth-open"
    );


    requestAnimationFrame(
        () => {
            modal
                .querySelector(
                    "#sharedGuestAuthEmail"
                )
                ?.focus();
        }
    );
}

/* ==========================================================
   PUBLIC GUEST AUTH API
========================================================== */

window.openGuestAuthModal = function () {
    openSharedGuestAuthModal();
};


function closeSharedGuestAuthModal() {

    const modal =
        document.getElementById(
            "sharedGuestAuthModal"
        );


    if (modal) {
        modal.hidden = true;
    }


    document.body.classList.remove(
        "shared-guest-auth-open"
    );
}


function handleGuestProtectedNavigation(
    event
) {

    if (isSignedInCustomer()) {
        return;
    }


    const anchor =
        event.target.closest(
            "a[href]"
        );


    if (!anchor) {
        return;
    }


    const destination =
        getProtectedDestination(
            anchor
        );


    if (!destination) {
        return;
    }


    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();


    openSharedGuestAuthModal();
}


function bindGuestProtectedNavigation() {

    /*
     * Capture phase is intentional.
     * This runs before normal link navigation or page-level handlers.
     */
    document.addEventListener(
        "click",
        handleGuestProtectedNavigation,
        true
    );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !document
                    .getElementById(
                        "sharedGuestAuthModal"
                    )
                    ?.hidden
            ) {

                closeSharedGuestAuthModal();

            }

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

            state.authReady =
                true;


            state.unsubscribeProfile?.();
            state.unsubscribeNotifications?.();
            state.unsubscribeConversation?.();


            state.unsubscribeProfile =
                null;

            state.unsubscribeNotifications =
                null;

            state.unsubscribeConversation =
                null;


            if (!user) {

                /*
                 * Guest visitor:
                 * Keep default branding and do not read
                 * protected Firestore customer data.
                 */
                state.unsubscribeBranding?.();
                state.unsubscribeBranding = null;

                applyCustomerBranding();
                applyCustomerProfile();

                return;
            }


            /*
             * Signed-in customer:
             * Centralized branding is allowed after authentication.
             */
            subscribeCustomerBranding();


            if (
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

    /*
     * Bind the guest gate before any protected navigation can happen.
     * This is document-level and works on Tours, Explore, Promos,
     * Home mobile nav, and future shared customer pages.
     */
    bindGuestProtectedNavigation();

    renderCustomerNav();

    /*
     * Guest-safe startup:
     * Use default/local branding first.
     * Firestore branding will only start after authentication.
     */
    applyCustomerBranding();

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
