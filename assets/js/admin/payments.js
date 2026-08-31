// =========================================
// TWTMS v2
// PAYMENTS MODULE
// FULL REPLACEMENT
// PART 1
// =========================================


// =========================================
// FIRESTORE
// =========================================

import {

    db,

    collection,

    getDocs,

    addDoc,

    updateDoc,

    doc,

    query,

    orderBy

} from "../firebase/firebase-db.js";

// =========================================
// FIREBASE FUNCTIONS
// =========================================

import {
    functions
} from "../firebase/firebase-config.js";

import {
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";


// =========================================
// AUTH
// =========================================

import {

    requireAuth

} from "../auth/auth-guard.js";


// =========================================
// LOADING SCREEN
// =========================================

import {

    showLoading,

    hideLoading,

    showLoadingError

} from "../shared/loading-screen.js";


// =========================================
// MODULE START
// =========================================

console.log(
    "TWTMS PAYMENTS MODULE LOADING..."
);


// =========================================
// AUTHENTICATION + PERMISSION GUARD
// =========================================

requireAuth({

    allowedRoles: [
        "owner",
        "admin"
    ],

    requiredPermission:
        "payments",

    onAuthorized: (
        user,
        profile
    ) => {

        console.log(
            "TWTMS PAYMENTS ACCESS GRANTED:",
            {
                uid:
                    user.uid,

                role:
                    profile.role,

                payments:
                    profile.permissions?.payments
            }
        );

    }

});


// =========================================
// DOM READY
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {


        // =====================================
        // STATE
        // =====================================

        let bookings = [];

        let payments = [];

        let editingPaymentId = null;


        // =====================================
        // SUMMARY
        // =====================================

        const totalPaymentsElement =
            document.getElementById(
                "totalPayments"
            );


        const totalCollectedElement =
            document.getElementById(
                "totalCollected"
            );


        const pendingPaymentsElement =
            document.getElementById(
                "pendingPayments"
            );


        const outstandingBalanceElement =
            document.getElementById(
                "outstandingBalance"
            );


        // =====================================
        // SEARCH / FILTER
        // =====================================

        const paymentSearch =
            document.getElementById(
                "paymentSearch"
            );


        const paymentStatusFilter =
            document.getElementById(
                "paymentStatusFilter"
            );


        const paymentMethodFilter =
            document.getElementById(
                "paymentMethodFilter"
            );


        const paymentSort =
            document.getElementById(
                "paymentSort"
            );


        const paymentResultText =
            document.getElementById(
                "paymentResultText"
            );


        const refreshPaymentsButton =
            document.getElementById(
                "refreshPayments"
            );


        // =====================================
        // TABLE
        // =====================================

        const paymentsTableBody =
            document.getElementById(
                "paymentsTableBody"
            );


        const emptyPayments =
            document.getElementById(
                "emptyPayments"
            );

        // =====================================
// PAYMENT VERIFICATION ELEMENTS
// =====================================

const paymentVerificationTableBody =
    document.getElementById(
        "paymentVerificationTableBody"
    );

const paymentVerificationEmpty =
    document.getElementById(
        "paymentVerificationEmpty"
    );

const pendingVerificationCount =
    document.getElementById(
        "pendingVerificationCount"
    );


// =====================================
// VERIFY PAYMENT MODAL ELEMENTS
// =====================================

const verifyPaymentModal =
    document.getElementById(
        "verifyPaymentModal"
    );

const closeVerifyPaymentModal =
    document.getElementById(
        "closeVerifyPaymentModal"
    );

const verifyCustomerName =
    document.getElementById(
        "verifyCustomerName"
    );

const verifyPackageName =
    document.getElementById(
        "verifyPackageName"
    );

const verifyTravelDate =
    document.getElementById(
        "verifyTravelDate"
    );

const verifyGuestCount =
    document.getElementById(
        "verifyGuestCount"
    );

const verifyBookingTotal =
    document.getElementById(
        "verifyBookingTotal"
    );

const verifyBookingStatus =
    document.getElementById(
        "verifyBookingStatus"
    );

const verifyDepositAmount =
    document.getElementById(
        "verifyDepositAmount"
    );

const verifyPaymentMethod =
    document.getElementById(
        "verifyPaymentMethod"
    );

const verifyTransactionReference =
    document.getElementById(
        "verifyTransactionReference"
    );

const verifyAdminNote =
    document.getElementById(
        "verifyAdminNote"
    );

const rejectClientPaymentBtn =
    document.getElementById(
        "rejectClientPaymentBtn"
    );

const approveClientPaymentBtn =
    document.getElementById(
        "approveClientPaymentBtn"
    );


        // =====================================
        // PAYMENT MODAL
        // =====================================

        const paymentModal =
            document.getElementById(
                "paymentModal"
            );


        const paymentModalTitle =
            document.getElementById(
                "paymentModalTitle"
            );


        const paymentForm =
            document.getElementById(
                "paymentForm"
            );


        const paymentId =
            document.getElementById(
                "paymentId"
            );


        const paymentReceiptModal =
    document.getElementById(
        "paymentReceiptModal"
    );

const closeReceiptModal =
    document.getElementById(
        "closeReceiptModal"
    );

const receiptPaymentReference =
    document.getElementById(
        "receiptPaymentReference"
    );

    const receiptPaymentStatus =
    document.getElementById(
        "receiptPaymentStatus"
    );

const receiptCustomer =
    document.getElementById(
        "receiptCustomer"
    );

const receiptBookingReference =
    document.getElementById(
        "receiptBookingReference"
    );

const receiptPackage =
    document.getElementById(
        "receiptPackage"
    );

const receiptPaymentDate =
    document.getElementById(
        "receiptPaymentDate"
    );

const receiptPaymentMethod =
    document.getElementById(
        "receiptPaymentMethod"
    );

const receiptPaymentDetails =
    document.getElementById(
        "receiptPaymentDetails"
    );

const receiptAmount =
    document.getElementById(
        "receiptAmount"
    );

const receiptBookingTotal =
    document.getElementById(
        "receiptBookingTotal"
    );

const receiptTotalPaid =
    document.getElementById(
        "receiptTotalPaid"
    );

const receiptRemainingBalance =
    document.getElementById(
        "receiptRemainingBalance"
    );

const printReceiptBtn =
    document.getElementById(
        "printReceiptBtn"
    );

const saveReceiptBtn =
    document.getElementById(
        "saveReceiptBtn"
    );

    // =====================================
// SEND RECEIPT ELEMENTS
// =====================================

const sendReceiptModal =
    document.getElementById(
        "sendReceiptModal"
    );


const closeSendReceiptModal =
    document.getElementById(
        "closeSendReceiptModal"
    );


const cancelSendReceiptBtn =
    document.getElementById(
        "cancelSendReceiptBtn"
    );


const confirmSendReceiptBtn =
    document.getElementById(
        "confirmSendReceiptBtn"
    );


const sendReceiptCustomer =
    document.getElementById(
        "sendReceiptCustomer"
    );


const sendReceiptPaymentReference =
    document.getElementById(
        "sendReceiptPaymentReference"
    );


const sendReceiptAmount =
    document.getElementById(
        "sendReceiptAmount"
    );


const sendReceiptRecipient =
    document.getElementById(
        "sendReceiptRecipient"
    );


const sendReceiptMessage =
    document.getElementById(
        "sendReceiptMessage"
    );


        // =====================================
        // FORM FIELDS
        // =====================================

        const paymentBooking =
            document.getElementById(
                "paymentBooking"
            );


        const paymentCustomer =
            document.getElementById(
                "paymentCustomer"
            );


        const paymentAmount =
            document.getElementById(
                "paymentAmount"
            );


        const paymentMethod =
            document.getElementById(
                "paymentMethod"
            );


        const paymentReference =
            document.getElementById(
                "paymentReference"
            );


        const paymentDate =
            document.getElementById(
                "paymentDate"
            );


        const paymentStatus =
            document.getElementById(
                "paymentStatus"
            );


        const paymentNotes =
            document.getElementById(
                "paymentNotes"
            );


        // =====================================
        // DETAILS MODAL
        // =====================================

        const paymentDetailsModal =
            document.getElementById(
                "paymentDetailsModal"
            );


        const detailsPaymentReference =
            document.getElementById(
                "detailsPaymentReference"
            );


        const detailsPaymentCustomer =
            document.getElementById(
                "detailsPaymentCustomer"
            );


        const detailsPaymentBooking =
            document.getElementById(
                "detailsPaymentBooking"
            );


        const detailsPaymentMethod =
            document.getElementById(
                "detailsPaymentMethod"
            );


        const detailsPaymentDate =
            document.getElementById(
                "detailsPaymentDate"
            );


        const detailsPaymentAmount =
            document.getElementById(
                "detailsPaymentAmount"
            );


        const detailsPaymentStatus =
            document.getElementById(
                "detailsPaymentStatus"
            );

        const voidPaymentDetails =
            document.getElementById(
                "voidPaymentDetails"
            );

        const detailsVoidReason =
            document.getElementById(
                "detailsVoidReason"
            );

        const detailsVoidedAt =
            document.getElementById(
                "detailsVoidedAt"
            );

        const detailsCancelReasonItem =
            document.getElementById(
                "detailsCancelReasonItem"
            );


        const detailsPaymentCancelReason =
            document.getElementById(
                "detailsPaymentCancelReason"
            );


        const detailsCancelledAtItem =
            document.getElementById(
                "detailsCancelledAtItem"
            );


        const detailsPaymentCancelledAt =
            document.getElementById(
                "detailsPaymentCancelledAt"
            );

        const detailsPaymentNotes =
            document.getElementById(
                "detailsPaymentNotes"
            );


        // =====================================
        // HELPERS
        // =====================================

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


        function capitalize(
            value
        ) {

            const text =
                String(
                    value || ""
                );


            if (!text) {
                return "";
            }


            return (
                text
                    .charAt(0)
                    .toUpperCase() +
                text.slice(1)
            );

        }


        function formatDate(
            value
        ) {

            if (!value) {
                return "—";
            }


            const parts =
                String(
                    value
                ).split("-");


            if (
                parts.length !==
                3
            ) {

                return value;

            }


            const [
                year,
                month,
                day
            ] = parts.map(
                Number
            );


            const date =
                new Date(
                    year,
                    month - 1,
                    day
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return value;

            }


            return date
                .toLocaleDateString(
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


        function getTimestamp(
            value
        ) {

            if (!value) {
                return 0;
            }


            const time =
                Date.parse(
                    value
                );


            return Number.isNaN(
                time
            )
                ? 0
                : time;

        }


        function getTodayInputValue() {

            const today =
                new Date();


            const year =
                today.getFullYear();


            const month =
                String(
                    today.getMonth() +
                    1
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


            return `${year}-${month}-${day}`;

        }


        // =====================================
        // GET BOOKING
        // =====================================

        function getBookingById(
            bookingId
        ) {

            return bookings.find(
                booking =>
                    booking.id ===
                    bookingId
            ) || null;

        }


        // =====================================
        // NORMALIZE BOOKING
        // =====================================

        function normalizeBooking(
    documentSnapshot
) {

    const data =
        documentSnapshot.data();


    return {

        id:
            documentSnapshot.id,

        bookingReference:
            data.bookingReference ||
            data.bookingRef ||
            data.reference ||
            documentSnapshot.id,

        customerName:
            data.customerName ||
            data.name ||
            data.fullName ||
            "Unnamed Customer",

        packageName:
            data.packageName ||
            data.package ||
            data.destination ||
            "Package",


        // =================================
        // TRAVEL DATE
        // =================================

        travelDate:
    data.travelStartDate ||
    data.travelDate ||
    data.tourDate ||
    data.departureDate ||
    data.tripDate ||
    data.startDate ||
    "",


        // =================================
        // NUMBER OF GUESTS
        // =================================

        numberOfGuests:
            normalizeNumber(
                data.numberOfGuests ??
                data.guestCount ??
                data.pax ??
                data.numberOfPax ??
                data.totalPax ??
                data.noOfPax ??
                0
            ),


        // =================================
        // BOOKING TOTAL
        // =================================

        totalAmount:
            normalizeNumber(
                data.totalAmount ??
                data.total ??
                0
            ),

        requiredDeposit:
    normalizeNumber(
        data.requiredDeposit ??
        data.depositAmount ??
        data.initialDeposit ??
        0
    ),

paymentMethod:
    String(
        data.paymentMethod ||
        ""
    )
        .trim()
        .toLowerCase(),

transactionReference:
    data.paymentReference ||
    data.transactionReference ||
    data.referenceNumber ||
    "",

bookingSource:
    String(
        data.bookingSource ||
        data.source ||
        ""
    )
        .trim()
        .toLowerCase(),

createdAt:
    data.createdAt ||
    "",

updatedAt:
    data.updatedAt ||
    "",


        // =================================
        // AMOUNT PAID
        // =================================

        amountPaid:
            normalizeNumber(
                data.amountPaid ??
                data.paid ??
                0
            ),


        // =================================
        // REMAINING BALANCE
        // =================================

        remainingBalance:
            normalizeNumber(
                data.remainingBalance ??
                (
                    normalizeNumber(
                        data.totalAmount
                    ) -
                    normalizeNumber(
                        data.amountPaid
                    )
                )
            ),


        // =================================
        // PAYMENT STATUS
        // =================================

        paymentStatus:
            String(
                data.paymentStatus ||
                "unpaid"
            )
                .trim()
                .toLowerCase(),


        // =================================
        // BOOKING STATUS
        // =================================

        bookingStatus:
            String(
                data.bookingStatus ||
                "pending"
            )
                .trim()
                .toLowerCase()

    };

}


        // =====================================
        // LOAD BOOKINGS
        // =====================================

        async function loadBookings() {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "bookings"
                    )
                );


            bookings =
                snapshot.docs
                    .map(
                        normalizeBooking
                    );


            console.log(
                "PAYMENTS: BOOKINGS LOADED:",
                bookings
            );


            populateBookingOptions();

renderPaymentVerifications();

        }


        // =====================================
        // POPULATE BOOKING SELECT
        // =====================================

        function populateBookingOptions() {

            if (
                !paymentBooking
            ) {
                return;
            }


            const currentValue =
                paymentBooking.value;


            paymentBooking.innerHTML = `

                <option value="">
                    Select booking
                </option>

            `;


            bookings
                .slice()
                .sort(
                    (
                        a,
                        b
                    ) => {

                        return (
                            a.bookingReference ||
                            ""
                        ).localeCompare(
                            b.bookingReference ||
                            ""
                        );

                    }
                )
                .forEach(
                    booking => {

                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            booking.id;


                        const balanceText =
                            booking.remainingBalance >
                            0
                                ? ` — Balance ₱${formatMoney(
                                    booking.remainingBalance
                                )}`
                                : " — Fully Paid";


                        option.textContent =
                            `${
                                booking.bookingReference
                            } — ${
                                booking.customerName
                            } — ${
                                booking.packageName
                            }${balanceText}`;


                        paymentBooking
                            .appendChild(
                                option
                            );

                    }
                );


            if (
                [
                    ...paymentBooking.options
                ].some(
                    option =>
                        option.value ===
                        currentValue
                )
            ) {

                paymentBooking.value =
                    currentValue;

            }

        }

        // =====================================
// GET PENDING PAYMENT VERIFICATIONS
// =====================================

function getPendingPaymentVerifications() {

    return bookings
        .filter(
            booking =>
                booking.paymentStatus ===
                "pending_verification"
        )
        .sort(
            (a, b) =>
                getTimestamp(
                    b.createdAt
                ) -
                getTimestamp(
                    a.createdAt
                )
        );

}


// =====================================
// RENDER PAYMENT VERIFICATIONS
// =====================================

function renderPaymentVerifications() {

    if (
        !paymentVerificationTableBody
    ) {
        return;
    }


    const pendingBookings =
        getPendingPaymentVerifications();


    paymentVerificationTableBody.innerHTML =
        "";


    // =================================
    // PENDING COUNT
    // =================================

    if (
        pendingVerificationCount
    ) {

        pendingVerificationCount.textContent =
            pendingBookings.length;

    }


    // =================================
    // EMPTY STATE
    // =================================

    if (
        pendingBookings.length === 0
    ) {

        if (
            paymentVerificationEmpty
        ) {

            paymentVerificationEmpty.style.display =
                "";

        }

        return;

    }


    if (
        paymentVerificationEmpty
    ) {

        paymentVerificationEmpty.style.display =
            "none";

    }


    // =================================
    // TABLE ROWS
    // =================================

    pendingBookings.forEach(
        booking => {

            const row =
                document.createElement(
                    "tr"
                );


            row.dataset.bookingId =
                booking.id;


            const paymentMethodLabel =
                getPaymentMethodLabel(
                    booking.paymentMethod
                );


            row.innerHTML = `

                <td>

                    <div class="verification-customer-cell">

                        <strong>
                            ${escapeHtml(
                                booking.customerName
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                booking.customerContact ||
                                booking.customerEmail ||
                                "Online Booking"
                            )}
                        </span>

                    </div>

                </td>


                <td>

                    <div class="verification-package-cell">

                        <strong>
                            ${escapeHtml(
                                booking.packageName
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                booking.numberOfGuests
                            )} pax
                        </span>

                    </div>

                </td>


                <td>

                    ${escapeHtml(
                        formatDate(
                            booking.travelDate
                        )
                    )}

                </td>


                <td>

                    <strong class="verification-deposit">

                        ₱${escapeHtml(
                            formatMoney(
                                booking.requiredDeposit
                            )
                        )}

                    </strong>

                </td>


                <td>

                    <span class="payment-method">

                        ${escapeHtml(
                            paymentMethodLabel
                        )}

                    </span>

                </td>


                <td>

                    <span class="verification-reference">

                        ${escapeHtml(
                            booking.transactionReference ||
                            "—"
                        )}

                    </span>

                </td>


                <td>

                    <span class="verification-status">

                        Pending Verification

                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="review-payment-button"
                        data-booking-id="${escapeHtml(
                            booking.id
                        )}"
                    >

                        <i class="fa-regular fa-eye"></i>

                        Review

                    </button>

                </td>

            `;


            paymentVerificationTableBody
                .appendChild(
                    row
                );

        }
    );


    console.log(
        "PAYMENT VERIFICATIONS RENDERED:",
        pendingBookings
    );

}


        // =====================================
        // BOOKING CHANGE
        // =====================================

        paymentBooking
            ?.addEventListener(
                "change",
                () => {

                    const booking =
                        getBookingById(
                            paymentBooking.value
                        );


                    if (
                        !booking
                    ) {

                        if (
                            paymentCustomer
                        ) {

                            paymentCustomer.value =
                                "";

                        }


                        return;

                    }


                    if (
                        paymentCustomer
                    ) {

                        paymentCustomer.value =
                            booking.customerName ||
                            "";

                    }


                    /*
                     * For a new payment, default the
                     * amount to the booking's
                     * remaining balance.
                     */

                    if (
                        !editingPaymentId &&
                        paymentAmount
                    ) {

                        paymentAmount.value =
                            booking.remainingBalance >
                            0
                                ? booking.remainingBalance
                                : "";

                    }

                }
            );


        // =====================================
        // RESET PAYMENT FORM
        // =====================================

        function resetPaymentForm() {

            editingPaymentId =
                null;


            paymentForm?.reset();


            if (
                paymentId
            ) {

                paymentId.value =
                    "";

            }


            if (
                paymentCustomer
            ) {

                paymentCustomer.value =
                    "";

            }


            if (
                paymentDate
            ) {

                paymentDate.value =
                    getTodayInputValue();

            }


            if (
                paymentStatus
            ) {

                paymentStatus.value =
                    "paid";

            }


            if (
                paymentModalTitle
            ) {

                paymentModalTitle.textContent =
                    "Record Payment";

            }

                        if (
                paymentReceivedBy
            ) {

                paymentReceivedBy.value =
                    "";

            }


            updatePaymentMethodFields();

        }

                // =====================================
        // PAYMENT METHOD FIELDS
        // =====================================

        function updatePaymentMethodFields() {

            const method =
                String(
                    paymentMethod?.value ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const isCash =
                method === "cash";


            // =================================
            // RECEIVED BY
            // =================================

            if (
                paymentReceivedByField
            ) {

                paymentReceivedByField.style.display =
                    isCash
                        ? ""
                        : "none";

            }


            if (
                paymentReceivedBy
            ) {

                paymentReceivedBy.required =
                    isCash;


                if (
                    !isCash
                ) {

                    paymentReceivedBy.value =
                        "";

                }

            }


            // =================================
            // PAYMENT REFERENCE
            // =================================

            if (
                paymentReference
            ) {

                paymentReference.required =
                    !isCash;


                paymentReference.disabled =
                    isCash;


                if (
                    isCash
                ) {

                    paymentReference.value =
                        "";

                }

            }

        }


        // =====================================
        // OVERRIDE GLOBAL OPEN PAYMENT MODAL
        // =====================================

        window.openPaymentModal =
            function() {

                resetPaymentForm();


                if (
                    !paymentModal
                ) {
                    return;
                }


                paymentModal.classList.add(
                    "show"
                );


                paymentModal.setAttribute(
                    "aria-hidden",
                    "false"
                );


                document.body.style.overflow =
                    "hidden";

            };


        // =====================================
        // OVERRIDE GLOBAL CLOSE PAYMENT MODAL
        // =====================================

        window.closePaymentModal =
            function() {

                if (
                    !paymentModal
                ) {
                    return;
                }


                paymentModal.classList.remove(
                    "show"
                );


                paymentModal.setAttribute(
                    "aria-hidden",
                    "true"
                );


                document.body.style.overflow =
                    "";

            };

        // =====================================
        // NORMALIZE PAYMENT
        // =====================================

        function normalizePayment(
            documentSnapshot
        ) {

            const data =
                documentSnapshot.data();


            return {

                id:
                    documentSnapshot.id,

                paymentReference:
                    data.paymentReference ||
                    data.paymentRef ||
                    documentSnapshot.id,

                transactionReference:
                    data.transactionReference ||
                    data.referenceNumber ||
                    "",

                receivedBy:
                    data.receivedBy ||
                    "",

                voidReason:
                    data.voidReason ||
                    "",

                voidedAt:
                    data.voidedAt ||
                    "",

                cancelReason:
                    data.cancelReason ||
                    "",

                cancelledAt:
                    data.cancelledAt ||
                    "",

                bookingId:
                    data.bookingId ||
                    "",

                bookingReference:
                    data.bookingReference ||
                    "",

                customerName:
                    data.customerName ||
                    "Unnamed Customer",

                packageName:
                    data.packageName ||
                    "",

                amount:
                    normalizeNumber(
                        data.amount
                    ),

                method:
                    String(
                        data.method ||
                        "other"
                    )
                        .trim()
                        .toLowerCase(),

                paymentDate:
                    data.paymentDate ||
                    "",

                status:
                    String(
                        data.status ||
                        "pending"
                    )
                        .trim()
                        .toLowerCase(),

                notes:
                    data.notes ||
                    "",

                createdAt:
                    data.createdAt ||
                    "",

                updatedAt:
                    data.updatedAt ||
                    ""

            };

        }


        // =====================================
        // LOAD PAYMENTS
        // =====================================

        async function loadPayments() {

            try {

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


                console.log(
                    "PAYMENTS LOADED:",
                    payments
                );


                renderPayments();

                updatePaymentSummary();


            } catch (error) {

                console.error(
                    "LOAD PAYMENTS ERROR:",
                    error
                );


                payments = [];


                renderPayments();

                updatePaymentSummary();

            }

        }


        // =====================================
        // EXPOSE REFRESH
        // =====================================

        window.loadPayments =
            loadPayments;


        window.refreshPayments =
            async function() {

                if (
                    refreshPaymentsButton
                ) {

                    refreshPaymentsButton.disabled =
                        true;


                    refreshPaymentsButton.classList.add(
                        "loading"
                    );

                }


                try {

                    await loadBookings();

                    await loadPayments();

                } catch (error) {

                    console.error(
                        "REFRESH PAYMENTS ERROR:",
                        error
                    );

                } finally {

                    if (
                        refreshPaymentsButton
                    ) {

                        refreshPaymentsButton.disabled =
                            false;


                        refreshPaymentsButton.classList.remove(
                            "loading"
                        );

                    }

                }

            };


        // =====================================
        // PAYMENT STATUS HELPERS
        // =====================================

        function getPaymentStatusLabel(
            status
        ) {

            const labels = {

                paid:
                    "Paid",

                partial:
                    "Partial",

                pending:
                    "Pending",

                cancelled:
                    "Cancelled",

                refunded:
                    "Refunded"

            };


            return (
                labels[
                    String(
                        status ||
                        ""
                    ).toLowerCase()
                ] ||
                capitalize(
                    status
                ) ||
                "Pending"
            );

        }


        function getPaymentMethodLabel(
            method
        ) {

            const methods = {

                gcash:
                    "GCash",

                bank:
                    "Bank Transfer",

                qrph:
                    "QR Ph",

                cash:
                    "Cash",

                card:
                    "Card",

                other:
                    "Other"

            };


            return (
                methods[
                    String(
                        method ||
                        ""
                    ).toLowerCase()
                ] ||
                capitalize(
                    method
                ) ||
                "Other"
            );

        }


        // =====================================
        // FILTER PAYMENTS
        // =====================================

        function getFilteredPayments() {

            let result =
                [
                    ...payments
                ];


            // ---------------------------------
            // SEARCH
            // ---------------------------------

            const searchTerm =
                String(
                    paymentSearch?.value ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            if (
                searchTerm
            ) {

                result =
                    result.filter(
                        payment => {

                            const searchable =
                                [

                                    payment.paymentReference,

                                    payment.transactionReference,

                                    payment.customerName,

                                    payment.bookingReference,

                                    payment.packageName,

                                    payment.method,

                                    payment.status

                                ]
                                    .join(
                                        " "
                                    )
                                    .toLowerCase();


                            return searchable.includes(
                                searchTerm
                            );

                        }
                    );

            }


            // ---------------------------------
            // STATUS FILTER
            // ---------------------------------

            const selectedStatus =
                paymentStatusFilter?.value ||
                "all";


            if (
                selectedStatus !==
                "all"
            ) {

                result =
                    result.filter(
                        payment =>
                            payment.status ===
                            selectedStatus
                    );

            }


            // ---------------------------------
            // METHOD FILTER
            // ---------------------------------

            const selectedMethod =
                paymentMethodFilter?.value ||
                "all";


            if (
                selectedMethod !==
                "all"
            ) {

                result =
                    result.filter(
                        payment =>
                            payment.method ===
                            selectedMethod
                    );

            }


            // ---------------------------------
            // SORT
            // ---------------------------------

            const selectedSort =
                paymentSort?.value ||
                "newest";


            result.sort(
                (
                    a,
                    b
                ) => {

                    if (
                        selectedSort ===
                        "oldest"
                    ) {

                        return (
                            getTimestamp(
                                a.createdAt ||
                                a.paymentDate
                            ) -
                            getTimestamp(
                                b.createdAt ||
                                b.paymentDate
                            )
                        );

                    }


                    if (
                        selectedSort ===
                        "amount-high"
                    ) {

                        return (
                            b.amount -
                            a.amount
                        );

                    }


                    if (
                        selectedSort ===
                        "amount-low"
                    ) {

                        return (
                            a.amount -
                            b.amount
                        );

                    }


                    return (
                        getTimestamp(
                            b.createdAt ||
                            b.paymentDate
                        ) -
                        getTimestamp(
                            a.createdAt ||
                            a.paymentDate
                        )
                    );

                }
            );


            return result;

        }


        // =====================================
        // RENDER PAYMENTS
        // =====================================

        function renderPayments() {

            if (
                !paymentsTableBody
            ) {
                return;
            }


            const filteredPayments =
                getFilteredPayments();


            paymentsTableBody.innerHTML =
                "";


            // ---------------------------------
            // RESULT TEXT
            // ---------------------------------

            if (
                paymentResultText
            ) {

                if (
                    payments.length ===
                    0
                ) {

                    paymentResultText.textContent =
                        "No payment records yet";

                } else if (
                    filteredPayments.length ===
                    payments.length
                ) {

                    paymentResultText.textContent =
                        `Showing ${payments.length} payment${
                            payments.length === 1
                                ? ""
                                : "s"
                        }`;

                } else {

                    paymentResultText.textContent =
                        `Showing ${filteredPayments.length} of ${payments.length} payments`;

                }

            }


            // ---------------------------------
            // EMPTY STATE
            // ---------------------------------

            if (
                filteredPayments.length ===
                0
            ) {

                if (
                    emptyPayments
                ) {

                    emptyPayments.style.display =
                        "";

                }


                return;

            }


            if (
                emptyPayments
            ) {

                emptyPayments.style.display =
                    "none";

            }


            // ---------------------------------
            // TABLE ROWS
            // ---------------------------------

            filteredPayments.forEach(
                payment => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.dataset.id =
                        payment.id;


                    const paymentReferenceDisplay =
                        payment.paymentReference ||
                        "—";


                    const transactionReferenceDisplay =
                        payment.transactionReference
                            ? escapeHtml(
                                payment.transactionReference
                            )
                            : "No transaction ref";

                    const paymentStatusValue =
                        String(
                            payment.status ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const isLockedPayment =
                        paymentStatusValue === "void" ||
                        paymentStatusValue === "cancelled";


                    row.innerHTML = `

                        <td>

                            <div class="payment-reference-cell">

                                <strong>
                                    ${escapeHtml(
                                        paymentReferenceDisplay
                                    )}
                                </strong>

                            </div>

                        </td>


                        <td>

                            <div class="payment-customer-cell">

                                <strong>
                                    ${escapeHtml(
                                        payment.customerName
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        payment.packageName ||
                                        "—"
                                    )}
                                </span>

                            </div>

                        </td>


                        <td>

                            <span class="booking-reference">

                                ${escapeHtml(
                                    payment.bookingReference ||
                                    "—"
                                )}

                            </span>

                        </td>


                        <td>

                            <span class="payment-method">

                                ${escapeHtml(
                                    getPaymentMethodLabel(
                                        payment.method
                                    )
                                )}

                            </span>

                        </td>

                        <td>

        <div class="payment-detail-cell">

        ${
            String(
                payment.method || ""
            )
                .trim()
                .toLowerCase() === "cash"

                ? `
                    <span class="payment-detail-label">
                        Received by
                    </span>

                    <strong>
                        ${escapeHtml(
                            payment.receivedBy ||
                            "—"
                        )}
                    </strong>
                `

                : `
                    <span class="payment-detail-label">
                        Reference
                    </span>

                    <strong>
                        ${escapeHtml(
                            payment.transactionReference ||
                            "—"
                        )}
                    </strong>
                `
        }

    </div>

</td>

                        <td>

                            <strong class="payment-amount">

                                ₱${escapeHtml(
                                    formatMoney(
                                        payment.amount
                                    )
                                )}

                            </strong>

                        </td>


                        <td>

                            ${escapeHtml(
                                formatDate(
                                    payment.paymentDate
                                )
                            )}

                        </td>


                        <td>

                            <span
                                class="payment-status-badge ${escapeHtml(
                                    payment.status
                                )}"
                            >

                                ${escapeHtml(
                                    getPaymentStatusLabel(
                                        payment.status
                                    )
                                )}

                            </span>

                        </td>


                        <td>

                            <div class="payment-actions">

    <button
    type="button"
    class="payment-more-button"
    data-id="${escapeHtml(
        payment.id
    )}"
    aria-label="Payment actions"
    title="Payment Actions"
>
    <span class="payment-more-dots">•••</span>
</button>


    <div
        class="payment-actions-menu"
        data-menu-id="${escapeHtml(
            payment.id
        )}"
    >

        <button
            type="button"
            class="payment-menu-item view-payment"
            data-id="${escapeHtml(
                payment.id
            )}"
        >
            <i class="fa-regular fa-eye"></i>
            <span>View Details</span>
        </button>


        ${
    !isLockedPayment
        ? `
            <button
                type="button"
                class="payment-menu-item edit-payment"
                data-id="${escapeHtml(
                    payment.id
                )}"
            >
                <span>Edit</span>
            </button>


            <div class="payment-menu-divider"></div>


            <button
                type="button"
                class="payment-menu-item void-payment"
                data-id="${escapeHtml(
                    payment.id
                )}"
            >
                <i class="fa-solid fa-ban"></i>
                <span>Void Payment</span>
            </button>


            <button
                type="button"
                class="payment-menu-item cancel-payment"
                data-id="${escapeHtml(
                    payment.id
                )}"
            >
                <i class="fa-regular fa-circle-xmark"></i>
                <span>Cancel Payment</span>
            </button>


            <div class="payment-menu-divider"></div>
        `
        : ""
}


        <div class="payment-menu-divider"></div>


        <button
            type="button"
            class="payment-menu-item generate-receipt"
            data-id="${escapeHtml(
                payment.id
            )}"
        >
            <i class="fa-solid fa-receipt"></i>
            <span>Generate Receipt</span>
        </button>


        <button
            type="button"
            class="payment-menu-item send-receipt"
            data-id="${escapeHtml(
                payment.id
            )}"
        >
            <i class="fa-regular fa-envelope"></i>
            <span>Send Receipt</span>
        </button>

    </div>

</div>

                        </td>

                    `;


                    paymentsTableBody
                        .appendChild(
                            row
                        );

                }
            );

        }


        // =====================================
        // UPDATE SUMMARY
        // =====================================

        function updatePaymentSummary() {

            /*
             * Total Payments
             *
             * Count all payment records except
             * cancelled transactions.
             */

            const activePayments =
                payments.filter(
                    payment =>
                        payment.status !==
                        "cancelled"
                );


            const totalPayments =
                activePayments.length;


            /*
             * Total Collected
             *
             * Count Paid + Partial transactions.
             * Pending / Cancelled / Refunded are
             * not counted as collected money.
             */

            const totalCollected =
                payments
                    .filter(
                        payment =>
                            payment.status ===
                                "paid" ||
                            payment.status ===
                                "partial"
                    )
                    .reduce(
                        (
                            total,
                            payment
                        ) =>
                            total +
                            payment.amount,
                        0
                    );


            const pendingPayments =
                payments.filter(
                    payment =>
                        payment.status ===
                        "pending"
                ).length;


            /*
             * Outstanding Balance
             *
             * This is based on the bookings
             * collection rather than payment
             * records.
             */

            const outstandingBalance =
                bookings
                    .filter(
                        booking =>
                            booking.bookingStatus !==
                            "cancelled"
                    )
                    .reduce(
                        (
                            total,
                            booking
                        ) =>
                            total +
                            Math.max(
                                0,
                                normalizeNumber(
                                    booking.remainingBalance
                                )
                            ),
                        0
                    );


            if (
                totalPaymentsElement
            ) {

                totalPaymentsElement.textContent =
                    totalPayments;

            }


            if (
                totalCollectedElement
            ) {

                totalCollectedElement.textContent =
                    `₱${formatMoney(
                        totalCollected
                    )}`;

            }


            if (
                pendingPaymentsElement
            ) {

                pendingPaymentsElement.textContent =
                    pendingPayments;

            }


            if (
                outstandingBalanceElement
            ) {

                outstandingBalanceElement.textContent =
                    `₱${formatMoney(
                        outstandingBalance
                    )}`;

            }

        }


        // =====================================
        // SEARCH / FILTER EVENTS
        // =====================================

        paymentSearch
            ?.addEventListener(
                "input",
                renderPayments
            );


        paymentStatusFilter
            ?.addEventListener(
                "change",
                renderPayments
            );


        paymentMethodFilter
            ?.addEventListener(
                "change",
                renderPayments
            );


        paymentSort
            ?.addEventListener(
                "change",
                renderPayments
            );


