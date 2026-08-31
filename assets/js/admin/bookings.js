// ======================================================
// TRIPS WONDER - ADMIN BOOKINGS
// FULL BOOKING MANAGEMENT MODULE
// UPDATED VERSION
// ======================================================

import {
    db,
    collection,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    runTransaction
} from "../firebase/firebase-db.js";


import {
    requireAuth
} from "../auth/auth-guard.js";


import {
    showLoading,
    hideLoading,
    showLoadingError
} from "../shared/loading-screen.js";


// ======================================================
// PAGE ACCESS
// ======================================================

requireAuth({

    allowedRoles: [
        "owner",
        "admin"
    ],

    requiredPermission:
        "bookings",

    onAuthorized: (
        user,
        profile
    ) => {

        console.log(
            "BOOKINGS ACCESS GRANTED:",
            {
                uid: user.uid,
                role: profile.role,
                bookings:
                    profile.permissions?.bookings
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


        // ==================================================
        // STATE
        // ==================================================

        let bookings = [];

        let packages = [];

        let editingBookingId = null;


        // ==================================================
        // TABLE
        // ==================================================

        const bookingTableBody =
            document.getElementById(
                "bookingTableBody"
            );

        const bookingEmptyState =
            document.getElementById(
                "bookingEmptyState"
            );


        // ==================================================
        // SEARCH / FILTER
        // ==================================================

        const bookingSearch =
            document.getElementById(
                "bookingSearch"
            );

        const bookingPackageFilter =
            document.getElementById(
                "bookingPackageFilter"
            );

        const bookingStatusFilter =
            document.getElementById(
                "bookingStatusFilter"
            );

        const paymentStatusFilter =
            document.getElementById(
                "paymentStatusFilter"
            );

        const bookingSort =
            document.getElementById(
                "bookingSort"
            );

        const refreshBookingsBtn =
            document.getElementById(
                "refreshBookingsBtn"
            );


        // ==================================================
        // SUMMARY
        // ==================================================

        const totalBookingsElement =
            document.getElementById(
                "totalBookings"
            );

        const confirmedBookingsElement =
            document.getElementById(
                "confirmedBookings"
            );

        const pendingBookingsElement =
            document.getElementById(
                "pendingBookings"
            );

        const totalGuestsElement =
            document.getElementById(
                "totalGuests"
            );

        const bookingResultText =
            document.getElementById(
                "bookingResultText"
            );


        // ==================================================
        // MODAL
        // ==================================================

        const bookingModal =
            document.getElementById(
                "bookingModal"
            );

        const bookingModalBackdrop =
            document.getElementById(
                "bookingModalBackdrop"
            );

        const bookingModalTitle =
            document.getElementById(
                "bookingModalTitle"
            );

        const bookingModalDescription =
            document.getElementById(
                "bookingModalDescription"
            );

        const newBookingBtn =
            document.getElementById(
                "newBookingBtn"
            );

        const closeBookingModal =
            document.getElementById(
                "closeBookingModal"
            );

        const cancelBookingBtn =
            document.getElementById(
                "cancelBookingBtn"
            );

        const bookingForm =
            document.getElementById(
                "bookingForm"
            );

        const saveBookingBtn =
            document.getElementById(
                "saveBookingBtn"
            );


        // ==================================================
        // CUSTOMER
        // ==================================================

        const customerName =
            document.getElementById(
                "customerName"
            );

        const customerContact =
            document.getElementById(
                "customerContact"
            );

        const customerEmail =
            document.getElementById(
                "customerEmail"
            );

        const customerFb =
            document.getElementById(
                "customerFb"
            );


        // ==================================================
        // TOUR
        // ==================================================

        const bookingPackage =
            document.getElementById(
                "bookingPackage"
            );

        const travelDate =
            document.getElementById(
                "travelDate"
            );

        const numberOfGuests =
            document.getElementById(
                "numberOfGuests"
            );

        const pickupPoint =
            document.getElementById(
                "pickupPoint"
            );

        const accommodation =
            document.getElementById(
                "accommodation"
            );

        const specialRequest =
            document.getElementById(
                "specialRequest"
            );


        // ==================================================
        // PAYMENT
        // ==================================================

        const totalAmount =
            document.getElementById(
                "totalAmount"
            );

        const amountPaid =
            document.getElementById(
                "amountPaid"
            );

        const remainingBalance =
            document.getElementById(
                "remainingBalance"
            );

        const paymentStatus =
            document.getElementById(
                "paymentStatus"
            );

        const paymentMethod =
            document.getElementById(
                "paymentMethod"
            );

        const paymentReference =
            document.getElementById(
                "paymentReference"
            );


        // ==================================================
        // BOOKING MANAGEMENT
        // ==================================================

        const bookingStatus =
            document.getElementById(
                "bookingStatus"
            );

        const bookingSource =
            document.getElementById(
                "bookingSource"
            );

        const internalNotes =
            document.getElementById(
                "internalNotes"
            );


        // ==================================================
        // BASIC HELPERS
        // ==================================================

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


            return Number.isFinite(number)
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


        function getTimestamp(value) {

            if (!value) {
                return 0;
            }


            const timestamp =
                Date.parse(value);


            return Number.isNaN(
                timestamp
            )
                ? 0
                : timestamp;

        }


        function getInitials(name) {

            const words =
                String(
                    name || ""
                )
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean);


            if (
                words.length === 0
            ) {
                return "TW";
            }


            if (
                words.length === 1
            ) {

                return words[0]
                    .slice(0, 2)
                    .toUpperCase();

            }


            return (
                words[0][0] +
                words[
                    words.length - 1
                ][0]
            ).toUpperCase();

        }


        function capitalize(value) {

            const text =
                String(
                    value || ""
                );


            if (!text) {
                return "";
            }


            return (
                text.charAt(0)
                    .toUpperCase() +
                text.slice(1)
            );

        }


        // ==================================================
        // DATE HELPERS
        // ==================================================

        function parseLocalDate(
            dateString
        ) {

            if (!dateString) {
                return null;
            }


            const parts =
                String(
                    dateString
                )
                    .split("-")
                    .map(Number);


            if (
                parts.length !== 3
            ) {
                return null;
            }


            const [
                year,
                month,
                day
            ] = parts;


            const date =
                new Date(
                    year,
                    month - 1,
                    day
                );


            return Number.isNaN(
                date.getTime()
            )
                ? null
                : date;

        }


        function formatDateInput(
            date
        ) {

            if (
                !(date instanceof Date) ||
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return "";
            }


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


        function addDays(
            dateString,
            days
        ) {

            const date =
                parseLocalDate(
                    dateString
                );


            if (!date) {
                return "";
            }


            date.setDate(
                date.getDate() +
                days
            );


            return formatDateInput(
                date
            );

        }


        // ==================================================
        // DURATION PARSER
        // ==================================================

        function getDurationDays(
            durationValue
        ) {

            const raw =
                String(
                    durationValue || ""
                )
                    .trim()
                    .toLowerCase();


            if (!raw) {
                return 1;
            }


            // ----------------------------------------------
            // DAY TOUR
            // ----------------------------------------------

            if (
                raw.includes(
                    "day tour"
                ) ||
                raw.includes(
                    "daytour"
                ) ||
                raw.includes(
                    "whole day"
                ) ||
                raw.includes(
                    "1d"
                )
            ) {

                return 1;

            }


            // ----------------------------------------------
            // 2D1N / 2 DAYS 1 NIGHT
            // ----------------------------------------------

            if (
                /2\s*d\s*1\s*n/.test(
                    raw
                ) ||
                /2\s*days?\s*1\s*nights?/.test(
                    raw
                ) ||
                /2days?\s*1night/.test(
                    raw
                )
            ) {

                return 2;

            }


            // ----------------------------------------------
            // 3D2N / 3 DAYS 2 NIGHTS
            // ----------------------------------------------

            if (
                /3\s*d\s*2\s*n/.test(
                    raw
                ) ||
                /3\s*days?\s*2\s*nights?/.test(
                    raw
                ) ||
                /3days?\s*2nights?/.test(
                    raw
                )
            ) {

                return 3;

            }


            // ----------------------------------------------
            // GENERIC "4D3N", "5D4N", etc.
            // ----------------------------------------------

            const compactMatch =
                raw.match(
                    /(\d+)\s*d\s*(\d+)\s*n/
                );


            if (
                compactMatch
            ) {

                const days =
                    Number(
                        compactMatch[1]
                    );


                return days > 0
                    ? days
                    : 1;

            }


            // ----------------------------------------------
            // GENERIC "4 DAYS 3 NIGHTS"
            // ----------------------------------------------

            const wordsMatch =
                raw.match(
                    /(\d+)\s*days?/
                );


            if (
                wordsMatch
            ) {

                const days =
                    Number(
                        wordsMatch[1]
                    );


                return days > 0
                    ? days
                    : 1;

            }


            return 1;

        }


        // ==================================================
        // CALCULATE END DATE
        // ==================================================

        function calculateTravelEndDate(
            startDate,
            durationValue
        ) {

            if (!startDate) {
                return "";
            }


            const days =
                getDurationDays(
                    durationValue
                );


            return addDays(
                startDate,
                Math.max(
                    0,
                    days - 1
                )
            );

        }


        // ==================================================
        // FORMAT TRAVEL DATE RANGE
        // ==================================================

        function formatTravelDateRange(
            startDate,
            endDate
        ) {

            const start =
                parseLocalDate(
                    startDate
                );


            const end =
                parseLocalDate(
                    endDate ||
                    startDate
                );


            if (!start) {
                return "—";
            }


            if (!end) {

                return start.toLocaleDateString(
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


            // Same exact date

            if (
                start.getFullYear() ===
                    end.getFullYear() &&
                start.getMonth() ===
                    end.getMonth() &&
                start.getDate() ===
                    end.getDate()
            ) {

                return start.toLocaleDateString(
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


            // Same month + year

            if (
                start.getFullYear() ===
                    end.getFullYear() &&
                start.getMonth() ===
                    end.getMonth()
            ) {

                const month =
                    start.toLocaleDateString(
                        "en-PH",
                        {
                            month:
                                "short"
                        }
                    );


                return `${month} ${
                    start.getDate()
                }–${
                    end.getDate()
                }, ${
                    start.getFullYear()
                }`;

            }


            // Same year but different month

            if (
                start.getFullYear() ===
                end.getFullYear()
            ) {

                const startText =
                    start.toLocaleDateString(
                        "en-PH",
                        {
                            month:
                                "short",
                            day:
                                "numeric"
                        }
                    );


                const endText =
                    end.toLocaleDateString(
                        "en-PH",
                        {
                            month:
                                "short",
                            day:
                                "numeric"
                        }
                    );


                return `${startText}–${endText}, ${
                    start.getFullYear()
                }`;

            }


            // Different year

            const startText =
                start.toLocaleDateString(
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


            const endText =
                end.toLocaleDateString(
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


            return `${startText}–${endText}`;

        }


        // ==================================================
        // PACKAGE LOOKUP
        // ==================================================

        function getPackageById(
            packageId
        ) {

            return packages.find(
                item =>
                    item.id ===
                    packageId
            ) || null;

        }


        // ==================================================
        // LOAD PACKAGES
        // ==================================================

        async function loadPackages() {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "packages"
                    )
                );


            packages =
                snapshot.docs.map(
                    documentSnapshot => {

                        const data =
                            documentSnapshot.data();


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
                                data.price ||
                                0,

                            duration:
                                data.duration ||
                                "",

                            status:
                                data.status ||
                                "active",

                            accommodations:
                                Array.isArray(
                                    data.accommodations
                                )
                                    ? data.accommodations
                                    : []

                        };

                    }
                );


            populatePackageOptions();

        }


        // ==================================================
        // POPULATE PACKAGE OPTIONS
        // ==================================================

        function populatePackageOptions() {

            if (
                bookingPackageFilter
            ) {

                const currentValue =
                    bookingPackageFilter.value;


                bookingPackageFilter.innerHTML = `

                    <option value="all">
                        All Packages
                    </option>

                `;


                packages
                    .slice()
                    .sort(
                        (a, b) =>
                            a.name.localeCompare(
                                b.name
                            )
                    )
                    .forEach(
                        packageItem => {

                            const option =
                                document.createElement(
                                    "option"
                                );


                            option.value =
                                packageItem.id;


                            option.textContent =
                                packageItem.name;


                            bookingPackageFilter
                                .appendChild(
                                    option
                                );

                        }
                    );


                if (
                    [
                        ...bookingPackageFilter
                            .options
                    ].some(
                        option =>
                            option.value ===
                            currentValue
                    )
                ) {

                    bookingPackageFilter.value =
                        currentValue;

                }

            }


            if (
                bookingPackage
            ) {

                const currentValue =
                    bookingPackage.value;


                bookingPackage.innerHTML = `

                    <option value="">
                        Select package
                    </option>

                `;


                packages
                    .filter(
                        packageItem =>
                            packageItem.status ===
                            "active"
                    )
                    .slice()
                    .sort(
                        (a, b) =>
                            a.name.localeCompare(
                                b.name
                            )
                    )
                    .forEach(
                        packageItem => {

                            const option =
                                document.createElement(
                                    "option"
                                );


                            option.value =
                                packageItem.id;


                            const durationText =
                                packageItem.duration
                                    ? ` — ${packageItem.duration}`
                                    : "";


                            option.textContent =
                                `${packageItem.name}${durationText}`;


                            bookingPackage
                                .appendChild(
                                    option
                                );

                        }
                    );


                if (
                    [
                        ...bookingPackage.options
                    ].some(
                        option =>
                            option.value ===
                            currentValue
                    )
                ) {

                    bookingPackage.value =
                        currentValue;

                }

            }

        }

                // ==================================================
        // LOAD ACCOMMODATION OPTIONS
        // ==================================================

        function loadAccommodationOptions(
            selectedValue = ""
        ) {

            if (!accommodation) {
                return;
            }


            accommodation.innerHTML = `

                <option value="">
                    Select accommodation
                </option>

            `;


            const packageItem =
                getPackageById(
                    bookingPackage?.value
                );


            if (!packageItem) {
                return;
            }


            const accommodations =
                Array.isArray(
                    packageItem.accommodations
                )
                    ? packageItem.accommodations
                    : [];


            accommodations.forEach(
                (
                    accommodationItem,
                    index
                ) => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        String(index);


                    const additionalPrice =
                        normalizeNumber(
                            accommodationItem.price
                        );


                    let priceText =
                        "";


                    if (
                        accommodationItem.type ===
                            "additional" &&
                        additionalPrice > 0
                    ) {

                        priceText =
                            ` (+₱${formatMoney(
                                additionalPrice
                            )})`;

                    }


                    option.textContent =
                        `${
                            accommodationItem.name ||
                            `Accommodation ${index + 1}`
                        }${priceText}`;


                    accommodation.appendChild(
                        option
                    );

                }
            );


            if (
                selectedValue !== "" &&
                [
                    ...accommodation.options
                ].some(
                    option =>
                        option.value ===
                        String(
                            selectedValue
                        )
                )
            ) {

                accommodation.value =
                    String(
                        selectedValue
                    );

            }

        }


        // ==================================================
        // CALCULATE BOOKING TOTAL
        // ==================================================

                function calculateBookingAmount() {

            const selectedPackage =
                getPackageById(
                    bookingPackage?.value
                );


            const guests =
                Math.max(
                    1,
                    normalizeNumber(
                        numberOfGuests?.value
                    )
                );


            if (!selectedPackage) {

                updatePaymentCalculation();

                return;

            }


            // =========================================
            // PACKAGE BASE PRICE
            // =========================================

            const packagePrice =
                normalizeNumber(
                    selectedPackage.price
                );


            const packageTotal =
                packagePrice *
                guests;


            // =========================================
            // PACKAGE DURATION / NIGHTS
            // =========================================

            const durationDays =
                getDurationDays(
                    selectedPackage.duration
                );


            const numberOfNights =
                Math.max(
                    0,
                    durationDays - 1
                );


            // =========================================
            // ACCOMMODATION
            // =========================================

            let accommodationTotal =
                0;


            const selectedAccommodationIndex =
                accommodation?.value;


            if (
                selectedAccommodationIndex !==
                ""
            ) {

                const selectedAccommodation =
                    selectedPackage
                        .accommodations?.[
                            Number(
                                selectedAccommodationIndex
                            )
                        ];


                if (
                    selectedAccommodation &&
                    selectedAccommodation.type ===
                        "additional"
                ) {

                    const accommodationRate =
                        normalizeNumber(
                            selectedAccommodation.price
                        );


                    /*
                     * Backward compatibility:
                     * Old additional accommodations that
                     * do not yet have priceType are treated
                     * as per-night.
                     */

                    const priceType =
                        selectedAccommodation.priceType ||
                        "per_night";


                    // -----------------------------------------
                    // PER NIGHT
                    // -----------------------------------------

                    if (
                        priceType ===
                        "per_night"
                    ) {

                        accommodationTotal =
                            accommodationRate *
                            numberOfNights;

                    }


                    // -----------------------------------------
                    // PER PERSON / NIGHT
                    // -----------------------------------------

                    else if (
                        priceType ===
                        "per_person_night"
                    ) {

                        accommodationTotal =
                            accommodationRate *
                            guests *
                            numberOfNights;

                    }


                    // -----------------------------------------
                    // FLAT RATE
                    // -----------------------------------------

                    else if (
                        priceType ===
                        "flat_rate"
                    ) {

                        accommodationTotal =
                            accommodationRate;

                    }


                    // -----------------------------------------
                    // INCLUDED
                    // -----------------------------------------

                    else {

                        accommodationTotal =
                            0;

                    }

                }

            }


            // =========================================
            // GRAND TOTAL
            // =========================================

            const calculatedTotal =
                packageTotal +
                accommodationTotal;


            if (
                totalAmount
            ) {

                totalAmount.value =
                    calculatedTotal;

            }


            console.log(
                "BOOKING PRICE CALCULATION:",
                {

                    packagePrice:
                        packagePrice,

                    guests:
                        guests,

                    packageTotal:
                        packageTotal,

                    duration:
                        selectedPackage.duration,

                    nights:
                        numberOfNights,

                    accommodationTotal:
                        accommodationTotal,

                    grandTotal:
                        calculatedTotal

                }
            );


            updatePaymentCalculation();

        }

        // ==================================================
// PAYMENT CALCULATION
// ==================================================

function updatePaymentCalculation() {

    const total =
        Math.max(
            0,
            normalizeNumber(
                totalAmount?.value
            )
        );


    const paid =
        Math.max(
            0,
            normalizeNumber(
                amountPaid?.value
            )
        );


    // ==============================================
    // REMAINING BALANCE
    // ==============================================

    const balance =
        Math.max(
            0,
            total - paid
        );


    if (
        remainingBalance
    ) {

        remainingBalance.value =
            balance;

    }


    // ==============================================
    // PAYMENT STATUS
    // ==============================================

    if (
        !paymentStatus
    ) {
        return;
    }


    if (
        total <= 0 ||
        paid <= 0
    ) {

        paymentStatus.value =
            "unpaid";

    }

    else if (
        paid >= total
    ) {

        paymentStatus.value =
            "paid";

    }

    else {

        paymentStatus.value =
            "partial";

    }

}


        // ==================================================
        // FALLBACK BOOKING REFERENCE
        // ==================================================

        // ==================================================
// FALLBACK BOOKING REFERENCE
// Handles old / legacy bookings safely
// ==================================================

function buildFallbackBookingReference(
    booking,
    index
) {

    // If booking already has a valid reference,
    // use it directly.

    if (
        booking.bookingReference &&
        !booking.bookingReference.includes("NaN")
    ) {

        return booking.bookingReference;

    }


    // Default to current year.
    let year =
        new Date().getFullYear();


    // Try to get the year from createdAt.
    if (booking.createdAt) {

        try {

            let createdDate = null;


            // Firestore Timestamp
            if (
                typeof booking.createdAt?.toDate ===
                "function"
            ) {

                createdDate =
                    booking.createdAt.toDate();

            }


            // Firestore Timestamp object
            else if (
                booking.createdAt?.seconds
            ) {

                createdDate =
                    new Date(
                        booking.createdAt.seconds *
                        1000
                    );

            }


            // ISO / normal date string
            else {

                createdDate =
                    new Date(
                        booking.createdAt
                    );

            }


            if (
                createdDate &&
                !Number.isNaN(
                    createdDate.getTime()
                )
            ) {

                year =
                    createdDate.getFullYear();

            }

        } catch (error) {

            console.warn(
                "Unable to read legacy createdAt:",
                booking.createdAt
            );

        }

    }


    const existingNumbers =
    bookings
        .map(item => {

            const ref =
                item.bookingReference || "";

            const match =
                ref.match(
                    /^TW-\d{4}-(\d{6})$/
                );

            return match
                ? Number(match[1])
                : null;

        })
        .filter(
            number =>
                Number.isFinite(number)
        );


let fallbackNumber =
    index + 1;


while (
    existingNumbers.includes(
        fallbackNumber
    )
) {

    fallbackNumber++;

}


return `TW-${year}-${String(
    fallbackNumber
).padStart(
    6,
    "0"
)}`;

}


        // ==================================================
        // LOAD BOOKINGS
        // ==================================================

        async function loadBookings() {

            showLoading({

                title:
                    "Loading Bookings...",

                message:
                    "Please wait while we load your reservations.",

                retry:
                    loadBookings

            });


            try {

                await loadPackages();


                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            "bookings"
                        )
                    );


                bookings =
                    snapshot.docs.map(
                        (
                            documentSnapshot,
                            index
                        ) => {

                            const data =
                                documentSnapshot.data();


                            // ==================================
                            // LEGACY CUSTOMER FIELDS
                            // ==================================

                            const customerNameValue =
                                data.customerName ||
                                data.name ||
                                data.fullName ||
                                data.guestName ||
                                "";


                            const customerContactValue =
                                data.customerContact ||
                                data.contactNumber ||
                                data.phone ||
                                data.mobile ||
                                "";


                            const customerEmailValue =
                                data.customerEmail ||
                                data.email ||
                                "";


                            const customerFbValue =
                                data.customerFb ||
                                data.facebookName ||
                                data.fbName ||
                                "";


                            // ==================================
                            // LEGACY PACKAGE FIELDS
                            // ==================================

                            const packageIdValue =
                                data.packageId ||
                                data.packageID ||
                                "";


                            let packageNameValue =
                                data.packageName ||
                                data.package ||
                                data.destination ||
                                "";


                            const linkedPackage =
                                getPackageById(
                                    packageIdValue
                                );


                            if (
                                !packageNameValue &&
                                linkedPackage
                            ) {

                                packageNameValue =
                                    linkedPackage.name;

                            }


                            // ==================================
                            // LEGACY TRAVEL DATE
                            // ==================================

                            const legacyTravelDate =
                                data.travelDate ||
                                data.date ||
                                data.tripDate ||
                                "";


                            const travelStartDateValue =
                                data.travelStartDate ||
                                data.startDate ||
                                legacyTravelDate ||
                                "";


                            const durationValue =
                                data.duration ||
                                data.packageDuration ||
                                linkedPackage?.duration ||
                                "";


                            const travelEndDateValue =
                                data.travelEndDate ||
                                data.endDate ||
                                (
                                    travelStartDateValue
                                        ? calculateTravelEndDate(
                                            travelStartDateValue,
                                            durationValue
                                        )
                                        : ""
                                );


                            // ==================================
                            // LEGACY GUEST COUNT
                            // ==================================

                            const guestsValue =
                                normalizeNumber(
                                    data.numberOfGuests ??
                                    data.pax ??
                                    data.guests ??
                                    data.numberOfPax
                                ) || 1;


                            // ==================================
                            // LEGACY PAYMENT
                            // ==================================

                            const totalValue =
                                normalizeNumber(
                                    data.totalAmount ??
                                    data.total ??
                                    data.amount ??
                                    data.packageTotal
                                );


                            const paidValue =
                                normalizeNumber(
                                    data.amountPaid ??
                                    data.paid ??
                                    data.paymentAmount
                                );


                            const balanceValue =
                                data.remainingBalance !==
                                    undefined
                                    ? normalizeNumber(
                                        data.remainingBalance
                                    )
                                    : Math.max(
                                        0,
                                        totalValue -
                                        paidValue
                                    );


                            let paymentStatusValue =
                                data.paymentStatus ||
                                data.payment_status ||
                                "";


                            if (
                                !paymentStatusValue
                            ) {

                                if (
                                    totalValue > 0 &&
                                    paidValue >= totalValue
                                ) {

                                    paymentStatusValue =
                                        "paid";

                                } else if (
                                    paidValue > 0
                                ) {

                                    paymentStatusValue =
                                        "partial";

                                } else {

                                    paymentStatusValue =
                                        "unpaid";

                                }

                            }


                            // ==================================
                            // BOOKING STATUS
                            // ==================================

                            let bookingStatusValue =
    String(
        data.bookingStatus ||
        data.status ||
        "pending"
    )
        .trim()
        .toLowerCase();


// Legacy status compatibility
if (
    bookingStatusValue === "confirm" ||
    bookingStatusValue === "confirmed booking" ||
    bookingStatusValue === "booked"
) {

    bookingStatusValue =
        "confirmed";

}


else if (
    bookingStatusValue === "pending booking" ||
    bookingStatusValue === "waiting" ||
    bookingStatusValue === "new"
) {

    bookingStatusValue =
        "pending";

}


else if (
    bookingStatusValue === "cancel" ||
    bookingStatusValue === "cancelled"
) {

    bookingStatusValue =
        "cancelled";

}
                            // ==================================
                            // BUILD NORMALIZED RECORD
                            // ==================================

                            const normalizedBooking = {

                                id:
                                    documentSnapshot.id,

                                bookingReference:
                                    data.bookingReference ||
                                    data.bookingRef ||
                                    data.reference ||
                                    "",

                                customerName:
                                    customerNameValue,

                                customerContact:
                                    customerContactValue,

                                customerEmail:
                                    customerEmailValue,

                                customerFb:
                                    customerFbValue,

                                packageId:
                                    packageIdValue,

                                packageName:
                                    packageNameValue,

                                packageCategory:
                                    data.packageCategory ||
                                    linkedPackage?.category ||
                                    "",

                                packageLocation:
                                    data.packageLocation ||
                                    linkedPackage?.location ||
                                    "",

                                duration:
                                    durationValue,

                                travelStartDate:
                                    travelStartDateValue,

                                travelEndDate:
                                    travelEndDateValue,

                                travelDate:
                                    legacyTravelDate ||
                                    travelStartDateValue,

                                numberOfGuests:
                                    guestsValue,

                                pickupPoint:
                                    data.pickupPoint ||
                                    data.pickup ||
                                    data.meetup ||
                                    "",

                                accommodationIndex:
                                    data.accommodationIndex ??
                                    "",

                                accommodationName:
                                    data.accommodationName ||
                                    data.accommodation ||
                                    "",

                                accommodationPrice:
                                    normalizeNumber(
                                        data.accommodationPrice
                                    ),

                                specialRequest:
                                    data.specialRequest ||
                                    data.request ||
                                    data.notes ||
                                    "",

                                totalAmount:
                                    totalValue,

                                amountPaid:
                                    paidValue,

                                remainingBalance:
                                    balanceValue,

                                paymentStatus:
                                    paymentStatusValue,

                                paymentMethod:
                                    data.paymentMethod ||
                                    "",

                                paymentReference:
                                    data.paymentReference ||
                                    data.referenceNumber ||
                                    "",

                                bookingStatus:
                                    bookingStatusValue,

                                bookingSource:
                                    data.bookingSource ||
                                    data.source ||
                                    "facebook",

                                internalNotes:
                                    data.internalNotes ||
                                    data.adminNotes ||
                                    "",

                                createdAt:
                                    data.createdAt ||
                                    data.created ||
                                    "",

                                updatedAt:
                                    data.updatedAt ||
                                    ""

                            };


                            normalizedBooking
                                .displayReference =
                                buildFallbackBookingReference(
                                    normalizedBooking,
                                    index
                                );


                            normalizedBooking
                                .travelDateDisplay =
                                formatTravelDateRange(
                                    normalizedBooking
                                        .travelStartDate,

                                    normalizedBooking
                                        .travelEndDate
                                );


                            return normalizedBooking;

                        }
                    );


                console.log(
                    "BOOKINGS LOADED:",
                    bookings
                );


                renderBookings();

                hideLoading();


            } catch (error) {

                console.error(
                    "FAILED TO LOAD BOOKINGS:",
                    error
                );


                showLoadingError(
                    navigator.onLine
                        ? "Unable to load bookings. Please try again."
                        : "No internet connection. Check your connection and try again.",
                    loadBookings
                );

            }

        }


        // ==================================================
        // UPDATE BOOKING SUMMARY
        // ==================================================

        function updateBookingSummary() {

            const total =
                bookings.length;


            const confirmed =
                bookings.filter(
                    booking =>
                        booking.bookingStatus ===
                        "confirmed"
                ).length;


            const pending =
                bookings.filter(
                    booking =>
                        booking.bookingStatus ===
                        "pending"
                ).length;


            const totalGuests =
                bookings.reduce(
                    (
                        totalGuestCount,
                        booking
                    ) => {

                        return (
                            totalGuestCount +
                            normalizeNumber(
                                booking.numberOfGuests
                            )
                        );

                    },
                    0
                );


            if (
                totalBookingsElement
            ) {

                totalBookingsElement.textContent =
                    String(total);

            }


            if (
                confirmedBookingsElement
            ) {

                confirmedBookingsElement.textContent =
                    String(confirmed);

            }


            if (
                pendingBookingsElement
            ) {

                pendingBookingsElement.textContent =
                    String(pending);

            }


            if (
                totalGuestsElement
            ) {

                totalGuestsElement.textContent =
                    String(totalGuests);

            }

        }


        // ==================================================
        // RENDER BOOKINGS
        // ==================================================

        function renderBookings() {

            if (
                !bookingTableBody
            ) {
                return;
            }


            updateBookingSummary();


            const searchValue =
                bookingSearch?.value
                    ?.trim()
                    .toLowerCase() ||
                "";


            const selectedPackage =
                bookingPackageFilter?.value ||
                "all";


            const selectedBookingStatus =
                bookingStatusFilter?.value ||
                "all";


            const selectedPaymentStatus =
                paymentStatusFilter?.value ||
                "all";


            const selectedSort =
                bookingSort?.value ||
                "newest";


            // ==================================================
            // FILTER
            // ==================================================

            let filteredBookings =
                bookings.filter(
                    booking => {

                        const searchableText =
                            [

                                booking.displayReference,

                                booking.bookingReference,

                                booking.customerName,

                                booking.customerContact,

                                booking.customerEmail,

                                booking.customerFb,

                                booking.packageName,

                                booking.pickupPoint,

                                booking.duration

                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();


                        const matchesSearch =
                            !searchValue ||
                            searchableText.includes(
                                searchValue
                            );


                        const matchesPackage =
                            selectedPackage ===
                                "all" ||
                            booking.packageId ===
                                selectedPackage;


                        const matchesBookingStatus =
                            selectedBookingStatus ===
                                "all" ||
                            booking.bookingStatus ===
                                selectedBookingStatus;


                        const matchesPaymentStatus =
                            selectedPaymentStatus ===
                                "all" ||
                            booking.paymentStatus ===
                                selectedPaymentStatus;


                        return (
                            matchesSearch &&
                            matchesPackage &&
                            matchesBookingStatus &&
                            matchesPaymentStatus
                        );

                    }
                );


            // ==================================================
            // SORT
            // ==================================================

            filteredBookings =
                [
                    ...filteredBookings
                ].sort(
                    (
                        a,
                        b
                    ) => {

                        switch (
                            selectedSort
                        ) {

                            case "oldest":

                                return (
                                    getTimestamp(
                                        a.createdAt
                                    ) -
                                    getTimestamp(
                                        b.createdAt
                                    )
                                );


                            case "travel-nearest":

                                return (
                                    getTimestamp(
                                        a.travelStartDate
                                    ) -
                                    getTimestamp(
                                        b.travelStartDate
                                    )
                                );


                            case "travel-farthest":

                                return (
                                    getTimestamp(
                                        b.travelStartDate
                                    ) -
                                    getTimestamp(
                                        a.travelStartDate
                                    )
                                );


                            case "customer-asc":

                                return (
                                    a.customerName ||
                                    ""
                                ).localeCompare(
                                    b.customerName ||
                                    "",
                                    undefined,
                                    {
                                        sensitivity:
                                            "base"
                                    }
                                );


                            case "customer-desc":

                                return (
                                    b.customerName ||
                                    ""
                                ).localeCompare(
                                    a.customerName ||
                                    "",
                                    undefined,
                                    {
                                        sensitivity:
                                            "base"
                                    }
                                );


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
            // RESULT TEXT
            // ==================================================

            if (
                bookingResultText
            ) {

                if (
                    filteredBookings.length ===
                    bookings.length
                ) {

                    bookingResultText.textContent =
                        `Showing all ${
                            bookings.length
                        } ${
                            bookings.length === 1
                                ? "booking"
                                : "bookings"
                        }`;

                } else {

                    bookingResultText.textContent =
                        `Showing ${
                            filteredBookings.length
                        } of ${
                            bookings.length
                        } bookings`;

                }

            }


            bookingTableBody.innerHTML =
                "";


            // ==================================================
            // EMPTY STATE
            // ==================================================

            if (
                filteredBookings.length ===
                0
            ) {

                bookingEmptyState
                    ?.classList
                    .add(
                        "show"
                    );


                return;

            }


            bookingEmptyState
                ?.classList
                .remove(
                    "show"
                );


            // ==================================================
            // TABLE ROWS
            // ==================================================

            filteredBookings.forEach(
                booking => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    const paymentClass =
                        booking.paymentStatus ||
                        "unpaid";


                    const bookingClass =
                        booking.bookingStatus ||
                        "pending";


                    const paymentLabel =
                        capitalize(
                            paymentClass
                        );


                    const bookingLabel =
                        capitalize(
                            bookingClass
                        );


                    row.innerHTML = `

                        <td>

                            <span
                                class="booking-reference"
                            >

                                <i
                                    class="fa-solid fa-hashtag"
                                ></i>

                                ${escapeHtml(
                                    booking.displayReference ||
                                    booking.id
                                )}

                            </span>

                        </td>


                        <td>

                            <div
                                class="booking-customer"
                            >

                                <div
                                    class="booking-customer-avatar"
                                >

                                    ${escapeHtml(
                                        getInitials(
                                            booking.customerName
                                        )
                                    )}

                                </div>


                                <div
                                    class="booking-customer-info"
                                >

                                    <strong>

                                        ${escapeHtml(
                                            booking.customerName ||
                                            "Unnamed Guest"
                                        )}

                                    </strong>


                                    <span>

                                        ${escapeHtml(
                                            booking.customerContact ||
                                            booking.customerEmail ||
                                            "No contact"
                                        )}

                                    </span>

                                </div>

                            </div>

                        </td>


                        <td>

                            <div
                                class="booking-package"
                            >

                                <strong>

                                    ${escapeHtml(
                                        booking.packageName ||
                                        "Package unavailable"
                                    )}

                                </strong>


                                <span>

                                    ${escapeHtml(
                                        booking.duration ||
                                        booking.pickupPoint ||
                                        ""
                                    )}

                                </span>

                            </div>

                        </td>


                        <td>

                            <strong>

                                ${escapeHtml(
                                    booking.travelDateDisplay ||
                                    "—"
                                )}

                            </strong>

                        </td>


                        <td>

                            ${escapeHtml(
                                booking.numberOfGuests
                            )}

                        </td>


                        <td>

                            <strong>

                                ₱${escapeHtml(
                                    formatMoney(
                                        booking.totalAmount
                                    )
                                )}

                            </strong>

                        </td>


                        <td>

                            <span
                                class="payment-badge ${escapeHtml(
                                    paymentClass
                                )}"
                            >

                                ${escapeHtml(
                                    paymentLabel
                                )}

                            </span>

                        </td>


                        <td>

                            <span
                                class="booking-status-badge ${escapeHtml(
                                    bookingClass
                                )}"
                            >

                                ${escapeHtml(
                                    bookingLabel
                                )}

                            </span>

                        </td>


                        <td>

                            <div
                                class="booking-row-actions"
                            >

                                <button
                                    type="button"
                                    class="booking-action-edit edit-booking-btn"
                                    data-id="${booking.id}"
                                    title="Edit booking"
                                >

                                    <i
                                        class="fa-regular fa-pen-to-square"
                                    ></i>

                                    <span>
                                        Edit
                                    </span>

                                </button>


                                <button
                                    type="button"
                                    class="booking-action-more"
                                    data-id="${booking.id}"
                                    title="More options"
                                >

                                    <i
                                        class="fa-solid fa-ellipsis"
                                    ></i>

                                </button>

                            </div>

                        </td>

                    `;


                    bookingTableBody.appendChild(
                        row
                    );

                }
            );

        }

                // ==================================================
        // OPEN BOOKING MODAL
        // ==================================================

        function openBookingModal() {

            if (!bookingModal) {
                return;
            }

            bookingModal.classList.add(
                "show"
            );

            bookingModal.setAttribute(
                "aria-hidden",
                "false"
            );

            document.body.style.overflow =
                "hidden";

        }


        // ==================================================
        // CLOSE BOOKING MODAL
        // ==================================================

        function closeBookingModalPanel() {

            if (!bookingModal) {
                return;
            }

            if (
                bookingModal.contains(
                    document.activeElement
                )
            ) {

                document.activeElement.blur();

            }

            bookingModal.classList.remove(
                "show"
            );

            bookingModal.setAttribute(
                "aria-hidden",
                "true"
            );

            document.body.style.overflow =
                "";

        }


        // ==================================================
        // RESET BOOKING FORM
        // ==================================================

        function resetBookingForm() {

            editingBookingId =
                null;

            bookingForm?.reset();


            if (numberOfGuests) {

                numberOfGuests.value =
                    "1";

            }


            if (totalAmount) {

                totalAmount.value =
                    "0";

            }


            if (amountPaid) {

                amountPaid.value =
                    "0";

            }


            if (remainingBalance) {

                remainingBalance.value =
                    "0";

            }


            if (paymentStatus) {

                paymentStatus.value =
                    "unpaid";

            }


            if (bookingStatus) {

                bookingStatus.value =
                    "pending";

            }


            if (bookingSource) {

                bookingSource.value =
                    "facebook";

            }


            if (bookingModalTitle) {

                bookingModalTitle.textContent =
                    "New Booking";

            }


            if (bookingModalDescription) {

                bookingModalDescription.textContent =
                    "Create a new customer reservation.";

            }


            loadAccommodationOptions();

            updatePaymentCalculation();

        }


        // ==================================================
        // OPEN NEW BOOKING
        // ==================================================

        function openNewBooking() {

            resetBookingForm();

            openBookingModal();

        }


        // ==================================================
        // GET CURRENT PACKAGE DURATION
        // ==================================================

        function getCurrentPackageDuration() {

            const selectedPackage =
                getPackageById(
                    bookingPackage?.value
                );


            return (
                selectedPackage?.duration ||
                ""
            );

        }


        // ==================================================
        // GET CURRENT TRAVEL END DATE
        // ==================================================

        function getCurrentTravelEndDate() {

            const startDate =
                travelDate?.value ||
                "";


            const duration =
                getCurrentPackageDuration();


            if (!startDate) {
                return "";
            }


            return calculateTravelEndDate(
                startDate,
                duration
            );

        }


        // ==================================================
        // LOG TRAVEL RANGE
        // Useful while testing the module
        // ==================================================

        function updateTravelDatePreview() {

            const startDate =
                travelDate?.value ||
                "";


            if (!startDate) {
                return;
            }


            const duration =
                getCurrentPackageDuration();


            const endDate =
                calculateTravelEndDate(
                    startDate,
                    duration
                );


            console.log(
                "TRAVEL DATE:",
                {
                    duration:
                        duration ||
                        "Day Tour",

                    startDate:
                        startDate,

                    endDate:
                        endDate,

                    display:
                        formatTravelDateRange(
                            startDate,
                            endDate
                        )
                }
            );

        }


        // ==================================================
        // EDIT BOOKING
        // ==================================================

        function editBooking(
            bookingId
        ) {

            const booking =
                bookings.find(
                    item =>
                        item.id ===
                        bookingId
                );


            if (!booking) {

                console.error(
                    "BOOKING NOT FOUND:",
                    bookingId
                );

                return;

            }


            editingBookingId =
                bookingId;


            // ==================================================
            // MODAL HEADING
            // ==================================================

            if (bookingModalTitle) {

                bookingModalTitle.textContent =
                    "Edit Booking";

            }


            if (bookingModalDescription) {

                bookingModalDescription.textContent =
                    `Update ${
                        booking.displayReference ||
                        booking.bookingReference ||
                        "booking"
                    } details.`;

            }


            // ==================================================
            // CUSTOMER
            // ==================================================

            if (customerName) {

                customerName.value =
                    booking.customerName ||
                    "";

            }


            if (customerContact) {

                customerContact.value =
                    booking.customerContact ||
                    "";

            }


            if (customerEmail) {

                customerEmail.value =
                    booking.customerEmail ||
                    "";

            }


            if (customerFb) {

                customerFb.value =
                    booking.customerFb ||
                    "";

            }


            // ==================================================
            // PACKAGE
            // ==================================================

            if (bookingPackage) {

                const packageExists =
                    [
                        ...bookingPackage.options
                    ].some(
                        option =>
                            option.value ===
                            booking.packageId
                    );


                /*
                 * If an old booking is connected
                 * to an inactive/removed package,
                 * temporarily show it in the form.
                 */

                if (
                    !packageExists &&
                    booking.packageId
                ) {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        booking.packageId;


                    option.textContent =
                        booking.packageName ||
                        "Existing Package";


                    bookingPackage.appendChild(
                        option
                    );

                }


                bookingPackage.value =
                    booking.packageId ||
                    "";

            }


            // ==================================================
            // TRAVEL START DATE
            // ==================================================

            if (travelDate) {

                travelDate.value =
                    booking.travelStartDate ||
                    booking.travelDate ||
                    "";

            }


            // ==================================================
            // NUMBER OF GUESTS
            // ==================================================

            if (numberOfGuests) {

                numberOfGuests.value =
                    booking.numberOfGuests ||
                    1;

            }


            // ==================================================
            // PICKUP
            // ==================================================

            if (pickupPoint) {

                const pickupValue =
                    booking.pickupPoint ||
                    "";


                const pickupExists =
                    [
                        ...pickupPoint.options
                    ].some(
                        option =>
                            option.value ===
                            pickupValue
                    );


                /*
                 * Preserve old/custom pickup
                 * locations.
                 */

                if (
                    pickupValue &&
                    !pickupExists
                ) {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        pickupValue;


                    option.textContent =
                        pickupValue;


                    pickupPoint.appendChild(
                        option
                    );

                }


                pickupPoint.value =
                    pickupValue;

            }


            // ==================================================
            // ACCOMMODATION
            // ==================================================

            loadAccommodationOptions(
                booking.accommodationIndex
            );


            /*
             * Legacy booking:
             * try matching accommodation by name
             * if no index was previously stored.
             */

            if (
                accommodation &&
                booking.accommodationName &&
                accommodation.value ===
                    ""
            ) {

                const accommodationName =
                    booking
                        .accommodationName
                        .trim()
                        .toLowerCase();


                const matchingOption =
                    [
                        ...accommodation.options
                    ].find(
                        option => {

                            return (
                                option.textContent ||
                                ""
                            )
                                .trim()
                                .toLowerCase()
                                .startsWith(
                                    accommodationName
                                );

                        }
                    );


                if (matchingOption) {

                    accommodation.value =
                        matchingOption.value;

                }

            }


            // ==================================================
            // SPECIAL REQUEST
            // ==================================================

            if (specialRequest) {

                specialRequest.value =
                    booking.specialRequest ||
                    "";

            }


            // ==================================================
            // PAYMENT
            // ==================================================

            if (totalAmount) {

                totalAmount.value =
                    booking.totalAmount ||
                    0;

            }


            if (amountPaid) {

                amountPaid.value =
                    booking.amountPaid ||
                    0;

            }


            if (remainingBalance) {

                remainingBalance.value =
                    booking.remainingBalance ||
                    0;

            }


            if (paymentStatus) {

                paymentStatus.value =
                    booking.paymentStatus ||
                    "unpaid";

            }


            if (paymentMethod) {

                paymentMethod.value =
                    booking.paymentMethod ||
                    "";

            }


            if (paymentReference) {

                paymentReference.value =
                    booking.paymentReference ||
                    "";

            }


            // ==================================================
            // BOOKING STATUS
            // ==================================================

            if (bookingStatus) {

                bookingStatus.value =
                    booking.bookingStatus ||
                    "pending";

            }


            // ==================================================
            // BOOKING SOURCE
            // ==================================================

            if (bookingSource) {

                bookingSource.value =
                    booking.bookingSource ||
                    "facebook";

            }


            // ==================================================
            // INTERNAL NOTES
            // ==================================================

            if (internalNotes) {

                internalNotes.value =
                    booking.internalNotes ||
                    "";

            }


            /*
             * Important:
             * Do NOT run calculateBookingAmount()
             * here because an existing booking
             * may have a manually adjusted price.
             */

            updatePaymentCalculation();

            updateTravelDatePreview();

            openBookingModal();

        }


        // ==================================================
        // NEW BOOKING BUTTON
        // ==================================================

        newBookingBtn?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                openNewBooking();

            }
        );


        // ==================================================
        // CLOSE MODAL BUTTON
        // ==================================================

        closeBookingModal
            ?.addEventListener(
                "click",
                closeBookingModalPanel
            );


        // ==================================================
        // CANCEL BUTTON
        // ==================================================

        cancelBookingBtn
            ?.addEventListener(
                "click",
                closeBookingModalPanel
            );


        // ==================================================
        // CLICK BACKDROP TO CLOSE
        // ==================================================

        bookingModalBackdrop
            ?.addEventListener(
                "click",
                closeBookingModalPanel
            );


        // ==================================================
        // ESCAPE KEY
        // ==================================================

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                        "Escape" &&
                    bookingModal
                        ?.classList
                        .contains(
                            "show"
                        )
                ) {

                    closeBookingModalPanel();

                }

            }
        );


        // ==================================================
        // PACKAGE CHANGE
        // ==================================================

        bookingPackage
            ?.addEventListener(
                "change",
                () => {

                    /*
                     * Reload accommodation because
                     * every package can have different
                     * accommodation options.
                     */

                    loadAccommodationOptions();


                    /*
                     * Recalculate package total.
                     */

                    calculateBookingAmount();


                    /*
                     * Recalculate travel end date
                     * based on selected package duration.
                     */

                    updateTravelDatePreview();

                }
            );


        // ==================================================
        // TRAVEL START DATE CHANGE
        // ==================================================

        travelDate
            ?.addEventListener(
                "change",
                () => {

                    updateTravelDatePreview();

                }
            );


        // ==================================================
        // NUMBER OF GUESTS
        // ==================================================

        numberOfGuests
            ?.addEventListener(
                "input",
                () => {

                    const guests =
                        normalizeNumber(
                            numberOfGuests.value
                        );


                    if (guests < 1) {

                        numberOfGuests.value =
                            "1";

                    }


                    calculateBookingAmount();

                }
            );


        // ==================================================
        // ACCOMMODATION CHANGE
        // ==================================================

        accommodation
            ?.addEventListener(
                "change",
                () => {

                    calculateBookingAmount();

                }
            );


        // ==================================================
        // TOTAL AMOUNT
        // ==================================================

        totalAmount
            ?.addEventListener(
                "input",
                () => {

                    updatePaymentCalculation();

                }
            );


        // ==================================================
        // AMOUNT PAID
        // ==================================================

        amountPaid
            ?.addEventListener(
                "input",
                () => {

                    updatePaymentCalculation();

                }
            );


        // ==================================================
        // SEARCH
        // ==================================================

        bookingSearch
            ?.addEventListener(
                "input",
                renderBookings
            );


        // ==================================================
        // PACKAGE FILTER
        // ==================================================

        bookingPackageFilter
            ?.addEventListener(
                "change",
                renderBookings
            );


        // ==================================================
        // BOOKING STATUS FILTER
        // ==================================================

        bookingStatusFilter
            ?.addEventListener(
                "change",
                renderBookings
            );


        // ==================================================
        // PAYMENT STATUS FILTER
        // ==================================================

        paymentStatusFilter
            ?.addEventListener(
                "change",
                renderBookings
            );


        // ==================================================
        // SORT
        // ==================================================

        bookingSort
            ?.addEventListener(
                "change",
                renderBookings
            );


        // ==================================================
        // REFRESH BOOKINGS
        // ==================================================

        refreshBookingsBtn
            ?.addEventListener(
                "click",
                async () => {

                    if (
                        refreshBookingsBtn.disabled
                    ) {
                        return;
                    }


                    refreshBookingsBtn.disabled =
                        true;


                    refreshBookingsBtn
                        .classList
                        .add(
                            "refreshing"
                        );


                    try {

                        await loadBookings();

                    } finally {

                        refreshBookingsBtn.disabled =
                            false;


                        refreshBookingsBtn
                            .classList
                            .remove(
                                "refreshing"
                            );

                    }

                }
            );


        // ==================================================
        // TABLE ACTIONS
        // ==================================================

        bookingTableBody
            ?.addEventListener(
                "click",
                event => {

                    // ==========================================
                    // EDIT
                    // ==========================================

                    const editButton =
                        event.target.closest(
                            ".edit-booking-btn"
                        );


                    if (editButton) {

                        const bookingId =
                            editButton.dataset.id;


                        if (bookingId) {

                            editBooking(
                                bookingId
                            );

                        }


                        return;

                    }


                    // ==========================================
                    // MORE OPTIONS
                    // ==========================================

                    const moreButton =
                        event.target.closest(
                            ".booking-action-more"
                        );


                    if (moreButton) {

                        const bookingId =
                            moreButton.dataset.id;


                        console.log(
                            "BOOKING MORE OPTIONS:",
                            bookingId
                        );


                        /*
                         * Sa next improvement natin,
                         * dito natin ilalagay:
                         *
                         * View Booking
                         * View Payment
                         * Generate Invoice
                         * Confirm Booking
                         * Cancel Booking
                         * Delete Booking
                         */

                    }

                }
            );

            // ==================================================
// BOOKING VIEW / ACTION MENU
// ==================================================

const bookingViewModal =
    document.getElementById(
        "bookingViewModal"
    );

const closeBookingView =
    document.getElementById(
        "closeBookingView"
    );

const closeBookingViewFooter =
    document.getElementById(
        "closeBookingViewFooter"
    );

const editFromBookingView =
    document.getElementById(
        "editFromBookingView"
    );

const viewBookingReference =
    document.getElementById(
        "viewBookingReference"
    );

const bookingViewBody =
    document.getElementById(
        "bookingViewBody"
    );


let currentViewedBookingId =
    null;


// ==================================================
// CLOSE ACTION MENUS
// ==================================================

function closeBookingActionMenus() {

    document
        .querySelectorAll(
            ".booking-action-menu.show"
        )
        .forEach(
            menu => {

                menu.classList.remove(
                    "show"
                );

                menu.remove();

            }
        );

}


// ==================================================
// OPEN BOOKING ACTION MENU
// ==================================================

function openBookingActionMenu(
    button,
    bookingId
) {

    closeBookingActionMenus();


    const booking =
        bookings.find(
            item =>
                item.id === bookingId
        );


    if (!booking) {
        return;
    }


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "booking-action-menu";


    menu.innerHTML = `

        <button
            type="button"
            class="booking-action-item booking-menu-view"
            data-id="${bookingId}"
        >
            <i class="fa-regular fa-eye"></i>
            <span>View Details</span>
        </button>


        <button
            type="button"
            class="booking-action-item booking-menu-edit"
            data-id="${bookingId}"
        >
            <i class="fa-regular fa-pen-to-square"></i>
            <span>Edit Booking</span>
        </button>


        <div class="booking-action-divider"></div>


        <button
            type="button"
            class="booking-action-item booking-menu-status"
            data-id="${bookingId}"
        >
            <i class="fa-solid fa-arrow-right-arrow-left"></i>
            <span>Change Status</span>
        </button>

    `;


    document.body.appendChild(
        menu
    );


    const rect =
        button.getBoundingClientRect();


    const menuWidth =
        205;


    let left =
        rect.right -
        menuWidth;


    let top =
        rect.bottom +
        8;


    if (
        left < 10
    ) {

        left =
            10;

    }


    if (
        left +
        menuWidth >
        window.innerWidth -
        10
    ) {

        left =
            window.innerWidth -
            menuWidth -
            10;

    }


    menu.style.left =
        `${left}px`;


    menu.style.top =
        `${top}px`;


    menu.classList.add(
        "show"
    );


    // ==================================================
    // VIEW DETAILS
    // ==================================================

    menu
        .querySelector(
            ".booking-menu-view"
        )
        ?.addEventListener(
            "click",
            () => {

                closeBookingActionMenus();

                openBookingView(
                    bookingId
                );

            }
        );


    // ==================================================
    // EDIT BOOKING
    // ==================================================

    menu
        .querySelector(
            ".booking-menu-edit"
        )
        ?.addEventListener(
            "click",
            () => {

                closeBookingActionMenus();

                editBooking(
                    bookingId
                );

            }
        );


    // ==================================================
    // CHANGE STATUS
    // ==================================================

    menu
        .querySelector(
            ".booking-menu-status"
        )
        ?.addEventListener(
            "click",
            () => {

                closeBookingActionMenus();

                openBookingStatusSelector(
                    bookingId
                );

            }
        );

}


// ==================================================
// OPEN BOOKING VIEW MODAL
// ==================================================

function openBookingView(
    bookingId
) {

    const booking =
        bookings.find(
            item =>
                item.id === bookingId
        );


    if (
        !booking ||
        !bookingViewModal ||
        !bookingViewBody
    ) {

        return;

    }


    currentViewedBookingId =
        bookingId;


    if (
        viewBookingReference
    ) {

        viewBookingReference.textContent =
            booking.displayReference ||
            booking.bookingReference ||
            "Booking";

    }


    bookingViewBody.innerHTML = `

        <!-- =========================================
             CUSTOMER INFORMATION
        ========================================== -->

        <section class="booking-view-section">

            <h3 class="booking-view-section-title">

                <i class="fa-regular fa-user"></i>

                Customer Information

            </h3>


            <div class="booking-view-grid">


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Customer Name
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.customerName ||
                            "—"
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Contact Number
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.customerContact ||
                            "—"
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Email
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.customerEmail ||
                            "—"
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Facebook
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.customerFb ||
                            "—"
                        )}

                    </div>

                </div>


            </div>

        </section>


        <!-- =========================================
             TOUR DETAILS
        ========================================== -->

        <section class="booking-view-section">

            <h3 class="booking-view-section-title">

                <i class="fa-solid fa-suitcase-rolling"></i>

                Tour Details

            </h3>


            <div class="booking-view-grid">


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Package
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.packageName ||
                            "—"
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Duration
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.duration ||
                            "—"
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Travel Date
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.travelDateDisplay ||
                            "—"
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Number of Guests
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.numberOfGuests ||
                            1
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Meet Up / Pick Up
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.pickupPoint ||
                            "—"
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Accommodation
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.accommodationName ||
                            "—"
                        )}

                    </div>

                </div>


                <div class="booking-view-field full">

                    <span class="booking-view-label">
                        Guest Request
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.specialRequest ||
                            "—"
                        )}

                    </div>

                </div>


            </div>

        </section>


        <!-- =========================================
             PAYMENT INFORMATION
        ========================================== -->

        <section class="booking-view-section">

            <h3 class="booking-view-section-title">

                <i class="fa-regular fa-credit-card"></i>

                Payment Information

            </h3>


            <div class="booking-view-grid">


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Total Amount
                    </span>

                    <div class="booking-view-value">

                        ₱${escapeHtml(
                            formatMoney(
                                booking.totalAmount
                            )
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Amount Paid
                    </span>

                    <div class="booking-view-value">

                        ₱${escapeHtml(
                            formatMoney(
                                booking.amountPaid
                            )
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Remaining Balance
                    </span>

                    <div class="booking-view-value">

                        ₱${escapeHtml(
                            formatMoney(
                                booking.remainingBalance
                            )
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Payment Status
                    </span>

                    <div class="booking-view-value">

                        <span class="payment-badge ${
                            booking.paymentStatus ||
                            "unpaid"
                        }">

                            ${escapeHtml(
                                capitalize(
                                    booking.paymentStatus ||
                                    "unpaid"
                                )
                            )}

                        </span>

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Payment Method
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.paymentMethod ||
                            "—"
                        )}

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Payment Reference
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.paymentReference ||
                            "—"
                        )}

                    </div>

                </div>


            </div>

        </section>


        <!-- =========================================
             BOOKING MANAGEMENT
        ========================================== -->

        <section class="booking-view-section">

            <h3 class="booking-view-section-title">

                <i class="fa-solid fa-sliders"></i>

                Booking Management

            </h3>


            <div class="booking-view-grid">


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Booking Status
                    </span>

                    <div class="booking-view-value">

                        <span class="booking-detail-badge ${
                            booking.bookingStatus ||
                            "pending"
                        }">

                            ${escapeHtml(
                                capitalize(
                                    booking.bookingStatus ||
                                    "pending"
                                )
                            )}

                        </span>

                    </div>

                </div>


                <div class="booking-view-field">

                    <span class="booking-view-label">
                        Booking Source
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            capitalize(
                                booking.bookingSource ||
                                "—"
                            )
                        )}

                    </div>

                </div>


                <div class="booking-view-field full">

                    <span class="booking-view-label">
                        Internal Notes
                    </span>

                    <div class="booking-view-value">

                        ${escapeHtml(
                            booking.internalNotes ||
                            "—"
                        )}

                    </div>

                </div>


            </div>

        </section>

    `;


    bookingViewModal.classList.add(
        "show"
    );


    bookingViewModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

}


// ==================================================
// CLOSE BOOKING VIEW
// ==================================================

function closeBookingViewModal() {

    if (!bookingViewModal) {
        return;
    }


    bookingViewModal.classList.remove(
        "show"
    );


    bookingViewModal.setAttribute(
        "aria-hidden",
        "true"
    );


    currentViewedBookingId =
        null;


    document.body.style.overflow =
        "";

}


// ==================================================
// EDIT FROM VIEW MODAL
// ==================================================

editFromBookingView
    ?.addEventListener(
        "click",
        () => {

            const bookingId =
                currentViewedBookingId;


            closeBookingViewModal();


            if (bookingId) {

                editBooking(
                    bookingId
                );

            }

        }
    );


// ==================================================
// CLOSE VIEW BUTTONS
// ==================================================

closeBookingView
    ?.addEventListener(
        "click",
        closeBookingViewModal
    );


closeBookingViewFooter
    ?.addEventListener(
        "click",
        closeBookingViewModal
    );


// Click outside dialog

bookingViewModal
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                bookingViewModal
            ) {

                closeBookingViewModal();

            }

        }
    );


