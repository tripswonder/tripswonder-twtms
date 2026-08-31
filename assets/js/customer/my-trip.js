/* ==========================================================
   TRIPS WONDER
   CUSTOMER — MY TRIP
========================================================== */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    auth,
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

const pickupLocation =
    document.getElementById("pickupLocation");

const pickupTime =
    document.getElementById("pickupTime");

const pickupInstructions =
    document.getElementById("pickupInstructions");

const accommodation =
    document.getElementById("accommodation");

const coordinatorName =
    document.getElementById("coordinatorName");

const coordinatorContact =
    document.getElementById("coordinatorContact");

const vehicleName =
    document.getElementById("vehicleName");

const vehiclePlate =
    document.getElementById("vehiclePlate");

const driverName =
    document.getElementById("driverName");

const driverContact =
    document.getElementById("driverContact");

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
        getBookingReferenceValue(
            booking
        );


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




    /* -----------------------------------------------
       INCLUSIONS
    ------------------------------------------------ */

    renderInclusions(
        booking
    );


    /* -----------------------------------------------
       QR
    ------------------------------------------------ */

    /*
     * PERMANENT CUSTOMER QR
     *
     * One QR belongs to one authenticated customer account.
     * The same QR can later be used by:
     * - Admin Customers → open customer account
     * - Coordinator Module → locate active booking and check in/pick up
     *
     * Firebase UID is an identifier, not a password/credential.
     * It lets admin/coordinator resolve the customer's active bookings
     * through booking.customerUid without creating a new QR per trip.
     */

    const customerUid =
        auth.currentUser?.uid ||
        booking.customerUid ||
        booking.authUid ||
        booking.userUid ||
        "";


    generateCustomerQR(
        customerUid
    );


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
   PERMANENT CUSTOMER QR GENERATOR
========================================================== */