// =====================================
// OPEN PAYMENT DETAILS
// =====================================

function openPaymentDetails(
    paymentIdValue
) {

    const payment =
        payments.find(
            item =>
                item.id ===
                paymentIdValue
        );


    if (
        !payment ||
        !paymentDetailsModal
    ) {

        return;

    }


    // =================================
    // BASIC PAYMENT DETAILS
    // =================================

    if (
        detailsPaymentReference
    ) {

        detailsPaymentReference.textContent =
            payment.paymentReference ||
            "—";

    }


    if (
        detailsPaymentCustomer
    ) {

        detailsPaymentCustomer.textContent =
            payment.customerName ||
            "—";

    }


    if (
        detailsPaymentBooking
    ) {

        detailsPaymentBooking.textContent =
            payment.bookingReference ||
            "—";

    }


    if (
        detailsPaymentMethod
    ) {

        detailsPaymentMethod.textContent =
            getPaymentMethodLabel(
                payment.method
            );

    }


    if (
        detailsPaymentDate
    ) {

        detailsPaymentDate.textContent =
            formatDate(
                payment.paymentDate
            );

    }


    if (
        detailsPaymentAmount
    ) {

        detailsPaymentAmount.textContent =
            `₱${formatMoney(
                payment.amount
            )}`;

    }


    if (
        detailsPaymentStatus
    ) {

        detailsPaymentStatus.textContent =
            getPaymentStatusLabel(
                payment.status
            );

    }


    // =================================
    // VOID PAYMENT DETAILS
    // =================================

    const isVoidPayment =
        String(
            payment.status ||
            ""
        )
            .trim()
            .toLowerCase() ===
        "void";


    if (
        voidPaymentDetails
    ) {

        voidPaymentDetails.style.display =
            isVoidPayment
                ? ""
                : "none";

    }


    if (
        detailsVoidReason
    ) {

        detailsVoidReason.textContent =
            payment.voidReason ||
            "—";

    }


    if (
        detailsVoidedAt
    ) {

        detailsVoidedAt.textContent =
            payment.voidedAt
                ? new Date(
                    payment.voidedAt
                ).toLocaleString(
                    "en-PH"
                )
                : "—";

    }


    // =================================
    // CANCELLED PAYMENT DETAILS
    // =================================

    const isCancelledPayment =
        String(
            payment.status ||
            ""
        )
            .trim()
            .toLowerCase() ===
        "cancelled";


    if (
        detailsCancelReasonItem
    ) {

        detailsCancelReasonItem.style.display =
            isCancelledPayment
                ? ""
                : "none";

    }


    if (
        detailsCancelledAtItem
    ) {

        detailsCancelledAtItem.style.display =
            isCancelledPayment
                ? ""
                : "none";

    }


    if (
        detailsPaymentCancelReason
    ) {

        detailsPaymentCancelReason.textContent =
            payment.cancelReason ||
            "—";

    }


    if (
        detailsPaymentCancelledAt
    ) {

        detailsPaymentCancelledAt.textContent =
            payment.cancelledAt
                ? new Date(
                    payment.cancelledAt
                ).toLocaleString(
                    "en-PH"
                )
                : "—";

    }


    // =================================
    // NOTES
    // =================================

    if (
        detailsPaymentNotes
    ) {

        detailsPaymentNotes.textContent =
            payment.notes ||
            "No notes available.";

    }


    // =================================
    // OPEN MODAL
    // =================================

    paymentDetailsModal.classList.add(
        "show"
    );


    paymentDetailsModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

}
        // =====================================
        // CLOSE PAYMENT DETAILS
        // =====================================

        window.closePaymentDetails =
            function() {

                if (
                    !paymentDetailsModal
                ) {
                    return;
                }


                paymentDetailsModal.classList.remove(
                    "show"
                );


                paymentDetailsModal.setAttribute(
                    "aria-hidden",
                    "true"
                );


                document.body.style.overflow =
                    "";

            };

            // =====================================
