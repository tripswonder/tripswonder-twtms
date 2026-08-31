/* ==========================================================
   TRIPS WONDER — CUSTOMER HOME
   DIRECT FIREBASE AUTH VERSION
   ========================================================== */


/* ==========================================================
   FIREBASE CONFIG
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
    getDocs,
    doc,
    getDoc,
    query,
    where

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* ==========================================================
   ELEMENTS
   ========================================================== */

const customerName =
    document.getElementById(
        "customerName"
    );


const customerGreeting =
    document.getElementById(
        "customerGreeting"
    );


const headerSearchButton =
    document.getElementById(
        "headerSearchButton"
    );


const searchSection =
    document.getElementById(
        "searchSection"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const searchCloseButton =
    document.getElementById(
        "searchCloseButton"
    );


const tourCategoryList =
    document.getElementById(
        "tourCategoryList"
    );


const exploreTours =
    document.getElementById(
        "exploreTours"
    );


const packageResultText =
    document.getElementById(
        "packageResultText"
    );


const upcomingTripCard =
    document.getElementById(
        "upcomingTripCard"
    );


const noUpcomingTrip =
    document.getElementById(
        "noUpcomingTrip"
    );


const upcomingTripImage =
    document.getElementById(
        "upcomingTripImage"
    );


const upcomingTripCategory =
    document.getElementById(
        "upcomingTripCategory"
    );


const upcomingTripName =
    document.getElementById(
        "upcomingTripName"
    );


const upcomingTripLocation =
    document.getElementById(
        "upcomingTripLocation"
    );


const upcomingTripSchedule =
    document.getElementById(
        "upcomingTripSchedule"
    );


const upcomingTripReference =
    document.getElementById(
        "upcomingTripReference"
    );


const upcomingTripButton =
    document.getElementById(
        "upcomingTripButton"
    );



/* ==========================================================
   PACKAGE DETAILS MODAL ELEMENTS
   ========================================================== */

const packageDetailsModal = document.getElementById("packageDetailsModal");
const packageModalClose = document.getElementById("packageModalClose");
const packageModalGallery = document.getElementById("packageModalGallery");
const packageModalTitle = document.getElementById("packageModalTitle");
const packageModalCategory = document.getElementById("packageModalCategory");
const packageModalName = document.getElementById("packageModalName");
const packageModalLocation = document.getElementById("packageModalLocation");
const packageModalPrice = document.getElementById("packageModalPrice");
const packageModalDuration = document.getElementById("packageModalDuration");
const packageModalAboutSection = document.getElementById("packageModalAboutSection");
const packageModalAbout = document.getElementById("packageModalAbout");
const packageModalInclusionsSection = document.getElementById("packageModalInclusionsSection");
const packageModalInclusions = document.getElementById("packageModalInclusions");
const packageModalExclusionsSection = document.getElementById("packageModalExclusionsSection");
const packageModalExclusions = document.getElementById("packageModalExclusions");
const packageModalAccommodationSection = document.getElementById("packageModalAccommodationSection");
const packageModalAccommodations = document.getElementById("packageModalAccommodations");
const packageModalItinerarySection = document.getElementById("packageModalItinerarySection");
const packageModalItinerary = document.getElementById("packageModalItinerary");
const packageModalBookButton = document.getElementById("packageModalBookButton");

let selectedDetailsPackage = null;


/* ==========================================================
   STATE
   ========================================================== */

let currentUser =
    null;


let currentProfile =
    null;


let customerPackages =
    [];


let customerBookings =
    [];


let activeCategory =
    "all";


let currentSearch =
    "";


/* ==========================================================
   HELPERS
   ========================================================== */

function normalizeText(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

}


function normalizeNumber(
    value
) {

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


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


function formatMoney(
    value
) {

    return normalizeNumber(
        value
    ).toLocaleString(
        "en-PH",
        {
            minimumFractionDigits:
                0,

            maximumFractionDigits:
                2
        }
    );

}


function escapeHtml(
    value
) {

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


function getPackageImage(
    packageItem
) {

    if (
        Array.isArray(
            packageItem?.gallery
        )
    ) {

        const firstValidImage =
            packageItem.gallery.find(
                item =>
                    typeof item ===
                        "string" ||
                    (
                        item &&
                        item.url
                    )
            );


        if (
            typeof firstValidImage ===
            "string"
        ) {

            return firstValidImage;

        }


        if (
            firstValidImage?.url
        ) {

            return firstValidImage.url;

        }

    }


    return (
        packageItem?.image ||
        ""
    );

}


function getPackageDuration(
    packageItem
) {

    return String(
        packageItem?.duration ||
        ""
    ).trim();

}


function toDate(
    value
) {

    if (!value) {
        return null;
    }


    if (
        typeof value?.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    const date =
        value instanceof Date
            ? value
            : new Date(
                value
            );


    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

}


function formatDate(
    value
) {

    const date =
        toDate(
            value
        );


    if (!date) {
        return "";
    }


    return date.toLocaleDateString(
        "en-PH",
        {
            month:
                "short",

            day:
                "numeric",

            year:
                "numeric"
        }
    );

}


/* ==========================================================
   CUSTOMER DISPLAY NAME
   ========================================================== */

function getDisplayName(
    user,
    profile
) {

    const candidates = [

        profile?.firstName,
        profile?.firstname,
        profile?.givenName,
        profile?.displayName,
        profile?.fullName,
        profile?.name,
        profile?.customerName,
        user?.displayName

    ];


    const selected =
        candidates.find(
            value =>
                String(
                    value ||
                    ""
                ).trim()
        );


    if (selected) {

        return String(
            selected
        )
            .trim()
            .split(/\s+/)[0];

    }


    const email =
        String(
            user?.email ||
            profile?.email ||
            ""
        ).trim();


    if (email) {

        const emailName =
            email
                .split("@")[0]
                .replace(
                    /[._-]+/g,
                    " "
                )
                .trim();


        return emailName
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );

    }


    return "Traveler";

}


function renderCustomerProfile() {

    if (
        customerName
    ) {

        customerName.textContent =
            getDisplayName(
                currentUser,
                currentProfile
            );

    }


    if (
        customerGreeting
    ) {

        customerGreeting.textContent =
            "Ready for your next adventure?";

    }

}


/* ==========================================================
   SEARCH
   ========================================================== */

function openSearch() {

    if (!searchSection) {
        return;
    }


    searchSection.hidden =
        false;


    requestAnimationFrame(
        () => {

            searchInput?.focus();

        }
    );

}


function closeSearch() {

    if (!searchSection) {
        return;
    }


    searchSection.hidden =
        true;


    if (
        searchInput
    ) {

        searchInput.value =
            "";

    }


    currentSearch =
        "";


    renderCustomerPackages();

}


headerSearchButton
    ?.addEventListener(
        "click",
        openSearch
    );


searchCloseButton
    ?.addEventListener(
        "click",
        closeSearch
    );


searchInput
    ?.addEventListener(
        "input",
        event => {

            currentSearch =
                normalizeText(
                    event.target.value
                );


            renderCustomerPackages();

        }
    );


/* ==========================================================
   LOAD PROFILE
   ========================================================== */

async function loadCurrentProfile(
    user
) {

    const profileSnapshot =
        await getDoc(
            doc(
                db,
                "users",
                user.uid
            )
        );


    if (
        !profileSnapshot.exists()
    ) {

        throw new Error(
            "Customer profile was not found."
        );

    }


    return {

        uid:
            user.uid,

        ...profileSnapshot.data()

    };

}


/* ==========================================================
   LOAD ACTIVE PACKAGES
   ========================================================== */

async function loadCustomerPackages() {

    console.log(
        "HOME: Loading packages..."
    );


    const snapshot =
        await getDocs(
            collection(
                db,
                "packages"
            )
        );


    customerPackages =
        snapshot.docs
            .map(
                packageDoc => ({

                    id:
                        packageDoc.id,

                    ...packageDoc.data()

                })
            )
            .filter(
                packageItem => {

                    return (
                        normalizeText(
                            packageItem.status ||
                            "active"
                        ) ===
                        "active"
                    );

                }
            );


    console.log(
        "HOME ACTIVE PACKAGES:",
        customerPackages.length
    );


    populateCategories();

    renderCustomerPackages();

}


/* ==========================================================
   CATEGORY FILTER
   ========================================================== */

function populateCategories() {

    if (!tourCategoryList) {
        return;
    }


    const categories =
        [
            ...new Set(
                customerPackages
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


    tourCategoryList.innerHTML = `
        <button
            type="button"
            class="tour-category-btn active"
            data-category="all"
        >
            All
        </button>
    `;


    categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "tour-category-btn";


            button.dataset.category =
                category;


            button.textContent =
                category;


            tourCategoryList.appendChild(
                button
            );

        }
    );


    tourCategoryList
        .querySelectorAll(
            ".tour-category-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        activeCategory =
                            button.dataset.category ||
                            "all";


                        tourCategoryList
                            .querySelectorAll(
                                ".tour-category-btn.active"
                            )
                            .forEach(
                                activeButton =>
                                    activeButton.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add(
                            "active"
                        );


                        renderCustomerPackages();

                    }
                );

            }
        );

}


/* ==========================================================
   PACKAGE FILTER
   ========================================================== */

function getVisiblePackages() {

    return customerPackages.filter(
        packageItem => {

            const matchesCategory =
                activeCategory ===
                    "all" ||
                String(
                    packageItem.category ||
                    ""
                ) ===
                    activeCategory;


            const searchable =
                [
                    packageItem.name,
                    packageItem.location,
                    packageItem.category,
                    packageItem.duration,
                    packageItem.code,
                    packageItem.description
                ]
                    .join(
                        " "
                    )
                    .toLowerCase();


            const matchesSearch =
                !currentSearch ||
                searchable.includes(
                    currentSearch
                );


            return (
                matchesCategory &&
                matchesSearch
            );

        }
    );

}



/* ==========================================================
   PACKAGE DETAILS MODAL
   ========================================================== */

function normalizeDetailArray(value) {

    if (Array.isArray(value)) {

        return value
            .map(item => {

                if (typeof item === "string") {
                    return item.trim();
                }

                return String(
                    item?.name ||
                    item?.title ||
                    item?.label ||
                    item?.description ||
                    ""
                ).trim();

            })
            .filter(Boolean);

    }

    if (typeof value === "string") {

        return value
            .split(/\r?\n|,\s*/)
            .map(item => item.trim())
            .filter(Boolean);

    }

    return [];

}


function getPackageGallery(packageItem) {

    const images = [];

    if (Array.isArray(packageItem?.gallery)) {

        packageItem.gallery.forEach(item => {

            const url =
                typeof item === "string"
                    ? item
                    : item?.url;

            if (url && !images.includes(url)) {
                images.push(url);
            }

        });

    }

    if (packageItem?.image && !images.includes(packageItem.image)) {
        images.unshift(packageItem.image);
    }

    return images;

}


function renderDetailList(element, section, items) {

    const list = normalizeDetailArray(items);

    if (!element || !section) {
        return;
    }

    if (!list.length) {

        section.hidden = true;
        element.innerHTML = "";

        return;
    }

    section.hidden = false;

    element.innerHTML = list
        .map(item => `
            <li>${escapeHtml(item)}</li>
        `)
        .join("");

}


function renderAccommodations(accommodations) {

    if (!packageModalAccommodationSection || !packageModalAccommodations) {
        return;
    }

    const list =
        Array.isArray(accommodations)
            ? accommodations
            : normalizeDetailArray(accommodations);

    if (!list.length) {

        packageModalAccommodationSection.hidden = true;
        packageModalAccommodations.innerHTML = "";

        return;
    }

    packageModalAccommodationSection.hidden = false;

    packageModalAccommodations.innerHTML = list
        .map(item => {

            if (typeof item === "string") {

                return `
                    <div class="package-accommodation-item">
                        <strong>${escapeHtml(item)}</strong>
                    </div>
                `;
            }

            const name =
                item?.name ||
                item?.type ||
                item?.title ||
                "Accommodation";

            const details = [
                item?.description,
                item?.capacity
                    ? `Capacity: ${item.capacity}`
                    : "",
                item?.price
                    ? `₱${formatMoney(item.price)}`
                    : ""
            ]
                .filter(Boolean)
                .join(" · ");

            return `
                <div class="package-accommodation-item">

                    <strong>
                        ${escapeHtml(name)}
                    </strong>

                    ${
                        details
                            ? `<span>${escapeHtml(details)}</span>`
                            : ""
                    }

                </div>
            `;

        })
        .join("");

}


function openPackageDetails(packageItem) {

    if (!packageDetailsModal) {
        return;
    }

    selectedDetailsPackage = packageItem;

    const name =
        packageItem?.name ||
        "Tour Package";

    const category =
        packageItem?.category ||
        "Tour";

    const location =
        packageItem?.location ||
        "Philippines";

    const duration =
        getPackageDuration(packageItem);

    const about =
        String(
            packageItem?.about ||
            packageItem?.description ||
            ""
        ).trim();

    const gallery =
        getPackageGallery(packageItem);

    packageModalTitle.textContent = name;
    packageModalName.textContent = name;
    packageModalCategory.textContent = category;
    packageModalLocation.textContent = location;
    packageModalPrice.textContent = `₱${formatMoney(packageItem?.price)}`;
    packageModalDuration.textContent = duration ? `/ ${duration}` : "";

    if (gallery.length) {

        packageModalGallery.innerHTML = gallery
            .slice(0, 8)
            .map((image, index) => `
                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(name)} photo ${index + 1}"
                    loading="lazy">
            `)
            .join("");

    } else {

        packageModalGallery.innerHTML = `
            <div class="package-modal-gallery-empty">
                <i class="fa-solid fa-image"></i>
            </div>
        `;
    }

    if (about) {

        packageModalAboutSection.hidden = false;
        packageModalAbout.textContent = about;

    } else {

        packageModalAboutSection.hidden = true;
        packageModalAbout.textContent = "";
    }

    renderDetailList(
        packageModalInclusions,
        packageModalInclusionsSection,
        packageItem?.inclusions
    );

    renderDetailList(
        packageModalExclusions,
        packageModalExclusionsSection,
        packageItem?.exclusions
    );

    renderAccommodations(
        packageItem?.accommodations ||
        packageItem?.accommodation
    );

    const itinerary =
        typeof packageItem?.itinerary === "string"
            ? packageItem.itinerary.trim()
            : Array.isArray(packageItem?.itinerary)
                ? packageItem.itinerary
                    .map(item =>
                        typeof item === "string"
                            ? item
                            : [
                                item?.day || item?.title,
                                item?.description || item?.details
                            ]
                                .filter(Boolean)
                                .join(" — ")
                    )
                    .filter(Boolean)
                    .join("\n")
                : "";

    if (itinerary) {

        packageModalItinerarySection.hidden = false;
        packageModalItinerary.textContent = itinerary;

    } else {

        packageModalItinerarySection.hidden = true;
        packageModalItinerary.textContent = "";
    }

    packageDetailsModal.classList.add("show");
    packageDetailsModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("package-modal-open");

}


function closePackageDetails() {

    if (!packageDetailsModal) {
        return;
    }

    packageDetailsModal.classList.remove("show");
    packageDetailsModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("package-modal-open");

    selectedDetailsPackage = null;

}


packageModalClose
    ?.addEventListener(
        "click",
        closePackageDetails
    );


packageDetailsModal
    ?.addEventListener(
        "click",
        event => {

            if (event.target.closest("[data-close-package-modal]")) {
                closePackageDetails();
            }

        }
    );


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            packageDetailsModal?.classList.contains("show")
        ) {
            closePackageDetails();
        }

    }
);


