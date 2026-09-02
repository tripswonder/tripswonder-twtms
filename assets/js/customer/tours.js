"use strict";

/* ==========================================================
   TRIPS WONDER — TOURS
   Marketplace-style customer tours page

   - Loads ACTIVE packages from Firestore
   - Search
   - Dynamic categories
   - Duration / price / location filters
   - Sorting
   - Load more
   - Package details modal
   - Book Now -> booking.html?package=<id>
   - Centralized business logo + favicon
========================================================== */

import {
    db
} from "../firebase/firebase-config.js";

import {
    collection,
    doc,
    getDocs,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* ==========================================================
   STATE
========================================================== */

const state = {
    packages: [],
    selectedPackage: null,

    search: "",
    category: "all",
    duration: "all",
    maxPrice: 10000,
    location: "all",
    sort: "recommended",

    pageSizeDesktop: 12,
    pageSizeMobile: 8,
    visibleCount: 12,

    unsubscribeBranding: null
};


/* ==========================================================
   ELEMENTS
========================================================== */

const tourGrid =
    document.getElementById("tourGrid");

const tourSearch =
    document.getElementById("tourSearch");

const tourSearchClear =
    document.getElementById("tourSearchClear");

const tourMobileSearch =
    document.getElementById("tourMobileSearch");

const tourMobileSearchTrigger =
    document.getElementById("tourMobileSearchTrigger");

const tourMobileSearchPanel =
    document.getElementById("tourMobileSearchPanel");

const tourMobileSearchClose =
    document.getElementById("tourMobileSearchClose");

const tourSidebarCategories =
    document.getElementById("tourSidebarCategories");

const tourCategoryStrip =
    document.getElementById("tourCategoryStrip");

const tourDurationOptions =
    document.getElementById("tourDurationOptions");

const tourMobileDurationOptions =
    document.getElementById("tourMobileDurationOptions");

const tourPriceRange =
    document.getElementById("tourPriceRange");

const tourMobilePriceRange =
    document.getElementById("tourMobilePriceRange");

const tourPriceLabel =
    document.getElementById("tourPriceLabel");

const tourMobilePriceLabel =
    document.getElementById("tourMobilePriceLabel");

const tourLocationFilter =
    document.getElementById("tourLocationFilter");

const tourMobileLocationFilter =
    document.getElementById("tourMobileLocationFilter");

const tourSort =
    document.getElementById("tourSort");

const tourSortTop =
    document.getElementById("tourSortTop");

const tourMobileSort =
    document.getElementById("tourMobileSort");

const tourResultText =
    document.getElementById("tourResultText");

const tourLoading =
    document.getElementById("tourLoading");

const tourEmpty =
    document.getElementById("tourEmpty");

const tourError =
    document.getElementById("tourError");

const retryTours =
    document.getElementById("retryTours");

const tourLoadMore =
    document.getElementById("tourLoadMore");

const clearTourFilters =
    document.getElementById("clearTourFilters");

const applyTourFilters =
    document.getElementById("applyTourFilters");

const tourMobileFilterButton =
    document.getElementById("tourMobileFilterButton");

const tourFilterDrawer =
    document.getElementById("tourFilterDrawer");

const tourMobileClearFilters =
    document.getElementById("tourMobileClearFilters");

const tourMobileApplyFilters =
    document.getElementById("tourMobileApplyFilters");


/* Modal */

const tourModal =
    document.getElementById("tourModal");

const tourModalBackdrop =
    document.getElementById("tourModalBackdrop");

const closeTourModal =
    document.getElementById("closeTourModal");

const closeTourDetails =
    document.getElementById("closeTourDetails");

const tourModalTitle =
    document.getElementById("tourModalTitle");

const tourModalContent =
    document.getElementById("tourModalContent");

const tourBookNow =
    document.getElementById("tourBookNow");


/* ==========================================================
   HELPERS
========================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function normalizeText(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();
}


function normalizeKey(value) {

    return normalizeText(value)
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}


function normalizeNumber(value) {

    const cleaned =
        String(value ?? "")
            .replace(/,/g, "")
            .replace(/[^0-9.-]/g, "");

    const number =
        Number(cleaned);

    return Number.isFinite(number)
        ? number
        : 0;
}


function formatMoney(value) {

    return normalizeNumber(value)
        .toLocaleString(
            "en-PH",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }
        );
}


function isMobile() {

    return window.matchMedia(
        "(max-width: 899px)"
    ).matches;
}


function pageSize() {

    return isMobile()
        ? state.pageSizeMobile
        : state.pageSizeDesktop;
}


function durationKey(value) {

    return normalizeText(value)
        .replace(/\s+/g, "");
}


function getDurationGroup(value) {

    const raw =
        durationKey(value);

    if (!raw) {
        return "";
    }

    if (
        raw.includes("2d1n") ||
        (
            raw.includes("2day") &&
            raw.includes("1night")
        )
    ) {
        return "2d1n";
    }

    if (
        raw.includes("3d2n") ||
        (
            raw.includes("3day") &&
            raw.includes("2night")
        )
    ) {
        return "3d2n";
    }

    const dayMatch =
        raw.match(/(\d+)\s*d/);

    if (
        dayMatch &&
        Number(dayMatch[1]) >= 4
    ) {
        return "4d3n+";
    }

    if (
        raw.includes("4day") ||
        raw.includes("5day") ||
        raw.includes("6day") ||
        raw.includes("7day")
    ) {
        return "4d3n+";
    }

    return raw;
}


function getPackageImage(packageItem) {

    if (
        Array.isArray(packageItem.gallery)
    ) {

        const image =
            packageItem.gallery.find(
                item =>
                    item &&
                    item.url
            );

        if (image?.url) {
            return image.url;
        }
    }

    return (
        packageItem.image ||
        packageItem.photo ||
        packageItem.coverPhoto ||
        ""
    );
}


function dateValue(value) {

    if (!value) {
        return 0;
    }

    if (
        typeof value.toMillis ===
        "function"
    ) {
        return value.toMillis();
    }

    if (
        typeof value.toDate ===
        "function"
    ) {
        return value.toDate().getTime();
    }

    const parsed =
        Date.parse(value);

    return Number.isFinite(parsed)
        ? parsed
        : 0;
}


/* ==========================================================
   NORMALIZE PACKAGE
========================================================== */

function normalizePackage(
    documentSnapshot
) {

    const data =
        documentSnapshot.data() || {};

    const gallery =
        Array.isArray(data.gallery)
            ? data.gallery
            : [];

    return {
        id:
            documentSnapshot.id,

        name:
            data.name ||
            data.packageName ||
            data.title ||
            "",

        category:
            data.category ||
            data.tourCategory ||
            "",

        location:
            data.location ||
            data.destination ||
            "",

        price:
            data.price ??
            data.packagePrice ??
            0,

        duration:
            data.duration ||
            "",

        description:
            data.description ||
            "",

        status:
            normalizeText(
                data.status ||
                "active"
            ),

        itinerary:
            data.itinerary ||
            "",

        inclusions:
            Array.isArray(data.inclusions)
                ? data.inclusions
                : [],

        exclusions:
            Array.isArray(data.exclusions)
                ? data.exclusions
                : [],

        accommodations:
            Array.isArray(data.accommodations)
                ? data.accommodations
                : [],

        gallery,

        image:
            gallery?.[0]?.url ||
            data.image ||
            data.photo ||
            data.coverPhoto ||
            "",

        badge:
            data.badge ||
            data.packageBadge ||
            data.label ||
            "",

        tourType:
            data.tourType ||
            data.bookingType ||
            "Joiners Tour",

        createdAt:
            data.createdAt ||
            "",

        updatedAt:
            data.updatedAt ||
            ""
    };
}


/* ==========================================================
   CATEGORY HELPERS
   Fixed Marketplace-style customer groups
========================================================== */

const TOUR_CATEGORY_GROUPS = [
    {
        value: "beach-island",
        label: "Beach & Island",
        icon: "fa-solid fa-umbrella-beach",
        keywords: ["beach", "island"]
    },
    {
        value: "city-land",
        label: "City & Land",
        icon: "fa-solid fa-city",
        keywords: ["city", "land"]
    },
    {
        value: "mountain-adventure",
        label: "Mountain & Adventure",
        icon: "fa-solid fa-mountain-sun",
        keywords: ["mountain", "adventure", "hiking", "trek", "camp"]
    },
    {
        value: "day-tours",
        label: "Day Tours",
        icon: "fa-regular fa-calendar",
        keywords: ["day tour", "daytour", "1d", "day trip"]
    },
    {
        value: "custom-private",
        label: "Custom & Private Tours",
        icon: "fa-solid fa-user-group",
        keywords: ["custom", "private", "exclusive"]
    },
    {
        value: "promos-deals",
        label: "Promos & Deals",
        icon: "fa-solid fa-tags",
        keywords: ["promo", "deal", "sale", "discount"]
    }
];


function getLocations() {

    return [
        ...new Set(
            state.packages
                .map(
                    item =>
                        String(
                            item.location ||
                            ""
                        ).trim()
                )
                .filter(Boolean)
        )
    ].sort(
        (a, b) =>
            a.localeCompare(b)
    );
}


function packageMatchesCategoryGroup(
    packageItem,
    selectedCategory
) {

    if (
        !selectedCategory ||
        selectedCategory === "all"
    ) {
        return true;
    }

    const group =
        TOUR_CATEGORY_GROUPS.find(
            item =>
                item.value ===
                selectedCategory
        );

    if (!group) {

        return normalizeKey(
            packageItem.category
        ) ===
        normalizeKey(
            selectedCategory
        );
    }

    const haystack =
        [
            packageItem.category,
            packageItem.name,
            packageItem.location,
            packageItem.description,
            packageItem.tourType
        ]
            .join(" ")
            .toLowerCase();

    return group.keywords.some(
        keyword =>
            haystack.includes(
                keyword
            )
    );
}


function categoryIcon(category) {

    const group =
        TOUR_CATEGORY_GROUPS.find(
            item =>
                item.value ===
                category
        );

    return group
        ? group.icon
        : "fa-solid fa-location-dot";
}


/* ==========================================================
   PAGE STATES
========================================================== */

function showLoadingState() {

    tourLoading?.classList.remove(
        "hidden"
    );

    tourEmpty?.classList.add(
        "hidden"
    );

    tourError?.classList.add(
        "hidden"
    );

    if (tourGrid) {
        tourGrid.innerHTML = "";
    }

    if (tourResultText) {
        tourResultText.textContent =
            "Loading packages...";
    }

    if (tourLoadMore) {
        tourLoadMore.hidden = true;
    }
}


function hideLoadingState() {

    tourLoading?.classList.add(
        "hidden"
    );
}


function showErrorState() {

    tourLoading?.classList.add(
        "hidden"
    );

    tourEmpty?.classList.add(
        "hidden"
    );

    tourError?.classList.remove(
        "hidden"
    );

    if (tourResultText) {
        tourResultText.textContent =
            "Unable to load packages.";
    }
}


/* ==========================================================
   LOAD PACKAGES
========================================================== */

async function loadPackages() {

    showLoadingState();

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "packages"
                )
            );

        state.packages =
            snapshot.docs
                .map(
                    normalizePackage
                )
                .filter(
                    packageItem =>
                        packageItem.status ===
                        "active"
                );

        console.log(
            "TOURS ACTIVE PACKAGES:",
            state.packages.length
        );

        populateCategories();
        populateLocations();
        resetVisibleCount();
        renderPackages();

    } catch (error) {

        console.error(
            "TOURS PACKAGES LOAD ERROR:",
            error
        );

        state.packages =
            [];

        showErrorState();
    }
}