// OPEN SEND RECEIPT MODAL
// =====================================

function openSendReceiptModal(
    payment,
    booking
) {

    if (
        !payment ||
        !sendReceiptModal
    ) {
        return;
    }


    // CUSTOMER

    if (sendReceiptCustomer) {

        sendReceiptCustomer.textContent =
            payment.customerName ||
            booking?.customerName ||
            "—";

    }


    // PAYMENT REFERENCE

    if (sendReceiptPaymentReference) {

        sendReceiptPaymentReference.textContent =
            payment.paymentReference ||
            "—";

    }


    // AMOUNT

    if (sendReceiptAmount) {

        sendReceiptAmount.textContent =
            `₱${formatMoney(
                payment.amount
            )}`;

    }


    // RECIPIENT EMAIL

    if (sendReceiptRecipient) {

        sendReceiptRecipient.value =
            payment.customerEmail ||
            booking?.customerEmail ||
            booking?.email ||
            "";

    }


    // DEFAULT MESSAGE

    if (sendReceiptMessage) {

        const customerName =
            payment.customerName ||
            booking?.customerName ||
            "Guest";


        const paymentReference =
            payment.paymentReference ||
            "—";


        const bookingReference =
            payment.bookingReference ||
            booking?.bookingReference ||
            "—";


        const amount =
            formatMoney(
                payment.amount
            );


        const remainingBalance =
            formatMoney(
                booking?.remainingBalance ??
                0
            );


        sendReceiptMessage.value =
`We have received your payment for your upcoming trip.`; 



    }


    // STORE ACTIVE PAYMENT

    sendReceiptModal.dataset.paymentId =
        payment.id || "";


    // OPEN MODAL

    sendReceiptModal.classList.add(
        "show"
    );


    sendReceiptModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

}

