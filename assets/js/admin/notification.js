"use strict";

/* =========================================================
   TRIPS WONDER
   ADMIN NOTIFICATIONS
   assets/js/admin/admin-notifications.js

   SOURCE OF TRUTH:
   - Client website bookings in Firestore "bookings"

   READ STATE:
   - Firestore "adminNotificationReads"

   IMPORTANT:
   - We do NOT ask the customer browser to create admin
     notification documents.
   - A website booking itself is the admin notification source.
   - This avoids duplicate notification records and keeps the
     booking collection as the source of truth.
========================================================= */

import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


const state = {
    user: null,
    profile: null,
    bookings: [],
    readIds: new Set(),
    selectedBookingId: null,
    search: "",
    filter: "all",
    unsubscribeBookings: null,
    unsubscribeReads: null
};


const notificationList =
    document.getElementById("notificationList");

const notificationSearch =
    document.getElementById("notificationSearch");

const notificationFilter =
    document.getElementById("notificationFilter");

const markAllReadBtn =
    document.getElementById("markAllReadBtn");

const totalNotifications =
    document.getElementById("totalNotifications");

const unreadNotifications =
    document.getElementById("unreadNotifications");

const todayNotifications =
    document.getElementById("todayNotifications");

const pendingBookings =
    document.getElementById("pendingBookings");

const headerBellBadge =
    document.getElementById("headerBellBadge");

const sidebarNotificationBadge =
    document.getElementById("sidebarNotificationBadge");

const detailEmpty =
    document.getElementById("detailEmpty");

const detailCard =
    document.getElementById("detailCard");

const detailTitle =
    document.getElementById("detailTitle");

const detailTime =
    document.getElementById("detailTime");

const detailMessage =
    document.getElementById("detailMessage");

const detailGrid =
    document.getElementById("detailGrid");

const viewBookingBtn =
    document.getElementById("viewBookingBtn");

const notificationPaymentReview =
    document.getElementById("notificationPaymentReview");

const notificationPaymentState =
    document.getElementById("notificationPaymentState");

const notificationAdminNoteWrap =
    document.getElementById("notificationAdminNoteWrap");

const notificationAdminNote =
    document.getElementById("notificationAdminNote");

const notificationPaymentActions =
    document.getElementById("notificationPaymentActions");

const declineNotificationPaymentBtn =
    document.getElementById("declineNotificationPaymentBtn");

const confirmNotificationPaymentBtn =
    document.getElementById("confirmNotificationPaymentBtn");

const notificationPaymentResult =
    document.getElementById("notificationPaymentResult");

const adminName =
    document.getElementById("adminName");

const adminRole =
    document.getElementById("adminRole");

const logoutBtn =
    document.getElementById("logoutBtn");


onAuthStateChanged(
    auth,
    async user => {

        if (!user) {
            window.location.href = "../../index.html";
            return;
        }

        try {

            const userSnapshot =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );

            if (!userSnapshot.exists()) {
                throw new Error(
                    "Admin profile was not found."
                );
            }

            const profile =
                userSnapshot.data();

            const role =
                normalizeLower(
                    profile.role
                );

            if (
                role !== "owner" &&
                role !== "admin"
            ) {
                window.location.href =
                    "../../index.html";
                return;
            }

            state.user =
                user;

            state.profile =
                profile;

            renderAdminIdentity();

            subscribeReadState();

            subscribeWebsiteBookings();

        } catch (error) {

            console.error(
                "ADMIN NOTIFICATIONS AUTH ERROR:",
                error
            );

            renderLoadError(
                "Unable to open Admin Notifications."
            );
        }
    }
);


function subscribeWebsiteBookings() {

    state.unsubscribeBookings?.();

    state.unsubscribeBookings =
        onSnapshot(
            collection(
                db,
                "bookings"
            ),
            snapshot => {

                state.bookings =
                    snapshot.docs
                        .map(
                            item => ({
                                id:
                                    item.id,
                                ...item.data()
                            })
                        )
                        .filter(
                            isClientWebsiteBooking
                        )
                        .sort(
                            (
                                first,
                                second
                            ) =>
                                timeValue(
                                    second.createdAt
                                ) -
                                timeValue(
                                    first.createdAt
                                )
                        );

                syncUI();
            },
            error => {

                console.error(
                    "ADMIN BOOKING NOTIFICATION LISTENER ERROR:",
                    error
                );

                renderLoadError(
                    "Unable to load booking notifications."
                );
            }
        );
}