/* ==========================================================
   CATEGORY RENDER
========================================================== */

function populateCategories() {

    if (tourSidebarCategories) {

        tourSidebarCategories.innerHTML =
            createSidebarCategoryButton(
                "all",
                "Browse All Tours",
                "fa-solid fa-suitcase"
            ) +
            TOUR_CATEGORY_GROUPS
                .map(
                    group =>
                        createSidebarCategoryButton(
                            group.value,
                            group.label,
                            group.icon
                        )
                )
                .join("");
    }

    if (tourCategoryStrip) {

        tourCategoryStrip.innerHTML =
            createCategoryChip(
                "all",
                "All Tours"
            ) +
            TOUR_CATEGORY_GROUPS
                .slice(0, 4)
                .map(
                    group =>
                        createCategoryChip(
                            group.value,
                            group.label
                        )
                )
                .join("");
    }

    syncCategoryUI();
}


function createSidebarCategoryButton(
    value,
    label,
    icon
) {

    const active =
        normalizeKey(state.category) ===
        normalizeKey(value);

    return `
        <button
            type="button"
            class="tours-sidebar-category${active ? " active" : ""}"
            data-category="${escapeHtml(value)}"
        >
            <span class="tours-sidebar-category-icon">
                <i class="${icon}"></i>
            </span>
            <span>${escapeHtml(label)}</span>
        </button>
    `;
}