// =====================================
// OPEN RECEIPT MODAL
// =====================================

function openReceiptModal(
    payment,
    booking
) {

    if (
        !payment ||
        !booking ||
        !paymentReceiptModal
    ) {
        return;
    }


    // ---------------------------------
    // PAYMENT REFERENCE
    // ---------------------------------

    if (receiptPaymentReference) {

        receiptPaymentReference.textContent =
            payment.paymentReference ||
            "—";

    }

    


    // ---------------------------------
    // CUSTOMER
    // ---------------------------------

    if (receiptCustomer) {

        receiptCustomer.textContent =
            payment.customerName ||
            booking.customerName ||
            "—";

    }


    // ---------------------------------
    // BOOKING REFERENCE
    // ---------------------------------

    if (receiptBookingReference) {

        receiptBookingReference.textContent =
            payment.bookingReference ||
            booking.bookingReference ||
            "—";

    }


    // ---------------------------------
    // PACKAGE
    // ---------------------------------

    if (receiptPackage) {

        receiptPackage.textContent =
            payment.packageName ||
            booking.packageName ||
            "—";

    }


    // ---------------------------------
    // PAYMENT DATE
    // ---------------------------------

    if (receiptPaymentDate) {

        receiptPaymentDate.textContent =
            formatDate(
                payment.paymentDate
            );

    }


    // ---------------------------------
    // PAYMENT METHOD
    // ---------------------------------

    if (receiptPaymentMethod) {

        receiptPaymentMethod.textContent =
            getPaymentMethodLabel(
                payment.method
            );

    }


    // ---------------------------------
    // PAYMENT DETAILS
    // ---------------------------------

    if (receiptPaymentDetails) {

        const method =
            String(
                payment.method || ""
            )
                .trim()
                .toLowerCase();


        if (method === "cash") {

            receiptPaymentDetails.textContent =
                payment.receivedBy
                    ? `Received by: ${payment.receivedBy}`
                    : "Received by: —";

        } else {

            receiptPaymentDetails.textContent =
                payment.transactionReference
                    ? `Reference: ${payment.transactionReference}`
                    : "Reference: —";

        }

    }


    // =================================
    // PAYMENT CALCULATION
    // =================================

    const currentPayment =
        normalizeNumber(
            payment.amount
        );


    /*
     * Get all valid payments belonging
     * to this booking.
     */

    const validBookingPayments =
        payments.filter(
            item => {

                const status =
                    String(
                        item.status || ""
                    )
                        .trim()
                        .toLowerCase();


                return (
                    item.bookingId ===
                        payment.bookingId &&
                    status !== "void" &&
                    status !== "cancelled" &&
                    status !== "refunded"
                );

            }
        );


    /*
     * Total amount paid including
     * the current payment.
     */

    const calculatedTotalPaid =
        validBookingPayments.reduce(
            (
                total,
                item
            ) =>
                total +
                normalizeNumber(
                    item.amount
                ),
            0
        );


    /*
     * Previous payments exclude
     * the current receipt payment.
     */

    const previousPayments =
        validBookingPayments
            .filter(
                item =>
                    item.id !==
                    payment.id
            )
            .reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    normalizeNumber(
                        item.amount
                    ),
                0
            );


    const bookingTotal =
        normalizeNumber(
            booking.totalAmount
        );


    const remainingBalance =
        Math.max(
            0,
            bookingTotal -
            calculatedTotalPaid
        );

    // =================================
// RECEIPT PAYMENT STATUS
// =================================

if (receiptPaymentStatus) {

    const originalStatus =
        String(
            payment.status || ""
        )
            .trim()
            .toLowerCase();


    let receiptStatus =
        "pending";


    // Cancelled / Void override everything

    if (
        originalStatus === "cancelled" ||
        originalStatus === "canceled"
    ) {

        receiptStatus =
            "cancelled";

    } else if (
        originalStatus === "void"
    ) {

        receiptStatus =
            "void";

    } else if (
        calculatedTotalPaid <= 0
    ) {

        receiptStatus =
            "pending";

    } else if (
        bookingTotal > 0 &&
        remainingBalance <= 0
    ) {

        receiptStatus =
            "paid";

    } else {

        receiptStatus =
            "partial";

    }


    receiptPaymentStatus.textContent =
        getPaymentStatusLabel(
            receiptStatus
        );


    receiptPaymentStatus.className =
        `receipt-status ${receiptStatus}`;

}


    // ---------------------------------
    // THIS PAYMENT
    // ---------------------------------

    if (receiptAmount) {

        receiptAmount.textContent =
            `₱${formatMoney(
                currentPayment
            )}`;

    }


    // ---------------------------------
    // BOOKING TOTAL
    // ---------------------------------

    if (receiptBookingTotal) {

        receiptBookingTotal.textContent =
            `₱${formatMoney(
                bookingTotal
            )}`;

    }


    // ---------------------------------
    // PREVIOUS PAYMENTS
    // ---------------------------------

    const receiptPreviousPayments =
        document.getElementById(
            "receiptPreviousPayments"
        );


    if (receiptPreviousPayments) {

        receiptPreviousPayments.textContent =
            `₱${formatMoney(
                previousPayments
            )}`;

    }

    // ---------------------------------
