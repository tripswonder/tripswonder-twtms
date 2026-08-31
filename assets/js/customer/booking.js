/* ==========================================================
   TRIPS WONDER
   CUSTOMER BOOKING
========================================================== */


/* ==========================================================
   FIRESTORE
========================================================== */

import {

    db,
    collection,
    addDoc

} from "../firebase/firebase-db.js";


import {

    doc,
    getDoc,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* ==========================================================
   PACKAGE ID
========================================================== */

const params =
    new URLSearchParams(
        window.location.search
    );


const packageId =
    params.get("id");


console.log(
    "Booking Package ID:",
    packageId
);


/* ==========================================================
   ELEMENTS
========================================================== */

const bookingForm =
    document.getElementById(
        "bookingForm"
    );


const bookingBack =
    document.getElementById(
        "bookingBack"
    );


const packageImage =
    document.getElementById(
        "bookingPackageImage"
    );


const packageCategory =
    document.getElementById(
        "bookingPackageCategory"
    );


const packageName =
    document.getElementById(
        "bookingPackageName"
    );


const packageLocation =
    document.getElementById(
        "bookingPackageLocation"
    );


const packagePrice =
    document.getElementById(
        "bookingPackagePrice"
    );


const accommodationOptions =
    document.getElementById(
        "accommodationOptions"
    );


const bookingError =
    document.getElementById(
        "bookingError"
    );


const continueButton =
    document.getElementById(
        "continueBooking"
    );


/* ==========================================================
   PACKAGE
========================================================== */

let selectedPackage = null;


/* ==========================================================
   BACK BUTTON
========================================================== */

if (bookingBack) {

    bookingBack.addEventListener(
        "click",
        () => {

            history.back();

        }
    );

}


/* ==========================================================
   START TRAVEL DATE
==========================================================

   We support the old ID "travelDate" temporarily
   so the page will not break while the HTML is being
   updated to "startTravelDate".
========================================================== */

let startTravelDate =
    document.getElementById(
        "startTravelDate"
    );


if (!startTravelDate) {

    startTravelDate =
        document.getElementById(
            "travelDate"
        );

}


/* ==========================================================
   END TRAVEL DATE
========================================================== */

let endTravelDate =
    document.getElementById(
        "endTravelDate"
    );


/* ==========================================================
   DATE MINIMUM
========================================================== */

function setMinimumTravelDate() {

    if (!startTravelDate) {

        return;

    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            today.getDate()
        ).padStart(
            2,
            "0"
        );


    startTravelDate.min =
        `${year}-${month}-${day}`;

}


setMinimumTravelDate();


/* ==========================================================
   IMAGE PATH
========================================================== */

function getImagePath(
    image
) {

    if (!image) {

        return "../../assets/images/logo.png";

    }


    if (
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("../../") ||
        image.startsWith("../")
    ) {

        return image;

    }


    return `../../assets/images/${image}`;

}


/* ==========================================================
   PACKAGE IMAGE
========================================================== */

function getPackageImage(
    pkg
) {

    /*
       Admin Packages may use gallery.
    */

    if (
        Array.isArray(
            pkg.gallery
        ) &&
        pkg.gallery.length > 0
    ) {

        const firstImage =
            pkg.gallery[0];


        if (
            typeof firstImage ===
            "string"
        ) {

            return firstImage;

        }


        if (
            firstImage &&
            firstImage.url
        ) {

            return firstImage.url;

        }

    }


    /*
       Fallback to image field.
    */

    if (pkg.image) {

        return pkg.image;

    }


    return "";

}


/* ==========================================================
   PRICE
========================================================== */

function formatPrice(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "Price Coming Soon";

    }


    if (
        typeof value === "number"
    ) {

        return `₱${value.toLocaleString(
            "en-PH"
        )}`;

    }


    const text =
        String(value);


    return text.startsWith("₱")
        ? text
        : `₱${text}`;

}


/* ==========================================================
   LOAD PACKAGE FROM FIRESTORE
========================================================== */

async function loadPackage() {

    if (!packageId) {

        showError(
            "No package was selected."
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

            showError(
                "The selected package could not be found."
            );

            return;

        }


        selectedPackage = {

            id:
                packageSnapshot.id,

            ...packageSnapshot.data()

        };


        console.log(
            "Selected Package:",
            selectedPackage
        );


        renderPackage();


        setupEndDate();


    } catch (error) {

        console.error(
            "PACKAGE LOAD ERROR:",
            error
        );


        showError(
            "Unable to load package information."
        );

    }

}


/* ==========================================================
   RENDER PACKAGE
========================================================== */

