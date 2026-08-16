/* ==========================================================
   TRIPS WONDER - CUSTOMER HOME
   FIREBASE PACKAGE VERSION
   ========================================================== */


/* ==========================================================
   FIREBASE
========================================================== */

import {

    db,
    collection,
    getDocs,
    doc,
    getDoc

} from "../../js/firebase/firebase-db.js";


/* ==========================================================
   CUSTOMER NAME
========================================================== */

const customerName =
    document.getElementById("customerName");


if (customerName) {

    customerName.textContent =
        "Eric";

}


/* ==========================================================
   ELEMENTS
========================================================== */

const searchInput =
    document.getElementById("searchInput");


const exploreTours =
    document.getElementById("exploreTours");


/* ==========================================================
   CUSTOMER PACKAGES
========================================================== */

let customerPackages = [];


/* ==========================================================
   LOAD PACKAGES FROM FIREBASE
   Admin Packages → Firestore → Customer Home
========================================================== */

async function loadCustomerPackages() {

    if (!exploreTours) {

        return;

    }


    try {

        console.log(
            "Loading packages from Firebase..."
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
                    packageDoc => {

                        return {

                            id:
                                packageDoc.id,

                            ...packageDoc.data()

                        };

                    }
                )
                .filter(
                    packageItem =>
                        packageItem.status ===
                        "active"
                );


        console.log(
            "ACTIVE CUSTOMER PACKAGES:",
            customerPackages
        );


        renderCustomerPackages();


    } catch (error) {

        console.error(
            "FAILED TO LOAD CUSTOMER PACKAGES:",
            error
        );


        showPackageError();

    }

}


/* ==========================================================
   FORMAT PRICE
========================================================== */

function formatPrice(
    price
) {

    if (
        price === undefined ||
        price === null ||
        price === ""
    ) {

        return "Price Coming Soon";

    }


    const numericPrice =
        Number(
            String(price)
                .replace(
                    /[₱,\s]/g,
                    ""
                )
        );


    if (
        !Number.isNaN(
            numericPrice
        ) &&
        numericPrice > 0
    ) {

        return `FROM ₱${numericPrice.toLocaleString(
            "en-PH"
        )}`;

    }


    return String(price);

}


/* ==========================================================
   GET PACKAGE IMAGE
   Supports Admin Package Gallery
========================================================== */

function getPackageImage(
    packageItem
) {

    /*
     * Admin Packages stores gallery as:
     *
     * gallery: [
     *     {
     *         name: "...",
     *         url: "..."
     *     }
     * ]
     */


    if (
        Array.isArray(
            packageItem.gallery
        ) &&
        packageItem.gallery.length > 0
    ) {

        const firstPhoto =
            packageItem.gallery[0];


        if (
            typeof firstPhoto ===
            "string"
        ) {

            return firstPhoto;

        }


        if (
            firstPhoto &&
            firstPhoto.url
        ) {

            return firstPhoto.url;

        }

    }


    /*
     * Fallback for older package data.
     */

    if (
        packageItem.image
    ) {

        return packageItem.image;

    }


    return "";

}


/* ==========================================================
   GET PACKAGE DURATION
========================================================== */

function getPackageDuration(
    packageItem
) {

    if (
        packageItem.duration
    ) {

        return packageItem.duration;

    }


    const days =
        packageItem.days ||
        "";


    const nights =
        packageItem.nights ||
        "";


    if (
        days &&
        nights
    ) {

        return `${days} • ${nights}`;

    }


    if (days) {

        return days;

    }


    if (nights) {

        return nights;

    }


    return "";

}


/* ==========================================================
   CREATE PACKAGE CARD
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


    /* ======================================================
       PACKAGE DATA
    ====================================================== */

    const packageId =
        packageItem.id;


    const packageName =
        packageItem.name ||
        "Travel Package";


    const packageCategory =
        packageItem.category ||
        "Tour";


    const packageLocation =
        packageItem.location ||
        "";


    const packagePrice =
        formatPrice(
            packageItem.price
        );


    const packageDuration =
        getPackageDuration(
            packageItem
        );


    const packageImage =
        getPackageImage(
            packageItem
        );


    /* ======================================================
       SEARCH DATA
    ====================================================== */

    card.dataset.packageId =
        packageId || "";


    card.dataset.packageName =
        packageName;


    card.dataset.packageCategory =
        packageCategory;


    card.dataset.packageLocation =
        packageLocation;


    card.dataset.packageCode =
        packageItem.code ||
        "";


    /* ======================================================
       IMAGE
    ====================================================== */

    const imageHTML =
        packageImage
            ? `
                <img
                    src="${packageImage}"
                    alt="${packageName}"
                    loading="lazy"
                >
              `
            : `
                <div
                    class="explore-image-placeholder"
                >
                    🏝️
                </div>
              `;


    /* ======================================================
       CARD HTML
    ====================================================== */

    card.innerHTML = `

        <div class="explore-image">

            ${imageHTML}

        </div>


        <div class="explore-content">

            <span class="explore-category">

                ${packageCategory}

            </span>


            <h3 class="explore-title">

                ${packageName}

            </h3>


            ${
                packageLocation
                    ? `
                        <p class="explore-location">

                            ${packageLocation}

                        </p>
                      `
                    : ""
            }


            <span class="explore-price">

                ${packagePrice}

            </span>


            ${
                packageDuration
                    ? `
                        <p class="explore-duration">

                            ${packageDuration}

                        </p>
                      `
                    : ""
            }

        </div>

    `;


    /* ======================================================
       OPEN PACKAGE DETAILS
    ====================================================== */

    const openPackage =
        () => {

            if (!packageId) {

                console.warn(
                    "Package has no Firestore ID:",
                    packageItem
                );

                return;

            }


            window.location.href =
                `package-details.html?id=${encodeURIComponent(
                    packageId
                )}`;

        };


    /* ======================================================
       CLICK
    ====================================================== */

    card.addEventListener(
        "click",
        openPackage
    );


    /* ======================================================
       KEYBOARD
    ====================================================== */

    card.setAttribute(
        "tabindex",
        "0"
    );


    card.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openPackage();

            }

        }
    );


    return card;

}