// THIS PAYMENT - SUMMARY
// ---------------------------------

const receiptThisPayment =
    document.getElementById(
        "receiptThisPayment"
    );


if (receiptThisPayment) {

    receiptThisPayment.textContent =
        `₱${formatMoney(
            currentPayment
        )}`;

}


    // ---------------------------------
    // TOTAL PAID
    // ---------------------------------

    if (receiptTotalPaid) {

        receiptTotalPaid.textContent =
            `₱${formatMoney(
                calculatedTotalPaid
            )}`;

    }


    // ---------------------------------
    // REMAINING BALANCE
    // ---------------------------------

    if (receiptRemainingBalance) {

        receiptRemainingBalance.textContent =
            `₱${formatMoney(
                remainingBalance
            )}`;

    }


    // ---------------------------------
    // TRAVEL DATE
    // ---------------------------------

    const receiptTravelDate =
        document.getElementById(
            "receiptTravelDate"
        );


    if (receiptTravelDate) {

        const travelDate =
            booking.travelDate ||
            booking.tourDate ||
            booking.departureDate ||
            "";


        receiptTravelDate.textContent =
            travelDate
                ? formatDate(
                    travelDate
                )
                : "—";

    }


    // ---------------------------------
    // NUMBER OF GUESTS
    // ---------------------------------

    const receiptGuestCount =
        document.getElementById(
            "receiptGuestCount"
        );


    if (receiptGuestCount) {

        const guestCount =
            booking.numberOfGuests ??
            booking.guestCount ??
            booking.pax ??
            booking.numberOfPax ??
            "";


        receiptGuestCount.textContent =
            guestCount !== ""
                ? guestCount
                : "—";

    }


    // ---------------------------------
    // SHOW RECEIPT
    // ---------------------------------

    paymentReceiptModal.hidden = false;


    paymentReceiptModal.classList.add(
        "show"
    );


    paymentReceiptModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

    console.log(
    "RECEIPT BOOKING DATA:",
    booking
    );

    // =================================
// PROCESSED BY
// =================================

if (receiptProcessedBy) {

    receiptProcessedBy.textContent =
        payment.receivedBy ||
        payment.processedBy ||
        payment.recordedBy ||
        "Admin";

}


// =================================
// GENERATED DATE & TIME
// =================================

if (receiptGeneratedAt) {

    const generatedDate =
        new Date();

    receiptGeneratedAt.textContent =
        generatedDate.toLocaleString(
            "en-PH",
            {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            }
        );

}

    console.log(
        "RECEIPT OPENED:",
        {
            paymentReference:
                payment.paymentReference,

            currentPayment:
                currentPayment,

            previousPayments:
                previousPayments,

            totalPaid:
                calculatedTotalPaid,

            remainingBalance:
                remainingBalance
        }
    );

}


// =====================================
// CLOSE RECEIPT MODAL
// =====================================

function closePaymentReceiptModal() {

    if (!paymentReceiptModal) {
        return;
    }


    paymentReceiptModal.classList.remove(
        "show"
    );


    paymentReceiptModal.setAttribute(
        "aria-hidden",
        "true"
    );


    paymentReceiptModal.hidden = true;


    document.body.style.overflow =
        "";

}


// =====================================
// RECEIPT CLOSE BUTTON
// =====================================

closeReceiptModal
    ?.addEventListener(
        "click",
        closePaymentReceiptModal
    );


// =====================================
// CLOSE RECEIPT BY BACKDROP
// =====================================

paymentReceiptModal
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                paymentReceiptModal
            ) {

                closePaymentReceiptModal();

            }

        }
    );


// =====================================
// CLOSE RECEIPT WITH ESC
// =====================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            paymentReceiptModal
                ?.classList.contains(
                    "show"
                )
        ) {

            closePaymentReceiptModal();

        }

    }
);

// =====================================
// PRINT PAYMENT RECEIPT
// =====================================

printReceiptBtn
    ?.addEventListener(
        "click",
        () => {

            if (
                !paymentReceiptModal ||
                !paymentReceiptModal.classList.contains(
                    "show"
                )
            ) {

                return;

            }


            console.log(
                "PRINTING PAYMENT RECEIPT"
            );


            window.print();

        }
    );

    // =====================================
// SAVE PAYMENT RECEIPT AS PDF
// =====================================

saveReceiptBtn
    ?.addEventListener(
        "click",
        () => {

            if (
                !paymentReceiptModal ||
                !paymentReceiptModal.classList.contains(
                    "show"
                )
            ) {

                return;

            }


            const paymentReference =
                receiptPaymentReference
                    ?.textContent
                    ?.trim() ||
                "Payment-Receipt";


            /*
             * Temporarily change the page title.
             * Browsers normally use this as the
             * suggested PDF filename.
             */

            const originalTitle =
                document.title;


            document.title =
                `TripsWonder-Receipt-${paymentReference}`;


            console.log(
                "SAVE RECEIPT AS PDF:",
                paymentReference
            );


            /*
             * Restore the original title
             * after the print dialog closes.
             */

            const restoreTitle =
                () => {

                    document.title =
                        originalTitle;


                    window.removeEventListener(
                        "afterprint",
                        restoreTitle
                    );

                };


            window.addEventListener(
                "afterprint",
                restoreTitle
            );


            window.print();

        }
    );


// =====================================
// TABLE ACTIONS
// =====================================

paymentsTableBody
    ?.addEventListener(
        "click",
        async event => {

            // =============================
            // MORE ACTIONS BUTTON
            // =============================

            const moreButton =
                event.target.closest(
                    ".payment-more-button"
                );


            if (
                moreButton
            ) {

                event.stopPropagation();


                const paymentId =
                    moreButton.dataset.id;


                const targetMenu =
                    paymentsTableBody.querySelector(
                        `.payment-actions-menu[data-menu-id="${paymentId}"]`
                    );


                /*
                 * Close other open menus.
                 */

                paymentsTableBody
                    .querySelectorAll(
                        ".payment-actions-menu.show"
                    )
                    .forEach(
                        menu => {

                            if (
                                menu !== targetMenu
                            ) {

                                menu.classList.remove(
                                    "show"
                                );

                            }

                        }
                    );


                /*
                 * Toggle selected menu.
                 */

                targetMenu
                    ?.classList.toggle(
                        "show"
                    );


                return;

            }


            // =============================
            // VIEW DETAILS
            // =============================

            const viewButton =
                event.target.closest(
                    ".view-payment"
                );


            if (
                viewButton
            ) {

                closePaymentActionMenus();


                openPaymentDetails(
                    viewButton.dataset.id
                );


                return;

            }


            // =============================
            // EDIT PAYMENT
            // =============================

            const editButton =
                event.target.closest(
                    ".edit-payment"
                );


            if (
                editButton
            ) {

                closePaymentActionMenus();


                openEditPayment(
                    editButton.dataset.id
                );


                return;

            }


            // =============================
            // VOID PAYMENT
            // =============================

            const voidButton =
    event.target.closest(
        ".void-payment"
    );


if (
    voidButton
) {

    closePaymentActionMenus();


    const paymentIdValue =
        voidButton.dataset.id;


    const payment =
        payments.find(
            item =>
                item.id ===
                paymentIdValue
        );


    if (!payment) {

        alert(
            "Payment record not found."
        );

        return;

    }


    if (
        payment.status === "void"
    ) {

        alert(
            "This payment is already void."
        );

        return;

    }


    const voidReason =
        prompt(
            "Enter reason for voiding this payment:"
        );


    if (
        voidReason === null
    ) {

        return;

    }


    const cleanedVoidReason =
        String(
            voidReason
        ).trim();


    if (
        !cleanedVoidReason
    ) {

        alert(
            "Void reason is required."
        );

        return;

    }


    const confirmed =
        confirm(
            `Void payment ${payment.paymentReference || ""} worth ₱${formatMoney(payment.amount)}?`
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        const now =
            new Date()
                .toISOString();


        await updateDoc(
            doc(
                db,
                "payments",
                payment.id
            ),
            {

                status:
                    "void",

                voidReason:
                    cleanedVoidReason,

                voidedAt:
                    now,

                updatedAt:
                    now

            }
        );


        // Update local payment state

        payment.status =
            "void";

        payment.voidReason =
            cleanedVoidReason;

        payment.voidedAt =
            now;

        payment.updatedAt =
            now;


        // Recalculate booking totals

        await recalculateBookingPayment(
            payment.bookingId
        );


        renderPayments();

        updatePaymentSummary();


        alert(
            "Payment voided successfully."
        );


        console.log(
            "PAYMENT VOIDED:",
            {
                paymentReference:
                    payment.paymentReference,

                amount:
                    payment.amount,

                reason:
                    cleanedVoidReason
            }
        );

    }

    catch (error) {

        console.error(
            "FAILED TO VOID PAYMENT:",
            error
        );


        alert(
            "Unable to void payment. Please try again."
        );

    }


    return;

}

            // =============================
// CANCEL PAYMENT
// =============================

const cancelButton =
    event.target.closest(
        ".cancel-payment"
    );


if (
    cancelButton
) {

    closePaymentActionMenus();


    const paymentIdValue =
        cancelButton.dataset.id;


    const payment =
        payments.find(
            item =>
                item.id ===
                paymentIdValue
        );


    if (!payment) {

        alert(
            "Payment record not found."
        );

        return;

    }


    if (
        payment.status === "cancelled"
    ) {

        alert(
            "This payment is already cancelled."
        );

        return;

    }


    if (
        payment.status === "void"
    ) {

        alert(
            "A void payment cannot be cancelled."
        );

        return;

    }


    const cancelReason =
        prompt(
            "Enter reason for cancelling this payment:"
        );


    if (
        cancelReason === null
    ) {

        return;

    }


    const cleanedCancelReason =
        String(
            cancelReason
        ).trim();


    if (
        !cleanedCancelReason
    ) {

        alert(
            "Cancellation reason is required."
        );

        return;

    }


    const confirmed =
        confirm(
            `Cancel payment ${payment.paymentReference || ""} worth ₱${formatMoney(payment.amount)}?`
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        const now =
            new Date()
                .toISOString();


        await updateDoc(
            doc(
                db,
                "payments",
                payment.id
            ),
            {

                status:
                    "cancelled",

                cancelReason:
                    cleanedCancelReason,

                cancelledAt:
                    now,

                updatedAt:
                    now

            }
        );


        // Update local payment state

        payment.status =
            "cancelled";

        payment.cancelReason =
            cleanedCancelReason;

        payment.cancelledAt =
            now;

        payment.updatedAt =
            now;


        // Recalculate booking payment totals

        await recalculateBookingPayment(
            payment.bookingId
        );


        renderPayments();

        updatePaymentSummary();


        alert(
            "Payment cancelled successfully."
        );


        console.log(
            "PAYMENT CANCELLED:",
            {
                paymentReference:
                    payment.paymentReference,

                amount:
                    payment.amount,

                reason:
                    cleanedCancelReason
            }
        );

    } catch (error) {

        console.error(
            "FAILED TO CANCEL PAYMENT:",
            error
        );


        alert(
            "Unable to cancel payment. Please try again."
        );

    }


    return;

}


// =============================
// GENERATE RECEIPT
// =============================

const generateReceiptButton =
    event.target.closest(
        ".generate-receipt"
    );


if (
    generateReceiptButton
) {

    closePaymentActionMenus();


    const paymentIdValue =
        generateReceiptButton.dataset.id;


    const payment =
        payments.find(
            item =>
                item.id ===
                paymentIdValue
        );


    if (!payment) {

        alert(
            "Payment record not found."
        );

        return;

    }


    // ---------------------------------
    // BLOCK VOID / CANCELLED PAYMENTS
    // ---------------------------------

    const currentStatus =
        String(
            payment.status ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        currentStatus === "void"
    ) {

        alert(
            "Receipt cannot be generated for a void payment."
        );

        return;

    }


    if (
        currentStatus === "cancelled"
    ) {

        alert(
            "Receipt cannot be generated for a cancelled payment."
        );

        return;

    }


    // ---------------------------------
    // FIND CONNECTED BOOKING
    // ---------------------------------

    const booking =
        getBookingById(
            payment.bookingId
        );


    if (!booking) {

        alert(
            "Connected booking record not found."
        );

        return;

    }


    console.log(
    "GENERATE RECEIPT DATA:",
    {
        payment:
            payment,

        booking:
            booking
    }
);


openReceiptModal(
    payment,
    booking
);


return;

}

    // =============================
    // SEND RECEIPT
    // =============================

            const sendReceiptButton =
            event.target.closest(
                ".send-receipt"
        );


        if (sendReceiptButton) {

            closePaymentActionMenus();


            const paymentIdValue =
            sendReceiptButton.dataset.id;


    const payment =
        payments.find(
            item =>
                item.id ===
                paymentIdValue
        );


    if (!payment) {

        alert(
            "Payment record not found."
        );

        return;

    }


    const booking =
        bookings.find(
            item =>
                item.bookingReference ===
                payment.bookingReference
        );


    if (!booking) {

        alert(
            "Booking record not found."
        );

        return;

    }


    openSendReceiptModal(
        payment,
        booking
    );


    return;

}

        }
    );

