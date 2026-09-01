/* ==========================================================
   TRIPS WONDER — CUSTOMER SHARED NAVIGATION
   FINAL RESPONSIVE + CENTRALIZED BRANDING VERSION
========================================================== */

import {
    db
} from "../firebase/firebase-config.js";

import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


const CUSTOMER_NAV_ITEMS = [
    {
        id: "home",
        label: "Home",
        href: "home.html",
        icon: "fa-solid fa-house"
    },
    {
        id: "my-trip",
        label: "My Trip",
        href: "my-trip.html",
        icon: "fa-solid fa-suitcase"
    },
    {
        id: "message",
        label: "Message",
        href: "message.html",
        icon: "fa-regular fa-comment"
    },
    {
        id: "promo",
        label: "Promo",
        href: "promo.html",
        icon: "fa-solid fa-tags"
    },
    {
        id: "account",
        label: "Account",
        href: "account.html",
        icon: "fa-regular fa-user"
    }
];


const DEFAULT_CUSTOMER_BRANDING = {
    businessName: "Trips Wonder",
    businessLogo: "../../assets/images/logo.png",
    businessTagline: "Travel & Tours"
};


let unsubscribeCustomerBranding =
    null;


function getCurrentCustomerModule() {

    const fileName =
        (
            window.location.pathname
                .split("/")
                .pop() ||
            "home.html"
        )
        .toLowerCase();

    const current =
        CUSTOMER_NAV_ITEMS.find(
            item =>
                item.href.toLowerCase() ===
                fileName
        );

    return current
        ? current.id
        : "";
}


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


    const currentModule =
        getCurrentCustomerModule();


    container.innerHTML = `

        <nav
            class="bottom-nav"
            aria-label="Customer navigation"
        >

            <a
                href="home.html"
                class="customer-nav-brand"
                aria-label="Trips Wonder Home"
            >

                <img
                    id="sharedCustomerBusinessLogo"
                    src="${DEFAULT_CUSTOMER_BRANDING.businessLogo}"
                    alt="${DEFAULT_CUSTOMER_BRANDING.businessName}"
                    class="customer-nav-logo"
                    data-default-src="${DEFAULT_CUSTOMER_BRANDING.businessLogo}"
                >

                <span class="customer-nav-brand-copy">

                    <strong
                        id="sharedCustomerBusinessName"
                    >
                        ${DEFAULT_CUSTOMER_BRANDING.businessName}
                    </strong>

                    <span
                        id="sharedCustomerBusinessTagline"
                    >
                        ${DEFAULT_CUSTOMER_BRANDING.businessTagline}
                    </span>

                </span>

            </a>


            <div class="customer-nav-menu">

                ${CUSTOMER_NAV_ITEMS
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
                    .join("")}

            </div>

        </nav>

    `;
}



function applyCustomerFavicon(
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


function applyCustomerBranding(
    settings = {}
) {

    applyCustomerFavicon(
        settings
    );

    const logo =
        document.getElementById(
            "sharedCustomerBusinessLogo"
        );

    const businessNameElement =
        document.getElementById(
            "sharedCustomerBusinessName"
        );

    const brandLink =
        document.querySelector(
            ".customer-nav-brand"
        );

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

    if (businessNameElement) {
        businessNameElement.textContent =
            businessName;
    }

    if (brandLink) {
        brandLink.setAttribute(
            "aria-label",
            `${businessName} Home`
        );
    }

    if (!logo) {
        return;
    }

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

    if (!db) {

        console.warn(
            "CUSTOMER NAV: Firestore DB is unavailable."
        );

        applyCustomerBranding();

        return;
    }


    if (unsubscribeCustomerBranding) {

        unsubscribeCustomerBranding();

        unsubscribeCustomerBranding =
            null;
    }


    const settingsReference =
        doc(
            db,
            "systemSettings",
            "general"
        );


    unsubscribeCustomerBranding =
        onSnapshot(
            settingsReference,

            snapshot => {

                if (!snapshot.exists()) {

                    applyCustomerBranding();

                    return;
                }


                applyCustomerBranding(
                    snapshot.data() || {}
                );
            },

            error => {

                console.error(
                    "CUSTOMER NAV BRANDING ERROR:",
                    error
                );

                applyCustomerBranding();
            }
        );
}


function initCustomerNav() {

    renderCustomerNav();

    subscribeCustomerBranding();
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


window.addEventListener(
    "beforeunload",
    () => {

        if (unsubscribeCustomerBranding) {

            unsubscribeCustomerBranding();

            unsubscribeCustomerBranding =
                null;
        }
    }
);