/* ==========================================================
   RENDER CUSTOMER PACKAGES
========================================================== */

function renderCustomerPackages() {

    if (!exploreTours) {

        return;

    }


    exploreTours.innerHTML =
        "";


    if (
        customerPackages.length ===
        0
    ) {

        showEmptyPackages();

        return;

    }


    customerPackages.forEach(
        packageItem => {

            const card =
                createPackageCard(
                    packageItem
                );


            exploreTours.appendChild(
                card
            );

        }
    );

}


/* ==========================================================
   SEARCH PACKAGES
========================================================== */

function searchPackages(
    searchValue
) {

    const value =
        searchValue
            .trim()
            .toLowerCase();


    const cards =
        document.querySelectorAll(
            ".explore-card"
        );


    cards.forEach(
        card => {

            const packageName =
                (
                    card.dataset
                        .packageName ||
                    ""
                )
                    .toLowerCase();


            const packageCategory =
                (
                    card.dataset
                        .packageCategory ||
                    ""
                )
                    .toLowerCase();


            const packageLocation =
                (
                    card.dataset
                        .packageLocation ||
                    ""
                )
                    .toLowerCase();


            const packageCode =
                (
                    card.dataset
                        .packageCode ||
                    ""
                )
                    .toLowerCase();


            const searchableText =
                `
                    ${packageName}
                    ${packageCategory}
                    ${packageLocation}
                    ${packageCode}
                `;


            const matches =
                !value ||
                searchableText.includes(
                    value
                );


            card.style.display =
                matches
                    ? ""
                    : "none";

        }
    );

}


/* ==========================================================
   SEARCH EVENT
========================================================== */

searchInput?.addEventListener(
    "input",
    event => {

        searchPackages(
            event.target.value
        );

    }
);


/* ==========================================================
   EMPTY STATE
========================================================== */

function showEmptyPackages() {

    if (!exploreTours) {

        return;

    }


    exploreTours.innerHTML = `

        <div class="packages-empty">

            <div
                class="packages-empty-icon"
            >

                🧳

            </div>


            <h3>

                No tours available

            </h3>


            <p>

                New travel packages
                will be available soon.

            </p>

        </div>

    `;

}


/* ==========================================================
   ERROR STATE
========================================================== */

function showPackageError() {

    if (!exploreTours) {

        return;

    }


    exploreTours.innerHTML = `

        <div class="packages-empty">

            <div
                class="packages-empty-icon"
            >

                ⚠️

            </div>


            <h3>

                Unable to load tours

            </h3>


            <p>

                Please try again later.

            </p>

        </div>

    `;

}


/* ==========================================================
   UPCOMING TRIP
========================================================== */

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


const upcomingTripPrice =
    document.getElementById(
        "upcomingTripPrice"
    );


const upcomingTripButton =
    document.getElementById(
        "upcomingTripButton"
    );


/* ==========================================================
   FORMAT UPCOMING DATE
========================================================== */