// =====================================
// CONFIRM SEND RECEIPT
// =====================================

confirmSendReceiptBtn
    ?.addEventListener(
        "click",
        async () => {

            const paymentIdValue =
                sendReceiptModal
                    ?.dataset
                    .paymentId ||
                "";

            const recipient =
                String(
                    sendReceiptRecipient
                        ?.value ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            const message =
                String(
                    sendReceiptMessage
                        ?.value ||
                    ""
                ).trim();


            if (!paymentIdValue) {

                alert(
                    "Payment record not found."
                );

                return;

            }


            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    .test(recipient)
            ) {

                alert(
                    "Please enter a valid recipient email."
                );

                sendReceiptRecipient
                    ?.focus();

                return;

            }


            const originalContent =
                confirmSendReceiptBtn
                    .innerHTML;


            confirmSendReceiptBtn.disabled =
                true;


            confirmSendReceiptBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Sending...
            `;


            try {

                const sendPaymentReceipt =
                    httpsCallable(
                        functions,
                        "sendPaymentReceipt"
                    );


                const result =
                    await sendPaymentReceipt(
                        {
                            paymentId:
                                paymentIdValue,

                            recipient:
                                recipient,

                            message:
                                message
                        }
                    );


                alert(
                    result.data?.message ||
                    "Payment receipt sent successfully."
                );


                closeSendReceipt();


                await loadPayments();

            } catch (error) {

                console.error(
                    "SEND RECEIPT ERROR:",
                    error
                );


                alert(
                    error.message ||
                    "Unable to send the payment receipt."
                );

            } finally {

                confirmSendReceiptBtn.disabled =
                    false;


                confirmSendReceiptBtn.innerHTML =
                    originalContent;

            }

        }
    );

    // =====================================
// CLOSE SEND RECEIPT MODAL
// =====================================

function closeSendReceipt() {

    if (!sendReceiptModal) {
        return;
    }


    sendReceiptModal.classList.remove(
        "show"
    );


    sendReceiptModal.setAttribute(
        "aria-hidden",
        "true"
    );


    sendReceiptModal.dataset.paymentId =
        "";


    document.body.style.overflow =
        "";

}


// X BUTTON

closeSendReceiptModal
    ?.addEventListener(
        "click",
        closeSendReceipt
    );


// CANCEL BUTTON

cancelSendReceiptBtn
    ?.addEventListener(
        "click",
        closeSendReceipt
    );


// CLICK OUTSIDE

sendReceiptModal
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                sendReceiptModal
            ) {

                closeSendReceipt();

            }

        }
    );

    // =====================================
// CLOSE PAYMENT ACTION MENUS
// =====================================

function closePaymentActionMenus() {

    paymentsTableBody
        ?.querySelectorAll(
            ".payment-actions-menu.show"
        )
        .forEach(
            menu => {

                menu.classList.remove(
                    "show"
                );

            }
        );

}

// =====================================
// CLOSE ACTION MENU ON OUTSIDE CLICK
// =====================================

document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".payment-actions"
            )
        ) {

            closePaymentActionMenus();

        }

    }
);
                    // =====================================
        // GENERATE PAYMENT REFERENCE
        // =====================================

        function generatePaymentReference() {

            const year =
                new Date().getFullYear();


            let highestNumber =
                0;


            payments.forEach(
                payment => {

                    const reference =
                        String(
                            payment.paymentReference ||
                            ""
                        );


                    const match =
                        reference.match(
                            /^PAY-\d{4}-(\d{6})$/
                        );


                    if (!match) {
                        return;
                    }


                    const number =
                        Number(
                            match[1]
                        );


                    if (
                        Number.isFinite(
                            number
                        ) &&
                        number >
                        highestNumber
                    ) {

                        highestNumber =
                            number;

                    }

                }
            );


            const nextNumber =
                highestNumber + 1;


            return `PAY-${year}-${String(
                nextNumber
            ).padStart(
                6,
                "0"
            )}`;

        }


        // =====================================
        // OPEN EDIT PAYMENT
        // =====================================

        function openEditPayment(
            paymentIdValue
        ) {

            const payment =
                payments.find(
                    item =>
                        item.id ===
                        paymentIdValue
                );


            if (
                !payment ||
                !paymentModal
            ) {
                return;
            }


            editingPaymentId =
                payment.id;


            if (
                paymentId
            ) {

                paymentId.value =
                    payment.id;

            }


            if (
                paymentBooking
            ) {

                paymentBooking.value =
                    payment.bookingId ||
                    "";

            }


            if (
                paymentCustomer
            ) {

                paymentCustomer.value =
                    payment.customerName ||
                    "";

            }


            if (
                paymentAmount
            ) {

                paymentAmount.value =
                    payment.amount;

            }


            if (
                paymentMethod
            ) {

                paymentMethod.value =
                    payment.method ||
                    "";

            }


            if (
                paymentReference
            ) {

                paymentReference.value =
                    payment.transactionReference ||
                    "";

            }


            if (
                paymentDate
            ) {

                paymentDate.value =
                    payment.paymentDate ||
                    getTodayInputValue();

            }


            if (
                paymentStatus
            ) {

                paymentStatus.value =
                    payment.status ||
                    "paid";

            }


            if (
                paymentNotes
            ) {

                paymentNotes.value =
                    payment.notes ||
                    "";

            }


            if (
                paymentModalTitle
            ) {

                paymentModalTitle.textContent =
                    "Edit Payment";

            }


            paymentModal.classList.add(
                "show"
            );


            paymentModal.setAttribute(
                "aria-hidden",
                "false"
            );


            document.body.style.overflow =
                "hidden";

        }


        // =====================================
        // GET EFFECTIVE PAYMENT AMOUNT
        // =====================================

        function getEffectivePaymentAmount(
            payment
        ) {

            if (!payment) {
                return 0;
            }


            /*
             * Paid and Partial records count
             * toward the booking's Amount Paid.
             *
             * Pending, Cancelled and Refunded
             * do not count as collected money.
             */

            if (
                payment.status ===
                    "paid" ||
                payment.status ===
                    "partial"
            ) {

                return normalizeNumber(
                    payment.amount
                );

            }


            return 0;

        }


        // =====================================
        // RECALCULATE BOOKING PAYMENT TOTALS
        // =====================================

        async function recalculateBookingPayment(
            bookingIdValue
        ) {

            if (!bookingIdValue) {
                return;
            }


            const booking =
                getBookingById(
                    bookingIdValue
                );


            if (!booking) {

                console.warn(
                    "BOOKING NOT FOUND FOR PAYMENT:",
                    bookingIdValue
                );

                return;

            }


            /*
             * payments[] already contains the
             * current local payment records.
             */

            const bookingPayments =
                payments.filter(
                    payment =>
                        payment.bookingId ===
                        bookingIdValue
                );


            const amountPaid =
                bookingPayments.reduce(
                    (
                        total,
                        payment
                    ) => {

                        return (
                            total +
                            getEffectivePaymentAmount(
                                payment
                            )
                        );

                    },
                    0
                );


            const totalAmount =
                normalizeNumber(
                    booking.totalAmount
                );


            const remainingBalance =
                Math.max(
                    0,
                    totalAmount -
                    amountPaid
                );


            let calculatedStatus =
                "unpaid";


            if (
                amountPaid > 0 &&
                remainingBalance > 0
            ) {

                calculatedStatus =
                    "partial";

            }


            if (
                totalAmount > 0 &&
                remainingBalance <= 0
            ) {

                calculatedStatus =
                    "paid";

            }


            /*
             * If Total Amount has not yet been
             * entered in the booking, we can
             * still show that money was received.
             */

            if (
                totalAmount <= 0 &&
                amountPaid > 0
            ) {

                calculatedStatus =
                    "partial";

            }


            await updateDoc(
                doc(
                    db,
                    "bookings",
                    bookingIdValue
                ),
                {

                    amountPaid:
                        amountPaid,

                    remainingBalance:
                        remainingBalance,

                    paymentStatus:
                        calculatedStatus,

                    updatedAt:
                        new Date()
                            .toISOString()

                }
            );


            // Update local booking state

            booking.amountPaid =
                amountPaid;


            booking.remainingBalance =
                remainingBalance;


            booking.paymentStatus =
                calculatedStatus;


            console.log(
                "BOOKING PAYMENT RECALCULATED:",
                {
                    bookingReference:
                        booking.bookingReference,

                    totalAmount:
                        totalAmount,

                    amountPaid:
                        amountPaid,

                    remainingBalance:
                        remainingBalance,

                    paymentStatus:
                        calculatedStatus
                }
            );

        }

        // =====================================
// OPEN CLIENT PAYMENT VERIFICATION
// =====================================

function openClientPaymentVerification(
    bookingIdValue
) {

    const booking =
        getBookingById(
            bookingIdValue
        );


    if (
        !booking ||
        !verifyPaymentModal
    ) {

        alert(
            "Booking record not found."
        );

        return;

    }


    if (
        booking.paymentStatus !==
        "pending_verification"
    ) {

        alert(
            "This payment is no longer waiting for verification."
        );

        return;

    }


    // STORE ACTIVE BOOKING

    verifyPaymentModal.dataset.bookingId =
        booking.id;


    // CUSTOMER

    if (
        verifyCustomerName
    ) {

        verifyCustomerName.textContent =
            booking.customerName ||
            "—";

    }


    // PACKAGE

    if (
        verifyPackageName
    ) {

        verifyPackageName.textContent =
            booking.packageName ||
            "—";

    }


    // TRAVEL DATE

    if (
        verifyTravelDate
    ) {

        verifyTravelDate.textContent =
            formatDate(
                booking.travelDate
            );

    }


    // GUEST COUNT

    if (
        verifyGuestCount
    ) {

        verifyGuestCount.textContent =
            booking.numberOfGuests ||
            "—";

    }


    // BOOKING TOTAL

    if (
        verifyBookingTotal
    ) {

        verifyBookingTotal.textContent =
            `₱${formatMoney(
                booking.totalAmount
            )}`;

    }


    // BOOKING STATUS

    if (
        verifyBookingStatus
    ) {

        verifyBookingStatus.textContent =
            capitalize(
                booking.bookingStatus
            ) ||
            "Pending";

    }


    // REQUIRED DEPOSIT

    if (
        verifyDepositAmount
    ) {

        verifyDepositAmount.textContent =
            `₱${formatMoney(
                booking.requiredDeposit
            )}`;

    }


    // PAYMENT METHOD

    if (
        verifyPaymentMethod
    ) {

        verifyPaymentMethod.textContent =
            getPaymentMethodLabel(
                booking.paymentMethod
            );

    }


    // TRANSACTION REFERENCE

    if (
        verifyTransactionReference
    ) {

        verifyTransactionReference.textContent =
            booking.transactionReference ||
            "—";

    }


    // CLEAR ADMIN NOTE

    if (
        verifyAdminNote
    ) {

        verifyAdminNote.value =
            "";

    }


    // OPEN MODAL

    verifyPaymentModal.classList.add(
        "show"
    );

    verifyPaymentModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";


    console.log(
        "CLIENT PAYMENT OPENED FOR REVIEW:",
        booking
    );

}


// =====================================
// CLOSE CLIENT PAYMENT VERIFICATION
// =====================================

function closeClientPaymentVerification() {

    if (
        !verifyPaymentModal
    ) {
        return;
    }


    verifyPaymentModal.classList.remove(
        "show"
    );

    verifyPaymentModal.setAttribute(
        "aria-hidden",
        "true"
    );

    verifyPaymentModal.dataset.bookingId =
        "";

    document.body.style.overflow =
        "";

}


// =====================================
// VERIFICATION TABLE CLICK
// =====================================

paymentVerificationTableBody
    ?.addEventListener(
        "click",
        event => {

            const reviewButton =
                event.target.closest(
                    ".review-payment-button"
                );


            if (
                !reviewButton
            ) {
                return;
            }


            openClientPaymentVerification(
                reviewButton.dataset.bookingId
            );

        }
    );

    // =====================================
// VERIFY & CONFIRM CLIENT PAYMENT
// =====================================

approveClientPaymentBtn
    ?.addEventListener(
        "click",
        async () => {

            const bookingIdValue =
                verifyPaymentModal
                    ?.dataset
                    .bookingId ||
                "";


            if (!bookingIdValue) {

                alert(
                    "Booking record not found."
                );

                return;

            }


            const booking =
                getBookingById(
                    bookingIdValue
                );


            if (!booking) {

                alert(
                    "Booking record not found."
                );

                return;

            }


            // =================================
            // MAKE SURE STILL PENDING
            // =================================

            if (
                booking.paymentStatus !==
                "pending_verification"
            ) {

                alert(
                    "This payment is no longer waiting for verification."
                );

                return;

            }


            // =================================
            // PAYMENT DETAILS
            // =================================

            const depositAmount =
                normalizeNumber(
                    booking.requiredDeposit
                );


            if (
                depositAmount <= 0
            ) {

                alert(
                    "Invalid deposit amount."
                );

                return;

            }


            const transactionReference =
                String(
                    booking.transactionReference ||
                    ""
                ).trim();


            const method =
                String(
                    booking.paymentMethod ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            if (!method) {

                alert(
                    "Payment method is missing."
                );

                return;

            }


            if (
                method !== "cash" &&
                !transactionReference
            ) {

                alert(
                    "Transaction reference is missing."
                );

                return;

            }


            // =================================
            // PREVENT DUPLICATE VERIFICATION
            // =================================

            const duplicatePayment =
                payments.find(
                    payment =>
                        payment.bookingId ===
                            booking.id &&
                        payment.transactionReference ===
                            transactionReference &&
                        payment.status !==
                            "void" &&
                        payment.status !==
                            "cancelled"
                );


            if (duplicatePayment) {

                alert(
                    "This client payment has already been recorded."
                );

                return;

            }


            // =================================
            // CONFIRM ADMIN ACTION
            // =================================

            const confirmed =
                confirm(
                    `Verify ₱${formatMoney(
                        depositAmount
                    )} payment from ${booking.customerName}?`
                );


            if (!confirmed) {
                return;
            }


            // =================================
            // BUTTON LOADING STATE
            // =================================

            const originalButtonContent =
                approveClientPaymentBtn
                    .innerHTML;


            approveClientPaymentBtn.disabled =
                true;


            if (rejectClientPaymentBtn) {

                rejectClientPaymentBtn.disabled =
                    true;

            }


            approveClientPaymentBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Verifying...
            `;


            try {

                const now =
                    new Date()
                        .toISOString();


                // =================================
                // GENERATE PAYMENT REFERENCE
                // =================================

                const newPaymentReference =
                    generatePaymentReference();


                // =================================
                // CREATE PAYMENT RECORD
                // =================================

                const paymentDocument =
                    await addDoc(
                        collection(
                            db,
                            "payments"
                        ),
                        {

                            paymentReference:
                                newPaymentReference,

                            bookingId:
                                booking.id,

                            bookingReference:
                                booking.bookingReference,

                            customerName:
                                booking.customerName,

                            customerEmail:
                                booking.customerEmail ||
                                "",

                            packageName:
                                booking.packageName,

                            amount:
                                depositAmount,

                            method:
                                method,

                            transactionReference:
                                method === "cash"
                                    ? ""
                                    : transactionReference,

                            receivedBy:
                                "",

                            paymentDate:
                                getTodayInputValue(),

                            status:
                                "partial",

                            notes:
                                String(
                                    verifyAdminNote
                                        ?.value ||
                                    ""
                                ).trim(),

                            source:
                                "client_booking",

                            createdAt:
                                now,

                            updatedAt:
                                now

                        }
                    );


                // =================================
                // ADD PAYMENT TO LOCAL STATE
                // =================================

                const newPayment = {

                    id:
                        paymentDocument.id,

                    paymentReference:
                        newPaymentReference,

                    bookingId:
                        booking.id,

                    bookingReference:
                        booking.bookingReference,

                    customerName:
                        booking.customerName,

                    customerEmail:
                        booking.customerEmail ||
                        "",

                    packageName:
                        booking.packageName,

                    amount:
                        depositAmount,

                    method:
                        method,

                    transactionReference:
                        method === "cash"
                            ? ""
                            : transactionReference,

                    receivedBy:
                        "",

                    paymentDate:
                        getTodayInputValue(),

                    status:
                        "partial",

                    notes:
                        String(
                            verifyAdminNote
                                ?.value ||
                            ""
                        ).trim(),

                    source:
                        "client_booking",

                    createdAt:
                        now,

                    updatedAt:
                        now

                };


                payments.push(
                    newPayment
                );


                // =================================
                // CALCULATE BOOKING BALANCE
                // =================================

                const bookingTotal =
                    normalizeNumber(
                        booking.totalAmount
                    );


                const amountPaid =
                    payments
                        .filter(
                            payment => {

                                const status =
                                    String(
                                        payment.status ||
                                        ""
                                    )
                                        .trim()
                                        .toLowerCase();


                                return (
                                    payment.bookingId ===
                                        booking.id &&
                                    status !== "void" &&
                                    status !== "cancelled" &&
                                    status !== "refunded" &&
                                    status !== "pending"
                                );

                            }
                        )
                        .reduce(
                            (
                                total,
                                payment
                            ) =>
                                total +
                                normalizeNumber(
                                    payment.amount
                                ),
                            0
                        );


                const remainingBalance =
                    Math.max(
                        0,
                        bookingTotal -
                        amountPaid
                    );


                const calculatedPaymentStatus =
                    remainingBalance <= 0
                        ? "paid"
                        : "partial";


                // =================================
                // UPDATE PAYMENT STATUS IF FULL
                // =================================

                if (
                    calculatedPaymentStatus ===
                    "paid"
                ) {

                    await updateDoc(
                        doc(
                            db,
                            "payments",
                            paymentDocument.id
                        ),
                        {
                            status:
                                "paid",

                            updatedAt:
                                now
                        }
                    );


                    newPayment.status =
                        "paid";

                }


                // =================================
                // UPDATE BOOKING
                // =================================

                await updateDoc(
                    doc(
                        db,
                        "bookings",
                        booking.id
                    ),
                    {

                        bookingStatus:
                            "confirmed",

                        paymentStatus:
                            calculatedPaymentStatus,

                        amountPaid:
                            amountPaid,

                        remainingBalance:
                            remainingBalance,

                        paymentVerified:
                            true,

                        paymentVerifiedAt:
                            now,

                        paymentVerificationNote:
                            String(
                                verifyAdminNote
                                    ?.value ||
                                ""
                            ).trim(),

                        updatedAt:
                            now

                    }
                );


                // =================================
                // UPDATE LOCAL BOOKING
                // =================================

                booking.bookingStatus =
                    "confirmed";

                booking.paymentStatus =
                    calculatedPaymentStatus;

                booking.amountPaid =
                    amountPaid;

                booking.remainingBalance =
                    remainingBalance;


                console.log(
                    "CLIENT PAYMENT VERIFIED:",
                    {
                        booking:
                            booking.bookingReference,

                        paymentReference:
                            newPaymentReference,

                        deposit:
                            depositAmount,

                        amountPaid:
                            amountPaid,

                        remainingBalance:
                            remainingBalance,

                        paymentStatus:
                            calculatedPaymentStatus
                    }
                );


                // =================================
                // CLOSE MODAL
                // =================================

                closeClientPaymentVerification();


                // =================================
                // RELOAD EVERYTHING
                // =================================

                await loadBookings();

                await loadPayments();


                alert(
                    `Payment verified successfully.\n\nPayment Reference: ${newPaymentReference}`
                );

            }

            catch (error) {

                console.error(
                    "CLIENT PAYMENT VERIFICATION ERROR:",
                    error
                );


                alert(
                    "Unable to verify the payment. Please check the console for details."
                );

            }

            finally {

                approveClientPaymentBtn.disabled =
                    false;


                approveClientPaymentBtn.innerHTML =
                    originalButtonContent;


                if (
                    rejectClientPaymentBtn
                ) {

                    rejectClientPaymentBtn.disabled =
                        false;

                }

            }

        }
    );

    // =====================================
