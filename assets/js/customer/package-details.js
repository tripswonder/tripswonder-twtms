/* ==========================================================
   TRIPS WONDER - CUSTOMER PACKAGE DETAILS
   FIREBASE VERSION
   ========================================================== */

import {
    db,
    doc,
    getDoc
} from "../../js/firebase/firebase-db.js";


/* ==========================================================
   GET PACKAGE ID
========================================================== */

const params =
    new URLSearchParams(
        window.location.search
    );


const packageId =
    params.get("id");


/* ==========================================================
   ELEMENTS
========================================================== */

const packageMainImage =
    document.getElementById(
        "packageMainImage"
    );


const packageGallery =
    document.getElementById(
        "packageGallery"
    );


const packageCategory =
    document.getElementById(
        "packageCategory"
    );


const packageName =
    document.getElementById(
        "packageName"
    );


const packageLocation =
    document.getElementById(
        "packageLocation"
    );


const packagePrice =
    document.getElementById(
        "packagePrice"
    );


const packageDays =
    document.getElementById(
        "packageDays"
    );


const packageNights =
    document.getElementById(
        "packageNights"
    );


const packageDescription =
    document.getElementById(
        "packageDescription"
    );


const packageInclusions =
    document.getElementById(
        "packageInclusions"
    );


const packageSchedule =
    document.getElementById(
        "packageSchedule"
    );


const bookButton =
    document.getElementById(
        "bookButton"
    );


/* ==========================================================
   LOAD PACKAGE
========================================================== */

async function loadPackageDetails() {

    if (!packageId) {

        console.error(
            "No package ID found in URL."
        );

        showPackageError(
            "Package not found."
        );

        return;

    }


    try {

        console.log(
            "Loading package:",
            packageId
        );


        const packageRef =
            doc(
                db,
                "packages",
                packageId
            );


        const packageSnapshot =
            await getDoc(
                packageRef
            );


        if (
            !packageSnapshot.exists()
        ) {

            console.error(
                "Package does not exist:",
                packageId
            );


            showPackageError(
                "This package is no longer available."
            );


            return;

        }


        const packageData =
            packageSnapshot.data();


        console.log(
            "PACKAGE FROM FIRESTORE:",
            packageData
        );


        /* ==================================================
           STATUS CHECK
        ================================================== */

        if (
            packageData.status &&
            packageData.status !==
                "active"
        ) {

            showPackageError(
                "This package is currently unavailable."
            );


            return;

        }


        /* ==================================================
           DISPLAY PACKAGE
        ================================================== */

        displayPackage(
            packageData
        );


    } catch (error) {

        console.error(
            "FAILED TO LOAD PACKAGE DETAILS:",
            error
        );


        showPackageError(
            "Unable to load package details."
        );

    }

}


/* ==========================================================
   DISPLAY PACKAGE
========================================================== */