function createCategoryChip(
    value,
    label
) {

    const active =
        normalizeKey(state.category) ===
        normalizeKey(value);

    return `
        <button
            type="button"
            class="tours-category-chip${active ? " active" : ""}"
            data-category="${escapeHtml(value)}"
        >
            ${escapeHtml(label)}
        </button>
    `;
}


function syncCategoryUI() {

    document
        .querySelectorAll(
            "[data-category]"
        )
        .forEach(
            button => {

                const active =
                    normalizeKey(
                        button.dataset.category
                    ) ===
                    normalizeKey(
                        state.category
                    );

                button.classList.toggle(
                    "active",
                    active
                );
            }
        );
}


/* ==========================================================
   LOCATION RENDER
========================================================== */

function populateLocations() {

    const locations =
        getLocations();

    [
        tourLocationFilter,
        tourMobileLocationFilter
    ]
        .filter(Boolean)
        .forEach(
            select => {

                const current =
                    select.value ||
                    state.location;

                select.innerHTML = `
                    <option value="all">
                        All Locations
                    </option>
                    ${
                        locations
                            .map(
                                location => `
                                    <option value="${escapeHtml(location)}">
                                        ${escapeHtml(location)}
                                    </option>
                                `
                            )
                            .join("")
                    }
                `;

                const hasCurrent =
                    [
                        ...select.options
                    ].some(
                        option =>
                            option.value ===
                            current
                    );

                select.value =
                    hasCurrent
                        ? current
                        : "all";
            }
        );
}


/* ==========================================================
   FILTER + SORT
========================================================== */

function getFilteredPackages() {

    let result =
        state.packages.filter(
            packageItem => {

                const searchable =
                    [
                        packageItem.name,
                        packageItem.location,
                        packageItem.category,
                        packageItem.duration,
                        packageItem.description
                    ]
                        .join(" ")
                        .toLowerCase();

                const matchesSearch =
                    !state.search ||
                    searchable.includes(
                        state.search
                    );

                const matchesCategory =
                    packageMatchesCategoryGroup(
                        packageItem,
                        state.category
                    );

                const matchesDuration =
                    state.duration ===
                        "all" ||
                    getDurationGroup(
                        packageItem.duration
                    ) ===
                    state.duration;

                const price =
                    normalizeNumber(
                        packageItem.price
                    );

                const matchesPrice =
                    state.maxPrice >=
                        10000 ||
                    price <=
                        state.maxPrice;

                const matchesLocation =
                    state.location ===
                        "all" ||
                    packageItem.location ===
                        state.location;

                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesDuration &&
                    matchesPrice &&
                    matchesLocation
                );
            }
        );

    result.sort(
        (a, b) => {

            if (
                state.sort ===
                "price-low"
            ) {
                return (
                    normalizeNumber(
                        a.price
                    ) -
                    normalizeNumber(
                        b.price
                    )
                );
            }

            if (
                state.sort ===
                "price-high"
            ) {
                return (
                    normalizeNumber(
                        b.price
                    ) -
                    normalizeNumber(
                        a.price
                    )
                );
            }

            if (
                state.sort ===
                "name-az"
            ) {
                return String(
                    a.name || ""
                ).localeCompare(
                    String(
                        b.name || ""
                    ),
                    "en",
                    {
                        sensitivity:
                            "base"
                    }
                );
            }

            if (
                state.sort ===
                "newest"
            ) {
                return (
                    dateValue(
                        b.createdAt ||
                        b.updatedAt
                    ) -
                    dateValue(
                        a.createdAt ||
                        a.updatedAt
                    )
                );
            }

            /* Recommended:
               active package order remains stable,
               while newer packages get a slight preference. */
            return (
                dateValue(
                    b.updatedAt ||
                    b.createdAt
                ) -
                dateValue(
                    a.updatedAt ||
                    a.createdAt
                )
            );
        }
    );

    return result;
}