packageModalBookButton
    ?.addEventListener(
        "click",
        () => {

            if (!selectedDetailsPackage?.id) {
                return;
            }

            window.location.href =
                `booking.html?package=${encodeURIComponent(
                    selectedDetailsPackage.id
                )}`;

        }
    );


/* ==========================================================
   PACKAGE CARD
   ========================================================== */

function createPackageCard(
    packageItem
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "explore-card";


    const packageImage =
        getPackageImage(
            packageItem
        );


    const duration =
        getPackageDuration(
            packageItem
        );


    card.innerHTML = `

        <div class="explore-image">

            ${
                packageImage

                    ? `
                        <img
                            src="${escapeHtml(
                                packageImage
                            )}"
                            alt="${escapeHtml(
                                packageItem.name ||
                                "Tour Package"
                            )}"
                            loading="lazy"
                        >
                      `

                    : `
                        <div class="explore-image-placeholder">

                            <i class="fa-solid fa-image"></i>

                        </div>
                      `
            }


            ${
                packageItem.category

                    ? `
                        <span class="explore-category">

                            ${escapeHtml(
                                packageItem.category
                            )}

                        </span>
                      `

                    : ""
            }

        </div>


        <div class="explore-content">

            ${
                packageItem.location

                    ? `
                        <p class="explore-location">

                            <i class="fa-solid fa-location-dot"></i>

                            <span>

                                ${escapeHtml(
                                    packageItem.location
                                )}

                            </span>

                        </p>
                      `

                    : ""
            }


            <h3 class="explore-title">

                ${escapeHtml(
                    packageItem.name ||
                    "Tour Package"
                )}

            </h3>


            <div class="explore-price-line">

                <strong class="explore-price">

                    ₱${formatMoney(
                        packageItem.price
                    )}

                </strong>


                ${
                    duration

                        ? `
                            <span class="explore-duration">

                                / ${escapeHtml(
                                    duration
                                )}

                            </span>
                          `

                        : ""
                }

            </div>


            <div class="explore-actions">

                <button
                    type="button"
                    class="explore-details-btn">

                    <i class="fa-regular fa-eye"></i>

                    View Details

                </button>


                <button
                    type="button"
                    class="explore-book-btn">

                    <i class="fa-solid fa-calendar-check"></i>

                    Book Now

                </button>

            </div>

        </div>

    `;


    const detailsButton =
        card.querySelector(
            ".explore-details-btn"
        );


    const bookButton =
        card.querySelector(
            ".explore-book-btn"
        );


    detailsButton
    ?.addEventListener(
        "click",
        () => {

            openPackageDetails(
                packageItem
            );

        }
    );


    bookButton
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    `booking.html?package=${encodeURIComponent(
                        packageItem.id
                    )}`;

            }
        );


    return card;

}