function displayPackage(
    packageData
) {

    /* ======================================================
       CATEGORY
    ====================================================== */

    if (packageCategory) {

        packageCategory.textContent =
            packageData.category ||
            "Tour";

    }


    /* ======================================================
       NAME
    ====================================================== */

    if (packageName) {

        packageName.textContent =
            packageData.name ||
            "Travel Package";

    }


    /* ======================================================
       LOCATION
    ====================================================== */

    if (packageLocation) {

        packageLocation.textContent =
            packageData.location ||
            "";

    }


    /* ======================================================
       PRICE
    ====================================================== */

    if (packagePrice) {

        packagePrice.textContent =
            formatPrice(
                packageData.price
            );

    }


    /* ======================================================
       DURATION
    ====================================================== */

    if (packageDays) {

        packageDays.textContent =
            getDays(
                packageData
            );

    }


    if (packageNights) {

        packageNights.textContent =
            getNights(
                packageData
            );

    }


    /* ======================================================
       DESCRIPTION
    ====================================================== */

    if (packageDescription) {

        packageDescription.textContent =
            packageData.description ||
            "No description available.";

    }


    /* ======================================================
       INCLUSIONS
    ====================================================== */

    renderInclusions(
        packageData.inclusions
    );

    /* ======================================================
   EXCLUSIONS
====================================================== */

renderExclusions(
    packageData.exclusions
);


/* ======================================================
   ACCOMMODATIONS
====================================================== */

renderAccommodations(
    packageData.accommodations
);

/* ==========================================================
   RENDER EXCLUSIONS
========================================================== */

function renderExclusions(
    exclusions
) {

    const exclusionList =
        document.getElementById(
            "packageExclusions"
        );


    if (!exclusionList) {
        return;
    }


    exclusionList.innerHTML =
        "";


    if (
        !Array.isArray(exclusions) ||
        exclusions.length === 0
    ) {

        const li =
            document.createElement(
                "li"
            );


        li.textContent =
            "No exclusions available.";


        exclusionList.appendChild(
            li
        );


        return;

    }


    exclusions.forEach(
        exclusion => {

            const li =
                document.createElement(
                    "li"
                );


            li.textContent =
                exclusion;


            exclusionList.appendChild(
                li
            );

        }
    );

}


/* ==========================================================
   RENDER ACCOMMODATIONS
========================================================== */

function renderAccommodations(
    accommodations
) {

    const accommodationContainer =
        document.getElementById(
            "packageAccommodations"
        );


    if (!accommodationContainer) {
        return;
    }


    accommodationContainer.innerHTML =
        "";


    if (
        !Array.isArray(
            accommodations
        ) ||
        accommodations.length === 0
    ) {

        accommodationContainer.innerHTML = `

            <div class="accommodation-empty">

                No accommodation information
                available.

            </div>

        `;

        return;

    }


    accommodations.forEach(
        accommodation => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "customer-accommodation-card";


            const name =
                accommodation.name ||
                "Accommodation";


            const capacity =
                accommodation.capacity ||
                "";


            const type =
                accommodation.type ||
                "";


            const price =
                accommodation.price ||
                "";


            const photo =
                accommodation.photo ||
                "";


            card.innerHTML = `

                ${
                    photo
                        ? `
                            <div
                                class="customer-accommodation-image"
                            >

                                <img
                                    src="${photo}"
                                    alt="${name}"
                                    loading="lazy"
                                >

                            </div>
                          `
                        : ""
                }


                <div
                    class="customer-accommodation-content"
                >

                    <h4>
                        ${name}
                    </h4>


                    ${
                        capacity
                            ? `
                                <p>
                                    ${capacity}
                                </p>
                              `
                            : ""
                    }


                    ${
                        type
                            ? `
                                <span
                                    class="customer-accommodation-type"
                                >
                                    ${
                                        type ===
                                        "included"
                                            ? "Included"
                                            : "Additional"
                                    }
                                </span>
                              `
                            : ""
                    }


                    ${
                        price &&
                        price !== "TBD"
                            ? `
                                <strong>
                                    ${price}
                                </strong>
                              `
                            : ""
                    }

                </div>

            `;


            accommodationContainer.appendChild(
                card
            );

        }
    );

}


    /* ======================================================
       SCHEDULE / ITINERARY
    ====================================================== */

    if (packageSchedule) {

    packageSchedule.innerHTML =
        formatItinerary(
            packageData.itinerary
        );

}

/* ==========================================================
   FORMAT ITINERARY
   FINAL MOBILE TIMELINE
========================================================== */