/* ==========================================================
   CARD BADGE
========================================================== */

function packageBadge(
    packageItem,
    index
) {

    const custom =
        String(
            packageItem.badge ||
            ""
        ).trim();

    if (custom) {
        return custom;
    }

    if (index === 0) {
        return "BEST SELLER";
    }

    if (index === 1) {
        return "POPULAR";
    }

    if (index === 2) {
        return "TOP RATED";
    }

    if (index === 3) {
        return "NEW";
    }

    return packageItem.category ||
        "TOUR";
}


/* ==========================================================
   RENDER PACKAGES
========================================================== */

function resetVisibleCount() {

    state.visibleCount =
        pageSize();
}


function renderPackages() {

    hideLoadingState();

    tourError?.classList.add(
        "hidden"
    );

    if (!tourGrid) {
        return;
    }

    const filteredPackages =
        getFilteredPackages();

    tourGrid.innerHTML =
        "";

    if (
        filteredPackages.length ===
        0
    ) {

        tourEmpty?.classList.remove(
            "hidden"
        );

        if (tourResultText) {
            tourResultText.textContent =
                state.packages.length ===
                    0
                    ? "No active packages available."
                    : "No tours match your filters.";
        }

        if (tourLoadMore) {
            tourLoadMore.hidden =
                true;
        }

        return;
    }

    tourEmpty?.classList.add(
        "hidden"
    );

    if (tourResultText) {

        tourResultText.textContent =
            `${filteredPackages.length} available ${
                filteredPackages.length === 1
                    ? "tour"
                    : "tours"
            }`;
    }

    const visiblePackages =
        filteredPackages.slice(
            0,
            state.visibleCount
        );

    visiblePackages.forEach(
        (packageItem, index) => {

            const image =
                getPackageImage(
                    packageItem
                );

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "tour-card";

            card.dataset.packageId =
                packageItem.id;

            card.tabIndex =
                0;

            card.setAttribute(
                "role",
                "button"
            );

            card.setAttribute(
                "aria-label",
                `View ${packageItem.name || "tour"} details`
            );

            card.innerHTML = `

                <div class="tour-card-image">

                    ${
                        image
                            ? `
                                <img
                                    src="${escapeHtml(image)}"
                                    alt="${escapeHtml(
                                        packageItem.name ||
                                        "Tour Package"
                                    )}"
                                    loading="lazy"
                                >
                              `
                            : `
                                <div class="tour-card-placeholder">
                                    <i class="fa-solid fa-image"></i>
                                </div>
                              `
                    }

                    <span class="tour-category-badge">
                        ${escapeHtml(
                            packageBadge(
                                packageItem,
                                index
                            )
                        )}
                    </span>

                    <button
                        type="button"
                        class="tour-favorite-button"
                        data-favorite-tour="${escapeHtml(
                            packageItem.id
                        )}"
                        aria-label="Save tour"
                        title="Save tour"
                    >
                        <i class="fa-regular fa-heart"></i>
                    </button>

                </div>


                <div class="tour-card-body">

                    <h3>
                        ${escapeHtml(
                            packageItem.name ||
                            "Tour Package"
                        )}
                        ${
                            packageItem.duration
                                ? `
                                    <span class="tour-card-duration-title">
                                        ${escapeHtml(
                                            packageItem.duration
                                        )}
                                    </span>
                                  `
                                : ""
                        }
                    </h3>

                    <div class="tour-location">

                        <i class="fa-solid fa-location-dot"></i>

                        <span>
                            ${escapeHtml(
                                packageItem.location ||
                                "Philippines"
                            )}
                        </span>

                    </div>

                    <div class="tour-card-price">

                        <div class="tour-price-inline">

                            <strong>
                                ₱${formatMoney(
                                    packageItem.price
                                )}
                            </strong>

                            <span>
                                / person
                            </span>

                        </div>

                    </div>

                </div>


                <div class="tour-card-footer">

                    <span>
                        <i class="fa-regular fa-clock"></i>
                        ${escapeHtml(
                            packageItem.duration ||
                            "Tour"
                        )}
                    </span>

                    <span>
                        <i class="fa-solid fa-user-group"></i>
                        ${escapeHtml(
                            packageItem.tourType ||
                            "Joiners Tour"
                        )}
                    </span>

                </div>
            `;

            tourGrid.appendChild(
                card
            );
        }
    );

    if (tourLoadMore) {

        tourLoadMore.hidden =
            state.visibleCount >=
            filteredPackages.length;
    }
}