// REJECT CLIENT PAYMENT
// =====================================

rejectClientPaymentBtn
    ?.addEventListener(
        "click",
        async () => {

            const bookingIdValue =
                verifyPaymentModal
                    ?.dataset
                    .bookingId ||
                "";


            if (!bookingIdValue) {

                alert(
                    "Booking record not found."
                );

                return;

            }


            const booking =
                getBookingById(
                    bookingIdValue
                );


            if (!booking) {

                alert(
                    "Booking record not found."
                );

                return;

            }


            if (
                booking.paymentStatus !==
                "pending_verification"
            ) {

                alert(
                    "This payment is no longer waiting for verification."
                );

                return;

            }


            const reason =
                prompt(
                    "Enter the reason for rejecting this payment:"
                );


            if (
                reason === null
            ) {

                return;

            }


            const cleanedReason =
                String(
                    reason
                ).trim();


            if (!cleanedReason) {

                alert(
                    "Rejection reason is required."
                );

                return;

            }


            const confirmed =
                confirm(
                    `Reject the submitted payment from ${booking.customerName}?`
                );


            if (!confirmed) {

                return;

            }


            const originalContent =
                rejectClientPaymentBtn
                    .innerHTML;


            rejectClientPaymentBtn.disabled =
                true;


            approveClientPaymentBtn.disabled =
                true;


            rejectClientPaymentBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Rejecting...
            `;


            try {

                const now =
                    new Date()
                        .toISOString();


                await updateDoc(
                    doc(
                        db,
                        "bookings",
                        booking.id
                    ),
                    {

                        paymentStatus:
                            "rejected",

                        bookingStatus:
                            "pending",

                        paymentVerified:
                            false,

                        paymentRejectedAt:
                            now,

                        paymentRejectionReason:
                            cleanedReason,

                        paymentVerificationNote:
                            String(
                                verifyAdminNote
                                    ?.value ||
                                ""
                            ).trim(),

                        updatedAt:
                            now

                    }
                );


                booking.paymentStatus =
                    "rejected";

                booking.bookingStatus =
                    "pending";


                console.log(
                    "CLIENT PAYMENT REJECTED:",
                    {
                        booking:
                            booking.bookingReference,

                        customer:
                            booking.customerName,

                        reason:
                            cleanedReason
                    }
                );


                closeClientPaymentVerification();


                await loadBookings();

                await loadPayments();


                alert(
                    "Payment rejected successfully."
                );

            }

            catch (error) {

                console.error(
                    "CLIENT PAYMENT REJECTION ERROR:",
                    error
                );


                alert(
                    "Unable to reject the payment. Please check the console for details."
                );

            }

            finally {

                rejectClientPaymentBtn.disabled =
                    false;


                rejectClientPaymentBtn.innerHTML =
                    originalContent;


                approveClientPaymentBtn.disabled =
                    false;

            }

        }
    );


// =====================================
// CLOSE VERIFY MODAL BUTTON
// =====================================

closeVerifyPaymentModal
    ?.addEventListener(
        "click",
        closeClientPaymentVerification
    );


// =====================================
// CLOSE VERIFY MODAL BY BACKDROP
// =====================================

verifyPaymentModal
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                verifyPaymentModal
            ) {

                closeClientPaymentVerification();

            }

        }
    );

        // =====================================
// PAYMENT METHOD CHANGE
// =====================================

paymentMethod
    ?.addEventListener(
        "change",
        () => {

            updatePaymentMethodFields();

        }
    );


        // =====================================
        // PAYMENT FORM SUBMIT
        // =====================================

        paymentForm
            ?.addEventListener(
                "submit",
                async event => {

                    event.preventDefault();


                    const selectedBooking =
                        getBookingById(
                            paymentBooking?.value
                        );


                    if (
                        !selectedBooking
                    ) {

                        alert(
                            "Please select a booking."
                        );

                        return;

                    }


                    const amount =
                        normalizeNumber(
                            paymentAmount?.value
                        );


                    if (
                        amount <= 0
                    ) {

                        alert(
                            "Please enter a valid payment amount."
                        );

                        paymentAmount?.focus();

                        return;

                    }


                    const method =
                        String(
                            paymentMethod?.value ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    if (!method) {

                        alert(
                            "Please select a payment method."
                        );

                        return;

                    }

                    // =========================================
// PAYMENT METHOD VALIDATION
// =========================================

const transactionReference =
    String(
        paymentReference?.value ||
        ""
    ).trim();


const receivedBy =
    String(
        paymentReceivedBy?.value ||
        ""
    ).trim();


// =========================================
// NON-CASH = REFERENCE REQUIRED
// =========================================

if (
    method !== "cash" &&
    !transactionReference
) {

    alert(
        "Please enter the payment reference number."
    );

    paymentReference?.focus();

    return;

}


// =========================================
// CASH = RECEIVED BY REQUIRED
// =========================================

if (
    method === "cash" &&
    !receivedBy
) {

    alert(
        "Please enter who received the cash payment."
    );

    paymentReceivedBy?.focus();

    return;

}


                    const status =
                        String(
                            paymentStatus?.value ||
                            "paid"
                        )
                            .trim()
                            .toLowerCase();


                    const allowedStatuses = [

                        "paid",

                        "partial",

                        "pending",

                        "cancelled",

                        "refunded"

                    ];


                    if (
                        !allowedStatuses.includes(
                            status
                        )
                    ) {

                        alert(
                            "Invalid payment status."
                        );

                        return;

                    }


                    const dateValue =
                        paymentDate?.value ||
                        getTodayInputValue();


                    const now =
                        new Date()
                            .toISOString();


                    /*
                     * Keep track of the old booking
                     * when editing. This matters if
                     * an existing payment is moved
                     * to another booking.
                     */

                    let previousBookingId =
                        null;


                    let existingPayment =
                        null;


                    if (
                        editingPaymentId
                    ) {

                        existingPayment =
                            payments.find(
                                item =>
                                    item.id ===
                                    editingPaymentId
                            ) || null;


                        previousBookingId =
                            existingPayment
                                ?.bookingId ||
                            null;

                    }


                    const paymentData = {

                        bookingId:
                            selectedBooking.id,

                        bookingReference:
                            selectedBooking.bookingReference,

                        customerName:
                            selectedBooking.customerName,

                        packageName:
                            selectedBooking.packageName,

                        amount:
                            amount,

                        method:
                            method,

                        transactionReference:
                        method === "cash"
                            ? ""
                            : transactionReference,

                        receivedBy:
                        method === "cash"
                            ? receivedBy
                            : "",

                        paymentDate:
                            dateValue,

                        status:
                            status,

                        notes:
                            String(
                                paymentNotes?.value ||
                                ""
                            ).trim(),

                        updatedAt:
                            now

                    };

                                        // =========================================
                    // OVERPAYMENT PROTECTION
                    // =========================================

                    /*
                     * Get the booking total.
                     */

                    const bookingTotal =
                        Number(
                            selectedBooking.totalAmount ||
                            selectedBooking.total ||
                            0
                        );


                    /*
                     * Calculate payments already recorded
                     * for this booking.
                     *
                     * When editing a payment, exclude the
                     * payment currently being edited so its
                     * old amount is not counted twice.
                     */

                    const alreadyPaid =
                        payments
                            .filter(payment => {

                                const sameBooking =
                                    payment.bookingId ===
                                    selectedBooking.id;

                                const notCurrentPayment =
                                    !editingPaymentId ||
                                    payment.id !==
                                        editingPaymentId;

                                return (
                                    sameBooking &&
                                    notCurrentPayment
                                );

                            })
                            .reduce(
                                (
                                    total,
                                    payment
                                ) =>
                                    total +
                                    Number(
                                        payment.amount ||
                                        0
                                    ),
                                0
                            );


                    const remainingBalance =
                        Math.max(
                            bookingTotal -
                            alreadyPaid,
                            0
                        );


                    console.log(
                        "PAYMENT VALIDATION:",
                        {
                            booking:
                                selectedBooking
                                    .bookingReference,

                            bookingTotal:
                                bookingTotal,

                            alreadyPaid:
                                alreadyPaid,

                            remainingBalance:
                                remainingBalance,

                            enteredAmount:
                                amount
                        }
                    );


                    /*
                     * Do not allow payment when the
                     * booking is already fully paid.
                     */

                    if (
                        remainingBalance <= 0
                    ) {

                        alert(
                            "This booking is already fully paid."
                        );

                        return;

                    }


                    /*
                     * Do not allow an amount greater
                     * than the remaining balance.
                     */

                    if (
                        amount >
                        remainingBalance
                    ) {

                        alert(
                            `Payment cannot exceed the remaining balance of ₱${remainingBalance.toLocaleString(
                                "en-PH",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                }
                            )}.`
                        );

                        return;

                    }


                    /*
                     * Disable Save button while
                     * Firestore is processing.
                     */

                    const submitButton =
                        paymentForm.querySelector(
                            'button[type="submit"]'
                        );


                    const originalButtonContent =
                        submitButton
                            ?.innerHTML;


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

                        // =============================
                        // EDIT EXISTING PAYMENT
                        // =============================

                        if (
                            editingPaymentId &&
                            existingPayment
                        ) {

                            await updateDoc(
                                doc(
                                    db,
                                    "payments",
                                    editingPaymentId
                                ),
                                {

                                    ...paymentData,

                                    paymentReference:
                                        existingPayment
                                            .paymentReference,

                                    createdAt:
                                        existingPayment
                                            .createdAt ||
                                        now

                                }
                            );


                            /*
                             * Update local payment
                             * before recalculating.
                             */

                            const localPaymentIndex =
                                payments.findIndex(
                                    item =>
                                        item.id ===
                                        editingPaymentId
                                );


                            if (
                                localPaymentIndex !==
                                -1
                            ) {

                                payments[
                                    localPaymentIndex
                                ] = {

                                    ...payments[
                                        localPaymentIndex
                                    ],

                                    ...paymentData,

                                    paymentReference:
                                        existingPayment
                                            .paymentReference

                                };

                            }


                            /*
                             * Recalculate the old
                             * booking if payment was
                             * moved to another booking.
                             */

                            if (
                                previousBookingId &&
                                previousBookingId !==
                                    selectedBooking.id
                            ) {

                                await recalculateBookingPayment(
                                    previousBookingId
                                );

                            }


                            await recalculateBookingPayment(
                                selectedBooking.id
                            );


                            console.log(
                                "PAYMENT UPDATED:",
                                existingPayment
                                    .paymentReference
                            );

                        }


                        // =============================
                        // CREATE NEW PAYMENT
                        // =============================

                        else {

                            const newPaymentReference =
                                generatePaymentReference();


                            const documentReference =
                                await addDoc(
                                    collection(
                                        db,
                                        "payments"
                                    ),
                                    {

                                        ...paymentData,

                                        paymentReference:
                                            newPaymentReference,

                                        createdAt:
                                            now

                                    }
                                );


                            /*
                             * Add new payment to local
                             * state before recalculating
                             * the booking.
                             */

                            payments.push({

                                id:
                                    documentReference.id,

                                ...paymentData,

                                paymentReference:
                                    newPaymentReference,

                                createdAt:
                                    now

                            });


                            await recalculateBookingPayment(
                                selectedBooking.id
                            );


                            console.log(
                                "NEW PAYMENT CREATED:",
                                {
                                    id:
                                        documentReference.id,

                                    reference:
                                        newPaymentReference,

                                    booking:
                                        selectedBooking
                                            .bookingReference
                                }
                            );

                        }


                        // =============================
                        // RELOAD DATA
                        // =============================

                        window.closePaymentModal();


                        await loadBookings();

                        await loadPayments();


                    } catch (error) {

                        console.error(
                            "PAYMENT SAVE ERROR:",
                            error
                        );


                        alert(
                            "Unable to save payment. Please check the console for details."
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

                    // =====================================
        // MODAL BACKDROP HANDLING
        // =====================================

        document.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    paymentModal
                ) {

                    window.closePaymentModal();

                }


                if (
                    event.target ===
                    paymentDetailsModal
                ) {

                    window.closePaymentDetails();

                }

            }
        );


        // =====================================
        // ESC KEY
        // =====================================

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key !==
                    "Escape"
                ) {
                    return;
                }


                window.closePaymentModal();

                window.closePaymentDetails();

            }
        );


        // =====================================
        // INITIAL LOAD
        // =====================================

        async function initializePayments() {

            showLoading({

                title:
                    "Loading Payments...",

                message:
                    "Please wait while we load payment records.",

                retry:
                    initializePayments

            });


            try {

                await loadBookings();

                await loadPayments();


                hideLoading();


                console.log(
                    "TWTMS PAYMENTS PAGE READY"
                );


            } catch (error) {

                console.error(
                    "PAYMENTS INITIALIZATION ERROR:",
                    error
                );


                showLoadingError(
                    navigator.onLine
                        ? "Unable to load payments. Please try again."
                        : "No internet connection. Please check your connection.",
                    initializePayments
                );

            }

        }


       // =====================================
// START MODULE
// =====================================

initializePayments();

});


// =====================================
// MODULE LOADED
// =====================================

console.log(
    "TWTMS PAYMENTS MODULE LOADED"
);