/// ==================================================
// STATUS MODAL ELEMENTS
// ==================================================

const bookingStatusModal =
    document.getElementById(
        "bookingStatusModal"
    );

const closeBookingStatusModal =
    document.getElementById(
        "closeBookingStatusModal"
    );

const cancelBookingStatusChange =
    document.getElementById(
        "cancelBookingStatusChange"
    );

const saveBookingStatusChange =
    document.getElementById(
        "saveBookingStatusChange"
    );

const currentBookingStatus =
    document.getElementById(
        "currentBookingStatus"
    );

const bookingStatusReference =
    document.getElementById(
        "bookingStatusReference"
    );

let statusBookingId = null;
let selectedBookingStatus = null;


// ==================================================
// OPEN STATUS SELECTOR
// ==================================================

function openBookingStatusSelector(
    bookingId
) {

// ==================================================
// OPEN STATUS SELECTOR
// ==================================================

    const booking =
        bookings.find(
            item =>
                item.id === bookingId
        );


    if (
        !booking ||
        !bookingStatusModal
    ) {
        return;
    }


    statusBookingId =
        bookingId;


    selectedBookingStatus =
        booking.bookingStatus ||
        "pending";


    if (bookingStatusReference) {

        bookingStatusReference.textContent =
            booking.displayReference ||
            booking.bookingReference ||
            "Booking";

    }


    if (currentBookingStatus) {

        currentBookingStatus.textContent =
            capitalize(
                selectedBookingStatus
            );

    }


    document
        .querySelectorAll(
            ".booking-status-option"
        )
        .forEach(
            option => {

                option.classList.toggle(
                    "selected",
                    option.dataset.status ===
                    selectedBookingStatus
                );

            }
        );


    if (saveBookingStatusChange) {

        saveBookingStatusChange.disabled =
            true;

    }


    bookingStatusModal.classList.add(
        "show"
    );


    bookingStatusModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

}


