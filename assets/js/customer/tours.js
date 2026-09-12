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

    selectedAccommodationId: "",
    selectedAccommodationName: "",
    selectedPickupLocation: "",
    selectedDestinationKey: "",

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

        destinationName:
            data.destinationName ||
            "",

        destinationGroupKey:
            data.destinationGroupKey ||
            "",

        packageOptionLabel:
            data.packageOptionLabel ||
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

        pickupLocations:
            Array.isArray(data.pickupLocations)
                ? data.pickupLocations
                : Array.isArray(data.pickUpLocations)
                    ? data.pickUpLocations
                    : Array.isArray(data.meetupLocations)
                        ? data.meetupLocations
                        : Array.isArray(data.meetUpLocations)
                            ? data.meetUpLocations
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
            packageItem.destinationName,
            packageItem.name,
            packageItem.packageOptionLabel,
            packageItem.duration,
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
   DESTINATION + PACKAGE OPTION GROUPING
   One destination card can contain multiple package durations.
   Existing Firestore package documents remain unchanged.
========================================================== */

function getBasePackageName(value) {

    let name =
        String(value || "")
            .trim();

    const patterns = [
        /\bday\s*tour\b/gi,
        /\b1\s*day(?:\s*0?\s*night)?s?\b/gi,
        /\b2\s*days?\s*1\s*nights?\b/gi,
        /\b3\s*days?\s*2\s*nights?\b/gi,
        /\b4\s*days?\s*3\s*nights?\b/gi,
        /\b5\s*days?\s*4\s*nights?\b/gi,
        /\b6\s*days?\s*5\s*nights?\b/gi,
        /\b7\s*days?\s*6\s*nights?\b/gi,
        /\b\d+\s*d\s*\d+\s*n\b/gi
    ];

    patterns.forEach(
        pattern => {
            name =
                name.replace(
                    pattern,
                    " "
                );
        }
    );

    return name
        .replace(/\s{2,}/g, " ")
        .replace(/[-–—|/]+$/g, "")
        .trim() ||
        String(value || "").trim() ||
        "Tour Package";
}





function normalizeDestinationDisplayName(
    value
) {

    return String(value || "")
        .replace(
            /\s*[-|•:]?\s*(?:day\s*tour|\d+\s*d(?:ays?)?\s*\d+\s*n(?:ights?)?|\d+d\d+n|\d+\s*days?\s*\d+\s*nights?)\s*$/i,
            ""
        )
        .replace(/\s+/g, " ")
        .trim();
}


function getDestinationName(
    packageItem
) {

    const explicit =
        normalizeDestinationDisplayName(
            packageItem?.destinationName
        );

    if (explicit) {
        return explicit;
    }

    return normalizeDestinationDisplayName(
        getBasePackageName(
            packageItem?.name
        )
    );
}

function getDestinationGroupKey(
    packageItem
) {

    const destinationName =
        getDestinationName(
            packageItem
        );

    /*
      Customer Tours grouping should prioritize the canonical
      destination name so legacy package records still merge
      into one destination card even if an older document has
      a different / missing location or destinationGroupKey.
    */
    const canonicalName =
        normalizeKey(
            destinationName
        );

    if (canonicalName) {
        return canonicalName;
    }

    const explicit =
        String(
            packageItem?.destinationGroupKey ||
            ""
        ).trim();

    if (explicit) {
        return normalizeKey(explicit);
    }

    return normalizeKey(
        packageItem?.name
    );
}



function buildPackageComparisonMeta(
    packageItem
) {

    const durationText =
        String(
            packageItem?.duration ||
            getOptionLabel(packageItem) ||
            ""
        ).trim();

    const durationMatch =
        durationText.match(
            /(\d+)\s*d(?:ays?)?\s*(\d+)\s*n(?:ights?)?/i
        ) ||
        durationText.match(
            /(\d+)d\s*(\d+)n/i
        );

    let stayLabel =
        "Tour Package";

    if (/day\s*tour/i.test(durationText)) {
        stayLabel = "No Overnight Stay";
    } else if (durationMatch) {
        const nights =
            Number(durationMatch[2] || 0);

        stayLabel =
            nights > 0
                ? `${nights} Night${nights > 1 ? "s" : ""} Stay`
                : "No Overnight Stay";
    }

    const inclusionTexts =
        Array.isArray(packageItem?.inclusions)
            ? packageItem.inclusions
                .map(item =>
                    typeof item === "string"
                        ? item
                        : (
                            item?.name ||
                            item?.title ||
                            item?.label ||
                            ""
                        )
                )
                .filter(Boolean)
            : [];

    const findMatch = (pattern) =>
        inclusionTexts.find(text =>
            pattern.test(String(text))
        ) || "";

    const meals =
        findMatch(/meal|breakfast|lunch|dinner/i);

    const tour =
        findMatch(
            /island\s*tour|tour\s*guide|tour\b/i
        );

    const transfer =
        findMatch(
            /van|boat|transfer|transport/i
        );

    const accommodation =
        findMatch(
            /accommodation|tent|nipa|room|hotel|stay/i
        );

    const bullets = [];

    if (accommodation) {
        bullets.push(accommodation);
    } else {
        bullets.push(stayLabel);
    }

    if (tour) {
        bullets.push(tour);
    }

    if (transfer) {
        bullets.push(transfer);
    }

    if (meals) {
        bullets.push(meals);
    }

    return {
        stayLabel,
        bullets: bullets.slice(0, 4)
    };
}