/* ==========================================================
   FILTER STATE SYNC
========================================================== */

function setSearch(
    value
) {

    state.search =
        normalizeText(value);

    if (
        tourSearch &&
        tourSearch.value !==
        value
    ) {
        tourSearch.value =
            value;
    }

    if (
        tourMobileSearch &&
        tourMobileSearch.value !==
        value
    ) {
        tourMobileSearch.value =
            value;
    }

    if (tourSearchClear) {
        tourSearchClear.hidden =
            !String(value || "").trim();
    }

    resetVisibleCount();
    renderPackages();
}


function setCategory(
    value
) {

    state.category =
        value ||
        "all";

    syncCategoryUI();

    resetVisibleCount();
    renderPackages();
}


function setDuration(
    value
) {

    state.duration =
        value ||
        "all";

    [
        tourDurationOptions,
        tourMobileDurationOptions
    ]
        .filter(Boolean)
        .forEach(
            container => {

                container
                    .querySelectorAll(
                        "[data-duration]"
                    )
                    .forEach(
                        button => {

                            button.classList.toggle(
                                "active",
                                button.dataset.duration ===
                                state.duration
                            );
                        }
                    );
            }
        );

    resetVisibleCount();
    renderPackages();
}


function setMaxPrice(
    value
) {

    const safe =
        Math.max(
            1000,
            Math.min(
                10000,
                Number(value) ||
                10000
            )
        );

    state.maxPrice =
        safe;

    if (tourPriceRange) {
        tourPriceRange.value =
            String(safe);
    }

    if (tourMobilePriceRange) {
        tourMobilePriceRange.value =
            String(safe);
    }

    const label =
        safe >= 10000
            ? "₱10,000+"
            : `₱${formatMoney(safe)}`;

    if (tourPriceLabel) {
        tourPriceLabel.textContent =
            label;
    }

    if (tourMobilePriceLabel) {
        tourMobilePriceLabel.textContent =
            label;
    }
}


function setLocation(
    value
) {

    state.location =
        value ||
        "all";

    if (tourLocationFilter) {
        tourLocationFilter.value =
            state.location;
    }

    if (tourMobileLocationFilter) {
        tourMobileLocationFilter.value =
            state.location;
    }

    resetVisibleCount();
    renderPackages();
}


function setSort(
    value
) {

    state.sort =
        value ||
        "recommended";

    [
        tourSort,
        tourSortTop,
        tourMobileSort
    ]
        .filter(Boolean)
        .forEach(
            select => {

                const optionExists =
                    [
                        ...select.options
                    ].some(
                        option =>
                            option.value ===
                            state.sort
                    );

                if (optionExists) {
                    select.value =
                        state.sort;
                }
            }
        );

    resetVisibleCount();
    renderPackages();
}


function clearAllFilters() {

    state.search =
        "";

    state.category =
        "all";

    state.duration =
        "all";

    state.maxPrice =
        10000;

    state.location =
        "all";

    state.sort =
        "recommended";

    if (tourSearch) {
        tourSearch.value =
            "";
    }

    if (tourMobileSearch) {
        tourMobileSearch.value =
            "";
    }

    if (tourSearchClear) {
        tourSearchClear.hidden =
            true;
    }

    setMaxPrice(
        10000
    );

    syncCategoryUI();

    [
        tourDurationOptions,
        tourMobileDurationOptions
    ]
        .filter(Boolean)
        .forEach(
            container => {

                container
                    .querySelectorAll(
                        "[data-duration]"
                    )
                    .forEach(
                        button => {

                            button.classList.toggle(
                                "active",
                                button.dataset.duration ===
                                "all"
                            );
                        }
                    );
            }
        );

    if (tourLocationFilter) {
        tourLocationFilter.value =
            "all";
    }

    if (tourMobileLocationFilter) {
        tourMobileLocationFilter.value =
            "all";
    }

    setSort(
        "recommended"
    );

    resetVisibleCount();
    renderPackages();
}


/* ==========================================================
   MODAL CONTENT
========================================================== */

function getPackageById(
    packageId
) {

    return state.packages.find(
        item =>
            item.id ===
            packageId
    ) || null;
}


function createListHtml(
    items,
    icon
) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return "";
    }

    return `
        <ul class="modal-list">
            ${
                items
                    .filter(Boolean)
                    .map(
                        item => `
                            <li>
                                <i class="${icon}"></i>
                                <span>${escapeHtml(item)}</span>
                            </li>
                        `
                    )
                    .join("")
            }
        </ul>
    `;
}


