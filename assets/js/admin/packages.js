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
                                    "",

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


            setInputValue(
                "formStatus",
                "active"
            );


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

            if (
                !accommodationList
            ) {
                return;
            }


            accommodationCount++;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "accommodation-card";


            card.dataset.existingPhoto =
                accommodation.photo ||
                "";


            card.innerHTML = `

                <div
                    class="accommodation-card-header"
                >

                    <div
                        class="accommodation-card-heading"
                    >

                        <span
                            class="accommodation-card-icon"
                        >

                            <i
                                class="fa-solid fa-bed"
                            ></i>

                        </span>


                        <div>

                            <strong>

                                Accommodation
                                ${accommodationCount}

                            </strong>


                            <small>

                                Configure stay details
                                and optional upgrade pricing.

                            </small>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="remove-accommodation"
                        title="Remove accommodation"
                        aria-label="Remove accommodation ${accommodationCount}"
                    >

                        <i
                            class="fa-regular fa-trash-can"
                        ></i>


                        <span>
                            Remove
                        </span>

                    </button>

                </div>


                <div
                    class="accommodation-layout"
                >


                    <div
                        class="accommodation-photo-column"
                    >

                        <label>
                            Accommodation Photo
                        </label>


                        <div
                            class="accommodation-photo-upload"
                        >

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

                                <span
                                    class="accommodation-upload-icon"
                                >

                                    <i
                                        class="fa-regular fa-image"
                                    ></i>

                                </span>


                                <strong>
                                    Add Photo
                                </strong>


                                <small>
                                    JPG, PNG or WEBP
                                </small>

                            </button>


                            <div
                                class="accommodation-photo-preview"
                            ></div>

                        </div>

                    </div>


                    <div
                        class="accommodation-fields-column"
                    >


                        <div
                            class="accommodation-grid"
                        >


                            <div
                                class="accommodation-field full"
                            >

                                <label>
                                    Accommodation Name
                                </label>


                                <input
                                    type="text"
                                    class="accommodation-name"
                                    value="${escapeHtml(
                                        accommodation.name ||
                                        ""
                                    )}"
                                    placeholder="e.g. Tent Accommodation"
                                >

                            </div>


                            <div
                                class="accommodation-field"
                            >

                                <label>
                                    Capacity
                                </label>


                                <input
                                    type="text"
                                    class="accommodation-capacity"
                                    value="${escapeHtml(
                                        accommodation.capacity ||
                                        ""
                                    )}"
                                    placeholder="e.g. Good for 2–4 persons"
                                >

                            </div>


                            <div
                                class="accommodation-field"
                            >

                                <label>
                                    Type
                                </label>


                                <select
                                    class="accommodation-type"
                                >

                                    <option
                                        value="included"
                                        ${
                                            accommodation.type ===
                                            "included"
                                                ? "selected"
                                                : ""
                                        }
                                    >

                                        Included in Package

                                    </option>


                                    <option
                                        value="additional"
                                        ${
                                            accommodation.type ===
                                            "additional"
                                                ? "selected"
                                                : ""
                                        }
                                    >

                                        Additional Upgrade

                                    </option>

                                </select>

                            </div>


                                                        <div
                                class="accommodation-field"
                            >

                                <label>
                                    Pricing Type
                                </label>


                                <select
                                    class="accommodation-price-type"
                                >

                                    <option
                                        value="included"
                                        ${
                                            (
                                                accommodation.priceType ||
                                                (
                                                    accommodation.type === "included"
                                                        ? "included"
                                                        : "per_night"
                                                )
                                            ) === "included"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Included
                                    </option>


                                    <option
                                        value="per_night"
                                        ${
                                            (
                                                accommodation.priceType ||
                                                (
                                                    accommodation.type === "additional"
                                                        ? "per_night"
                                                        : ""
                                                )
                                            ) === "per_night"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Per Night
                                    </option>


                                    <option
                                        value="per_person_night"
                                        ${
                                            accommodation.priceType ===
                                            "per_person_night"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Per Person / Night
                                    </option>


                                    <option
                                        value="flat_rate"
                                        ${
                                            accommodation.priceType ===
                                            "flat_rate"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Flat Rate
                                    </option>

                                </select>

                            </div>

                            <div
                                class="accommodation-field full"
                            >

                                <label>
                                    Additional Price
                                </label>


                                <div
                                    class="accommodation-price-wrap"
                                >

                                    <span>
                                        ₱
                                    </span>


                                    <input
                                        type="text"
                                        class="accommodation-price"
                                        value="${escapeHtml(
                                            accommodation.price ||
                                            "TBD"
                                        )}"
                                        placeholder="0 or TBD"
                                    >

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            `;


            accommodationList.appendChild(
                card
            );


            // ==================================================
            // PHOTO ELEMENTS
            // ==================================================

            const photoInput =
                card.querySelector(
                    ".accommodation-photo-input"
                );


            const uploadButton =
                card.querySelector(
                    ".accommodation-upload-button"
                );


            const preview =
                card.querySelector(
                    ".accommodation-photo-preview"
                );


            // ==================================================
            // EXISTING PHOTO
            // ==================================================

            if (
                accommodation.photo
            ) {

                preview.innerHTML = `

                    <div
                        class="accommodation-preview-image"
                    >

                        <img
                            src="${escapeHtml(
                                accommodation.photo
                            )}"
                            alt="Accommodation photo"
                        >


                        <button
                            type="button"
                            class="remove-accommodation-photo"
                            title="Remove photo"
                            aria-label="Remove accommodation photo"
                        >

                            <i
                                class="fa-solid fa-trash-can"
                            ></i>

                        </button>

                    </div>

                `;


                uploadButton.style.display =
                    "none";

            }


            // ==================================================
            // OPEN PHOTO SELECTOR
            // ==================================================

            uploadButton?.addEventListener(
                "click",
                () => {

                    photoInput?.click();

                }
            );


            // ==================================================
            // NEW PHOTO
            // ==================================================

            photoInput?.addEventListener(
                "change",
                () => {


                    const file =
                        photoInput.files?.[0];


                    if (
                        !file
                    ) {
                        return;
                    }


                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {

                        alert(
                            "Please select a valid image file."
                        );


                        photoInput.value =
                            "";


                        return;

                    }


                    const reader =
                        new FileReader();


                    reader.onload =
                        event => {


                            preview.innerHTML = `

                                <div
                                    class="accommodation-preview-image"
                                >

                                    <img
                                        src="${event.target.result}"
                                        alt="Accommodation photo"
                                    >


                                    <button
                                        type="button"
                                        class="remove-accommodation-photo"
                                        title="Remove photo"
                                        aria-label="Remove accommodation photo"
                                    >

                                        <i
                                            class="fa-solid fa-trash-can"
                                        ></i>

                                    </button>

                                </div>

                            `;


                            uploadButton.style.display =
                                "none";


                            card.dataset
                                .existingPhoto =
                                "";

                        };


                    reader.readAsDataURL(
                        file
                    );

                }
            );


            // ==================================================
            // REMOVE PHOTO
            // ==================================================

            preview?.addEventListener(
                "click",
                event => {


                    const removePhotoButton =
                        event.target.closest(
                            ".remove-accommodation-photo"
                        );


                    if (
                        !removePhotoButton
                    ) {
                        return;
                    }


                    photoInput.value =
                        "";


                    preview.innerHTML =
                        "";


                    card.dataset
                        .existingPhoto =
                        "";


                    uploadButton.style.display =
                        "flex";

                }
            );

        }


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


            setInputValue(
                "formSchedule",
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

                    inclusions:
                        collectInclusions(),

                    exclusions:
                        collectExclusions(),

                    pickupLocations:
                        collectPickupLocations(),

                    accommodations:
                        [],

                    itinerary:
                        getInputValue(
                            "formSchedule"
                        )

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


                    for (
                        const card of
                        accommodationCards
                    ) {

                        const name =
                            card.querySelector(
                                ".accommodation-name"
                            )?.value
                                ?.trim() ||
                            "";


                        const capacity =
                            card.querySelector(
                                ".accommodation-capacity"
                            )?.value
                                ?.trim() ||
                            "";


                        const type =
    card.querySelector(
        ".accommodation-type"
    )?.value ||
    "included";


const priceType =
    card.querySelector(
        ".accommodation-price-type"
    )?.value ||
    (
        type === "included"
            ? "included"
            : "per_night"
    );


const price =
    card.querySelector(
        ".accommodation-price"
    )?.value
        ?.trim() ||
    "TBD";


                        let photo =
                            card.dataset
                                .existingPhoto ||
                            "";


                        const photoInput =
                            card.querySelector(
                                ".accommodation-photo-input"
                            );


                        if (
                            photoInput &&
                            photoInput.files &&
                            photoInput.files.length >
                                0
                        ) {

                            const file =
                                photoInput.files[0];


                            const safeName =
                                file.name
                                    .replace(
                                        /[^a-zA-Z0-9._-]/g,
                                        "_"
                                    );


                            const fileName =
                                `${Date.now()}_${safeName}`;


                            const accommodationStorageRef =
                                ref(
                                    storage,
                                    `packages/${packageId}/accommodations/${fileName}`
                                );


                            const snapshot =
                                await uploadBytes(
                                    accommodationStorageRef,
                                    file
                                );


                            photo =
                                await getDownloadURL(
                                    snapshot.ref
                                );

                        }


                        const isBlank =
                            !name &&
                            !capacity &&
                            !photo &&
                            (
                                !price ||
                                price === "TBD"
                            );


                        if (
                            isBlank
                        ) {
                            continue;
                        }


                        packageData
                            .accommodations
                            .push({

                                name:
                                    name,

                                capacity:
                                    capacity,

                                type:
                                    type,

                                priceType:
                                    priceType,

                                price:
                                    price,

                                photo:
                                    photo

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