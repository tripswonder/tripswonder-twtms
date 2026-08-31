// ======================================================
// TRIPS WONDER - ADMIN PACKAGES
// FULL PACKAGE MANAGEMENT MODULE
// ======================================================

import {
    db,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc
} from "../firebase/firebase-db.js";

import {
    requireAuth
} from "../auth/auth-guard.js";

import {
    storage,
    ref,
    uploadBytes,
    getDownloadURL
} from "../firebase/firebase-storage.js";

import {
    showLoading,
    hideLoading,
    showLoadingError
} from "../shared/loading-screen.js";


// =========================================
// PACKAGE PAGE ACCESS
// =========================================

requireAuth({

    allowedRoles: [
        "owner",
        "admin"
    ],

    requiredPermission:
        "packages",

    onAuthorized: (
        user,
        profile
    ) => {

        console.log(
            "PACKAGES ACCESS GRANTED:",
            {
                uid: user.uid,
                role: profile.role,
                packages:
                    profile.permissions?.packages
            }
        );

    }

});


// ======================================================
// DOM READY
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // ======================================================
        // STATE
        // ======================================================

        let packages = [];

        let editingPackageId = null;

        let packageGalleryFiles = [];

        let existingGalleryPhotos = [];

        let accommodationCount = 0;

        let exclusionCount = 0;


        // ======================================================
        // PACKAGE PAGE ELEMENTS
        // ======================================================

        const packageGrid =
            document.getElementById(
                "packageGrid"
            );

        const searchInput =
            document.getElementById(
                "packageSearch"
            );

        const categoryFilter =
            document.getElementById(
                "packageFilter"
            );

        const statusFilter =
            document.getElementById(
                "packageStatusFilter"
            );

        const sortSelect =
            document.getElementById(
                "packageSort"
            );


        // ======================================================
        // SUMMARY ELEMENTS
        // ======================================================

        const totalPackagesElement =
            document.getElementById(
                "totalPackages"
            );

        const activePackagesElement =
            document.getElementById(
                "activePackages"
            );

        const hiddenPackagesElement =
            document.getElementById(
                "hiddenPackages"
            );

        const packageCategoriesElement =
            document.getElementById(
                "packageCategories"
            );

        const packageResultText =
            document.getElementById(
                "packageResultText"
            );


        // ======================================================
        // ADD PACKAGE
        // ======================================================

        const addButton =
            document.getElementById(
                "addPackageButton"
            );


        // ======================================================
        // MODAL ELEMENTS
        // ======================================================

        const packageModal =
            document.getElementById(
                "packageModal"
            );

        const closePackageModal =
            document.getElementById(
                "closePackageModal"
            );

        const cancelPackage =
            document.getElementById(
                "cancelPackage"
            );

        const packageModalOverlay =
            document.getElementById(
                "packageModalOverlay"
            );

        const packageForm =
            document.getElementById(
                "packageForm"
            );


        // ======================================================
        // INCLUSIONS
        // ======================================================

        const inclusionsList =
            document.getElementById(
                "inclusionsList"
            );

        const addInclusion =
            document.getElementById(
                "addInclusion"
            );

            // ======================================================
// PICK UP LOCATION ELEMENTS
// ======================================================

const pickupLocationList =
    document.getElementById(
        "pickupLocationList"
    );

const addPickupLocation =
    document.getElementById(
        "addPickupLocation"
    );


        // ======================================================
        // EXCLUSIONS
        // ======================================================

        const exclusionsList =
            document.getElementById(
                "exclusionsList"
            );

        const addExclusion =
            document.getElementById(
                "addExclusion"
            );


        // ======================================================
        // ACCOMMODATION
        // ======================================================

        const accommodationList =
            document.getElementById(
                "accommodationList"
            );

        const addAccommodation =
            document.getElementById(
                "addAccommodation"
            );



// ======================================================
// ADD PICK UP LOCATION ROW
// ======================================================

function addPickupLocationRow(
    value = ""
) {

    if (!pickupLocationList) {
        return;
    }

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "dynamic-row pickup-location-row";

    row.innerHTML = `

        <input
            type="text"
            class="pickup-location-input"
            placeholder="e.g. Greenfield Shaw"
            value="${escapeHtml(value)}"
        >

        <button
            type="button"
            class="remove-row remove-pickup-location"
            aria-label="Remove pick up location"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>

    `;

    const removeButton =
        row.querySelector(
            ".remove-pickup-location"
        );

    removeButton?.addEventListener(
        "click",
        () => {

            row.remove();

            if (
                pickupLocationList
                    .querySelectorAll(
                        ".pickup-location-row"
                    ).length === 0
            ) {

                addPickupLocationRow();

            }

        }
    );

    pickupLocationList.appendChild(
        row
    );

}

// ======================================================
// ADD PICK UP LOCATION BUTTON
// ======================================================