/* ==========================================================
   RENDER PACKAGES
   ========================================================== */

function renderCustomerPackages() {

    if (!exploreTours) {
        return;
    }


    const visiblePackages =
        getVisiblePackages();


    exploreTours.innerHTML =
        "";


    if (
        packageResultText
    ) {

        packageResultText.textContent =
            `${visiblePackages.length} available ${
                visiblePackages.length === 1
                    ? "package"
                    : "packages"
            }`;

    }


    if (
        visiblePackages.length ===
        0
    ) {

        exploreTours.innerHTML = `
            <div class="packages-empty">

                <i class="fa-solid fa-suitcase-rolling"></i>

                <strong>
                    No tours found
                </strong>

                <span>
                    Try another search or category.
                </span>

            </div>
        `;


        return;

    }


    /*
     * HOME NOW SHOWS ALL ACTIVE PACKAGES.
     */

    visiblePackages
        .forEach(
            packageItem => {

                exploreTours.appendChild(
                    createPackageCard(
                        packageItem
                    )
                );

            }
        );

}


/* ==========================================================
   LOAD ACTUAL CUSTOMER BOOKINGS
   ========================================================== */

async function loadCustomerBookings() {

    const email =
        normalizeText(
            currentUser?.email ||
            currentProfile?.email ||
            ""
        );


    if (!email) {

        customerBookings =
            [];

        return;

    }


    console.log(
        "HOME: Loading bookings for:",
        email
    );


    const customerBookingQuery =
    query(
        collection(
            db,
            "bookings"
        ),
        where(
            "customerUid",
            "==",
            currentUser.uid
        )
    );


    const snapshot =
        await getDocs(
            customerBookingQuery
        );


    customerBookings =
        snapshot.docs.map(
            bookingDoc => ({

                id:
                    bookingDoc.id,

                ...bookingDoc.data()

            })
        );


    console.log(
        "HOME CUSTOMER BOOKINGS:",
        customerBookings.length
    );

}