function createAccommodationsHtml(
    accommodations
) {

    if (
        !Array.isArray(
            accommodations
        ) ||
        accommodations.length ===
        0
    ) {
        return "";
    }

    return `
        <div class="modal-accommodations">
            ${
                accommodations
                    .map(
                        accommodation => {

                            const type =
                                normalizeText(
                                    accommodation.type ||
                                    "included"
                                );

                            const price =
                                String(
                                    accommodation.price ||
                                    ""
                                ).trim();

                            const priceLabel =
                                type === "included"
                                    ? "Included"
                                    : (
                                        price &&
                                        normalizeText(
                                            price
                                        ) !==
                                        "tbd"
                                            ? `+₱${formatMoney(price)}`
                                            : "Additional / TBD"
                                    );

                            return `
                                <div
                                    style="
                                        margin-top:8px;
                                        padding:11px;
                                        border:1px solid #e4ebf2;
                                        border-radius:9px;
                                        background:#f8fafc;
                                    "
                                >
                                    ${
                                        accommodation.photo
                                            ? `
                                                <img
                                                    src="${escapeHtml(
                                                        accommodation.photo
                                                    )}"
                                                    alt="${escapeHtml(
                                                        accommodation.name ||
                                                        "Accommodation"
                                                    )}"
                                                    style="
                                                        width:100%;
                                                        max-height:180px;
                                                        object-fit:cover;
                                                        border-radius:8px;
                                                        margin-bottom:9px;
                                                    "
                                                >
                                              `
                                            : ""
                                    }

                                    <strong
                                        style="
                                            display:block;
                                            color:#274e75;
                                            font-size:10px;
                                        "
                                    >
                                        ${escapeHtml(
                                            accommodation.name ||
                                            "Accommodation"
                                        )}
                                    </strong>

                                    ${
                                        accommodation.capacity
                                            ? `
                                                <span
                                                    style="
                                                        display:block;
                                                        margin-top:3px;
                                                        color:#7c8fa3;
                                                        font-size:8px;
                                                    "
                                                >
                                                    <i class="fa-solid fa-user-group"></i>
                                                    ${escapeHtml(
                                                        accommodation.capacity
                                                    )}
                                                </span>
                                              `
                                            : ""
                                    }

                                    <span
                                        style="
                                            display:inline-block;
                                            margin-top:6px;
                                            padding:4px 7px;
                                            border-radius:6px;
                                            background:#eaf4fd;
                                            color:#1767b7;
                                            font-size:7px;
                                            font-weight:700;
                                        "
                                    >
                                        ${escapeHtml(priceLabel)}
                                    </span>
                                </div>
                            `;
                        }
                    )
                    .join("")
            }
        </div>
    `;
}


function createGalleryHtml(
    packageItem
) {

    const gallery =
        Array.isArray(
            packageItem?.gallery
        )
            ? packageItem.gallery.filter(
                item =>
                    item &&
                    item.url
            )
            : [];

    const fallbackImage =
        getPackageImage(
            packageItem
        );

    const images =
        gallery.length > 0
            ? gallery
            : (
                fallbackImage
                    ? [
                        {
                            url:
                                fallbackImage
                        }
                      ]
                    : []
            );

    if (
        images.length ===
        0
    ) {
        return "";
    }

    const mainImage =
        images[0]?.url ||
        "";

    return `
        <div class="modal-tour-gallery">

            <div class="modal-tour-gallery-main">

                <img
                    id="tourGalleryMainImage"
                    src="${escapeHtml(mainImage)}"
                    alt="${escapeHtml(
                        packageItem?.name ||
                        "Tour Package"
                    )}"
                >

            </div>

            ${
                images.length > 1
                    ? `
                        <div class="modal-tour-gallery-thumbnails">

                            ${
                                images
                                    .slice(0, 10)
                                    .map(
                                        (
                                            imageItem,
                                            index
                                        ) => `

                                            <button
                                                type="button"
                                                class="tour-gallery-thumb ${
                                                    index === 0
                                                        ? "active"
                                                        : ""
                                                }"
                                                data-gallery-image="${escapeHtml(
                                                    imageItem.url
                                                )}"
                                                aria-label="View gallery image ${index + 1}"
                                            >

                                                <img
                                                    src="${escapeHtml(
                                                        imageItem.url
                                                    )}"
                                                    alt="${escapeHtml(
                                                        packageItem?.name ||
                                                        "Tour Package"
                                                    )} photo ${index + 1}"
                                                    loading="lazy"
                                                >

                                            </button>

                                        `
                                    )
                                    .join("")
                            }

                        </div>
                      `
                    : ""
            }

        </div>
    `;
}