function generateCustomerQR(customerUid) {

    if (!customerUid) {

        console.warn(
            "MY TRIP QR: Customer UID not available."
        );

        if (qrImage) {
            qrImage.style.display =
                "none";
        }

        if (qrFullscreenBtn) {
            qrFullscreenBtn.style.display =
                "none";
        }

        return;

    }


    /*
     * Versioned payload.
     *
     * Future scanners should accept:
     *
     * TWTMS:CUSTOMER:<firebase-uid>
     *
     * IMPORTANT:
     * The QR proves which account the customer is presenting,
     * but the scanner must still verify booking/trip status
     * from Firestore before allowing check-in.
     */

    const qrPayload =
        `TWTMS:CUSTOMER:${customerUid}`;


    const encoded =
        encodeURIComponent(
            qrPayload
        );


    const qrURL =
        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;


    if (qrImage) {

        qrImage.src =
            qrURL;

        qrImage.alt =
            "Trips Wonder Customer QR";

        qrImage.style.display =
            "block";

    }


    if (qrModalImage) {

        qrModalImage.src =
            qrURL;

        qrModalImage.alt =
            "Trips Wonder Customer QR";

    }


    if (qrFullscreenBtn) {

        qrFullscreenBtn.style.display =
            "inline-flex";

    }


    console.log(
        "MY TRIP CUSTOMER QR READY:",
        {
            customerUid,
            format:
                "TWTMS:CUSTOMER:<uid>"
        }
    );

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


    itineraryContent.innerHTML = "";


    if (
        !itinerary ||
        typeof itinerary !== "object" ||
        Array.isArray(itinerary)
    ) {

        itineraryContent.innerHTML = `
            <div class="empty-tab-content">
                <i class="fa-regular fa-calendar"></i>
                <br>
                Itinerary details will be available for your booking.
            </div>
        `;

        return;

    }


    const dayDefinitions = [
        { key: "day0", label: "Day 0" },
        { key: "day1", label: "Day 1" },
        { key: "day2", label: "Day 2" },
        { key: "day3", label: "Day 3" }
    ];


    function normalizeEntry(item) {

        if (!item) {
            return null;
        }


        if (
            item.type === "section" ||
            (
                Array.isArray(item.items) &&
                (
                    item.title ||
                    item.items.length
                )
            )
        ) {

            return {
                type: "section",
                title: clean(
                    item.title,
                    ""
                ),
                items:
                    Array.isArray(item.items)
                        ? item.items
                            .map(
                                value =>
                                    clean(
                                        value,
                                        ""
                                    )
                            )
                            .filter(Boolean)
                        : []
            };

        }


        if (
            typeof item === "object" &&
            !Array.isArray(item)
        ) {

            const time =
                clean(
                    item.time,
                    ""
                );


            const activity =
                clean(
                    item.activity,
                    ""
                );


            if (
                !time &&
                !activity
            ) {
                return null;
            }


            return {
                type: "schedule",
                time,
                activity
            };

        }


        return null;

    }


    const availableDays =
        dayDefinitions
            .map(
                day => ({
                    ...day,
                    entries:
                        Array.isArray(
                            itinerary[day.key]
                        )
                            ? itinerary[day.key]
                                .map(
                                    normalizeEntry
                                )
                                .filter(Boolean)
                            : []
                })
            )
            .filter(
                day =>
                    day.entries.length
            );


    const notes =
        clean(
            itinerary.notes,
            ""
        );


    if (
        !availableDays.length &&
        !notes
    ) {

        itineraryContent.innerHTML = `
            <div class="empty-tab-content">
                <i class="fa-regular fa-calendar"></i>
                <br>
                Itinerary details will be available for your booking.
            </div>
        `;

        return;

    }


    const shell =
        document.createElement(
            "div"
        );


    shell.className =
        "customer-itinerary-builder";


    const tabBar =
        document.createElement(
            "div"
        );


    tabBar.className =
        "customer-itinerary-tabs";


    const panels =
        document.createElement(
            "div"
        );


    panels.className =
        "customer-itinerary-panels";


    const sections = [];


    availableDays.forEach(
        (
            day,
            index
        ) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "customer-itinerary-tab";


            button.textContent =
                day.label;


            const panel =
                document.createElement(
                    "section"
                );


            panel.className =
                "customer-itinerary-panel";


            const body =
                document.createElement(
                    "div"
                );


            body.className =
                "customer-itinerary-compact";


            /* ---------------------------------------------
               DAY HEADER
            --------------------------------------------- */

            const dayHeader =
                document.createElement(
                    "div"
                );


            dayHeader.className =
                "customer-itinerary-day-header";


            const firstSection =
                day.entries.find(
                    entry =>
                        entry.type === "section"
                );


            dayHeader.innerHTML = `

                <span class="customer-itinerary-day-dot"></span>

                <strong>
                    ${day.label}
                </strong>

                ${
                    firstSection?.title
                        ? `
                            <span class="customer-itinerary-day-divider"></span>

                            <span class="customer-itinerary-day-caption">
                                ${
                                    clean(
                                        firstSection.title
                                            .replace(
                                                /PLACES TO VISIT:?/i,
                                                "Whole-Day Island Tour"
                                            ),
                                        ""
                                    )
                                }
                            </span>
                        `
                        : ""
                }

            `;


            body.appendChild(
                dayHeader
            );


            day.entries.forEach(
                entry => {

                    /* -------------------------------------
                       SECTION / ACTIVITIES
                    ------------------------------------- */

                    if (
                        entry.type === "section"
                    ) {

                        if (
                            !entry.title &&
                            !entry.items.length
                        ) {
                            return;
                        }


                        const section =
                            document.createElement(
                                "div"
                            );


                        section.className =
                            "customer-itinerary-activity-block";


                        const sectionHeader =
                            document.createElement(
                                "button"
                            );


                        sectionHeader.type =
                            "button";


                        sectionHeader.className =
                            "customer-itinerary-activity-head";


                        const count =
                            entry.items.length;


                        sectionHeader.innerHTML = `

                            <span class="customer-itinerary-pin">
                                <i class="fa-solid fa-location-dot"></i>
                            </span>

                            <strong>
                                ${clean(entry.title)}
                            </strong>

                            ${
                                count
                                    ? `
                                        <span class="customer-itinerary-count">
                                            · ${count} ${
                                                count === 1
                                                    ? "place"
                                                    : "places"
                                            }
                                        </span>
                                    `
                                    : ""
                            }

                            <i class="fa-solid fa-chevron-up customer-itinerary-chevron"></i>

                        `;


                        const sectionBody =
                            document.createElement(
                                "div"
                            );


                        sectionBody.className =
                            "customer-itinerary-activity-body";


                        if (
                            entry.items.length
                        ) {

                            const list =
                                document.createElement(
                                    "ul"
                                );


                            entry.items.forEach(
                                value => {

                                    const li =
                                        document.createElement(
                                            "li"
                                        );


                                    li.textContent =
                                        value;


                                    list.appendChild(
                                        li
                                    );

                                }
                            );


                            sectionBody.appendChild(
                                list
                            );

                        }


                        sectionHeader.addEventListener(
                            "click",
                            () => {

                                const collapsed =
                                    section.classList.toggle(
                                        "collapsed"
                                    );


                                const chevron =
                                    sectionHeader
                                        .querySelector(
                                            ".customer-itinerary-chevron"
                                        );


                                if (chevron) {

                                    chevron.className =
                                        collapsed
                                            ? "fa-solid fa-chevron-down customer-itinerary-chevron"
                                            : "fa-solid fa-chevron-up customer-itinerary-chevron";

                                }

                            }
                        );


                        section.appendChild(
                            sectionHeader
                        );


                        section.appendChild(
                            sectionBody
                        );


                        body.appendChild(
                            section
                        );


                        return;

                    }


                    /* -------------------------------------
                       SCHEDULE
                    ------------------------------------- */

                    const row =
                        document.createElement(
                            "div"
                        );


                    row.className =
                        "customer-itinerary-schedule-row";


                    row.innerHTML = `

                        <div class="customer-itinerary-schedule-time">
                            ${clean(entry.time, "")}
                        </div>

                        <div class="customer-itinerary-schedule-separator">
                            —
                        </div>

                        <div class="customer-itinerary-schedule-activity">
                            ${clean(entry.activity, "")}
                        </div>

                    `;


                    body.appendChild(
                        row
                    );

                }
            );


            panel.appendChild(
                body
            );


            if (
                index === 0
            ) {

                button.classList.add(
                    "active"
                );


                panel.classList.add(
                    "active"
                );

            }


            tabBar.appendChild(
                button
            );


            panels.appendChild(
                panel
            );


            sections.push({
                button,
                panel
            });

        }
    );


    if (notes) {

        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "customer-itinerary-tab";


        button.innerHTML =
            `<i class="fa-regular fa-note-sticky"></i> Notes`;


        const panel =
            document.createElement(
                "section"
            );


        panel.className =
            "customer-itinerary-panel";


        panel.innerHTML = `

            <div class="customer-itinerary-notes-v4">

                <div class="customer-itinerary-notes-title-v4">
                    <i class="fa-solid fa-circle-info"></i>
                    Important Notes & Reminders
                </div>

                <div class="customer-itinerary-notes-text-v4">
                    ${notes}
                </div>

            </div>

        `;


        if (
            !availableDays.length
        ) {

            button.classList.add(
                "active"
            );


            panel.classList.add(
                "active"
            );

        }


        tabBar.appendChild(
            button
        );


        panels.appendChild(
            panel
        );


        sections.push({
            button,
            panel
        });

    }


    sections.forEach(
        section => {

            section.button
                .addEventListener(
                    "click",
                    () => {

                        sections.forEach(
                            item => {

                                item.button
                                    .classList
                                    .remove(
                                        "active"
                                    );


                                item.panel
                                    .classList
                                    .remove(
                                        "active"
                                    );

                            }
                        );


                        section.button
                            .classList
                            .add(
                                "active"
                            );


                        section.panel
                            .classList
                            .add(
                                "active"
                            );

                    }
                );

        }
    );


    shell.appendChild(
        tabBar
    );


    shell.appendChild(
        panels
    );


    itineraryContent.appendChild(
        shell
    );

}


