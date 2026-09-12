"use strict";

/* =========================================================
   TRIPS WONDER
   CUSTOMER BOOKING PAGE
   FINAL BOOKING FLOW
   assets/js/customer/booking.js

   Destination / Package
   -> Travel Schedule
   -> Guest Details
   -> Accommodation
   -> Payment Summary
   -> Tripswonder Discount
   -> Referral Code
   -> Payment Method
   -> Payment Reference
   -> For Verification
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
    query,
    setDoc,
    where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       CONFIG
       ===================================================== */

    let DEPOSIT_PER_PAX = 500;

    const DEFAULT_PAYMENT_SETTINGS = {
        methods: {
            gcash: {
                label: "GCash",
                status: "active",
                accountName: "Eric Ramirez",
                accountNumber: "0952 478 8316",
                logoImage: "",
                qrImage: ""
            },
            seabank: {
                label: "SeaBank / MariBank",
                status: "active",
                accountName: "",
                accountNumber: "",
                logoImage: "",
                qrImage: ""
            },
            maya: {
                label: "Maya",
                status: "coming_soon",
                accountName: "",
                accountNumber: "",
                logoImage: "",
                qrImage: ""
            },
            gotyme: {
                label: "GoTyme Bank",
                status: "coming_soon",
                accountName: "",
                accountNumber: "",
                logoImage: "",
                qrImage: ""
            },
            card: {
                label: "Credit / Debit Card",
                status: "coming_soon",
                accountName: "",
                accountNumber: "",
                logoImage: "",
                qrImage: ""
            }
        },
        rules: {
            depositPerPax: 500,
            minimumDeposit: 500,
            referenceRequired: true,
            adminVerificationRequired: true,
            receiptReminder:
                "Please keep your initial deposit receipt until your payment has been verified."
        }
    };

    let paymentSettings = {
        methods: {
            ...DEFAULT_PAYMENT_SETTINGS.methods
        },
        rules: {
            ...DEFAULT_PAYMENT_SETTINGS.rules
        }
    };

    const PAYMENT_METHOD_META = {
        gcash: {
            icon: "fa-solid fa-mobile-screen-button",
            brandClass: "gcash",
            description: "Pay using GCash QR or mobile number"
        },
        seabank: {
            icon: "fa-solid fa-building-columns",
            brandClass: "seabank",
            description: "Transfer using SeaBank / MariBank"
        },
        maya: {
            icon: "fa-solid fa-wallet",
            brandClass: "maya",
            description: "Pay using your Maya account"
        },
        gotyme: {
            icon: "fa-solid fa-building-columns",
            brandClass: "gotyme",
            description: "Transfer using GoTyme Bank"
        },
        card: {
            icon: "fa-regular fa-credit-card",
            brandClass: "card",
            description: "Credit / debit card payment"
        }
    };


    /* =====================================================
       STATE
       ===================================================== */

    let selectedPackage = null;
    let selectedSchedule = null;
    let selectedAccommodation = null;
    let isRequestedDateMode = true;
    let loadedScheduleItems = [];
    let calendarCursor = new Date();

    let availablePromos = [];
    let pendingPromo = null;
    let appliedPromo = null;

    let appliedReferral = null;

    let selectedPaymentAmountOption = "minimum";
    let currentPaymentMethodKey = "";
    let paymentSettingsLoaded = false;

    let currentCustomer = null;
    let currentCustomerProfile = null;

    let galleryPhotos = [];
    let galleryIndex = 0;

    let isSubmitting = false;


    /* =====================================================
       DOM
       ===================================================== */

    const $ = id => document.getElementById(id);

    const packageLoading = $("packageLoading");
    const packageContent = $("packageContent");
    const packageError = $("packageError");
    const packageImage = $("packageImage");
    const packageName = $("packageName");
    const packageLocation = $("packageLocation");
    const packageDuration = $("packageDuration");
    const packagePrice = $("packagePrice");
    const packageStatus = $("packageStatus");
    const packageHighlights = $("packageHighlights");

    const viewPackageDetailsButton = $("viewPackageDetailsButton");
    const packageDetailsModal = $("packageDetailsModal");
    const packageDetailsModalTitle = $("packageDetailsModalTitle");
    const packageDetailsModalContent = $("packageDetailsModalContent");

    const clientBookingForm = $("clientBookingForm");

    const travelDate = $("travelDate");
    const selectedScheduleId = $("selectedScheduleId");
    const travelScheduleList = $("travelScheduleList");
    const scheduleLoading = $("scheduleLoading");
    const travelCalendarGrid = $("travelCalendarGrid");
    const travelCalendarCard = $("travelCalendarCard");
    const calendarMonthLabel = $("calendarMonthLabel");
    const calendarPrevMonth = $("calendarPrevMonth");
    const calendarNextMonth = $("calendarNextMonth");
    const selectedScheduleCard = $("selectedScheduleCard");
    const quickViewMoreButton = $("quickViewMoreButton");
    const calendarPackageImage = $("calendarPackageImage");
    const calendarPackageName = $("calendarPackageName");
    const calendarPackageLocation = $("calendarPackageLocation");
    const calendarPackagePrice = $("calendarPackagePrice");

    const requestedDateOption = $("requestedDateOption");
    const requestAnotherDateButton = $("requestAnotherDateButton");
    const requestedDatePanel = $("requestedDatePanel");
    const requestedTravelDate = $("requestedTravelDate");
    const requestedDateMinimumText = $("requestedDateMinimumText");
    const requestedDateRequirementTitle = $("requestedDateRequirementTitle");
    const requestedDateRequirementText = $("requestedDateRequirementText");
    const requestedDatePaymentNote = $("requestedDatePaymentNote");
    const bookingAgreementText = $("bookingAgreementText");

    const customerName = $("customerName");
    const customerContact = $("customerContact");
    const customerEmail = $("customerEmail");
    const customerFacebook = $("customerFacebook");
    const numberOfGuests = $("numberOfGuests");

    const children0To3 = $("children0To3");
    const children4To8 = $("children4To8");
    const childrenFreeField = $("childrenFreeField");
    const childrenDiscountField = $("childrenDiscountField");
    const childrenFreeLabel = $("childrenFreeLabel");
    const childrenDiscountLabel = $("childrenDiscountLabel");
    const childrenDiscountHelp = $("childrenDiscountHelp");
    const hasChildrenInputs =
        document.querySelectorAll('input[name="hasChildren"]');
    const childrenChoiceNo = $("childrenChoiceNo");
    const childrenChoiceYes = $("childrenChoiceYes");
    const childrenQuestionHelp = $("childrenQuestionHelp");

    const pickupPoint = $("pickupPoint");
    const otherPickupField = $("otherPickupField");
    const otherPickup = $("otherPickup");
    const specialRequest = $("specialRequest");

    const accommodation = $("accommodation");
    const selectedAccommodationId = $("selectedAccommodationId");
    const accommodationList = $("accommodationList");
    const accommodationLoadingState = $("accommodationLoadingState");
    const accommodationTabs = $("accommodationTabs");
    const selectedAccommodationSummary = $("selectedAccommodationSummary");
    const selectedAccommodationName = $("selectedAccommodationName");
    const selectedAccommodationPrice = $("selectedAccommodationPrice");

    const accommodationGalleryModal = $("accommodationGalleryModal");
    const galleryAccommodationName = $("galleryAccommodationName");
    const galleryMainImage = $("galleryMainImage");
    const galleryCounter = $("galleryCounter");
    const galleryThumbnails = $("galleryThumbnails");
    const galleryPrevButton = $("galleryPrevButton");
    const galleryNextButton = $("galleryNextButton");

    const summaryPackageRate = $("summaryPackageRate");
    const summaryPax = $("summaryPax");
    const summaryTotalPackage = $("summaryTotalPackage");
    const summarySubtotal = $("summarySubtotal");
    const summaryAccommodationRow = $("summaryAccommodationRow");
    const summaryAccommodation = $("summaryAccommodation");
    const summaryAccommodationUpgradeInline = $("summaryAccommodationUpgradeInline");
    const summaryAccommodationUpgradeRow = $("summaryAccommodationUpgradeRow");
    const summaryAccommodationUpgrade = $("summaryAccommodationUpgrade");

    const summaryChildFreeRow = $("summaryChildFreeRow");
    const summaryChildFree = $("summaryChildFree");
    const summaryChildDiscountRow = $("summaryChildDiscountRow");
    const summaryChildDiscount = $("summaryChildDiscount");
    const summaryExclusiveRow = $("summaryExclusiveRow");
    const summaryExclusiveDiscount = $("summaryExclusiveDiscount");

    const summaryPromoRow = $("summaryPromoRow");
    const summaryPromoDiscount = $("summaryPromoDiscount");
    const summaryTotal = $("summaryTotal");
    const requiredDeposit = $("requiredDeposit");
    const depositBreakdown = $("depositBreakdown");
    const summaryRemainingBalance = $("summaryRemainingBalance");
    const paymentStepTotal = $("paymentStepTotal");

    const paymentAmountOptionInputs =
        document.querySelectorAll('input[name="paymentAmountOption"]');
    const minimumDepositChoice = $("minimumDepositChoice");
    const halfPaymentChoice = $("halfPaymentChoice");
    const fullPaymentChoice = $("fullPaymentChoice");
    const paymentMoreToggle = $("paymentMoreToggle");
    const paymentAmountChoices = $("paymentAmountChoices");

    /*
     * Legacy hidden elements retained in HTML so old promo behavior
     * does not cause missing-DOM errors while the new selector is used.
     */
    const bookingPromoCode = $("bookingPromoCode");
    const applyPromoButton = $("applyPromoButton");
    const promoBookingMessage = $("promoBookingMessage");

    const openDiscountButton = $("openDiscountButton");
    const selectedDiscountLabel = $("selectedDiscountLabel");
    const discountModal = $("discountModal");
    const discountList = $("discountList");
    const discountEmptyState = $("discountEmptyState");
    const confirmDiscountButton = $("confirmDiscountButton");

    const referralCode = $("referralCode");
    const applyReferralButton = $("applyReferralButton");
    const referralMessage = $("referralMessage");

    const paymentMethodsList = $("paymentMethodsList");
    const paymentMethodLoading = $("paymentMethodLoading");

    const paymentInstructions = $("paymentInstructions");
    const paymentInstructionsContent = $("paymentInstructionsContent");
    const paymentReference = $("paymentReference");

    const gcashPaymentModal = $("gcashPaymentModal");
    const gcashQrImage = $("gcashQrImage");
    const downloadGcashQrButton = $("downloadGcashQrButton");
    const gcashAccountName = $("gcashAccountName");
    const gcashAccountNumber = $("gcashAccountNumber");
    const gcashDepositAmount = $("gcashDepositAmount");
    const gcashDepositBreakdown = $("gcashDepositBreakdown");
    const gcashReferenceInput = $("gcashReferenceInput");
    const confirmGcashPaymentButton = $("confirmGcashPaymentButton");
    const paymentModalTitle = $("paymentModalTitle");

    let paymentModalBrandLogo =
        document.getElementById("paymentModalBrandLogo");

    if (
        paymentModalTitle &&
        !paymentModalBrandLogo
    ) {
        paymentModalBrandLogo =
            document.createElement("img");

        paymentModalBrandLogo.id =
            "paymentModalBrandLogo";

        paymentModalBrandLogo.className =
            "payment-modal-brand-logo";

        paymentModalBrandLogo.alt =
            "Payment method logo";

        paymentModalBrandLogo.hidden =
            true;

        paymentModalTitle.parentElement
            ?.insertBefore(
                paymentModalBrandLogo,
                paymentModalTitle
            );
    }
    const paymentQrCard = $("paymentQrCard");
    const paymentAccountNumberLabel = $("paymentAccountNumberLabel");
    const paymentReferenceLabel = $("paymentReferenceLabel");
    const paymentReceiptReminder = $("paymentReceiptReminder");

    const bankPaymentModal = $("bankPaymentModal");
    const bankName = $("bankName");
    const bankAccountName = $("bankAccountName");
    const bankAccountNumber = $("bankAccountNumber");
    const bankDepositAmount = $("bankDepositAmount");
    const bankReferenceInput = $("bankReferenceInput");
    const confirmBankPaymentButton = $("confirmBankPaymentButton");

    const bookingAgreement = $("bookingAgreement");
    const submitBookingButton = $("submitBookingButton");

    const bookingSuccessModal = $("bookingSuccessModal");
    const bookingRequestReference = $("bookingRequestReference");
    const successStatusLabel = $("successStatusLabel");
    const successTitle = $("successTitle");
    const successMessage = $("successMessage");
    const successPaymentStatus = $("successPaymentStatus");
    const successBookingStatus = $("successBookingStatus");
    const successDoneButton = $("successDoneButton");


    /* =====================================================
       HELPERS
       ===================================================== */

    function normalizeText(value) {
        return String(value ?? "").trim();
    }

    function normalizeLower(value) {
        return normalizeText(value).toLowerCase();
    }

    function normalizeNumber(value) {
        const number = Number(
            String(value ?? "")
                .replace(/,/g, "")
                .replace(/[^0-9.-]/g, "")
        );

        return Number.isFinite(number) ? number : 0;
    }

    function formatMoney(value) {
        return normalizeNumber(value).toLocaleString("en-PH", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }

    function escapeHtml(value) {
        return normalizeText(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function normalizeDateValue(value) {
        if (!value) return "";

        if (typeof value === "string") {
            const match = value.match(/^\d{4}-\d{2}-\d{2}/);
            if (match) return match[0];
        }

        if (value?.toDate instanceof Function) {
            const date = value.toDate();
            return toDateInputValue(date);
        }

        const date = new Date(value);

        return Number.isNaN(date.getTime())
            ? ""
            : toDateInputValue(date);
    }

    function toDateInputValue(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function formatTravelDate(value) {
        const normalized = normalizeDateValue(value);

        if (!normalized) return "Schedule";

        const date = new Date(`${normalized}T00:00:00`);

        return date.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function calculateTravelEndDate(startDate, duration) {
        if (!startDate) return "";

        const match = normalizeText(duration).match(/(\d+)\s*D/i);

        if (!match) return startDate;

        const days = Number(match[1]);

        if (!Number.isFinite(days) || days <= 1) {
            return startDate;
        }

        const date = new Date(`${startDate}T00:00:00`);
        date.setDate(date.getDate() + days - 1);

        return toDateInputValue(date);
    }

    function getBookingNights() {
        const duration = normalizeText(selectedPackage?.duration);

        const exact = duration.match(/(\d+)\s*D\s*(\d+)\s*N/i);
        if (exact) {
            return Math.max(1, Number(exact[2]) || 1);
        }

        const days = duration.match(/(\d+)\s*D/i);

        return days
            ? Math.max(1, (Number(days[1]) || 1) - 1)
            : 1;
    }

    function getSelectedPaymentMethod() {
        const checked =
            document.querySelector('input[name="paymentMethod"]:checked');

        return checked ? checked.value : "";
    }


    function getPaymentMethodSettings(key) {
        return (
            paymentSettings?.methods?.[key] ||
            DEFAULT_PAYMENT_SETTINGS.methods[key] ||
            null
        );
    }


    function getPaymentRules() {
        return {
            ...DEFAULT_PAYMENT_SETTINGS.rules,
            ...(paymentSettings?.rules || {})
        };
    }


    function paymentMethodIsActive(key) {
        return (
            normalizeLower(
                getPaymentMethodSettings(key)?.status
            ) === "active"
        );
    }


    function normalizePaymentSettings(settings) {
        const raw =
            settings?.paymentSettings &&
            typeof settings.paymentSettings === "object"
                ? settings.paymentSettings
                : {};

        const rawMethods =
            raw.methods &&
            typeof raw.methods === "object"
                ? raw.methods
                : {};

        const methods = {};

        Object.keys(
            DEFAULT_PAYMENT_SETTINGS.methods
        ).forEach(key => {

            /*
             * IMPORTANT:
             * If Admin has already saved a method record, use that
             * saved record as the source of truth.
             *
             * The default object is only a fallback for fields that
             * were never saved at all.
             */
            const savedMethod =
                rawMethods[key] &&
                typeof rawMethods[key] === "object"
                    ? rawMethods[key]
                    : null;

            const fallbackMethod =
                DEFAULT_PAYMENT_SETTINGS.methods[key];

            const mergedMethod = {
                ...fallbackMethod,
                ...(savedMethod || {})
            };

            /*
             * Preserve explicit Admin status exactly.
             * This prevents "hidden" from falling back to
             * the default "coming_soon" value.
             */
            const savedStatus =
                savedMethod &&
                Object.prototype.hasOwnProperty.call(
                    savedMethod,
                    "status"
                )
                    ? normalizeLower(
                        savedMethod.status
                    )
                    : "";

            const fallbackStatus =
                normalizeLower(
                    fallbackMethod.status
                );

            mergedMethod.status =
                ["active", "coming_soon", "hidden"].includes(
                    savedStatus
                )
                    ? savedStatus
                    : fallbackStatus;

            methods[key] =
                mergedMethod;
        });

        const rules = {
            ...DEFAULT_PAYMENT_SETTINGS.rules,
            ...(raw.rules || {})
        };

        rules.depositPerPax =
            Math.max(
                0,
                normalizeNumber(
                    rules.depositPerPax ?? 500
                )
            ) || 500;

        rules.minimumDeposit =
            Math.max(
                0,
                normalizeNumber(
                    rules.minimumDeposit ??
                    rules.depositPerPax
                )
            );

        paymentSettings = {
            methods,
            rules
        };

        DEPOSIT_PER_PAX =
            rules.depositPerPax || 500;

        paymentSettingsLoaded = true;

        console.log(
            "Trips Wonder Payment Settings:",
            paymentSettings
        );
    }


    async function loadPaymentSettings() {
        try {
            const snapshot =
                await getDoc(
                    doc(
                        db,
                        "systemSettings",
                        "general"
                    )
                );

            if (snapshot.exists()) {
                const settingsData =
                    snapshot.data();

                console.log(
                    "Trips Wonder raw paymentSettings:",
                    settingsData?.paymentSettings
                );

                normalizePaymentSettings(
                    settingsData
                );
            } else {
                normalizePaymentSettings({});
            }

        } catch (error) {
            console.warn(
                "Payment settings could not be loaded. Using safe defaults.",
                error
            );

            normalizePaymentSettings({});
        }

        renderPaymentMethods();
        updateBookingSummary();
    }


    function renderPaymentMethods() {
        if (!paymentMethodsList) {
            return;
        }

        const currentSelection =
            getSelectedPaymentMethod();

        paymentMethodsList.innerHTML = "";

        let visibleCount = 0;

        Object.entries(
            paymentSettings.methods || {}
        ).forEach(([key, method]) => {

            const status =
                normalizeLower(method.status);

            if (status === "hidden") {
                return;
            }

            visibleCount += 1;

            const meta =
                PAYMENT_METHOD_META[key] || {
                    icon: "fa-solid fa-wallet",
                    brandClass: "default",
                    description: "Payment method"
                };

            const active =
                status === "active";

            const card =
                document.createElement("label");

            card.className =
                "payment-option payment-method-dynamic";

            if (!active) {
                card.classList.add(
                    "payment-method-coming-soon"
                );
            }

            card.innerHTML = `
                <input
                    type="radio"
                    name="paymentMethod"
                    value="${escapeHtml(key)}"
                    ${active ? "required" : "disabled"}
                    ${
                        active &&
                        currentSelection === key
                            ? "checked"
                            : ""
                    }
                >

                <span class="payment-option-content payment-option-content-clean">
                    <span class="payment-logo-icon ${escapeHtml(meta.brandClass)}">
                        ${
                            normalizeText(method.logoImage)
                                ? `
                                    <img
                                        src="${escapeHtml(method.logoImage)}"
                                        alt="${escapeHtml(method.label || key)} logo"
                                        class="payment-method-brand-logo"
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <i class="${escapeHtml(meta.icon)}"></i>
                                `
                        }
                    </span>

                    <span class="payment-option-copy">
                        <strong>${escapeHtml(method.label || key)}</strong>
                        <small>${escapeHtml(meta.description)}</small>
                    </span>

                    <span class="payment-option-end">
                        ${
                            active
                                ? `
                                    <span class="payment-radio-indicator">
                                        <i class="fa-solid fa-check"></i>
                                    </span>
                                    <i class="fa-solid fa-chevron-right payment-option-chevron"></i>
                                `
                                : `
                                    <span class="payment-soon-badge">SOON</span>
                                `
                        }
                    </span>
                </span>
            `;

            paymentMethodsList.appendChild(
                card
            );
        });

        if (!visibleCount) {
            paymentMethodsList.innerHTML = `
                <div class="payment-method-empty">
                    <i class="fa-solid fa-circle-info"></i>
                    <div>
                        <strong>Payment methods are temporarily unavailable.</strong>
                        <span>Please contact Trips Wonder support for assistance.</span>
                    </div>
                </div>
            `;
        }

        paymentMethodsList
            .querySelectorAll(
                'input[name="paymentMethod"]:not(:disabled)'
            )
            .forEach(input => {

                input.addEventListener(
                    "change",
                    () => {

                        if (paymentReference) {
                            paymentReference.value = "";
                        }

                        if (gcashReferenceInput) {
                            gcashReferenceInput.value = "";
                        }

                        currentPaymentMethodKey =
                            input.value;

                        showPaymentInstructions();
                    }
                );

            });
    }


    function getSelectedPaymentMethodSnapshot() {
        const key =
            getSelectedPaymentMethod();

        const method =
            getPaymentMethodSettings(key);

        if (!key || !method) {
            return null;
        }

        return {
            key,
            label:
                normalizeText(
                    method.label || key
                ),
            accountName:
                normalizeText(
                    method.accountName
                ),
            accountNumber:
                normalizeText(
                    method.accountNumber
                ),
            logoImage:
                normalizeText(
                    method.logoImage
                ),
            qrImage:
                normalizeText(
                    method.qrImage
                )
        };
    }

    function getPax() {
        const pax = parseInt(numberOfGuests?.value, 10);

        return Number.isFinite(pax) && pax > 0 ? pax : 1;
    }

    function getSelectedPaymentAmount(calculation = calculateBooking()) {
        const minimumDeposit =
            Math.min(
                calculation.total,
                DEPOSIT_PER_PAX *
                calculation.payablePax
            );

        const halfPayment =
            Math.min(
                calculation.total,
                Math.max(
                    minimumDeposit,
                    calculation.total * 0.5
                )
            );

        const fullPayment =
            calculation.total;

        let selectedAmount =
            minimumDeposit;

        if (selectedPaymentAmountOption === "half") {
            selectedAmount = halfPayment;
        }

        if (selectedPaymentAmountOption === "full") {
            selectedAmount = fullPayment;
        }

        return {
            option: selectedPaymentAmountOption,
            minimumDeposit,
            halfPayment,
            fullPayment,
            selectedAmount,
            remainingBalance:
                Math.max(
                    0,
                    calculation.total -
                    selectedAmount
                )
        };
    }

    function getChildCount(element) {
        const value = parseInt(element?.value, 10);

        return Number.isFinite(value) && value > 0 ? value : 0;
    }

    function setModalState(modal, show) {
        if (!modal) return;

        modal.classList.toggle("show", show);
        modal.setAttribute("aria-hidden", show ? "false" : "true");

        const anyOpen =
            document.querySelector(".booking-modal.show, .success-modal.show");

        document.body.classList.toggle("modal-open", Boolean(anyOpen));
    }

    function closeAllBookingModals() {
        document
            .querySelectorAll(".booking-modal.show")
            .forEach(modal => {
                modal.classList.remove("show");
                modal.setAttribute("aria-hidden", "true");
            });

        document.body.classList.remove("modal-open");
    }


    /* =====================================================
       CUSTOMER PROFILE
       ===================================================== */

    async function loadCustomerProfile(user) {
        if (!user?.uid) return false;

        currentCustomer = user;

        /*
         * Always use Firebase Auth as a fallback.
         * This means name/email can still autofill even when the
         * customer profile document has not been completed yet.
         */
        const applyAuthFallback = () => {
            const authName =
                normalizeText(user.displayName);

            const authEmail =
                normalizeLower(user.email || "");

            if (
                customerName &&
                !normalizeText(customerName.value) &&
                authName
            ) {
                customerName.value = authName;
            }

            if (
                customerEmail &&
                !normalizeText(customerEmail.value) &&
                authEmail
            ) {
                customerEmail.value = authEmail;
            }

            if (
                customerEmail &&
                normalizeText(customerEmail.value)
            ) {
                customerEmail.readOnly = true;
            }
        };

        applyAuthFallback();

        try {
            const customerSnapshot =
                await getDoc(
                    doc(
                        db,
                        "customers",
                        user.uid
                    )
                );

            if (!customerSnapshot.exists()) {
                return false;
            }

            const profile =
                customerSnapshot.data() || {};

            currentCustomerProfile = profile;

            const fullName =
                normalizeText(profile.fullName) ||
                normalizeText(profile.name) ||
                normalizeText(profile.displayName) ||
                normalizeText(user.displayName);

            const contactNumber =
                normalizeText(profile.phone) ||
                normalizeText(profile.contactNumber) ||
                normalizeText(profile.contact) ||
                normalizeText(profile.mobileNumber) ||
                normalizeText(profile.mobile);

            const facebookName =
                normalizeText(profile.facebookName) ||
                normalizeText(profile.facebook) ||
                normalizeText(profile.fbName);

            const emailAddress =
                normalizeLower(
                    profile.email ||
                    user.email ||
                    ""
                );

            const preferredPickup =
                normalizeText(profile.preferredPickup) ||
                normalizeText(profile.pickupPoint) ||
                normalizeText(profile.pickupLocation) ||
                normalizeText(profile.defaultPickup);

            if (customerName && fullName) {
                customerName.value =
                    fullName;
            }

            if (
                customerContact &&
                contactNumber
            ) {
                customerContact.value =
                    contactNumber;
            }

            if (
                customerFacebook &&
                facebookName
            ) {
                customerFacebook.value =
                    facebookName;
            }

            if (customerEmail) {
                customerEmail.value =
                    emailAddress;

                if (emailAddress) {
                    customerEmail.readOnly =
                        true;
                }
            }

            /*
             * Pick-up point is also preselected only when the saved
             * profile value exactly matches one of this package's
             * available select options. Otherwise we leave it blank
             * so the client can choose the correct location.
             */
            if (
                pickupPoint &&
                preferredPickup
            ) {
                const matchingOption =
                    Array.from(
                        pickupPoint.options
                    ).find(
                        option =>
                            normalizeLower(
                                option.value
                            ) ===
                            normalizeLower(
                                preferredPickup
                            ) ||
                            normalizeLower(
                                option.textContent
                            ) ===
                            normalizeLower(
                                preferredPickup
                            )
                    );

                if (matchingOption) {
                    pickupPoint.value =
                        matchingOption.value;

                    pickupPoint.dispatchEvent(
                        new Event(
                            "change",
                            {
                                bubbles: true
                            }
                        )
                    );
                }
            }

            return true;

        } catch (error) {
            console.error(
                "LOAD CUSTOMER PROFILE ERROR:",
                error
            );

            applyAuthFallback();
            return false;
        }
    }


    /* =====================================================
       PACKAGE
       ===================================================== */

    async function loadSelectedPackage() {
        const params = new URLSearchParams(window.location.search);
        const packageId = params.get("package");

        if (!packageId) {
            showPackageError();
            return;
        }

        try {
            const packageSnapshot =
                await getDoc(doc(db, "packages", packageId));

            if (!packageSnapshot.exists()) {
                showPackageError();
                return;
            }

            const data = packageSnapshot.data() || {};
            const status = normalizeLower(data.status || "active");

            if (status !== "active") {
                showPackageError();
                return;
            }

            selectedPackage = {
                id: packageSnapshot.id,
                ...data,
                name: normalizeText(data.name),
                location: normalizeText(data.location),
                duration: normalizeText(data.duration),
                description: normalizeText(data.description),
                category: normalizeText(data.category),
                price: normalizeNumber(data.price),
                status,
                gallery: Array.isArray(data.gallery) ? data.gallery : [],
                accommodations:
                    Array.isArray(data.accommodations)
                        ? data.accommodations
                        : [],
                pickupLocations:
                    Array.isArray(data.pickupLocations)
                        ? data.pickupLocations
                        : [],
                passengerPricing:
                    data.passengerPricing &&
                    typeof data.passengerPricing === "object"
                        ? data.passengerPricing
                        : {},
                exclusiveTour:
                    data.exclusiveTour &&
                    typeof data.exclusiveTour === "object"
                        ? data.exclusiveTour
                        : {},

                scheduleSettings:
                    data.scheduleSettings &&
                    typeof data.scheduleSettings === "object"
                        ? data.scheduleSettings
                        : {}
            };

            renderSelectedPackage();
            syncPassengerPricingForm();
            populatePickupLocations();

            await loadSchedules();
            await loadEligiblePromos();

            syncRequestedDateEligibility();
            syncMobileCalendarUI();
            syncChildrenAvailability();
            syncChildrenFieldsVisibility();
            updateBookingSummary();

        } catch (error) {
            console.error("LOAD SELECTED PACKAGE ERROR:", error);
            showPackageError();
        }
    }

    function showPackageError() {
        packageLoading?.classList.add("hidden");
        packageContent?.classList.add("hidden");
        packageError?.classList.remove("hidden");

        if (submitBookingButton) {
            submitBookingButton.disabled = true;
        }
    }

    function firstPhotoUrl(items) {
        if (!Array.isArray(items)) return "";

        for (const item of items) {
            const url =
                typeof item === "string"
                    ? item
                    : item?.url || item?.src || item?.imageUrl || "";

            if (normalizeText(url)) return normalizeText(url);
        }

        return "";
    }

    function renderSelectedPackage() {
        if (!selectedPackage) return;

        packageLoading?.classList.add("hidden");
        packageError?.classList.add("hidden");
        packageContent?.classList.remove("hidden");

        const image =
            firstPhotoUrl(selectedPackage.gallery) ||
            normalizeText(selectedPackage.imageUrl) ||
            normalizeText(selectedPackage.photo);

        if (packageImage) {
            if (image) {
                packageImage.src = image;
                packageImage.style.display = "block";
            } else {
                packageImage.removeAttribute("src");
                packageImage.style.display = "none";
            }
        }

        if (packageName) {
            packageName.textContent =
                selectedPackage.name || "Tour Package";
        }

        if (packageLocation) {
            packageLocation.textContent =
                selectedPackage.location || "Philippines";
        }

        if (packageDuration) {
            packageDuration.textContent =
                selectedPackage.duration || "—";
        }

        if (packagePrice) {
            packagePrice.textContent =
                `₱${formatMoney(selectedPackage.price)}`;
        }

        if (packageStatus) {
            packageStatus.textContent = "Available";
        }

        if (calendarPackageImage) {
            if (image) {
                calendarPackageImage.src = image;
                calendarPackageImage.style.display = "block";
            } else {
                calendarPackageImage.removeAttribute("src");
                calendarPackageImage.style.display = "none";
            }
        }

        if (calendarPackageName) {
            calendarPackageName.textContent =
                selectedPackage.name || "Tour Package";
        }

        if (calendarPackageLocation) {
            calendarPackageLocation.textContent =
                selectedPackage.location || "Philippines";
        }

        if (calendarPackagePrice) {
            calendarPackagePrice.textContent =
                `₱${formatMoney(selectedPackage.price)}`;
        }

        if (packageHighlights) {
            const highlights = [];

            if (selectedPackage.category) {
                highlights.push(`
                    <span>
                        <i class="fa-solid fa-map"></i>
                        ${escapeHtml(selectedPackage.category)}
                    </span>
                `);
            }

            highlights.push(`
                <span>
                    <i class="fa-solid fa-user-group"></i>
                    Joiners / Group
                </span>
            `);

            highlights.push(`
                <span>
                    <i class="fa-solid fa-shield-heart"></i>
                    Trips Wonder
                </span>
            `);

            packageHighlights.innerHTML = highlights.join("");
        }

        renderPackageDetailsModal();
    }

    function renderPackageDetailsModal() {
        if (!selectedPackage || !packageDetailsModalContent) return;

        if (packageDetailsModalTitle) {
            packageDetailsModalTitle.textContent =
                selectedPackage.name || "Package Details";
        }

        const inclusions =
            Array.isArray(selectedPackage.inclusions)
                ? selectedPackage.inclusions
                : [];

        const exclusions =
            Array.isArray(selectedPackage.exclusions)
                ? selectedPackage.exclusions
                : [];

        const itinerary =
            Array.isArray(selectedPackage.itinerary)
                ? selectedPackage.itinerary
                : [];

        const listHtml = items =>
            items.length
                ? `<ul>${items.map(item =>
                    `<li>${escapeHtml(
                        typeof item === "string"
                            ? item
                            : item?.name || item?.title || item?.text
                    )}</li>`
                ).join("")}</ul>`
                : `<p>Information will be shown when available.</p>`;

        packageDetailsModalContent.innerHTML = `
            <section class="package-detail-section">
                <h3>About this package</h3>
                <p>
                    ${escapeHtml(
                        selectedPackage.description ||
                        `${selectedPackage.name || "This tour"} by Trips Wonder Travel and Tours.`
                    )}
                </p>
            </section>

            <section class="package-detail-section">
                <h3>Package Inclusions</h3>
                ${listHtml(inclusions)}
            </section>

            <section class="package-detail-section">
                <h3>Package Exclusions</h3>
                ${listHtml(exclusions)}
            </section>

            <section class="package-detail-section">
                <h3>Itinerary</h3>
                ${listHtml(itinerary)}
            </section>
        `;
    }


    /* =====================================================
       PASSENGER PRICING
       ===================================================== */

    function getPackagePassengerPricing() {
        const config = selectedPackage?.passengerPricing || {};

        return {
            enabled: config.kidsPricingEnabled === true,

            childFreeMaxAge:
                Math.max(0, normalizeNumber(config.childFreeMaxAge ?? 3)),

            childDiscountMinAge:
                Math.max(0, normalizeNumber(config.childDiscountMinAge ?? 4)),

            childDiscountMaxAge:
                Math.max(0, normalizeNumber(config.childDiscountMaxAge ?? 8)),

            childDiscountAmount:
                Math.max(0, normalizeNumber(config.childDiscountAmount ?? 500))
        };
    }

    function getPackageExclusiveTour() {
        const config = selectedPackage?.exclusiveTour || {};

        return {
            enabled: config.enabled === true,

            minimumPayingPax:
                Math.max(1, normalizeNumber(config.minimumPayingPax ?? 12)),

            freeStartsAt:
                Math.max(1, normalizeNumber(config.freeStartsAt ?? 13)),

            freePax:
                Math.max(0, normalizeNumber(config.freePax ?? 1)),

            maxFreePax:
                Math.max(0, normalizeNumber(config.maxFreePax ?? 1))
        };
    }

    function hasChildrenSelected() {
        return (
            document.querySelector(
                'input[name="hasChildren"]:checked'
            )?.value === "yes"
        );
    }

    function syncChildrenAvailability() {
        const totalPax = getPax();

        const yesInput =
            document.querySelector(
                'input[name="hasChildren"][value="yes"]'
            );

        const noInput =
            document.querySelector(
                'input[name="hasChildren"][value="no"]'
            );

        const canAddChildren =
            totalPax >= 2;

        if (yesInput) {
            yesInput.disabled =
                !canAddChildren;
        }

        childrenChoiceYes
            ?.classList.toggle(
                "disabled",
                !canAddChildren
            );

        childrenChoiceYes
            ?.setAttribute(
                "aria-disabled",
                canAddChildren
                    ? "false"
                    : "true"
            );

        if (!canAddChildren) {
            if (noInput) {
                noInput.checked = true;
            }

            if (yesInput) {
                yesInput.checked = false;
            }

            if (children0To3) {
                children0To3.value = "0";
            }

            if (children4To8) {
                children4To8.value = "0";
            }

            childrenFreeField
                ?.classList.add("hidden");

            childrenDiscountField
                ?.classList.add("hidden");

            syncChildrenChoiceUI();
        }

        if (childrenQuestionHelp) {
            childrenQuestionHelp.textContent =
                canAddChildren
                    ? "Select Yes only if children aged 0–8 are included in this booking."
                    : "Children can be added only when Total Number of Pax is 2 or more. Include the child in the total headcount first.";
        }
    }

    function syncChildrenChoiceUI() {
        const hasChildren =
            hasChildrenSelected();

        childrenChoiceNo
            ?.classList.toggle(
                "active",
                !hasChildren
            );

        childrenChoiceYes
            ?.classList.toggle(
                "active",
                hasChildren
            );
    }

    function syncChildrenFieldsVisibility() {
        const config =
            getPackagePassengerPricing();

        const showChildrenFields =
            config.enabled &&
            hasChildrenSelected();

        childrenFreeField
            ?.classList.toggle(
                "hidden",
                !showChildrenFields
            );

        childrenDiscountField
            ?.classList.toggle(
                "hidden",
                !showChildrenFields
            );

        if (!showChildrenFields) {
            if (children0To3) {
                children0To3.value = "0";
            }

            if (children4To8) {
                children4To8.value = "0";
            }
        }

        syncChildrenChoiceUI();
    }

    function syncPassengerPricingForm() {
        const config = getPackagePassengerPricing();

        if (!config.enabled) {
            childrenFreeField?.classList.add("hidden");
            childrenDiscountField?.classList.add("hidden");

            if (children0To3) children0To3.value = "0";
            if (children4To8) children4To8.value = "0";

            syncChildrenChoiceUI();
            return;
        }

        syncChildrenFieldsVisibility();

        if (childrenFreeLabel) {
            childrenFreeLabel.textContent =
                `Children 0–${config.childFreeMaxAge} yrs`;
        }

        if (childrenDiscountLabel) {
            childrenDiscountLabel.textContent =
                `Children ${config.childDiscountMinAge}–${config.childDiscountMaxAge} yrs`;
        }

        if (childrenDiscountHelp) {
            childrenDiscountHelp.textContent =
                `₱${formatMoney(config.childDiscountAmount)} discount per child`;
        }
    }

    function getPassengerBreakdown() {
        const totalPax = getPax();
        const child0To3 = getChildCount(children0To3);
        const child4To8 = getChildCount(children4To8);
        const childTotal = child0To3 + child4To8;

        const regularPax = Math.max(0, totalPax - childTotal);

        const passengerPricing = getPackagePassengerPricing();
        const exclusiveConfig = getPackageExclusiveTour();

        const freeChildPax =
            passengerPricing.enabled ? child0To3 : 0;

        const discountedChildPax =
            passengerPricing.enabled ? child4To8 : 0;

        const payingPaxBeforeExclusive =
            passengerPricing.enabled
                ? regularPax + discountedChildPax
                : totalPax;

        const isExclusive =
            exclusiveConfig.enabled &&
            payingPaxBeforeExclusive >=
                exclusiveConfig.minimumPayingPax;

        const exclusiveFreePax =
            exclusiveConfig.enabled &&
            payingPaxBeforeExclusive >= exclusiveConfig.freeStartsAt

                ? Math.min(
                    exclusiveConfig.freePax,
                    exclusiveConfig.maxFreePax,
                    payingPaxBeforeExclusive
                )

                : 0;

        const payablePax =
            Math.max(
                0,
                payingPaxBeforeExclusive - exclusiveFreePax
            );

        return {
            totalPax,
            child0To3,
            child4To8,
            childTotal,
            regularPax,
            kidsPricingEnabled: passengerPricing.enabled,
            freeChildPax,
            discountedChildPax,
            childDiscountPerPax: passengerPricing.childDiscountAmount,
            payingPaxBeforeExclusive,
            exclusiveTourEnabled: exclusiveConfig.enabled,
            isExclusive,
            exclusiveFreePax,
            payablePax,
            passengerPricing,
            exclusiveConfig
        };
    }


    /* =====================================================
       SCHEDULES
       ===================================================== */

    function getRequestedDateConfig() {
        const settings = selectedPackage?.scheduleSettings || {};
        return {
            enabled: settings.requestedTravelDateEnabled === true,
            minPax: Math.max(1, normalizeNumber(settings.requestedTravelDateMinPax) || 10)
        };
    }

    function getRegularScheduleConfig() {
        const settings = selectedPackage?.scheduleSettings || {};
        const durationMatch = String(selectedPackage?.duration || "").match(/\d+/);
        return {
            enabled: settings.enabled === true,
            startDay: Math.min(6, Math.max(0, normalizeNumber(settings.startDay))),
            durationDays: Math.max(1, normalizeNumber(settings.durationDays) || normalizeNumber(durationMatch?.[0]) || 1)
        };
    }

    function generateRegularSchedulesForMonth(year, month) {
        const config = getRegularScheduleConfig();
        if (!config.enabled) return [];

        const firstOfMonth = new Date(year, month, 1);
        const lastOfMonth = new Date(year, month + 1, 0);

        const firstMatch = new Date(firstOfMonth);
        const daysUntil =
            (config.startDay - firstMatch.getDay() + 7) % 7;

        firstMatch.setDate(firstMatch.getDate() + daysUntil);

        const schedules = [];

        for (
            let start = new Date(firstMatch);
            start <= lastOfMonth;
            start.setDate(start.getDate() + 7)
        ) {
            const end = new Date(start);
            end.setDate(
                start.getDate() +
                config.durationDays -
                1
            );

            const startDate = toDateInputValue(start);
            const endDate = toDateInputValue(end);

            schedules.push({
                id: `regular-${startDate}`,
                startDate,
                endDate,
                status: "available",
                slots: null,
                generatedRegularSchedule: true
            });
        }

        return schedules;
    }

    function schedulesForMonth(year, month) {
        const generated =
            generateRegularSchedulesForMonth(
                year,
                month
            );

        const monthPrefix =
            `${year}-${String(month + 1).padStart(2, "0")}-`;

        const explicit =
            loadedScheduleItems.filter(
                item =>
                    String(item.startDate || "")
                        .startsWith(monthPrefix)
            );

        const map = new Map();

        generated.forEach(
            item => map.set(item.startDate, item)
        );

        explicit.forEach(
            item => map.set(item.startDate, item)
        );

        return Array.from(map.values())
            .sort(
                (a, b) =>
                    String(a.startDate)
                        .localeCompare(
                            String(b.startDate)
                        )
            );
    }

    function upcomingSchedulesFromCursor(
        count = 3
    ) {
        const results = [];
        const seen = new Set();

        let probe =
            new Date(
                calendarCursor.getFullYear(),
                calendarCursor.getMonth(),
                1
            );

        /*
         * Recurring schedules can continue indefinitely.
         * We calculate months only as the user browses them,
         * so there is no advance-booking year cap.
         */
        for (
            let monthIndex = 0;
            monthIndex < 36 &&
            results.length < count;
            monthIndex += 1
        ) {
            const monthSchedules =
                schedulesForMonth(
                    probe.getFullYear(),
                    probe.getMonth()
                );

            monthSchedules.forEach(item => {
                if (
                    results.length < count &&
                    !scheduleIsFull(item) &&
                    normalizeLower(item.status) !== "closed" &&
                    !seen.has(item.startDate) &&
                    new Date(`${item.startDate}T00:00:00`) >=
                        new Date(new Date().setHours(0, 0, 0, 0))
                ) {
                    seen.add(item.startDate);
                    results.push(item);
                }
            });

            probe.setMonth(
                probe.getMonth() + 1
            );
        }

        return results;
    }

    function isMobileBookingView() {
        return window.matchMedia(
            "(max-width: 560px)"
        ).matches;
    }

    function setMobileCalendarOpen(
        isOpen,
        shouldScroll = false
    ) {
        if (!travelCalendarCard) {
            return;
        }

        travelCalendarCard.classList.toggle(
            "mobile-calendar-open",
            isOpen
        );

        if (
            quickViewMoreButton &&
            isMobileBookingView()
        ) {
            const label =
                quickViewMoreButton.querySelector(
                    "span"
                );

            if (label) {
                label.textContent =
                    isOpen
                        ? "Hide Calendar"
                        : "View Calendar";
            }

            quickViewMoreButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        }

        if (
            isOpen &&
            shouldScroll &&
            isMobileBookingView()
        ) {
            travelCalendarCard.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    }

    function syncMobileCalendarUI() {
        if (!travelCalendarCard) {
            return;
        }

        if (isMobileBookingView()) {
            setMobileCalendarOpen(
                travelCalendarCard.classList.contains(
                    "mobile-calendar-open"
                )
            );
        } else {
            travelCalendarCard.classList.remove(
                "mobile-calendar-open"
            );

            if (quickViewMoreButton) {
                const label =
                    quickViewMoreButton.querySelector(
                        "span"
                    );

                if (label) {
                    label.textContent =
                        "View More";
                }

                quickViewMoreButton.removeAttribute(
                    "aria-expanded"
                );
            }
        }
    }

    function renderTravelCalendar() {
        if (
            !travelCalendarGrid ||
            !calendarMonthLabel
        ) {
            return;
        }

        const year =
            calendarCursor.getFullYear();

        const month =
            calendarCursor.getMonth();

        calendarMonthLabel.textContent =
            calendarCursor.toLocaleDateString(
                "en-US",
                {
                    month: "long",
                    year: "numeric"
                }
            );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const currentMonthStart =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );

        const cursorMonthStart =
            new Date(year, month, 1);

        if (calendarPrevMonth) {
            calendarPrevMonth.disabled =
                cursorMonthStart <=
                currentMonthStart;
        }

        const monthSchedules =
            schedulesForMonth(
                year,
                month
            );

        /*
         * Include nearby-month schedules too, so a tour that starts
         * near month-end can still highlight its full travel range.
         */
        const previousMonthSchedules =
            schedulesForMonth(
                new Date(year, month - 1, 1).getFullYear(),
                new Date(year, month - 1, 1).getMonth()
            );

        const nextMonthSchedules =
            schedulesForMonth(
                new Date(year, month + 1, 1).getFullYear(),
                new Date(year, month + 1, 1).getMonth()
            );

        const calendarSchedules =
            Array.from(
                new Map(
                    [
                        ...previousMonthSchedules,
                        ...monthSchedules,
                        ...nextMonthSchedules
                    ].map(item => [
                        item.startDate,
                        item
                    ])
                ).values()
            );

        const scheduleByDate =
            new Map(
                calendarSchedules.map(
                    item => [
                        item.startDate,
                        item
                    ]
                )
            );

        const getScheduleForCalendarDate =
            dateValue => {

                const exact =
                    scheduleByDate.get(
                        dateValue
                    );

                if (exact) {
                    return exact;
                }

                const target =
                    new Date(
                        `${dateValue}T00:00:00`
                    );

                return (
                    calendarSchedules.find(
                        schedule => {

                            if (
                                !schedule.startDate ||
                                !schedule.endDate
                            ) {
                                return false;
                            }

                            const start =
                                new Date(
                                    `${schedule.startDate}T00:00:00`
                                );

                            const end =
                                new Date(
                                    `${schedule.endDate}T00:00:00`
                                );

                            return (
                                target >= start &&
                                target <= end
                            );
                        }
                    ) ||
                    null
                );
            };

        const firstVisible =
            new Date(year, month, 1);

        firstVisible.setDate(
            1 - firstVisible.getDay()
        );

        travelCalendarGrid.innerHTML = "";

        for (
            let cell = 0;
            cell < 42;
            cell += 1
        ) {
            const date =
                new Date(firstVisible);

            date.setDate(
                firstVisible.getDate() +
                cell
            );

            const dateValue =
                toDateInputValue(date);

            const item =
                scheduleByDate.get(
                    dateValue
                );

            const rangeSchedule =
                getScheduleForCalendarDate(
                    dateValue
                );

            const displaySchedule =
                item ||
                rangeSchedule;

            const outsideMonth =
                date.getMonth() !== month;

            const past =
                date < today;

            const full =
                displaySchedule
                    ? scheduleIsFull(
                        displaySchedule
                    )
                    : false;

            const limited =
                displaySchedule &&
                !full &&
                scheduleIsLimited(
                    displaySchedule
                );

            const closed =
                displaySchedule &&
                normalizeLower(
                    displaySchedule.status
                ) === "closed";

            const button =
                document.createElement(
                    "button"
                );

            button.type = "button";

            button.className =
                [
                    "calendar-day",
                    outsideMonth
                        ? "outside-month"
                        : "",
                    past
                        ? "past"
                        : "",
                    displaySchedule && !past
                        ? "has-schedule"
                        : "",
                    displaySchedule && !item && !past
                        ? "schedule-range-day"
                        : "",
                    limited
                        ? "limited"
                        : "",
                    full
                        ? "full"
                        : "",
                    closed
                        ? "closed"
                        : ""
                ]
                .filter(Boolean)
                .join(" ");

            let calendarStatusLabel = "";

            if (
                displaySchedule &&
                !past &&
                !outsideMonth
            ) {
                if (full) {
                    calendarStatusLabel =
                        "Fully Booked";
                } else if (closed) {
                    calendarStatusLabel =
                        "Unavailable";
                } else if (limited) {
                    calendarStatusLabel =
                        "Limited";
                } else {
                    calendarStatusLabel =
                        "Available";
                }
            }

            button.innerHTML = `
                <span class="calendar-day-number">
                    ${date.getDate()}
                </span>

                ${
                    calendarStatusLabel
                        ? `
                            <span class="calendar-day-label">
                                ${calendarStatusLabel}
                            </span>
                        `
                        : ""
                }
            `;

            button.dataset.date =
                dateValue;

            button.disabled =
                !displaySchedule ||
                past ||
                full ||
                closed;

            if (
                selectedSchedule?.startDate ===
                dateValue
            ) {
                button.classList.add(
                    "selected"
                );
            }

            if (
                selectedSchedule?.startDate &&
                selectedSchedule?.endDate
            ) {
                const rangeStart =
                    new Date(
                        `${selectedSchedule.startDate}T00:00:00`
                    );

                const rangeEnd =
                    new Date(
                        `${selectedSchedule.endDate}T00:00:00`
                    );

                if (
                    date >= rangeStart &&
                    date <= rangeEnd
                ) {
                    button.classList.add(
                        "in-selected-range"
                    );
                }
            }

            if (
                displaySchedule &&
                !button.disabled
            ) {
                button.title =
                    `${formatTravelDate(
                        displaySchedule.startDate
                    )}${
                        displaySchedule.endDate
                            ? ` to ${formatTravelDate(
                                displaySchedule.endDate
                            )}`
                            : ""
                    }`;

                button.addEventListener(
                    "click",
                    () => {
                        selectSchedule(
                            displaySchedule,
                            button
                        );
                    }
                );
            }

            travelCalendarGrid.appendChild(
                button
            );
        }

        renderQuickSchedules();
        renderSelectedScheduleCard();
    }

    function renderQuickSchedules() {
        if (!travelScheduleList) return;

        const upcoming =
            upcomingSchedulesFromCursor(3);

        if (!upcoming.length) {
            travelScheduleList.innerHTML = `
                <div class="schedule-state" style="grid-column:1/-1;">
                    <span>No published schedule found from this month.</span>
                </div>
            `;
            return;
        }

        renderScheduleCards(
            upcoming,
            false
        );
    }

    function renderSelectedScheduleCard() {
        if (!selectedScheduleCard) return;

        if (
            !selectedSchedule ||
            selectedSchedule.requestedDate
        ) {
            selectedScheduleCard.innerHTML = "";
            selectedScheduleCard.classList.add("hidden");
            return;
        }

        selectedScheduleCard.classList.remove("hidden");

        const full =
            scheduleIsFull(
                selectedSchedule
            );

        const limited =
            !full &&
            scheduleIsLimited(
                selectedSchedule
            );

        const statusLabel =
            full
                ? "Fully Booked"
                : limited
                    ? "Limited Slots"
                    : "Available";

        const confirmedPax =
            getConfirmedPax(
                selectedSchedule
            );

        const confirmedText =
            `${confirmedPax} pax confirmed`;

        selectedScheduleCard.innerHTML = `
            <div class="selected-schedule-info">
                <div>
                    <strong>Selected Schedule</strong>

                    <div class="selected-schedule-date">
                        ${escapeHtml(
                            formatTravelDate(
                                selectedSchedule.startDate
                            )
                        )}
                        ${
                            selectedSchedule.endDate
                                ? ` – ${escapeHtml(
                                    formatTravelDate(
                                        selectedSchedule.endDate
                                    )
                                )}`
                                : ""
                        }
                    </div>

                    <div class="selected-schedule-meta">
                        ${escapeHtml(
                            selectedPackage?.duration ||
                            ""
                        )}
                    </div>
                </div>

                <span class="selected-schedule-badge ${limited ? "limited" : ""}">
                    ${statusLabel}
                </span>

                <div class="selected-schedule-extra">
                    <div>
                        <i class="fa-solid fa-user-group"></i>
                        <div>
                            <small>Confirmed Booking</small>
                            <strong>${escapeHtml(confirmedText)}</strong>
                        </div>
                    </div>

                    <div>
                        <i class="fa-solid fa-tag"></i>
                        <div>
                            <small>Package Rate</small>
                            <strong>₱${formatMoney(selectedPackage?.price || 0)} / person</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function syncRequestedDateEligibility() {
        const config = getRequestedDateConfig();
        if (!requestedDateOption) return;

        requestedDateOption.classList.toggle("hidden", !config.enabled);

        if (!config.enabled) {
            exitRequestedDateMode(false);
            return;
        }

        if (requestedDateMinimumText) {
            requestedDateMinimumText.textContent =
                `Minimum ${config.minPax} guests required for a custom date.`;
        }

        const pax = getPassengerBreakdown().totalPax;
        const eligible = pax >= config.minPax;

        if (requestedTravelDate) {
            requestedTravelDate.disabled = !eligible;
            requestedTravelDate.min = toDateInputValue(new Date());
        }

        if (requestedDateRequirementTitle) {
            requestedDateRequirementTitle.textContent =
                eligible
                    ? "Custom date request available"
                    : `Minimum ${config.minPax} guests required`;
        }

        if (requestedDateRequirementText) {
            const missing = Math.max(0, config.minPax - pax);
            requestedDateRequirementText.textContent =
                eligible
                    ? `Your group has ${pax} pax. You may select a preferred travel date.`
                    : `Current headcount: ${pax} pax. Add at least ${missing} more guest${missing === 1 ? "" : "s"} to request another date.`;
        }

        if (isRequestedDateMode && !eligible) {
            if (requestedTravelDate) requestedTravelDate.value = "";
            selectedSchedule = null;
            if (travelDate) travelDate.value = "";
            if (selectedScheduleId) selectedScheduleId.value = "";
        }

        syncRequestedDateModeUI();
    }

    function syncRequestedDateModeUI() {
        document.body.classList.toggle("requested-date-mode", isRequestedDateMode);
        requestAnotherDateButton?.classList.toggle("active", isRequestedDateMode);
        requestedDatePanel?.classList.toggle("hidden", !isRequestedDateMode);

        if (bookingAgreementText) {
            bookingAgreementText.textContent =
                isRequestedDateMode
                    ? "I confirm that the information provided is correct and understand that my requested travel date is subject to Trips Wonder availability and admin approval."
                    : "I confirm that the information provided is correct and understand that my booking will only be confirmed after Trips Wonder verifies my payment.";
        }

        if (submitBookingButton) {
            submitBookingButton.innerHTML =
                isRequestedDateMode
                    ? `<span>Submit Date Request</span><i class="fa-solid fa-calendar-check"></i>`
                    : `<span>Proceed to Payment</span><i class="fa-solid fa-arrow-right"></i>`;
        }

        updateProgress();
    }

    function enterRequestedDateMode() {
        if (!getRequestedDateConfig().enabled) return;

        isRequestedDateMode = true;

        document.querySelectorAll(".schedule-card")
            .forEach(card => card.classList.remove("selected"));

        selectedAccommodation = null;
        if (accommodation) accommodation.value = "";
        if (selectedAccommodationId) selectedAccommodationId.value = "";

        syncRequestedDateEligibility();
        renderTravelCalendar();
    }

    function exitRequestedDateMode(preserveSchedule = false) {
        isRequestedDateMode = false;

        if (requestedTravelDate) requestedTravelDate.value = "";

        if (!preserveSchedule && selectedSchedule?.requestedDate === true) {
            selectedSchedule = null;
            if (travelDate) travelDate.value = "";
            if (selectedScheduleId) selectedScheduleId.value = "";
        }

        syncRequestedDateModeUI();
    }

    function selectRequestedTravelDate() {
        if (!isRequestedDateMode) return;

        const config = getRequestedDateConfig();
        const pax = getPassengerBreakdown().totalPax;

        if (pax < config.minPax) {
            if (requestedTravelDate) requestedTravelDate.value = "";
            syncRequestedDateEligibility();
            return;
        }

        const startDate = requestedTravelDate?.value || "";

        if (!startDate) {
            selectedSchedule = null;
            if (travelDate) travelDate.value = "";
            if (selectedScheduleId) selectedScheduleId.value = "";
            updateProgress();
            return;
        }

        selectedSchedule = {
            id: `requested-${startDate}`,
            startDate,
            endDate: calculateTravelEndDate(startDate, selectedPackage?.duration),
            status: "requested",
            requestedDate: true,
            minimumHeadcount: config.minPax
        };

        if (travelDate) travelDate.value = startDate;
        if (selectedScheduleId) selectedScheduleId.value = "";

        updateBookingSummary();
        updateProgress();
    }


    function packageSchedules() {
        const candidates = [
            selectedPackage?.schedules,
            selectedPackage?.travelSchedules,
            selectedPackage?.tourSchedules,
            selectedPackage?.availableSchedules,
            selectedPackage?.dates
        ];

        const array =
            candidates.find(value => Array.isArray(value)) || [];

        return array
            .map((item, index) => {

                if (typeof item === "string") {
                    return {
                        id: `schedule-${index + 1}`,
                        startDate: normalizeDateValue(item),
                        status: "available"
                    };
                }

                const startDate =
                    normalizeDateValue(
                        item?.startDate ||
                        item?.travelDate ||
                        item?.date ||
                        item?.from
                    );

                return {
                    ...item,
                    id:
                        normalizeText(
                            item?.id ||
                            item?.scheduleId ||
                            item?.reference
                        ) ||
                        `schedule-${index + 1}`,

                    startDate,

                    endDate:
                        normalizeDateValue(
                            item?.endDate ||
                            item?.to
                        ),

                    status:
                        normalizeLower(
                            item?.status ||
                            "available"
                        ),

                    slots:
                        normalizeNumber(
                            item?.slotsRemaining ??
                            item?.remainingSlots ??
                            item?.availableSlots ??
                            item?.slots
                        )
                };
            })
            .filter(item => item.startDate);
    }

    async function loadSchedules() {
        if (!travelScheduleList) return;

        let schedules = packageSchedules();

        /*
         * Optional Firestore schedule support.
         * If your package document has no embedded schedules, the page
         * also checks /tourSchedules by packageId.
         */
        if (!schedules.length && selectedPackage?.id) {
            try {
                const scheduleQuery =
                    query(
                        collection(db, "tourSchedules"),
                        where("packageId", "==", selectedPackage.id)
                    );

                const snapshot = await getDocs(scheduleQuery);

                schedules = snapshot.docs
                    .map(scheduleDoc => {
                        const item = scheduleDoc.data() || {};

                        return {
                            ...item,
                            id: scheduleDoc.id,
                            startDate:
                                normalizeDateValue(
                                    item.startDate ||
                                    item.travelDate ||
                                    item.date
                                ),

                            endDate:
                                normalizeDateValue(item.endDate),

                            status:
                                normalizeLower(item.status || "available"),

                            slots:
                                normalizeNumber(
                                    item.slotsRemaining ??
                                    item.remainingSlots ??
                                    item.availableSlots ??
                                    item.slots
                                )
                        };
                    })
                    .filter(item => item.startDate);

            } catch (error) {
                console.warn(
                    "TOUR SCHEDULE COLLECTION NOT AVAILABLE:",
                    error
                );
            }
        }

        loadedScheduleItems =
            schedules
                .filter(
                    item => item.startDate
                )
                .sort(
                    (a, b) =>
                        String(a.startDate)
                            .localeCompare(
                                String(b.startDate)
                            )
                );

        calendarCursor =
            new Date();

        calendarCursor.setDate(1);
        calendarCursor.setHours(0, 0, 0, 0);

        syncRequestedDateEligibility();

        const regularEnabled =
            getRegularScheduleConfig()
                .enabled;

        if (
            regularEnabled ||
            loadedScheduleItems.length
        ) {
            scheduleLoading?.classList.add(
                "hidden"
            );

            /*
             * Do not auto-select the first available schedule.
             * The customer must explicitly choose a preferred travel date.
             */
            selectedSchedule = null;

            if (travelDate) {
                travelDate.value = "";
            }

            if (selectedScheduleId) {
                selectedScheduleId.value = "";
            }

            renderTravelCalendar();
            renderSelectedScheduleCard();
            updateProgress();

            return;
        }

        if (
            getRequestedDateConfig().enabled
        ) {
            scheduleLoading?.classList.add(
                "hidden"
            );

            if (travelScheduleList) {
                travelScheduleList.innerHTML = `
                    <div class="schedule-state" style="grid-column:1/-1;">
                        <span>No regular dates are published. You may request another travel date below.</span>
                    </div>
                `;
            }

            renderTravelCalendar();
            return;
        }

        renderManualDateFallback();
    }

    function scheduleIsFull(item) {
        const status = normalizeLower(item.status);

        return (
            status === "full" ||
            status === "fully_booked" ||
            status === "fully booked" ||
            item.full === true ||
            (
                Object.prototype.hasOwnProperty.call(item, "slots") &&
                item.slots === 0
            )
        );
    }

    function getConfirmedPax(item) {
        const possibleValue =
            item?.confirmedPax ??
            item?.confirmedPaxCount ??
            item?.confirmedGuests ??
            0;

        return Math.max(
            0,
            Math.floor(
                normalizeNumber(possibleValue) || 0
            )
        );
    }

    function scheduleIsLimited(item) {
        const status = normalizeLower(item.status);

        return (
            status === "limited" ||
            status === "limited_slots" ||
            status === "limited slots" ||
            (
                item.slots > 0 &&
                item.slots <= 5
            )
        );
    }

    function renderScheduleCards(schedules, showLoadingState = true) {
        if (showLoadingState) {
            scheduleLoading?.classList.add("hidden");
        }

        travelScheduleList.innerHTML = "";

        schedules.forEach(item => {
            const full = scheduleIsFull(item);
            const limited = !full && scheduleIsLimited(item);

            const button = document.createElement("button");

            button.type = "button";
            button.className =
                `schedule-card${full ? " fully-booked" : ""}`;

            button.disabled = full;

            const statusLabel =
                full
                    ? "Fully Booked"
                    : limited
                        ? "Limited Slots"
                        : "Available";

            button.innerHTML = `
                <div>
                    <div class="schedule-card-date">
                        ${escapeHtml(formatTravelDate(item.startDate))}
                    </div>

                    <div class="schedule-card-sub">
                        ${escapeHtml(
                            item.endDate
                                ? `until ${formatTravelDate(item.endDate)}`
                                : selectedPackage?.duration || ""
                        )}
                    </div>
                </div>

                <div class="schedule-card-footer">
                    <span class="schedule-status ${
                        full ? "full" : limited ? "limited" : ""
                    }">
                        ${statusLabel}
                    </span>

                    <span class="schedule-slots confirmed-pax-count">
                        ${getConfirmedPax(item)} pax confirmed
                    </span>
                </div>
            `;

            button.addEventListener("click", () => {
                selectSchedule(item, button);
            });

            travelScheduleList.appendChild(button);
        });
    }

    function renderManualDateFallback() {
        scheduleLoading?.classList.add("hidden");

        travelScheduleList.innerHTML = `
            <div class="form-field full" style="grid-column:1/-1;">
                <label for="manualTravelDate">
                    Travel Date *
                </label>

                <input
                    type="date"
                    id="manualTravelDate"
                    required
                >

                <small class="field-help">
                    Schedule cards will appear automatically once tour schedules
                    are configured in the admin system.
                </small>
            </div>
        `;

        const manualTravelDate = $("manualTravelDate");

        if (manualTravelDate) {
            manualTravelDate.min = toDateInputValue(new Date());

            manualTravelDate.addEventListener("change", () => {
                selectedSchedule = {
                    id: "",
                    startDate: manualTravelDate.value,
                    endDate:
                        calculateTravelEndDate(
                            manualTravelDate.value,
                            selectedPackage?.duration
                        ),
                    status: "available",
                    manual: true
                };

                if (travelDate) {
                    travelDate.value = manualTravelDate.value;
                }

                if (selectedScheduleId) {
                    selectedScheduleId.value = "";
                }

                renderAccommodationCards();
                updateProgress();
            });
        }
    }

    function selectSchedule(item, button) {
        exitRequestedDateMode(true);
        selectedSchedule = item;

        if (travelDate) {
            travelDate.value = item.startDate;
        }

        if (selectedScheduleId) {
            selectedScheduleId.value = item.id || "";
        }

        document
            .querySelectorAll(
                ".schedule-card, .calendar-day"
            )
            .forEach(card => {
                const sameDate =
                    card.dataset?.date ===
                    item.startDate;

                card.classList.toggle(
                    "selected",
                    card === button ||
                    sameDate
                );
            });

        if (
            button?.classList?.contains(
                "schedule-card"
            )
        ) {
            const selectedDate =
                new Date(
                    `${item.startDate}T00:00:00`
                );

            if (
                selectedDate.getFullYear() !==
                    calendarCursor.getFullYear() ||
                selectedDate.getMonth() !==
                    calendarCursor.getMonth()
            ) {
                calendarCursor =
                    new Date(
                        selectedDate.getFullYear(),
                        selectedDate.getMonth(),
                        1
                    );
            }
        }

        /*
         * Changing the schedule invalidates an accommodation choice,
         * because availability is schedule-specific.
         */
        selectedAccommodation = null;

        if (accommodation) accommodation.value = "";
        if (selectedAccommodationId) {
            selectedAccommodationId.value = "";
        }

        renderSelectedScheduleCard();
        renderAccommodationCards();
        clearAppliedPromo();
        updateBookingSummary();
        updateProgress();
        renderTravelCalendar();
    }


    /* =====================================================
       PICKUP LOCATIONS
       ===================================================== */

    function populatePickupLocations() {
        if (!pickupPoint) return;

        const configured =
            Array.isArray(selectedPackage?.pickupLocations)
                ? selectedPackage.pickupLocations
                    .map(item =>
                        normalizeText(
                            typeof item === "string"
                                ? item
                                : item?.name || item?.label || item?.value
                        )
                    )
                    .filter(Boolean)
                : [];

        /*
         * Keep the default Trips Wonder pickup locations if the package
         * does not provide its own list.
         */
        const locations =
            configured.length
                ? configured
                : [
                    "Pasay - Uniqlo",
                    "Greenfield Shaw",
                    "Quezon Ave / Centris"
                ];

        pickupPoint.innerHTML =
            `<option value="">Select pick-up location</option>` +
            locations.map(location =>
                `<option value="${escapeHtml(location)}">
                    ${escapeHtml(location)}
                 </option>`
            ).join("") +
            `<option value="Other / Along the Way">
                Other / Along the Way
             </option>`;
    }

    function handlePickupChange() {
        const isOther =
            pickupPoint?.value === "Other / Along the Way";

        otherPickupField?.classList.toggle("hidden", !isOther);

        if (otherPickup) {
            otherPickup.required = isOther;

            if (!isOther) {
                otherPickup.value = "";
            }
        }
    }


    /* =====================================================
       ACCOMMODATION
       ===================================================== */

    function packageAccommodations() {
        return Array.isArray(selectedPackage?.accommodations)
            ? selectedPackage.accommodations
            : [];
    }

    function normalizeAccommodation(item, index) {
        const type =
            normalizeLower(
                item?.type ||
                item?.optionType ||
                item?.category ||
                "included"
            );

        const included =
            type === "included" ||
            item?.included === true ||
            item?.isIncluded === true;

        const pricePerNight =
            Math.max(
                0,
                normalizeNumber(
                    item?.pricePerNight ??
                    item?.upgradePricePerNight
                )
            );

        const flatPrice =
            Math.max(
                0,
                normalizeNumber(
                    item?.price ??
                    item?.upgradePrice ??
                    item?.additionalPrice
                )
            );

        const nights = getBookingNights();

        const totalPrice =
            included
                ? 0
                : pricePerNight > 0
                    ? pricePerNight * nights
                    : flatPrice;

        const gallery =
            Array.isArray(item?.gallery)
                ? item.gallery
                : Array.isArray(item?.photos)
                    ? item.photos
                    : [];

        const photo =
            normalizeText(
                item?.mainPhoto?.url ||
                item?.mainPhoto ||
                item?.photo?.url ||
                item?.photo ||
                item?.imageUrl
            ) ||
            firstPhotoUrl(gallery);

        const features =
            Array.isArray(item?.amenities)
                ? item.amenities
                : Array.isArray(item?.features)
                    ? item.features
                    : [];

        return {
            ...item,

            id:
                normalizeText(
                    item?.id ||
                    item?.accommodationId
                ) ||
                `accommodation-${index + 1}`,

            name:
                normalizeText(
                    item?.name ||
                    item?.title
                ) ||
                (included
                    ? "Package Included Accommodation"
                    : "Accommodation Upgrade"),

            resortName:
                normalizeText(item?.resortName),

            capacity:
                normalizeText(
                    item?.capacity ||
                    item?.maxGuests ||
                    item?.occupancy
                ),

            type: included ? "included" : "upgrade",
            included,
            price: totalPrice,
            pricePerNight,
            nights,
            photo,
            gallery,
            features
        };
    }

    function accommodationAvailability(item) {
        if (!selectedSchedule?.startDate) {
            return {
                available: false,
                status: "Select Date",
                limited: false
            };
        }

        const date = selectedSchedule.startDate;
        let available = true;
        let status = "Available";
        let limited = false;

        const unavailableDates =
            Array.isArray(item?.unavailableDates)
                ? item.unavailableDates.map(normalizeDateValue)
                : [];

        const availableDates =
            Array.isArray(item?.availableDates)
                ? item.availableDates.map(normalizeDateValue)
                : [];

        if (unavailableDates.includes(date)) {
            available = false;
            status = "Fully Booked";
        }

        if (availableDates.length && !availableDates.includes(date)) {
            available = false;
            status = "Fully Booked";
        }

        /*
         * Support common schedule-based inventory shapes:
         * scheduleAvailability: { scheduleId: { available, remaining } }
         * availability: [{ scheduleId/date, available, remaining }]
         */
        const scheduleId =
            normalizeText(selectedSchedule?.id);

        const map =
            item?.scheduleAvailability &&
            typeof item.scheduleAvailability === "object" &&
            !Array.isArray(item.scheduleAvailability)
                ? item.scheduleAvailability
                : null;

        const mapped =
            map
                ? map[scheduleId] || map[date]
                : null;

        if (mapped !== null && mapped !== undefined) {
            if (typeof mapped === "boolean") {
                available = mapped;
            } else if (typeof mapped === "number") {
                available = mapped > 0;
                limited = mapped > 0 && mapped <= 2;
            } else if (typeof mapped === "object") {
                if (mapped.available === false) available = false;

                const remaining =
                    normalizeNumber(
                        mapped.remaining ??
                        mapped.availableRooms ??
                        mapped.slots
                    );

                if (
                    Object.prototype.hasOwnProperty.call(mapped, "remaining") ||
                    Object.prototype.hasOwnProperty.call(mapped, "availableRooms") ||
                    Object.prototype.hasOwnProperty.call(mapped, "slots")
                ) {
                    available = remaining > 0;
                    limited = remaining > 0 && remaining <= 2;
                }
            }
        }

        if (Array.isArray(item?.availability)) {
            const record =
                item.availability.find(record =>
                    normalizeText(record?.scheduleId) === scheduleId ||
                    normalizeDateValue(record?.date) === date
                );

            if (record) {
                if (record.available === false) {
                    available = false;
                }

                const remaining =
                    normalizeNumber(
                        record.remaining ??
                        record.availableRooms ??
                        record.slots
                    );

                if (
                    Object.prototype.hasOwnProperty.call(record, "remaining") ||
                    Object.prototype.hasOwnProperty.call(record, "availableRooms") ||
                    Object.prototype.hasOwnProperty.call(record, "slots")
                ) {
                    available = remaining > 0;
                    limited = remaining > 0 && remaining <= 2;
                }
            }
        }

        if (item?.active === false) {
            available = false;
        }

        const itemStatus =
            normalizeLower(item?.status || "active");

        if (
            itemStatus === "hidden" ||
            itemStatus === "inactive" ||
            itemStatus === "full" ||
            itemStatus === "fully_booked"
        ) {
            available = false;
        }

        if (!available) {
            status = "Fully Booked";
            limited = false;
        } else if (limited) {
            status = "Only 1–2 Left";
        }

        return {
            available,
            status,
            limited
        };
    }

    function renderAccommodationCards(filter = "all") {
        if (!accommodationList) return;

        if (!selectedSchedule?.startDate) {
            accommodationList.innerHTML = "";
            accommodationLoadingState?.classList.remove("hidden");
            return;
        }

        accommodationLoadingState?.classList.add("hidden");

        let options =
            packageAccommodations()
                .map(normalizeAccommodation);

        if (!options.length) {
            options = [{
                id: "included-standard",
                name: "Standard / Package Included",
                resortName: "",
                capacity: "",
                type: "included",
                included: true,
                price: 0,
                pricePerNight: 0,
                nights: getBookingNights(),
                photo: "",
                gallery: [],
                features: []
            }];
        }

        const visible =
            options.filter(item =>
                filter === "all" ||
                item.type === filter
            );

        accommodationList.innerHTML = "";

        if (!visible.length) {
            accommodationList.innerHTML = `
                <div class="accommodation-state" style="grid-column:1/-1;">
                    <i class="fa-solid fa-bed"></i>
                    <strong>No accommodation found</strong>
                    <span>No options are available under this filter.</span>
                </div>
            `;
            return;
        }

        visible.forEach(item => {
            const availability =
                accommodationAvailability(item);

            const card = document.createElement("article");

            card.className =
                `accommodation-card ${
                    availability.available ? "" : "unavailable"
                } ${
                    selectedAccommodation?.id === item.id
                        ? "selected"
                        : ""
                }`;

            const featureItems =
                item.features
                    .slice(0, 4)
                    .map(feature =>
                        `<span>${escapeHtml(
                            typeof feature === "string"
                                ? feature
                                : feature?.name || feature?.label
                        )}</span>`
                    )
                    .join("");

            card.innerHTML = `
                <div class="accommodation-image">
                    ${
                        item.photo
                            ? `<img src="${escapeHtml(item.photo)}"
                                    alt="${escapeHtml(item.name)}">`
                            : `<div style="
                                    width:100%;
                                    height:100%;
                                    display:grid;
                                    place-items:center;
                                    color:#9babb4;
                                    font-size:28px;">
                                    <i class="fa-solid fa-bed"></i>
                               </div>`
                    }

                    <div class="accommodation-badges">
                        <span class="accommodation-badge ${
                            item.included ? "included" : "upgrade"
                        }">
                            ${
                                item.included
                                    ? "Included"
                                    : "Room Upgrade"
                            }
                        </span>

                        <span class="accommodation-badge availability ${
                            availability.available
                                ? availability.limited
                                    ? "limited"
                                    : ""
                                : "full"
                        }">
                            ${escapeHtml(availability.status)}
                        </span>
                    </div>
                </div>

                <div class="accommodation-body">

                    <div class="accommodation-title-row">
                        <h3>${escapeHtml(item.name)}</h3>

                        <div class="accommodation-price">
                            ${
                                item.included
                                    ? "Included"
                                    : `+₱${formatMoney(item.price)}`
                            }

                            ${
                                !item.included && item.pricePerNight > 0
                                    ? `<small>
                                        ₱${formatMoney(item.pricePerNight)}/night
                                       </small>`
                                    : ""
                            }
                        </div>
                    </div>

                    ${
                        item.capacity
                            ? `<div class="accommodation-capacity">
                                <i class="fa-solid fa-user-group"></i>
                                ${escapeHtml(item.capacity)}
                               </div>`
                            : ""
                    }

                    ${
                        featureItems
                            ? `<div class="accommodation-features">
                                ${featureItems}
                               </div>`
                            : ""
                    }

                    <div class="accommodation-actions">
                        <button
                            type="button"
                            class="view-photos-button"
                            ${item.gallery.length || item.photo ? "" : "disabled"}
                        >
                            View Photos
                        </button>

                        <button
                            type="button"
                            class="select-accommodation-button"
                            ${availability.available ? "" : "disabled"}
                        >
                            ${
                                selectedAccommodation?.id === item.id
                                    ? "Selected"
                                    : "Select"
                            }
                        </button>
                    </div>

                </div>
            `;

            card
                .querySelector(".view-photos-button")
                ?.addEventListener("click", () => {
                    openAccommodationGallery(item);
                });

            card
                .querySelector(".select-accommodation-button")
                ?.addEventListener("click", () => {
                    selectAccommodation(item);
                });

            accommodationList.appendChild(card);
        });

        /*
         * Automatically select the first available Included option
         * if the client has not selected one yet.
         */
        if (!selectedAccommodation) {
            const defaultIncluded =
                options.find(item =>
                    item.included &&
                    accommodationAvailability(item).available
                );

            if (defaultIncluded) {
                selectAccommodation(
                    defaultIncluded,
                    false
                );
            }
        }
    }

    function selectAccommodation(item, rerender = true) {
        selectedAccommodation = item;

        if (accommodation) {
            accommodation.value = item.name;
        }

        if (selectedAccommodationId) {
            selectedAccommodationId.value = item.id;
        }

        selectedAccommodationSummary?.classList.remove("hidden");

        if (selectedAccommodationName) {
            selectedAccommodationName.textContent = item.name;
        }

        if (selectedAccommodationPrice) {
            selectedAccommodationPrice.textContent =
                item.price > 0
                    ? `+₱${formatMoney(item.price)}`
                    : "Included";
        }

        clearAppliedPromo();
        updateBookingSummary();
        updateProgress();

        if (rerender) {
            const activeFilter =
                accommodationTabs
                    ?.querySelector("button.active")
                    ?.dataset.filter ||
                "all";

            renderAccommodationCards(activeFilter);
        }
    }

    function openAccommodationGallery(item) {
        const photos = [];

        if (item.photo) photos.push(item.photo);

        if (Array.isArray(item.gallery)) {
            item.gallery.forEach(photo => {
                const url =
                    typeof photo === "string"
                        ? photo
                        : photo?.url || photo?.src || "";

                if (normalizeText(url) && !photos.includes(url)) {
                    photos.push(normalizeText(url));
                }
            });
        }

        if (!photos.length) return;

        galleryPhotos = photos;
        galleryIndex = 0;

        if (galleryAccommodationName) {
            galleryAccommodationName.textContent = item.name;
        }

        renderGallery();
        setModalState(accommodationGalleryModal, true);
    }

    function renderGallery() {
        if (!galleryPhotos.length) return;

        galleryIndex =
            (galleryIndex + galleryPhotos.length) %
            galleryPhotos.length;

        if (galleryMainImage) {
            galleryMainImage.src =
                galleryPhotos[galleryIndex];
        }

        if (galleryCounter) {
            galleryCounter.textContent =
                `${galleryIndex + 1} / ${galleryPhotos.length}`;
        }

        if (galleryThumbnails) {
            galleryThumbnails.innerHTML = "";

            galleryPhotos.forEach((photo, index) => {
                const button = document.createElement("button");

                button.type = "button";
                button.className =
                    `gallery-thumbnail ${
                        index === galleryIndex ? "active" : ""
                    }`;

                button.innerHTML =
                    `<img src="${escapeHtml(photo)}"
                          alt="Accommodation photo ${index + 1}">`;

                button.addEventListener("click", () => {
                    galleryIndex = index;
                    renderGallery();
                });

                galleryThumbnails.appendChild(button);
            });
        }
    }


    /* =====================================================
       PROMOS / TRIPSWONDER DISCOUNT
       ===================================================== */

    function promoAppliesToPackage(promo) {
        const applicableTo =
            normalizeLower(promo?.applicableTo || "all");

        if (
            applicableTo === "all" ||
            applicableTo === "" ||
            applicableTo === "all packages"
        ) {
            return true;
        }

        const promoPackageId =
            normalizeText(promo?.packageId);

        if (
            promoPackageId &&
            promoPackageId !== selectedPackage?.id
        ) {
            return false;
        }

        const ids =
            Array.isArray(promo?.packageIds)
                ? promo.packageIds.map(normalizeText)
                : [];

        if (
            ids.length &&
            !ids.includes(selectedPackage?.id)
        ) {
            return false;
        }

        return true;
    }

    function promoDateIsValid(promo) {
        const now = new Date();

        const from =
            promo?.validFrom?.toDate instanceof Function
                ? promo.validFrom.toDate()
                : promo?.validFrom
                    ? new Date(promo.validFrom)
                    : null;

        const until =
            promo?.validUntil?.toDate instanceof Function
                ? promo.validUntil.toDate()
                : promo?.validUntil
                    ? new Date(promo.validUntil)
                    : null;

        if (from && !Number.isNaN(from.getTime()) && now < from) {
            return false;
        }

        if (until && !Number.isNaN(until.getTime()) && now > until) {
            return false;
        }

        return true;
    }

    function calculatePromoDiscount(promo, amount, payablePax) {
        if (!promo) return 0;

        const type =
            normalizeLower(
                promo.discountType ||
                promo.type
            );

        const value =
            Math.max(
                0,
                normalizeNumber(
                    promo.discountValue ??
                    promo.value ??
                    promo.amount
                )
            );

        let discount = 0;

        if (
            type === "percentage" ||
            type === "percent" ||
            type === "%"
        ) {
            discount = amount * (value / 100);

        } else if (
            type === "per_pax" ||
            type === "per pax" ||
            type === "perpax"
        ) {
            discount = value * payablePax;

        } else {
            discount = value;
        }

        const maximumDiscount =
            Math.max(
                0,
                normalizeNumber(promo.maximumDiscount)
            );

        if (maximumDiscount > 0) {
            discount =
                Math.min(discount, maximumDiscount);
        }

        return Math.min(
            Math.max(0, discount),
            Math.max(0, amount)
        );
    }

    function promoIsEligible(promo) {
        if (
            normalizeLower(promo?.status || "active") !== "active"
        ) {
            return false;
        }

        if (!promoDateIsValid(promo)) return false;
        if (!promoAppliesToPackage(promo)) return false;

        const calculation =
            calculateBooking(false);

        const minimumAmount =
            Math.max(0, normalizeNumber(promo?.minimumAmount));

        if (
            minimumAmount > 0 &&
            calculation.packageSubtotal < minimumAmount
        ) {
            return false;
        }

        const minimumPax =
            Math.max(1, normalizeNumber(promo?.minimumPax || 1));

        if (calculation.payablePax < minimumPax) {
            return false;
        }

        return (
            calculatePromoDiscount(
                promo,
                calculation.packageSubtotal,
                calculation.payablePax
            ) > 0
        );
    }

    async function loadEligiblePromos() {
        availablePromos = [];

        try {
            const promoQuery =
                query(
                    collection(db, "promos"),
                    where("status", "==", "active")
                );

            const snapshot =
                await getDocs(promoQuery);

            availablePromos =
                snapshot.docs
                    .map(promoDoc => ({
                        id: promoDoc.id,
                        ...promoDoc.data()
                    }))
                    .filter(promoIsEligible);

        } catch (error) {
            console.warn("LOAD PROMOS ERROR:", error);
        }

        renderDiscountList();
    }

    function renderDiscountList() {
        if (!discountList) return;

        const eligible =
            availablePromos.filter(promoIsEligible);

        discountList.innerHTML = "";

        if (!eligible.length) {
            const empty = document.createElement("div");

            empty.className = "modal-empty-state";
            empty.innerHTML = `
                <i class="fa-solid fa-ticket"></i>
                <strong>No eligible discount yet</strong>
                <span>
                    Available promos for this booking will appear here.
                </span>
            `;

            discountList.appendChild(empty);

            pendingPromo = null;

            if (confirmDiscountButton) {
                confirmDiscountButton.disabled = true;
            }

            return;
        }

        eligible.forEach(promo => {
            const calculation =
                calculateBooking(false);

            const discount =
                calculatePromoDiscount(
                    promo,
                    calculation.packageSubtotal,
                    calculation.payablePax
                );

            const card = document.createElement("button");

            card.type = "button";
            card.className =
                `discount-card ${
                    pendingPromo?.id === promo.id ||
                    appliedPromo?.id === promo.id
                        ? "selected"
                        : ""
                }`;

            card.innerHTML = `
                <span class="discount-card-icon">
                    <i class="fa-solid fa-ticket"></i>
                </span>

                <span class="discount-card-copy">
                    <strong>
                        ${escapeHtml(
                            promo.title ||
                            promo.name ||
                            promo.code ||
                            "Tripswonder Discount"
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            promo.description ||
                            (promo.code
                                ? `Promo ${promo.code}`
                                : "Eligible for this booking")
                        )}
                    </span>
                </span>

                <span class="discount-card-value">
                    -₱${formatMoney(discount)}
                </span>
            `;

            card.addEventListener("click", () => {
                pendingPromo = promo;
                renderDiscountList();

                if (confirmDiscountButton) {
                    confirmDiscountButton.disabled = false;
                }
            });

            discountList.appendChild(card);
        });

        if (
            confirmDiscountButton &&
            (pendingPromo || appliedPromo)
        ) {
            confirmDiscountButton.disabled = false;
        }
    }

    function clearAppliedPromo(message = "") {
        appliedPromo = null;
        pendingPromo = null;

        if (bookingPromoCode) {
            bookingPromoCode.value = "";
        }

        if (selectedDiscountLabel) {
            selectedDiscountLabel.textContent = "Select";
        }

        if (promoBookingMessage) {
            promoBookingMessage.textContent = message;
        }

        updateBookingSummary();
    }

    function applyPendingPromo() {
        if (!pendingPromo) return;

        if (!promoIsEligible(pendingPromo)) {
            alert(
                "This discount is no longer eligible for the current booking."
            );

            pendingPromo = null;
            renderDiscountList();
            return;
        }

        appliedPromo = {
            ...pendingPromo
        };

        if (bookingPromoCode) {
            bookingPromoCode.value =
                normalizeText(appliedPromo.code).toUpperCase();
        }

        if (selectedDiscountLabel) {
            selectedDiscountLabel.textContent =
                appliedPromo.title ||
                appliedPromo.code ||
                "Applied";
        }

        updateBookingSummary();
        setModalState(discountModal, false);
    }


    /* =====================================================
       REFERRAL
       ===================================================== */

    function showReferralMessage(message, type = "") {
        if (!referralMessage) return;

        if (!message) {
            referralMessage.textContent = "";
            referralMessage.className =
                "referral-message hidden";
            return;
        }

        referralMessage.textContent = message;
        referralMessage.className =
            `referral-message ${type}`;
    }

    async function applyReferralCode() {
        const code =
            normalizeText(referralCode?.value).toUpperCase();

        if (!code) {
            appliedReferral = null;
            showReferralMessage("", "");
            return;
        }

        const oldText =
            applyReferralButton?.textContent || "Apply";

        try {
            if (applyReferralButton) {
                applyReferralButton.disabled = true;
                applyReferralButton.textContent = "Checking...";
            }

            showReferralMessage("", "");

            const referralQuery =
                query(
                    collection(db, "referralCodes"),
                    where("code", "==", code),
                    where("status", "==", "active")
                );

            const snapshot =
                await getDocs(referralQuery);

            if (snapshot.empty) {
                throw new Error("Referral code is not valid.");
            }

            const referralDoc = snapshot.docs[0];
            const data = referralDoc.data() || {};
            const status = normalizeLower(data.status || "active");

            if (status !== "active") {
                throw new Error("Referral code is not currently active.");
            }

            appliedReferral = {
                id: referralDoc.id,
                code,
                ownerId:
                    normalizeText(
                        data.ownerId ||
                        data.referrerId ||
                        data.customerId
                    ),
                ownerName:
                    normalizeText(
                        data.ownerName ||
                        data.referrerName ||
                        data.name
                    ),
                rewardType:
                    normalizeLower(
                        data.rewardType ||
                        data.commissionType
                    ),
                rewardValue:
                    normalizeNumber(
                        data.rewardValue ??
                        data.commissionValue
                    )
            };

            if (referralCode) {
                referralCode.value = code;
                referralCode.readOnly = true;
            }

            if (applyReferralButton) {
                applyReferralButton.textContent = "Applied";
            }

            showReferralMessage(
                "Referral code applied. This does not change your booking total.",
                "success"
            );

        } catch (error) {
            console.error("REFERRAL CODE ERROR:", error);

            appliedReferral = null;

            showReferralMessage(
                error?.message || "Unable to validate referral code.",
                "error"
            );

            if (applyReferralButton) {
                applyReferralButton.textContent = oldText;
            }

        } finally {
            if (applyReferralButton) {
                applyReferralButton.disabled = false;
            }
        }
    }


    /* =====================================================
       CALCULATION
       ===================================================== */

    function calculateBooking(includePromo = true) {
        const passenger =
            getPassengerBreakdown();

        const packageRate =
            selectedPackage?.price || 0;

        const grossPackageAmount =
            packageRate * passenger.totalPax;

        const childFreeAmount =
            passenger.kidsPricingEnabled
                ? packageRate * passenger.freeChildPax
                : 0;

        const childDiscountPerPax =
            passenger.kidsPricingEnabled
                ? Math.min(
                    packageRate,
                    Math.max(
                        0,
                        passenger.childDiscountPerPax
                    )
                )
                : 0;

        const childDiscountAmount =
            childDiscountPerPax *
            passenger.discountedChildPax;

        const exclusiveDiscountAmount =
            packageRate *
            passenger.exclusiveFreePax;

        const packageSubtotal =
            Math.max(
                0,
                grossPackageAmount -
                childFreeAmount -
                childDiscountAmount -
                exclusiveDiscountAmount
            );

        const accommodationAmount =
            Math.max(
                0,
                normalizeNumber(
                    selectedAccommodation?.price
                )
            );

        const originalTotal =
            packageSubtotal +
            accommodationAmount;

        /*
         * Tripswonder vouchers apply to the PACKAGE only.
         * Accommodation / room upgrades are never included in the
         * percentage or fixed promo base.
         */
        const promoEligibleAmount =
            packageSubtotal;

        const discountAmount =
            includePromo &&
            appliedPromo
                ? calculatePromoDiscount(
                    appliedPromo,
                    promoEligibleAmount,
                    passenger.payablePax
                )
                : 0;

        const total =
            Math.max(
                0,
                originalTotal -
                discountAmount
            );

        const deposit =
            Math.min(
                total,
                DEPOSIT_PER_PAX *
                passenger.payablePax
            );

        const remainingBalance =
            Math.max(0, total - deposit);

        return {
            ...passenger,

            packageRate,
            grossPackageAmount,
            childFreeAmount,
            childDiscountPerPax,
            childDiscountAmount,
            exclusiveDiscountAmount,
            packageSubtotal,
            accommodationAmount,
            originalTotal,
            promoEligibleAmount,
            discountAmount,
            total,
            deposit,
            remainingBalance
        };
    }

    function updateBookingSummary() {
        if (!selectedPackage) return;

        const calculation =
            calculateBooking();

        if (summaryPackageRate) {
            summaryPackageRate.textContent =
                `₱${formatMoney(calculation.packageRate)}`;
        }

        if (summaryPax) {
            summaryPax.textContent =
                String(calculation.totalPax);
        }

        if (summaryTotalPackage) {
            const totalPackageBeforeDiscounts =
                calculation.packageRate *
                calculation.payablePax;

            summaryTotalPackage.textContent =
                `₱${formatMoney(totalPackageBeforeDiscounts)}`;
        }

        if (summarySubtotal) {
            summarySubtotal.textContent =
                `₱${formatMoney(calculation.packageSubtotal)}`;
        }

        if (
            calculation.kidsPricingEnabled &&
            calculation.freeChildPax > 0
        ) {
            summaryChildFreeRow?.classList.remove("hidden");

            if (summaryChildFree) {
                summaryChildFree.textContent =
                    `${calculation.freeChildPax} pax • FREE`;
            }
        } else {
            summaryChildFreeRow?.classList.add("hidden");
        }

        if (calculation.childDiscountAmount > 0) {
            summaryChildDiscountRow?.classList.remove("hidden");

            if (summaryChildDiscount) {
                summaryChildDiscount.textContent =
                    `-₱${formatMoney(
                        calculation.childDiscountAmount
                    )}`;
            }
        } else {
            summaryChildDiscountRow?.classList.add("hidden");
        }

        if (calculation.exclusiveFreePax > 0) {
            summaryExclusiveRow?.classList.remove("hidden");

            if (summaryExclusiveDiscount) {
                summaryExclusiveDiscount.textContent =
                    `${calculation.exclusiveFreePax} FREE pax (-₱${formatMoney(
                        calculation.exclusiveDiscountAmount
                    )})`;
            }
        } else {
            summaryExclusiveRow?.classList.add("hidden");
        }

        const hasAccommodationUpgrade =
            normalizeNumber(selectedAccommodation?.price) > 0;

        if (hasAccommodationUpgrade) {
            summaryAccommodationRow?.classList.remove("hidden");

            if (summaryAccommodation) {
                summaryAccommodation.textContent =
                    selectedAccommodation?.name ||
                    "Room Upgrade";
            }

            if (summaryAccommodationUpgradeInline) {
                summaryAccommodationUpgradeInline.textContent =
                    `+₱${formatMoney(
                        selectedAccommodation.price
                    )}`;
            }

            // Retain hidden legacy values for compatibility.
            summaryAccommodationUpgradeRow
                ?.classList.remove("hidden");

            if (summaryAccommodationUpgrade) {
                summaryAccommodationUpgrade.textContent =
                    `+₱${formatMoney(
                        selectedAccommodation.price
                    )}`;
            }
        } else {
            summaryAccommodationRow?.classList.add("hidden");
            summaryAccommodationUpgradeRow
                ?.classList.add("hidden");

            if (summaryAccommodationUpgradeInline) {
                summaryAccommodationUpgradeInline.textContent = "+₱0";
            }
        }

        if (
            appliedPromo &&
            calculation.discountAmount > 0
        ) {
            summaryPromoRow?.classList.remove("hidden");

            if (summaryPromoDiscount) {
                summaryPromoDiscount.textContent =
                    `-₱${formatMoney(
                        calculation.discountAmount
                    )}`;
            }
        } else {
            summaryPromoRow?.classList.add("hidden");

            if (summaryPromoDiscount) {
                summaryPromoDiscount.textContent = "-₱0";
            }
        }

        if (summaryTotal) {
            summaryTotal.textContent =
                `₱${formatMoney(calculation.total)}`;
        }

        const paymentSelection =
            getSelectedPaymentAmount(calculation);

        if (requiredDeposit) {
            requiredDeposit.textContent =
                `₱${formatMoney(
                    paymentSelection.selectedAmount
                )}`;
        }

        if (summaryRemainingBalance) {
            summaryRemainingBalance.textContent =
                `₱${formatMoney(
                    paymentSelection.remainingBalance
                )}`;
        }

        if (paymentStepTotal) {
            paymentStepTotal.textContent =
                `₱${formatMoney(calculation.total)}`;
        }

        if (minimumDepositChoice) {
            minimumDepositChoice.textContent =
                `₱${formatMoney(
                    paymentSelection.minimumDeposit
                )}`;
        }

        if (halfPaymentChoice) {
            halfPaymentChoice.textContent =
                `₱${formatMoney(
                    paymentSelection.halfPayment
                )}`;
        }

        if (fullPaymentChoice) {
            fullPaymentChoice.textContent =
                `₱${formatMoney(
                    paymentSelection.fullPayment
                )}`;
        }

        if (depositBreakdown) {
            if (selectedPaymentAmountOption === "minimum") {
                depositBreakdown.textContent =
                    `Minimum ₱${formatMoney(DEPOSIT_PER_PAX)} × ` +
                    `${calculation.payablePax} payable pax`;
            } else if (selectedPaymentAmountOption === "half") {
                depositBreakdown.textContent =
                    "50% of total booking amount";
            } else {
                depositBreakdown.textContent =
                    "Full booking payment";
            }
        }

        updatePaymentModalAmounts();
        renderDiscountList();
    }


    /* =====================================================
       PAYMENT
       ===================================================== */

    function updatePaymentModalAmounts() {
        const calculation =
            calculateBooking();

        const paymentSelection =
            getSelectedPaymentAmount(
                calculation
            );

        const methodKey =
            currentPaymentMethodKey ||
            getSelectedPaymentMethod();

        const method =
            getPaymentMethodSettings(
                methodKey
            ) || {};

        const rules =
            getPaymentRules();

        const label =
            normalizeText(
                method.label ||
                "Payment"
            );

        if (paymentModalTitle) {
            paymentModalTitle.textContent =
                `Pay with ${label}`;
        }

        if (paymentModalBrandLogo) {
            const logo =
                normalizeText(
                    method.logoImage
                );

            if (logo) {
                paymentModalBrandLogo.src =
                    logo;

                paymentModalBrandLogo.alt =
                    `${label} logo`;

                paymentModalBrandLogo.hidden =
                    false;
            } else {
                paymentModalBrandLogo.removeAttribute(
                    "src"
                );

                paymentModalBrandLogo.hidden =
                    true;
            }
        }

        if (gcashAccountName) {
            gcashAccountName.textContent =
                normalizeText(
                    method.accountName
                ) || "Trips Wonder";
        }

        if (gcashAccountNumber) {
            gcashAccountNumber.textContent =
                normalizeText(
                    method.accountNumber
                ) || "—";
        }

        if (paymentAccountNumberLabel) {
            paymentAccountNumberLabel.textContent =
                methodKey === "gcash" ||
                methodKey === "maya"
                    ? "Account / Mobile Number"
                    : "Account Number";
        }

        if (gcashDepositAmount) {
            gcashDepositAmount.textContent =
                `₱${formatMoney(
                    paymentSelection.selectedAmount
                )}`;
        }

        if (gcashDepositBreakdown) {
            gcashDepositBreakdown.textContent =
                selectedPaymentAmountOption === "minimum"
                    ? `Minimum ₱${formatMoney(DEPOSIT_PER_PAX)} × ${calculation.payablePax} payable pax`
                    : selectedPaymentAmountOption === "half"
                        ? "50% of total booking amount"
                        : "Full booking payment";
        }

        const qr =
            normalizeText(
                method.qrImage
            );

        if (gcashQrImage) {
            if (qr) {
                gcashQrImage.src = qr;
                gcashQrImage.style.display = "block";
            } else {
                gcashQrImage.removeAttribute("src");
                gcashQrImage.style.display = "none";
            }
        }

        if (paymentQrCard) {
            paymentQrCard.classList.toggle(
                "hidden",
                !qr
            );
        }

        if (downloadGcashQrButton) {
            downloadGcashQrButton.classList.toggle(
                "hidden",
                !qr
            );
        }

        if (paymentReferenceLabel) {
            paymentReferenceLabel.textContent =
                `${label} Reference Number *`;
        }

        if (gcashReferenceInput) {
            gcashReferenceInput.placeholder =
                `Enter ${label} reference number`;
        }

        if (paymentReceiptReminder) {
            paymentReceiptReminder.textContent =
                normalizeText(
                    rules.receiptReminder
                ) ||
                DEFAULT_PAYMENT_SETTINGS.rules.receiptReminder;
        }
    }


    function openPaymentModal(method) {
        if (
            !method ||
            !paymentMethodIsActive(method)
        ) {
            alert(
                "This payment method is not currently available."
            );
            return;
        }

        if (method === "card") {
            alert(
                "Credit / Debit Card payment is not connected yet."
            );
            return;
        }

        currentPaymentMethodKey =
            method;

        updatePaymentModalAmounts();

        if (gcashReferenceInput) {
            gcashReferenceInput.value =
                paymentReference?.value || "";
        }

        setModalState(
            gcashPaymentModal,
            true
        );
    }


    function confirmPaymentReference() {
        const rules =
            getPaymentRules();

        const value =
            normalizeText(
                gcashReferenceInput?.value
            );

        if (
            rules.referenceRequired !== false &&
            value.length < 4
        ) {
            alert(
                "Please enter a valid payment reference number."
            );

            gcashReferenceInput?.focus();
            return;
        }

        if (paymentReference) {
            paymentReference.value =
                value;
        }

        if (
            document.activeElement instanceof HTMLElement
        ) {
            document.activeElement.blur();
        }

        setModalState(
            gcashPaymentModal,
            false
        );

        updateProgress();

        clientBookingForm
            ?.requestSubmit();
    }


    function showPaymentInstructions() {
        paymentInstructions
            ?.classList.add(
                "hidden"
            );

        updateProgress();
    }


    function downloadGcashQr() {
        const src =
            normalizeText(gcashQrImage?.src);

        if (!src) {
            alert("GCash QR code is not available yet.");
            return;
        }

        const link =
            document.createElement("a");

        link.href = src;
        const method =
            getPaymentMethodSettings(
                currentPaymentMethodKey ||
                getSelectedPaymentMethod()
            );

        const safeName =
            normalizeText(method?.label || "Payment")
                .replace(/[^a-zA-Z0-9]+/g, "-");

        link.download =
            `Trips-Wonder-${safeName}-QR.png`;
        link.target = "_blank";

        document.body.appendChild(link);
        link.click();
        link.remove();
    }


    /* =====================================================
       PROGRESS
       ===================================================== */

    function updateProgress() {
        const items =
            [...document.querySelectorAll(".progress-item")];

        const scheduleComplete =
            Boolean(selectedSchedule?.startDate);

        const detailsComplete =
            Boolean(
                normalizeText(customerName?.value) &&
                normalizeText(customerContact?.value) &&
                normalizeText(customerEmail?.value) &&
                getPax() > 0
            );

        const accommodationComplete =
            Boolean(selectedAccommodation);

        const paymentComplete =
            Boolean(
                getSelectedPaymentMethod() &&
                normalizeText(paymentReference?.value)
            );

        const states = [
            scheduleComplete,
            detailsComplete,
            accommodationComplete,
            paymentComplete
        ];

        let firstIncomplete =
            states.findIndex(value => !value);

        if (firstIncomplete === -1) {
            firstIncomplete = states.length - 1;
        }

        items.forEach((item, index) => {
            item.classList.toggle(
                "completed",
                states[index] === true &&
                index < firstIncomplete
            );

            item.classList.toggle(
                "active",
                index === firstIncomplete
            );
        });
    }


    /* =====================================================
       VALIDATION
       ===================================================== */

    function validateBooking() {
        if (!selectedPackage) {
            alert("Please select a valid tour package.");
            return false;
        }

        if (!selectedSchedule?.startDate || !travelDate?.value) {
            alert("Please select your travel date.");
            document
                .getElementById("scheduleSection")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            return false;
        }

        if (!clientBookingForm?.checkValidity()) {
            clientBookingForm?.reportValidity();
            return false;
        }

        const passenger =
            getPassengerBreakdown();

        if (
            passenger.childTotal >
            passenger.totalPax
        ) {
            alert(
                "Children count cannot be greater than the total number of pax."
            );
            return false;
        }

        if (isRequestedDateMode) {
            const config = getRequestedDateConfig();

            if (passenger.totalPax < config.minPax) {
                alert(`A minimum of ${config.minPax} guests is required to request another travel date.`);
                return false;
            }

            if (!selectedSchedule?.requestedDate || !requestedTravelDate?.value) {
                alert("Please select your preferred requested travel date.");
                return false;
            }

        } else {
            if (!selectedAccommodation) {
                alert(
                    "Please select an accommodation for your chosen schedule."
                );

                document
                    .getElementById("accommodationSection")
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                return false;
            }

            const method = getSelectedPaymentMethod();

            if (!method) {
                alert("Please select a payment method.");
                return false;
            }

            if (!paymentMethodIsActive(method)) {
                alert(
                    "The selected payment method is no longer available. Please choose another payment method."
                );
                renderPaymentMethods();
                return false;
            }

            /*
             * Payment reference is NOT required at this stage.
             * The client first reviews the booking, selects a payment method,
             * confirms the agreement, then clicks Proceed to Payment.
             * The reference number is collected inside the payment modal.
             */
        }

        if (!bookingAgreement?.checked) {
            alert("Please confirm the booking agreement.");
            return false;
        }

        return true;
    }


    /* =====================================================
       BOOKING DATA
       ===================================================== */

    function generateBookingNumber(documentId) {
        const year = new Date().getFullYear();

        const uniqueCode =
            String(documentId)
                .replace(/[^a-zA-Z0-9]/g, "")
                .substring(0, 6)
                .toUpperCase();

        return `TW-${year}-${uniqueCode}`;
    }

    function calculateReferralRewardSnapshot() {
        if (!appliedReferral) {
            return {
                amount: 0,
                status: ""
            };
        }

        const type =
            normalizeLower(appliedReferral.rewardType);

        const value =
            Math.max(
                0,
                normalizeNumber(
                    appliedReferral.rewardValue
                )
            );

        const pax =
            getPassengerBreakdown().payablePax;

        let amount = 0;

        if (
            type === "per_pax" ||
            type === "per pax"
        ) {
            amount = value * pax;

        } else if (
            type === "percentage" ||
            type === "percent"
        ) {
            amount =
                calculateBooking().total *
                (value / 100);

        } else {
            amount = value;
        }

        return {
            amount:
                Math.max(0, amount),
            status:
                "pending"
        };
    }

    function createBookingData(bookingNumber) {
        const calculation =
            calculateBooking();

        const startDate =
            selectedSchedule?.startDate ||
            travelDate?.value ||
            "";

        const endDate =
            selectedSchedule?.endDate ||
            calculateTravelEndDate(
                startDate,
                selectedPackage?.duration
            );

        const paymentMethod =
            isRequestedDateMode
                ? ""
                : getSelectedPaymentMethod();

        const paymentReferenceValue =
            isRequestedDateMode
                ? ""
                : normalizeText(paymentReference?.value);

        const finalPickup =
            pickupPoint?.value === "Other / Along the Way"
                ? normalizeText(otherPickup?.value)
                : normalizeText(pickupPoint?.value);

        const referralReward =
            calculateReferralRewardSnapshot();

        const now =
            new Date().toISOString();

        return {
            /* BOOKING REFERENCE */
            bookingReference: bookingNumber,
            bookingNumber,

            /* CUSTOMER SNAPSHOT */
            customerUid:
                currentCustomer?.uid ||
                auth.currentUser?.uid ||
                "",

            customerName:
                normalizeText(customerName?.value),

            customerContact:
                normalizeText(customerContact?.value),

            customerEmail:
                normalizeLower(customerEmail?.value),

            customerFacebook:
                normalizeText(customerFacebook?.value),

            /* PACKAGE SNAPSHOT */
            packageId:
                selectedPackage.id,

            packageName:
                selectedPackage.name,

            packageLocation:
                selectedPackage.location,

            packageCategory:
                selectedPackage.category,

            packageDuration:
                selectedPackage.duration,

            packageRate:
                calculation.packageRate,

            /* SCHEDULE SNAPSHOT */
            scheduleId:
                normalizeText(selectedSchedule?.id),

            travelDate:
                startDate,

            travelStartDate:
                startDate,

            travelEndDate:
                endDate,

            scheduleStatusAtBooking:
                normalizeLower(
                    selectedSchedule?.status ||
                    "available"
                ),

            requestedTravelDate:
                isRequestedDateMode,

            requestedTravelDateMinPax:
                isRequestedDateMode
                    ? getRequestedDateConfig().minPax
                    : 0,

            requestedTravelDateStatus:
                isRequestedDateMode
                    ? "for_availability_check"
                    : "",

            requestedTravelDateApproved:
                false,

            requestedTravelDateApprovedAt:
                null,

            requestedTravelDateApprovedBy:
                "",

            /* PASSENGERS */
            numberOfGuests:
                calculation.totalPax,

            pax:
                calculation.totalPax,

            regularPax:
                calculation.regularPax,

            children0To3:
                calculation.child0To3,

            children4To8:
                calculation.child4To8,

            payablePax:
                calculation.payablePax,

            exclusiveFreePax:
                calculation.exclusiveFreePax,

            passengerPricingSnapshot: {
                kidsPricingEnabled:
                    calculation.kidsPricingEnabled,

                childDiscountPerPax:
                    calculation.childDiscountPerPax
            },

            exclusiveTourSnapshot: {
                enabled:
                    calculation.exclusiveTourEnabled,

                isExclusive:
                    calculation.isExclusive,

                freePax:
                    calculation.exclusiveFreePax
            },

            /* TRAVEL DETAILS */
            pickup:
                finalPickup,

            specialRequest:
                normalizeText(specialRequest?.value),

            /* ACCOMMODATION SNAPSHOT */
            accommodation:
                selectedAccommodation?.name || "",

            accommodationId:
                selectedAccommodation?.id || "",

            accommodationResortName:
                selectedAccommodation?.resortName || "",

            accommodationType:
                selectedAccommodation?.type || "included",

            accommodationPrice:
                calculation.accommodationAmount,

            accommodationPricePerNight:
                normalizeNumber(
                    selectedAccommodation?.pricePerNight
                ),

            accommodationNights:
                normalizeNumber(
                    selectedAccommodation?.nights
                ),

            addons:
                calculation.accommodationAmount > 0
                    ? [{
                        category: "accommodation",
                        accommodationId:
                            selectedAccommodation?.id || "",
                        resortName:
                            selectedAccommodation?.resortName || "",
                        name:
                            selectedAccommodation?.name || "",
                        quantity: 1,
                        unitPrice:
                            normalizeNumber(
                                selectedAccommodation?.pricePerNight ||
                                selectedAccommodation?.price
                            ),
                        nights:
                            normalizeNumber(
                                selectedAccommodation?.nights
                            ),
                        amount:
                            calculation.accommodationAmount,
                        status:
                            "selected",
                        addedBy:
                            "customer"
                    }]
                    : [],

            addonsTotal:
                calculation.accommodationAmount,

            /* AMOUNT SNAPSHOT */
            grossPackageAmount:
                calculation.grossPackageAmount,

            childFreeAmount:
                calculation.childFreeAmount,

            childDiscountAmount:
                calculation.childDiscountAmount,

            exclusiveDiscountAmount:
                calculation.exclusiveDiscountAmount,

            packageSubtotal:
                calculation.packageSubtotal,

            originalAmount:
                calculation.originalTotal,

            /* TRIPSWONDER DISCOUNT SNAPSHOT */
            promoId:
                appliedPromo?.id || "",

            promoCode:
                normalizeText(
                    appliedPromo?.code
                ).toUpperCase(),

            promoTitle:
                normalizeText(
                    appliedPromo?.title ||
                    appliedPromo?.name
                ),

            promoDiscountType:
                normalizeLower(
                    appliedPromo?.discountType ||
                    appliedPromo?.type
                ),

            promoDiscountValue:
                normalizeNumber(
                    appliedPromo?.discountValue ??
                    appliedPromo?.value ??
                    appliedPromo?.amount
                ),

            discountAmount:
                calculation.discountAmount,

            /* REFERRAL SNAPSHOT */
            referralCode:
                appliedReferral?.code || "",

            referralId:
                appliedReferral?.id || "",

            referrerId:
                appliedReferral?.ownerId || "",

            referrerName:
                appliedReferral?.ownerName || "",

            referralRewardType:
                appliedReferral?.rewardType || "",

            referralRewardValue:
                appliedReferral?.rewardValue || 0,

            referralCommissionAmount:
                referralReward.amount,

            referralStatus:
                appliedReferral
                    ? referralReward.status
                    : "",

            /* FINAL TOTAL */
            totalAmount:
                calculation.total,

            requiredDeposit:
                isRequestedDateMode
                    ? 0
                    : Math.min(
                        calculation.total,
                        DEPOSIT_PER_PAX *
                        calculation.payablePax
                    ),

            selectedPaymentAmount:
                isRequestedDateMode
                    ? 0
                    : getSelectedPaymentAmount(
                        calculation
                    ).selectedAmount,

            paymentAmountOption:
                isRequestedDateMode
                    ? ""
                    : selectedPaymentAmountOption,

            depositPerPax:
                isRequestedDateMode
                    ? 0
                    : DEPOSIT_PER_PAX,

            amountPaid:
                0,

            balance:
                calculation.total,

            remainingBalanceAfterDeposit:
                isRequestedDateMode
                    ? calculation.total
                    : getSelectedPaymentAmount(
                        calculation
                    ).remainingBalance,

            /* PAYMENT */
            paymentMethod,

            paymentMethodLabel:
                getSelectedPaymentMethodSnapshot()?.label || "",

            paymentMethodSnapshot:
                getSelectedPaymentMethodSnapshot(),

            paymentReference:
                paymentReferenceValue,

            paymentReferenceNormalized:
                normalizeLower(
                    paymentReferenceValue
                ),

            paymentStatus:
                isRequestedDateMode
                    ? "not_required_yet"
                    : "pending_verification",

            paymentVerified:
                false,

            paymentVerifiedAt:
                null,

            paymentVerifiedBy:
                "",

            /* STATUS */
            bookingStatus:
                isRequestedDateMode
                    ? "date_request_pending"
                    : "pending",

            bookingLocked:
                true,

            bookingSource:
                "website",

            source:
                "client_booking_form",

            confirmationEmailSent:
                false,

            confirmationEmailSentAt:
                null,

            createdAt:
                now,

            updatedAt:
                now
        };
    }


    /* =====================================================
       SUBMIT
       ===================================================== */

    async function submitBooking(event) {
        event.preventDefault();

        if (isSubmitting) return;

        if (!validateBooking()) return;

        /*
         * Normal booking flow:
         * Proceed to Payment opens the selected payment modal first.
         * Nothing is saved until a valid payment reference is submitted
         * from that modal. Requested-date bookings remain payment-free.
         */
        if (!isRequestedDateMode) {
            const method = getSelectedPaymentMethod();
            const reference = normalizeText(paymentReference?.value);

            if (reference.length < 4) {
                openPaymentModal(method);
                return;
            }
        }

        const originalContent =
            submitBookingButton?.innerHTML;

        try {
            isSubmitting = true;

            if (submitBookingButton) {
                submitBookingButton.disabled = true;
                submitBookingButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Submitting...
                `;
            }

            /*
             * Re-check promo eligibility immediately before snapshot/save.
             */
            if (
                appliedPromo &&
                !promoIsEligible(appliedPromo)
            ) {
                clearAppliedPromo();

                alert(
                    "Your selected Tripswonder Discount is no longer eligible. Please review your Payment Summary."
                );

                return;
            }

            const bookingDocRef =
                doc(collection(db, "bookings"));

            const bookingNumber =
                generateBookingNumber(
                    bookingDocRef.id
                );

            const bookingData =
                createBookingData(
                    bookingNumber
                );

            /*
             * Inventory is not reduced merely by viewing/selecting.
             * The booking is saved for payment verification first.
             * Admin/backend inventory handling can act on the required
             * booking/payment status.
             */
            await setDoc(
                bookingDocRef,
                bookingData
            );

            showSuccessModal(bookingNumber);

        } catch (error) {
            console.error(
                "CLIENT BOOKING SUBMIT ERROR:",
                error
            );

            if (!navigator.onLine) {
                alert(
                    "No internet connection. Please check your connection and try again."
                );
            } else {
                alert(
                    "Unable to submit your booking request. Please try again."
                );
            }

        } finally {
            isSubmitting = false;

            if (submitBookingButton) {
                submitBookingButton.disabled = false;

                submitBookingButton.innerHTML =
                    isRequestedDateMode
                        ? `
                            <span>Submit Date Request</span>
                            <i class="fa-solid fa-calendar-check"></i>
                        `
                        : (
                            originalContent ||
                            `
                                <span>Proceed to Payment</span>
                                <i class="fa-solid fa-arrow-right"></i>
                            `
                        );
            }
        }
    }

    function showSuccessModal(bookingNumber) {
        if (bookingRequestReference) {
            bookingRequestReference.textContent = bookingNumber;
        }

        if (isRequestedDateMode) {
            if (successStatusLabel) successStatusLabel.textContent = "FOR AVAILABILITY CHECK";
            if (successTitle) successTitle.textContent = "Travel Date Request Received";
            if (successMessage) successMessage.textContent =
                "Your requested travel date has been submitted. Trips Wonder will review availability before asking for payment.";
            if (successPaymentStatus) successPaymentStatus.textContent = "Not Required Yet";
            if (successBookingStatus) successBookingStatus.textContent = "Date Request Pending";
        } else {
            if (successStatusLabel) successStatusLabel.textContent = "FOR PAYMENT VERIFICATION";
            if (successTitle) successTitle.textContent = "Booking Request Received";
            if (successMessage) successMessage.textContent =
                "Your booking details and payment reference have been submitted. Our admin will verify your payment before your booking becomes confirmed.";
            if (successPaymentStatus) successPaymentStatus.textContent = "For Verification";
            if (successBookingStatus) successBookingStatus.textContent = "Pending Confirmation";
        }

        setModalState(bookingSuccessModal, true);
    }

    function closeSuccessModal() {
        setModalState(
            bookingSuccessModal,
            false
        );

        window.location.href = "home.html";
    }


    /* =====================================================
       EVENTS
       ===================================================== */

    viewPackageDetailsButton
        ?.addEventListener("click", () => {
            setModalState(packageDetailsModal, true);
        });

    document
        .querySelectorAll("[data-close-modal]")
        .forEach(button => {
            button.addEventListener("click", () => {
                const modalId =
                    button.dataset.closeModal;

                setModalState(
                    document.getElementById(modalId),
                    false
                );
            });
        });

    document
        .addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeAllBookingModals();
            }
        });

    accommodationTabs
        ?.querySelectorAll("button")
        .forEach(button => {
            button.addEventListener("click", () => {
                accommodationTabs
                    .querySelectorAll("button")
                    .forEach(item =>
                        item.classList.remove("active")
                    );

                button.classList.add("active");

                renderAccommodationCards(
                    button.dataset.filter || "all"
                );
            });
        });

    galleryPrevButton
        ?.addEventListener("click", () => {
            galleryIndex -= 1;
            renderGallery();
        });

    galleryNextButton
        ?.addEventListener("click", () => {
            galleryIndex += 1;
            renderGallery();
        });

    openDiscountButton
        ?.addEventListener("click", async () => {
            await loadEligiblePromos();

            pendingPromo =
                appliedPromo
                    ? { ...appliedPromo }
                    : null;

            renderDiscountList();
            setModalState(discountModal, true);
        });

    confirmDiscountButton
        ?.addEventListener(
            "click",
            applyPendingPromo
        );

    applyReferralButton
        ?.addEventListener(
            "click",
            applyReferralCode
        );

    referralCode
        ?.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                applyReferralCode();
            }
        });

    pickupPoint
        ?.addEventListener(
            "change",
            handlePickupChange
        );

    if (paymentMoreToggle && paymentAmountChoices) {
        paymentMoreToggle.addEventListener("click", () => {
            const isOpen =
                paymentMoreToggle.getAttribute("aria-expanded") === "true";

            paymentMoreToggle.setAttribute(
                "aria-expanded",
                String(!isOpen)
            );

            paymentAmountChoices.classList.toggle(
                "payment-amount-choices-collapsed",
                isOpen
            );
        });
    }

    paymentAmountOptionInputs
        .forEach(input => {
            input.addEventListener(
                "change",
                () => {
                    selectedPaymentAmountOption =
                        input.value || "minimum";

                    updateBookingSummary();
                }
            );
        });

    confirmGcashPaymentButton
        ?.addEventListener("click", () => {
            confirmPaymentReference();
        });

    /*
     * Legacy bank modal remains in the HTML for compatibility.
     * All configured active methods now use the dynamic payment modal.
     */
    confirmBankPaymentButton
        ?.addEventListener("click", () => {
            confirmPaymentReference();
        });

    downloadGcashQrButton
        ?.addEventListener(
            "click",
            downloadGcashQr
        );

    quickViewMoreButton
        ?.addEventListener(
            "click",
            () => {

                if (isMobileBookingView()) {
                    const isOpen =
                        travelCalendarCard
                            ?.classList.contains(
                                "mobile-calendar-open"
                            ) === true;

                    setMobileCalendarOpen(
                        !isOpen,
                        !isOpen
                    );

                    return;
                }

                calendarCursor =
                    new Date(
                        calendarCursor.getFullYear(),
                        calendarCursor.getMonth() + 1,
                        1
                    );

                renderTravelCalendar();

                document
                    .getElementById(
                        "travelCalendarShell"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
            }
        );

    window.addEventListener(
        "resize",
        syncMobileCalendarUI
    );

    calendarPrevMonth
        ?.addEventListener(
            "click",
            () => {
                const today = new Date();

                const currentMonthStart =
                    new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                    );

                const previous =
                    new Date(
                        calendarCursor.getFullYear(),
                        calendarCursor.getMonth() - 1,
                        1
                    );

                if (
                    previous >=
                    currentMonthStart
                ) {
                    calendarCursor =
                        previous;

                    renderTravelCalendar();
                }
            }
        );

    calendarNextMonth
        ?.addEventListener(
            "click",
            () => {
                calendarCursor =
                    new Date(
                        calendarCursor.getFullYear(),
                        calendarCursor.getMonth() + 1,
                        1
                    );

                renderTravelCalendar();
            }
        );

    requestAnotherDateButton
        ?.addEventListener("click", () => {
            if (isRequestedDateMode) {
                exitRequestedDateMode();
            } else {
                enterRequestedDateMode();
            }
        });

    requestedTravelDate
        ?.addEventListener("change", selectRequestedTravelDate);

    hasChildrenInputs.forEach(
        input => {
            input.addEventListener(
                "change",
                event => {
                    if (
                        event.target.value === "yes" &&
                        getPax() < 2
                    ) {
                        const noInput =
                            document.querySelector(
                                'input[name="hasChildren"][value="no"]'
                            );

                        if (noInput) {
                            noInput.checked = true;
                        }

                        event.target.checked = false;

                        syncChildrenAvailability();
                        syncChildrenFieldsVisibility();
                        updateBookingSummary();
                        updateProgress();
                        return;
                    }

                    syncChildrenAvailability();
                    syncChildrenFieldsVisibility();

                    clearAppliedPromo();
                    updateBookingSummary();
                    updateProgress();
                }
            );
        }
    );

    numberOfGuests
        ?.addEventListener("input", () => {
            syncChildrenAvailability();
            syncChildrenFieldsVisibility();

            const passenger =
                getPassengerBreakdown();

            const invalid =
                passenger.childTotal >
                passenger.totalPax;

            numberOfGuests.setCustomValidity(
                invalid
                    ? "Total pax must be equal to or greater than the children count."
                    : ""
            );

            if (appliedPromo) {
                clearAppliedPromo();
            }

            syncRequestedDateEligibility();

            if (isRequestedDateMode && requestedTravelDate?.value) {
                selectRequestedTravelDate();
            }

            updateBookingSummary();
            updateProgress();
        });

    [
        children0To3,
        children4To8
    ].forEach(element => {
        element
            ?.addEventListener("input", () => {
                const passenger =
                    getPassengerBreakdown();

                const invalid =
                    passenger.childTotal >
                    passenger.totalPax;

                element.setCustomValidity(
                    invalid
                        ? "Children count cannot be greater than total pax."
                        : ""
                );

                if (!invalid) {
                    children0To3?.setCustomValidity("");
                    children4To8?.setCustomValidity("");
                }

                if (appliedPromo) {
                    clearAppliedPromo();
                }

                updateBookingSummary();
                updateProgress();
            });
    });

    [
        customerName,
        customerContact,
        customerEmail
    ].forEach(element => {
        element
            ?.addEventListener(
                "input",
                updateProgress
            );
    });

    clientBookingForm
        ?.addEventListener(
            "submit",
            submitBooking
        );

    successDoneButton
        ?.addEventListener(
            "click",
            closeSuccessModal
        );


    /* =====================================================
       INITIALIZE
       ===================================================== */

    handlePickupChange();
    updateProgress();

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {
                currentCustomer = null;
                currentCustomerProfile = null;

                if (customerEmail) {
                    customerEmail.readOnly = false;
                }

                await loadPaymentSettings();
                await loadSelectedPackage();

                console.log(
                    "GUEST BOOKING READY"
                );

                return;
            }

            const profileLoaded =
                await loadCustomerProfile(user);

            if (!profileLoaded) {
                currentCustomer = user;
                currentCustomerProfile = null;

                if (customerEmail) {
                    customerEmail.value =
                        normalizeLower(
                            user.email || ""
                        );

                    customerEmail.readOnly = false;
                }
            }

            await loadPaymentSettings();
            await loadSelectedPackage();

            console.log(
                "CUSTOMER BOOKING READY:",
                {
                    uid: user.uid,
                    email: user.email
                }
            );
        }
    );

});