// ==================================================
// SELECT STATUS
// ==================================================

document
    .querySelectorAll(
        ".booking-status-option"
    )
    .forEach(
        option => {

            option.addEventListener(
                "click",
                () => {

                    const status =
                        option.dataset.status;


                    if (!status) {
                        return;
                    }


                    selectedBookingStatus =
                        status;


                    document
                        .querySelectorAll(
                            ".booking-status-option"
                        )
                        .forEach(
                            item => {

                                item.classList.toggle(
                                    "selected",
                                    item === option
                                );

                            }
                        );


                    const booking =
                        bookings.find(
                            item =>
                                item.id ===
                                statusBookingId
                        );


                    if (saveBookingStatusChange) {

                        saveBookingStatusChange.disabled =
                            !booking ||
                            selectedBookingStatus ===
                            booking.bookingStatus;

                    }

                }
            );

        }
    );


// ==================================================
// CLOSE STATUS MODAL
// ==================================================

function closeBookingStatusSelector() {

    if (!bookingStatusModal) {
        return;
    }


    bookingStatusModal.classList.remove(
        "show"
    );


    bookingStatusModal.setAttribute(
        "aria-hidden",
        "true"
    );


    statusBookingId =
        null;


    selectedBookingStatus =
        null;


    document.body.style.overflow =
        "";

}