addPickupLocation?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        addPickupLocationRow();

    }
);


        // ======================================================
        // PACKAGE GALLERY
        // ======================================================

        const packagePhotos =
            document.getElementById(
                "packagePhotos"
            );

        const uploadPhotosButton =
            document.getElementById(
                "uploadPhotosButton"
            );

        const photoPreviewGrid =
            document.getElementById(
                "photoPreviewGrid"
            );


        // ======================================================
        // HTML ESCAPE
        // ======================================================

        function escapeHtml(value) {

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


        // ======================================================
        // GET INPUT VALUE
        // ======================================================

        function getInputValue(id) {

            const element =
                document.getElementById(id);

            if (!element) {
                return "";
            }

            return (
                element.value || ""
            ).trim();

        }


        // ======================================================
        // SET INPUT VALUE
        // ======================================================

        function setInputValue(
            id,
            value
        ) {

            const element =
                document.getElementById(id);

            if (!element) {
                return;
            }

            element.value =
                value ?? "";

        }


        // ======================================================
        // NORMALIZE PRICE
        // ======================================================

        function normalizePrice(value) {

            const cleaned =
                String(
                    value ?? ""
                )
                    .replace(
                        /,/g,
                        ""
                    )
                    .replace(
                        /[^0-9.-]/g,
                        ""
                    );


            const number =
                Number(
                    cleaned
                );


            return Number.isFinite(number)
                ? number
                : 0;

        }


        // ======================================================
        // GET TIMESTAMP
        // ======================================================

        function getTimestamp(value) {

            if (!value) {
                return 0;
            }


            const parsed =
                Date.parse(
                    value
                );


            return Number.isNaN(parsed)
                ? 0
                : parsed;

        }



        // ======================================================
        // PACKAGE PRICING RULE HELPERS
        // ======================================================

        function getNumberInputValue(
            id,
            fallback = 0
        ) {

            const element =
                document.getElementById(id);

            const value =
                Number(
                    element?.value
                );

            return Number.isFinite(value)
                ? value
                : fallback;

        }


        function updatePackageRuleVisibility() {

            const kidsEnabled =
                document.getElementById(
                    "kidsPricingEnabled"
                )?.checked === true;

            const exclusiveEnabled =
                document.getElementById(
                    "exclusiveTourEnabled"
                )?.checked === true;


            const kidsFields =
                document.getElementById(
                    "kidsPricingFields"
                );

            const exclusiveFields =
                document.getElementById(
                    "exclusiveTourFields"
                );


            kidsFields?.classList.toggle(
                "rule-disabled",
                !kidsEnabled
            );

            exclusiveFields?.classList.toggle(
                "rule-disabled",
                !exclusiveEnabled
            );

        }



        // ======================================================
        // REGULAR SCHEDULE SETTINGS
        // ======================================================

        const scheduleDayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];

        function updateScheduleSettingsVisibility() {

            const regularEnabled =
                document.getElementById(
                    "regularScheduleEnabled"
                )?.checked === true;

            const day0IsEnabled =
                document.getElementById(
                    "day0Enabled"
                )?.checked === true;

            document
                .getElementById(
                    "regularScheduleFields"
                )
                ?.classList.toggle(
                    "rule-disabled",
                    !regularEnabled
                );

            document
                .getElementById(
                    "day0ScheduleFields"
                )
                ?.classList.toggle(
                    "rule-disabled",
                    !day0IsEnabled
                );

            updateRegularSchedulePreview();
        }


        function updateRegularSchedulePreview() {

            const preview =
                document.getElementById(
                    "regularSchedulePreview"
                );

            if (!preview) {
                return;
            }

            const enabled =
                document.getElementById(
                    "regularScheduleEnabled"
                )?.checked === true;

            const startDay =
                Math.min(
                    6,
                    Math.max(
                        0,
                        getNumberInputValue(
                            "regularStartDay",
                            5
                        )
                    )
                );

            const durationDays =
                Math.max(
                    1,
                    getNumberInputValue(
                        "regularDurationDays",
                        3
                    )
                );

            const endDay =
                (
                    startDay +
                    durationDays -
                    1
                ) % 7;

            const nights =
                Math.max(
                    0,
                    durationDays - 1
                );

            preview.textContent =
                enabled
                    ? `${scheduleDayNames[startDay]} → ${scheduleDayNames[endDay]} • ${durationDays}D${nights}N`
                    : "Regular schedule disabled";
        }


        document
            .getElementById(
                "regularScheduleEnabled"
            )
            ?.addEventListener(
                "change",
                updateScheduleSettingsVisibility
            );

        document
            .getElementById(
                "day0Enabled"
            )
            ?.addEventListener(
                "change",
                updateScheduleSettingsVisibility
            );

        document
            .getElementById(
                "regularStartDay"
            )
            ?.addEventListener(
                "change",
                updateRegularSchedulePreview
            );

        document
            .getElementById(
                "regularDurationDays"
            )
            ?.addEventListener(
                "input",
                updateRegularSchedulePreview
            );


        document
            .getElementById(
                "kidsPricingEnabled"
            )
            ?.addEventListener(
                "change",
                updatePackageRuleVisibility
            );


        document
            .getElementById(
                "exclusiveTourEnabled"
            )
            ?.addEventListener(
                "change",
                updatePackageRuleVisibility
            );


        // ======================================================
        // LOAD PACKAGES
        // ======================================================

        async function loadPackages() {

            showLoading({

                title:
                    "Loading Packages...",

                message:
                    "Please wait while we load your travel packages.",

                retry:
                    loadPackages

            });


            try {

                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            "packages"
                        )
                    );


                packages =
                    snapshot.docs.map(
                        docSnapshot => {

                            const data =
                                docSnapshot.data();


                            return {

                                id:
                                    docSnapshot.id,

                                name:
                                    data.name ||
                                    "",

                                category:
                                    data.category ||
                                    "",

                                location:
                                    data.location ||
                                    "",

                                price:
                                    data.price ||
                                    "",

                                duration:
                                    data.duration ||
                                    "",

                                description:
                                    data.description ||
                                    "",

                                about:
                                    data.about ||
                                    "",

                                status:
                                    data.status ||
                                    "active",

                                gallery:
                                    Array.isArray(
                                        data.gallery
                                    )
                                        ? data.gallery
                                        : [],

                                inclusions:
                                    Array.isArray(
                                        data.inclusions
                                    )
                                        ? data.inclusions
                                        : [],

                                exclusions:
                                    Array.isArray(
                                        data.exclusions
                                    )
                                        ? data.exclusions
                                        : [],

                                pickupLocations:
                                    Array.isArray(
                                        data.pickupLocations
                                    )
                                        ? data.pickupLocations
                                        : [],

                                accommodations:
                                    Array.isArray(
                                        data.accommodations
                                    )
                                        ? data.accommodations
                                        : [],

                                itinerary:
                                    data.itinerary ||
                                    { day0: [], day1: [], day2: [], day3: [], notes: "" },

                                passengerPricing:
                                    data.passengerPricing ||
                                    {
                                        kidsPricingEnabled: false,
                                        childFreeMaxAge: 3,
                                        childDiscountMinAge: 4,
                                        childDiscountMaxAge: 8,
                                        childDiscountAmount: 500
                                    },

                                exclusiveTour:
                                    data.exclusiveTour ||
                                    {
                                        enabled: false,
                                        minimumPayingPax: 12,
                                        freeStartsAt: 13,
                                        freePax: 1,
                                        maxFreePax: 1
                                    },

                                scheduleSettings:
                                    data.scheduleSettings ||
                                    {
                                        enabled: false,
                                        startDay: 5,
                                        durationDays: 3,
                                        day0Enabled: true,
                                        day0Offset: -1,
                                        pickupStartTime: "",
                                        pickupEndTime: "",
                                        departureNote: ""
                                    },

                                createdAt:
                                    data.createdAt ||
                                    "",

                                updatedAt:
                                    data.updatedAt ||
                                    "",

                                image:
                                    data.gallery?.[0]?.url ||
                                    data.image ||
                                    ""

                            };

                        }
                    );


                console.log(
                    "PACKAGES LOADED FROM FIRESTORE:",
                    packages
                );


                renderPackages();

                hideLoading();


            } catch (error) {

                console.error(
                    "FAILED TO LOAD PACKAGES:",
                    error
                );


                showLoadingError(
                    navigator.onLine
                        ? "Unable to load Packages. Please try again."
                        : "No internet connection. Check your connection and try again.",
                    loadPackages
                );

            }

        }


        // ======================================================
        // UPDATE PACKAGE SUMMARY
        // ======================================================

        function updatePackageSummary() {

            const total =
                packages.length;


            const active =
                packages.filter(
                    item =>
                        (
                            item.status ||
                            "active"
                        ) ===
                        "active"
                ).length;


            const hidden =
                packages.filter(
                    item =>
                        (
                            item.status ||
                            "active"
                        ) ===
                        "hidden"
                ).length;


            const categories =
                new Set(
                    packages
                        .map(
                            item =>
                                (
                                    item.category ||
                                    ""
                                ).trim()
                        )
                        .filter(Boolean)
                );


            if (
                totalPackagesElement
            ) {

                totalPackagesElement
                    .textContent =
                    String(total);

            }


            if (
                activePackagesElement
            ) {

                activePackagesElement
                    .textContent =
                    String(active);

            }


            if (
                hiddenPackagesElement
            ) {

                hiddenPackagesElement
                    .textContent =
                    String(hidden);

            }


            if (
                packageCategoriesElement
            ) {

                packageCategoriesElement
                    .textContent =
                    String(
                        categories.size
                    );

            }

        }


        // ======================================================
        // RENDER PACKAGES
        // ======================================================

        function renderPackages() {

            if (!packageGrid) {
                return;
            }


            // Always show actual Firestore totals.

            updatePackageSummary();


            // ==================================================
            // FILTER VALUES
            // ==================================================

            const searchValue =
                searchInput?.value
                    ?.trim()
                    .toLowerCase() ||
                "";


            const selectedCategory =
                categoryFilter?.value ||
                "all";


            const selectedStatus =
                statusFilter?.value ||
                "all";


            const selectedSort =
                sortSelect?.value ||
                "newest";


            // ==================================================
            // SEARCH / FILTER
            // ==================================================

            let filteredPackages =
                packages.filter(
                    packageItem => {


                        const searchableText =
                            [

                                packageItem.name,

                                packageItem.category,

                                packageItem.location,

                                packageItem.duration

                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();


                        const matchesSearch =
                            !searchValue ||
                            searchableText.includes(
                                searchValue
                            );


                        const matchesCategory =
                            selectedCategory ===
                                "all" ||
                            packageItem.category ===
                                selectedCategory;


                        const packageStatus =
                            packageItem.status ||
                            "active";


                        const matchesStatus =
                            selectedStatus ===
                                "all" ||
                            packageStatus ===
                                selectedStatus;


                        return (
                            matchesSearch &&
                            matchesCategory &&
                            matchesStatus
                        );

                    }
                );


            // ==================================================
            // SORT
            // ==================================================

            filteredPackages =
                [
                    ...filteredPackages
                ].sort(
                    (
                        a,
                        b
                    ) => {

                        switch (
                            selectedSort
                        ) {


                            // ----------------------------------
                            // OLDEST FIRST
                            // ----------------------------------

                            case "oldest":

                                return (
                                    getTimestamp(
                                        a.createdAt
                                    ) -
                                    getTimestamp(
                                        b.createdAt
                                    )
                                );


                            // ----------------------------------
                            // NAME A-Z
                            // ----------------------------------

                            case "name-asc":

                                return (
                                    a.name ||
                                    ""
                                ).localeCompare(
                                    b.name ||
                                    "",
                                    undefined,
                                    {
                                        sensitivity:
                                            "base"
                                    }
                                );


                            // ----------------------------------
                            // NAME Z-A
                            // ----------------------------------

                            case "name-desc":

                                return (
                                    b.name ||
                                    ""
                                ).localeCompare(
                                    a.name ||
                                    "",
                                    undefined,
                                    {
                                        sensitivity:
                                            "base"
                                    }
                                );


                            // ----------------------------------
                            // PRICE LOW-HIGH
                            // ----------------------------------

                            case "price-low":

                                return (
                                    normalizePrice(
                                        a.price
                                    ) -
                                    normalizePrice(
                                        b.price
                                    )
                                );


                            // ----------------------------------
                            // PRICE HIGH-LOW
                            // ----------------------------------

                            case "price-high":

                                return (
                                    normalizePrice(
                                        b.price
                                    ) -
                                    normalizePrice(
                                        a.price
                                    )
                                );


                            // ----------------------------------
                            // NEWEST FIRST
                            // ----------------------------------

                            case "newest":

                            default:

                                return (
                                    getTimestamp(
                                        b.createdAt
                                    ) -
                                    getTimestamp(
                                        a.createdAt
                                    )
                                );

                        }

                    }
                );


            // ==================================================
            // RESULT COUNT
            // ==================================================

            if (
                packageResultText
            ) {

                if (
                    filteredPackages.length ===
                    packages.length
                ) {

                    packageResultText
                        .textContent =
                        `Showing all ${
                            packages.length
                        } ${
                            packages.length ===
                            1
                                ? "package"
                                : "packages"
                        }`;

                } else {

                    packageResultText
                        .textContent =
                        `Showing ${
                            filteredPackages.length
                        } of ${
                            packages.length
                        } packages`;

                }

            }


            // ==================================================
            // CLEAR PACKAGE GRID
            // ==================================================

            packageGrid.innerHTML =
                "";


            // ==================================================
            // EMPTY STATE
            // ==================================================

            if (
                filteredPackages.length ===
                0
            ) {

                packageGrid.innerHTML = `

                    <div
                        class="package-empty-state"
                    >

                        <div
                            class="package-empty-icon"
                        >

                            <i
                                class="fa-solid fa-suitcase-rolling"
                            ></i>

                        </div>


                        <strong>
                            No packages found
                        </strong>


                        <span>
                            Try changing your search,
                            category, status or sort.
                        </span>

                    </div>

                `;


                return;

            }


            // ==================================================
            // CREATE PACKAGE CARDS
            // ==================================================

            filteredPackages.forEach(
                packageItem => {


                    const card =
                        document.createElement(
                            "article"
                        );


                    card.className =
                        "package-card";


                    const image =
                        packageItem
                            .gallery?.[0]?.url ||
                        packageItem.image ||
                        "";


                    const category =
                        packageItem.category ||
                        "Other";


                    const location =
                        packageItem.location ||
                        "Location not specified";


                    const price =
                        packageItem.price ||
                        "TBD";


                    const duration =
                        packageItem.duration ||
                        "";


                    const status =
                        packageItem.status ||
                        "active";


                    const priceDuration =
                        duration
                            ? `

                                <span
                                    class="package-price-main"
                                >

                                    From ₱${escapeHtml(
                                        price
                                    )}

                                </span>


                                <span
                                    class="duration"
                                >

                                    / ${escapeHtml(
                                        duration
                                    )}

                                </span>

                              `
                            : `

                                <span
                                    class="package-price-main"
                                >

                                    From ₱${escapeHtml(
                                        price
                                    )}

                                </span>

                              `;


                    card.innerHTML = `

                        <div
                            class="package-card-image"
                        >

                            ${
                                image
                                    ? `

                                        <img
                                            src="${escapeHtml(
                                                image
                                            )}"
                                            alt="${escapeHtml(
                                                packageItem.name
                                            )}"
                                        >

                                      `
                                    : `

                                        <div
                                            class="package-card-image-placeholder"
                                        >

                                            <i
                                                class="fa-solid fa-image"
                                            ></i>

                                        </div>

                                      `
                            }


                            <span
                                class="package-category"
                            >

                                ${escapeHtml(
                                    category
                                )}

                            </span>

                        </div>


                        <div
                            class="package-card-body"
                        >

                            <h3>

                                ${escapeHtml(
                                    packageItem.name
                                )}

                            </h3>


                            <div
                                class="package-location"
                            >

                                <i
                                    class="fa-solid fa-location-dot"
                                ></i>


                                <span>

                                    ${escapeHtml(
                                        location
                                    )}

                                </span>

                            </div>


                            <div
                                class="package-price"
                            >

                                ${priceDuration}

                            </div>

                        </div>


                        <div
                            class="package-card-footer"
                        >

                            <span
                                class="status ${status}"
                            >

                                <span
                                    class="status-dot"
                                ></span>


                                ${
                                    status ===
                                    "active"
                                        ? "Active"
                                        : "Hidden"
                                }

                            </span>


                            <div
                                class="package-actions"
                            >


                                <button
                                    class="package-edit-btn edit-package-btn"
                                    type="button"
                                    title="Edit Package"
                                    aria-label="Edit ${escapeHtml(
                                        packageItem.name
                                    )}"
                                    data-id="${packageItem.id}"
                                >

                                    <i
                                        class="fa-regular fa-pen-to-square"
                                    ></i>


                                    <span>
                                        Edit
                                    </span>

                                </button>


                                <div
                                    class="package-more-wrap"
                                >


                                    <button
                                        class="package-more-btn"
                                        type="button"
                                        title="More Options"
                                        aria-label="More options for ${escapeHtml(
                                            packageItem.name
                                        )}"
                                        aria-expanded="false"
                                        data-id="${packageItem.id}"
                                    >

                                        <i
                                            class="fa-solid fa-ellipsis"
                                        ></i>

                                    </button>


                                    <div
                                        class="package-more-menu"
                                        role="menu"
                                    >


                                        <button
                                            type="button"
                                            class="package-more-menu-item package-menu-edit"
                                            role="menuitem"
                                            data-id="${packageItem.id}"
                                        >

                                            <i
                                                class="fa-regular fa-pen-to-square"
                                            ></i>


                                            <span>
                                                Edit package
                                            </span>

                                        </button>


                                        <button
                                            type="button"
                                            class="package-more-menu-item package-menu-status"
                                            role="menuitem"
                                            data-id="${packageItem.id}"
                                            data-status="${status}"
                                        >

                                            <i
                                                class="fa-regular ${
                                                    status ===
                                                    "active"
                                                        ? "fa-eye-slash"
                                                        : "fa-eye"
                                                }"
                                            ></i>


                                            <span>

                                                ${
                                                    status ===
                                                    "active"
                                                        ? "Hide package"
                                                        : "Show package"
                                                }

                                            </span>

                                        </button>


                                    </div>

                                </div>

                            </div>

                        </div>

                    `;


                    packageGrid.appendChild(
                        card
                    );

                }
            );

        }

                // ======================================================
        // OPEN MODAL
        // ======================================================

        function openPackageModal() {

            if (!packageModal) {
                return;
            }


            packageModal.classList.add(
                "show"
            );


            packageModal.setAttribute(
                "aria-hidden",
                "false"
            );


            document.body.style.overflow =
                "hidden";

        }


        // ======================================================
        // CLOSE MODAL
        // ======================================================

        function closeModal() {

            if (!packageModal) {
                return;
            }


            if (
                packageModal.contains(
                    document.activeElement
                )
            ) {

                document.activeElement.blur();

            }


            packageModal.classList.remove(
                "show"
            );


            packageModal.setAttribute(
                "aria-hidden",
                "true"
            );


            document.body.style.overflow =
                "";

        }


        // ======================================================
        // RESET PACKAGE FORM
        // ======================================================

        function resetPackageForm() {

            editingPackageId =
                null;


            if (
                packageForm
            ) {

                packageForm.reset();

            }

            resetItineraryBuilder();


            setInputValue(
                "formStatus",
                "active"
            );


            const kidsPricingEnabled =
                document.getElementById(
                    "kidsPricingEnabled"
                );

            const exclusiveTourEnabled =
                document.getElementById(
                    "exclusiveTourEnabled"
                );


            if (kidsPricingEnabled) {
                kidsPricingEnabled.checked = false;
            }

            if (exclusiveTourEnabled) {
                exclusiveTourEnabled.checked = false;
            }


            setInputValue(
                "childFreeMaxAge",
                3
            );

            setInputValue(
                "childDiscountMinAge",
                4
            );

            setInputValue(
                "childDiscountMaxAge",
                8
            );

            setInputValue(
                "childDiscountAmount",
                500
            );

            setInputValue(
                "exclusiveMinimumPayingPax",
                12
            );

            setInputValue(
                "exclusiveFreeStartsAt",
                13
            );

            setInputValue(
                "exclusiveFreePax",
                1
            );

            setInputValue(
                "exclusiveMaxFreePax",
                1
            );


            updatePackageRuleVisibility();


            const regularScheduleEnabled =
                document.getElementById(
                    "regularScheduleEnabled"
                );

            const day0Enabled =
                document.getElementById(
                    "day0Enabled"
                );

            if (regularScheduleEnabled) {
                regularScheduleEnabled.checked = false;
            }

            if (day0Enabled) {
                day0Enabled.checked = true;
            }

            setInputValue(
                "regularStartDay",
                5
            );

            setInputValue(
                "regularDurationDays",
                3
            );

            setInputValue(
                "day0Offset",
                -1
            );

            setInputValue(
                "pickupStartTime",
                ""
            );

            setInputValue(
                "pickupEndTime",
                ""
            );

            setInputValue(
                "departureNote",
                ""
            );

            updateScheduleSettingsVisibility();


            // ==============================================
            // INCLUSIONS
            // ==============================================

            if (
                inclusionsList
            ) {

                inclusionsList.innerHTML =
                    "";


                addInclusionRow();

            }


            // ==============================================
            // EXCLUSIONS
            // ==============================================

            if (
                exclusionsList
            ) {

                exclusionsList.innerHTML =
                    "";


                exclusionCount =
                    0;


                addExclusionItem();

            }

            // ==================================================
// RESET PICK UP LOCATIONS
// ==================================================

if (pickupLocationList) {

    pickupLocationList.innerHTML = "";

    addPickupLocationRow();

}

            // ==================================================
// PICK UP LOCATIONS
// ==================================================

if (
    pickupLocationList
) {

    pickupLocationList.innerHTML =
        "";

    const pickupLocations =
        Array.isArray(
            packageItem.pickupLocations
        )
            ? packageItem.pickupLocations
            : [];

    if (
        pickupLocations.length >
        0
    ) {

        pickupLocations.forEach(
            value => {

                addPickupLocationRow(
                    value
                );

            }
        );

    } else {

        addPickupLocationRow();

    }

}


            // ==============================================
            // ACCOMMODATIONS
            // ==============================================

            if (
                accommodationList
            ) {

                accommodationList.innerHTML =
                    "";

            }


            accommodationCount =
                0;


            // ==============================================
            // GALLERY
            // ==============================================

            packageGalleryFiles =
                [];


            existingGalleryPhotos =
                [];


            if (
                packagePhotos
            ) {

                packagePhotos.value =
                    "";

            }


            renderPackageGallery();

        }


        // ======================================================
        // NEW PACKAGE
        // ======================================================

        function openNewPackageModal() {

            resetPackageForm();

            openPackageModal();

        }


        // ======================================================
        // INCLUSIONS
        // ======================================================

        function addInclusionRow(
            value = ""
        ) {

            if (
                !inclusionsList
            ) {
                return;
            }


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "dynamic-row";


            row.innerHTML = `

                <input
                    type="text"
                    value="${escapeHtml(
                        value
                    )}"
                    placeholder="Enter package inclusion"
                >


                <button
                    type="button"
                    class="remove-row"
                    title="Remove inclusion"
                    aria-label="Remove inclusion"
                >

                    <i
                        class="fa-solid fa-xmark"
                    ></i>

                </button>

            `;


            const removeButton =
                row.querySelector(
                    ".remove-row"
                );


            removeButton?.addEventListener(
                "click",
                () => {

                    row.remove();


                    if (
                        inclusionsList
                            .children
                            .length === 0
                    ) {

                        addInclusionRow();

                    }

                }
            );


            inclusionsList.appendChild(
                row
            );

        }


        // ======================================================
        // EXCLUSIONS
        // ======================================================

        function addExclusionItem(
            value = ""
        ) {

            if (
                !exclusionsList
            ) {
                return;
            }


            exclusionCount++;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "dynamic-row";


            item.innerHTML = `

                <div
                    class="exclusion-number"
                >

                    <span>
                        ${exclusionCount}
                    </span>

                </div>


                <input
                    type="text"
                    class="exclusion-input"
                    value="${escapeHtml(
                        value
                    )}"
                    placeholder="e.g. Personal expenses"
                >


                <button
                    type="button"
                    class="remove-exclusion"
                    title="Remove exclusion"
                    aria-label="Remove exclusion"
                >

                    <i
                        class="fa-solid fa-xmark"
                    ></i>

                </button>

            `;


            exclusionsList.appendChild(
                item
            );


            const removeButton =
                item.querySelector(
                    ".remove-exclusion"
                );


            removeButton?.addEventListener(
                "click",
                () => {

                    item.remove();


                    renumberExclusions();


                    if (
                        exclusionsList
                            .children
                            .length === 0
                    ) {

                        addExclusionItem();

                    }

                }
            );

        }


        // ======================================================
        // RENUMBER EXCLUSIONS
        // ======================================================

        function renumberExclusions() {

            if (
                !exclusionsList
            ) {
                return;
            }


            const items =
                exclusionsList.querySelectorAll(
                    ".dynamic-row"
                );


            items.forEach(
                (
                    item,
                    index
                ) => {

                    const number =
                        item.querySelector(
                            ".exclusion-number span"
                        );


                    if (
                        number
                    ) {

                        number.textContent =
                            String(
                                index + 1
                            );

                    }

                }
            );


            exclusionCount =
                items.length;

        }


        // ======================================================
        // ACCOMMODATION
        // ======================================================

        function addAccommodationCard(
            accommodation = {}
        ) {

            if (!accommodationList) return;

            accommodationCount++;

            const card = document.createElement("div");
            card.className = "accommodation-card";

            const legacyPhoto =
                accommodation.mainPhoto ||
                accommodation.coverPhoto ||
                accommodation.photo ||
                "";

            const existingGallery =
                Array.isArray(accommodation.gallery)
                    ? accommodation.gallery
                        .map(item =>
                            typeof item === "string"
                                ? item
                                : item?.url
                        )
                        .filter(Boolean)
                    : [];

            card.dataset.existingPhoto = legacyPhoto;
            card.dataset.existingGallery =
                JSON.stringify(existingGallery);
            card.dataset.accommodationId =
                accommodation.id ||
                "";

            const amenitiesValue =
                Array.isArray(accommodation.amenities)
                    ? accommodation.amenities.join("\n")
                    : (accommodation.amenities || "");

            const maxGuests =
                Number(accommodation.maxGuests) ||
                Number(
                    String(accommodation.capacity || "")
                        .match(/\d+/)?.[0]
                ) ||
                2;

            const pricePerNight =
                normalizePrice(
                    accommodation.pricePerNight ??
                    accommodation.price ??
                    0
                );

            const resortName =
                accommodation.resortName ||
                accommodation.resort ||
                "";

            const defaultAvailableUnits =
                Math.max(
                    0,
                    Number(
                        accommodation.defaultAvailableUnits ??
                        accommodation.defaultUnits ??
                        accommodation.availableUnits ??
                        0
                    ) || 0
                );

            const isActive =
                accommodation.active !== false &&
                accommodation.status !== "hidden";

            card.innerHTML = `

                <div class="accommodation-card-header">

                    <div class="accommodation-card-heading">

                        <span class="accommodation-card-icon">
                            <i class="fa-solid fa-bed"></i>
                        </span>

                        <div>
                            <strong>
                                Accommodation ${accommodationCount}
                            </strong>
                            <small>
                                Photos, room details and per-night pricing
                            </small>
                        </div>

                    </div>

                    <div class="accommodation-card-actions">
                        <button
                            type="button"
                            class="toggle-accommodation"
                            aria-expanded="false"
                        >
                            <i class="fa-solid fa-chevron-down"></i>
                            <span>Edit</span>
                        </button>

                        <button
                        type="button"
                        class="remove-accommodation"
                        title="Remove accommodation"
                        aria-label="Remove accommodation ${accommodationCount}"
                    >
                        <i class="fa-regular fa-trash-can"></i>
                        <span>Remove</span>
                        </button>
                    </div>

                </div>

                <button
                    type="button"
                    class="accommodation-compact-summary"
                >
                    <strong class="compact-accommodation-name">
                        ${escapeHtml(accommodation.name || "New Accommodation")}
                    </strong>
                    <span class="compact-resort-name">
                        ${escapeHtml(resortName || "Resort not set")}
                    </span>
                    <span class="compact-separator">•</span>
                    <span class="compact-units">
                        ${escapeHtml(defaultAvailableUnits)} unit${defaultAvailableUnits === 1 ? "" : "s"}
                    </span>
                </button>

                <div class="accommodation-layout">

                    <div class="accommodation-photo-column">

                        <label>Main Photo</label>

                        <div class="accommodation-photo-upload">

                            <input
                                type="file"
                                class="accommodation-photo-input"
                                accept="image/*"
                                hidden
                            >

                            <button
                                type="button"
                                class="accommodation-upload-button"
                            >
                                <span class="accommodation-upload-icon">
                                    <i class="fa-regular fa-image"></i>
                                </span>
                                <strong>Add Main Photo</strong>
                                <small>JPG, PNG or WEBP</small>
                            </button>

                            <div class="accommodation-photo-preview"></div>

                        </div>

                        <div class="accommodation-gallery-block">

                            <div class="accommodation-gallery-head">
                                <div>
                                    <strong>Other Photos</strong>
                                    <small>Shown inside the customer room modal.</small>
                                </div>

                                <button
                                    type="button"
                                    class="accommodation-gallery-add"
                                >
                                    <i class="fa-solid fa-plus"></i>
                                    Add Photos
                                </button>
                            </div>

                            <input
                                type="file"
                                class="accommodation-gallery-input"
                                accept="image/*"
                                multiple
                                hidden
                            >

                            <div class="accommodation-gallery-preview"></div>

                        </div>

                    </div>

                    <div class="accommodation-fields-column">

                        <div class="accommodation-grid">

                            <div class="accommodation-field full">
                                <label>Resort Name <span class="accommodation-required">*</span></label>
                                <input
                                    type="text"
                                    class="accommodation-resort-name"
                                    value="${escapeHtml(resortName)}"
                                    placeholder="e.g. Tala Resort"
                                    required
                                >
                                <small class="accommodation-field-help">
                                    Automatically follows this accommodation in Trip Operations.
                                </small>
                            </div>

                            <div class="accommodation-field full">
                                <label>Accommodation Name <span class="accommodation-required">*</span></label>
                                <input
                                    type="text"
                                    class="accommodation-name"
                                    required
                                    value="${escapeHtml(accommodation.name || "")}"
                                    placeholder="e.g. Solo Room Upgrade"
                                >
                            </div>

                            <div class="accommodation-field">
                                <label>Maximum Guests <span class="accommodation-required">*</span></label>
                                <input
                                    type="number"
                                    class="accommodation-max-guests"
                                    min="1"
                                    step="1"
                                    value="${escapeHtml(maxGuests)}"
                                    required
                                >
                            </div>

                            <div class="accommodation-field">
                                <label>Default Available Units <span class="accommodation-required">*</span></label>
                                <input
                                    type="number"
                                    class="accommodation-default-units"
                                    min="0"
                                    step="1"
                                    value="${escapeHtml(defaultAvailableUnits)}"
                                    required
                                >
                                <small class="accommodation-field-help">
                                    Starting inventory copied to newly created schedules.
                                </small>
                            </div>

                            <div class="accommodation-field">
                                <label>Option Type <span class="accommodation-required">*</span></label>
                                <select class="accommodation-type" required>
                                    <option
                                        value="included"
                                        ${accommodation.type === "included" ? "selected" : ""}
                                    >
                                        Included in Package
                                    </option>
                                    <option
                                        value="additional"
                                        ${
                                            accommodation.type === "additional" ||
                                            !accommodation.type
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Optional Upgrade
                                    </option>
                                </select>
                            </div>

                            <div class="accommodation-field">
                                <label>Price per Night <span class="accommodation-required">*</span></label>
                                <div class="accommodation-price-wrap">
                                    <span>₱</span>
                                    <input
                                        type="number"
                                        class="accommodation-price"
                                        min="0"
                                        step="0.01"
                                        value="${escapeHtml(pricePerNight)}"
                                        placeholder="1500"
                                    >
                                </div>
                                <small class="accommodation-field-help">
                                    Customer total = price × nights × rooms.
                                </small>
                            </div>

                            <div class="accommodation-field">
                                <label>Status <span class="accommodation-required">*</span></label>
                                <select class="accommodation-status" required>
                                    <option value="active" ${isActive ? "selected" : ""}>
                                        Active
                                    </option>
                                    <option value="hidden" ${!isActive ? "selected" : ""}>
                                        Hidden
                                    </option>
                                </select>
                            </div>

                            <div class="accommodation-field full">
                                <label>Room Description</label>
                                <textarea
                                    class="accommodation-description"
                                    rows="4"
                                    placeholder="Describe the room, location, sleeping setup, bathroom, air-conditioning, etc."
                                >${escapeHtml(accommodation.description || "")}</textarea>
                            </div>

                            <div class="accommodation-field full">
                                <label>Room Details / Amenities</label>
                                <textarea
                                    class="accommodation-amenities"
                                    rows="4"
                                    placeholder="One per line, e.g.&#10;Air-conditioned&#10;Private CR&#10;Beachfront&#10;Good for couples"
                                >${escapeHtml(amenitiesValue)}</textarea>
                                <small class="accommodation-field-help">
                                    Enter one detail per line. These will appear in the customer room details modal.
                                </small>
                            </div>

                        </div>

                    </div>

                </div>
            `;

            accommodationList.appendChild(card);

            updateAccommodationCompactSummary(card);
            setAccommodationCardExpanded(card, false);


            const accommodationTypeSelect =
                card.querySelector(".accommodation-type");

            const accommodationPriceInput =
                card.querySelector(".accommodation-price");

            function syncAccommodationPriceState() {
                if (
                    !accommodationTypeSelect ||
                    !accommodationPriceInput
                ) {
                    return;
                }

                const included =
                    accommodationTypeSelect.value ===
                    "included";

                if (included) {
                    accommodationPriceInput.value = "0";
                    accommodationPriceInput.disabled = true;
                } else {
                    accommodationPriceInput.disabled = false;
                }
            }

            accommodationTypeSelect?.addEventListener(
                "change",
                syncAccommodationPriceState
            );

            syncAccommodationPriceState();


            const photoInput =
                card.querySelector(".accommodation-photo-input");
            const uploadButton =
                card.querySelector(".accommodation-upload-button");
            const preview =
                card.querySelector(".accommodation-photo-preview");

            function renderMainPhoto(src) {
                if (!src) {
                    preview.innerHTML = "";
                    uploadButton.style.display = "flex";
                    return;
                }

                preview.innerHTML = `
                    <div class="accommodation-preview-image">
                        <img
                            src="${escapeHtml(src)}"
                            alt="Accommodation main photo"
                        >
                        <button
                            type="button"
                            class="remove-accommodation-photo"
                            title="Remove main photo"
                            aria-label="Remove accommodation main photo"
                        >
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;

                uploadButton.style.display = "none";
            }

            renderMainPhoto(legacyPhoto);

            uploadButton?.addEventListener(
                "click",
                () => photoInput?.click()
            );

            photoInput?.addEventListener(
                "change",
                () => {

                    const file =
                        photoInput.files?.[0];

                    if (!file) return;

                    if (!file.type.startsWith("image/")) {
                        alert("Please select a valid image file.");
                        photoInput.value = "";
                        return;
                    }

                    const reader =
                        new FileReader();

                    reader.onload =
                        event => {

                            renderMainPhoto(
                                event.target.result
                            );

                            card.dataset.existingPhoto =
                                "";

                        };

                    reader.readAsDataURL(file);

                }
            );

            preview?.addEventListener(
                "click",
                event => {

                    const removePhotoButton =
                        event.target.closest(
                            ".remove-accommodation-photo"
                        );

                    if (!removePhotoButton) return;

                    photoInput.value = "";
                    card.dataset.existingPhoto = "";
                    renderMainPhoto("");

                }
            );

            // ==============================================
            // ACCOMMODATION GALLERY
            // ==============================================

            const galleryInput =
                card.querySelector(
                    ".accommodation-gallery-input"
                );

            const galleryAddButton =
                card.querySelector(
                    ".accommodation-gallery-add"
                );

            const galleryPreview =
                card.querySelector(
                    ".accommodation-gallery-preview"
                );

            card._accommodationGalleryFiles = [];

            function getExistingGallery() {

                try {
                    return JSON.parse(
                        card.dataset.existingGallery ||
                        "[]"
                    );
                } catch {
                    return [];
                }

            }

            function renderAccommodationGallery() {

                const saved =
                    getExistingGallery();

                const newFiles =
                    card._accommodationGalleryFiles ||
                    [];

                const savedHtml =
                    saved.map(
                        (url, index) => `
                            <div class="accommodation-gallery-thumb">
                                <img
                                    src="${escapeHtml(url)}"
                                    alt="Saved room photo ${index + 1}"
                                >
                                <button
                                    type="button"
                                    class="remove-saved-accommodation-gallery"
                                    data-index="${index}"
                                    aria-label="Remove saved room photo"
                                >
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        `
                    ).join("");

                const newHtml =
                    newFiles.map(
                        (file, index) => `
                            <div class="accommodation-gallery-thumb">
                                <img
                                    src="${escapeHtml(
                                        URL.createObjectURL(file)
                                    )}"
                                    alt="New room photo ${index + 1}"
                                >
                                <button
                                    type="button"
                                    class="remove-new-accommodation-gallery"
                                    data-index="${index}"
                                    aria-label="Remove new room photo"
                                >
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        `
                    ).join("");

                galleryPreview.innerHTML =
                    savedHtml +
                    newHtml +
                    (
                        saved.length === 0 &&
                        newFiles.length === 0
                            ? `<div class="accommodation-gallery-empty">
                                   No additional photos yet.
                               </div>`
                            : ""
                    );

            }

            renderAccommodationGallery();

            galleryAddButton?.addEventListener(
                "click",
                () => galleryInput?.click()
            );

            galleryInput?.addEventListener(
                "change",
                () => {

                    const files =
                        Array.from(
                            galleryInput.files ||
                            []
                        ).filter(
                            file =>
                                file.type.startsWith(
                                    "image/"
                                )
                        );

                    if (files.length === 0) return;

                    card._accommodationGalleryFiles.push(
                        ...files
                    );

                    galleryInput.value = "";

                    renderAccommodationGallery();

                }
            );

            galleryPreview?.addEventListener(
                "click",
                event => {

                    const savedRemove =
                        event.target.closest(
                            ".remove-saved-accommodation-gallery"
                        );

                    if (savedRemove) {

                        const saved =
                            getExistingGallery();

                        saved.splice(
                            Number(savedRemove.dataset.index),
                            1
                        );

                        card.dataset.existingGallery =
                            JSON.stringify(saved);

                        renderAccommodationGallery();
                        return;

                    }

                    const newRemove =
                        event.target.closest(
                            ".remove-new-accommodation-gallery"
                        );

                    if (newRemove) {

                        card._accommodationGalleryFiles.splice(
                            Number(newRemove.dataset.index),
                            1
                        );

                        renderAccommodationGallery();

                    }

                }
            );

        }

        // ======================================================
        // COMPACT / EXPAND ACCOMMODATION
        // ======================================================

        function setAccommodationCardExpanded(
            card,
            expanded
        ) {
            if (!card) return;

            card.classList.toggle(
                "is-expanded",
                expanded
            );

            const toggle =
                card.querySelector(
                    ".toggle-accommodation"
                );

            toggle?.setAttribute(
                "aria-expanded",
                String(expanded)
            );

            const icon =
                toggle?.querySelector("i");

            const label =
                toggle?.querySelector("span");

            if (icon) {
                icon.className =
                    expanded
                        ? "fa-solid fa-chevron-up"
                        : "fa-solid fa-chevron-down";
            }

            if (label) {
                label.textContent =
                    expanded
                        ? "Minimize"
                        : "Edit";
            }
        }

        function updateAccommodationCompactSummary(
            card
        ) {
            if (!card) return;

            const name =
                card.querySelector(
                    ".accommodation-name"
                )?.value?.trim() ||
                "New Accommodation";

            const resort =
                card.querySelector(
                    ".accommodation-resort-name"
                )?.value?.trim() ||
                "Resort not set";

            const units =
                Math.max(
                    0,
                    Number(
                        card.querySelector(
                            ".accommodation-default-units"
                        )?.value
                    ) || 0
                );

            const nameEl =
                card.querySelector(
                    ".compact-accommodation-name"
                );

            const resortEl =
                card.querySelector(
                    ".compact-resort-name"
                );

            const unitsEl =
                card.querySelector(
                    ".compact-units"
                );

            if (nameEl) {
                nameEl.textContent = name;
            }

            if (resortEl) {
                resortEl.textContent = resort;
            }

            if (unitsEl) {
                unitsEl.textContent =
                    `${units} unit${units === 1 ? "" : "s"}`;
            }
        }

        accommodationList?.addEventListener(
            "click",
            event => {
                const toggle =
                    event.target.closest(
                        ".toggle-accommodation, .accommodation-compact-summary"
                    );

                if (!toggle) return;

                const card =
                    toggle.closest(
                        ".accommodation-card"
                    );

                if (!card) return;

                setAccommodationCardExpanded(
                    card,
                    !card.classList.contains(
                        "is-expanded"
                    )
                );
            }
        );

        accommodationList?.addEventListener(
            "input",
            event => {
                const card =
                    event.target.closest(
                        ".accommodation-card"
                    );

                if (card) {
                    updateAccommodationCompactSummary(
                        card
                    );
                }
            }
        );

        accommodationList?.addEventListener(
            "change",
            event => {
                const card =
                    event.target.closest(
                        ".accommodation-card"
                    );

                if (card) {
                    updateAccommodationCompactSummary(
                        card
                    );
                }
            }
        );


        // ======================================================
        // REMOVE ACCOMMODATION
        // ======================================================

        accommodationList?.addEventListener(
            "click",
            event => {


                const button =
                    event.target.closest(
                        ".remove-accommodation"
                    );


                if (
                    !button
                ) {
                    return;
                }


                const card =
                    button.closest(
                        ".accommodation-card"
                    );


                if (
                    !card
                ) {
                    return;
                }


                card.remove();


                const remainingCards =
                    accommodationList
                        .querySelectorAll(
                            ".accommodation-card"
                        );


                remainingCards.forEach(
                    (
                        accommodationCard,
                        index
                    ) => {


                        const title =
                            accommodationCard
                                .querySelector(
                                    ".accommodation-card-heading strong"
                                );


                        if (
                            title
                        ) {

                            title.textContent =
                                `Accommodation ${
                                    index + 1
                                }`;

                        }


                        const removeButton =
                            accommodationCard
                                .querySelector(
                                    ".remove-accommodation"
                                );


                        if (
                            removeButton
                        ) {

                            removeButton.setAttribute(
                                "aria-label",
                                `Remove accommodation ${
                                    index + 1
                                }`
                            );

                        }

                    }
                );


                accommodationCount =
                    remainingCards.length;

            }
        );


        // ======================================================
        // PACKAGE GALLERY
        // ======================================================

        function renderPackageGallery() {

            if (
                !photoPreviewGrid
            ) {
                return;
            }


            photoPreviewGrid.innerHTML =
                "";

                            // ==================================================
            // EXISTING FIREBASE PHOTOS
            // ==================================================

            existingGalleryPhotos.forEach(
                (
                    photo,
                    index
                ) => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "photo-preview-item";


                    item.innerHTML = `

                        <img
                            src="${escapeHtml(
                                photo.url ||
                                ""
                            )}"
                            alt="Package Photo ${
                                index + 1
                            }"
                        >


                        ${
                            index === 0
                                ? `

                                    <span
                                        class="main-photo-badge"
                                    >

                                        MAIN

                                    </span>

                                  `
                                : ""
                        }


                        <button
                            type="button"
                            class="remove-photo existing-photo"
                            data-existing-index="${index}"
                            title="Remove photo"
                            aria-label="Remove package photo ${
                                index + 1
                            }"
                        >

                            <i
                                class="fa-solid fa-trash-can"
                            ></i>

                        </button>

                    `;


                    photoPreviewGrid.appendChild(
                        item
                    );

                }
            );


            // ==================================================
            // NEW LOCAL PHOTOS
            // ==================================================

            packageGalleryFiles.forEach(
                (
                    file,
                    index
                ) => {

                    const reader =
                        new FileReader();


                    reader.onload =
                        event => {


                            const item =
                                document.createElement(
                                    "div"
                                );


                            item.className =
                                "photo-preview-item";


                            const isMainPhoto =
                                existingGalleryPhotos
                                    .length === 0 &&
                                index === 0;


                            item.innerHTML = `

                                <img
                                    src="${event.target.result}"
                                    alt="New Package Photo ${
                                        index + 1
                                    }"
                                >


                                ${
                                    isMainPhoto
                                        ? `

                                            <span
                                                class="main-photo-badge"
                                            >

                                                MAIN

                                            </span>

                                          `
                                        : ""
                                }


                                <button
                                    type="button"
                                    class="remove-photo new-photo"
                                    data-index="${index}"
                                    title="Remove photo"
                                    aria-label="Remove new package photo ${
                                        index + 1
                                    }"
                                >

                                    <i
                                        class="fa-solid fa-trash-can"
                                    ></i>

                                </button>

                            `;


                            photoPreviewGrid.appendChild(
                                item
                            );

                        };


                    reader.readAsDataURL(
                        file
                    );

                }
            );

        }


        // ======================================================
        // OPEN GALLERY FILE SELECTOR
        // ======================================================

        uploadPhotosButton?.addEventListener(
            "click",
            event => {

                event.preventDefault();


                packagePhotos?.click();

            }
        );


        // ======================================================
        // SELECT GALLERY PHOTOS
        // ======================================================

        packagePhotos?.addEventListener(
            "change",
            event => {


                const selectedFiles =
                    Array.from(
                        event.target.files ||
                        []
                    );


                if (
                    selectedFiles.length ===
                    0
                ) {
                    return;
                }


                selectedFiles.forEach(
                    file => {


                        if (
                            !file.type.startsWith(
                                "image/"
                            )
                        ) {
                            return;
                        }


                        const duplicate =
                            packageGalleryFiles.some(
                                existingFile =>
                                    existingFile.name ===
                                        file.name &&
                                    existingFile.size ===
                                        file.size
                            );


                        if (
                            duplicate
                        ) {
                            return;
                        }


                        const totalPhotos =
                            existingGalleryPhotos.length +
                            packageGalleryFiles.length;


                        if (
                            totalPhotos >=
                            10
                        ) {
                            return;
                        }


                        packageGalleryFiles.push(
                            file
                        );

                    }
                );


                renderPackageGallery();


                packagePhotos.value =
                    "";

            }
        );


        // ======================================================
        // REMOVE GALLERY PHOTO
        // ======================================================

        photoPreviewGrid?.addEventListener(
            "click",
            event => {


                const removeButton =
                    event.target.closest(
                        ".remove-photo"
                    );


                if (
                    !removeButton
                ) {
                    return;
                }


                // ----------------------------------------------
                // EXISTING FIREBASE PHOTO
                // ----------------------------------------------

                if (
                    removeButton.classList.contains(
                        "existing-photo"
                    )
                ) {

                    const index =
                        Number(
                            removeButton
                                .dataset
                                .existingIndex
                        );


                    if (
                        Number.isNaN(
                            index
                        )
                    ) {
                        return;
                    }


                    existingGalleryPhotos.splice(
                        index,
                        1
                    );


                    renderPackageGallery();


                    return;

                }


                // ----------------------------------------------
                // NEW LOCAL PHOTO
                // ----------------------------------------------

                const index =
                    Number(
                        removeButton
                            .dataset
                            .index
                    );


                if (
                    Number.isNaN(
                        index
                    )
                ) {
                    return;
                }


                packageGalleryFiles.splice(
                    index,
                    1
                );


                renderPackageGallery();

            }
        );


        // ======================================================
        // EDIT PACKAGE
        // ======================================================

        function editPackage(
            packageId
        ) {

            const packageItem =
                packages.find(
                    item =>
                        item.id ===
                        packageId
                );


            if (
                !packageItem
            ) {

                console.error(
                    "PACKAGE NOT FOUND:",
                    packageId
                );


                return;

            }


            console.log(
                "EDIT PACKAGE:",
                packageItem
            );


            editingPackageId =
                packageId;


            // ==================================================
            // BASIC INFORMATION
            // ==================================================

            setInputValue(
                "formPackageName",
                packageItem.name
            );


            setInputValue(
                "formCategory",
                packageItem.category
            );


            setInputValue(
                "formLocation",
                packageItem.location
            );


            setInputValue(
                "formPrice",
                packageItem.price
            );


            setInputValue(
                "formDuration",
                packageItem.duration
            );


            setInputValue(
                "formDescription",
                packageItem.description
            );


            setInputValue(
                "formAbout",
                packageItem.about
            );


            setInputValue(
                "formStatus",
                packageItem.status ||
                "active"
            );


            const passengerPricing =
                packageItem.passengerPricing ||
                {};

            const exclusiveTour =
                packageItem.exclusiveTour ||
                {};


            const kidsPricingEnabled =
                document.getElementById(
                    "kidsPricingEnabled"
                );

            const exclusiveTourEnabled =
                document.getElementById(
                    "exclusiveTourEnabled"
                );


            if (kidsPricingEnabled) {

                kidsPricingEnabled.checked =
                    passengerPricing
                        .kidsPricingEnabled === true;

            }


            if (exclusiveTourEnabled) {

                exclusiveTourEnabled.checked =
                    exclusiveTour
                        .enabled === true;

            }


            setInputValue(
                "childFreeMaxAge",
                passengerPricing
                    .childFreeMaxAge ?? 3
            );

            setInputValue(
                "childDiscountMinAge",
                passengerPricing
                    .childDiscountMinAge ?? 4
            );

            setInputValue(
                "childDiscountMaxAge",
                passengerPricing
                    .childDiscountMaxAge ?? 8
            );

            setInputValue(
                "childDiscountAmount",
                passengerPricing
                    .childDiscountAmount ?? 500
            );

            setInputValue(
                "exclusiveMinimumPayingPax",
                exclusiveTour
                    .minimumPayingPax ?? 12
            );

            setInputValue(
                "exclusiveFreeStartsAt",
                exclusiveTour
                    .freeStartsAt ?? 13
            );

            setInputValue(
                "exclusiveFreePax",
                exclusiveTour
                    .freePax ?? 1
            );

            setInputValue(
                "exclusiveMaxFreePax",
                exclusiveTour
                    .maxFreePax ?? 1
            );


            updatePackageRuleVisibility();


            const scheduleSettings =
                packageItem.scheduleSettings ||
                {};

            const regularScheduleEnabled =
                document.getElementById(
                    "regularScheduleEnabled"
                );

            const day0Enabled =
                document.getElementById(
                    "day0Enabled"
                );

            if (regularScheduleEnabled) {
                regularScheduleEnabled.checked =
                    scheduleSettings.enabled === true;
            }

            if (day0Enabled) {
                day0Enabled.checked =
                    scheduleSettings.day0Enabled !== false;
            }

            setInputValue(
                "regularStartDay",
                scheduleSettings.startDay ?? 5
            );

            setInputValue(
                "regularDurationDays",
                scheduleSettings.durationDays ?? 3
            );

            setInputValue(
                "day0Offset",
                scheduleSettings.day0Offset ?? -1
            );

            setInputValue(
                "pickupStartTime",
                scheduleSettings.pickupStartTime || ""
            );

            setInputValue(
                "pickupEndTime",
                scheduleSettings.pickupEndTime || ""
            );

            setInputValue(
                "departureNote",
                scheduleSettings.departureNote || ""
            );

            updateScheduleSettingsVisibility();


            populateItineraryBuilder(
                packageItem.itinerary
            );


            // ==================================================
            // GALLERY
            // ==================================================

            packageGalleryFiles =
                [];


            existingGalleryPhotos =
                Array.isArray(
                    packageItem.gallery
                )
                    ? [
                        ...packageItem.gallery
                      ]
                    : [];


            if (
                packagePhotos
            ) {

                packagePhotos.value =
                    "";

            }


            // ==================================================
            // INCLUSIONS
            // ==================================================

            if (
                inclusionsList
            ) {

                inclusionsList.innerHTML =
                    "";


                const inclusions =
                    Array.isArray(
                        packageItem.inclusions
                    )
                        ? packageItem.inclusions
                        : [];


                if (
                    inclusions.length >
                    0
                ) {

                    inclusions.forEach(
                        value => {

                            addInclusionRow(
                                value
                            );

                        }
                    );

                } else {

                    addInclusionRow();

                }

            }


            // ==================================================
            // EXCLUSIONS
            // ==================================================

            if (
                exclusionsList
            ) {

                exclusionsList.innerHTML =
                    "";


                exclusionCount =
                    0;


                const exclusions =
                    Array.isArray(
                        packageItem.exclusions
                    )
                        ? packageItem.exclusions
                        : [];


                if (
                    exclusions.length >
                    0
                ) {

                    exclusions.forEach(
                        value => {

                            addExclusionItem(
                                value
                            );

                        }
                    );

                } else {

                    addExclusionItem();

                }

            }


            // ==================================================
            // ACCOMMODATIONS
            // ==================================================

            if (
                accommodationList
            ) {

                accommodationList.innerHTML =
                    "";


                accommodationCount =
                    0;


                const accommodations =
                    Array.isArray(
                        packageItem.accommodations
                    )
                        ? packageItem.accommodations
                        : [];


                accommodations.forEach(
                    accommodation => {

                        addAccommodationCard(
                            accommodation
                        );

                    }
                );

            }


            renderPackageGallery();


            openPackageModal();

        }


        // ======================================================
        // CLOSE ALL PACKAGE MENUS
        // ======================================================

        function closeAllPackageMenus(
            exceptMenu = null
        ) {

            document
                .querySelectorAll(
                    ".package-more-menu.open"
                )
                .forEach(
                    menu => {


                        if (
                            menu ===
                            exceptMenu
                        ) {
                            return;
                        }


                        menu.classList.remove(
                            "open"
                        );


                        const toggle =
                            menu
                                .closest(
                                    ".package-more-wrap"
                                )
                                ?.querySelector(
                                    ".package-more-btn"
                                );


                        toggle?.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

        }


        // ======================================================
        // PACKAGE CARD ACTIONS
        // ======================================================

        packageGrid?.addEventListener(
            "click",
            async event => {


                // ----------------------------------------------
                // EDIT BUTTON
                // ----------------------------------------------

                const editButton =
                    event.target.closest(
                        ".edit-package-btn, .package-menu-edit"
                    );


                if (
                    editButton
                ) {

                    closeAllPackageMenus();


                    editPackage(
                        editButton.dataset.id
                    );


                    return;

                }


                // ----------------------------------------------
                // MORE BUTTON
                // ----------------------------------------------

                const moreButton =
                    event.target.closest(
                        ".package-more-btn"
                    );


                if (
                    moreButton
                ) {

                    const menu =
                        moreButton
                            .closest(
                                ".package-more-wrap"
                            )
                            ?.querySelector(
                                ".package-more-menu"
                            );


                    if (
                        !menu
                    ) {
                        return;
                    }


                    const willOpen =
                        !menu.classList.contains(
                            "open"
                        );


                    closeAllPackageMenus(
                        menu
                    );


                    menu.classList.toggle(
                        "open",
                        willOpen
                    );


                    moreButton.setAttribute(
                        "aria-expanded",
                        String(
                            willOpen
                        )
                    );


                    return;

                }


                // ----------------------------------------------
                // SHOW / HIDE PACKAGE
                // ----------------------------------------------

                const statusButton =
                    event.target.closest(
                        ".package-menu-status"
                    );


                if (
                    statusButton
                ) {

                    const packageId =
                        statusButton
                            .dataset
                            .id;


                    const currentStatus =
                        statusButton
                            .dataset
                            .status ||
                        "active";


                    const nextStatus =
                        currentStatus ===
                        "active"
                            ? "hidden"
                            : "active";


                    closeAllPackageMenus();


                    try {

                        await updateDoc(
                            doc(
                                db,
                                "packages",
                                packageId
                            ),
                            {

                                status:
                                    nextStatus,

                                updatedAt:
                                    new Date()
                                        .toISOString()

                            }
                        );


                        await loadPackages();


                    } catch (error) {

                        console.error(
                            "PACKAGE STATUS UPDATE ERROR:",
                            error
                        );


                        alert(
                            "Unable to update package status. Please try again."
                        );

                    }


                    return;

                }


                closeAllPackageMenus();

            }
        );


        // ======================================================
        // CLOSE MORE MENU WHEN CLICKING OUTSIDE
        // ======================================================

        document.addEventListener(
            "click",
            event => {

                if (
                    !event.target.closest(
                        ".package-more-wrap"
                    )
                ) {

                    closeAllPackageMenus();

                }

            }
        );


        // ======================================================
        // ADD PACKAGE BUTTON
        // ======================================================

        addButton?.addEventListener(
            "click",
            event => {

                event.preventDefault();


                openNewPackageModal();

            }
        );


        // ======================================================
        // ADD INCLUSION BUTTON
        // ======================================================

        addInclusion?.addEventListener(
            "click",
            event => {

                event.preventDefault();


                addInclusionRow();

            }
        );


        // ======================================================
        // ADD EXCLUSION BUTTON
        // ======================================================

        addExclusion?.addEventListener(
            "click",
            event => {

                event.preventDefault();


                addExclusionItem();

            }
        );


        // ======================================================
        // ADD ACCOMMODATION BUTTON
        // ======================================================

        addAccommodation?.addEventListener(
            "click",
            event => {

                event.preventDefault();


                addAccommodationCard();

            }
        );


        // ======================================================
        // CLOSE MODAL BUTTONS
        // ======================================================

        closePackageModal?.addEventListener(
            "click",
            closeModal
        );


        cancelPackage?.addEventListener(
            "click",
            closeModal
        );


        packageModalOverlay?.addEventListener(
            "click",
            closeModal
        );


        // ======================================================
        // ESC KEY
        // ======================================================

        document.addEventListener(
            "keydown",
            event => {


                if (
                    event.key ===
                        "Escape" &&
                    packageModal
                        ?.classList
                        .contains(
                            "show"
                        )
                ) {

                    closeModal();


                    return;

                }


                if (
                    event.key ===
                    "Escape"
                ) {

                    closeAllPackageMenus();

                }

            }
        );


        // ======================================================
        // SEARCH
        // ======================================================

        searchInput?.addEventListener(
            "input",
            renderPackages
        );


        // ======================================================
        // CATEGORY FILTER
        // ======================================================

        categoryFilter?.addEventListener(
            "change",
            renderPackages
        );


        // ======================================================
        // STATUS FILTER
        // ======================================================

        statusFilter?.addEventListener(
            "change",
            renderPackages
        );


        // ======================================================
        // SORT
        // ======================================================

        sortSelect?.addEventListener(
            "change",
            renderPackages
        );

                // ======================================================
        // COLLECT INCLUSIONS
        // ======================================================

        function collectInclusions() {

            if (!inclusionsList) {
                return [];
            }


            return Array.from(
                inclusionsList.querySelectorAll(
                    ".dynamic-row input"
                )
            )
                .map(
                    input =>
                        input.value.trim()
                )
                .filter(Boolean);

        }


        // ======================================================
        // COLLECT EXCLUSIONS
        // ======================================================

        function collectExclusions() {

            if (!exclusionsList) {
                return [];
            }


            return Array.from(
                exclusionsList.querySelectorAll(
                    ".exclusion-input"
                )
            )
                .map(
                    input =>
                        input.value.trim()
                )
                .filter(Boolean);

        }

        // ======================================================
// COLLECT PICK UP LOCATIONS
// ======================================================

// ======================================================
// ITINERARY BUILDER
// Supports:
// 1) Schedule entries: time + activity
// 2) Section entries: title + bullet/activity list
// Old itinerary rows remain compatible.
// ======================================================

function getItineraryList(day) {
    const map = {
        day0: "itineraryDay0List",
        day1: "itineraryDay1List",
        day2: "itineraryDay2List",
        day3: "itineraryDay3List"
    };

    return document.getElementById(map[day]);
}

function addItineraryRow(day, item = {}) {
    const list = getItineraryList(day);
    if (!list) return;

    const row = document.createElement("div");
    row.className = "itinerary-schedule-row";
    row.dataset.entryType = "schedule";

    row.innerHTML = `
        <div class="itinerary-field">
            <label>Time</label>
            <input
                type="text"
                class="itinerary-time"
                placeholder="e.g. 05:00 AM"
                value="${escapeHtml(item.time || "")}"
            >
        </div>

        <div class="itinerary-field activity">
            <label>Activity / Schedule</label>
            <input
                type="text"
                class="itinerary-activity"
                placeholder="e.g. Wake-up call"
                value="${escapeHtml(item.activity || "")}"
            >
        </div>

        <button
            type="button"
            class="itinerary-remove-row"
            title="Remove schedule"
            aria-label="Remove schedule"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    row.querySelector(".itinerary-remove-row")?.addEventListener(
        "click",
        () => row.remove()
    );

    list.appendChild(row);
}