function getOptionLabel(
    packageItem
) {

    const explicit =
        String(
            packageItem?.packageOptionLabel ||
            ""
        ).trim();

    if (explicit) {
        return explicit;
    }

    const group =
        getDurationGroup(
            packageItem?.duration
        );

    if (group === "2d1n") {
        return "2D1N";
    }

    if (group === "3d2n") {
        return "3D2N";
    }

    if (group === "4d3n+") {

        const raw =
            String(
                packageItem?.duration ||
                ""
            ).trim();

        return raw || "4D3N+";
    }

    const raw =
        normalizeText(
            packageItem?.duration
        );

    if (
        raw.includes("day tour") ||
        raw === "1day" ||
        raw === "1 day"
    ) {
        return "Day Tour";
    }

    return (
        String(
            packageItem?.duration ||
            ""
        ).trim() ||
        "Tour"
    );
}


function getAllPackagesForGroup(
    packageItem
) {

    const key =
        getDestinationGroupKey(
            packageItem
        );

    return state.packages
        .filter(
            item =>
                getDestinationGroupKey(
                    item
                ) === key
        )
        .sort(
            (a, b) =>
                normalizeNumber(a.price) -
                normalizeNumber(b.price)
        );
}


function buildDestinationGroups(
    filteredPackages
) {

    const visibleKeys =
        new Set(
            filteredPackages.map(
                getDestinationGroupKey
            )
        );

    const groups = [];
    const seen = new Set();

    state.packages.forEach(
        packageItem => {

            const key =
                getDestinationGroupKey(
                    packageItem
                );

            if (
                !visibleKeys.has(key) ||
                seen.has(key)
            ) {
                return;
            }

            seen.add(key);

            const options =
                getAllPackagesForGroup(
                    packageItem
                );

            const prices =
                options
                    .map(
                        item =>
                            normalizeNumber(
                                item.price
                            )
                    )
                    .filter(
                        value =>
                            value >= 0
                    );

            const minPrice =
                prices.length
                    ? Math.min(...prices)
                    : 0;

            const maxPrice =
                prices.length
                    ? Math.max(...prices)
                    : 0;

            groups.push({
                key,
                name:
                    getDestinationName(
                        packageItem
                    ),
                location:
                    packageItem.location ||
                    "",
                category:
                    packageItem.category ||
                    "",
                badge:
                    packageItem.badge ||
                    "",
                image:
                    getPackageImage(
                        packageItem
                    ),
                representative:
                    packageItem,
                options,
                minPrice,
                maxPrice,
                newestValue:
                    Math.max(
                        ...options.map(
                            item =>
                                dateValue(
                                    item.updatedAt ||
                                    item.createdAt
                                )
                        ),
                        0
                    )
            });
        }
    );

    groups.sort(
        (a, b) => {

            if (
                state.sort ===
                "price-low"
            ) {
                return (
                    a.minPrice -
                    b.minPrice
                );
            }

            if (
                state.sort ===
                "price-high"
            ) {
                return (
                    b.minPrice -
                    a.minPrice
                );
            }

            if (
                state.sort ===
                "name-az"
            ) {
                return a.name.localeCompare(
                    b.name,
                    "en",
                    {
                        sensitivity:
                            "base"
                    }
                );
            }

            return (
                b.newestValue -
                a.newestValue
            );
        }
    );

    return groups;
}