closeBookingStatusModal
    ?.addEventListener(
        "click",
        closeBookingStatusSelector
    );


cancelBookingStatusChange
    ?.addEventListener(
        "click",
        closeBookingStatusSelector
    );


bookingStatusModal
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                bookingStatusModal
            ) {

                closeBookingStatusSelector();

            }

        }
    );


// ==================================================
// SAVE STATUS CHANGE
// ==================================================

saveBookingStatusChange
    ?.addEventListener(
        "click",
        async () => {

            if (
                !statusBookingId ||
                !selectedBookingStatus
            ) {
                return;
            }


            const booking =
                bookings.find(
                    item =>
                        item.id ===
                        statusBookingId
                );


            if (!booking) {
                return;
            }


            if (
                selectedBookingStatus ===
                booking.bookingStatus
            ) {

                closeBookingStatusSelector();

                return;

            }


            const originalContent =
                saveBookingStatusChange.innerHTML;


            saveBookingStatusChange.disabled =
                true;


            saveBookingStatusChange.innerHTML = `
                <span class="save-loading-spinner"></span>
                Updating...
            `;


            try {

                await updateDoc(
                    doc(
                        db,
                        "bookings",
                        statusBookingId
                    ),
                    {

                        bookingStatus:
                            selectedBookingStatus,

                        updatedAt:
                            new Date().toISOString()

                    }
                );


                closeBookingStatusSelector();


                await loadBookings();


            } catch (error) {

                console.error(
                    "BOOKING STATUS UPDATE ERROR:",
                    error
                );


                alert(
                    "Unable to update booking status."
                );


            } finally {

                saveBookingStatusChange.innerHTML =
                    originalContent;

            }

        }
    );