function openTourDetails(
    packageId
) {

    const packageItem =
        getPackageById(
            packageId
        );

    if (!packageItem) {
        return;
    }

    state.selectedPackage =
        packageItem;

    if (tourModalTitle) {
        tourModalTitle.textContent =
            packageItem.name ||
            "Package Details";
    }

    if (tourModalContent) {

        tourModalContent.innerHTML = `

            ${createGalleryHtml(
                packageItem
            )}

            <div class="modal-tour-summary">

                <div class="modal-tour-location">

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHtml(
                        packageItem.location ||
                        "Philippines"
                    )}

                    ${
                        packageItem.duration
                            ? ` · ${escapeHtml(
                                packageItem.duration
                            )}`
                            : ""
                    }

                </div>

                <h3>
                    ${escapeHtml(
                        packageItem.name ||
                        "Tour Package"
                    )}
                </h3>

                <div class="modal-tour-price">

                    ₱${formatMoney(
                        packageItem.price
                    )}

                    <small>
                        / person
                    </small>

                </div>

            </div>

            ${
                packageItem.description
                    ? `
                        <section class="modal-section">
                            <h4>About This Tour</h4>
                            <p>
                                ${escapeHtml(
                                    packageItem.description
                                )}
                            </p>
                        </section>
                      `
                    : ""
            }

            ${
                packageItem.inclusions.length > 0
                    ? `
                        <section class="modal-section">
                            <h4>Inclusions</h4>
                            ${createListHtml(
                                packageItem.inclusions,
                                "fa-solid fa-circle-check"
                            )}
                        </section>
                      `
                    : ""
            }

            ${
                packageItem.exclusions.length > 0
                    ? `
                        <section class="modal-section">
                            <h4>Exclusions</h4>
                            ${createListHtml(
                                packageItem.exclusions,
                                "fa-regular fa-circle-xmark"
                            )}
                        </section>
                      `
                    : ""
            }

            ${
                packageItem.accommodations.length > 0
                    ? `
                        <section class="modal-section">
                            <h4>Accommodation Options</h4>
                            ${createAccommodationsHtml(
                                packageItem.accommodations
                            )}
                        </section>
                      `
                    : ""
            }

            ${
                packageItem.itinerary
                    ? `
                        <section class="modal-section">
                            <h4>Itinerary</h4>
                            <p style="white-space:pre-line;">
                                ${escapeHtml(
                                    packageItem.itinerary
                                )}
                            </p>
                        </section>
                      `
                    : ""
            }

        `;

        tourModalContent
            .querySelectorAll(
                ".tour-gallery-thumb"
            )
            .forEach(
                thumbnail => {

                    thumbnail.addEventListener(
                        "click",
                        () => {

                            const selectedImage =
                                thumbnail.dataset.galleryImage ||
                                "";

                            const mainGalleryImage =
                                tourModalContent.querySelector(
                                    "#tourGalleryMainImage"
                                );

                            if (
                                mainGalleryImage &&
                                selectedImage
                            ) {
                                mainGalleryImage.src =
                                    selectedImage;
                            }

                            tourModalContent
                                .querySelectorAll(
                                    ".tour-gallery-thumb.active"
                                )
                                .forEach(
                                    activeThumb =>
                                        activeThumb.classList.remove(
                                            "active"
                                        )
                                );

                            thumbnail.classList.add(
                                "active"
                            );
                        }
                    );
                }
            );
    }

    tourModal?.classList.add(
        "show"
    );

    tourModal?.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}


function closeDetailsModal() {

    tourModal?.classList.remove(
        "show"
    );

    tourModal?.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";
}


function bookPackage(
    packageId
) {

    const packageItem =
        getPackageById(
            packageId
        );

    if (!packageItem) {
        return;
    }

    window.location.href =
        `booking.html?package=${encodeURIComponent(
            packageItem.id
        )}`;
}


/* ==========================================================
   FILTER DRAWER
========================================================== */

function openFilterDrawer() {

    tourFilterDrawer?.classList.add(
        "show"
    );

    tourFilterDrawer?.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}


function closeFilterDrawer() {

    tourFilterDrawer?.classList.remove(
        "show"
    );

    tourFilterDrawer?.setAttribute(
        "aria-hidden",
        "true"
    );

    if (
        !tourModal?.classList.contains(
            "show"
        )
    ) {
        document.body.style.overflow =
            "";
    }
}


/* ==========================================================
   MOBILE SEARCH
========================================================== */

function openMobileSearch() {

    if (!tourMobileSearchPanel) {
        return;
    }

    tourMobileSearchPanel.hidden =
        false;

    tourMobileSearchPanel.style.display =
        "block";

    requestAnimationFrame(
        () => {
            tourMobileSearch?.focus();
        }
    );
}


function closeMobileSearch() {

    if (!tourMobileSearchPanel) {
        return;
    }

    tourMobileSearchPanel.hidden =
        true;

    tourMobileSearchPanel.style.display =
        "";
}


/* ==========================================================
   BRANDING
========================================================== */

function applyToursBranding(
    settings = {}
) {

    const businessLogo =
        String(
            settings.businessLogo ||
            ""
        ).trim();

    document
        .querySelectorAll(
            "[data-tours-business-logo]"
        )
        .forEach(
            image => {

                const fallback =
                    "../../assets/images/logo.png";

                image.onerror =
                    () => {

                        image.onerror =
                            null;

                        image.src =
                            fallback;
                    };

                image.src =
                    businessLogo ||
                    fallback;
            }
        );

    const faviconURL =
        String(
            settings.businessFavicon ||
            ""
        ).trim();

    if (faviconURL) {

        let favicon =
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

        favicon.href =
            faviconURL;
    }
}


function subscribeToursBranding() {

    if (!db) {
        applyToursBranding();
        return;
    }

    state.unsubscribeBranding?.();

    state.unsubscribeBranding =
        onSnapshot(
            doc(
                db,
                "systemSettings",
                "general"
            ),
            snapshot => {

                applyToursBranding(
                    snapshot.exists()
                        ? snapshot.data()
                        : {}
                );
            },
            error => {

                console.warn(
                    "TOURS BRANDING ERROR:",
                    error
                );

                applyToursBranding();
            }
        );
}


/* ==========================================================
   EVENT LISTENERS
========================================================== */

tourSearch?.addEventListener(
    "input",
    event => {

        setSearch(
            event.target.value
        );
    }
);


tourSearchClear?.addEventListener(
    "click",
    () => {

        setSearch("");

        tourSearch?.focus();
    }
);