function createPackageOptionChips(
    options
) {

    return options
        .map(
            option => `
                <span class="tour-option-chip">
                    ${escapeHtml(
                        getOptionLabel(
                            option
                        )
                    )}
                </span>
            `
        )
        .join("");
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

    const destinationGroups =
        buildDestinationGroups(
            filteredPackages
        );

    tourGrid.innerHTML =
        "";

    if (
        destinationGroups.length ===
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
                    : "No destinations match your filters.";
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
            `${destinationGroups.length} available ${
                destinationGroups.length === 1
                    ? "destination"
                    : "destinations"
            }`;
    }

    const visibleGroups =
        destinationGroups.slice(
            0,
            state.visibleCount
        );

    visibleGroups.forEach(
        (group, index) => {

            const representative =
                group.representative;

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "tour-card";

            card.dataset.packageId =
                representative.id;

            card.tabIndex =
                0;

            card.setAttribute(
                "role",
                "button"
            );

            card.setAttribute(
                "aria-label",
                `View ${group.name} package options`
            );

            const hasMultipleOptions =
                group.options.length > 1;

            card.innerHTML = `

                <div class="tour-card-image">

                    ${
                        group.image
                            ? `
                                <img
                                    src="${escapeHtml(
                                        group.image
                                    )}"
                                    alt="${escapeHtml(
                                        group.name
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
                                representative,
                                index
                            )
                        )}
                    </span>

                    <button
                        type="button"
                        class="tour-favorite-button"
                        data-favorite-tour="${escapeHtml(
                            representative.id
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
                            group.name
                        )}
                    </h3>

                    <div class="tour-location">

                        <i class="fa-solid fa-location-dot"></i>

                        <span>
                            ${escapeHtml(
                                group.location ||
                                "Philippines"
                            )}
                        </span>

                    </div>

                    <div class="tour-option-chips">
                        ${createPackageOptionChips(
                            group.options
                        )}
                    </div>

                    <div class="tour-card-price">

                        <div class="tour-price-inline">

                            ${
                                hasMultipleOptions
                                    ? `
                                        <span class="tour-price-from">
                                            From
                                        </span>
                                      `
                                    : ""
                            }

                            <strong>
                                ₱${formatMoney(
                                    group.minPrice
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
                        <i class="fa-solid fa-layer-group"></i>
                        ${
                            group.options.length === 1
                                ? "1 Package"
                                : `${group.options.length} Packages`
                        }
                    </span>

                    <span>
                        View Details
                        <i class="fa-solid fa-arrow-right"></i>
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
            destinationGroups.length;
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



function normalizeDisplayItems(value) {
    if (Array.isArray(value)) {
        return value
            .map(item => {
                if (typeof item === "string") return item.trim();
                if (!item || typeof item !== "object") return "";
                return String(
                    item.name ||
                    item.title ||
                    item.label ||
                    item.text ||
                    item.description ||
                    ""
                ).trim();
            })
            .filter(Boolean);
    }

    if (value && typeof value === "object") {
        return Object.entries(value)
            .sort(([a], [b]) =>
                String(a).localeCompare(
                    String(b),
                    undefined,
                    { numeric: true }
                )
            )
            .map(([key, item]) => {
                if (typeof item === "string") {
                    return {
                        title: key,
                        text: item
                    };
                }

                if (item && typeof item === "object") {
                    return {
                        title:
                            item.title ||
                            item.day ||
                            item.label ||
                            key,
                        text:
                            item.description ||
                            item.details ||
                            item.text ||
                            item.activities ||
                            ""
                    };
                }

                return null;
            })
            .filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
        return value
            .split(/\r?\n/)
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
}


function getAccommodationComparisonItems(packageItem) {
    const raw =
        packageItem?.accommodations ||
        packageItem?.accommodation ||
        packageItem?.accommodationOptions ||
        [];

    return normalizeDisplayItems(raw);
}



function getAccommodationRawItems(packageItem) {
    const raw =
        packageItem?.accommodations ||
        packageItem?.accommodation ||
        packageItem?.accommodationOptions ||
        [];

    return Array.isArray(raw)
        ? raw.filter(Boolean)
        : [];
}



function getTourAccommodationId(item, index) {
    return normalizeText(
        item?.id ||
        item?.accommodationId
    ) || `accommodation-${index + 1}`;
}


function createPickupSelectionHtml(locations) {

    if (
        !Array.isArray(locations) ||
        locations.length === 0
    ) {
        return `
            <div class="tw-compare-empty">
                <i class="fa-solid fa-minus"></i>
                <span>No pickup location added</span>
            </div>
        `;
    }

    return `
        <div class="tw-pickup-selection-grid">

            ${locations.map(location => {

                const value =
                    typeof location === "string"
                        ? location
                        : (
                            location?.name ||
                            location?.label ||
                            location?.value ||
                            ""
                        );

                const selected =
                    normalizeText(
                        state.selectedPickupLocation
                    ) === normalizeText(value);

                return `
                    <button
                        type="button"
                        class="tw-pickup-option ${
                            selected ? "selected" : ""
                        }"
                        data-tour-pickup="${escapeHtml(value)}"
                    >
                        <span class="tw-pickup-radio">
                            <i class="${
                                selected
                                    ? "fa-solid fa-circle-check"
                                    : "fa-regular fa-circle"
                            }"></i>
                        </span>

                        <span>
                            <strong>${escapeHtml(value)}</strong>
                            <small>
                                ${
                                    selected
                                        ? "Selected pickup point"
                                        : "Select this pickup point"
                                }
                            </small>
                        </span>
                    </button>
                `;
            }).join("")}

        </div>

        <div class="tw-selection-note">
            <i class="fa-solid fa-circle-info"></i>
            <span>
                Your selected pickup point will be carried over to the booking page.
            </span>
        </div>
    `;
}


function createAccommodationCardsHtml(accommodations) {

    if (
        !Array.isArray(accommodations) ||
        accommodations.length === 0
    ) {
        return `
            <div class="tw-compare-empty tw-accommodation-empty">
                <i class="fa-solid fa-minus"></i>
                <span>No accommodation added</span>
            </div>
        `;
    }

    return `
        <div class="tw-accommodation-grid">

            ${accommodations.map((item, index) => {

                const accommodationId =
                    getTourAccommodationId(
                        item,
                        index
                    );

                const name =
                    String(
                        item?.name ||
                        item?.title ||
                        item?.label ||
                        `Accommodation ${index + 1}`
                    ).trim();

                const isSelected =
                    state.selectedAccommodationId ===
                    accommodationId;

                const type =
                    normalizeText(
                        item?.type ||
                        item?.rateType ||
                        "included"
                    );

                const image =
                    String(
                        item?.photo ||
                        item?.image ||
                        item?.photoUrl ||
                        item?.imageUrl ||
                        item?.url ||
                        ""
                    ).trim();

                const capacity =
                    String(
                        item?.capacity ||
                        item?.pax ||
                        item?.guestCapacity ||
                        ""
                    ).trim();

                const description =
                    String(
                        item?.description ||
                        item?.details ||
                        item?.note ||
                        ""
                    ).trim();

                const rawPrice =
                    item?.price ??
                    item?.upgradePrice ??
                    item?.additionalFee ??
                    "";

                const priceText =
                    String(rawPrice || "").trim();

                const isIncluded =
                    type === "included" ||
                    type === "standard" ||
                    item?.included === true;

                const badge =
                    isIncluded
                        ? "Standard"
                        : "Upgrade";

                const priceLabel =
                    isIncluded
                        ? "Included"
                        : (
                            priceText &&
                            normalizeText(priceText) !== "tbd"
                                ? `+₱${formatMoney(priceText)} / night`
                                : "Additional Fee"
                        );

                const amenitiesRaw =
                    item?.amenities ||
                    item?.features ||
                    [];

                const amenities =
                    normalizeDisplayItems(
                        amenitiesRaw
                    ).slice(0, 5);

                return `
                    <article
                        class="tw-accommodation-card ${isSelected ? "selected" : ""}"
                        data-tour-accommodation-card="${escapeHtml(
                            accommodationId
                        )}"
                        data-tour-accommodation-name="${escapeHtml(
                            name
                        )}"
                        role="button"
                        tabindex="0"
                        aria-pressed="${isSelected ? "true" : "false"}"
                    >

                        <div class="tw-accommodation-photo">

                            ${
                                image
                                    ? `
                                        <img
                                            src="${escapeHtml(image)}"
                                            alt="${escapeHtml(name)}"
                                        >
                                      `
                                    : `
                                        <div class="tw-accommodation-photo-placeholder">
                                            <i class="fa-solid fa-bed"></i>
                                        </div>
                                      `
                            }

                            <span class="tw-accommodation-badge ${
                                isIncluded
                                    ? "standard"
                                    : "upgrade"
                            }">
                                ${badge}
                            </span>

                        </div>

                        <div class="tw-accommodation-card-body">

                            <h5>${escapeHtml(name)}</h5>

                            ${
                                capacity
                                    ? `
                                        <div class="tw-accommodation-meta">
                                            <i class="fa-solid fa-user-group"></i>
                                            <span>${escapeHtml(capacity)}</span>
                                        </div>
                                      `
                                    : ""
                            }

                            ${
                                amenities.length
                                    ? `
                                        <div class="tw-accommodation-features">
                                            ${amenities.map(text => `
                                                <div>
                                                    <i class="fa-solid fa-check"></i>
                                                    <span>${escapeHtml(
                                                        typeof text === "string"
                                                            ? text
                                                            : (
                                                                text?.text ||
                                                                text?.title ||
                                                                ""
                                                            )
                                                    )}</span>
                                                </div>
                                            `).join("")}
                                        </div>
                                      `
                                    : ""
                            }

                            ${
                                description
                                    ? `
                                        <p class="tw-accommodation-description">
                                            ${escapeHtml(description)}
                                        </p>
                                      `
                                    : ""
                            }

                            <div class="tw-accommodation-price ${
                                isIncluded
                                    ? "included"
                                    : "upgrade"
                            }">
                                ${escapeHtml(priceLabel)}
                            </div>

                            <div
                                class="tw-accommodation-select-button ${
                                    isSelected ? "selected" : ""
                                }"
                                aria-hidden="true"
                            >
                                <i class="${
                                    isSelected
                                        ? "fa-solid fa-circle-check"
                                        : "fa-regular fa-circle"
                                }"></i>
                                ${
                                    isSelected
                                        ? "Selected"
                                        : "Tap anywhere to select"
                                }
                            </div>

                        </div>

                    </article>
                `;

            }).join("")}

        </div>

        <div class="tw-accommodation-note">
            <i class="fa-solid fa-circle-info"></i>
            <span>
                Choose your preferred accommodation now. Availability will be verified after you select your travel date during booking.
            </span>
        </div>
    `;
}


