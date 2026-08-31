/* =========================================================
   TRIPS WONDER
   CLIENT TOURS PAGE
   assets/js/client/tours.js

   PURPOSE:
   - Load actual packages from Firestore
   - Show ACTIVE packages only
   - Search packages
   - Filter by category
   - View package details
   - Pass selected package to booking.html
   ========================================================= */

"use strict";


/* =========================================================
   FIREBASE
   ========================================================= */

import {
    db
} from "../firebase/firebase-config.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =====================================================
           STATE
           ===================================================== */

        let packages = [];

        let selectedPackage = null;


        /* =====================================================
           ELEMENTS
           ===================================================== */

        const tourGrid =
            document.getElementById(
                "tourGrid"
            );


        const tourSearch =
            document.getElementById(
                "tourSearch"
            );


        const tourCategoryFilter =
            document.getElementById(
                "tourCategoryFilter"
            );


        const tourSort =
            document.getElementById(
                "tourSort"
            );


        const tourResultText =
            document.getElementById(
                "tourResultText"
            );


        const tourLoading =
            document.getElementById(
                "tourLoading"
            );


        const tourEmpty =
            document.getElementById(
                "tourEmpty"
            );


        const tourError =
            document.getElementById(
                "tourError"
            );


        const retryTours =
            document.getElementById(
                "retryTours"
            );


        /* =====================================================
           MODAL
           ===================================================== */

        const tourModal =
            document.getElementById(
                "tourModal"
            );


        const tourModalBackdrop =
            document.getElementById(
                "tourModalBackdrop"
            );


        const closeTourModal =
            document.getElementById(
                "closeTourModal"
            );


        const closeTourDetails =
            document.getElementById(
                "closeTourDetails"
            );


        const tourModalTitle =
            document.getElementById(
                "tourModalTitle"
            );


        const tourModalContent =
            document.getElementById(
                "tourModalContent"
            );


        const tourBookNow =
            document.getElementById(
                "tourBookNow"
            );


        /* =====================================================
           HELPERS
           ===================================================== */

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


        function normalizeText(value) {

            return String(
                value ?? ""
            )
                .trim()
                .toLowerCase();

        }


        function normalizeNumber(value) {

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
                Number(cleaned);


            return Number.isFinite(
                number
            )
                ? number
                : 0;

        }


        function formatMoney(value) {

            return normalizeNumber(
                value
            ).toLocaleString(
                "en-PH",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            );

        }


        function getPackageImage(
            packageItem
        ) {

            if (
                Array.isArray(
                    packageItem.gallery
                )
            ) {

                const image =
                    packageItem.gallery.find(
                        item =>
                            item &&
                            item.url
                    );


                if (
                    image?.url
                ) {

                    return image.url;

                }

            }


            return (
                packageItem.image ||
                ""
            );

        }


        /* =====================================================
           NORMALIZE PACKAGE
           ===================================================== */

        function normalizePackage(
            documentSnapshot
        ) {

            const data =
                documentSnapshot.data();


            const gallery =
                Array.isArray(
                    data.gallery
                )
                    ? data.gallery
                    : [];


            return {

                id:
                    documentSnapshot.id,

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
                    data.price ??
                    "",

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

                accommodations:
                    Array.isArray(
                        data.accommodations
                    )
                        ? data.accommodations
                        : [],

                gallery:
                    gallery,

                image:
                    gallery?.[0]?.url ||
                    data.image ||
                    "",

                createdAt:
                    data.createdAt ||
                    "",

                updatedAt:
                    data.updatedAt ||
                    ""

            };

        }


        /* =====================================================
           PAGE STATES
           ===================================================== */

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


            if (
                tourGrid
            ) {

                tourGrid.innerHTML =
                    "";

            }


            if (
                tourResultText
            ) {

                tourResultText.textContent =
                    "Loading packages...";

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


            if (
                tourResultText
            ) {

                tourResultText.textContent =
                    "Unable to load packages.";

            }

        }


        /* =====================================================
           LOAD PACKAGES
           ===================================================== */

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


                packages =
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
                    "CLIENT ACTIVE PACKAGES:",
                    packages
                );


                populateCategories();


                renderPackages();


            } catch (error) {

                console.error(
                    "CLIENT PACKAGES LOAD ERROR:",
                    error
                );


                packages =
                    [];


                showErrorState();

            }

        }


        /* =====================================================
           CATEGORIES
           ===================================================== */

        function populateCategories() {

            if (
                !tourCategoryFilter
            ) {

                return;

            }


            const currentValue =
                tourCategoryFilter.value ||
                "all";


            const categories =
                [
                    ...new Set(
                        packages
                            .map(
                                packageItem =>
                                    String(
                                        packageItem.category ||
                                        ""
                                    ).trim()
                            )
                            .filter(Boolean)
                    )
                ]
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            a.localeCompare(
                                b
                            )
                    );


            tourCategoryFilter.innerHTML = `
                <option value="all">
                    All Packages
                </option>
            `;


            categories.forEach(
                category => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        category;


                    option.textContent =
                        category;


                    tourCategoryFilter.appendChild(
                        option
                    );

                }
            );


            if (
                [
                    ...tourCategoryFilter.options
                ].some(
                    option =>
                        option.value ===
                        currentValue
                )
            ) {

                tourCategoryFilter.value =
                    currentValue;

            }

        }


        /* =====================================================
           FILTER PACKAGES
           ===================================================== */

        function getFilteredPackages() {

            const searchValue =
                normalizeText(
                    tourSearch?.value
                );


            const categoryValue =
                tourCategoryFilter?.value ||
                "all";


            const sortValue =
                tourSort?.value ||
                "newest";


            let result =
                packages.filter(
                    packageItem => {

                        const searchable = [
                            packageItem.name,
                            packageItem.location,
                            packageItem.category,
                            packageItem.duration,
                            packageItem.description
                        ]
                            .join(
                                " "
                            )
                            .toLowerCase();


                        const matchesSearch =
                            !searchValue ||
                            searchable.includes(
                                searchValue
                            );


                        const matchesCategory =
                            categoryValue ===
                                "all" ||
                            packageItem.category ===
                                categoryValue;


                        return (
                            matchesSearch &&
                            matchesCategory
                        );

                    }
                );


            result.sort(
                (
                    a,
                    b
                ) => {

                    if (
                        sortValue ===
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
                        sortValue ===
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
                        sortValue ===
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
                        sortValue ===
                        "name-za"
                    ) {

                        return String(
                            b.name || ""
                        ).localeCompare(
                            String(
                                a.name || ""
                            ),
                            "en",
                            {
                                sensitivity:
                                    "base"
                            }
                        );

                    }


                    const aTime =
                        Date.parse(
                            a.createdAt ||
                            a.updatedAt ||
                            ""
                        ) || 0;


                    const bTime =
                        Date.parse(
                            b.createdAt ||
                            b.updatedAt ||
                            ""
                        ) || 0;


                    return (
                        bTime -
                        aTime
                    );

                }
            );


            return result;

        }


        /* =====================================================
           RENDER PACKAGES
           ===================================================== */

        function renderPackages() {

            hideLoadingState();


            tourError?.classList.add(
                "hidden"
            );


            if (
                !tourGrid
            ) {

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


                if (
                    tourResultText
                ) {

                    tourResultText.textContent =
                        packages.length === 0
                            ? "No active packages available."
                            : "No packages match your search.";

                }


                return;

            }


            tourEmpty?.classList.add(
                "hidden"
            );


            if (
                tourResultText
            ) {

                tourResultText.textContent =
                    `${filteredPackages.length} available ${
                        filteredPackages.length === 1
                            ? "package"
                            : "packages"
                    }`;

            }


            filteredPackages.forEach(
                packageItem => {

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


                    card.innerHTML = `

                        <div class="tour-card-image">

                            ${
                                image

                                    ? `
                                        <img
                                            src="${escapeHtml(image)}"
                                            alt="${escapeHtml(
                                                packageItem.name
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


                            ${
                                packageItem.category

                                    ? `
                                        <span class="tour-category-badge">
                                            ${escapeHtml(
                                                packageItem.category
                                            )}
                                        </span>
                                    `

                                    : ""
                            }

                        </div>


                        <div class="tour-card-body">

                            <div class="tour-location">

                                <i class="fa-solid fa-location-dot"></i>

                                <span>
                                    ${escapeHtml(
                                        packageItem.location ||
                                        "Philippines"
                                    )}
                                </span>

                            </div>


                            <h3>
                                ${escapeHtml(
                                    packageItem.name ||
                                    "Tour Package"
                                )}
                            </h3>



                            <div class="tour-card-price">

                                <div class="tour-price-inline">

                                    <strong>
                                        ₱${formatMoney(
                                            packageItem.price
                                        )}
                                    </strong>

                                    ${
                                        packageItem.duration

                                            ? `
                                                <span>
                                                    / ${escapeHtml(
                                                        packageItem.duration
                                                    )}
                                                </span>
                                              `

                                            : ""
                                    }

                                </div>

                            </div>


                            <div class="tour-card-actions">

                                <button
                                    type="button"
                                    class="view-tour-btn"
                                    data-action="view"
                                    data-id="${escapeHtml(
                                        packageItem.id
                                    )}"
                                >

                                    <i class="fa-regular fa-eye"></i>

                                    View Details

                                </button>


                                <button
                                    type="button"
                                    class="book-tour-btn"
                                    data-action="book"
                                    data-id="${escapeHtml(
                                        packageItem.id
                                    )}"
                                >

                                    <i class="fa-solid fa-calendar-check"></i>

                                    Book Now

                                </button>

                            </div>

                        </div>

                    `;


                    tourGrid.appendChild(
                        card
                    );

                }
            );

        }


        /* =====================================================
           GET PACKAGE
           ===================================================== */

        function getPackageById(
            packageId
        ) {

            return packages.find(
                packageItem =>
                    packageItem.id ===
                    packageId
            ) || null;

        }


        /* =====================================================
           MODAL LIST
           ===================================================== */

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

                                        <span>
                                            ${escapeHtml(item)}
                                        </span>

                                    </li>

                                `
                            )
                            .join("")
                    }

                </ul>

            `;

        }


        /* =====================================================
           ACCOMMODATIONS HTML
           ===================================================== */

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
                                        type ===
                                        "included"

                                            ? "Included"

                                            : (
                                                price &&
                                                normalizeText(
                                                    price
                                                ) !== "tbd"

                                                    ? `+₱${formatMoney(
                                                        price
                                                    )}`

                                                    : "Additional / TBD"
                                            );


                                    return `

                                        <div
                                            style="
                                                margin-top:8px;
                                                padding:12px;
                                                border:1px solid #e4ebf2;
                                                border-radius:10px;
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
                                                                max-height:170px;
                                                                object-fit:cover;
                                                                border-radius:8px;
                                                                margin-bottom:10px;
                                                            "
                                                        >
                                                    `

                                                    : ""
                                            }


                                            <strong
                                                style="
                                                    display:block;
                                                    color:#274e75;
                                                    font-size:11px;
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
                                                                margin-top:4px;
                                                                color:#7c8fa3;
                                                                font-size:9px;
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
                                                    margin-top:7px;
                                                    padding:5px 8px;
                                                    border-radius:6px;
                                                    background:#eaf4fd;
                                                    color:#1767b7;
                                                    font-size:8px;
                                                    font-weight:700;
                                                "
                                            >
                                                ${escapeHtml(
                                                    priceLabel
                                                )}
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



        /* =====================================================
           GALLERY HTML
           ===================================================== */

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
                images.length === 0
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
                            src="${escapeHtml(
                                mainImage
                            )}"
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


        /* =====================================================
           OPEN TOUR DETAILS
           ===================================================== */

        function openTourDetails(
            packageId
        ) {

            const packageItem =
                getPackageById(
                    packageId
                );


            if (
                !packageItem
            ) {

                return;

            }


            selectedPackage =
                packageItem;


            const image =
                getPackageImage(
                    packageItem
                );


            if (
                tourModalTitle
            ) {

                tourModalTitle.textContent =
                    packageItem.name ||
                    "Package Details";

            }


            if (
                tourModalContent
            ) {

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
                                packageItem.name
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

                                    <h4>
                                        About This Tour
                                    </h4>

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

                                    <h4>
                                        Inclusions
                                    </h4>

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

                                    <h4>
                                        Exclusions
                                    </h4>

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

                                    <h4>
                                        Accommodation Options
                                    </h4>

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

                                    <h4>
                                        Itinerary
                                    </h4>

                                    <p
                                        style="
                                            white-space:pre-line;
                                        "
                                    >
                                        ${escapeHtml(
                                            packageItem.itinerary
                                        )}
                                    </p>

                                </section>
                            `

                            : ""
                    }

                `;

            }


            tourModalContent
                ?.querySelectorAll(
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
                                        activeThumbnail => {

                                            activeThumbnail.classList.remove(
                                                "active"
                                            );

                                        }
                                    );


                                thumbnail.classList.add(
                                    "active"
                                );

                            }
                        );

                    }
                );


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


        /* =====================================================
           CLOSE MODAL
           ===================================================== */

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


        /* =====================================================
           BOOK PACKAGE
           ===================================================== */

        function bookPackage(
            packageId
        ) {

            const packageItem =
                getPackageById(
                    packageId
                );


            if (
                !packageItem
            ) {

                return;

            }


            /*
             * We only pass the Firestore package ID.
             *
             * booking.js will load the actual package
             * from Firestore again. This prevents
             * trusting package price/details from URL.
             */

            window.location.href =
                `booking.html?package=${encodeURIComponent(
                    packageItem.id
                )}`;

        }


        /* =====================================================
           GRID ACTIONS
           ===================================================== */

        tourGrid?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-action]"
                    );


                if (
                    !button
                ) {

                    return;

                }


                const packageId =
                    button.dataset.id;


                const action =
                    button.dataset.action;


                if (
                    action ===
                    "view"
                ) {

                    openTourDetails(
                        packageId
                    );

                    return;

                }


                if (
                    action ===
                    "book"
                ) {

                    bookPackage(
                        packageId
                    );

                }

            }
        );


        /* =====================================================
           SEARCH
           ===================================================== */

        tourSearch?.addEventListener(
            "input",
            renderPackages
        );


        /* =====================================================
           CATEGORY FILTER
           ===================================================== */

        tourCategoryFilter?.addEventListener(
            "change",
            renderPackages
        );


        /* =====================================================
           SORT BY
           ===================================================== */

        tourSort?.addEventListener(
            "change",
            renderPackages
        );


        /* =====================================================
           MODAL EVENTS
           ===================================================== */

        closeTourModal?.addEventListener(
            "click",
            closeDetailsModal
        );


        closeTourDetails?.addEventListener(
            "click",
            closeDetailsModal
        );


        tourModalBackdrop?.addEventListener(
            "click",
            closeDetailsModal
        );


        tourBookNow?.addEventListener(
            "click",
            () => {

                if (
                    !selectedPackage
                ) {

                    return;

                }


                bookPackage(
                    selectedPackage.id
                );

            }
        );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeDetailsModal();

                }

            }
        );


        /* =====================================================
           RETRY
           ===================================================== */

        retryTours?.addEventListener(
            "click",
            loadPackages
        );


        /* =====================================================
           INITIAL LOAD
           ===================================================== */

        loadPackages();

    }
);