tourMobileSearch?.addEventListener(
    "input",
    event => {

        setSearch(
            event.target.value
        );
    }
);


tourMobileSearchTrigger?.addEventListener(
    "click",
    openMobileSearch
);


tourMobileSearchClose?.addEventListener(
    "click",
    closeMobileSearch
);


document.addEventListener(
    "click",
    event => {

        const categoryButton =
            event.target.closest(
                "[data-category]"
            );

        if (categoryButton) {

            setCategory(
                categoryButton.dataset.category ||
                "all"
            );

            return;
        }

        const durationButton =
            event.target.closest(
                "[data-duration]"
            );

        if (durationButton) {

            setDuration(
                durationButton.dataset.duration ||
                "all"
            );

            return;
        }

        const closeDrawer =
            event.target.closest(
                "[data-close-filter-drawer]"
            );

        if (closeDrawer) {
            closeFilterDrawer();
        }
    }
);


tourPriceRange?.addEventListener(
    "input",
    event => {

        setMaxPrice(
            event.target.value
        );
    }
);


tourMobilePriceRange?.addEventListener(
    "input",
    event => {

        setMaxPrice(
            event.target.value
        );
    }
);


tourLocationFilter?.addEventListener(
    "change",
    event => {

        setLocation(
            event.target.value
        );
    }
);


tourMobileLocationFilter?.addEventListener(
    "change",
    event => {

        state.location =
            event.target.value ||
            "all";
    }
);


tourSort?.addEventListener(
    "change",
    event => {

        setSort(
            event.target.value
        );
    }
);


tourSortTop?.addEventListener(
    "change",
    event => {

        setSort(
            event.target.value
        );
    }
);


tourMobileSort?.addEventListener(
    "change",
    event => {

        setSort(
            event.target.value
        );
    }
);


clearTourFilters?.addEventListener(
    "click",
    clearAllFilters
);


applyTourFilters?.addEventListener(
    "click",
    renderPackages
);


tourMobileFilterButton?.addEventListener(
    "click",
    openFilterDrawer
);


tourMobileClearFilters?.addEventListener(
    "click",
    () => {

        clearAllFilters();

        closeFilterDrawer();
    }
);


tourMobileApplyFilters?.addEventListener(
    "click",
    () => {

        state.location =
            tourMobileLocationFilter?.value ||
            state.location;

        resetVisibleCount();
        renderPackages();

        closeFilterDrawer();
    }
);


tourLoadMore?.addEventListener(
    "click",
    () => {

        state.visibleCount +=
            pageSize();

        renderPackages();
    }
);


retryTours?.addEventListener(
    "click",
    loadPackages
);


/* Card click / keyboard */

tourGrid?.addEventListener(
    "click",
    event => {

        const favoriteButton =
            event.target.closest(
                "[data-favorite-tour]"
            );

        if (favoriteButton) {

            event.stopPropagation();

            const icon =
                favoriteButton.querySelector(
                    "i"
                );

            if (icon) {

                const saved =
                    icon.classList.contains(
                        "fa-solid"
                    );

                icon.classList.toggle(
                    "fa-solid",
                    !saved
                );

                icon.classList.toggle(
                    "fa-regular",
                    saved
                );
            }

            return;
        }

        const card =
            event.target.closest(
                ".tour-card"
            );

        if (!card) {
            return;
        }

        openTourDetails(
            card.dataset.packageId
        );
    }
);


tourGrid?.addEventListener(
    "keydown",
    event => {

        if (
            event.key !== "Enter" &&
            event.key !== " "
        ) {
            return;
        }

        const card =
            event.target.closest(
                ".tour-card"
            );

        if (!card) {
            return;
        }

        event.preventDefault();

        openTourDetails(
            card.dataset.packageId
        );
    }
);


/* Modal */

tourModalBackdrop?.addEventListener(
    "click",
    closeDetailsModal
);

closeTourModal?.addEventListener(
    "click",
    closeDetailsModal
);

closeTourDetails?.addEventListener(
    "click",
    closeDetailsModal
);

tourBookNow?.addEventListener(
    "click",
    () => {

        if (
            !state.selectedPackage
        ) {
            return;
        }

        bookPackage(
            state.selectedPackage.id
        );
    }
);


document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        if (
            tourModal?.classList.contains(
                "show"
            )
        ) {
            closeDetailsModal();
            return;
        }

        if (
            tourFilterDrawer?.classList.contains(
                "show"
            )
        ) {
            closeFilterDrawer();
        }
    }
);


/* Responsive visible count */

let resizeTimer =
    null;

window.addEventListener(
    "resize",
    () => {

        clearTimeout(
            resizeTimer
        );

        resizeTimer =
            setTimeout(
                () => {

                    const minimum =
                        pageSize();

                    if (
                        state.visibleCount <
                        minimum
                    ) {
                        state.visibleCount =
                            minimum;

                        renderPackages();
                    }
                },
                140
            );
    }
);


/* ==========================================================
   INIT
========================================================== */

function initTours() {

    setMaxPrice(
        10000
    );

    subscribeToursBranding();

    loadPackages();
}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initTours,
        {
            once: true
        }
    );

} else {

    initTours();
}


window.addEventListener(
    "beforeunload",
    () => {

        state.unsubscribeBranding?.();

        state.unsubscribeBranding =
            null;
    }
);