/* ==========================================================
   CUSTOMER BOOKING HELPERS
========================================================== */

function normalizeLower(value) {

    return String(value ?? "")
        .trim()
        .toLowerCase();

}


function toDateValue(value) {

    if (!value) {
        return null;
    }

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }

    if (value instanceof Date) {
        return value;
    }

    const text = String(value).trim();

    const date =
        /^\\d{4}-\\d{2}-\\d{2}$/.test(text)
            ? new Date(`${text}T00:00:00`)
            : new Date(text);

    return Number.isNaN(date.getTime())
        ? null
        : date;

}


function getBookingReferenceValue(booking) {

    return clean(
        booking.bookingNumber ||
        booking.bookingReference ||
        booking.bookingId ||
        booking.id ||
        booking.documentId
    );

}


async function loadPackageSnapshot(packageId) {

    if (!packageId) {
        return null;
    }

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "packages",
                    packageId
                )
            );

        if (!snapshot.exists()) {
            return null;
        }

        return {
            id: snapshot.id,
            ...snapshot.data()
        };

    } catch (error) {

        console.warn(
            "MY TRIP PACKAGE LOAD ERROR:",
            error
        );

        return null;
    }

}


async function getBookingsForCustomer(user) {

    if (!user?.uid) {
        return [];
    }

    const bookingsRef =
        collection(
            db,
            "bookings"
        );

    const uidQuery =
        query(
            bookingsRef,
            where(
                "customerUid",
                "==",
                user.uid
            )
        );

    const uidSnapshot =
        await getDocs(
            uidQuery
        );

    let bookings =
        uidSnapshot.docs.map(
            documentSnapshot => ({
                id: documentSnapshot.id,
                ...documentSnapshot.data()
            })
        );

    /*
     * Compatibility fallback for old bookings created
     * before customerUid was added.
     */
    if (
        bookings.length === 0 &&
        user.email
    ) {

        const emailQuery =
            query(
                bookingsRef,
                where(
                    "customerEmail",
                    "==",
                    normalizeLower(
                        user.email
                    )
                )
            );

        const emailSnapshot =
            await getDocs(
                emailQuery
            );

        bookings =
            emailSnapshot.docs.map(
                documentSnapshot => ({
                    id: documentSnapshot.id,
                    ...documentSnapshot.data()
                })
            );
    }

    return bookings;

}