// ==================================================
// GLOBAL ACTION MENU CLICK
// ==================================================

document.addEventListener(
    "click",
    event => {

        const moreButton =
            event.target.closest(
                ".booking-action-more"
            );


        if (moreButton) {

            event.preventDefault();

            event.stopPropagation();


            openBookingActionMenu(
                moreButton,
                moreButton.dataset.id
            );


            return;

        }


        if (
            !event.target.closest(
                ".booking-action-menu"
            )
        ) {

            closeBookingActionMenus();

        }

    }
);


// ==================================================
// CLOSE MENU ON SCROLL / RESIZE
// ==================================================

window.addEventListener(
    "scroll",
    closeBookingActionMenus,
    true
);


window.addEventListener(
    "resize",
    closeBookingActionMenus
);

// ==================================================
// GENERATE UNIQUE BOOKING REFERENCE
// Firestore transaction counter
//
// Example:
// TW-2026-000001
// TW-2026-000002
// TW-2026-000003
// ==================================================

async function generateBookingReference() {

    const year =
        new Date().getFullYear();


    const counterRef =
        doc(
            db,
            "systemCounters",
            `bookings-${year}`
        );


    const nextNumber =
        await runTransaction(
            db,
            async transaction => {

                const counterSnapshot =
                    await transaction.get(
                        counterRef
                    );


                let currentNumber =
                    0;


                if (
                    counterSnapshot.exists()
                ) {

                    currentNumber =
                        Number(
                            counterSnapshot.data()
                                .lastNumber
                        ) || 0;

                }


                // ==========================================
                // IMPORTANT:
                // Check existing bookings too.
                // This prevents counter reset from
                // creating an already-used reference.
                // ==========================================

                const highestExistingNumber =
                    bookings.reduce(
                        (
                            highest,
                            booking
                        ) => {

                            const reference =
                                booking.bookingReference ||
                                "";


                            const match =
                                reference.match(
                                    new RegExp(
                                        `^TW-${year}-(\\d{6})$`
                                    )
                                );


                            if (!match) {

                                return highest;

                            }


                            const number =
                                Number(
                                    match[1]
                                ) || 0;


                            return Math.max(
                                highest,
                                number
                            );

                        },
                        0
                    );


                const safeCurrentNumber =
                    Math.max(
                        currentNumber,
                        highestExistingNumber
                    );


                const newNumber =
                    safeCurrentNumber + 1;


                transaction.set(
                    counterRef,
                    {

                        year:
                            year,

                        lastNumber:
                            newNumber,

                        updatedAt:
                            new Date()
                                .toISOString()

                    },
                    {
                        merge:
                            true
                    }
                );


                return newNumber;

            }
        );


    return `TW-${year}-${String(
        nextNumber
    ).padStart(
        6,
        "0"
    )}`;

}

        // ==================================================
        // SAVE BOOKING
        // ==================================================

        bookingForm?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


        // ==================================================
        // PREVENT DOUBLE SAVE
        // ==================================================

                if (
                    saveBookingBtn?.disabled
                ) {
                    return;
                }

        // ==================================================