function renderPackage() {

    if (!selectedPackage) {

        return;

    }


    const pkg =
        selectedPackage;


    /* ======================================================
       IMAGE
    ====================================================== */

    if (packageImage) {

        packageImage.src =
            getImagePath(
                getPackageImage(
                    pkg
                )
            );


        packageImage.alt =
            pkg.name ||
            "Tour Package";

    }


    /* ======================================================
       CATEGORY
    ====================================================== */

    if (packageCategory) {

        packageCategory.textContent =
            pkg.category ||
            "Tour";

    }


    /* ======================================================
       NAME
    ====================================================== */

    if (packageName) {

        packageName.textContent =
            pkg.name ||
            "Tour Package";

    }


    /* ======================================================
       LOCATION
    ====================================================== */

    if (packageLocation) {

        packageLocation.textContent =
            pkg.location ||
            "";

    }


    /* ======================================================
       PRICE
    ====================================================== */

    if (packagePrice) {

        packagePrice.textContent =
            formatPrice(
                pkg.price
            );

    }


    /* ======================================================
       ACCOMMODATION
    ====================================================== */

    renderAccommodation();

}


/* ==========================================================
   GET PACKAGE DAYS
========================================================== */

function getPackageDays(
    pkg
) {

    /*
       Example:
       "2 Days" → 2
       "3 Days" → 3
       "4 Days" → 4
    */

    if (pkg.days) {

        const daysMatch =
            String(
                pkg.days
            ).match(
                /\d+/
            );


        if (daysMatch) {

            return Number(
                daysMatch[0]
            );

        }

    }


    /*
       Example:
       "2D1N" → 2
       "3D2N" → 3
    */

    const duration =
        String(
            pkg.duration ||
            ""
        );


    const durationMatch =
        duration.match(
            /(\d+)\s*D/i
        );


    if (durationMatch) {

        return Number(
            durationMatch[1]
        );

    }


    /*
       Example:
       "1 Night" → 2 Days
       "2 Nights" → 3 Days
    */

    if (pkg.nights) {

        const nightsMatch =
            String(
                pkg.nights
            ).match(
                /\d+/
            );


        if (nightsMatch) {

            return (
                Number(
                    nightsMatch[0]
                ) + 1
            );

        }

    }


    /*
       Default
    */

    return 1;

}


/* ==========================================================
   GET PACKAGE DURATION
========================================================== */

function getPackageDuration(
    pkg
) {

    if (pkg.duration) {

        return pkg.duration;

    }


    if (
        pkg.days &&
        pkg.nights
    ) {

        return `${pkg.days} / ${pkg.nights}`;

    }


    if (pkg.days) {

        return String(
            pkg.days
        );

    }


    return "";

}


/* ==========================================================
   ADD DAYS TO DATE
========================================================== */