function formatItinerary(itinerary) {

    if (!itinerary) {

        return `
            <div class="itinerary-empty">
                Tour information will be provided.
            </div>
        `;

    }

    const text =
        String(itinerary)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\s+/g, " ")
            .trim();


    /*
     * Find each DAY section.
     *
     * Supports:
     * DAY 0 - DEPARTURE
     * DAY 0 – DEPARTURE
     * DAY 0 — DEPARTURE
     */

    const dayPattern =
        /(?:^|\s)(DAY\s*\d+)\s*[-–—]\s*(.*?)(?=\s+DAY\s*\d+\s*[-–—]\s*|$)/gis;


    const days = [];

    let match;


    while (
        (match = dayPattern.exec(text)) !== null
    ) {

        const dayNumber =
            match[1].trim();

        const dayContent =
            match[2].trim();


        /*
         * Find the first time.
         *
         * Everything BEFORE the first time
         * becomes the day description/title.
         */

        const firstTimeMatch =
            dayContent.match(
                /\d{1,2}:\d{2}\s*(?:AM|PM|NN)/i
            );


        let dayTitle =
            "";

        let activitiesText =
            dayContent;


        if (firstTimeMatch) {

            const firstTimeIndex =
                dayContent.search(
                    /\d{1,2}:\d{2}\s*(?:AM|PM|NN)/i
                );


            dayTitle =
                dayContent
                    .substring(
                        0,
                        firstTimeIndex
                    )
                    .trim();


            activitiesText =
                dayContent
                    .substring(
                        firstTimeIndex
                    )
                    .trim();

        }


        days.push({

            dayNumber,

            dayTitle,

            activitiesText

        });

    }


    /*
     * If no DAY sections exist,
     * show normal itinerary.
     */

    if (days.length === 0) {

        return `
            <div class="itinerary-content">

                ${escapeItineraryHTML(text)}

            </div>
        `;

    }


    let html = "";


    /*
     * MAIN TITLE
     */

    html += `

        <div class="itinerary-title">

            🌲 BAGUIO CITY TOUR — 2D1N

        </div>

    `;


    /*
     * RENDER DAYS
     */

    days.forEach(
        day => {

            const activities =
                splitItineraryActivities(
                    day.activitiesText
                );


            html += `

                <div class="itinerary-day">

                    <div class="itinerary-day-title">

                        ${escapeItineraryHTML(
                            day.dayNumber
                        )}

                        ${
                            day.dayTitle
                                ? `
                                    <span class="itinerary-day-description">

                                        — ${escapeItineraryHTML(
                                            day.dayTitle
                                        )}

                                    </span>
                                  `
                                : ""
                        }

                    </div>


                    <div class="itinerary-timeline">

            `;


            activities.forEach(
                activity => {

                    html += `

                        <div class="itinerary-item">

                            <div class="itinerary-dot"></div>


                            <div class="itinerary-item-content">

                                ${
                                    activity.time
                                        ? `
                                            <span class="itinerary-time">

                                                ${escapeItineraryHTML(
                                                    activity.time
                                                )}

                                            </span>
                                          `
                                        : ""
                                }


                                <span class="itinerary-activity">

                                    ${escapeItineraryHTML(
                                        activity.description
                                    )}

                                </span>

                            </div>

                        </div>

                    `;

                }
            );


            html += `

                    </div>

                </div>

            `;

        }
    );


    return `

        <div class="itinerary-content">

            ${html}

        </div>

    `;

}


/* ==========================================================
   SPLIT ACTIVITIES BY TIME
========================================================== */

function splitItineraryActivities(
    text
) {

    if (!text) {

        return [];

    }


    let cleaned =
        String(text)
            .replace(/\s+/g, " ")
            .replace(/[–—]/g, "-")
            .trim();


    /*
     * Add separator before every time.
     */

    cleaned =
        cleaned.replace(
            /(\d{1,2}:\d{2}\s*(?:AM|PM|NN))/gi,
            "\n$1"
        );


    const rawActivities =
        cleaned
            .split("\n")
            .map(
                item =>
                    item.trim()
            )
            .filter(
                item =>
                    item.length > 0
            );


    const activities = [];


    rawActivities.forEach(
        item => {

            const timeMatch =
                item.match(
                    /^(\d{1,2}:\d{2}\s*(?:AM|PM|NN))\s*[-–—]?\s*(.*)$/i
                );


            if (timeMatch) {

                activities.push({

                    time:
                        timeMatch[1],

                    description:
                        timeMatch[2].trim()

                });

            }

        }
    );


    return activities;

}

/* ======================================================
       GALLERY
====================================================== */

    renderGallery(
        packageData
    );


    /* ======================================================
       BOOK NOW
    ====================================================== */

    if (bookButton) {

    bookButton.onclick = () => {

        window.location.href =
            `booking.html?id=${encodeURIComponent(
                packageId
            )}`;

    };

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

        return `₱${numericPrice.toLocaleString(
            "en-PH"
        )}`;

    }


    return String(price);

}


/* ==========================================================
   GET DAYS
========================================================== */

function getDays(
    packageData
) {

    if (
        packageData.days
    ) {

        return packageData.days;

    }


    const duration =
        packageData.duration ||
        "";


    const match =
        duration.match(
            /(\d+)\s*D/i
        );


    if (match) {

        return `${match[1]} Days`;

    }


    return "—";

}


/* ==========================================================
   GET NIGHTS
========================================================== */

function getNights(
    packageData
) {

    if (
        packageData.nights
    ) {

        return packageData.nights;

    }


    const duration =
        packageData.duration ||
        "";


    const match =
        duration.match(
            /(\d+)\s*N/i
        );


    if (match) {

        return `${match[1]} Nights`;

    }


    return "—";

}


/* ==========================================================
   RENDER INCLUSIONS
========================================================== */