function getPickupComparisonItems(packageItem) {
    const raw =
        packageItem?.pickupLocations ||
        packageItem?.pickUpLocations ||
        packageItem?.meetupLocations ||
        packageItem?.meetUpLocations ||
        [];

    return normalizeDisplayItems(raw);
}


function getItineraryComparisonItems(packageItem) {
    return normalizeDisplayItems(
        packageItem?.itinerary || []
    );
}


function createSimpleComparisonList(items, emptyText = "Not Included") {
    if (!items || items.length === 0) {
        return `
            <div class="tw-compare-empty">
                <i class="fa-solid fa-minus"></i>
                <span>${escapeHtml(emptyText)}</span>
            </div>
        `;
    }

    return `
        <div class="tw-accordion-list">
            ${items.map(item => `
                <div class="tw-accordion-list-item">
                    <i class="fa-solid fa-check"></i>
                    <span>${escapeHtml(
                        typeof item === "string"
                            ? item
                            : (
                                item?.text ||
                                item?.title ||
                                ""
                            )
                    )}</span>
                </div>
            `).join("")}
        </div>
    `;
}


function createItineraryComparisonList(items) {
    if (!items || items.length === 0) {
        return `
            <div class="tw-compare-empty">
                <i class="fa-solid fa-minus"></i>
                <span>No itinerary added</span>
            </div>
        `;
    }

    return `
        <div class="tw-itinerary-compare-list">
            ${items.map((item, index) => {
                const isObject =
                    item &&
                    typeof item === "object";

                const title =
                    isObject
                        ? (
                            item.title ||
                            `Day ${index + 1}`
                        )
                        : `Day ${index + 1}`;

                const text =
                    isObject
                        ? (
                            Array.isArray(item.text)
                                ? item.text.join(" • ")
                                : item.text
                        )
                        : item;

                return `
                    <div class="tw-itinerary-compare-item">
                        <strong>${escapeHtml(title)}</strong>
                        <span>${escapeHtml(text || "")}</span>
                    </div>
                `;
            }).join("")}
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

    const options =
        getAllPackagesForGroup(
            packageItem
        );

    const selectedOption =
        options.find(
            item =>
                item.id ===
                packageId
        ) ||
        options[0] ||
        packageItem;

    const destinationKey =
        getDestinationGroupKey(
            selectedOption
        );

    if (
        state.selectedDestinationKey !==
        destinationKey
    ) {
        state.selectedDestinationKey =
            destinationKey;

        state.selectedAccommodationId = "";
        state.selectedAccommodationName = "";
        state.selectedPickupLocation = "";

        const accommodationSource =
            options.find(
                option =>
                    getAccommodationRawItems(
                        option
                    ).length > 0
            ) || selectedOption;

        const accommodations =
            getAccommodationRawItems(
                accommodationSource
            );

        const defaultAccommodationIndex =
            accommodations.findIndex(item => {
                const type =
                    normalizeText(
                        item?.type ||
                        item?.optionType ||
                        item?.category ||
                        "included"
                    );

                return (
                    type === "included" ||
                    type === "standard" ||
                    item?.included === true ||
                    item?.isIncluded === true
                );
            });

        if (defaultAccommodationIndex >= 0) {
            const defaultAccommodation =
                accommodations[
                    defaultAccommodationIndex
                ];

            state.selectedAccommodationId =
                getTourAccommodationId(
                    defaultAccommodation,
                    defaultAccommodationIndex
                );

            state.selectedAccommodationName =
                normalizeText(
                    defaultAccommodation?.name ||
                    defaultAccommodation?.title
                );
        }
    }

    state.selectedPackage =
        selectedOption;

    const destinationName =
        getDestinationName(
            selectedOption
        );

    if (tourModalTitle) {
        tourModalTitle.textContent =
            destinationName ||
            "Package Details";
    }

    if (tourBookNow) {
        tourBookNow.innerHTML = `
            <i class="fa-solid fa-calendar-check"></i>
            Book Now — ${escapeHtml(
                getOptionLabel(
                    selectedOption
                )
            )} (₱${formatMoney(
                selectedOption.price
            )})
        `;
    }

    if (tourModalContent) {

        tourModalContent.innerHTML = `

            <div class="tw-continuous-compare">

                <section class="tw-continuous-hero">

                    <div class="tw-continuous-hero-media">

                        ${createGalleryHtml(
                            selectedOption
                        )}

                        <div class="tw-continuous-hero-copy">

                            <span class="tw-continuous-category">
                                ${escapeHtml(
                                    selectedOption.category ||
                                    "Tour Package"
                                )}
                            </span>

                            <h3>
                                ${escapeHtml(
                                    destinationName
                                )}
                            </h3>

                            <div>
                                <i class="fa-solid fa-location-dot"></i>
                                ${escapeHtml(
                                    selectedOption.location ||
                                    "Philippines"
                                )}
                            </div>

                        </div>

                    </div>

                </section>


                <section class="tw-package-picker">

                    <div class="tw-package-picker-heading">

                        <div>
                            <small>CHOOSE YOUR PACKAGE</small>
                            <h4>Which package fits your trip?</h4>
                            <p>
                                Select an option, then open any section below
                                to compare what each package includes.
                            </p>
                        </div>

                        <span>
                            ${options.length}
                            ${options.length === 1 ? "option" : "options"}
                        </span>

                    </div>


                    <div class="tw-package-picker-grid">

                        ${options.map(option => {

                            const active =
                                option.id ===
                                selectedOption.id;

                            const meta =
                                buildPackageComparisonMeta(
                                    option
                                );

                            return `
                                <button
                                    type="button"
                                    class="tw-package-picker-card ${
                                        active ? "active" : ""
                                    }"
                                    data-package-option="${escapeHtml(
                                        option.id
                                    )}"
                                >

                                    <span class="tw-package-picker-check">
                                        <i class="${
                                            active
                                                ? "fa-solid fa-circle-check"
                                                : "fa-regular fa-circle"
                                        }"></i>
                                    </span>

                                    <strong>
                                        ${escapeHtml(
                                            getOptionLabel(option)
                                        )}
                                    </strong>

                                    <span class="tw-package-picker-stay">
                                        ${escapeHtml(
                                            meta.stayLabel
                                        )}
                                    </span>

                                    <div class="tw-package-picker-price">
                                        ₱${formatMoney(option.price)}
                                        <small>/ person</small>
                                    </div>

                                </button>
                            `;

                        }).join("")}

                    </div>

                </section>


                <section class="tw-comparison-accordions">

                    ${[
                        {
                            key: "inclusions",
                            icon: "fa-circle-check",
                            title: "Package Inclusions",
                            subtitle: "Compare everything included in each package."
                        },
                        {
                            key: "exclusions",
                            icon: "fa-circle-xmark",
                            title: "Exclusions",
                            subtitle: "Compare what is not included in each package."
                        },
                        {
                            key: "itinerary",
                            icon: "fa-route",
                            title: "Itinerary",
                            subtitle: "Compare the tour flow and number of days."
                        },
                        {
                            key: "accommodation",
                            icon: "fa-bed",
                            title: "Accommodation",
                            subtitle: "See available stays, photos, capacity, and room upgrade options."
                        },
                        {
                            key: "pickup",
                            icon: "fa-location-dot",
                            title: "Meet Up & Pick Up",
                            subtitle: "See the available meet up and pickup locations."
                        }
                    ].map((section, sectionIndex) => `

                        <div
                            class="tw-comparison-accordion ${
                                sectionIndex === 0 ? "open" : ""
                            }"
                            data-comparison-accordion="${section.key}"
                        >

                            <button
                                type="button"
                                class="tw-comparison-accordion-trigger"
                                aria-expanded="${
                                    sectionIndex === 0
                                        ? "true"
                                        : "false"
                                }"
                            >

                                <span class="tw-comparison-accordion-icon">
                                    <i class="fa-solid ${section.icon}"></i>
                                </span>

                                <span class="tw-comparison-accordion-copy">
                                    <strong>${section.title}</strong>
                                    <small>${section.subtitle}</small>
                                </span>

                                <i class="fa-solid fa-chevron-down tw-comparison-chevron"></i>

                            </button>


                            <div class="tw-comparison-accordion-body">

                                ${["accommodation", "pickup"].includes(section.key) ? `

                                    <div class="tw-shared-section">

                                        ${(() => {

                                            if (section.key === "accommodation") {

                                                const sourceOption =
                                                    options.find(
                                                        option =>
                                                            getAccommodationRawItems(
                                                                option
                                                            ).length > 0
                                                    ) || selectedOption;

                                                return createAccommodationCardsHtml(
                                                    getAccommodationRawItems(
                                                        sourceOption
                                                    )
                                                );
                                            }

                                            const sourceOption =
                                                options.find(
                                                    option =>
                                                        getPickupComparisonItems(
                                                            option
                                                        ).length > 0
                                                ) || selectedOption;

                                            const pickupLocations =
                                                Array.isArray(
                                                    sourceOption?.pickupLocations
                                                )
                                                    ? sourceOption.pickupLocations
                                                    : getPickupComparisonItems(
                                                        sourceOption
                                                    );

                                            return createPickupSelectionHtml(
                                                pickupLocations
                                            );

                                        })()}

                                    </div>

                                ` : `

                                    <div
                                        class="tw-comparison-columns"
                                        style="--package-count:${Math.max(
                                            options.length,
                                            1
                                        )}"
                                    >

                                        ${options.map(option => {

                                            let content = "";

                                            if (section.key === "inclusions") {
                                                content =
                                                    createSimpleComparisonList(
                                                        normalizeDisplayItems(
                                                            option.inclusions
                                                        ),
                                                        "Not Included"
                                                    );
                                            }

                                            if (section.key === "exclusions") {
                                                content =
                                                    createSimpleComparisonList(
                                                        normalizeDisplayItems(
                                                            option.exclusions
                                                        ),
                                                        "No exclusions added"
                                                    );
                                            }

                                            if (section.key === "itinerary") {
                                                content =
                                                    createItineraryComparisonList(
                                                        getItineraryComparisonItems(
                                                            option
                                                        )
                                                    );
                                            }

                                            return `
                                                <article class="tw-comparison-column">

                                                    <div class="tw-comparison-column-head">

                                                        <div>
                                                            <strong>
                                                                ${escapeHtml(
                                                                    getOptionLabel(
                                                                        option
                                                                    )
                                                                )}
                                                            </strong>

                                                            ${section.key === "inclusions" ? `
                                                                <span>
                                                                    ₱${formatMoney(
                                                                        option.price
                                                                    )}
                                                                    / person
                                                                </span>
                                                            ` : ""}
                                                        </div>

                                                    </div>

                                                    <div class="tw-comparison-column-content">
                                                        ${content}
                                                    </div>

                                                </article>
                                            `;

                                        }).join("")}

                                    </div>

                                `}

                            </div>

                        </div>

                    `).join("")}

                </section>

            </div>

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

        tourModalContent
            .querySelectorAll(
                ".tw-tour-tab"
            )
            .forEach(
                tabButton => {

                    tabButton.addEventListener(
                        "click",
                        () => {

                            const targetTab =
                                tabButton.dataset.tourTab ||
                                "overview";

                            tourModalContent
                                .querySelectorAll(
                                    ".tw-tour-tab"
                                )
                                .forEach(
                                    button =>
                                        button.classList.remove(
                                            "active"
                                        )
                                );

                            tourModalContent
                                .querySelectorAll(
                                    ".tw-tour-panel-content"
                                )
                                .forEach(
                                    panel =>
                                        panel.classList.remove(
                                            "active"
                                        )
                                );

                            tabButton.classList.add(
                                "active"
                            );

                            tourModalContent
                                .querySelector(
                                    `[data-tour-panel="${targetTab}"]`
                                )
                                ?.classList.add(
                                    "active"
                                );

                        }
                    );

                }
            );


        tourModalContent
            .querySelectorAll(
                ".tw-comparison-accordion-trigger"
            )
            .forEach(trigger => {

                trigger.addEventListener(
                    "click",
                    () => {

                        const currentAccordion =
                            trigger.closest(
                                ".tw-comparison-accordion"
                            );

                        const isOpen =
                            currentAccordion.classList.contains(
                                "open"
                            );

                        /*
                          Independent accordion behavior:
                          opening Exclusions / Itinerary / Accommodation /
                          Meet Up & Pick Up no longer closes sections that
                          are already open. This keeps package comparisons
                          visible at the same time.
                        */
                        currentAccordion.classList.toggle(
                            "open",
                            !isOpen
                        );

                        trigger.setAttribute(
                            "aria-expanded",
                            String(!isOpen)
                        );

                    }
                );

            });



        const selectAccommodationCard = (
            accommodationCard
        ) => {

            state.selectedAccommodationId =
                accommodationCard.dataset
                    .tourAccommodationCard ||
                "";

            state.selectedAccommodationName =
                accommodationCard.dataset
                    .tourAccommodationName ||
                "";

            /*
             * Update only the accommodation cards in place.
             * This keeps the Accommodation section open and
             * preserves the customer's current scroll position.
             */
            tourModalContent
                .querySelectorAll(
                    "[data-tour-accommodation-card]"
                )
                .forEach(card => {

                    const isSelected =
                        card.dataset
                            .tourAccommodationCard ===
                        state.selectedAccommodationId;

                    card.classList.toggle(
                        "selected",
                        isSelected
                    );

                    card.setAttribute(
                        "aria-pressed",
                        String(isSelected)
                    );

                    const status =
                        card.querySelector(
                            ".tw-accommodation-select-button"
                        );

                    if (status) {
                        status.classList.toggle(
                            "selected",
                            isSelected
                        );

                        status.innerHTML = `
                            <i class="${
                                isSelected
                                    ? "fa-solid fa-circle-check"
                                    : "fa-regular fa-circle"
                            }"></i>
                            ${
                                isSelected
                                    ? "Selected"
                                    : "Tap anywhere to select"
                            }
                        `;
                    }

                });

        };


        tourModalContent
            .querySelectorAll(
                "[data-tour-accommodation-card]"
            )
            .forEach(accommodationCard => {

                accommodationCard.addEventListener(
                    "click",
                    () => {
                        selectAccommodationCard(
                            accommodationCard
                        );
                    }
                );

                accommodationCard.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key !== "Enter" &&
                            event.key !== " "
                        ) {
                            return;
                        }

                        event.preventDefault();

                        selectAccommodationCard(
                            accommodationCard
                        );

                    }
                );

            });


        const selectPickupOption = (
            pickupButton
        ) => {

            state.selectedPickupLocation =
                pickupButton.dataset.tourPickup ||
                "";

            /*
             * Update the pickup choices in place instead of
             * re-rendering the whole package modal. This keeps
             * Meet Up & Pick Up open and preserves scroll position.
             */
            tourModalContent
                .querySelectorAll(
                    "[data-tour-pickup]"
                )
                .forEach(button => {

                    const isSelected =
                        normalizeText(
                            button.dataset.tourPickup
                        ) ===
                        normalizeText(
                            state.selectedPickupLocation
                        );

                    button.classList.toggle(
                        "selected",
                        isSelected
                    );

                    const icon =
                        button.querySelector(
                            ".tw-pickup-radio i"
                        );

                    if (icon) {
                        icon.className =
                            isSelected
                                ? "fa-solid fa-circle-check"
                                : "fa-regular fa-circle";
                    }

                    const helperText =
                        button.querySelector(
                            "small"
                        );

                    if (helperText) {
                        helperText.textContent =
                            isSelected
                                ? "Selected pickup point"
                                : "Select this pickup point";
                    }

                });

        };


        tourModalContent
            .querySelectorAll(
                "[data-tour-pickup]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {
                        selectPickupOption(
                            button
                        );
                    }
                );

            });


        tourModalContent
            .querySelectorAll(
                "[data-package-option]"
            )
            .forEach(
                optionButton => {

                    optionButton.addEventListener(
                        "click",
                        () => {

                            const nextPackageId =
                                optionButton.dataset.packageOption ||
                                "";

                            if (
                                !nextPackageId ||
                                nextPackageId ===
                                state.selectedPackage?.id
                            ) {
                                return;
                            }

                            openTourDetails(
                                nextPackageId
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


/* EXACT OPTION ID is forwarded to Booking so 2D1N / 3D2N stay separate. */
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

    const params =
        new URLSearchParams();

    params.set(
        "package",
        packageItem.id
    );

    if (state.selectedAccommodationId) {
        params.set(
            "accommodation",
            state.selectedAccommodationId
        );
    }

    if (state.selectedAccommodationName) {
        params.set(
            "accommodationName",
            state.selectedAccommodationName
        );
    }

    if (state.selectedPickupLocation) {
        params.set(
            "pickup",
            state.selectedPickupLocation
        );
    }

    window.location.href =
        `booking.html?${params.toString()}`;
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