function addDaysToDate(
    dateValue,
    days
) {

    if (!dateValue) {

        return "";

    }


    const date =
        new Date(
            `${dateValue}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    date.setDate(
        date.getDate() + days
    );


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/* ==========================================================
   CREATE END DATE FIELD IF NEEDED
========================================================== */

function setupEndDate() {

    if (!startTravelDate) {

        return;

    }


    /*
       If the HTML already has:
       #endTravelDate

       use it.

       Otherwise create it automatically.
    */

    if (!endTravelDate) {

        createEndDateField();

    }


    if (!endTravelDate) {

        return;

    }


    endTravelDate.readOnly =
        true;


    endTravelDate.disabled =
        true;


    endTravelDate.addEventListener(
        "change",
        () => {

            updateEndTravelDate();

        }
    );


    startTravelDate.addEventListener(
        "change",
        () => {

            updateEndTravelDate();

        }
    );


    updateEndTravelDate();

}


/* ==========================================================
   CREATE END DATE FIELD
========================================================== */

function createEndDateField() {

    if (!startTravelDate) {

        return;

    }


    const startGroup =
        startTravelDate.closest(
            ".form-group"
        );


    if (!startGroup) {

        return;

    }


    const endGroup =
        document.createElement(
            "div"
        );


    endGroup.className =
        "form-group";


    endGroup.innerHTML = `

        <label for="endTravelDate">

            End Travel Date

        </label>


        <input
            type="date"
            id="endTravelDate"
            readonly
            disabled>


        <small
            id="endTravelDateHint"
            class="travel-date-hint">

            Automatically calculated
            based on package duration.

        </small>

    `;


    /*
       Put End Date immediately
       after Start Date.
    */

    startGroup.parentNode.insertBefore(
        endGroup,
        startGroup.nextSibling
    );


    endTravelDate =
        document.getElementById(
            "endTravelDate"
        );

}


/* ==========================================================
   UPDATE END TRAVEL DATE
========================================================== */

function updateEndTravelDate() {

    if (
        !startTravelDate ||
        !endTravelDate ||
        !selectedPackage
    ) {

        return;

    }


    const startDate =
        startTravelDate.value;


    if (!startDate) {

        endTravelDate.value =
            "";


        endTravelDate.removeAttribute(
            "min"
        );


        return;

    }


    const totalDays =
        getPackageDays(
            selectedPackage
        );


    /*
       2D1N = start + 1
       3D2N = start + 2
       4D3N = start + 3
    */

    const additionalDays =
        Math.max(
            totalDays - 1,
            0
        );


    const calculatedEndDate =
        addDaysToDate(
            startDate,
            additionalDays
        );


    endTravelDate.value =
        calculatedEndDate;


    endTravelDate.min =
        calculatedEndDate;


    console.log(
        "Travel Schedule:",
        {
            startTravelDate:
                startDate,

            endTravelDate:
                calculatedEndDate,

            packageDays:
                totalDays
        }
    );

}


/* ==========================================================
   ACCOMMODATION
========================================================== */

function renderAccommodation() {

    if (!accommodationOptions) {

        return;

    }


    accommodationOptions.innerHTML =
        "";


    const accommodations =
        selectedPackage?.accommodations ||
        selectedPackage?.accommodation ||
        [];


    /*
       No accommodation data
    */

    if (
        !Array.isArray(
            accommodations
        ) ||
        accommodations.length === 0
    ) {

        createAccommodation(
            {
                name:
                    "Standard Accommodation",

                description:
                    "Included in package",

                image:
                    getPackageImage(
                        selectedPackage
                    )

            },
            true
        );


        return;

    }


    accommodations.forEach(
        (
            item,
            index
        ) => {

            createAccommodation(
                item,
                index === 0
            );

        }
    );

}


/* ==========================================================
   CREATE ACCOMMODATION
========================================================== */

function createAccommodation(
    item,
    selected
) {

    const option =
        document.createElement(
            "label"
        );


    option.className =
        "accommodation-option";


    if (selected) {

        option.classList.add(
            "selected"
        );

    }


    const radio =
        document.createElement(
            "input"
        );


    radio.type =
        "radio";


    radio.name =
        "accommodation";


    radio.value =
        item.name ||
        item.type ||
        "Standard Accommodation";


    radio.checked =
        selected;


    const image =
        document.createElement(
            "img"
        );


    image.src =
        getImagePath(
            item.image ||
            item.photo ||
            getPackageImage(
                selectedPackage
            )
        );


    image.alt =
        item.name ||
        "Accommodation";


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "accommodation-option-info";


    const title =
        document.createElement(
            "h4"
        );


    title.textContent =
        item.name ||
        item.type ||
        "Accommodation";


    const description =
        document.createElement(
            "p"
        );


    description.textContent =
        item.description ||
        item.capacity ||
        "Included in package";


    info.appendChild(
        title
    );


    info.appendChild(
        description
    );


    const check =
        document.createElement(
            "div"
        );


    check.className =
        "accommodation-check";


    check.textContent =
        "✓";


    option.appendChild(
        radio
    );


    option.appendChild(
        image
    );


    option.appendChild(
        info
    );


    option.appendChild(
        check
    );


    radio.addEventListener(
        "change",
        () => {

            document
                .querySelectorAll(
                    ".accommodation-option"
                )
                .forEach(
                    accommodation => {

                        accommodation.classList.remove(
                            "selected"
                        );

                    }
                );


            option.classList.add(
                "selected"
            );

        }
    );


    accommodationOptions.appendChild(
        option
    );

}


/* ==========================================================
   ERROR
========================================================== */

function showError(
    message
) {

    if (bookingError) {

        bookingError.textContent =
            message;

    }

}


/* ==========================================================
   VALIDATE BOOKING
========================================================== */

function validateBooking() {

    showError("");


    if (!selectedPackage) {

        showError(
            "Package information is not available."
        );

        return false;

    }


    if (
        !startTravelDate ||
        !startTravelDate.value
    ) {

        showError(
            "Please select your Start Travel Date."
        );


        if (startTravelDate) {

            startTravelDate.focus();

        }


        return false;

    }


    if (
        !endTravelDate ||
        !endTravelDate.value
    ) {

        showError(
            "Unable to calculate the End Travel Date."
        );


        return false;

    }


    const pax =
        document.getElementById(
            "numberOfGuests"
        );


    const pickup =
        document.getElementById(
            "pickupPoint"
        );


    const name =
        document.getElementById(
            "customerNameInput"
        );


    const contact =
        document.getElementById(
            "contactNumber"
        );


    const terms =
        document.getElementById(
            "agreeTerms"
        );


    if (
        !pax ||
        !pax.value ||
        Number(
            pax.value
        ) < 1
    ) {

        showError(
            "Please enter the number of guests."
        );


        pax?.focus();


        return false;

    }


    if (
        !pickup ||
        !pickup.value
    ) {

        showError(
            "Please select your pick-up point."
        );


        pickup?.focus();


        return false;

    }


    if (
        !name ||
        !name.value.trim()
    ) {

        showError(
            "Please enter your full name."
        );


        name?.focus();


        return false;

    }


    if (
        !contact ||
        !contact.value.trim()
    ) {

        showError(
            "Please enter your contact number."
        );


        contact?.focus();


        return false;

    }


    if (
        !terms ||
        !terms.checked
    ) {

        showError(
            "Please agree to the booking terms."
        );


        return false;

    }


    return true;

}


/* ==========================================================
   SUBMIT BOOKING
========================================================== */

if (bookingForm) {

    bookingForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                !validateBooking()
            ) {

                return;

            }


            if (continueButton) {

                continueButton.disabled =
                    true;


                continueButton.innerHTML =
                    "Saving Booking...";

            }


            try {

                const accommodation =
                    document.querySelector(
                        'input[name="accommodation"]:checked'
                    );


                const selectedPackageImage =
                    getPackageImage(
                        selectedPackage
                    );


                const packageDuration =
                    getPackageDuration(
                        selectedPackage
                    );


                /* ==================================================
                   BOOKING DATA
                ================================================== */

                const bookingData = {

                    /* PACKAGE */

                    packageId:
                        selectedPackage.id,

                    packageName:
                        selectedPackage.name ||
                        "",

                    packageCategory:
                        selectedPackage.category ||
                        "",

                    packageLocation:
                        selectedPackage.location ||
                        "",

                    packageImage:
                        selectedPackageImage ||
                        "",

                    packagePrice:
                        selectedPackage.price ||
                        "",

                    packageDuration:
                        packageDuration ||
                        "",


                    /* TRAVEL */

                    startTravelDate:
                        startTravelDate.value,

                    endTravelDate:
                        endTravelDate.value,


                    /* GUESTS */

                    numberOfGuests:
                        Number(
                            document.getElementById(
                                "numberOfGuests"
                            ).value
                        ),


                    /* PICKUP */

                    pickupPoint:
                        document.getElementById(
                            "pickupPoint"
                        ).value,


                    /* CUSTOMER */

                    customerName:
                        document.getElementById(
                            "customerNameInput"
                        ).value.trim(),

                    contactNumber:
                        document.getElementById(
                            "contactNumber"
                        ).value.trim(),

                    emailAddress:
                        document.getElementById(
                            "emailAddress"
                        ).value.trim(),

                    facebookName:
                        document.getElementById(
                            "facebookName"
                        ).value.trim(),


                    /* ACCOMMODATION */

                    accommodation:
                        accommodation
                            ? accommodation.value
                            : "Standard Accommodation",


                    /* REQUEST */

                    specialRequest:
                        document.getElementById(
                            "specialRequest"
                        ).value.trim(),


                    /* STATUS */

                    status:
                        "Pending",

                    paymentStatus:
                        "Unpaid",


                    /* TIMESTAMP */

                    createdAt:
                        serverTimestamp()

                };


                console.log(
                    "BOOKING DATA:",
                    bookingData
                );


                /* ==================================================
                   SAVE TO FIRESTORE
                ================================================== */

                const booking =
                    await addDoc(
                        collection(
                            db,
                            "bookings"
                        ),
                        bookingData
                    );


                console.log(
                    "Booking created:",
                    booking.id
                );


                /* ==================================================
                   SAVE LATEST BOOKING
                ================================================== */

                localStorage.setItem(
                    "latestBookingId",
                    booking.id
                );


                /* ==================================================
                   SUCCESS
                ================================================== */

                alert(
                    "Booking request submitted successfully!"
                );


                /*
                   Temporary behavior:
                   return to previous page.

                   Later this will become:
                   booking-summary.html?id=...
                */

                history.back();


            } catch (error) {

                console.error(
                    "BOOKING ERROR:",
                    error
                );


                showError(
                    "Unable to submit your booking. Please try again."
                );


                if (continueButton) {

                    continueButton.disabled =
                        false;


                    continueButton.innerHTML =
                        `
                        Continue to Booking Summary
                        <span>→</span>
                        `;

                }

            }

        }
    );

}


/* ==========================================================
   START
========================================================== */

loadPackage();