function renderInclusions(
    inclusions
) {

    if (!packageInclusions) {
        return;
    }


    packageInclusions.innerHTML =
        "";


    if (
        !Array.isArray(
            inclusions
        ) ||
        inclusions.length === 0
    ) {

        const li =
            document.createElement(
                "li"
            );


        li.textContent =
            "No inclusions available.";


        packageInclusions.appendChild(
            li
        );


        return;

    }


    inclusions.forEach(
        inclusion => {

            const li =
                document.createElement(
                    "li"
                );


            li.textContent =
                inclusion;


            packageInclusions.appendChild(
                li
            );

        }
    );

}


/* ==========================================================
   GET GALLERY
========================================================== */

function getGallery(
    packageData
) {

    const gallery = [];


    /* ======================================================
       ADMIN FIRESTORE GALLERY
    ====================================================== */

    if (
        Array.isArray(
            packageData.gallery
        )
    ) {

        packageData.gallery.forEach(
            photo => {

                if (
                    typeof photo ===
                    "string"
                ) {

                    gallery.push(
                        photo
                    );

                } else if (
                    photo &&
                    photo.url
                ) {

                    gallery.push(
                        photo.url
                    );

                }

            }
        );

    }


    /* ======================================================
       FALLBACK IMAGE
    ====================================================== */

    if (
        gallery.length === 0 &&
        packageData.image
    ) {

        gallery.push(
            packageData.image
        );

    }


    return gallery;

}


/* ==========================================================
   RENDER GALLERY
========================================================== */

function renderGallery(
    packageData
) {

    if (
        !packageMainImage ||
        !packageGallery
    ) {

        return;

    }


    const gallery =
        getGallery(
            packageData
        );


    packageGallery.innerHTML =
        "";


    if (
        gallery.length === 0
    ) {

        packageMainImage.removeAttribute(
            "src"
        );


        packageMainImage.alt =
            "No package photo";


        return;

    }


    /* ======================================================
       MAIN PHOTO
    ====================================================== */

    packageMainImage.src =
        gallery[0];


    packageMainImage.alt =
        packageData.name ||
        "Package Photo";


    /* ======================================================
       THUMBNAILS
    ====================================================== */

    gallery.forEach(
        (photo, index) => {

            const thumbnail =
                document.createElement(
                    "button"
                );


            thumbnail.type =
                "button";


            thumbnail.className =
                "package-thumbnail";


            if (
                index === 0
            ) {

                thumbnail.classList.add(
                    "active"
                );

            }


            const image =
                document.createElement(
                    "img"
                );


            image.src =
                photo;


            image.alt =
                `${packageData.name || "Package"} Photo ${
                    index + 1
                }`;


            /* ==================================================
               INVALID IMAGE
            ================================================== */

            image.addEventListener(
                "error",
                () => {

                    thumbnail.remove();

                }
            );


            thumbnail.appendChild(
                image
            );


            /* ==================================================
               THUMBNAIL CLICK
            ================================================== */

            thumbnail.addEventListener(
                "click",
                () => {

                    packageMainImage.src =
                        photo;


                    packageMainImage.alt =
                        `${packageData.name || "Package"} Photo ${
                            index + 1
                        }`;


                    packageGallery
                        .querySelectorAll(
                            ".package-thumbnail"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                    thumbnail.classList.add(
                        "active"
                    );

                }
            );


            packageGallery.appendChild(
                thumbnail
            );

        }
    );

}


/* ==========================================================
   ERROR STATE
========================================================== */

function showPackageError(
    message
) {

    if (packageName) {

        packageName.textContent =
            "Package Unavailable";

    }


    if (packageDescription) {

        packageDescription.textContent =
            message;

    }


    if (packageCategory) {

        packageCategory.textContent =
            "Unavailable";

    }


    if (packageLocation) {

        packageLocation.textContent =
            "";

    }


    if (packagePrice) {

        packagePrice.textContent =
            "";

    }


    if (packageInclusions) {

        packageInclusions.innerHTML =
            "";

    }


    if (packageSchedule) {

        packageSchedule.textContent =
            "";

    }


    if (bookButton) {

        bookButton.disabled =
            true;

        bookButton.textContent =
            "Package Unavailable";

    }

}

/* ==========================================================
   ESCAPE ITINERARY HTML
========================================================== */

function escapeItineraryHTML(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}

/* ==========================================================
   START
========================================================== */

loadPackageDetails();