function addItinerarySectionItem(section, value = "") {
    const itemsList = section.querySelector(".itinerary-section-items");
    if (!itemsList) return;

    const itemRow = document.createElement("div");
    itemRow.className = "itinerary-section-item-row";

    itemRow.innerHTML = `
        <span class="itinerary-section-bullet">
            <i class="fa-solid fa-circle"></i>
        </span>

        <input
            type="text"
            class="itinerary-section-item"
            placeholder="e.g. Puno ng Walang Forever"
            value="${escapeHtml(value)}"
        >

        <button
            type="button"
            class="itinerary-remove-item"
            title="Remove item"
            aria-label="Remove activity"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    itemRow.querySelector(".itinerary-remove-item")?.addEventListener(
        "click",
        () => itemRow.remove()
    );

    itemsList.appendChild(itemRow);
}

function addItinerarySection(day, item = {}) {
    const list = getItineraryList(day);
    if (!list) return;

    const section = document.createElement("div");
    section.className = "itinerary-activity-section";
    section.dataset.entryType = "section";

    section.innerHTML = `
        <div class="itinerary-section-header">
            <div class="itinerary-section-title-field">
                <label>Section Title</label>
                <input
                    type="text"
                    class="itinerary-section-title"
                    placeholder="e.g. PLACES TO VISIT"
                    value="${escapeHtml(item.title || "")}"
                >
            </div>

            <button
                type="button"
                class="itinerary-remove-section"
                title="Remove section"
                aria-label="Remove section"
            >
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>

        <div class="itinerary-section-items"></div>

        <button type="button" class="itinerary-add-section-item">
            <i class="fa-solid fa-plus"></i>
            Add Activity / Item
        </button>
    `;

    section.querySelector(".itinerary-remove-section")?.addEventListener(
        "click",
        () => section.remove()
    );

    section.querySelector(".itinerary-add-section-item")?.addEventListener(
        "click",
        () => addItinerarySectionItem(section)
    );

    const items = Array.isArray(item.items)
        ? item.items
        : [];

    if (items.length) {
        items.forEach(value => addItinerarySectionItem(section, value));
    } else {
        addItinerarySectionItem(section);
    }

    list.appendChild(section);
}

function normalizeItineraryEntry(item) {
    if (!item) return null;

    // New section format.
    if (
        item.type === "section" ||
        (
            item.title &&
            Array.isArray(item.items) &&
            !item.time &&
            !item.activity
        )
    ) {
        return {
            type: "section",
            title: item.title || "",
            items: Array.isArray(item.items)
                ? item.items.filter(Boolean)
                : []
        };
    }

    // Existing/old schedule format.
    if (
        typeof item === "object" &&
        !Array.isArray(item)
    ) {
        return {
            type: "schedule",
            time: item.time || "",
            activity: item.activity || ""
        };
    }

    // Very old plain-string entry.
    if (typeof item === "string") {
        return {
            type: "schedule",
            time: "",
            activity: item
        };
    }

    return null;
}

function normalizeItinerary(value) {
    const empty = {
        day0: [],
        day1: [],
        day2: [],
        day3: [],
        notes: ""
    };

    if (!value) {
        return empty;
    }

    // Current object format.
    if (
        typeof value === "object" &&
        !Array.isArray(value)
    ) {
        const result = {
            ...empty,
            notes: value.notes || ""
        };

        ["day0", "day1", "day2", "day3"].forEach(day => {
            const source = Array.isArray(value[day])
                ? value[day]
                : [];

            result[day] = source
                .map(normalizeItineraryEntry)
                .filter(Boolean);
        });

        return result;
    }

    // Backward compatibility for the original textarea itinerary.
    const result = { ...empty };
    let currentDay = "day1";

    String(value)
        .split(/\r?\n/)
        .forEach(rawLine => {
            const line = rawLine.trim();
            if (!line) return;

            const heading = line.match(/^DAY\s*([0-3])\b/i);

            if (heading) {
                currentDay = `day${heading[1]}`;
                return;
            }

            const parts = line.split(/\s+[—–-]\s+/);

            if (parts.length >= 2) {
                result[currentDay].push({
                    type: "schedule",
                    time: parts.shift().trim(),
                    activity: parts.join(" - ").trim()
                });
            } else {
                result[currentDay].push({
                    type: "schedule",
                    time: "",
                    activity: line
                });
            }
        });

    return result;
}

function populateItineraryBuilder(value) {
    const itinerary = normalizeItinerary(value);

    ["day0", "day1", "day2", "day3"].forEach(day => {
        const list = getItineraryList(day);
        if (!list) return;

        list.innerHTML = "";

        itinerary[day].forEach(item => {
            if (item.type === "section") {
                addItinerarySection(day, item);
            } else {
                addItineraryRow(day, item);
            }
        });

        // Keep one blank schedule row only for a completely empty day.
        if (!itinerary[day].length) {
            addItineraryRow(day);
        }
    });

    setInputValue(
        "itineraryNotes",
        itinerary.notes
    );
}

function resetItineraryBuilder() {
    populateItineraryBuilder({
        day0: [],
        day1: [],
        day2: [],
        day3: [],
        notes: ""
    });

    document
        .querySelectorAll(".itinerary-tab")
        .forEach(
            (tab, index) =>
                tab.classList.toggle(
                    "active",
                    index === 0
                )
        );

    document
        .querySelectorAll(".itinerary-panel")
        .forEach(
            panel =>
                panel.classList.toggle(
                    "active",
                    panel.dataset.itineraryPanel === "day0"
                )
        );
}

function collectItineraryDay(day) {
    const list = getItineraryList(day);
    if (!list) return [];

    return Array.from(list.children)
        .map(entry => {
            if (
                entry.dataset.entryType === "section" ||
                entry.classList.contains("itinerary-activity-section")
            ) {
                const title =
                    entry
                        .querySelector(".itinerary-section-title")
                        ?.value
                        .trim() || "";

                const items =
                    Array.from(
                        entry.querySelectorAll(
                            ".itinerary-section-item"
                        )
                    )
                        .map(input => input.value.trim())
                        .filter(Boolean);

                if (!title && !items.length) {
                    return null;
                }

                return {
                    type: "section",
                    title,
                    items
                };
            }

            const time =
                entry
                    .querySelector(".itinerary-time")
                    ?.value
                    .trim() || "";

            const activity =
                entry
                    .querySelector(".itinerary-activity")
                    ?.value
                    .trim() || "";

            if (!time && !activity) {
                return null;
            }

            return {
                type: "schedule",
                time,
                activity
            };
        })
        .filter(Boolean);
}

function collectItinerary() {
    return {
        day0: collectItineraryDay("day0"),
        day1: collectItineraryDay("day1"),
        day2: collectItineraryDay("day2"),
        day3: collectItineraryDay("day3"),
        notes: getInputValue("itineraryNotes")
    };
}

document
    .querySelectorAll(".itinerary-tab")
    .forEach(tab => {
        tab.addEventListener(
            "click",
            () => {
                const target =
                    tab.dataset.itineraryTab;

                document
                    .querySelectorAll(".itinerary-tab")
                    .forEach(
                        item =>
                            item.classList.toggle(
                                "active",
                                item === tab
                            )
                    );

                document
                    .querySelectorAll(".itinerary-panel")
                    .forEach(
                        panel =>
                            panel.classList.toggle(
                                "active",
                                panel.dataset.itineraryPanel === target
                            )
                    );
            }
        );
    });

document
    .querySelectorAll(".itinerary-add-row")
    .forEach(button => {
        button.addEventListener(
            "click",
            () => addItineraryRow(
                button.dataset.day
            )
        );
    });

document
    .querySelectorAll(".itinerary-add-section")
    .forEach(button => {
        button.addEventListener(
            "click",
            () => addItinerarySection(
                button.dataset.day
            )
        );
    });

function collectPickupLocations() {

    if (!pickupLocationList) {
        return [];
    }

    return Array.from(
        pickupLocationList.querySelectorAll(
            ".pickup-location-input"
        )
    )
        .map(
            input => input.value.trim()
        )
        .filter(Boolean);

}



        // ======================================================
        // REQUIRED RESORT / ACCOMMODATION VALIDATION
        // ======================================================

        function clearAccommodationValidation() {
            accommodationList
                ?.querySelectorAll(".accommodation-field-error")
                .forEach(item => item.remove());

            accommodationList
                ?.querySelectorAll(".accommodation-invalid")
                .forEach(item =>
                    item.classList.remove("accommodation-invalid")
                );
        }

        function showAccommodationFieldError(
            element,
            message
        ) {
            if (!element) return;

            element.classList.add(
                "accommodation-invalid"
            );

            const field =
                element.closest(
                    ".accommodation-field"
                );

            if (
                field &&
                !field.querySelector(
                    ".accommodation-field-error"
                )
            ) {
                const error =
                    document.createElement("small");

                error.className =
                    "accommodation-field-error";

                error.textContent = message;

                field.appendChild(error);
            }
        }

        function validateAccommodationCards() {
            clearAccommodationValidation();

            const cards =
                accommodationList
                    ? Array.from(
                        accommodationList.querySelectorAll(
                            ".accommodation-card"
                        )
                    )
                    : [];

            if (cards.length === 0) {
                alert(
                    "Please add at least one resort accommodation before saving."
                );

                document
                    .getElementById(
                        "packageSectionAccommodation"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                return false;
            }

            let firstInvalid = null;

            const invalidate = (
                element,
                message
            ) => {
                showAccommodationFieldError(
                    element,
                    message
                );

                if (!firstInvalid) {
                    firstInvalid = element;
                }
            };

            cards.forEach(card => {
                const resort =
                    card.querySelector(
                        ".accommodation-resort-name"
                    );

                const name =
                    card.querySelector(
                        ".accommodation-name"
                    );

                const maxGuests =
                    card.querySelector(
                        ".accommodation-max-guests"
                    );

                const defaultUnits =
                    card.querySelector(
                        ".accommodation-default-units"
                    );

                const type =
                    card.querySelector(
                        ".accommodation-type"
                    );

                const price =
                    card.querySelector(
                        ".accommodation-price"
                    );

                const status =
                    card.querySelector(
                        ".accommodation-status"
                    );

                if (!resort?.value?.trim()) {
                    invalidate(
                        resort,
                        "Resort name is required."
                    );
                }

                if (!name?.value?.trim()) {
                    invalidate(
                        name,
                        "Accommodation name is required."
                    );
                }

                if (
                    maxGuests?.value === "" ||
                    Number(maxGuests.value) < 1
                ) {
                    invalidate(
                        maxGuests,
                        "Maximum guests must be at least 1."
                    );
                }

                if (
                    defaultUnits?.value === "" ||
                    Number(defaultUnits.value) < 0
                ) {
                    invalidate(
                        defaultUnits,
                        "Default available units is required."
                    );
                }

                if (!type?.value) {
                    invalidate(
                        type,
                        "Option type is required."
                    );
                }

                if (
                    type?.value === "additional" &&
                    (
                        price?.value === "" ||
                        Number(price.value) < 0
                    )
                ) {
                    invalidate(
                        price,
                        "Price per night is required for an upgrade."
                    );
                }

                if (!status?.value) {
                    invalidate(
                        status,
                        "Status is required."
                    );
                }
            });

            if (firstInvalid) {
                const invalidCard =
                    firstInvalid.closest(
                        ".accommodation-card"
                    );

                setAccommodationCardExpanded(
                    invalidCard,
                    true
                );

                invalidCard?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                window.setTimeout(
                    () => firstInvalid.focus(),
                    300
                );

                return false;
            }

            return true;
        }


        // ======================================================
        // SAVE PACKAGE
        // ======================================================

        packageForm?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                console.log(
                    "SAVE PACKAGE CLICKED"
                );


                const saveButton =
                    packageForm.querySelector(
                        'button[type="submit"]'
                    );


                if (
                    saveButton?.disabled
                ) {
                    return;
                }


                // ==============================================
                // BASIC INFORMATION
                // ==============================================

                const packageData = {

                    name:
                        getInputValue(
                            "formPackageName"
                        ),

                    category:
                        document.getElementById(
                            "formCategory"
                        )?.value ||
                        "",

                    location:
                        getInputValue(
                            "formLocation"
                        ),

                    price:
                        getInputValue(
                            "formPrice"
                        ),

                    duration:
                        getInputValue(
                            "formDuration"
                        ),

                    description:
                        getInputValue(
                            "formDescription"
                        ),

                    about:
                        getInputValue(
                            "formAbout"
                        ),

                    status:
                        document.getElementById(
                            "formStatus"
                        )?.value ||
                        "active",

                    passengerPricing: {

                        kidsPricingEnabled:
                            document.getElementById(
                                "kidsPricingEnabled"
                            )?.checked === true,

                        childFreeMaxAge:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "childFreeMaxAge",
                                    3
                                )
                            ),

                        childDiscountMinAge:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "childDiscountMinAge",
                                    4
                                )
                            ),

                        childDiscountMaxAge:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "childDiscountMaxAge",
                                    8
                                )
                            ),

                        childDiscountAmount:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "childDiscountAmount",
                                    500
                                )
                            )

                    },

                    exclusiveTour: {

                        enabled:
                            document.getElementById(
                                "exclusiveTourEnabled"
                            )?.checked === true,

                        minimumPayingPax:
                            Math.max(
                                1,
                                getNumberInputValue(
                                    "exclusiveMinimumPayingPax",
                                    12
                                )
                            ),

                        freeStartsAt:
                            Math.max(
                                1,
                                getNumberInputValue(
                                    "exclusiveFreeStartsAt",
                                    13
                                )
                            ),

                        freePax:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "exclusiveFreePax",
                                    1
                                )
                            ),

                        maxFreePax:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "exclusiveMaxFreePax",
                                    1
                                )
                            )

                    },

                    scheduleSettings: {

                        enabled:
                            document.getElementById(
                                "regularScheduleEnabled"
                            )?.checked === true,

                        startDay:
                            Math.min(
                                6,
                                Math.max(
                                    0,
                                    getNumberInputValue(
                                        "regularStartDay",
                                        5
                                    )
                                )
                            ),

                        durationDays:
                            Math.max(
                                1,
                                getNumberInputValue(
                                    "regularDurationDays",
                                    3
                                )
                            ),

                        day0Enabled:
                            document.getElementById(
                                "day0Enabled"
                            )?.checked === true,

                        day0Offset:
                            Math.min(
                                0,
                                getNumberInputValue(
                                    "day0Offset",
                                    -1
                                )
                            ),

                        pickupStartTime:
                            getInputValue(
                                "pickupStartTime"
                            ),

                        pickupEndTime:
                            getInputValue(
                                "pickupEndTime"
                            ),

                        departureNote:
                            getInputValue(
                                "departureNote"
                            )

                    },

                    inclusions:
                        collectInclusions(),

                    exclusions:
                        collectExclusions(),

                    pickupLocations:
                        collectPickupLocations(),

                    accommodations:
                        [],

                    itinerary:
                        collectItinerary()

                };


                // ==============================================
                // VALIDATION
                // ==============================================

                if (
                    !packageData.name
                ) {

                    alert(
                        "Please enter a package name."
                    );

                    document
                        .getElementById(
                            "formPackageName"
                        )
                        ?.focus();

                    return;

                }


                if (
                    !packageData.category
                ) {

                    alert(
                        "Please select a package category."
                    );

                    document
                        .getElementById(
                            "formCategory"
                        )
                        ?.focus();

                    return;

                }


                if (
                    !packageData.location
                ) {

                    alert(
                        "Please enter the destination or location."
                    );

                    document
                        .getElementById(
                            "formLocation"
                        )
                        ?.focus();

                    return;

                }



                if (
                    packageData.passengerPricing.kidsPricingEnabled
                ) {

                    if (
                        packageData.passengerPricing.childDiscountMinAge <=
                        packageData.passengerPricing.childFreeMaxAge
                    ) {

                        alert(
                            "Discounted child starting age must be higher than the FREE child maximum age."
                        );

                        document
                            .getElementById(
                                "childDiscountMinAge"
                            )
                            ?.focus();

                        return;

                    }


                    if (
                        packageData.passengerPricing.childDiscountMaxAge <
                        packageData.passengerPricing.childDiscountMinAge
                    ) {

                        alert(
                            "Discounted child maximum age cannot be lower than the starting age."
                        );

                        document
                            .getElementById(
                                "childDiscountMaxAge"
                            )
                            ?.focus();

                        return;

                    }

                }


                if (
                    packageData.exclusiveTour.enabled
                ) {

                    if (
                        packageData.exclusiveTour.freeStartsAt <
                        packageData.exclusiveTour.minimumPayingPax
                    ) {

                        alert(
                            "Free Pax Starts At cannot be lower than Minimum Paying Pax."
                        );

                        document
                            .getElementById(
                                "exclusiveFreeStartsAt"
                            )
                            ?.focus();

                        return;

                    }


                    if (
                        packageData.exclusiveTour.freePax >
                        packageData.exclusiveTour.maxFreePax
                    ) {

                        alert(
                            "Free Pax cannot be higher than Maximum Free Pax."
                        );

                        document
                            .getElementById(
                                "exclusiveFreePax"
                            )
                            ?.focus();

                        return;

                    }

                }


                if (!validateAccommodationCards()) {
                    return;
                }


                // ==============================================
                // LOCK SAVE BUTTON
                // ==============================================

                const originalSaveText =
                    saveButton?.innerHTML ||
                    "Save Package";


                if (
                    saveButton
                ) {

                    saveButton.disabled =
                        true;


                    saveButton.innerHTML = `

                        <span
                            class="save-loading-spinner"
                        ></span>

                        Saving...

                    `;

                }


                try {

                    // ==========================================
                    // CREATE / UPDATE DOCUMENT
                    // ==========================================

                    let packageRef;

                    let packageId;


                    if (
                        editingPackageId
                    ) {

                        packageId =
                            editingPackageId;


                        packageRef =
                            doc(
                                db,
                                "packages",
                                packageId
                            );

                    } else {

                        packageRef =
                            await addDoc(
                                collection(
                                    db,
                                    "packages"
                                ),
                                {

                                    ...packageData,

                                    createdAt:
                                        new Date()
                                            .toISOString()

                                }
                            );


                        packageId =
                            packageRef.id;

                    }


                    console.log(
                        "PACKAGE ID:",
                        packageId
                    );


                    // ==========================================
                    // PACKAGE GALLERY
                    // ==========================================

                    const uploadedGallery = [
                        ...existingGalleryPhotos
                    ];


                    for (
                        const file of
                        packageGalleryFiles
                    ) {

                        const safeName =
                            file.name
                                .replace(
                                    /[^a-zA-Z0-9._-]/g,
                                    "_"
                                );


                        const fileName =
                            `${Date.now()}_${safeName}`;


                        const storageRef =
                            ref(
                                storage,
                                `packages/${packageId}/gallery/${fileName}`
                            );


                        const snapshot =
                            await uploadBytes(
                                storageRef,
                                file
                            );


                        const downloadURL =
                            await getDownloadURL(
                                snapshot.ref
                            );


                        uploadedGallery.push({

                            name:
                                file.name,

                            url:
                                downloadURL

                        });

                    }


                    // ==========================================
                    // ACCOMMODATIONS
                    // ==========================================

                    const accommodationCards =
                        accommodationList
                            ? accommodationList.querySelectorAll(
                                ".accommodation-card"
                            )
                            : [];

                    for (const card of accommodationCards) {

                        const resortName =
                            card.querySelector(
                                ".accommodation-resort-name"
                            )?.value?.trim() ||
                            "";

                        const name =
                            card.querySelector(
                                ".accommodation-name"
                            )?.value?.trim() ||
                            "";

                        const defaultAvailableUnits =
                            Math.max(
                                0,
                                Number(
                                    card.querySelector(
                                        ".accommodation-default-units"
                                    )?.value
                                ) || 0
                            );

                        const maxGuests =
                            Math.max(
                                1,
                                Number(
                                    card.querySelector(
                                        ".accommodation-max-guests"
                                    )?.value
                                ) || 1
                            );

                        const type =
                            card.querySelector(
                                ".accommodation-type"
                            )?.value ||
                            "additional";

                        const status =
                            card.querySelector(
                                ".accommodation-status"
                            )?.value ||
                            "active";

                        const pricePerNight =
                            Math.max(
                                0,
                                normalizePrice(
                                    card.querySelector(
                                        ".accommodation-price"
                                    )?.value
                                )
                            );

                        const description =
                            card.querySelector(
                                ".accommodation-description"
                            )?.value?.trim() ||
                            "";

                        const amenities =
                            (
                                card.querySelector(
                                    ".accommodation-amenities"
                                )?.value ||
                                ""
                            )
                                .split(/\r?\n|,/)
                                .map(value =>
                                    value.trim()
                                )
                                .filter(Boolean);

                        let mainPhoto =
                            card.dataset.existingPhoto ||
                            "";

                        const photoInput =
                            card.querySelector(
                                ".accommodation-photo-input"
                            );

                        if (
                            photoInput?.files?.length >
                            0
                        ) {

                            const file =
                                photoInput.files[0];

                            const safeName =
                                file.name.replace(
                                    /[^a-zA-Z0-9._-]/g,
                                    "_"
                                );

                            const accommodationStorageRef =
                                ref(
                                    storage,
                                    `packages/${packageId}/accommodations/main_${Date.now()}_${safeName}`
                                );

                            const snapshot =
                                await uploadBytes(
                                    accommodationStorageRef,
                                    file
                                );

                            mainPhoto =
                                await getDownloadURL(
                                    snapshot.ref
                                );

                        }

                        let gallery = [];

                        try {
                            gallery =
                                JSON.parse(
                                    card.dataset.existingGallery ||
                                    "[]"
                                );
                        } catch {
                            gallery = [];
                        }

                        const galleryFiles =
                            card._accommodationGalleryFiles ||
                            [];

                        for (
                            const file of
                            galleryFiles
                        ) {

                            const safeName =
                                file.name.replace(
                                    /[^a-zA-Z0-9._-]/g,
                                    "_"
                                );

                            const galleryStorageRef =
                                ref(
                                    storage,
                                    `packages/${packageId}/accommodations/gallery_${Date.now()}_${safeName}`
                                );

                            const snapshot =
                                await uploadBytes(
                                    galleryStorageRef,
                                    file
                                );

                            gallery.push(
                                await getDownloadURL(
                                    snapshot.ref
                                )
                            );

                        }

                        const isBlank =
                            !resortName &&
                            !name &&
                            !mainPhoto &&
                            gallery.length === 0 &&
                            !description;

                        if (isBlank) continue;

                        packageData
                            .accommodations
                            .push({

                                id:
                                    card.dataset.accommodationId ||
                                    `acc_${Date.now()}_${Math.random()
                                        .toString(36)
                                        .slice(2, 8)}`,

                                resortName,

                                name,

                                category:
                                    "accommodation",

                                type,

                                priceType:
                                    type === "included"
                                        ? "included"
                                        : "per_night",

                                pricePerNight:
                                    type === "included"
                                        ? 0
                                        : pricePerNight,

                                // Legacy field kept so older screens
                                // continue to work until Booking is upgraded.
                                price:
                                    type === "included"
                                        ? 0
                                        : pricePerNight,

                                maxGuests,

                                defaultAvailableUnits,

                                defaultUnits:
                                    defaultAvailableUnits,

                                capacity:
                                    `Good for up to ${maxGuests} guest${
                                        maxGuests === 1
                                            ? ""
                                            : "s"
                                    }`,

                                description,

                                amenities,

                                mainPhoto,

                                coverPhoto:
                                    mainPhoto,

                                // Legacy photo field.
                                photo:
                                    mainPhoto,

                                gallery,

                                active:
                                    status === "active",

                                status

                            });

                    }


                    // ==========================================
                    // FINAL FIRESTORE UPDATE
                    // ==========================================

                    await updateDoc(
                        packageRef,
                        {

                            ...packageData,

                            gallery:
                                uploadedGallery,

                            accommodations:
                                packageData
                                    .accommodations,

                            image:
                                uploadedGallery?.[0]
                                    ?.url ||
                                "",

                            updatedAt:
                                new Date()
                                    .toISOString()

                        }
                    );


                    console.log(
                        "PACKAGE SAVED:",
                        packageId
                    );


                    console.log(
                        "GALLERY:",
                        uploadedGallery
                    );


                    console.log(
                        "INCLUSIONS:",
                        packageData
                            .inclusions
                    );


                    console.log(
                        "EXCLUSIONS:",
                        packageData
                            .exclusions
                    );


                    console.log(
                        "ACCOMMODATIONS:",
                        packageData
                            .accommodations
                    );


                    // ==========================================
                    // SUCCESS
                    // ==========================================

                    alert(
                        editingPackageId
                            ? "Package updated successfully!"
                            : "Package created successfully!"
                    );


                    // ==========================================
                    // RESET STATE
                    // ==========================================

                    editingPackageId =
                        null;


                    packageGalleryFiles =
                        [];


                    existingGalleryPhotos =
                        [];


                    if (
                        packagePhotos
                    ) {

                        packagePhotos.value =
                            "";

                    }


                    closeModal();


                    await loadPackages();


                } catch (error) {

                    console.error(
                        "PACKAGE SAVE ERROR:",
                        error
                    );


                    alert(
                        "Failed to save package. Please check your connection and try again."
                    );


                } finally {

                    if (
                        saveButton
                    ) {

                        saveButton.disabled =
                            false;


                        saveButton.innerHTML =
                            originalSaveText;

                    }

                }

            }
        );


        // ======================================================
        // INITIAL LOAD
        // ======================================================

        loadPackages();

    }
);