/* ==========================================================
   UPCOMING BOOKING
   ========================================================== */

function getUpcomingBooking() {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return customerBookings
        .filter(
            booking => {

                const status =
                    normalizeText(
                        booking.bookingStatus ||
                        booking.status ||
                        ""
                    );


                if (
                    status ===
                        "cancelled" ||
                    status ===
                        "canceled"
                ) {

                    return false;

                }


                const travelDate =
                    toDate(
                        booking.travelStartDate ||
                        booking.startTravelDate ||
                        booking.travelDate
                    );


                return (
                    travelDate &&
                    travelDate >=
                        today
                );

            }
        )
        .sort(
            (
                a,
                b
            ) => {

                return (
                    toDate(
                        a.travelStartDate ||
                        a.startTravelDate ||
                        a.travelDate
                    ) -
                    toDate(
                        b.travelStartDate ||
                        b.startTravelDate ||
                        b.travelDate
                    )
                );

            }
        )[0] ||
        null;

}


function renderUpcomingTrip() {

    const booking =
        getUpcomingBooking();


    if (!booking) {

        upcomingTripCard.hidden =
            true;


        noUpcomingTrip.hidden =
            false;


        return;

    }


    const packageItem =
        customerPackages.find(
            item =>
                item.id ===
                booking.packageId
        ) ||
        {};


    const name =
        booking.packageName ||
        packageItem.name ||
        "Upcoming Trip";


    const category =
        booking.packageCategory ||
        packageItem.category ||
        "Tour";


    const location =
        booking.packageLocation ||
        packageItem.location ||
        "Philippines";


    const image =
        booking.packageImage ||
        getPackageImage(
            packageItem
        ) ||
        "../../assets/images/logo.png";


    const start =
        formatDate(
            booking.travelStartDate ||
            booking.startTravelDate ||
            booking.travelDate
        );


    const end =
        formatDate(
            booking.travelEndDate ||
            booking.endTravelDate
        );


    const duration =
        booking.duration ||
        packageItem.duration ||
        "";


    let schedule =
        "";


    if (
        start &&
        end
    ) {

        schedule =
            `${start} – ${end}`;

    } else {

        schedule =
            start;

    }


    if (
        duration
    ) {

        schedule +=
            `${schedule ? " · " : ""}${duration}`;

    }


    upcomingTripImage.src =
        image;


    upcomingTripImage.alt =
        name;


    upcomingTripCategory.textContent =
        category;


    upcomingTripName.textContent =
        name;


    upcomingTripLocation.textContent =
        location;


    upcomingTripSchedule.textContent =
        schedule ||
        "Upcoming trip";


    upcomingTripReference.textContent =
        booking.bookingNumber ||
        booking.bookingReference ||
        "—";


    upcomingTripCard.hidden =
        false;


    noUpcomingTrip.hidden =
        true;

}