// CUSTOMER CONTACT VALIDATION
// ==================================================

const customerContactValue =
    String(
        customerContact?.value ||
        ""
    ).trim();


const customerEmailValue =
    String(
        customerEmail?.value ||
        ""
    ).trim();


// ==================================================
// CONTACT NUMBER REQUIRED
// ==================================================

if (
    !customerContactValue
) {

    alert(
        "Please enter the customer's contact number."
    );

    customerContact?.focus();

    return;

}


// ==================================================
// PH MOBILE NUMBER VALIDATION
// Format: 09XXXXXXXXX
// ==================================================

if (
    !/^09\d{9}$/.test(
        customerContactValue
    )
) {

    alert(
        "Please enter a valid 11-digit Philippine mobile number."
    );

    customerContact?.focus();

    return;

}


// ==================================================
// EMAIL REQUIRED
// ==================================================

if (
    !customerEmailValue
) {

    alert(
        "Please enter the customer's email address."
    );

    customerEmail?.focus();

    return;

}


// ==================================================
// EMAIL FORMAT VALIDATION
// ==================================================

const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


if (
    !emailPattern.test(
        customerEmailValue
    )
) {

    alert(
        "Please enter a valid email address."
    );

    customerEmail?.focus();

    return;

}


        // ==================================================
        // SELECTED PACKAGE
        // ==================================================

                const selectedPackage =
                    getPackageById(
                        bookingPackage?.value
                    );


                // ==================================================
                // REQUIRED FIELD VALIDATION
                // ==================================================

                if (
                    !customerName?.value
                        ?.trim()
                ) {

                    alert(
                        "Please enter the customer name."
                    );


                    customerName?.focus();


                    return;

                }


                if (
                    !customerContact?.value
                        ?.trim()
                ) {

                    alert(
                        "Please enter the customer contact number."
                    );


                    customerContact?.focus();


                    return;

                }


                if (
                    !selectedPackage
                ) {

                    alert(
                        "Please select a tour package."
                    );


                    bookingPackage?.focus();


                    return;

                }


                if (
                    !travelDate?.value
                ) {

                    alert(
                        "Please select the travel start date."
                    );


                    travelDate?.focus();


                    return;

                }


                // ==================================================
                // GUEST COUNT
                // ==================================================

                const guests =
                    Math.max(
                        1,
                        normalizeNumber(
                            numberOfGuests?.value
                        )
                    );


                if (
                    guests < 1
                ) {

                    alert(
                        "Number of guests must be at least 1."
                    );


                    numberOfGuests?.focus();


                    return;

                }


                // ==================================================
                // DURATION
                // ==================================================

                const durationValue =
                    selectedPackage.duration ||
                    "";


                // ==================================================
                // TRAVEL START / END
                // ==================================================

                const travelStartDate =
                    travelDate.value;


                const travelEndDate =
                    calculateTravelEndDate(
                        travelStartDate,
                        durationValue
                    );


                // ==================================================
                // SELECTED ACCOMMODATION
                // ==================================================

                let selectedAccommodation =
                    null;


                let selectedAccommodationIndex =
                    "";


                if (
                    accommodation?.value !==
                    ""
                ) {

                    selectedAccommodationIndex =
                        accommodation.value;


                    selectedAccommodation =
                        selectedPackage
                            .accommodations?.[
                                Number(
                                    accommodation.value
                                )
                            ] ||
                        null;

                }

                                // ==================================================
                // ACCOMMODATION PRICE SNAPSHOT
                // ==================================================

                const accommodationRate =
                    selectedAccommodation
                        ? normalizeNumber(
                            selectedAccommodation.price
                        )
                        : 0;


                const accommodationPriceType =
                    selectedAccommodation
                        ? (
                            selectedAccommodation.priceType ||
                            (
                                selectedAccommodation.type ===
                                    "additional"
                                    ? "per_night"
                                    : "included"
                            )
                        )
                        : "included";


                const accommodationNights =
                    Math.max(
                        0,
                        getDurationDays(
                            durationValue
                        ) - 1
                    );


                let accommodationTotal =
                    0;


                if (
                    selectedAccommodation &&
                    selectedAccommodation.type ===
                        "additional"
                ) {

                    if (
                        accommodationPriceType ===
                        "per_night"
                    ) {

                        accommodationTotal =
                            accommodationRate *
                            accommodationNights;

                    }

                    else if (
                        accommodationPriceType ===
                        "per_person_night"
                    ) {

                        accommodationTotal =
                            accommodationRate *
                            guests *
                            accommodationNights;

                    }

                    else if (
                        accommodationPriceType ===
                        "flat_rate"
                    ) {

                        accommodationTotal =
                            accommodationRate;

                    }

                }


                // ==================================================
