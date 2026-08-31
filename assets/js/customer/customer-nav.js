/* ==========================================================
   TRIPS WONDER — CUSTOMER SHARED NAVIGATION
   FINAL RESPONSIVE VERSION
========================================================== */

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
                    src="../../assets/images/logo.png"
                    alt="Trips Wonder"
                    class="customer-nav-logo"
                >

                <span class="customer-nav-brand-copy">

                    <strong>
                        Trips Wonder
                    </strong>

                    <span>
                        Travel & Tours
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


function initCustomerNav() {

    renderCustomerNav();

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initCustomerNav
    );

} else {

    initCustomerNav();

}
