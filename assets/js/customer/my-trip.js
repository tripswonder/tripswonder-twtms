/* ==========================================================
   TRIPS WONDER
   CUSTOMER — MY TRIP
========================================================== */

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    db
} from "../firebase/firebase-config.js";


/* ==========================================================
   DOM
========================================================== */

const loading =
    document.getElementById("tripLoading");

const noTrip =
    document.getElementById("noTripState");

const tripContent =
    document.getElementById("tripContent");

const backBtn =
    document.getElementById("backBtn");

const exploreBtn =
    document.getElementById("exploreBtn");

const tripHeroBackground =
    document.getElementById("tripHeroBackground");

const bookingStatus =
    document.getElementById("bookingStatus");

const tripName =
    document.getElementById("tripName");

const tripDuration =
    document.getElementById("tripDuration");

const tripDate =
    document.getElementById("tripDate");

const tripLocation =
    document.getElementById("tripLocation");

const bookingId =
    document.getElementById("bookingId");

const copyBookingId =
    document.getElementById("copyBookingId");

const infoPackage =
    document.getElementById("infoPackage");

const infoTravelDate =
    document.getElementById("infoTravelDate");

const infoPax =
    document.getElementById("infoPax");

const infoGuest =
    document.getElementById("infoGuest");

const infoBookingStatus =
    document.getElementById("infoBookingStatus");

const infoPaymentStatus =
    document.getElementById("infoPaymentStatus");

const includedList =
    document.getElementById("includedList");

const qrImage =
    document.getElementById("qrImage");

const qrFullscreenBtn =
    document.getElementById("qrFullscreenBtn");

const qrModal =
    document.getElementById("qrModal");

const qrModalImage =
    document.getElementById("qrModalImage");

const qrModalClose =
    document.getElementById("qrModalClose");

const pickupPoint =
    document.getElementById("pickupPoint");

const accommodation =
    document.getElementById("accommodation");

const coordinatorName =
    document.getElementById("coordinatorName");

const coordinatorContact =
    document.getElementById("coordinatorContact");

const vanDetails =
    document.getElementById("vanDetails");

const itineraryContent =
    document.getElementById("itineraryContent");


/* ==========================================================
   UI STATE HELPERS
========================================================== */

function showLoading() {

    if (loading) {
        loading.hidden = false;
        loading.style.display = "";
    }

    if (noTrip) {
        noTrip.hidden = true;
        noTrip.style.display = "none";
    }

    if (tripContent) {
        tripContent.hidden = true;
        tripContent.style.display = "none";
    }

}


function showTripContent() {

    if (loading) {
        loading.hidden = true;
        loading.style.display = "none";
    }

    if (noTrip) {
        noTrip.hidden = true;
        noTrip.style.display = "none";
    }

    if (tripContent) {
        tripContent.hidden = false;
        tripContent.style.display = "";
    }

}


function showNoTrip() {

    if (loading) {
        loading.hidden = true;
        loading.style.display = "none";
    }

    if (tripContent) {
        tripContent.hidden = true;
        tripContent.style.display = "none";
    }

    if (noTrip) {
        noTrip.hidden = false;
        noTrip.style.display = "";
    }

}


/* ==========================================================
   HELPERS
========================================================== */

function clean(
    value,
    fallback = "—"
) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return fallback;
    }

    return String(value).trim();

}


function formatMoney(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return "—";
    }

    const number =
        Number(
            String(value)
                .replace(/[₱,\s]/g, "")
        );

    if (Number.isNaN(number)) {
        return value;
    }

    return `₱${number.toLocaleString("en-PH")}`;

}


function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    let date;

    if (
        typeof dateValue === "object" &&
        typeof dateValue.toDate === "function"
    ) {

        date =
            dateValue.toDate();

    } else {

        date =
            new Date(dateValue);

    }

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
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


function getDurationLabel(booking) {

    return clean(
        booking.packageDuration ||
        booking.duration ||
        booking.packageDays ||
        booking.days
    );

}


function getBookingStatus(booking) {

    return clean(
        booking.bookingStatus ||
        booking.status ||
        booking.booking_status,
        "Confirmed"
    );

}


function getPaymentStatus(booking) {

    return clean(
        booking.paymentStatus ||
        booking.payment_status ||
        booking.paymentStatusLabel,
        "Unpaid"
    );

}


/* ==========================================================
   DATE RANGE
========================================================== */

function getTravelDateText(booking) {

    const start =
        booking.startTravelDate ||
        booking.travelStartDate ||
        booking.startDate ||
        booking.travelDate;

    const end =
        booking.endTravelDate ||
        booking.travelEndDate ||
        booking.endDate;

    if (start && end) {

        const startText =
            formatDate(start);

        const endText =
            formatDate(end);

        if (startText === endText) {
            return startText;
        }

        return `${startText} – ${endText}`;

    }

    if (start) {
        return formatDate(start);
    }

    return "—";

}