// PAYMENT VALUES
// ==================================================

const finalTotalAmount =
    Math.max(
        0,
        normalizeNumber(
            totalAmount?.value
        )
    );


const finalAmountPaid =
    Math.max(
        0,
        normalizeNumber(
            amountPaid?.value
        )
    );


const finalRemainingBalance =
    Math.max(
        0,
        finalTotalAmount -
        finalAmountPaid
    );


// ==================================================
// FINAL PAYMENT STATUS
// ==================================================

let finalPaymentStatus =
    "unpaid";


if (
    finalTotalAmount > 0 &&
    finalAmountPaid >=
        finalTotalAmount
) {

    finalPaymentStatus =
        "paid";

} else if (
    finalAmountPaid > 0
) {

    finalPaymentStatus =
        "partial";

}


if (
    remainingBalance
) {

    remainingBalance.value =
        finalRemainingBalance;

}


if (
    paymentStatus
) {

    paymentStatus.value =
        finalPaymentStatus;

}
                // ==================================================
                // BOOKING DATA
                // ==================================================

                const bookingData = {

                    // ----------------------------------------------
                    // CUSTOMER
                    // ----------------------------------------------

                    customerName:
                        customerName.value
                            .trim(),

                    customerContact:
                        customerContact.value
                            .trim(),

                    customerEmail:
                        customerEmail?.value
                            ?.trim() ||
                        "",

                    customerFb:
                        customerFb?.value
                            ?.trim() ||
                        "",


                    // ----------------------------------------------
                    // PACKAGE SNAPSHOT
                    // ----------------------------------------------

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

                    packageDuration:
                        durationValue,

                    duration:
                        durationValue,

                    packagePrice:
                        normalizeNumber(
                            selectedPackage.price
                        ),


                    // ----------------------------------------------
                    // TRAVEL DATES
                    // ----------------------------------------------

                    travelStartDate:
                        travelStartDate,

                    travelEndDate:
                        travelEndDate,

                    /*
                     * Legacy compatibility.
                     * Older code may still read travelDate.
                     */

                    travelDate:
                        travelStartDate,


                    // ----------------------------------------------
                    // TOUR DETAILS
                    // ----------------------------------------------

                    numberOfGuests:
                        guests,

                    pickupPoint:
                        pickupPoint?.value ||
                        "",

                    specialRequest:
                        specialRequest?.value
                            ?.trim() ||
                        "",


                    // ----------------------------------------------
                    // ACCOMMODATION SNAPSHOT
                    // ----------------------------------------------

                    accommodationPrice:
                        accommodationRate,

                    accommodationPriceType:
                        accommodationPriceType,

                    accommodationNights:
                        accommodationNights,

                    accommodationTotal:
                        accommodationTotal,

                    accommodationCapacity:
                        selectedAccommodation
                            ?.capacity ||
                        "",

                    accommodationPhoto:
                        selectedAccommodation
                            ?.photo ||
                        "",


                    // ----------------------------------------------
                    // PAYMENT
                    // ----------------------------------------------

                    totalAmount:
                        finalTotalAmount,

                    amountPaid:
                        finalAmountPaid,

                    remainingBalance:
                        finalRemainingBalance,

                    paymentStatus:
                        finalPaymentStatus,


                    // ----------------------------------------------
                    // MANAGEMENT
                    // ----------------------------------------------

                    bookingStatus:
                        bookingStatus?.value ||
                        "pending",

                    bookingSource:
                        bookingSource?.value ||
                        "facebook",

                    internalNotes:
                        internalNotes?.value
                            ?.trim() ||
                        "",


                    // ----------------------------------------------
                    // TIMESTAMP
                    // ----------------------------------------------

                    updatedAt:
                        new Date()
                            .toISOString()

                };


                // ==================================================
                // SAVE BUTTON LOADING
                // ==================================================

                const originalButtonContent =
                    saveBookingBtn
                        ?.innerHTML ||
                    "Save Booking";


                if (
                    saveBookingBtn
                ) {

                    saveBookingBtn.disabled =
                        true;


                    saveBookingBtn.innerHTML = `

                        <span
                            class="save-loading-spinner"
                        ></span>

                        Saving...

                    `;

                }


                try {

                    // ==================================================
                    // UPDATE EXISTING BOOKING
                    // ==================================================

                    if (
                        editingBookingId
                    ) {

                        const existingBooking =
                            bookings.find(
                                item =>
                                    item.id ===
                                    editingBookingId
                            );


                        if (
                            !existingBooking
                        ) {

                            throw new Error(
                                "Existing booking could not be found."
                            );

                        }


                        const firestoreBookingRef =
                            doc(
                                db,
                                "bookings",
                                editingBookingId
                            );


                        await updateDoc(
    firestoreBookingRef,
    {

        ...bookingData,

        bookingReference:
            existingBooking.bookingReference &&
            !existingBooking.bookingReference.includes("NaN")
                ? existingBooking.bookingReference
                : existingBooking.displayReference,

        createdAt:
            existingBooking.createdAt ||
            new Date().toISOString()

    }
);


                        console.log(
                            "BOOKING UPDATED:",
                            {
                                id:
                                    editingBookingId,

                                reference:
                                    existingBooking
                                        .bookingReference ||
                                    existingBooking
                                        .displayReference,

                                travelStartDate:
                                    travelStartDate,

                                travelEndDate:
                                    travelEndDate,

                                duration:
                                    durationValue
                            }
                        );


                        alert(
                            "Booking updated successfully!"
                        );

                    }


                    // ==================================================
                    // CREATE NEW BOOKING
                    // ==================================================

                    else {

                        const bookingReference =
    await generateBookingReference();


                        const createdAt =
                            new Date()
                                .toISOString();


                        const newBookingData = {

                            ...bookingData,

                            bookingReference:
                                bookingReference,

                            createdAt:
                                createdAt

                        };


                        const newBookingRef =
                            await addDoc(
                                collection(
                                    db,
                                    "bookings"
                                ),
                                newBookingData
                            );


                        console.log(
                            "NEW BOOKING CREATED:",
                            {

                                id:
                                    newBookingRef.id,

                                reference:
                                    bookingReference,

                                package:
                                    selectedPackage.name,

                                duration:
                                    durationValue,

                                travelStartDate:
                                    travelStartDate,

                                travelEndDate:
                                    travelEndDate,

                                travelDisplay:
                                    formatTravelDateRange(
                                        travelStartDate,
                                        travelEndDate
                                    )

                            }
                        );


                        alert(
                            `Booking created successfully!\n\nBooking Reference: ${bookingReference}`
                        );

                    }


                    // ==================================================
                    // RESET STATE
                    // ==================================================

                    editingBookingId =
                        null;


                    // ==================================================
                    // CLOSE MODAL
                    // ==================================================

                    closeBookingModalPanel();


                    // ==================================================
                    // RELOAD
                    // ==================================================

                    await loadBookings();


                } catch (error) {

                    console.error(
                        "BOOKING SAVE ERROR:",
                        error
                    );


                    if (
                        !navigator.onLine
                    ) {

                        alert(
                            "No internet connection. Please check your connection and try again."
                        );

                    } else {

                        alert(
                            "Unable to save booking. Please try again."
                        );

                    }

                } finally {

                    // ==================================================
                    // RESTORE SAVE BUTTON
                    // ==================================================

                    if (
                        saveBookingBtn
                    ) {

                        saveBookingBtn.disabled =
                            false;


                        saveBookingBtn.innerHTML =
                            originalButtonContent;

                    }

                }

            }
        );


        // ==================================================
        // INITIAL LOAD
        // ==================================================

        loadBookings();


    }
);