function subscribeReadState() {

    state.unsubscribeReads?.();

    const readQuery =
        query(
            collection(
                db,
                "adminNotificationReads"
            ),
            where(
                "adminUid",
                "==",
                state.user.uid
            )
        );

    state.unsubscribeReads =
        onSnapshot(
            readQuery,
            snapshot => {

                state.readIds =
                    new Set(
                        snapshot.docs
                            .map(
                                item =>
                                    item.data()
                                        ?.notificationKey
                            )
                            .filter(Boolean)
                    );

                syncUI();
            },
            error => {

                console.error(
                    "ADMIN NOTIFICATION READ LISTENER ERROR:",
                    error
                );
            }
        );
}


function isClientWebsiteBooking(
    booking
) {

    const bookingSource =
        normalizeLower(
            booking.bookingSource
        );

    const source =
        normalizeLower(
            booking.source
        );

    return (
        bookingSource === "website" ||
        source === "client_booking_form"
    );
}


function notificationKey(
    bookingId
) {

    return `booking:${bookingId}`;
}


function isRead(
    booking
) {

    return state.readIds.has(
        notificationKey(
            booking.id
        )
    );
}


function syncUI() {

    renderStats();

    renderNotifications();

    renderSelectedDetail();

    updateBadges();
}


function renderStats() {

    const all =
        state.bookings;

    const unread =
        all.filter(
            booking =>
                !isRead(
                    booking
                )
        );

    const today =
        all.filter(
            booking =>
                isToday(
                    booking.createdAt
                )
        );

    const pending =
        all.filter(
            booking =>
                normalizeLower(
                    booking.bookingStatus
                ) === "pending"
        );

    if (totalNotifications) {
        totalNotifications.textContent =
            String(
                all.length
            );
    }

    if (unreadNotifications) {
        unreadNotifications.textContent =
            String(
                unread.length
            );
    }

    if (todayNotifications) {
        todayNotifications.textContent =
            String(
                today.length
            );
    }

    if (pendingBookings) {
        pendingBookings.textContent =
            String(
                pending.length
            );
    }

    if (markAllReadBtn) {
        markAllReadBtn.hidden =
            unread.length === 0;
    }
}


function updateBadges() {

    const count =
        state.bookings.filter(
            booking =>
                !isRead(
                    booking
                )
        ).length;

    setBadge(
        headerBellBadge,
        count
    );

    setBadge(
        sidebarNotificationBadge,
        count
    );
}


function setBadge(
    element,
    count
) {

    if (!element) {
        return;
    }

    const safeCount =
        Math.max(
            0,
            Number(
                count || 0
            )
        );

    element.textContent =
        safeCount > 99
            ? "99+"
            : String(
                safeCount
            );

    element.hidden =
        safeCount === 0;
}