function formatUpcomingDate(
    value
) {

    if (!value) {

        return "";

    }


    /*
       Firestore Timestamp
    */

    if (
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .toLocaleDateString(
                "en-US",
                {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                }
            );

    }


    /*
       JavaScript Date
    */

    if (
        value instanceof Date
    ) {

        return value.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

    }


    /*
       String date
    */

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


/* ==========================================================
   GET BOOKING PACKAGE
   Uses package data already loaded from Admin
========================================================== */

function findBookedPackage(
    booking
) {

    const packageId =
        booking.packageId ||
        booking.packageID ||
        booking.package_id;


    if (!packageId) {

        return null;

    }


    return customerPackages.find(
        packageItem =>
            packageItem.id ===
            packageId
    ) || null;

}


/* ==========================================================
   LOAD UPCOMING TRIP
========================================================== */

async function loadUpcomingTrip() {

    /*
       If the new Upcoming Trip HTML
       does not exist yet, simply stop.
    */

    if (!upcomingTripCard) {

        return;

    }


    const bookingId =
        localStorage.getItem(
            "latestBookingId"
        );


    /*
       No booking yet
    */

    if (!bookingId) {

        upcomingTripCard.hidden =
            true;


        if (noUpcomingTrip) {

            noUpcomingTrip.hidden =
                false;

        }


        return;

    }


    try {

        console.log(
            "Loading upcoming booking:",
            bookingId
        );


        const bookingReference =
            doc(
                db,
                "bookings",
                bookingId
            );


        const bookingSnapshot =
            await getDoc(
                bookingReference
            );


        if (
            !bookingSnapshot.exists()
        ) {

            console.warn(
                "Booking not found:",
                bookingId
            );


            upcomingTripCard.hidden =
                true;


            if (noUpcomingTrip) {

                noUpcomingTrip.hidden =
                    false;

            }


            return;

        }


        const booking = {

            id:
                bookingSnapshot.id,

            ...bookingSnapshot.data()

        };


        console.log(
            "CUSTOMER UPCOMING BOOKING:",
            booking
        );


        /*
           Find the same package from
           Admin Packages / Firestore.
        */

        const bookedPackage =
            findBookedPackage(
                booking
            );


        /*
           Use booking data first.
           Fallback to the package
           from Admin Packages.
        */

        const packageName =
            booking.packageName ||
            bookedPackage?.name ||
            "Upcoming Trip";


        const packageCategory =
            booking.packageCategory ||
            bookedPackage?.category ||
            "Tour";


        const packageLocation =
            booking.packageLocation ||
            bookedPackage?.location ||
            "";


        const packageImage =
            booking.packageImage ||
            getPackageImage(
                bookedPackage || {}
            );


        const packagePrice =
            booking.packagePrice ||
            bookedPackage?.price ||
            "";


        const packageDuration =
            booking.packageDuration ||
            booking.duration ||
            getPackageDuration(
                bookedPackage || {}
            );


        /* ==================================================
           IMAGE
        ================================================== */

        if (upcomingTripImage) {

            upcomingTripImage.src =
                packageImage ||
                "../../assets/images/logo.png";


            upcomingTripImage.alt =
                packageName;

        }


        /* ==================================================
           CATEGORY
        ================================================== */

        if (upcomingTripCategory) {

            upcomingTripCategory.textContent =
                packageCategory;

        }


        /* ==================================================
           NAME
        ================================================== */

        if (upcomingTripName) {

            upcomingTripName.textContent =
                packageName;

        }


        /* ==================================================
           LOCATION
        ================================================== */

        if (upcomingTripLocation) {

            upcomingTripLocation.textContent =
                packageLocation;

        }


        /* ==================================================
           TRAVEL DATE
        ================================================== */

        const startDate =
            formatUpcomingDate(
                booking.startTravelDate ||
                booking.travelDate
            );


        const endDate =
            formatUpcomingDate(
                booking.endTravelDate
            );


        let schedule = "";


        if (
            startDate &&
            endDate
        ) {

            schedule =
                `${startDate} – ${endDate}`;

        } else if (startDate) {

            schedule =
                startDate;

        }


        if (packageDuration) {

            schedule +=
                ` • ${packageDuration}`;

        }


        if (upcomingTripSchedule) {

            upcomingTripSchedule.textContent =
                schedule ||
                "Upcoming trip";

        }


        /* ==================================================
           PRICE
        ================================================== */

        if (upcomingTripPrice) {

            upcomingTripPrice.textContent =
                formatPrice(
                    packagePrice
                )
                    .replace(
                        "FROM ",
                        ""
                    );

        }


        /* ==================================================
           SHOW
        ================================================== */

        upcomingTripCard.hidden =
            false;


        if (noUpcomingTrip) {

            noUpcomingTrip.hidden =
                true;

        }


    } catch (error) {

        console.error(
            "FAILED TO LOAD UPCOMING TRIP:",
            error
        );


        upcomingTripCard.hidden =
            true;


        if (noUpcomingTrip) {

            noUpcomingTrip.hidden =
                false;

        }

    }

}


/* ==========================================================
   MY TRIP BUTTON
========================================================== */

if (upcomingTripButton) {

    upcomingTripButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "my-trip.html";

        }
    );

}


/* ==========================================================
   INITIAL LOAD
========================================================== */

async function initializeHome() {

    /*
       IMPORTANT:
       Load Admin Packages FIRST.
       Then load Upcoming Trip.

       This allows the Upcoming Trip
       to find the package from the
       same Firestore package collection.
    */

    await loadCustomerPackages();

    await loadUpcomingTrip();

}


initializeHome();