/* ==========================================================
   PACKAGE IMAGE
========================================================== */

function getPackageImage(data) {

    return (
        data.packageImage ||
        data.image ||
        data.imageUrl ||
        data.photo ||
        data.coverImage ||
        ""
    );

}


/* ==========================================================
   INCLUSIONS
========================================================== */

function getInclusions(data) {

    const possible =
        data.inclusions ||
        data.included ||
        data.packageInclusions ||
        [];

    if (Array.isArray(possible)) {
        return possible;
    }

    if (typeof possible === "string") {

        return possible
            .split(/\n|•|,/)
            .map(item => item.trim())
            .filter(Boolean);

    }

    return [];

}


function renderInclusions(data) {

    if (!includedList) {
        return;
    }

    const inclusions =
        getInclusions(data);

    includedList.innerHTML = "";

    if (!inclusions.length) {

        const defaults = [
            "Package inclusions",
            "Tour coordination",
            "Transportation",
            "Accommodation"
        ];

        defaults.forEach(item => {

            const element =
                document.createElement("div");

            element.className =
                "included-item";

            element.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                <span>${item}</span>
            `;

            includedList.appendChild(element);

        });

        return;

    }


    inclusions.forEach(item => {

        const element =
            document.createElement("div");

        element.className =
            "included-item";

        element.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            <span>${clean(item)}</span>
        `;

        includedList.appendChild(element);

    });

}


/* ==========================================================
   STATUS
========================================================== */

function renderStatus(status) {

    if (!bookingStatus) {
        return;
    }

    const normalized =
        String(status).toLowerCase();

    const confirmed =
        normalized.includes("confirm") ||
        normalized === "approved" ||
        normalized === "paid";


    bookingStatus.innerHTML =
        confirmed
            ? `
                <i class="fa-solid fa-circle-check"></i>
                CONFIRMED
            `
            : `
                <i class="fa-solid fa-clock"></i>
                ${clean(status, "PENDING").toUpperCase()}
            `;


    bookingStatus.classList.toggle(
        "pending",
        !confirmed
    );


    if (infoBookingStatus) {

        infoBookingStatus.textContent =
            clean(
                status,
                "Confirmed"
            ).toUpperCase();

    }

}


/* ==========================================================
   RENDER BOOKING
========================================================== */

function renderBooking(booking) {

    console.log(
        "MY TRIP BOOKING:",
        booking
    );


    /* -----------------------------------------------
       BASIC DATA
    ------------------------------------------------ */

    const name =
        clean(
            booking.packageName ||
            booking.name ||
            "Your Trip"
        );


    const category =
        clean(
            booking.packageCategory ||
            booking.category ||
            "Tour"
        );


    const duration =
        getDurationLabel(
            booking
        );


    const location =
        clean(
            booking.packageLocation ||
            booking.location ||
            booking.destination
        );


    const travelDate =
        getTravelDateText(
            booking
        );


    const status =
        getBookingStatus(
            booking
        );


    const payment =
        getPaymentStatus(
            booking
        );


    const pax =
        booking.numberOfGuests ||
        booking.numberOfPax ||
        booking.pax ||
        booking.guests ||
        1;


    const guest =
        booking.customerName ||
        booking.fullName ||
        booking.guestName ||
        booking.facebookName ||
        "Guest";


    const id =
        booking.bookingId ||
        booking.id ||
        booking.documentId ||
        "—";


    /* -----------------------------------------------
       HERO
    ------------------------------------------------ */

    if (tripName) {

        tripName.textContent =
            name;

    }


    if (tripDuration) {

        tripDuration.textContent =
            duration
                ? `${duration} · ${category}`
                : category;

    }


    if (tripDate) {

        tripDate.textContent =
            travelDate;

    }


    if (tripLocation) {

        tripLocation.textContent =
            location;

    }


    if (bookingId) {

        bookingId.textContent =
            id;

    }


    renderStatus(
        status
    );


    /* -----------------------------------------------
       HERO IMAGE
    ------------------------------------------------ */

    const image =
        getPackageImage(
            booking
        );


    if (
        tripHeroBackground
    ) {

        if (image) {

            tripHeroBackground.style.backgroundImage =
                `url("${image}")`;

        } else {

            tripHeroBackground.style.backgroundImage =
                "linear-gradient(135deg, #dbeafe, #eff6ff)";

        }

    }


    /* -----------------------------------------------
       BOOKING INFORMATION
    ------------------------------------------------ */

    if (infoPackage) {

        infoPackage.textContent =
            duration
                ? `${duration} ${name} Package`
                : name;

    }


    if (infoTravelDate) {

        infoTravelDate.textContent =
            travelDate;

    }


    if (infoPax) {

        infoPax.textContent =
            `${pax} Pax`;

    }


    if (infoGuest) {

        infoGuest.textContent =
            guest;

    }


    if (infoPaymentStatus) {

        infoPaymentStatus.textContent =
            payment;

    }


    /* -----------------------------------------------
       OTHER DETAILS
    ------------------------------------------------ */

    if (pickupPoint) {

        pickupPoint.textContent =
            clean(
                booking.pickupPoint ||
                booking.pickUpPoint ||
                booking.pickupLocation ||
                booking.meetUpPoint
            );

    }


    if (accommodation) {

        accommodation.textContent =
            clean(
                booking.accommodation ||
                booking.roomType
            );

    }


    if (coordinatorName) {

        coordinatorName.textContent =
            clean(
                booking.coordinatorName ||
                booking.coordinator
            );

    }


    if (coordinatorContact) {

        coordinatorContact.textContent =
            clean(
                booking.coordinatorContact ||
                booking.coordinatorNumber ||
                booking.coordinatorPhone
            );

    }


    if (vanDetails) {

        vanDetails.textContent =
            clean(
                booking.vanDetails ||
                booking.vehicle ||
                booking.van
            );

    }


    /* -----------------------------------------------
       INCLUSIONS
    ------------------------------------------------ */

    renderInclusions(
        booking
    );


    /* -----------------------------------------------
       QR
    ------------------------------------------------ */

    const qr =
        booking.qrCode ||
        booking.qrImage ||
        booking.qrPass ||
        booking.qrUrl ||
        "";


    if (qr) {

        if (qrImage) {

            qrImage.src =
                qr;

            qrImage.style.display =
                "block";

        }


        if (qrModalImage) {

            qrModalImage.src =
                qr;

        }


        if (qrFullscreenBtn) {

            qrFullscreenBtn.style.display =
                "inline-flex";

        }

    } else {

        generateBookingQR(
            id
        );

    }


    /* -----------------------------------------------
       ITINERARY
    ------------------------------------------------ */

    renderItinerary(
        booking
    );


    console.log(
        "MY TRIP RENDER COMPLETE"
    );

}


/* ==========================================================
   QR GENERATOR
========================================================== */

function generateBookingQR(id) {

    if (
        !id ||
        id === "—"
    ) {
        return;
    }


    const encoded =
        encodeURIComponent(
            id
        );


    const qrURL =
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;


    if (qrImage) {

        qrImage.src =
            qrURL;

        qrImage.style.display =
            "block";

    }


    if (qrModalImage) {

        qrModalImage.src =
            qrURL;

    }


    if (qrFullscreenBtn) {

        qrFullscreenBtn.style.display =
            "inline-flex";

    }

}


/* ==========================================================
   ITINERARY
========================================================== */

function renderItinerary(booking) {

    if (!itineraryContent) {
        return;
    }


    const itinerary =
        booking.itinerary ||
        booking.schedule ||
        booking.tripItinerary;


    if (!itinerary) {

        itineraryContent.innerHTML = `
            <div class="empty-tab-content">
                <i class="fa-regular fa-calendar"></i>
                <br>
                Itinerary details will be available
                for your booking.
            </div>
        `;

        return;

    }


    if (Array.isArray(itinerary)) {

        itineraryContent.innerHTML =
            "";


        itinerary.forEach(
            (item, index) => {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "detail-box";


                if (
                    typeof item === "object" &&
                    item !== null
                ) {

                    row.innerHTML = `
                        <span>
                            ${clean(
                                item.time ||
                                item.day ||
                                `Schedule ${index + 1}`
                            )}
                        </span>

                        <strong>
                            ${clean(
                                item.activity ||
                                item.title ||
                                item.description
                            )}
                        </strong>
                    `;

                } else {

                    row.innerHTML = `
                        <strong>
                            ${clean(item)}
                        </strong>
                    `;

                }


                itineraryContent
                    .appendChild(row);

            }
        );


        return;

    }


    itineraryContent.innerHTML = `
        <div class="detail-box">
            <strong>
                ${clean(itinerary)}
            </strong>
        </div>
    `;

}


/* ==========================================================
   LOAD BOOKING
========================================================== */

async function loadBooking() {

    try {

        /* -----------------------------------------------
           START LOADING
        ------------------------------------------------ */

        showLoading();


        console.log(
            "Loading My Trip from Firebase..."
        );


        /* -----------------------------------------------
           BOOKINGS COLLECTION
        ------------------------------------------------ */

        const bookingsRef =
            collection(
                db,
                "bookings"
            );


        const bookingQuery =
            query(
                bookingsRef,

                orderBy(
                    "createdAt",
                    "desc"
                ),

                limit(20)
            );


        const snapshot =
            await getDocs(
                bookingQuery
            );


        console.log(
            "Bookings found:",
            snapshot.size
        );


        /* -----------------------------------------------
           NO BOOKINGS
        ------------------------------------------------ */

        if (
            snapshot.empty
        ) {

            showNoTrip();

            return;

        }


        /* -----------------------------------------------
           CONVERT FIRESTORE DATA
        ------------------------------------------------ */

        const bookings =
            snapshot.docs.map(
                doc => {

                    return {
                        id: doc.id,
                        ...doc.data()
                    };

                }
            );


        console.log(
            "BOOKINGS:",
            bookings
        );


        /* -----------------------------------------------
           CURRENTLY USE NEWEST BOOKING
        ------------------------------------------------ */

        const booking =
            bookings[0];


        if (!booking) {

            showNoTrip();

            return;

        }


        console.log(
            "SELECTED MY TRIP:",
            booking
        );


        /* -----------------------------------------------
           RENDER
        ------------------------------------------------ */

        renderBooking(
            booking
        );


        /* -----------------------------------------------
           IMPORTANT:
           FORCE LOADING OFF
        ------------------------------------------------ */

        showTripContent();


        console.log(
            "MY TRIP DISPLAYED SUCCESSFULLY"
        );


    } catch (error) {

        console.error(
            "MY TRIP ERROR:",
            error
        );


        /* -----------------------------------------------
           ALWAYS REMOVE LOADING ON ERROR
        ------------------------------------------------ */

        if (loading) {

            loading.hidden =
                true;

            loading.style.display =
                "none";

        }


        /*
         * If Firestore does not allow
         * reading bookings,
         * show no-trip state instead
         */

        showNoTrip();

    }

}


/* ==========================================================
   BACK BUTTON
========================================================== */

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {

            if (
                window.history.length > 1
            ) {

                window.history.back();

            } else {

                window.location.href =
                    "home.html";

            }

        }
    );

}