/* ==========================================================
   MY TRIP BUTTON
   ========================================================== */

upcomingTripButton
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "my-trip.html";

        }
    );


/* ==========================================================
   AUTH + HOME INITIALIZATION
   ========================================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            console.warn(
                "HOME: No authenticated customer."
            );


            window.location.replace(
                "../../index.html"
            );


            return;

        }


        try {

            currentUser =
                user;


            currentProfile =
                await loadCurrentProfile(
                    user
                );


            const role =
                normalizeText(
                    currentProfile.role ||
                    "client"
                );


            if (
                role !==
                "client"
            ) {

                console.warn(
                    "HOME: Non-client account denied.",
                    role
                );


                window.location.replace(
                    "../../index.html"
                );


                return;

            }


            console.log(
                "HOME AUTHORIZED CUSTOMER:",
                {
                    uid:
                        user.uid,

                    email:
                        user.email,

                    profile:
                        currentProfile
                }
            );
            try {

                await loadCustomerPackages();

            } catch (packageError) {

                console.error(
                    "HOME PACKAGE ERROR:",
                    packageError
                );


                if (
                    packageResultText
                ) {

                    packageResultText.textContent =
                        "Unable to load tours";

                }


                if (
                    exploreTours
                ) {

                    exploreTours.innerHTML = `
                        <div class="packages-empty">

                            <i class="fa-solid fa-triangle-exclamation"></i>

                            <strong>
                                Unable to load tours
                            </strong>

                            <span>
                                Please refresh and try again.
                            </span>

                        </div>
                    `;

                }

            }


            try {

                await loadCustomerBookings();

                renderUpcomingTrip();

            } catch (bookingError) {

                console.error(
                    "HOME BOOKING ERROR:",
                    bookingError
                );


                upcomingTripCard.hidden =
                    true;


                noUpcomingTrip.hidden =
                    false;

            }


            console.log(
                "CUSTOMER HOME READY"
            );


        } catch (error) {

            console.error(
                "CUSTOMER HOME INITIALIZATION ERROR:",
                error
            );

        }

    }
);