function visibleBookings() {

    const search =
        state.search;

    return state.bookings.filter(
        booking => {

            const read =
                isRead(
                    booking
                );

            const status =
                normalizeLower(
                    booking.bookingStatus ||
                    "pending"
                );

            if (
                state.filter === "unread" &&
                read
            ) {
                return false;
            }

            if (
                state.filter === "pending" &&
                status !== "pending"
            ) {
                return false;
            }

            if (
                state.filter === "confirmed" &&
                status !== "confirmed"
            ) {
                return false;
            }

            if (!search) {
                return true;
            }

            const haystack =
                [
                    booking.customerName,
                    booking.customerEmail,
                    booking.customerContact,
                    booking.packageName,
                    booking.packageLocation,
                    booking.bookingReference,
                    booking.bookingNumber,
                    booking.paymentReference,
                    booking.bookingStatus,
                    booking.paymentStatus
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

            return haystack.includes(
                search
            );
        }
    );
}


function renderNotifications() {

    if (!notificationList) {
        return;
    }

    const visible =
        visibleBookings();

    if (!visible.length) {

        notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="fa-regular fa-bell-slash"></i>
                <strong>No notifications found</strong>
                <span>
                    New client website bookings will appear here automatically.
                </span>
            </div>
        `;

        return;
    }

    notificationList.innerHTML =
        visible
            .map(
                booking =>
                    notificationItemHTML(
                        booking
                    )
            )
            .join("");

    notificationList
        .querySelectorAll(
            "[data-booking-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openNotification(
                            button.dataset
                                .bookingId
                        );
                    }
                );
            }
        );
}


function notificationItemHTML(
    booking
) {

    const unread =
        !isRead(
            booking
        );

    const selected =
        state.selectedBookingId ===
        booking.id;

    const customerName =
        clean(
            booking.customerName
        ) ||
        "Customer";

    const packageName =
        clean(
            booking.packageName
        ) ||
        "Tour Package";

    const reference =
        booking.bookingReference ||
        booking.bookingNumber ||
        booking.id;

    return `
        <button
            type="button"
            class="notification-item${unread ? " unread" : ""}${selected ? " selected" : ""}"
            data-booking-id="${escapeAttr(
                booking.id
            )}">

            <span class="item-icon">
                <i class="fa-regular fa-calendar-plus"></i>
            </span>

            <span class="item-copy">
                <h3>
                    New Booking Request
                </h3>

                <p>
                    ${escapeHTML(
                        customerName
                    )} submitted a booking for
                    ${escapeHTML(
                        packageName
                    )}.
                </p>

                <span class="item-reference">
                    ${escapeHTML(
                        reference
                    )}
                </span>
            </span>

            <span class="item-meta">
                ${escapeHTML(
                    formatListTime(
                        booking.createdAt
                    )
                )}

                ${
                    unread
                        ? '<span class="unread-dot" aria-label="Unread"></span>'
                        : ""
                }
            </span>

        </button>
    `;
}


async function openNotification(
    bookingId
) {

    const booking =
        state.bookings.find(
            item =>
                item.id ===
                bookingId
        );

    if (!booking) {
        return;
    }

    state.selectedBookingId =
        booking.id;

    renderNotifications();

    renderSelectedDetail();

    // Keep the selected notification detail at the top of its own panel.
    // This prevents the user from seeing the old empty-state position
    // or a previously scrolled lower section when opening another item.
    const detailPanel =
        detailCard?.closest(
            ".notification-detail-panel"
        );

    if (detailPanel) {
        detailPanel.scrollTop = 0;
    }

    if (!isRead(booking)) {

        try {

            await markRead(
                booking
            );

        } catch (error) {

            console.warn(
                "UNABLE TO MARK ADMIN NOTIFICATION READ:",
                error
            );
        }
    }
}


function renderSelectedDetail() {

    const booking =
        state.bookings.find(
            item =>
                item.id ===
                state.selectedBookingId
        );

    if (!booking) {

        if (detailEmpty) {
            detailEmpty.hidden =
                false;
            detailEmpty.style.removeProperty(
                "display"
            );
        }

        if (detailCard) {
            detailCard.hidden =
                true;
            detailCard.style.display =
                "none";
        }

        return;
    }

    if (detailEmpty) {
        detailEmpty.hidden =
            true;

        // Force the empty state completely out of layout.
        // Some page CSS can override the browser's default [hidden] rule.
        detailEmpty.style.display =
            "none";
    }

    if (detailCard) {
        detailCard.hidden =
            false;

        // Remove any stale inline hiding before showing the selected detail.
        detailCard.style.removeProperty(
            "display"
        );
    }

    const customerName =
        clean(
            booking.customerName
        ) ||
        "Customer";

    const packageName =
        clean(
            booking.packageName
        ) ||
        "Tour Package";

    const reference =
        booking.bookingReference ||
        booking.bookingNumber ||
        booking.id;

    if (detailTitle) {
        detailTitle.textContent =
            `${customerName} • ${packageName}`;
    }

    if (detailTime) {
        detailTime.textContent =
            formatDateTime(
                booking.createdAt
            );
    }

    if (detailMessage) {
        detailMessage.textContent =
            `${customerName} submitted a new booking request through the Trips Wonder customer website. Review the booking and verify the submitted payment reference before confirming the reservation.`;
    }

    const rows = [
        [
            "Booking Reference",
            reference
        ],
        [
            "Customer",
            customerName
        ],
        [
            "Destination / Package",
            packageName
        ],
        [
            "Travel Date",
            booking.travelStartDate ||
            booking.travelDate ||
            "—"
        ],
        [
            "Pax",
            booking.totalPax ||
            booking.pax ||
            "—"
        ],
        [
            "Payment Status",
            readableStatus(
                booking.paymentStatus ||
                "pending_verification"
            )
        ],
        [
            "Booking Status",
            readableStatus(
                booking.bookingStatus ||
                "pending"
            )
        ],
        [
            "Payment Reference",
            booking.paymentReference ||
            "—"
        ]
    ];

    if (detailGrid) {
        detailGrid.innerHTML =
            rows
                .map(
                    ([label, value]) => `
                        <div class="detail-row">
                            <span>
                                ${escapeHTML(
                                    label
                                )}
                            </span>

                            <strong>
                                ${escapeHTML(
                                    value
                                )}
                            </strong>
                        </div>
                    `
                )
                .join("");
    }

    renderPaymentReview(
        booking
    );
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


function getTodayInputValue() {
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

    return `${year}-${month}-${day}`;
}


function generatePaymentReference() {
    const now =
        new Date();

    const stamp =
        [
            now.getFullYear(),
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            ),
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            )
        ].join("");

    const random =
        Math.random()
            .toString(
                36
            )
            .slice(
                2,
                7
            )
            .toUpperCase();

    return `TWP-${stamp}-${random}`;
}


function isPaymentAwaitingVerification(
    booking
) {
    const status =
        normalizeLower(
            booking.paymentStatus
        );

    const source =
        normalizeLower(
            booking.bookingSource ||
            booking.source
        );

    const method =
        clean(
            booking.paymentMethod
        );

    const reference =
        clean(
            booking.paymentReference ||
            booking.transactionReference ||
            booking.referenceNumber
        );

    if (
        status ===
        "pending_verification"
    ) {
        return true;
    }

    const compatibleStatus =
        status === "unpaid" ||
        status === "pending";

    const isWebsiteBooking =
        source === "website" ||
        source === "client_booking_form";

    return (
        isWebsiteBooking &&
        Boolean(method) &&
        Boolean(reference) &&
        booking.paymentVerified !== true &&
        compatibleStatus
    );
}


function renderPaymentReview(
    booking
) {
    if (!notificationPaymentReview) {
        return;
    }

    const paymentStatus =
        normalizeLower(
            booking.paymentStatus
        );

    const awaiting =
        isPaymentAwaitingVerification(
            booking
        );

    const confirmed =
        booking.paymentVerified === true ||
        paymentStatus === "paid" ||
        paymentStatus === "partial";

    const rejected =
        paymentStatus === "rejected";

    notificationPaymentReview.hidden =
        false;

    if (notificationPaymentState) {
        notificationPaymentState.classList.remove(
            "confirmed",
            "rejected"
        );

        if (awaiting) {
            notificationPaymentState.textContent =
                "Pending Verification";
        } else if (rejected) {
            notificationPaymentState.textContent =
                "Rejected";
            notificationPaymentState.classList.add(
                "rejected"
            );
        } else if (confirmed) {
            notificationPaymentState.textContent =
                "Verified";
            notificationPaymentState.classList.add(
                "confirmed"
            );
        } else {
            notificationPaymentState.textContent =
                readableStatus(
                    booking.paymentStatus ||
                    "No Action Required"
                );
        }
    }

    if (notificationPaymentActions) {
        notificationPaymentActions.hidden =
            !awaiting;
        notificationPaymentActions.style.display =
            awaiting ? "" : "none";
    }

    if (notificationAdminNoteWrap) {
        notificationAdminNoteWrap.hidden =
            !awaiting;
        notificationAdminNoteWrap.style.display =
            awaiting ? "" : "none";
    }

    if (notificationAdminNote) {
        notificationAdminNote.value =
            "";
    }

    if (notificationPaymentResult) {
        notificationPaymentResult.hidden =
            true;
        notificationPaymentResult.className =
            "notification-payment-result";
        notificationPaymentResult.textContent =
            "";

        if (rejected) {
            notificationPaymentResult.hidden =
                false;
            notificationPaymentResult.classList.add(
                "rejected"
            );
            notificationPaymentResult.textContent =
                booking.paymentRejectionReason
                    ? `Payment rejected: ${booking.paymentRejectionReason}`
                    : "Payment was rejected.";
        } else if (confirmed) {
            notificationPaymentResult.hidden =
                false;
            notificationPaymentResult.classList.add(
                "confirmed"
            );
            notificationPaymentResult.textContent =
                "Payment has already been verified.";
        }
    }
}


async function getExistingPayments() {
    const snapshot =
        await getDocs(
            collection(
                db,
                "payments"
            )
        );

    return snapshot.docs.map(
        item => ({
            id:
                item.id,
            ...item.data()
        })
    );
}


async function confirmSelectedNotificationPayment() {
    const booking =
        state.bookings.find(
            item =>
                item.id ===
                state.selectedBookingId
        );

    if (!booking) {
        alert(
            "Booking record not found."
        );
        return;
    }

    if (
        !isPaymentAwaitingVerification(
            booking
        )
    ) {
        alert(
            "This payment is no longer waiting for verification."
        );
        return;
    }

    const depositAmount =
        normalizeNumber(
            booking.requiredDeposit ??
            booking.depositAmount ??
            booking.initialDeposit
        );

    if (
        depositAmount <= 0
    ) {
        alert(
            "Invalid deposit amount."
        );
        return;
    }

    const method =
        normalizeLower(
            booking.paymentMethod
        );

    const transactionReference =
        clean(
            booking.paymentReference ||
            booking.transactionReference ||
            booking.referenceNumber
        );

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

    const existingPayments =
        await getExistingPayments();

    const duplicatePayment =
        existingPayments.find(
            payment =>
                payment.bookingId ===
                    booking.id &&
                clean(
                    payment.transactionReference
                ) ===
                    transactionReference &&
                ![
                    "void",
                    "cancelled"
                ].includes(
                    normalizeLower(
                        payment.status
                    )
                )
        );

    if (duplicatePayment) {
        alert(
            "This client payment has already been recorded."
        );
        return;
    }

    const confirmed =
        confirm(
            `Verify ₱${formatMoney(
                depositAmount
            )} payment from ${clean(
                booking.customerName
            ) || "customer"}?`
        );

    if (!confirmed) {
        return;
    }

    const originalConfirm =
        confirmNotificationPaymentBtn
            ?.innerHTML;

    const originalDecline =
        declineNotificationPaymentBtn
            ?.innerHTML;

    if (confirmNotificationPaymentBtn) {
        confirmNotificationPaymentBtn.disabled =
            true;
        confirmNotificationPaymentBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i><span>Verifying...</span>';
    }

    if (declineNotificationPaymentBtn) {
        declineNotificationPaymentBtn.disabled =
            true;
    }

    try {
        const now =
            new Date()
                .toISOString();

        const newPaymentReference =
            generatePaymentReference();

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
                        booking.bookingReference ||
                        booking.bookingNumber ||
                        booking.id,

                    customerName:
                        clean(
                            booking.customerName
                        ) ||
                        "Customer",

                    customerEmail:
                        clean(
                            booking.customerEmail
                        ),

                    packageName:
                        clean(
                            booking.packageName
                        ) ||
                        "Tour Package",

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
                        clean(
                            notificationAdminNote
                                ?.value
                        ),

                    source:
                        "client_booking",

                    createdAt:
                        now,

                    updatedAt:
                        now
                }
            );

        const allPayments =
            [
                ...existingPayments,
                {
                    id:
                        paymentDocument.id,
                    bookingId:
                        booking.id,
                    amount:
                        depositAmount,
                    status:
                        "partial"
                }
            ];

        const bookingTotal =
            normalizeNumber(
                booking.totalAmount ??
                booking.total ??
                booking.finalAmount
            );

        const amountPaid =
            allPayments
                .filter(
                    payment => {
                        const status =
                            normalizeLower(
                                payment.status
                            );

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
        }

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
                    clean(
                        notificationAdminNote
                            ?.value
                    ),

                updatedAt:
                    now
            }
        );

        if (notificationPaymentResult) {
            notificationPaymentResult.hidden =
                false;
            notificationPaymentResult.className =
                "notification-payment-result confirmed";
            notificationPaymentResult.textContent =
                `Payment verified successfully. Payment Reference: ${newPaymentReference}`;
        }

        alert(
            `Payment verified successfully.\n\nPayment Reference: ${newPaymentReference}`
        );

    } catch (error) {
        console.error(
            "NOTIFICATION PAYMENT VERIFICATION ERROR:",
            error
        );

        alert(
            "Unable to verify the payment. Please check the console for details."
        );
    } finally {
        if (confirmNotificationPaymentBtn) {
            confirmNotificationPaymentBtn.disabled =
                false;

            if (originalConfirm) {
                confirmNotificationPaymentBtn.innerHTML =
                    originalConfirm;
            }
        }

        if (declineNotificationPaymentBtn) {
            declineNotificationPaymentBtn.disabled =
                false;

            if (originalDecline) {
                declineNotificationPaymentBtn.innerHTML =
                    originalDecline;
            }
        }
    }
}


async function declineSelectedNotificationPayment() {
    const booking =
        state.bookings.find(
            item =>
                item.id ===
                state.selectedBookingId
        );

    if (!booking) {
        alert(
            "Booking record not found."
        );
        return;
    }

    if (
        !isPaymentAwaitingVerification(
            booking
        )
    ) {
        alert(
            "This payment is no longer waiting for verification."
        );
        return;
    }

    const reason =
        prompt(
            "Enter the reason for declining this payment:"
        );

    if (
        reason === null
    ) {
        return;
    }

    const cleanedReason =
        clean(
            reason
        );

    if (!cleanedReason) {
        alert(
            "Decline reason is required."
        );
        return;
    }

    const confirmed =
        confirm(
            `Decline the submitted payment from ${clean(
                booking.customerName
            ) || "customer"}?`
        );

    if (!confirmed) {
        return;
    }

    const originalDecline =
        declineNotificationPaymentBtn
            ?.innerHTML;

    if (declineNotificationPaymentBtn) {
        declineNotificationPaymentBtn.disabled =
            true;
        declineNotificationPaymentBtn.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i><span>Declining...</span>';
    }

    if (confirmNotificationPaymentBtn) {
        confirmNotificationPaymentBtn.disabled =
            true;
    }

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
                    clean(
                        notificationAdminNote
                            ?.value
                    ),

                updatedAt:
                    now
            }
        );

        if (notificationPaymentResult) {
            notificationPaymentResult.hidden =
                false;
            notificationPaymentResult.className =
                "notification-payment-result rejected";
            notificationPaymentResult.textContent =
                `Payment declined: ${cleanedReason}`;
        }

        alert(
            "Payment declined successfully."
        );

    } catch (error) {
        console.error(
            "NOTIFICATION PAYMENT DECLINE ERROR:",
            error
        );

        alert(
            "Unable to decline the payment. Please check the console for details."
        );
    } finally {
        if (declineNotificationPaymentBtn) {
            declineNotificationPaymentBtn.disabled =
                false;

            if (originalDecline) {
                declineNotificationPaymentBtn.innerHTML =
                    originalDecline;
            }
        }

        if (confirmNotificationPaymentBtn) {
            confirmNotificationPaymentBtn.disabled =
                false;
        }
    }
}


async function markRead(
    booking
) {

    const key =
        notificationKey(
            booking.id
        );

    if (
        state.readIds.has(
            key
        )
    ) {
        return;
    }

    const readDocumentId =
        `${state.user.uid}__booking__${booking.id}`;

    await setDoc(
        doc(
            db,
            "adminNotificationReads",
            readDocumentId
        ),
        {
            adminUid:
                state.user.uid,

            notificationKey:
                key,

            sourceType:
                "booking",

            sourceId:
                booking.id,

            readAt:
                serverTimestamp()
        },
        {
            merge: true
        }
    );
}


async function markAllRead() {

    const unread =
        state.bookings.filter(
            booking =>
                !isRead(
                    booking
                )
        );

    if (!unread.length) {
        return;
    }

    markAllReadBtn.disabled =
        true;

    try {

        await Promise.all(
            unread.map(
                booking =>
                    markRead(
                        booking
                    )
            )
        );

    } catch (error) {

        console.error(
            "MARK ALL ADMIN NOTIFICATIONS READ ERROR:",
            error
        );

        alert(
            "Unable to mark all notifications as read. Please try again."
        );

    } finally {

        markAllReadBtn.disabled =
            false;
    }
}


function renderAdminIdentity() {

    if (!state.profile) {
        return;
    }

    const displayName =
        clean(
            state.profile.fullName
        ) ||
        clean(
            state.profile.name
        ) ||
        clean(
            state.profile.displayName
        ) ||
        clean(
            state.user?.displayName
        ) ||
        "Admin Trips Wonder";

    if (adminName) {
        adminName.textContent =
            displayName;
    }

    if (adminRole) {
        adminRole.textContent =
            readableStatus(
                state.profile.role ||
                "admin"
            );
    }
}


function renderLoadError(
    message
) {

    if (!notificationList) {
        return;
    }

    notificationList.innerHTML = `
        <div class="notification-empty">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <strong>
                Unable to load notifications
            </strong>
            <span>
                ${escapeHTML(
                    message
                )}
            </span>
        </div>
    `;
}


function timeValue(
    value
) {

    if (!value) {
        return 0;
    }

    if (
        typeof value.toDate ===
        "function"
    ) {
        return value
            .toDate()
            .getTime();
    }

    if (
        typeof value.seconds ===
        "number"
    ) {
        return value.seconds *
            1000;
    }

    const parsed =
        Date.parse(
            value
        );

    return Number.isNaN(
        parsed
    )
        ? 0
        : parsed;
}


function dateFromValue(
    value
) {

    const timestamp =
        timeValue(
            value
        );

    return timestamp
        ? new Date(
            timestamp
        )
        : null;
}


function isToday(
    value
) {

    const date =
        dateFromValue(
            value
        );

    if (!date) {
        return false;
    }

    const today =
        new Date();

    return (
        date.getFullYear() ===
            today.getFullYear() &&
        date.getMonth() ===
            today.getMonth() &&
        date.getDate() ===
            today.getDate()
    );
}


function formatListTime(
    value
) {

    const date =
        dateFromValue(
            value
        );

    if (!date) {
        return "—";
    }

    const now =
        new Date();

    if (
        date.toDateString() ===
        now.toDateString()
    ) {
        return date.toLocaleTimeString(
            "en-PH",
            {
                hour:
                    "numeric",
                minute:
                    "2-digit"
            }
        );
    }

    return date.toLocaleDateString(
        "en-PH",
        {
            month:
                "short",
            day:
                "numeric"
        }
    );
}


function formatDateTime(
    value
) {

    const date =
        dateFromValue(
            value
        );

    if (!date) {
        return "Date unavailable";
    }

    return date.toLocaleString(
        "en-PH",
        {
            month:
                "short",
            day:
                "numeric",
            year:
                "numeric",
            hour:
                "numeric",
            minute:
                "2-digit"
        }
    );
}


function readableStatus(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /[_-]+/g,
            " "
        )
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );
}


function normalizeLower(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();
}


function clean(
    value
) {

    return String(
        value ?? ""
    )
        .trim();
}


function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function escapeAttr(
    value
) {

    return escapeHTML(
        value
    );
}


notificationSearch
    ?.addEventListener(
        "input",
        event => {

            state.search =
                String(
                    event.target.value ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            renderNotifications();
        }
    );


notificationFilter
    ?.addEventListener(
        "change",
        event => {

            state.filter =
                event.target.value ||
                "all";

            renderNotifications();
        }
    );


declineNotificationPaymentBtn
    ?.addEventListener(
        "click",
        declineSelectedNotificationPayment
    );


confirmNotificationPaymentBtn
    ?.addEventListener(
        "click",
        confirmSelectedNotificationPayment
    );


markAllReadBtn
    ?.addEventListener(
        "click",
        markAllRead
    );


logoutBtn
    ?.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );

                window.location.href =
                    "../../index.html";

            } catch (error) {

                console.error(
                    "ADMIN LOGOUT ERROR:",
                    error
                );
            }
        }
    );


window.addEventListener(
    "beforeunload",
    () => {

        state.unsubscribeBookings?.();

        state.unsubscribeReads?.();
    }
);


console.log(
    "TWTMS ADMIN NOTIFICATIONS MODULE LOADED."
);