/* ==========================================================
   EXPLORE
========================================================== */

if (exploreBtn) {

    exploreBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "home.html";

        }
    );

}


/* ==========================================================
   COPY BOOKING ID
========================================================== */

if (copyBookingId) {

    copyBookingId.addEventListener(
        "click",
        async () => {

            const value =
                bookingId
                    ? bookingId.textContent.trim()
                    : "";


            if (
                !value ||
                value === "—"
            ) {

                return;

            }


            try {

                await navigator.clipboard
                    .writeText(
                        value
                    );


                copyBookingId.innerHTML =
                    `<i class="fa-solid fa-check"></i>`;


                setTimeout(
                    () => {

                        copyBookingId.innerHTML =
                            `<i class="fa-regular fa-copy"></i>`;

                    },
                    1200
                );


            } catch (error) {

                console.warn(
                    "Unable to copy Booking ID",
                    error
                );

            }

        }
    );

}


/* ==========================================================
   TABS
========================================================== */

const tabs =
    document.querySelectorAll(
        ".trip-tab"
    );

const panels =
    document.querySelectorAll(
        ".tab-panel"
    );


tabs.forEach(
    tab => {

        tab.addEventListener(
            "click",
            () => {

                const target =
                    tab.dataset.tab;


                tabs.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                panels.forEach(
                    panel => {

                        panel.classList.remove(
                            "active"
                        );

                    }
                );


                tab.classList.add(
                    "active"
                );


                const panel =
                    document.getElementById(
                        `tab-${target}`
                    );


                if (panel) {

                    panel.classList.add(
                        "active"
                    );

                }

            }
        );

    }
);


/* ==========================================================
   QR FULLSCREEN
========================================================== */

if (qrFullscreenBtn) {

    qrFullscreenBtn.addEventListener(
        "click",
        () => {

            if (
                !qrImage ||
                !qrImage.src
            ) {

                return;

            }


            if (qrModalImage) {

                qrModalImage.src =
                    qrImage.src;

            }


            if (qrModal) {

                qrModal.hidden =
                    false;

            }

        }
    );

}


/* ==========================================================
   QR MODAL CLOSE
========================================================== */

if (qrModalClose) {

    qrModalClose.addEventListener(
        "click",
        () => {

            if (qrModal) {

                qrModal.hidden =
                    true;

            }

        }
    );

}


/* ==========================================================
   QR MODAL BACKDROP
========================================================== */

if (qrModal) {

    qrModal.addEventListener(
        "click",
        event => {

            if (
                event.target === qrModal
            ) {

                qrModal.hidden =
                    true;

            }

        }
    );

}


/* ==========================================================
   ESCAPE QR MODAL
========================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            qrModal &&
            !qrModal.hidden
        ) {

            qrModal.hidden =
                true;

        }

    }
);


/* ==========================================================
   START
========================================================== */

loadBooking();