function chooseCustomerTrip(bookings) {

    if (!bookings.length) {
        return null;
    }

    const requestedBooking =
        new URLSearchParams(
            window.location.search
        ).get("booking");

    if (requestedBooking) {

        const requested =
            bookings.find(booking =>
                booking.id === requestedBooking ||
                getBookingReferenceValue(booking) === requestedBooking
            );

        if (requested) {
            return requested;
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active =
        bookings.filter(booking => {

            const status =
                String(
                    getBookingStatus(booking)
                ).toLowerCase();

            return !(
                status === "cancelled" ||
                status === "canceled"
            );
        });

    const upcoming =
        active
            .filter(booking => {

                const endDate =
                    toDateValue(
                        booking.travelEndDate ||
                        booking.endTravelDate ||
                        booking.travelStartDate ||
                        booking.startTravelDate ||
                        booking.travelDate
                    );

                return !endDate || endDate >= today;
            })
            .sort((a, b) => {

                const aDate =
                    toDateValue(
                        a.travelStartDate ||
                        a.startTravelDate ||
                        a.travelDate
                    );

                const bDate =
                    toDateValue(
                        b.travelStartDate ||
                        b.startTravelDate ||
                        b.travelDate
                    );

                return (
                    aDate?.getTime() ||
                    Number.MAX_SAFE_INTEGER
                ) - (
                    bDate?.getTime() ||
                    Number.MAX_SAFE_INTEGER
                );
            });

    if (upcoming.length) {
        return upcoming[0];
    }

    return active[0] || null;
}


/* ==========================================================
   TRIP OPERATIONS
========================================================== */

function normalizeDateKey(value) {

    const date = toDateValue(value);

    if (!date) {
        return "";
    }

    const year = date.getFullYear();

    const month =
        String(date.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(date.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;

}


function getBookingPickupLocation(booking) {

    return clean(
        booking.pickup ||
        booking.pickupPoint ||
        booking.pickUpPoint ||
        booking.pickupLocation ||
        booking.meetUpPoint,
        ""
    );

}


function findCustomerPickup(operation, booking) {

    const selectedPickup =
        normalizeLower(
            getBookingPickupLocation(booking)
        );

    const schedule =
        Array.isArray(operation?.pickupSchedule)
            ? operation.pickupSchedule
            : [];

    if (!selectedPickup) {
        return null;
    }

    return (
        schedule.find(item =>
            normalizeLower(item?.location) ===
            selectedPickup
        ) ||
        schedule.find(item => {

            const location =
                normalizeLower(
                    item?.location
                );

            return (
                location &&
                (
                    location.includes(selectedPickup) ||
                    selectedPickup.includes(location)
                )
            );

        }) ||
        null
    );

}


async function loadTripOperation(booking) {

    const packageId =
        clean(
            booking.packageId,
            ""
        );

    const bookingStartDate =
        normalizeDateKey(
            booking.startTravelDate ||
            booking.travelStartDate ||
            booking.startDate ||
            booking.travelDate
        );

    if (!packageId || !bookingStartDate) {

        console.warn(
            "MY TRIP: Missing packageId or travel start date for Trip Operations.",
            {
                packageId,
                bookingStartDate
            }
        );

        return null;
    }


    try {

        const operationsRef =
            collection(
                db,
                "tripOperations"
            );


        /*
         * Query by packageId first, then match the exact departure
         * date in JavaScript. This avoids requiring a composite
         * Firestore index for packageId + startDate.
         */

        const operationQuery =
            query(
                operationsRef,
                where(
                    "packageId",
                    "==",
                    packageId
                )
            );


        const snapshot =
            await getDocs(
                operationQuery
            );


        const operations =
            snapshot.docs.map(
                documentSnapshot => ({
                    id:
                        documentSnapshot.id,
                    ...documentSnapshot.data()
                })
            );


        const operation =
            operations.find(item =>
                normalizeDateKey(
                    item.startDate ||
                    item.travelStartDate
                ) === bookingStartDate
            ) || null;


        console.log(
            "MY TRIP OPERATION MATCH:",
            {
                packageId,
                bookingStartDate,
                operation
            }
        );


        return operation;

    } catch (error) {

        console.error(
            "MY TRIP TRIP OPERATION LOAD ERROR:",
            error
        );

        return null;
    }

}


function applyTripOperationToBooking(
    booking,
    operation
) {

    if (!operation) {
        return booking;
    }


    const customerPickup =
        findCustomerPickup(
            operation,
            booking
        );


    const pickupLocation =
        clean(
            customerPickup?.location ||
            getBookingPickupLocation(booking),
            ""
        );


    const pickupTime =
        clean(
            customerPickup?.time ||
            customerPickup?.meetupTime ||
            customerPickup?.meetUpTime,
            ""
        );


    const pickupInstructions =
        clean(
            customerPickup?.instructions ||
            customerPickup?.meetingInstructions ||
            customerPickup?.notes,
            ""
        );


    /*
     * Keep booking/package snapshot values, then overlay only
     * operational fields that Admin controls in Trip Operations.
     */

    return {
        ...booking,

        tripOperationId:
            operation.id,

        tripOperationStatus:
            operation.status || "",

        pickup:
            pickupLocation ||
            booking.pickup,

        pickupPoint:
            pickupLocation ||
            booking.pickupPoint,

        pickupTime,

        pickupInstructions,

        vehicle:
            operation.vehicleName ||
            operation.vehicle ||
            booking.vehicle ||
            booking.vanDetails ||
            "",

        vanDetails:
            operation.vehicleName ||
            operation.vehicle ||
            booking.vanDetails ||
            booking.vehicle ||
            "",

        vehiclePlate:
            operation.plateNumber ||
            operation.vehiclePlate ||
            "",

        driverName:
            operation.driverName ||
            operation.driver ||
            "",

        driverContact:
            operation.driverContact ||
            operation.driverPhone ||
            "",

        coordinatorName:
            operation.coordinatorName ||
            operation.coordinator ||
            booking.coordinatorName ||
            booking.coordinator ||
            "",

        coordinatorContact:
            operation.coordinatorContact ||
            operation.coordinatorNumber ||
            operation.coordinatorPhone ||
            booking.coordinatorContact ||
            booking.coordinatorNumber ||
            booking.coordinatorPhone ||
            "",

        tripAnnouncement:
            operation.announcement ||
            operation.tripAnnouncement ||
            operation.notes ||
            ""
    };

}


function formatPickupTime(value) {

    const time =
        clean(
            value,
            ""
        );

    if (!time) {
        return "";
    }

    const match =
        time.match(
            /^(\d{1,2}):(\d{2})$/
        );

    if (!match) {
        return time;
    }

    let hour =
        Number(match[1]);

    const minute =
        match[2];

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    hour =
        hour % 12 || 12;

    return `${hour}:${minute} ${period}`;

}


function renderOperationalPickupDetails(booking) {

    if (pickupLocation) {

        pickupLocation.textContent =
            getBookingPickupLocation(
                booking
            ) || "—";

    }


    if (pickupTime) {

        pickupTime.textContent =
            formatPickupTime(
                booking.pickupTime
            ) || "—";

    }


    if (pickupInstructions) {

        pickupInstructions.textContent =
            clean(
                booking.pickupInstructions
            );

    }


    if (vehicleName) {

        vehicleName.textContent =
            clean(
                booking.vehicle ||
                booking.vanDetails
            );

    }


    if (vehiclePlate) {

        vehiclePlate.textContent =
            clean(
                booking.vehiclePlate
            );

    }


    if (driverName) {

        driverName.textContent =
            clean(
                booking.driverName
            );

    }


    if (driverContact) {

        driverContact.textContent =
            clean(
                booking.driverContact
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

}


/* ==========================================================
   LOAD BOOKING
========================================================== */

async function loadBooking(user) {

    try {

        showLoading();

        console.log(
            "Loading My Trip for customer:",
            {
                uid: user.uid,
                email: user.email
            }
        );

        const bookings =
            await getBookingsForCustomer(
                user
            );

        console.log(
            "MY TRIP CUSTOMER BOOKINGS:",
            bookings.length
        );

        const booking =
            chooseCustomerTrip(
                bookings
            );

        if (!booking) {

            showNoTrip();
            return;
        }

        const packageData =
            await loadPackageSnapshot(
                booking.packageId
            );

        /*
         * Package data supplies gallery, inclusions, itinerary,
         * etc. Booking snapshot remains the source of customer
         * and reservation-specific values.
         */
        const bookingWithPackage = {
            ...(packageData || {}),
            ...booking,
            id: booking.id
        };


        const tripOperation =
            await loadTripOperation(
                bookingWithPackage
            );


        const completeBooking =
            applyTripOperationToBooking(
                bookingWithPackage,
                tripOperation
            );


        console.log(
            "SELECTED MY TRIP:",
            completeBooking
        );


        renderBooking(
            completeBooking
        );


        /*
         * Override the basic booking pickup / vehicle fields with
         * the exact Admin Trip Operations details for this departure.
         */

        renderOperationalPickupDetails(
            completeBooking
        );


        showTripContent();

        console.log(
            "MY TRIP DISPLAYED SUCCESSFULLY"
        );

    } catch (error) {

        console.error(
            "MY TRIP ERROR:",
            error
        );

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

showLoading();


onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            console.warn(
                "MY TRIP: NO LOGGED-IN CUSTOMER"
            );

            window.location.href =
                "../../index.html";

            return;
        }

        await loadBooking(
            user
        );
    }
);
