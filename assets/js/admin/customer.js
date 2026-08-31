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

                totalAmount:
                    normalizeNumber(
                        data.totalAmount
                    ),

                amountPaid:
                    normalizeNumber(
                        data.amountPaid
                    ),

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
                        normalizeNumber(
                            booking.amountPaid
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
                    loadBookings()
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


            let bookingHistory =
                "";


            if (
                customerBookings.length ===
                0
            ) {

                bookingHistory =
                    "No booking history.";

            } else {

                bookingHistory =
                    customerBookings
                        .map(
                            (
                                booking,
                                index
                            ) => {

                                return (
                                    `${index + 1}. ` +
                                    `${booking.packageName || "Tour Package"} - ` +
                                    `${formatDate(booking.travelDate)}`
                                );

                            }
                        )
                        .join(
                            "\n"
                        );

            }


            alert(
                [
                    `CUSTOMER PROFILE`,
                    ``,
                    `Name: ${customer.name || "—"}`,
                    `Contact: ${customer.contact || "—"}`,
                    `Email: ${customer.email || "—"}`,
                    `Facebook: ${customer.facebook || "—"}`,
                    `Status: ${
                        normalizeText(
                            customer.status
                        ) === "inactive"
                            ? "Inactive"
                            : "Active"
                    }`,
                    ``,
                    `Bookings: ${customer.bookingCount || 0}`,
                    `Total Spent: ₱${formatMoney(customer.totalSpent)}`,
                    `Last Trip: ${formatDate(customer.lastTrip)}`,
                    ``,
                    `BOOKING HISTORY`,
                    bookingHistory,
                    ``,
                    customer.notes
                        ? `Notes: ${customer.notes}`
                        : ""
                ]
                    .filter(Boolean)
                    .join(
                        "\n"
                    )
            );

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