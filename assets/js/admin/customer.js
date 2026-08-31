/* =========================================================
   TWTMS v2
   TRIPS WONDER - CUSTOMERS MODULE
   =========================================================
   FILE:
   assets/js/admin/customers.js

   RESPONSIBILITIES:
   - Load customers from Firestore
   - Build customers automatically from bookings
   - Merge manual + booking customers
   - Add customer
   - Edit customer
   - Delete manual customer
   - Search / filter / sort
   - Customer statistics
   - Booking count
   - Total spent
   - Last trip
   ========================================================= */

"use strict";


/* =========================================================
   FIRESTORE IMPORTS
   ========================================================= */

import {

    db,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc

} from "../firebase/firebase-db.js";

import {
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* =========================================================
   MODULE START
   ========================================================= */

console.log(
    "TWTMS CUSTOMERS MODULE LOADING..."
);


document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =====================================================
           STATE
           ===================================================== */

        let customers = [];

        let manualCustomers = [];

        let bookings = [];

        let payments = [];

        let editingCustomerId = null;


        /* =====================================================
           SUMMARY ELEMENTS
           ===================================================== */

        const totalCustomersElement =
            document.getElementById(
                "totalCustomers"
            );

        const activeCustomersElement =
            document.getElementById(
                "activeCustomers"
            );

        const newCustomersElement =
            document.getElementById(
                "newCustomers"
            );

        const repeatCustomersElement =
            document.getElementById(
                "repeatCustomers"
            );


        /* =====================================================
           FILTER ELEMENTS
           ===================================================== */

        const customerSearch =
            document.getElementById(
                "customerSearch"
            );

        const customerStatusFilter =
    document.getElementById(
        "statusFilter"
    );

        const customerTypeFilter =
            document.getElementById(
                "customerTypeFilter"
            );

        const customerSort =
    document.getElementById(
        "sortCustomers"
    );

        const refreshCustomers =
            document.getElementById(
                "refreshCustomers"
            );

        const customerResultText =
            document.getElementById(
                "customerResultText"
            );


        /* =====================================================
           TABLE ELEMENTS
           ===================================================== */

        const customersTableBody =
            document.getElementById(
                "customersTableBody"
            );

        const emptyCustomers =
            document.getElementById(
                "emptyCustomers"
            );


        /* =====================================================
           CUSTOMER QR SCANNER ELEMENTS
           ===================================================== */

        const scanCustomerQrButton =
            document.getElementById(
                "scanCustomerQrButton"
            );

        const customerQrScannerModal =
            document.getElementById(
                "customerQrScannerModal"
            );

        const closeCustomerQrScanner =
            document.getElementById(
                "closeCustomerQrScanner"
            );

        const customerQrVideo =
            document.getElementById(
                "customerQrVideo"
            );

        const customerQrStatus =
            document.getElementById(
                "customerQrStatus"
            );

        const retryCustomerQrScanner =
            document.getElementById(
                "retryCustomerQrScanner"
            );

        const customerQrImageInput =
            document.getElementById(
                "customerQrImageInput"
            );

        const customerQrManualInput =
            document.getElementById(
                "customerQrManualInput"
            );

        const customerQrManualButton =
            document.getElementById(
                "customerQrManualButton"
            );

        let customerQrStream =
            null;

        let customerQrDetector =
            null;

        const customerQrCanvas =
            document.createElement(
                "canvas"
            );

        const customerQrCanvasContext =
            customerQrCanvas.getContext(
                "2d",
                {
                    willReadFrequently:
                        true
                }
            );

        let customerQrScannerMode =
            "";

        let customerQrScanFrame =
            null;

        let customerQrProcessing =
            false;


        /* =====================================================
           MODAL ELEMENTS
           ===================================================== */

        const customerModal =
            document.getElementById(
                "customerModal"
            );

        const customerModalBackdrop =
            document.getElementById(
                "customerModalBackdrop"
            );

        const customerModalTitle =
            document.getElementById(
                "customerModalTitle"
            );

        const customerModalDescription =
            document.getElementById(
                "customerModalDescription"
            );

        const addCustomerButton =
            document.getElementById(
                "addCustomerButton"
            );

        const closeCustomerModal =
            document.getElementById(
                "closeCustomerModal"
            );

        const cancelCustomerButton =
            document.getElementById(
                "cancelCustomerButton"
            );

        const customerForm =
            document.getElementById(
                "customerForm"
            );

        const saveCustomerButton =
            document.getElementById(
                "saveCustomerButton"
            );


        /* =====================================================
           CUSTOMER PROFILE MODAL ELEMENTS
           ===================================================== */

        const customerProfileModal =
            document.getElementById(
                "customerProfileModal"
            );

        const closeCustomerProfileModal =
            document.getElementById(
                "closeCustomerProfileModal"
            );

        const customerProfileAvatar =
            document.getElementById(
                "customerProfileAvatar"
            );

        const customerProfileName =
            document.getElementById(
                "customerProfileName"
            );

        const customerProfileSubtitle =
            document.getElementById(
                "customerProfileSubtitle"
            );

        const customerProfileContact =
            document.getElementById(
                "customerProfileContact"
            );

        const customerProfileEmail =
            document.getElementById(
                "customerProfileEmail"
            );

        const customerProfileFacebook =
            document.getElementById(
                "customerProfileFacebook"
            );

        const customerProfileStatus =
            document.getElementById(
                "customerProfileStatus"
            );

        const customerProfileBookings =
            document.getElementById(
                "customerProfileBookings"
            );

        const customerProfileSpent =
            document.getElementById(
                "customerProfileSpent"
            );

        const customerProfileLastTrip =
            document.getElementById(
                "customerProfileLastTrip"
            );

        const customerProfileBookingHistory =
            document.getElementById(
                "customerProfileBookingHistory"
            );

        const customerProfileNotesWrap =
            document.getElementById(
                "customerProfileNotesWrap"
            );

        const customerProfileNotes =
            document.getElementById(
                "customerProfileNotes"
            );


        /* =====================================================
           FORM ELEMENTS
           ===================================================== */

        const customerId =
            document.getElementById(
                "customerId"
            );

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

        const customerFacebook =
            document.getElementById(
                "customerFacebook"
            );

        const customerType =
            document.getElementById(
                "customerType"
            );

        const customerStatus =
            document.getElementById(
                "customerStatus"
            );

        const customerNotes =
            document.getElementById(
                "customerNotes"
            );


        /* =====================================================
           BASIC HELPERS
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
                    .substring(
                        0,
                        2
                    )
                    .toUpperCase();

            }


            return (
                words[0][0] +
                words[
                    words.length - 1
                ][0]
            ).toUpperCase();

        }


        function getDateObject(value) {

            if (!value) {

                return null;

            }


            try {

                if (
                    typeof value.toDate ===
                    "function"
                ) {

                    return value.toDate();

                }


                if (
                    value instanceof Date
                ) {

                    return value;

                }


                if (
                    typeof value === "object" &&
                    value.seconds !== undefined
                ) {

                    return new Date(
                        Number(
                            value.seconds
                        ) * 1000
                    );

                }


                const date =
                    new Date(value);


                if (
                    Number.isNaN(
                        date.getTime()
                    )
                ) {

                    return null;

                }


                return date;

            } catch (error) {

                return null;

            }

        }


        function getTimestamp(value) {

            const date =
                getDateObject(value);


            return date
                ? date.getTime()
                : 0;

        }


        function formatDate(value) {

            const date =
                getDateObject(value);


            if (!date) {

                return "—";

            }


            return date.toLocaleDateString(
                "en-PH",
                {
                    year: "numeric",
                    month: "short",
                    day: "numeric"
                }
            );

        }


        /* =====================================================
           CUSTOMER MATCH KEY
           ===================================================== */

        function getCustomerKey(data) {

            const contact =
                normalizeText(
                    data.customerContact ||
                    data.contact ||
                    data.phone
                );


            const email =
                normalizeText(
                    data.customerEmail ||
                    data.email
                );


            const facebook =
                normalizeText(
                    data.customerFb ||
                    data.customerFacebook ||
                    data.facebook
                );


            const name =
                normalizeText(
                    data.customerName ||
                    data.name
                );


            /*
             * Priority:
             *
             * 1. Contact
             * 2. Email
             * 3. Facebook
             * 4. Name
             */

            if (contact) {

                return `contact:${contact}`;

            }


            if (email) {

                return `email:${email}`;

            }


            if (facebook) {

                return `facebook:${facebook}`;

            }


            return `name:${name}`;

        }


        /* =====================================================
           NORMALIZE MANUAL CUSTOMER
           ===================================================== */

        function normalizeManualCustomer(
            documentSnapshot
        ) {

            const data =
                documentSnapshot.data();


            return {

                id:
                    documentSnapshot.id,

                source:
                    "manual",

                name:
                    data.name ||
                    data.customerName ||
                    "",

                contact:
                    data.contact ||
                    data.customerContact ||
                    "",

                email:
                    data.email ||
                    data.customerEmail ||
                    "",

                facebook:
                    data.facebook ||
                    data.customerFacebook ||
                    data.customerFb ||
                    "",

                type:
                    data.type ||
                    data.customerType ||
                    "new",

                status:
                    data.status ||
                    data.customerStatus ||
                    "active",

                notes:
                    data.notes ||
                    data.customerNotes ||
                    "",

                createdAt:
                    data.createdAt ||
                    "",

                updatedAt:
                    data.updatedAt ||
                    "",

                bookingCount:
                    0,

                totalSpent:
                    0,

                lastTrip:
                    "",

                bookingIds:
                    []

            };

        }


        /* =====================================================
           NORMALIZE BOOKING
           ===================================================== */

        function normalizeBooking(
            documentSnapshot
        ) {

            const data =
                documentSnapshot.data();


            return {

                id:
                    documentSnapshot.id,

                customerName:
                    data.customerName ||
                    "",

                customerContact:
                    data.customerContact ||
                    "",

                customerEmail:
                    data.customerEmail ||
                    "",

                customerFacebook:
                    data.customerFb ||
                    data.customerFacebook ||
                    "",

                packageName:
                    data.packageName ||
                    data.bookingPackage ||
                    "",

                travelDate:
                    data.travelStartDate ||
                    data.travelDate ||
                    "",

                travelEndDate:
                    data.travelEndDate ||
                    "",

                duration:
                    data.packageDuration ||
                    data.duration ||
                    "",

                accommodationName:
                    data.accommodationName ||
                    data.accommodation ||
                    data.roomType ||
                    data.selectedAccommodation ||
                    "",

                totalAmount:
                    normalizeNumber(
                        data.totalAmount
                    ),

                amountPaid:
                    normalizeNumber(
                        data.amountPaid
                    ),

                remainingBalance:
                    normalizeNumber(
                        data.remainingBalance
                    ),

                bookingReference:
                    data.bookingReference ||
                    data.displayReference ||
                    "",

                bookingStatus:
                    data.bookingStatus ||
                    "pending",

                paymentStatus:
                    data.paymentStatus ||
                    "unpaid",

                createdAt:
                    data.createdAt ||
                    "",

                updatedAt:
                    data.updatedAt ||
                    ""

            };

        }


        /* =====================================================
           LOAD MANUAL CUSTOMERS
           ===================================================== */

        async function loadManualCustomers() {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "customers"
                    )
                );


            manualCustomers =
                snapshot.docs.map(
                    normalizeManualCustomer
                );

        }


        /* =====================================================
           LOAD BOOKINGS
           ===================================================== */

        async function loadBookings() {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "bookings"
                    )
                );


            bookings =
                snapshot.docs.map(
                    normalizeBooking
                );

        }

                /* =====================================================
           NORMALIZE PAYMENT
           ===================================================== */

        function normalizePayment(
            documentSnapshot
        ) {

            const data =
                documentSnapshot.data();


            return {

                id:
                    documentSnapshot.id,

                bookingId:
                    data.bookingId ||
                    data.bookingDocumentId ||
                    "",

                bookingReference:
                    data.bookingReference ||
                    "",

                amount:
                    normalizeNumber(
                        data.amount ||
                        data.paymentAmount
                    ),

                status:
                    normalizeText(
                        data.status ||
                        data.paymentStatus ||
                        "pending"
                    ),

                paymentDate:
                    data.paymentDate ||
                    data.createdAt ||
                    "",

                createdAt:
                    data.createdAt ||
                    ""

            };

        }


        /* =====================================================
           LOAD PAYMENTS
           ===================================================== */

        async function loadPayments() {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "payments"
                    )
                );


            payments =
                snapshot.docs.map(
                    normalizePayment
                );

        }


        /* =====================================================
           EFFECTIVE PAYMENT AMOUNT
           ===================================================== */

        function getEffectivePaymentAmount(
            payment
        ) {

            if (!payment) {
                return 0;
            }


            const status =
                normalizeText(
                    payment.status
                );


            /*
             * Keep this consistent with the Payments module:
             * only collected money counts toward Total Spent.
             */
            if (
                status === "paid" ||
                status === "partial"
            ) {

                return normalizeNumber(
                    payment.amount
                );

            }


            return 0;

        }


        /* =====================================================
           BOOKING COLLECTED AMOUNT
           ===================================================== */

        function getBookingCollectedAmount(
            booking
        ) {

            if (!booking) {
                return 0;
            }


            const bookingPayments =
                payments.filter(
                    payment =>
                        payment.bookingId ===
                        booking.id
                );


            /*
             * If payment documents exist for this booking,
             * they are the source of truth. This avoids
             * double-counting booking.amountPaid, which the
             * Payments module also updates.
             */
            if (
                bookingPayments.length
            ) {

                return bookingPayments.reduce(
                    (
                        total,
                        payment
                    ) =>
                        total +
                        getEffectivePaymentAmount(
                            payment
                        ),
                    0
                );

            }


            /*
             * Legacy / older booking fallback:
             * use the booking snapshot when no payment docs
             * exist yet.
             */
            return normalizeNumber(
                booking.amountPaid
            );

        }


        /* =====================================================
           BUILD CUSTOMERS FROM BOOKINGS
           ===================================================== */

        function buildBookingCustomers() {

            const customerMap =
                new Map();


            bookings.forEach(
                booking => {

                    const key =
                        getCustomerKey({
                            customerName:
                                booking.customerName,
                            customerContact:
                                booking.customerContact,
                            customerEmail:
                                booking.customerEmail,
                            customerFacebook:
                                booking.customerFacebook
                        });


                    if (
                        !key ||
                        key === "name:"
                    ) {

                        return;

                    }


                    if (
                        !customerMap.has(key)
                    ) {

                        customerMap.set(
                            key,
                            {

                                id:
                                    `booking-${booking.id}`,

                                source:
                                    "booking",

                                name:
                                    booking.customerName,

                                contact:
                                    booking.customerContact,

                                email:
                                    booking.customerEmail,

                                facebook:
                                    booking.customerFacebook,

                                type:
                                    "new",

                                status:
                                    "active",

                                notes:
                                    "",

                                createdAt:
                                    booking.createdAt,

                                updatedAt:
                                    booking.updatedAt,

                                bookingCount:
                                    0,

                                totalSpent:
                                    0,

                                lastTrip:
                                    "",

                                bookingIds:
                                    []

                            }
                        );

                    }


                    const customer =
                        customerMap.get(key);


                    customer.bookingCount +=
                        1;


                    customer.totalSpent +=
                        getBookingCollectedAmount(
                            booking
                        );


                    customer.bookingIds.push(
                        booking.id
                    );


                    const currentLastTrip =
                        getTimestamp(
                            customer.lastTrip
                        );


                    const bookingTrip =
                        getTimestamp(
                            booking.travelDate
                        );


                    if (
                        bookingTrip >
                        currentLastTrip
                    ) {

                        customer.lastTrip =
                            booking.travelDate;

                    }


                    if (
                        getTimestamp(
                            booking.createdAt
                        ) >
                        getTimestamp(
                            customer.createdAt
                        )
                    ) {

                        customer.createdAt =
                            booking.createdAt;

                    }

                }
            );


            return Array.from(
                customerMap.values()
            ).map(
                customer => {

                    customer.type =
                        customer.bookingCount > 1
                            ? "repeat"
                            : "new";


                    return customer;

                }
            );

        }


        /* =====================================================
           MERGE MANUAL + BOOKING CUSTOMERS
           ===================================================== */

        function mergeCustomers() {

            const bookingCustomers =
                buildBookingCustomers();


            const mergedMap =
                new Map();


            /*
             * FIRST:
             * Add booking-generated customers.
             */

            bookingCustomers.forEach(
                customer => {

                    const key =
                        getCustomerKey({
                            customerName:
                                customer.name,
                            customerContact:
                                customer.contact,
                            customerEmail:
                                customer.email,
                            customerFacebook:
                                customer.facebook
                        });


                    mergedMap.set(
                        key,
                        {
                            ...customer
                        }
                    );

                }
            );


            /*
             * SECOND:
             * Manual customers override editable
             * profile fields but keep booking totals.
             */

            manualCustomers.forEach(
                manualCustomer => {

                    const key =
                        getCustomerKey({
                            customerName:
                                manualCustomer.name,
                            customerContact:
                                manualCustomer.contact,
                            customerEmail:
                                manualCustomer.email,
                            customerFacebook:
                                manualCustomer.facebook
                        });


                    const existing =
                        mergedMap.get(key);


                    if (
                        existing
                    ) {

                        mergedMap.set(
                            key,
                            {

                                ...existing,

                                id:
                                    manualCustomer.id,

                                source:
                                    "manual",

                                name:
                                    manualCustomer.name ||
                                    existing.name,

                                contact:
                                    manualCustomer.contact ||
                                    existing.contact,

                                email:
                                    manualCustomer.email ||
                                    existing.email,

                                facebook:
                                    manualCustomer.facebook ||
                                    existing.facebook,

                                status:
                                    manualCustomer.status ||
                                    existing.status,

                                notes:
                                    manualCustomer.notes ||
                                    "",

                                createdAt:
                                    manualCustomer.createdAt ||
                                    existing.createdAt,

                                updatedAt:
                                    manualCustomer.updatedAt ||
                                    existing.updatedAt,

                                /*
                                 * Type should follow
                                 * booking count when available.
                                 */

                                type:
                                    existing.bookingCount > 1
                                        ? "repeat"
                                        : (
                                            manualCustomer.type ||
                                            "new"
                                        )

                            }
                        );

                    } else {

                        mergedMap.set(
                            key,
                            {
                                ...manualCustomer
                            }
                        );

                    }

                }
            );


            customers =
                Array.from(
                    mergedMap.values()
                );

        }


        /* =====================================================
           LOAD ALL CUSTOMERS
           ===================================================== */

        async function loadCustomers() {

            try {

                if (
                    refreshCustomers
                ) {

                    refreshCustomers.disabled =
                        true;

                    refreshCustomers.classList.add(
                        "loading"
                    );

                }


                await Promise.all([
                    loadManualCustomers(),
                    loadBookings(),
                    loadPayments()
                ]);


                mergeCustomers();


                console.log(
                    "CUSTOMERS LOADED:",
                    customers
                );


                updateCustomerSummary();

                renderCustomers();


            } catch (error) {

                console.error(
                    "CUSTOMERS LOAD ERROR:",
                    error
                );


                customers = [];

                renderCustomers();

                updateCustomerSummary();


            } finally {

                if (
                    refreshCustomers
                ) {

                    refreshCustomers.disabled =
                        false;

                    refreshCustomers.classList.remove(
                        "loading"
                    );

                }

            }

        }


        /* =====================================================
           EXPOSE LOAD FUNCTION
           ===================================================== */

        window.loadCustomers =
            loadCustomers;


        /* =====================================================
           CUSTOMER SUMMARY
           ===================================================== */

        function updateCustomerSummary() {

            const total =
                customers.length;


            const active =
                customers.filter(
                    customer =>
                        normalizeText(
                            customer.status
                        ) ===
                        "active"
                ).length;


            const newCount =
                customers.filter(
                    customer =>
                        normalizeText(
                            customer.type
                        ) ===
                        "new"
                ).length;


            const repeat =
                customers.filter(
                    customer =>
                        normalizeText(
                            customer.type
                        ) ===
                        "repeat"
                ).length;


            if (
                totalCustomersElement
            ) {

                totalCustomersElement.textContent =
                    total.toLocaleString(
                        "en-PH"
                    );

            }


            if (
                activeCustomersElement
            ) {

                activeCustomersElement.textContent =
                    active.toLocaleString(
                        "en-PH"
                    );

            }


            if (
                newCustomersElement
            ) {

                newCustomersElement.textContent =
                    newCount.toLocaleString(
                        "en-PH"
                    );

            }


            if (
                repeatCustomersElement
            ) {

                repeatCustomersElement.textContent =
                    repeat.toLocaleString(
                        "en-PH"
                    );

            }

        }


        /* =====================================================
           FILTER CUSTOMERS
           ===================================================== */

        function getFilteredCustomers() {

            const searchValue =
                normalizeText(
                    customerSearch?.value
                );


            const statusValue =
                normalizeText(
                    customerStatusFilter?.value ||
                    "all"
                );


            const typeValue =
                normalizeText(
                    customerTypeFilter?.value ||
                    "all"
                );


            const sortValue =
                customerSort?.value ||
                "newest";


            let filtered =
                customers.filter(
                    customer => {

                        const searchableText = [
                            customer.name,
                            customer.contact,
                            customer.email,
                            customer.facebook
                        ]
                            .join(" ")
                            .toLowerCase();


                        const matchesSearch =
                            !searchValue ||
                            searchableText.includes(
                                searchValue
                            );


                        const matchesStatus =
                            statusValue ===
                            "all" ||
                            normalizeText(
                                customer.status
                            ) ===
                            statusValue;


                        const matchesType =
                            typeValue ===
                            "all" ||
                            normalizeText(
                                customer.type
                            ) ===
                            typeValue;


                        return (
                            matchesSearch &&
                            matchesStatus &&
                            matchesType
                        );

                    }
                );


            /* =================================================
               SORT
               ================================================= */

            filtered.sort(
                (
                    a,
                    b
                ) => {

                    switch (
                        sortValue
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


                        case "name-asc":

                            return String(
                                a.name ||
                                ""
                            ).localeCompare(
                                String(
                                    b.name ||
                                    ""
                                ),
                                "en"
                            );


                        case "name-desc":

                            return String(
                                b.name ||
                                ""
                            ).localeCompare(
                                String(
                                    a.name ||
                                    ""
                                ),
                                "en"
                            );


                        case "spent-high":

                            return (
                                normalizeNumber(
                                    b.totalSpent
                                ) -
                                normalizeNumber(
                                    a.totalSpent
                                )
                            );


                        case "spent-low":

                            return (
                                normalizeNumber(
                                    a.totalSpent
                                ) -
                                normalizeNumber(
                                    b.totalSpent
                                )
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


            return filtered;

        }


        /* =====================================================
           RENDER CUSTOMER TABLE
           ===================================================== */

        function renderCustomers() {

            if (
                !customersTableBody
            ) {

                console.warn(
                    "CUSTOMERS: #customersTableBody not found."
                );

                return;

            }


            const filteredCustomers =
                getFilteredCustomers();


            customersTableBody.innerHTML =
                "";


            if (
                filteredCustomers.length ===
                0
            ) {

                if (
                    emptyCustomers
                ) {

                    emptyCustomers.style.display =
                        "flex";

                }


                if (
                    customerResultText
                ) {

                    customerResultText.textContent =
                        "No customers found";

                }


                return;

            }


            if (
                emptyCustomers
            ) {

                emptyCustomers.style.display =
                    "none";

            }


            if (
                customerResultText
            ) {

                customerResultText.textContent =
                    `Showing ${filteredCustomers.length} of ${customers.length} customers`;

            }


            filteredCustomers.forEach(
                customer => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    const status =
                        normalizeText(
                            customer.status
                        ) ===
                        "inactive"
                            ? "inactive"
                            : "active";


                    const statusLabel =
                        status === "active"
                            ? "Active"
                            : "Inactive";


                    const typeLabel =
                        customer.bookingCount >
                        1
                            ? "Repeat Customer"
                            : "New Customer";


                    row.innerHTML = `

                        <td>

                            <div class="customer-cell">

                                <div class="customer-avatar">

                                    ${escapeHtml(
                                        getInitials(
                                            customer.name
                                        )
                                    )}

                                </div>

                                <div class="customer-name">

                                    <strong>
                                        ${escapeHtml(
                                            customer.name ||
                                            "Unnamed Customer"
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHtml(
                                            typeLabel
                                        )}
                                    </span>

                                </div>

                            </div>

                        </td>


                        <td>
                            ${escapeHtml(
                                customer.contact ||
                                "—"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                customer.email ||
                                "—"
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                customer.facebook ||
                                "—"
                            )}
                        </td>


                        <td>
                            ${Number(
                                customer.bookingCount ||
                                0
                            ).toLocaleString(
                                "en-PH"
                            )}
                        </td>


                        <td>
                            ₱${formatMoney(
                                customer.totalSpent
                            )}
                        </td>


                        <td>
                            ${escapeHtml(
                                formatDate(
                                    customer.lastTrip
                                )
                            )}
                        </td>


                        <td>

                            <span
                                class="status-badge ${status}"
                            >
                                ${statusLabel}
                            </span>

                        </td>


                        <td>

                            <div class="action-buttons">

                                <button
                                    type="button"
                                    class="action-button view"
                                    data-action="view"
                                    data-id="${escapeHtml(
                                        customer.id
                                    )}"
                                    title="View Customer"
                                >
                                    <i class="fa-regular fa-eye"></i>
                                </button>


                                <button
                                    type="button"
                                    class="action-button edit"
                                    data-action="edit"
                                    data-id="${escapeHtml(
                                        customer.id
                                    )}"
                                    title="Edit Customer"
                                >
                                    <i class="fa-regular fa-pen-to-square"></i>
                                </button>


                                ${
                                    customer.source ===
                                    "manual"

                                        ? `

                                            <button
                                                type="button"
                                                class="action-button more"
                                                data-action="delete"
                                                data-id="${escapeHtml(
                                                    customer.id
                                                )}"
                                                title="Delete Customer"
                                            >
                                                <i class="fa-regular fa-trash-can"></i>
                                            </button>

                                        `

                                        : ""
                                }

                            </div>

                        </td>

                    `;


                    customersTableBody.appendChild(
                        row
                    );

                }
            );

        }


        /* =====================================================
           CUSTOMER QR SCANNER
           ===================================================== */

        function setCustomerQrStatus(
            message,
            type = ""
        ) {

            if (!customerQrStatus) {
                return;
            }


            customerQrStatus.textContent =
                message;


            customerQrStatus.classList.remove(
                "success",
                "error"
            );


            if (
                type === "success" ||
                type === "error"
            ) {

                customerQrStatus.classList.add(
                    type
                );

            }

        }


        function stopCustomerQrScanner() {

            if (
                customerQrScanFrame
            ) {

                cancelAnimationFrame(
                    customerQrScanFrame
                );

                customerQrScanFrame =
                    null;

            }


            if (
                customerQrStream
            ) {

                customerQrStream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );

                customerQrStream =
                    null;

            }


            if (
                customerQrVideo
            ) {

                customerQrVideo.srcObject =
                    null;

            }


            customerQrProcessing =
                false;

        }


        function closeCustomerQrScannerModal() {

            stopCustomerQrScanner();


            if (
                customerQrScannerModal
            ) {

                customerQrScannerModal
                    .classList
                    .remove(
                        "show"
                    );


                customerQrScannerModal
                    .setAttribute(
                        "aria-hidden",
                        "true"
                    );

            }


            document.body.style.overflow =
                "";

        }


        function extractCustomerUidFromQr(
            rawValue
        ) {

            const value =
                String(
                    rawValue ||
                    ""
                )
                    .trim();


            if (!value) {

                return "";

            }


            const prefix =
                "TWTMS:CUSTOMER:";


            if (
                value
                    .toUpperCase()
                    .startsWith(
                        prefix
                    )
            ) {

                return value
                    .slice(
                        prefix.length
                    )
                    .trim();

            }


            /*
             * We intentionally do not treat arbitrary QR text
             * as a Firebase UID. Only Trips Wonder customer QR
             * payloads are accepted here.
             */

            return "";

        }


        function getCustomerByAuthUid(
            uid
        ) {

            const normalizedUid =
                String(
                    uid ||
                    ""
                )
                    .trim();


            if (!normalizedUid) {

                return null;

            }


            return customers.find(
                customer => {

                    return (
                        String(
                            customer.authUid ||
                            customer.customerUid ||
                            ""
                        )
                            .trim() ===
                        normalizedUid
                    );

                }
            ) || null;

        }


        async function findCustomerFromUserProfile(
            uid
        ) {

            try {

                const userSnapshot =
                    await getDoc(
                        doc(
                            db,
                            "users",
                            uid
                        )
                    );


                if (
                    !userSnapshot.exists()
                ) {

                    return null;

                }


                const profile =
                    userSnapshot.data() ||
                    {};


                const profileEmail =
                    normalizeText(
                        profile.email ||
                        profile.customerEmail ||
                        ""
                    );


                const profileContact =
                    normalizeText(
                        profile.contact ||
                        profile.phone ||
                        profile.mobile ||
                        profile.customerContact ||
                        ""
                    );


                const profileName =
                    normalizeText(
                        profile.name ||
                        profile.fullName ||
                        profile.displayName ||
                        profile.customerName ||
                        ""
                    );


                const matched =
                    customers.find(
                        customer => {

                            const customerEmail =
                                normalizeText(
                                    customer.email ||
                                    ""
                                );


                            const customerContact =
                                normalizeText(
                                    customer.contact ||
                                    ""
                                );


                            const customerName =
                                normalizeText(
                                    customer.name ||
                                    ""
                                );


                            if (
                                profileEmail &&
                                customerEmail &&
                                profileEmail ===
                                customerEmail
                            ) {

                                return true;

                            }


                            if (
                                profileContact &&
                                customerContact &&
                                profileContact ===
                                customerContact
                            ) {

                                return true;

                            }


                            if (
                                profileName &&
                                customerName &&
                                profileName ===
                                customerName
                            ) {

                                return true;

                            }


                            return false;

                        }
                    ) ||
                    null;


                if (matched) {

                    matched.authUid =
                        uid;

                    matched.customerUid =
                        uid;


                    console.log(
                        "CUSTOMER QR FALLBACK MATCH:",
                        {
                            uid,
                            profile,
                            customer:
                                matched
                        }
                    );

                }


                return matched;

            } catch (error) {

                console.warn(
                    "CUSTOMER QR USER PROFILE LOOKUP ERROR:",
                    error
                );


                return null;

            }

        }


        async function resolveCustomerQr(
            rawValue
        ) {

            if (
                customerQrProcessing
            ) {

                return;

            }


            customerQrProcessing =
                true;


            const uid =
                extractCustomerUidFromQr(
                    rawValue
                );


            if (!uid) {

                setCustomerQrStatus(
                    "This is not a valid Trips Wonder Customer QR.",
                    "error"
                );


                customerQrProcessing =
                    false;


                return;

            }


            /*
             * Ensure the customer list is current before resolving
             * the QR. This also picks up a newly-created booking.
             */

            await loadCustomers();


            let customer =
                getCustomerByAuthUid(
                    uid
                );


            /*
             * Older bookings/customer records may not have
             * customerUid/authUid yet. In that case, use the
             * Firebase users/{uid} profile to match the existing
             * customer by email, contact number, or exact name.
             */

            if (!customer) {

                customer =
                    await findCustomerFromUserProfile(
                        uid
                    );

            }


            if (!customer) {

                setCustomerQrStatus(
                    "Customer account was recognized, but it could not be matched to an existing customer profile.",
                    "error"
                );


                console.warn(
                    "CUSTOMER QR UID NOT LINKED:",
                    uid
                );


                customerQrProcessing =
                    false;


                return;

            }


            setCustomerQrStatus(
                `Customer found: ${customer.name || "Customer"}`,
                "success"
            );


            console.log(
                "CUSTOMER QR MATCH:",
                {
                    uid,
                    customer
                }
            );


            stopCustomerQrScanner();


            setTimeout(
                () => {

                    closeCustomerQrScannerModal();


                    /*
                     * Reuse the current customer profile action.
                     * Later this can open the dedicated profile modal/page.
                     */

                    viewCustomer(
                        customer.id
                    );

                },
                450
            );

        }


        async function scanCustomerQrFrame() {

            if (
                !customerQrVideo ||
                customerQrVideo.readyState < 2
            ) {

                customerQrScanFrame =
                    requestAnimationFrame(
                        scanCustomerQrFrame
                    );

                return;

            }


            try {

                let rawValue =
                    "";


                if (
                    customerQrScannerMode ===
                    "barcode-detector" &&
                    customerQrDetector
                ) {

                    const codes =
                        await customerQrDetector.detect(
                            customerQrVideo
                        );


                    rawValue =
                        codes[0]
                            ?.rawValue ||
                        "";

                }


                else if (
                    customerQrScannerMode ===
                    "jsqr" &&
                    typeof window.jsQR ===
                    "function" &&
                    customerQrCanvasContext
                ) {

                    const width =
                        customerQrVideo.videoWidth;


                    const height =
                        customerQrVideo.videoHeight;


                    if (
                        width > 0 &&
                        height > 0
                    ) {

                        customerQrCanvas.width =
                            width;


                        customerQrCanvas.height =
                            height;


                        customerQrCanvasContext.drawImage(
                            customerQrVideo,
                            0,
                            0,
                            width,
                            height
                        );


                        const imageData =
                            customerQrCanvasContext.getImageData(
                                0,
                                0,
                                width,
                                height
                            );


                        const code =
                            window.jsQR(
                                imageData.data,
                                width,
                                height,
                                {
                                    inversionAttempts:
                                        "dontInvert"
                                }
                            );


                        rawValue =
                            code?.data ||
                            "";

                    }

                }


                if (rawValue) {

                    await resolveCustomerQr(
                        rawValue
                    );


                    if (
                        !customerQrStream
                    ) {

                        return;

                    }

                }

            } catch (error) {

                console.warn(
                    "CUSTOMER QR FRAME ERROR:",
                    error
                );

            }


            customerQrScanFrame =
                requestAnimationFrame(
                    scanCustomerQrFrame
                );

        }


        async function startCustomerQrScanner() {

            stopCustomerQrScanner();


            customerQrProcessing =
                false;


            setCustomerQrStatus(
                "Starting camera..."
            );


            if (
                retryCustomerQrScanner
            ) {

                retryCustomerQrScanner.hidden =
                    true;

            }


            customerQrScannerMode =
                "";


            customerQrDetector =
                null;


            if (
                "BarcodeDetector" in window
            ) {

                try {

                    const supportedFormats =
                        await BarcodeDetector
                            .getSupportedFormats();


                    if (
                        supportedFormats.includes(
                            "qr_code"
                        )
                    ) {

                        customerQrDetector =
                            new BarcodeDetector({
                                formats: [
                                    "qr_code"
                                ]
                            });


                        customerQrScannerMode =
                            "barcode-detector";

                    }

                } catch (error) {

                    console.warn(
                        "Native QR scanner unavailable:",
                        error
                    );

                }

            }


            if (
                !customerQrScannerMode &&
                typeof window.jsQR ===
                "function"
            ) {

                customerQrScannerMode =
                    "jsqr";

            }


            if (
                !customerQrScannerMode
            ) {

                setCustomerQrStatus(
                    "QR scanner library did not load. Refresh the page and try again.",
                    "error"
                );


                if (
                    retryCustomerQrScanner
                ) {

                    retryCustomerQrScanner.hidden =
                        false;

                }


                return;

            }


            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia
            ) {

                setCustomerQrStatus(
                    "Camera access is not available on this device.",
                    "error"
                );


                return;

            }


            try {

                customerQrStream =
                    await navigator
                        .mediaDevices
                        .getUserMedia({
                            video: {
                                facingMode: {
                                    ideal:
                                        "environment"
                                }
                            },
                            audio:
                                false
                        });


                if (
                    customerQrVideo
                ) {

                    customerQrVideo.srcObject =
                        customerQrStream;


                    await customerQrVideo.play();

                }


                setCustomerQrStatus(
                    customerQrScannerMode ===
                    "jsqr"
                        ? "Camera ready. Point it at the customer's QR."
                        : "Point the camera at the customer's QR."
                );


                customerQrScanFrame =
                    requestAnimationFrame(
                        scanCustomerQrFrame
                    );

            } catch (error) {

                console.error(
                    "CUSTOMER QR CAMERA ERROR:",
                    error
                );


                stopCustomerQrScanner();


                setCustomerQrStatus(
                    "Unable to open the camera. Check camera permission, then retry.",
                    "error"
                );


                if (
                    retryCustomerQrScanner
                ) {

                    retryCustomerQrScanner.hidden =
                        false;

                }

            }

        }


        async function decodeCustomerQrImage(
            file
        ) {

            if (!file) {
                return;
            }


            if (
                typeof window.jsQR !==
                "function"
            ) {

                setCustomerQrStatus(
                    "QR image reader is unavailable. Refresh the page and try again.",
                    "error"
                );

                return;
            }


            try {

                setCustomerQrStatus(
                    "Reading QR image..."
                );


                const bitmap =
                    await createImageBitmap(
                        file
                    );


                const canvas =
                    document.createElement(
                        "canvas"
                    );


                const context =
                    canvas.getContext(
                        "2d",
                        {
                            willReadFrequently:
                                true
                        }
                    );


                canvas.width =
                    bitmap.width;


                canvas.height =
                    bitmap.height;


                context.drawImage(
                    bitmap,
                    0,
                    0
                );


                const imageData =
                    context.getImageData(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );


                const code =
                    window.jsQR(
                        imageData.data,
                        canvas.width,
                        canvas.height,
                        {
                            inversionAttempts:
                                "attemptBoth"
                        }
                    );


                bitmap.close?.();


                if (
                    !code ||
                    !code.data
                ) {

                    setCustomerQrStatus(
                        "No QR code was found in that image.",
                        "error"
                    );

                    return;
                }


                await resolveCustomerQr(
                    code.data
                );

            } catch (error) {

                console.error(
                    "CUSTOMER QR IMAGE ERROR:",
                    error
                );


                setCustomerQrStatus(
                    "Unable to read that QR image.",
                    "error"
                );

            }

        }


        async function openCustomerQrScannerModal() {

            if (
                !customerQrScannerModal
            ) {

                return;

            }


            customerQrScannerModal
                .classList
                .add(
                    "show"
                );


            customerQrScannerModal
                .setAttribute(
                    "aria-hidden",
                    "false"
                );


            document.body.style.overflow =
                "hidden";


            if (
                customerQrManualInput
            ) {

                customerQrManualInput.value =
                    "";

            }


            await startCustomerQrScanner();

        }


        if (
            scanCustomerQrButton
        ) {

            scanCustomerQrButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    openCustomerQrScannerModal();

                }
            );

        }


        if (
            closeCustomerQrScanner
        ) {

            closeCustomerQrScanner.addEventListener(
                "click",
                () => {

                    closeCustomerQrScannerModal();

                }
            );

        }


        if (
            retryCustomerQrScanner
        ) {

            retryCustomerQrScanner.addEventListener(
                "click",
                () => {

                    startCustomerQrScanner();

                }
            );

        }


        if (
            customerQrManualButton
        ) {

            customerQrManualButton.addEventListener(
                "click",
                () => {

                    resolveCustomerQr(
                        customerQrManualInput
                            ?.value ||
                        ""
                    );

                }
            );

        }


        if (
            customerQrManualInput
        ) {

            customerQrManualInput.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();


                        resolveCustomerQr(
                            customerQrManualInput.value
                        );

                    }

                }
            );

        }


        if (
            customerQrImageInput
        ) {

            customerQrImageInput.addEventListener(
                "change",
                async event => {

                    const file =
                        event.target.files?.[0] ||
                        null;


                    if (!file) {
                        return;
                    }


                    await decodeCustomerQrImage(
                        file
                    );


                    event.target.value =
                        "";

                }
            );

        }


        if (
            customerQrScannerModal
        ) {

            customerQrScannerModal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        customerQrScannerModal
                    ) {

                        closeCustomerQrScannerModal();

                    }

                }
            );

        }


        /* =====================================================
           FIND CUSTOMER
           ===================================================== */

        function getCustomerById(
            id
        ) {

            return customers.find(
                customer =>
                    customer.id === id
            ) || null;

        }


        /* =====================================================
           OPEN ADD CUSTOMER MODAL
           ===================================================== */

        window.openCustomerModal =
            function() {

                editingCustomerId =
                    null;


                if (
                    customerForm
                ) {

                    customerForm.reset();

                }


                if (
                    customerId
                ) {

                    customerId.value =
                        "";

                }


                if (
                    customerStatus
                ) {

                    customerStatus.value =
                        "active";

                }


                if (
                    customerType
                ) {

                    customerType.value =
                        "new";

                }


                if (
                    customerModalTitle
                ) {

                    customerModalTitle.textContent =
                        "Add Customer";

                }


                if (
                    customerModalDescription
                ) {

                    customerModalDescription.textContent =
                        "Create a customer profile.";

                }


                if (
                    customerModal
                ) {

                    customerModal.classList.add(
                        "show"
                    );

                    customerModal.setAttribute(
                        "aria-hidden",
                        "false"
                    );

                }


                document.body.style.overflow =
                    "hidden";


                setTimeout(
                    () => {

                        customerName?.focus();

                    },
                    100
                );

            };


        /* =====================================================
           CLOSE CUSTOMER MODAL
           ===================================================== */

        window.closeCustomerModal =
            function() {

                if (
                    customerModal
                ) {

                    customerModal.classList.remove(
                        "show"
                    );

                    customerModal.setAttribute(
                        "aria-hidden",
                        "true"
                    );

                }


                document.body.style.overflow =
                    "";


                editingCustomerId =
                    null;

            };


        /* =====================================================
           OPEN EDIT CUSTOMER
           ===================================================== */

        function openEditCustomer(
            id
        ) {

            const customer =
                getCustomerById(
                    id
                );


            if (
                !customer
            ) {

                alert(
                    "Customer could not be found."
                );

                return;

            }


            editingCustomerId =
                customer.source ===
                "manual"
                    ? customer.id
                    : null;


            if (
                customerId
            ) {

                customerId.value =
                    customer.id ||
                    "";

            }


            if (
                customerName
            ) {

                customerName.value =
                    customer.name ||
                    "";

            }


            if (
                customerContact
            ) {

                customerContact.value =
                    customer.contact ||
                    "";

            }


            if (
                customerEmail
            ) {

                customerEmail.value =
                    customer.email ||
                    "";

            }


            if (
                customerFacebook
            ) {

                customerFacebook.value =
                    customer.facebook ||
                    "";

            }


            if (
                customerStatus
            ) {

                customerStatus.value =
                    customer.status ||
                    "active";

            }


            if (
                customerType
            ) {

                customerType.value =
                    customer.type ||
                    "new";

            }


            if (
                customerNotes
            ) {

                customerNotes.value =
                    customer.notes ||
                    "";

            }


            if (
                customerModalTitle
            ) {

                customerModalTitle.textContent =
                    "Edit Customer";

            }


            if (
                customerModalDescription
            ) {

                customerModalDescription.textContent =
                    "Update customer information.";

            }


            if (
                customerModal
            ) {

                customerModal.classList.add(
                    "show"
                );

                customerModal.setAttribute(
                    "aria-hidden",
                    "false"
                );

            }


            document.body.style.overflow =
                "hidden";

        }

                /* =====================================================
           VIEW CUSTOMER
           ===================================================== */

        function formatTravelDateRange(
            booking
        ) {

            if (!booking) {
                return "—";
            }


            const start =
                booking.travelDate ||
                "";


            const end =
                booking.travelEndDate ||
                "";


            if (
                !start &&
                !end
            ) {

                return "—";

            }


            if (
                start &&
                end &&
                start !== end
            ) {

                return (
                    `${formatDate(start)} – ${formatDate(end)}`
                );

            }


            return formatDate(
                start ||
                end
            );

        }


        function getBookingDurationLabel(
            booking
        ) {

            const savedDuration =
                String(
                    booking?.duration ||
                    ""
                )
                    .trim();


            if (savedDuration) {

                return savedDuration;

            }


            const startDate =
                booking?.travelDate
                    ? new Date(
                        `${booking.travelDate}T00:00:00`
                    )
                    : null;


            const endDate =
                booking?.travelEndDate
                    ? new Date(
                        `${booking.travelEndDate}T00:00:00`
                    )
                    : null;


            if (
                startDate &&
                endDate &&
                !Number.isNaN(
                    startDate.getTime()
                ) &&
                !Number.isNaN(
                    endDate.getTime()
                )
            ) {

                const dayCount =
                    Math.max(
                        1,
                        Math.round(
                            (
                                endDate.getTime() -
                                startDate.getTime()
                            ) /
                            86400000
                        ) + 1
                    );


                const nightCount =
                    Math.max(
                        0,
                        dayCount - 1
                    );


                return (
                    `${dayCount} Day${dayCount === 1 ? "" : "s"} ` +
                    `${nightCount} Night${nightCount === 1 ? "" : "s"}`
                );

            }


            return "—";

        }


        function getAccommodationLabel(
            booking
        ) {

            const value =
                String(
                    booking?.accommodationName ||
                    ""
                )
                    .trim();


            return value || "Not specified";

        }


        function closeCustomerProfile() {

            if (
                customerProfileModal
            ) {

                customerProfileModal
                    .classList
                    .remove(
                        "show"
                    );


                customerProfileModal
                    .setAttribute(
                        "aria-hidden",
                        "true"
                    );

            }


            document.body.style.overflow =
                "";

        }


        function viewCustomer(
            id
        ) {

            const customer =
                getCustomerById(
                    id
                );


            if (
                !customer
            ) {

                alert(
                    "Customer could not be found."
                );

                return;

            }


            const customerBookings =
                bookings
                    .filter(
                        booking =>
                            customer.bookingIds
                                ?.includes(
                                    booking.id
                                )
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            getTimestamp(
                                b.travelDate
                            ) -
                            getTimestamp(
                                a.travelDate
                            )
                    );


            if (
                customerProfileAvatar
            ) {

                customerProfileAvatar.textContent =
                    getInitials(
                        customer.name
                    );

            }


            if (
                customerProfileName
            ) {

                customerProfileName.textContent =
                    customer.name ||
                    "Customer Profile";

            }


            if (
                customerProfileSubtitle
            ) {

                customerProfileSubtitle.textContent =
                    customer.authUid ||
                    customer.customerUid
                        ? "Trips Wonder customer account"
                        : "Customer profile";

            }


            if (
                customerProfileContact
            ) {

                customerProfileContact.textContent =
                    customer.contact ||
                    "—";

            }


            if (
                customerProfileEmail
            ) {

                customerProfileEmail.textContent =
                    customer.email ||
                    "—";

            }


            if (
                customerProfileFacebook
            ) {

                customerProfileFacebook.textContent =
                    customer.facebook ||
                    "—";

            }


            if (
                customerProfileStatus
            ) {

                customerProfileStatus.textContent =
                    normalizeText(
                        customer.status
                    ) ===
                    "inactive"
                        ? "Inactive"
                        : "Active";

            }


            if (
                customerProfileBookings
            ) {

                customerProfileBookings.textContent =
                    String(
                        customer.bookingCount ||
                        0
                    );

            }


            if (
                customerProfileSpent
            ) {

                customerProfileSpent.textContent =
                    `₱${formatMoney(
                        customer.totalSpent
                    )}`;

            }


            if (
                customerProfileLastTrip
            ) {

                customerProfileLastTrip.textContent =
                    formatDate(
                        customer.lastTrip
                    );

            }


            if (
                customerProfileBookingHistory
            ) {

                customerProfileBookingHistory.innerHTML =
                    "";


                if (
                    customerBookings.length ===
                    0
                ) {

                    customerProfileBookingHistory.innerHTML = `
                        <div class="customer-profile-empty">
                            No booking history.
                        </div>
                    `;

                }


                else {

                    customerBookings.forEach(
                        booking => {

                            const card =
                                document.createElement(
                                    "div"
                                );


                            card.className =
                                "customer-profile-booking-card";


                            const info =
                                document.createElement(
                                    "div"
                                );


                            const name =
                                document.createElement(
                                    "strong"
                                );


                            name.textContent =
                                booking.packageName ||
                                "Tour Package";


                            const travelLine =
                                document.createElement(
                                    "span"
                                );


                            travelLine.textContent =
                                `Travel Date: ${formatTravelDateRange(booking)}`;


                            const durationLine =
                                document.createElement(
                                    "span"
                                );


                            durationLine.textContent =
                                `Duration: ${getBookingDurationLabel(booking)}`;


                            const accommodationLine =
                                document.createElement(
                                    "span"
                                );


                            accommodationLine.textContent =
                                `Accommodation: ${getAccommodationLabel(booking)}`;


                            const bookingMeta =
                                document.createElement(
                                    "span"
                                );


                            const collectedAmount =
                                getBookingCollectedAmount(
                                    booking
                                );


                            const bookingStatusText =
                                booking.bookingStatus ||
                                "pending";


                            const paymentStatusText =
                                booking.paymentStatus ||
                                (
                                    collectedAmount > 0
                                        ? "partial"
                                        : "unpaid"
                                );


                            bookingMeta.textContent =
                                `Booking: ${bookingStatusText} · Payment: ${paymentStatusText} · Paid: ₱${formatMoney(collectedAmount)}`;


                            info.appendChild(
                                name
                            );


                            info.appendChild(
                                travelLine
                            );


                            info.appendChild(
                                durationLine
                            );


                            info.appendChild(
                                accommodationLine
                            );


                            info.appendChild(
                                bookingMeta
                            );


                            const date =
                                document.createElement(
                                    "span"
                                );


                            date.className =
                                "customer-profile-booking-date";


                            date.textContent =
                                getBookingDurationLabel(
                                    booking
                                );


                            card.appendChild(
                                info
                            );


                            card.appendChild(
                                date
                            );


                            customerProfileBookingHistory
                                .appendChild(
                                    card
                                );

                        }
                    );

                }

            }


            if (
                customerProfileNotesWrap &&
                customerProfileNotes
            ) {

                const notes =
                    String(
                        customer.notes ||
                        ""
                    )
                        .trim();


                customerProfileNotesWrap.hidden =
                    !notes;


                customerProfileNotes.textContent =
                    notes;

            }


            if (
                customerProfileModal
            ) {

                customerProfileModal
                    .classList
                    .add(
                        "show"
                    );


                customerProfileModal
                    .setAttribute(
                        "aria-hidden",
                        "false"
                    );


                document.body.style.overflow =
                    "hidden";

            }

        }


        /* =====================================================
           CUSTOMER FORM SUBMIT
           ===================================================== */

        if (
            customerForm
        ) {

            customerForm.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    const name =
                        customerName?.value
                            ?.trim() ||
                        "";


                    const contact =
                        customerContact?.value
                            ?.trim() ||
                        "";


                    const email =
                        customerEmail?.value
                            ?.trim() ||
                        "";


                    const facebook =
                        customerFacebook?.value
                            ?.trim() ||
                        "";


                    const status =
                        customerStatus?.value ||
                        "active";


                    const type =
                        customerType?.value ||
                        "new";


                    const notes =
                        customerNotes?.value
                            ?.trim() ||
                        "";


                    /* =========================================
                       VALIDATION
                       ========================================= */

                    if (
                        !name
                    ) {

                        alert(
                            "Please enter the customer name."
                        );

                        customerName?.focus();

                        return;

                    }


                    if (
                        !contact &&
                        !email &&
                        !facebook
                    ) {

                        const proceed =
                            confirm(
                                "No contact number, email, or Facebook name was entered.\n\nDo you still want to save this customer?"
                            );


                        if (
                            !proceed
                        ) {

                            return;

                        }

                    }


                    /* =========================================
                       DUPLICATE CHECK
                       ========================================= */

                    const newKey =
                        getCustomerKey({
                            customerName:
                                name,
                            customerContact:
                                contact,
                            customerEmail:
                                email,
                            customerFacebook:
                                facebook
                        });


                    const duplicate =
                        customers.find(
                            customer => {

                                /*
                                 * Ignore the customer
                                 * currently being edited.
                                 */

                                if (
                                    customer.id ===
                                    customerId?.value
                                ) {

                                    return false;

                                }


                                const existingKey =
                                    getCustomerKey({
                                        customerName:
                                            customer.name,
                                        customerContact:
                                            customer.contact,
                                        customerEmail:
                                            customer.email,
                                        customerFacebook:
                                            customer.facebook
                                    });


                                return (
                                    existingKey ===
                                    newKey
                                );

                            }
                        );


                    if (
                        duplicate
                    ) {

                        const proceed =
                            confirm(
                                `A matching customer already exists:\n\n${duplicate.name}\n\nDo you still want to save this profile?`
                            );


                        if (
                            !proceed
                        ) {

                            return;

                        }

                    }


                    /* =========================================
                       SAVE BUTTON STATE
                       ========================================= */

                    const submitButton =
                        customerForm.querySelector(
                            'button[type="submit"]'
                        );


                    const originalButtonContent =
                        submitButton
                            ?.innerHTML ||
                        "Save Customer";


                    if (
                        submitButton
                    ) {

                        submitButton.disabled =
                            true;


                        submitButton.innerHTML = `
                            <i class="fa-solid fa-spinner fa-spin"></i>
                            Saving...
                        `;

                    }


                    try {

                        const now =
                            new Date()
                                .toISOString();


                        const customerData = {

                            name:
                                name,

                            customerName:
                                name,

                            contact:
                                contact,

                            customerContact:
                                contact,

                            email:
                                email,

                            customerEmail:
                                email,

                            facebook:
                                facebook,

                            customerFacebook:
                                facebook,

                            customerFb:
                                facebook,

                            status:
                                status,

                            customerStatus:
                                status,

                            type:
                                type,

                            customerType:
                                type,

                            notes:
                                notes,

                            customerNotes:
                                notes,

                            updatedAt:
                                now

                        };


                        /* =====================================
                           UPDATE MANUAL CUSTOMER
                           ===================================== */

                        if (
                            editingCustomerId
                        ) {

                            const existingCustomer =
                                manualCustomers.find(
                                    customer =>
                                        customer.id ===
                                        editingCustomerId
                                );


                            await updateDoc(
                                doc(
                                    db,
                                    "customers",
                                    editingCustomerId
                                ),
                                {

                                    ...customerData,

                                    createdAt:
                                        existingCustomer
                                            ?.createdAt ||
                                        now

                                }
                            );


                            console.log(
                                "CUSTOMER UPDATED:",
                                editingCustomerId
                            );


                            alert(
                                "Customer updated successfully!"
                            );

                        }


                        /* =====================================
                           CREATE CUSTOMER
                           ===================================== */

                        else {

                            const newCustomerRef =
                                await addDoc(
                                    collection(
                                        db,
                                        "customers"
                                    ),
                                    {

                                        ...customerData,

                                        createdAt:
                                            now

                                    }
                                );


                            console.log(
                                "CUSTOMER CREATED:",
                                newCustomerRef.id
                            );


                            alert(
                                "Customer saved successfully!"
                            );

                        }


                        window.closeCustomerModal();


                        await loadCustomers();


                    } catch (error) {

                        console.error(
                            "SAVE CUSTOMER ERROR:",
                            error
                        );


                        alert(
                            "Unable to save customer. Please try again."
                        );


                    } finally {

                        if (
                            submitButton
                        ) {

                            submitButton.disabled =
                                false;


                            submitButton.innerHTML =
                                originalButtonContent;

                        }

                    }

                }
            );

        }


        /* =====================================================
           DELETE CUSTOMER
           ===================================================== */

        async function deleteCustomer(
            id
        ) {

            const customer =
                getCustomerById(
                    id
                );


            if (
                !customer
            ) {

                alert(
                    "Customer could not be found."
                );

                return;

            }


            /*
             * Booking-generated customers cannot be
             * deleted here because the source of the
             * customer is still an existing booking.
             */

            if (
                customer.source !==
                "manual"
            ) {

                alert(
                    "This customer is generated from a booking record and cannot be deleted from the Customers Module."
                );

                return;

            }


            const confirmed =
                confirm(
                    `Delete customer?\n\n${customer.name}\n\nThis will remove the customer profile only. Existing booking records will not be deleted.`
                );


            if (
                !confirmed
            ) {

                return;

            }


            try {

                await deleteDoc(
                    doc(
                        db,
                        "customers",
                        id
                    )
                );


                console.log(
                    "CUSTOMER DELETED:",
                    id
                );


                await loadCustomers();


            } catch (error) {

                console.error(
                    "DELETE CUSTOMER ERROR:",
                    error
                );


                alert(
                    "Unable to delete customer."
                );

            }

        }


        /* =====================================================
           TABLE ACTIONS
           ===================================================== */

        if (
            customersTableBody
        ) {

            customersTableBody.addEventListener(
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


                    const action =
                        button.dataset.action;


                    const id =
                        button.dataset.id;


                    if (
                        !id
                    ) {

                        return;

                    }


                    switch (
                        action
                    ) {


                        case "view":

                            viewCustomer(
                                id
                            );

                            break;


                        case "edit":

                            openEditCustomer(
                                id
                            );

                            break;


                        case "delete":

                            deleteCustomer(
                                id
                            );

                            break;

                    }

                }
            );

        }


        /* =====================================================
           CUSTOMER PROFILE MODAL EVENTS
           ===================================================== */

        if (
            closeCustomerProfileModal
        ) {

            closeCustomerProfileModal.addEventListener(
                "click",
                () => {

                    closeCustomerProfile();

                }
            );

        }


        if (
            customerProfileModal
        ) {

            customerProfileModal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        customerProfileModal
                    ) {

                        closeCustomerProfile();

                    }

                }
            );

        }


        /* =====================================================
           SEARCH
           ===================================================== */

        if (
            customerSearch
        ) {

            customerSearch.addEventListener(
                "input",
                () => {

                    renderCustomers();

                }
            );

        }


        /* =====================================================
           STATUS FILTER
           ===================================================== */

        if (
            customerStatusFilter
        ) {

            customerStatusFilter.addEventListener(
                "change",
                () => {

                    renderCustomers();

                }
            );

        }


        /* =====================================================
           CUSTOMER TYPE FILTER
           ===================================================== */

        if (
            customerTypeFilter
        ) {

            customerTypeFilter.addEventListener(
                "change",
                () => {

                    renderCustomers();

                }
            );

        }


        /* =====================================================
           SORT
           ===================================================== */

        if (
            customerSort
        ) {

            customerSort.addEventListener(
                "change",
                () => {

                    renderCustomers();

                }
            );

        }


        /* =====================================================
           REFRESH BUTTON
           ===================================================== */

        if (
            refreshCustomers
        ) {

            refreshCustomers.addEventListener(
                "click",
                async event => {

                    /*
                     * The HTML currently also calls
                     * refreshCustomers() inline.
                     *
                     * Prevent duplicate behavior here.
                     */

                    event.preventDefault();


                    await loadCustomers();

                }
            );

        }


        /* =====================================================
           ADD CUSTOMER BUTTON
           ===================================================== */

        if (
            addCustomerButton
        ) {

            addCustomerButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    window.openCustomerModal();

                }
            );

        }


        /* =====================================================
           OPTIONAL CLOSE BUTTONS
           ===================================================== */

        if (
            closeCustomerModal
        ) {

            closeCustomerModal.addEventListener(
                "click",
                () => {

                    window.closeCustomerModal();

                }
            );

        }


        if (
            cancelCustomerButton
        ) {

            cancelCustomerButton.addEventListener(
                "click",
                () => {

                    window.closeCustomerModal();

                }
            );

        }


        /* =====================================================
           MODAL BACKDROP
           ===================================================== */

        if (
            customerModalBackdrop
        ) {

            customerModalBackdrop.addEventListener(
                "click",
                () => {

                    window.closeCustomerModal();

                }
            );

        }


        /*
         * Current customers.html uses the modal overlay
         * itself instead of a separate backdrop.
         */

        if (
            customerModal
        ) {

            customerModal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        customerModal
                    ) {

                        window.closeCustomerModal();

                    }

                }
            );

        }


        /* =====================================================
           ESCAPE KEY
           ===================================================== */

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !==
                    "Escape"
                ) {

                    return;

                }


                window.closeCustomerModal();

                closeCustomerQrScannerModal();

                closeCustomerProfile();

            }
        );


        /* =====================================================
           GLOBAL REFRESH COMPATIBILITY
           ===================================================== */

        window.refreshCustomers =
            async function() {

                await loadCustomers();

            };


        /* =====================================================
           INITIAL LOAD
           ===================================================== */

        loadCustomers()
            .then(
                () => {

                    console.log(
                        "TWTMS CUSTOMERS MODULE READY."
                    );

                }
            )
            .catch(
                error => {

                    console.error(
                        "CUSTOMERS INITIALIZATION ERROR:",
                        error
                    );

                }
            );


    }
);