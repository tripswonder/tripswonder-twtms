/* =========================================================
   TRIPS WONDER
   CLIENT BOOKING PAGE
   assets/js/client/booking.js

   FLOW:
   1. Read package ID from URL
   2. Load actual package from Firestore
   3. Calculate package total
   4. Calculate initial deposit
   5. Require GCash / Bank Transfer
   6. Require payment reference
   7. Check duplicate payment reference
   8. Save booking request to Firestore
   9. Admin verifies payment later
   ========================================================= */

"use strict";


/* =========================================================
   FIREBASE
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
    setDoc,
    updateDoc,
    query,  
    where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =====================================================
           CONFIG
           ===================================================== */

        const DEPOSIT_PER_PAX = 500;


        /*
         * TEMPORARY PAYMENT DETAILS
         *
         * Replace these later with your actual
         * Trips Wonder payment information.
         */

        const PAYMENT_DETAILS = {

    gcash: {
        label: "GCash",
        accountName: "Eric Ramirez",
        accountNumber: "0952 478 8316"
    },

    bank: {
        label: "Bank Transfer",
        bankName: "Maribank",
        accountName: "Eric Ramirez",
        accountNumber: "1260 9823 206"
    }

};


        /* =====================================================
           STATE
           ===================================================== */

        let selectedPackage =
            null;


        let selectedAccommodation =
            null;

        let submittedBooking = null;
        let selectedPostBookingAddon = null;


        let isSubmitting =
            false;

        let appliedPromo =
            null;

        let currentCustomer =
    null;

let currentCustomerProfile =
    null;


        /* =====================================================
           ELEMENTS
           ===================================================== */

        const packageLoading =
            document.getElementById(
                "packageLoading"
            );


        const packageContent =
            document.getElementById(
                "packageContent"
            );


        const packageError =
            document.getElementById(
                "packageError"
            );


        const packageImage =
            document.getElementById(
                "packageImage"
            );


        const packageName =
            document.getElementById(
                "packageName"
            );


        const packageLocation =
            document.getElementById(
                "packageLocation"
            );


        const packageDuration =
            document.getElementById(
                "packageDuration"
            );


        const packagePrice =
            document.getElementById(
                "packagePrice"
            );


        /* =====================================================
           FORM
           ===================================================== */

        const clientBookingForm =
            document.getElementById(
                "clientBookingForm"
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


        const travelDate =
            document.getElementById(
                "travelDate"
            );


        const numberOfGuests =
            document.getElementById(
                "numberOfGuests"
            );


        const children0To3 =
            document.getElementById(
                "children0To3"
            );


        const children4To8 =
            document.getElementById(
                "children4To8"
            );


        const childrenFreeField =
            document.getElementById(
                "childrenFreeField"
            );


        const childrenDiscountField =
            document.getElementById(
                "childrenDiscountField"
            );


        const childrenFreeLabel =
            document.getElementById(
                "childrenFreeLabel"
            );


        const childrenDiscountLabel =
            document.getElementById(
                "childrenDiscountLabel"
            );


        const childrenDiscountHelp =
            document.getElementById(
                "childrenDiscountHelp"
            );


        const pickupPoint =
            document.getElementById(
                "pickupPoint"
            );


        const otherPickupField =
            document.getElementById(
                "otherPickupField"
            );


        const otherPickup =
            document.getElementById(
                "otherPickup"
            );


        const accommodation =
            document.getElementById(
                "accommodation"
            );


        const specialRequest =
            document.getElementById(
                "specialRequest"
            );


        /* =====================================================
           SUMMARY
           ===================================================== */

        const summaryPackageRate =
            document.getElementById(
                "summaryPackageRate"
            );


        const summaryPax =
            document.getElementById(
                "summaryPax"
            );


        const summarySubtotal =
            document.getElementById(
                "summarySubtotal"
            );


        const summaryAccommodation =
            document.getElementById(
                "summaryAccommodation"
            );


        const summaryChildFreeRow =
            document.getElementById(
                "summaryChildFreeRow"
            );


        const summaryChildFree =
            document.getElementById(
                "summaryChildFree"
            );


        const summaryChildDiscountRow =
            document.getElementById(
                "summaryChildDiscountRow"
            );


        const summaryChildDiscount =
            document.getElementById(
                "summaryChildDiscount"
            );


        const summaryExclusiveRow =
            document.getElementById(
                "summaryExclusiveRow"
            );


        const summaryExclusiveDiscount =
            document.getElementById(
                "summaryExclusiveDiscount"
            );


        const summaryTotal =
            document.getElementById(
                "summaryTotal"
            );


        const bookingPromoCode =
            document.getElementById(
                "bookingPromoCode"
            );


        const applyPromoButton =
            document.getElementById(
                "applyPromoButton"
            );


        const promoBookingMessage =
            document.getElementById(
                "promoBookingMessage"
            );


        const summaryPromoRow =
            document.getElementById(
                "summaryPromoRow"
            );


        const summaryPromoDiscount =
            document.getElementById(
                "summaryPromoDiscount"
            );


        const requiredDeposit =
            document.getElementById(
                "requiredDeposit"
            );


        const depositBreakdown =
            document.getElementById(
                "depositBreakdown"
            );


        /* =====================================================
           PAYMENT
           ===================================================== */

        const paymentMethodInputs =
            document.querySelectorAll(
                'input[name="paymentMethod"]'
            );


        const paymentInstructions =
            document.getElementById(
                "paymentInstructions"
            );


        const paymentInstructionsContent =
            document.getElementById(
                "paymentInstructionsContent"
            );


        const paymentReference =
            document.getElementById(
                "paymentReference"
            );


        const bookingAgreement =
            document.getElementById(
                "bookingAgreement"
            );


        const submitBookingButton =
            document.getElementById(
                "submitBookingButton"
            );


        /* =====================================================
           SUCCESS
           ===================================================== */

        const bookingSuccessModal =
            document.getElementById(
                "bookingSuccessModal"
            );


        const bookingRequestReference =
            document.getElementById(
                "bookingRequestReference"
            );


        const successDoneButton =
            document.getElementById(
                "successDoneButton"
            );

        const postBookingAddons = document.getElementById("postBookingAddons");
        const postBookingAddonList = document.getElementById("postBookingAddonList");
        const postBookingAddonMessage = document.getElementById("postBookingAddonMessage");
        const addSelectedAddonButton = document.getElementById("addSelectedAddonButton");
        const currentIncludedAccommodation = document.getElementById("currentIncludedAccommodation");
        const postBookingSelectedSummary = document.getElementById("postBookingSelectedSummary");
        const selectedAddonName = document.getElementById("selectedAddonName");
        const selectedAddonAmount = document.getElementById("selectedAddonAmount");
        const selectedAddonNewTotal = document.getElementById("selectedAddonNewTotal");


        /* =====================================================
           HELPERS
           ===================================================== */

        function normalizeText(
            value
        ) {

            return String(
                value ?? ""
            )
                .trim();

        }


        function normalizeLower(
            value
        ) {

            return normalizeText(
                value
            ).toLowerCase();

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


        function getSelectedPaymentMethod() {

            const checked =
                document.querySelector(
                    'input[name="paymentMethod"]:checked'
                );


            return checked
                ? checked.value
                : "";

        }


        function getPax() {

            const pax =
                parseInt(
                    numberOfGuests?.value,
                    10
                );


            if (
                !Number.isFinite(
                    pax
                ) ||
                pax < 1
            ) {

                return 1;

            }


            return pax;

        }



        function getChildCount(
            element
        ) {

            const value =
                parseInt(
                    element?.value,
                    10
                );

            return Number.isFinite(value) && value > 0
                ? value
                : 0;

        }



        function getPackagePassengerPricing() {

            const config =
                selectedPackage?.passengerPricing ||
                {};

            return {

                enabled:
                    config.kidsPricingEnabled === true,

                childFreeMaxAge:
                    Math.max(
                        0,
                        normalizeNumber(
                            config.childFreeMaxAge ?? 3
                        )
                    ),

                childDiscountMinAge:
                    Math.max(
                        0,
                        normalizeNumber(
                            config.childDiscountMinAge ?? 4
                        )
                    ),

                childDiscountMaxAge:
                    Math.max(
                        0,
                        normalizeNumber(
                            config.childDiscountMaxAge ?? 8
                        )
                    ),

                childDiscountAmount:
                    Math.max(
                        0,
                        normalizeNumber(
                            config.childDiscountAmount ?? 500
                        )
                    )

            };

        }


        function getPackageExclusiveTour() {

            const config =
                selectedPackage?.exclusiveTour ||
                {};

            return {

                enabled:
                    config.enabled === true,

                minimumPayingPax:
                    Math.max(
                        1,
                        normalizeNumber(
                            config.minimumPayingPax ?? 12
                        )
                    ),

                freeStartsAt:
                    Math.max(
                        1,
                        normalizeNumber(
                            config.freeStartsAt ?? 13
                        )
                    ),

                freePax:
                    Math.max(
                        0,
                        normalizeNumber(
                            config.freePax ?? 1
                        )
                    ),

                maxFreePax:
                    Math.max(
                        0,
                        normalizeNumber(
                            config.maxFreePax ?? 1
                        )
                    )

            };

        }


        function getPassengerBreakdown() {

            const totalPax =
                getPax();

            const enteredChild0To3 =
                getChildCount(
                    children0To3
                );

            const enteredChild4To8 =
                getChildCount(
                    children4To8
                );

            const childTotal =
                enteredChild0To3 +
                enteredChild4To8;

            const regularPax =
                Math.max(
                    0,
                    totalPax -
                    childTotal
                );


            const passengerPricing =
                getPackagePassengerPricing();

            const exclusiveConfig =
                getPackageExclusiveTour();


            /*
             * When Kids Discount is OFF:
             * all travelers pay the regular package rate.
             *
             * When ON:
             * the existing customer inputs represent the configured
             * FREE-child and discounted-child groups.
             */
            const freeChildPax =
                passengerPricing.enabled
                    ? enteredChild0To3
                    : 0;

            const discountedChildPax =
                passengerPricing.enabled
                    ? enteredChild4To8
                    : 0;


            const payingPaxBeforeExclusive =
                passengerPricing.enabled
                    ? regularPax +
                        discountedChildPax
                    : totalPax;


            const isExclusive =
                exclusiveConfig.enabled &&
                payingPaxBeforeExclusive >=
                    exclusiveConfig.minimumPayingPax;


            const exclusiveFreePax =
                exclusiveConfig.enabled &&
                payingPaxBeforeExclusive >=
                    exclusiveConfig.freeStartsAt

                    ? Math.min(
                        exclusiveConfig.freePax,
                        exclusiveConfig.maxFreePax,
                        payingPaxBeforeExclusive
                    )

                    : 0;


            const payablePax =
                Math.max(
                    0,
                    payingPaxBeforeExclusive -
                    exclusiveFreePax
                );


            return {

                totalPax,

                child0To3:
                    enteredChild0To3,

                child4To8:
                    enteredChild4To8,

                childTotal,

                regularPax,

                kidsPricingEnabled:
                    passengerPricing.enabled,

                freeChildPax,

                discountedChildPax,

                childDiscountPerPax:
                    passengerPricing.childDiscountAmount,

                payingPaxBeforeExclusive,

                exclusiveTourEnabled:
                    exclusiveConfig.enabled,

                isExclusive,

                exclusiveFreePax,

                payablePax,

                passengerPricing,

                exclusiveConfig

            };

        }


        /* =====================================================
           REQUEST REFERENCE
           ===================================================== */

        function generateBookingNumber(
    documentId
) {

    const year =
        new Date().getFullYear();


    const uniqueCode =
        String(documentId)
            .replace(
                /[^a-zA-Z0-9]/g,
                ""
            )
            .substring(
                0,
                6
            )
            .toUpperCase();


    return `TW-${year}-${uniqueCode}`;

}


        /* =====================================================
           TRAVEL END DATE
           ===================================================== */

        function calculateTravelEndDate(
            startDate,
            duration
        ) {

            if (
                !startDate
            ) {

                return "";

            }


            const match =
                String(
                    duration || ""
                ).match(
                    /(\d+)\s*D/i
                );


            if (
                !match
            ) {

                return startDate;

            }


            const days =
                Number(
                    match[1]
                );


            if (
                !Number.isFinite(
                    days
                ) ||
                days <= 1
            ) {

                return startDate;

            }


            const date =
                new Date(
                    `${startDate}T00:00:00`
                );


            date.setDate(
                date.getDate() +
                days -
                1
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


        /* =====================================================
           MINIMUM TRAVEL DATE
           ===================================================== */

        function setMinimumTravelDate() {

            if (
                !travelDate
            ) {

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


            travelDate.min =
                `${year}-${month}-${day}`;

        }


        function syncPassengerPricingForm() {

            const config =
                getPackagePassengerPricing();

            const showKids =
                config.enabled === true;


            childrenFreeField
                ?.classList.toggle(
                    "hidden",
                    !showKids
                );

            childrenDiscountField
                ?.classList.toggle(
                    "hidden",
                    !showKids
                );


            if (!showKids) {

                if (children0To3) {
                    children0To3.value = "0";
                    children0To3.setCustomValidity("");
                }

                if (children4To8) {
                    children4To8.value = "0";
                    children4To8.setCustomValidity("");
                }

                summaryChildFreeRow
                    ?.classList.add(
                        "hidden"
                    );

                summaryChildDiscountRow
                    ?.classList.add(
                        "hidden"
                    );

                return;

            }


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
                    `₱${formatMoney(
                        config.childDiscountAmount
                    )} OFF per child`;
            }

        }


        /* =====================================================
   LOAD CUSTOMER PROFILE
   ===================================================== */

async function loadCustomerProfile(
    user
) {

    if (!user) {
        return false;
    }

    try {

        const profileSnapshot =
            await getDoc(
                doc(
                    db,
                    "users",
                    user.uid
                )
            );


        if (!profileSnapshot.exists()) {

            console.error(
                "CUSTOMER PROFILE NOT FOUND"
            );

            return false;

        }


        const profile =
            profileSnapshot.data();


        currentCustomer =
            user;

        currentCustomerProfile =
            profile;


        const fullName =
            [
                profile.firstName,
                profile.middleName,
                profile.lastName,
                profile.suffix
            ]
                .map(
                    value =>
                        normalizeText(
                            value
                        )
                )
                .filter(Boolean)
                .join(" ");


        if (customerName) {

            customerName.value =
                fullName;

        }


        if (customerContact) {

            customerContact.value =
                normalizeText(
                    profile.phone
                );

        }


        if (customerEmail) {

            customerEmail.value =
                normalizeLower(
                    user.email ||
                    profile.email
                );

            customerEmail.readOnly =
                true;

        }


        console.log(
            "BOOKING CUSTOMER PROFILE LOADED:",
            {
                uid:
                    user.uid,

                name:
                    fullName,

                phone:
                    profile.phone ||
                    "",

                email:
                    customerEmail?.value ||
                    ""
            }
        );


        return true;


    } catch (error) {

        console.error(
            "LOAD CUSTOMER PROFILE ERROR:",
            error
        );

        return false;

    }

}


        /* =====================================================
           LOAD PACKAGE
           ===================================================== */

        async function loadSelectedPackage() {

            const params =
                new URLSearchParams(
                    window.location.search
                );


            const packageId =
                params.get(
                    "package"
                );


            if (
                !packageId
            ) {

                showPackageError();

                return;

            }


            try {

                const packageSnapshot =
                    await getDoc(
                        doc(
                            db,
                            "packages",
                            packageId
                        )
                    );


                if (
                    !packageSnapshot.exists()
                ) {

                    showPackageError();

                    return;

                }


                const data =
                    packageSnapshot.data();


                /*
                 * Client cannot book an inactive package.
                 */

                const packageStatus =
                    normalizeLower(
                        data.status ||
                        "active"
                    );


                if (
                    packageStatus !==
                    "active"
                ) {

                    showPackageError();

                    return;

                }


                selectedPackage = {

                    id:
                        packageSnapshot.id,

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
                        normalizeNumber(
                            data.price
                        ),

                    duration:
                        data.duration ||
                        "",

                    description:
                        data.description ||
                        "",

                    status:
                        packageStatus,

                    accommodations:
    Array.isArray(
        data.accommodations
    )
        ? data.accommodations
        : [],

pickupLocations:
    Array.isArray(
        data.pickupLocations
    )
        ? data.pickupLocations
        : [],

passengerPricing:
    data.passengerPricing &&
    typeof data.passengerPricing === "object"
        ? data.passengerPricing
        : {
            kidsPricingEnabled: false,
            childFreeMaxAge: 3,
            childDiscountMinAge: 4,
            childDiscountMaxAge: 8,
            childDiscountAmount: 500
        },

exclusiveTour:
    data.exclusiveTour &&
    typeof data.exclusiveTour === "object"
        ? data.exclusiveTour
        : {
            enabled: false,
            minimumPayingPax: 12,
            freeStartsAt: 13,
            freePax: 1,
            maxFreePax: 1
        },

gallery:
    Array.isArray(
        data.gallery
    )
        ? data.gallery
        : []

                };


                renderSelectedPackage();

                syncPassengerPricingForm();

                populateAccommodations();

                populatePickupLocations();

                updateBookingSummary();


            } catch (error) {

                console.error(
                    "LOAD SELECTED PACKAGE ERROR:",
                    error
                );


                showPackageError();

            }

        }


        /* =====================================================
           PACKAGE ERROR
           ===================================================== */

        function showPackageError() {

            packageLoading
                ?.classList.add(
                    "hidden"
                );


            packageContent
                ?.classList.add(
                    "hidden"
                );


            packageError
                ?.classList.remove(
                    "hidden"
                );


            if (
                submitBookingButton
            ) {

                submitBookingButton.disabled =
                    true;

            }

        }


        /* =====================================================
           RENDER PACKAGE
           ===================================================== */

        function renderSelectedPackage() {

            if (
                !selectedPackage
            ) {

                return;

            }


            packageLoading
                ?.classList.add(
                    "hidden"
                );


            packageError
                ?.classList.add(
                    "hidden"
                );


            packageContent
                ?.classList.remove(
                    "hidden"
                );


            const image =
                selectedPackage.gallery
                    ?.find(
                        item =>
                            item &&
                            item.url
                    )
                    ?.url ||
                "";


            if (
                packageImage
            ) {

                if (
                    image
                ) {

                    packageImage.src =
                        image;


                    packageImage.style.display =
                        "block";

                } else {

                    packageImage.removeAttribute(
                        "src"
                    );


                    packageImage.style.display =
                        "none";

                }

            }


            if (
                packageName
            ) {

                packageName.textContent =
                    selectedPackage.name ||
                    "Tour Package";

            }


            if (
                packageLocation
            ) {

                packageLocation.textContent =
                    selectedPackage.location ||
                    "Philippines";

            }


            if (
                packageDuration
            ) {

                packageDuration.textContent =
                    selectedPackage.duration ||
                    "—";

            }


            if (
                packagePrice
            ) {

                packagePrice.textContent =
                    `₱${formatMoney(
                        selectedPackage.price
                    )}`;

            }

        }


        /* =====================================================
           ACCOMMODATIONS
           ===================================================== */

        function packageAccommodations() {
            return Array.isArray(selectedPackage?.accommodations)
                ? selectedPackage.accommodations
                : [];
        }

        function includedPackageAccommodation() {
            return packageAccommodations().find(item => {
                const type = normalizeLower(item?.type || item?.optionType || "included");
                const status = normalizeLower(item?.status || "active");
                return type === "included" && item?.active !== false && status !== "hidden";
            }) || null;
        }

        function optionalPackageAccommodations() {
            return packageAccommodations().filter(item => {
                const type = normalizeLower(item?.type || item?.optionType || "included");
                const status = normalizeLower(item?.status || "active");
                return type !== "included" && item?.active !== false && status !== "hidden";
            });
        }

        function populateAccommodations() {
            if (!accommodation || !selectedPackage) return;

            const included = includedPackageAccommodation();

            selectedAccommodation = included
                ? {
                    id: normalizeText(included.id || included.accommodationId),
                    name: normalizeText(included.name) || "Package Included Accommodation",
                    resortName: normalizeText(included.resortName),
                    capacity: normalizeText(included.capacity || included.maxGuests),
                    type: "included",
                    price: 0
                }
                : {
                    id: "",
                    name: "Standard / Package Included",
                    resortName: "",
                    capacity: "",
                    type: "included",
                    price: 0
                };

            accommodation.value = selectedAccommodation.name;
            updateBookingSummary();
        }

        function updateSelectedAccommodation() {
            populateAccommodations();
        }


        /* =====================================================
           PROMO CODE
           ===================================================== */

        function getDateTimestamp(
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

            const timestamp =
                Date.parse(
                    value
                );

            return Number.isNaN(
                timestamp
            )
                ? 0
                : timestamp;

        }


        function showPromoMessage(
            message,
            type = ""
        ) {

            if (!promoBookingMessage) {
                return;
            }

            promoBookingMessage.textContent =
                message || "";

            promoBookingMessage.classList.remove(
                "hidden",
                "success",
                "error"
            );

            if (!message) {
                promoBookingMessage.classList.add(
                    "hidden"
                );
                return;
            }

            if (type) {
                promoBookingMessage.classList.add(
                    type
                );
            }

        }


        function clearAppliedPromo(
            message = ""
        ) {

            appliedPromo =
                null;

            summaryPromoRow
                ?.classList.add(
                    "hidden"
                );

            if (summaryPromoDiscount) {
                summaryPromoDiscount.textContent =
                    "-₱0";
            }

            if (bookingPromoCode) {
                bookingPromoCode.disabled =
                    false;
            }

            if (applyPromoButton) {
                applyPromoButton.disabled =
                    false;

                applyPromoButton.classList.remove(
                    "remove-promo"
                );

                applyPromoButton.textContent =
                    "Apply";
            }

            showPromoMessage(
                message,
                message ? "error" : ""
            );

            updateBookingSummary();

        }


        function promoAppliesToSelectedPackage(
            promo
        ) {

            const applicableTo =
                normalizeLower(
                    promo.applicableTo ||
                    "all"
                );

            if (
                applicableTo === "all" ||
                applicableTo === "all_packages"
            ) {
                return true;
            }

            const promoPackageId =
                normalizeText(
                    promo.packageId
                );

            if (
                promoPackageId &&
                promoPackageId ===
                selectedPackage?.id
            ) {
                return true;
            }

            const promoPackageName =
                normalizeLower(
                    promo.packageName
                );

            return Boolean(
                promoPackageName &&
                promoPackageName ===
                    normalizeLower(
                        selectedPackage?.name
                    )
            );

        }


        function calculatePromoDiscount(
            promo,
            originalTotal,
            promoPax = 1
        ) {

            const value =
                Math.max(
                    0,
                    normalizeNumber(
                        promo.discountValue
                    )
                );

            const discountType =
                normalizeLower(
                    promo.discountType
                );

            let discount = 0;

            if (
                discountType === "percentage"
            ) {

                discount =
                    originalTotal *
                    (value / 100);

            } else if (
                discountType === "per_pax"
            ) {

                discount =
                    value *
                    Math.max(
                        0,
                        promoPax
                    );

            } else {

                /*
                 * Fixed per booking.
                 */
                discount =
                    value;

            }

            const maximumDiscount =
                Math.max(
                    0,
                    normalizeNumber(
                        promo.maximumDiscount
                    )
                );

            /*
             * Maximum Discount applies to percentage and per-pax promos.
             * A value of 0 means no cap.
             */
            if (
                maximumDiscount > 0 &&
                (
                    discountType === "percentage" ||
                    discountType === "per_pax"
                )
            ) {

                discount =
                    Math.min(
                        discount,
                        maximumDiscount
                    );

            }

            return Math.min(
                originalTotal,
                Math.max(
                    0,
                    discount
                )
            );

        }


        async function countPromoUsage(
            promoId,
            customerUid
        ) {

            const allUsageQuery =
                query(
                    collection(
                        db,
                        "bookings"
                    ),
                    where(
                        "promoId",
                        "==",
                        promoId
                    )
                );

            const allUsageSnapshot =
                await getDocs(
                    allUsageQuery
                );

            let customerUsage =
                0;

            allUsageSnapshot.forEach(
                item => {

                    const data =
                        item.data();

                    if (
                        normalizeText(
                            data.customerUid
                        ) ===
                        normalizeText(
                            customerUid
                        )
                    ) {
                        customerUsage += 1;
                    }

                }
            );

            return {
                total:
                    allUsageSnapshot.size,
                customer:
                    customerUsage
            };

        }


        async function validatePromoDocument(
            promo,
            promoId
        ) {

            if (!promo || !promoId) {
                throw new Error(
                    "Promo code not found."
                );
            }

            if (
                normalizeLower(
                    promo.status
                ) !== "active"
            ) {
                throw new Error(
                    "This promo is not active."
                );
            }

            const now =
                Date.now();

            const validFrom =
                getDateTimestamp(
                    promo.validFrom
                );

            const validUntil =
                getDateTimestamp(
                    promo.validUntil
                );

            if (
                validFrom &&
                now < validFrom
            ) {
                throw new Error(
                    "This promo is not available yet."
                );
            }

            if (
                validUntil &&
                now > validUntil
            ) {
                throw new Error(
                    "This promo has already expired."
                );
            }

            if (
                !promoAppliesToSelectedPackage(
                    promo
                )
            ) {
                throw new Error(
                    "This promo is not applicable to the selected package."
                );
            }

            const calculation =
                calculateBooking(
                    false
                );

            const minimumPax =
                Math.max(
                    1,
                    normalizeNumber(
                        promo.minimumPax ||
                        1
                    )
                );

            if (
                calculation.payablePax <
                minimumPax
            ) {
                throw new Error(
                    `Minimum ${minimumPax} paying pax required for this promo.`
                );
            }


            const minimumAmount =
                Math.max(
                    0,
                    normalizeNumber(
                        promo.minimumAmount
                    )
                );

            if (
                minimumAmount > 0 &&
                calculation.originalTotal <
                    minimumAmount
            ) {
                throw new Error(
                    `Minimum booking amount is ₱${formatMoney(
                        minimumAmount
                    )}.`
                );
            }

            const usage =
                await countPromoUsage(
                    promoId,
                    currentCustomer?.uid ||
                        auth.currentUser?.uid ||
                        ""
                );

            const usageLimit =
                Math.max(
                    0,
                    normalizeNumber(
                        promo.usageLimit
                    )
                );

            if (
                usageLimit > 0 &&
                usage.total >= usageLimit
            ) {
                throw new Error(
                    "This promo has reached its usage limit."
                );
            }

            const perCustomerLimit =
                Math.max(
                    0,
                    normalizeNumber(
                        promo.perCustomerLimit
                    )
                );

            if (
                perCustomerLimit > 0 &&
                usage.customer >=
                    perCustomerLimit
            ) {
                throw new Error(
                    "You have already reached the usage limit for this promo."
                );
            }

            const discountAmount =
                calculatePromoDiscount(
                    promo,
                    calculation.originalTotal,
                    calculation.payablePax
                );

            if (
                discountAmount <= 0
            ) {
                throw new Error(
                    "This promo does not provide a valid discount."
                );
            }

            return {
                id:
                    promoId,

                code:
                    normalizeText(
                        promo.code
                    ).toUpperCase(),

                title:
                    normalizeText(
                        promo.title
                    ),

                discountType:
                    normalizeLower(
                        promo.discountType
                    ),

                discountValue:
                    normalizeNumber(
                        promo.discountValue
                    ),

                maximumDiscount:
                    normalizeNumber(
                        promo.maximumDiscount
                    ),

                minimumAmount:
                    normalizeNumber(
                        promo.minimumAmount
                    ),


                minimumPax:
                    Math.max(
                        1,
                        normalizeNumber(
                            promo.minimumPax ||
                            1
                        )
                    ),

                applicableTo:
                    normalizeLower(
                        promo.applicableTo
                    ),

                packageId:
                    normalizeText(
                        promo.packageId
                    ),

                packageName:
                    normalizeText(
                        promo.packageName
                    ),

                validFrom:
                    promo.validFrom ||
                    null,

                validUntil:
                    promo.validUntil ||
                    null,

                discountAmount:
                    discountAmount
            };

        }


        async function findAndValidatePromo(
            rawCode
        ) {

            const code =
                normalizeText(
                    rawCode
                ).toUpperCase();

            if (!code) {
                throw new Error(
                    "Please enter a promo code."
                );
            }

            const promoQuery =
                query(
                    collection(
                        db,
                        "promos"
                    ),
                    where(
                        "status",
                        "==",
                        "active"
                    ),
                    where(
                        "code",
                        "==",
                        code
                    )
                );

            const snapshot =
                await getDocs(
                    promoQuery
                );

            if (snapshot.empty) {
                throw new Error(
                    "Invalid or unavailable promo code."
                );
            }

            const promoDocument =
                snapshot.docs[0];

            return validatePromoDocument(
                promoDocument.data(),
                promoDocument.id
            );

        }


        async function handleApplyPromo() {

            if (appliedPromo) {
                clearAppliedPromo();
                return;
            }

            if (
                !selectedPackage
            ) {
                showPromoMessage(
                    "Please wait for the package to finish loading.",
                    "error"
                );
                return;
            }

            const code =
                normalizeText(
                    bookingPromoCode?.value
                ).toUpperCase();

            if (bookingPromoCode) {
                bookingPromoCode.value =
                    code;
            }

            const originalButtonText =
                applyPromoButton
                    ?.textContent ||
                "Apply";

            try {

                if (applyPromoButton) {
                    applyPromoButton.disabled =
                        true;

                    applyPromoButton.innerHTML =
                        '<i class="fa-solid fa-spinner fa-spin"></i>';
                }

                showPromoMessage("");

                const validatedPromo =
                    await findAndValidatePromo(
                        code
                    );

                appliedPromo =
                    validatedPromo;

                if (bookingPromoCode) {
                    bookingPromoCode.disabled =
                        true;
                }

                if (applyPromoButton) {
                    applyPromoButton.disabled =
                        false;

                    applyPromoButton.textContent =
                        "Remove";

                    applyPromoButton.classList.add(
                        "remove-promo"
                    );
                }

                showPromoMessage(
                    `${validatedPromo.title || validatedPromo.code} applied successfully.`,
                    "success"
                );

                updateBookingSummary();

            } catch (error) {

                console.error(
                    "PROMO APPLY ERROR:",
                    error
                );

                appliedPromo =
                    null;

                showPromoMessage(
                    error?.message ||
                    "Unable to apply promo code.",
                    "error"
                );

                if (applyPromoButton) {
                    applyPromoButton.disabled =
                        false;

                    applyPromoButton.textContent =
                        originalButtonText;
                }

                updateBookingSummary();

            }

        }


        async function revalidateAppliedPromo() {

            if (!appliedPromo) {
                return true;
            }

            try {

                const refreshedPromo =
                    await findAndValidatePromo(
                        appliedPromo.code
                    );

                appliedPromo =
                    refreshedPromo;

                updateBookingSummary();

                return true;

            } catch (error) {

                clearAppliedPromo(
                    error?.message ||
                    "Your promo is no longer available."
                );

                return false;

            }

        }


        /* =====================================================
           BOOKING CALCULATION
           ===================================================== */

        function calculateBooking(
            includePromo = true
        ) {

            const passenger =
                getPassengerBreakdown();

            const packageRate =
                selectedPackage
                    ?.price ||
                0;

            /*
             * Start from every traveler at the regular package rate,
             * then remove the free-child and discount benefits.
             */
            const grossPackageAmount =
                packageRate *
                passenger.totalPax;

            const childFreeAmount =
                passenger.kidsPricingEnabled
                    ? packageRate *
                        passenger.freeChildPax
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
                selectedAccommodation
                    ?.price ||
                0;

            const originalTotal =
                packageSubtotal +
                accommodationAmount;

            const discountAmount =
                includePromo &&
                appliedPromo
                    ? calculatePromoDiscount(
                        appliedPromo,
                        originalTotal,
                        passenger.payablePax
                    )
                    : 0;

            const total =
                Math.max(
                    0,
                    originalTotal -
                    discountAmount
                );

            /*
             * Deposit is collected only from payable package passengers.
             * Only payable package passengers are included in the deposit.
             */
            const deposit =
                DEPOSIT_PER_PAX *
                passenger.payablePax;

            return {

                pax:
                    passenger.totalPax,

                totalPax:
                    passenger.totalPax,

                child0To3:
                    passenger.child0To3,

                child4To8:
                    passenger.child4To8,

                kidsPricingEnabled:
                    passenger.kidsPricingEnabled,

                freeChildPax:
                    passenger.freeChildPax,

                discountedChildPax:
                    passenger.discountedChildPax,

                childDiscountPerPax,

                regularPax:
                    passenger.regularPax,

                payingPaxBeforeExclusive:
                    passenger.payingPaxBeforeExclusive,

                payablePax:
                    passenger.payablePax,

                exclusiveTourEnabled:
                    passenger.exclusiveTourEnabled,

                isExclusive:
                    passenger.isExclusive,

                exclusiveFreePax:
                    passenger.exclusiveFreePax,

                passengerPricing:
                    passenger.passengerPricing,

                exclusiveConfig:
                    passenger.exclusiveConfig,

                packageRate,
                grossPackageAmount,
                childFreeAmount,
                childDiscountAmount,
                exclusiveDiscountAmount,
                packageSubtotal,
                accommodationAmount,
                originalTotal,
                discountAmount,
                total,
                deposit

            };

        }


        /* =====================================================
           UPDATE SUMMARY
           ===================================================== */

        function updateBookingSummary() {

            if (
                !selectedPackage
            ) {

                return;

            }


            const calculation =
                calculateBooking();


            if (!calculation.kidsPricingEnabled) {

                summaryChildFreeRow
                    ?.classList.add(
                        "hidden"
                    );

                summaryChildDiscountRow
                    ?.classList.add(
                        "hidden"
                    );

            }


            if (
                summaryPackageRate
            ) {

                summaryPackageRate.textContent =
                    `₱${formatMoney(
                        calculation.packageRate
                    )}`;

            }


            if (
                summaryPax
            ) {

                summaryPax.textContent =
                    String(
                        calculation.pax
                    );

            }


            if (
                summarySubtotal
            ) {

                summarySubtotal.textContent =
                    `₱${formatMoney(
                        calculation.packageSubtotal
                    )}`;

            }


            if (
                summaryChildFreeRow &&
                summaryChildFree
            ) {

                if (
                    calculation.kidsPricingEnabled &&
                    calculation.freeChildPax > 0
                ) {

                    summaryChildFreeRow.classList.remove(
                        "hidden"
                    );

                    summaryChildFree.textContent =
                        `${calculation.freeChildPax} ${
                            calculation.freeChildPax === 1
                                ? "pax"
                                : "pax"
                        } • FREE`;

                } else {

                    summaryChildFreeRow.classList.add(
                        "hidden"
                    );

                }

            }


            if (
                summaryChildDiscountRow &&
                summaryChildDiscount
            ) {

                if (
                    calculation.childDiscountAmount > 0
                ) {

                    summaryChildDiscountRow.classList.remove(
                        "hidden"
                    );

                    summaryChildDiscount.textContent =
                        `-₱${formatMoney(
                            calculation.childDiscountAmount
                        )}`;

                } else {

                    summaryChildDiscountRow.classList.add(
                        "hidden"
                    );

                }

            }


            if (
                summaryExclusiveRow &&
                summaryExclusiveDiscount
            ) {

                if (
                    calculation.exclusiveFreePax > 0
                ) {

                    summaryExclusiveRow.classList.remove(
                        "hidden"
                    );

                    summaryExclusiveDiscount.textContent =
                        `${calculation.exclusiveFreePax} FREE pax (-₱${formatMoney(
                            calculation.exclusiveDiscountAmount
                        )})`;

                } else {

                    summaryExclusiveRow.classList.add(
                        "hidden"
                    );

                }

            }


            if (
                summaryAccommodation
            ) {

                if (
                    selectedAccommodation
                ) {

                    summaryAccommodation.textContent =
                        selectedAccommodation.price >
                        0

                            ? `${selectedAccommodation.name} (+₱${formatMoney(
                                selectedAccommodation.price
                            )})`

                            : selectedAccommodation.name;

                } else {

                    summaryAccommodation.textContent =
                        "Included";

                }

            }


            if (
                summaryPromoRow &&
                summaryPromoDiscount
            ) {

                if (
                    calculation.discountAmount >
                    0
                ) {

                    summaryPromoRow.classList.remove(
                        "hidden"
                    );

                    summaryPromoDiscount.textContent =
                        `-₱${formatMoney(
                            calculation.discountAmount
                        )}`;

                } else {

                    summaryPromoRow.classList.add(
                        "hidden"
                    );

                    summaryPromoDiscount.textContent =
                        "-₱0";

                }

            }


            if (
                summaryTotal
            ) {

                summaryTotal.textContent =
                    `₱${formatMoney(
                        calculation.total
                    )}`;

            }


            if (
                requiredDeposit
            ) {

                requiredDeposit.textContent =
                    `₱${formatMoney(
                        calculation.deposit
                    )}`;

            }


            if (
                depositBreakdown
            ) {

                depositBreakdown.textContent =
                    `₱${formatMoney(
                        DEPOSIT_PER_PAX
                    )} × ${calculation.payablePax} pax`;

            }

        }

        /* =====================================================
   POPULATE PICKUP LOCATIONS
   ===================================================== */

function populatePickupLocations() {

    if (!pickupPoint) {
        return;
    }

    pickupPoint.innerHTML = `
        <option value="">
            Select pick up location
        </option>
    `;

    const locations =
        Array.isArray(
            selectedPackage?.pickupLocations
        )
            ? selectedPackage.pickupLocations
            : [];

    locations.forEach(
        location => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                location;

            option.textContent =
                location;

            pickupPoint.appendChild(
                option
            );

        }
    );

    const otherOption =
        document.createElement(
            "option"
        );

    otherOption.value =
        "Other / Along the Way";

    otherOption.textContent =
        "Other / Along the Way";

    pickupPoint.appendChild(
        otherOption
    );

}


        /* =====================================================
           PICKUP
           ===================================================== */

        function handlePickupChange() {

            const isOther =
                pickupPoint?.value ===
                "Other / Along the Way";


            if (
                isOther
            ) {

                otherPickupField
                    ?.classList.remove(
                        "hidden"
                    );


                if (
                    otherPickup
                ) {

                    otherPickup.required =
                        true;

                }

            } else {

                otherPickupField
                    ?.classList.add(
                        "hidden"
                    );


                if (
                    otherPickup
                ) {

                    otherPickup.required =
                        false;


                    otherPickup.value =
                        "";

                }

            }

        }


        /* =====================================================
           PAYMENT INSTRUCTIONS
           ===================================================== */

        function showPaymentInstructions() {

            const method =
                getSelectedPaymentMethod();


            if (
                !method ||
                !PAYMENT_DETAILS[
                    method
                ]
            ) {

                paymentInstructions
                    ?.classList.add(
                        "hidden"
                    );


                return;

            }


            const details =
                PAYMENT_DETAILS[
                    method
                ];


            const calculation =
                calculateBooking();


            if (
                method ===
                "gcash"
            ) {

                paymentInstructionsContent.innerHTML = `

                    <strong>
                        Send your initial deposit via GCash
                    </strong>

                    <div class="payment-detail-row">

                        <span>
                            Account Name
                        </span>

                        <span>
                            ${details.accountName}
                        </span>

                    </div>


                    <div class="payment-detail-row">

    <span>
        GCash Number
    </span>

    <div class="payment-copy-value">

        <span>
            ${details.accountNumber}
        </span>

        <button
            type="button"
            class="payment-copy-btn"
            data-copy="${details.accountNumber}"
        >
            <i class="fa-regular fa-copy"></i>
            Copy
        </button>

    </div>

</div>


                    <div class="payment-detail-row">

                        <span>
                            Amount to Send
                        </span>

                        <span>
                            ₱${formatMoney(
                                calculation.deposit
                            )}
                        </span>

                    </div>

                `;

            } else {

                paymentInstructionsContent.innerHTML = `

                    <strong>
                        Send your initial deposit via Bank Transfer
                    </strong>


                    <div class="payment-detail-row">

                        <span>
                            Bank
                        </span>

                        <span>
                            ${details.bankName}
                        </span>

                    </div>


                    <div class="payment-detail-row">

                        <span>
                            Account Name
                        </span>

                        <span>
                            ${details.accountName}
                        </span>

                    </div>


                   <div class="payment-detail-row">

    <span>
        Account Number
    </span>

    <div class="payment-copy-value">

        <span>
            ${details.accountNumber}
        </span>

        <button
            type="button"
            class="payment-copy-btn"
            data-copy="${details.accountNumber}"
        >
            <i class="fa-regular fa-copy"></i>
            Copy
        </button>

    </div>

</div>


                    <div class="payment-detail-row">

                        <span>
                            Amount to Send
                        </span>

                        <span>
                            ₱${formatMoney(
                                calculation.deposit
                            )}
                        </span>

                    </div>

                `;

            }


            paymentInstructions
                ?.classList.remove(
                    "hidden"
                );

        }


        /* =====================================================
           DUPLICATE PAYMENT REFERENCE
           ===================================================== */

        async function paymentReferenceExists(
            reference
        ) {

            const normalizedReference =
                normalizeLower(
                    reference
                );


            if (
                !normalizedReference
            ) {

                return false;

            }


            /*
             * Query normalized field.
             * New client submissions will always store this.
             */

            const paymentQuery =
                query(
                    collection(
                        db,
                        "bookings"
                    ),
                    where(
                        "paymentReferenceNormalized",
                        "==",
                        normalizedReference
                    )
                );


            const snapshot =
                await getDocs(
                    paymentQuery
                );


            return !snapshot.empty;

        }


        /* =====================================================
           VALIDATION
           ===================================================== */

        function validateBooking() {

            if (
                !selectedPackage
            ) {

                alert(
                    "Please select a valid tour package."
                );


                return false;

            }


            if (
                !clientBookingForm
                    ?.checkValidity()
            ) {

                clientBookingForm
                    ?.reportValidity();


                return false;

            }


            const pax =
                getPax();


            if (
                pax < 1
            ) {

                alert(
                    "Please enter a valid number of guests."
                );


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


            const method =
                getSelectedPaymentMethod();


            if (
                !method
            ) {

                alert(
                    "Please select GCash or Bank Transfer."
                );


                return false;

            }


            const reference =
                normalizeText(
                    paymentReference
                        ?.value
                );


            if (
                !reference
            ) {

                alert(
                    "Payment reference number is required."
                );


                paymentReference
                    ?.focus();


                return false;

            }


            if (
                reference.length <
                4
            ) {

                alert(
                    "Please enter a valid payment reference number."
                );


                paymentReference
                    ?.focus();


                return false;

            }


            if (
                !bookingAgreement
                    ?.checked
            ) {

                alert(
                    "Please confirm the booking agreement."
                );


                return false;

            }


            return true;

        }


        /* =====================================================
           CREATE BOOKING DATA
           ===================================================== */

        function createBookingData(
    bookingNumber
) {

            const calculation =
                calculateBooking();


            const startDate =
                travelDate.value;


            const endDate =
                calculateTravelEndDate(
                    startDate,
                    selectedPackage.duration
                );


            const paymentMethod =
                getSelectedPaymentMethod();


            const paymentReferenceValue =
                normalizeText(
                    paymentReference.value
                );


            const finalPickup =
                pickupPoint.value ===
                "Other / Along the Way"

                    ? normalizeText(
                        otherPickup.value
                    )

                    : pickupPoint.value;


            const now =
                new Date()
                    .toISOString();


            return {

                /* =============================================
                   REQUEST
                   ============================================= */

                bookingReference:
    bookingNumber,

bookingNumber:
    bookingNumber,


                /* =============================================
                   CUSTOMER
                   ============================================= */

                customerUid:
    currentCustomer?.uid ||
    auth.currentUser?.uid ||
    "",

customerType:
    (currentCustomer?.uid || auth.currentUser?.uid)
        ? "registered"
        : "guest",

accountStatus:
    (currentCustomer?.uid || auth.currentUser?.uid)
        ? "registered"
        : "guest",

customerName:
    normalizeText(
        customerName.value
    ),

customerContact:
    normalizeText(
        customerContact.value
    ),

customerEmail:
    normalizeLower(
        customerEmail.value
    ),

customerFb:
    normalizeText(
        customerFacebook.value
    ),


                /* =============================================
                   PACKAGE
                   ============================================= */

                packageId:
                    selectedPackage.id,

                packageName:
                    selectedPackage.name,

                packageCategory:
                    selectedPackage.category,

                packageLocation:
                    selectedPackage.location,

                duration:
                    selectedPackage.duration,

                packageRate:
                    calculation.packageRate,


                /* =============================================
                   TRAVEL
                   ============================================= */

                travelStartDate:
                    startDate,

                travelEndDate:
                    endDate,

                pax:
                    calculation.pax,

                totalPax:
                    calculation.totalPax,

                child0To3:
                    calculation.child0To3,

                child4To8:
                    calculation.child4To8,

                regularPax:
                    calculation.regularPax,

                payingPax:
                    calculation.payablePax,

                payingPaxBeforeExclusive:
                    calculation.payingPaxBeforeExclusive,

                exclusiveTour:
                    calculation.isExclusive,

                exclusiveFreePax:
                    calculation.exclusiveFreePax,

                kidsPricingEnabled:
                    calculation.kidsPricingEnabled,

                childDiscountPerPax:
                    calculation.childDiscountPerPax,

                passengerPricingSnapshot: {
                    kidsPricingEnabled:
                        calculation.passengerPricing.enabled,
                    childFreeMaxAge:
                        calculation.passengerPricing.childFreeMaxAge,
                    childDiscountMinAge:
                        calculation.passengerPricing.childDiscountMinAge,
                    childDiscountMaxAge:
                        calculation.passengerPricing.childDiscountMaxAge,
                    childDiscountAmount:
                        calculation.passengerPricing.childDiscountAmount
                },

                exclusiveTourEnabled:
                    calculation.exclusiveTourEnabled,

                exclusiveTourSnapshot: {
                    enabled:
                        calculation.exclusiveConfig.enabled,
                    minimumPayingPax:
                        calculation.exclusiveConfig.minimumPayingPax,
                    freeStartsAt:
                        calculation.exclusiveConfig.freeStartsAt,
                    freePax:
                        calculation.exclusiveConfig.freePax,
                    maxFreePax:
                        calculation.exclusiveConfig.maxFreePax
                },

                pickup:
                    finalPickup,

                specialRequest:
                    normalizeText(
                        specialRequest.value
                    ),


                /* =============================================
                   ACCOMMODATION
                   ============================================= */

                accommodation:
                    selectedAccommodation?.name ||
                    "Standard / Package Included",

                accommodationId:
                    selectedAccommodation?.id || "",

                accommodationResortName:
                    selectedAccommodation?.resortName || "",

                accommodationType:
                    "included",

                accommodationPrice:
                    0,

                addons: [],
                addonsTotal: 0,


/* =============================================
                   AMOUNTS
                   ============================================= */

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

                promoId:
                    appliedPromo?.id ||
                    "",

                promoCode:
                    appliedPromo?.code ||
                    "",

                promoTitle:
                    appliedPromo?.title ||
                    "",

                promoDiscountType:
                    appliedPromo?.discountType ||
                    "",

                promoDiscountValue:
                    appliedPromo?.discountValue ||
                    0,

                discountAmount:
                    calculation.discountAmount,

                totalAmount:
                    calculation.total,

                requiredDeposit:
                    calculation.deposit,

                depositPerPax:
                    DEPOSIT_PER_PAX,

                amountPaid:
                    0,

                balance:
                    calculation.total,


                /* =============================================
                   PAYMENT
                   ============================================= */

                paymentMethod:
                    paymentMethod,

                paymentReference:
                    paymentReferenceValue,

                paymentReferenceNormalized:
                    normalizeLower(
                        paymentReferenceValue
                    ),

                paymentStatus:
                    "pending_verification",

                paymentVerified:
                    false,

                paymentVerifiedAt:
                    null,

                paymentVerifiedBy:
                    "",


                /* =============================================
                   BOOKING STATUS
                   ============================================= */

                bookingStatus:
                    "pending",

                bookingSource:
                    "website",

                source:
                    "client_booking_form",


                /* =============================================
                   EMAIL
                   ============================================= */

                confirmationEmailSent:
                    false,

                confirmationEmailSentAt:
                    null,


                /* =============================================
                   TIMESTAMPS
                   ============================================= */

                createdAt:
                    now,

                updatedAt:
                    now

            };

        }


        /* =====================================================
           SUBMIT
           ===================================================== */

        async function submitBooking(
            event
        ) {

            event.preventDefault();


            if (
                isSubmitting
            ) {

                return;

            }


            if (
                !validateBooking()
            ) {

                return;

            }


            const originalButtonContent =
                submitBookingButton
                    ?.innerHTML;


            try {

                isSubmitting =
                    true;


                if (
                    submitBookingButton
                ) {

                    submitBookingButton.disabled =
                        true;


                    submitBookingButton.innerHTML = `

                        <i class="fa-solid fa-spinner fa-spin"></i>

                        Submitting...

                    `;

                }


                const reference =
                    normalizeText(
                        paymentReference.value
                    );


                /*
                 * Revalidate an applied promo immediately
                 * before saving the booking.
                 */
                const promoStillValid =
                    await revalidateAppliedPromo();


                if (!promoStillValid) {

                    alert(
                        "Your promo could not be applied. Please review the promo message and submit again."
                    );

                    return;
                }


                /*
                 * SECURITY:
                 * Do not query the private /bookings collection from
                 * the public customer booking page.
                 *
                 * Duplicate payment-reference verification is handled
                 * by Admin during payment verification.
                 */


                /*
 * Generate Firestore document reference first.
 * Hindi pa ito nagsa-save.
 */
const bookingDocRef =
    doc(
        collection(
            db,
            "bookings"
        )
    );


/*
 * Use part of Firestore's unique ID
 * for the permanent booking number.
 */
const bookingNumber =
    generateBookingNumber(
        bookingDocRef.id
    );


const bookingData =
    createBookingData(
        bookingNumber
    );


/*
 * Save once only.
 */
await setDoc(
    bookingDocRef,
    bookingData
);


                console.log(
    "CLIENT BOOKING SUBMITTED:",
    {
        id:
            bookingDocRef.id,

        bookingNumber:
            bookingNumber,

        package:
            selectedPackage.name,

        paymentStatus:
            bookingData.paymentStatus,

        bookingStatus:
            bookingData.bookingStatus
    }
);


                submittedBooking = {
                    id: bookingDocRef.id,
                    ref: bookingDocRef,
                    bookingNumber,
                    data: bookingData
                };

                showSuccessModal(
                    bookingNumber
                );


            } catch (error) {

                console.error(
                    "CLIENT BOOKING SUBMIT ERROR:",
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
                        "Unable to submit your booking request. Please try again."
                    );

                }


            } finally {

                isSubmitting =
                    false;


                if (
                    submitBookingButton
                ) {

                    submitBookingButton.disabled =
                        false;


                    submitBookingButton.innerHTML =
                        originalButtonContent ||
                        `
                            <i class="fa-solid fa-paper-plane"></i>
                            Submit Booking Request
                        `;

                }

            }

        }


        /* =====================================================
           SUCCESS MODAL
           ===================================================== */

        function addonPricePerNight(item) {
            return Math.max(0, normalizeNumber(item?.pricePerNight ?? item?.price ?? 0));
        }

        function addonPhoto(item) {
            const direct = item?.mainPhoto?.url || item?.mainPhoto ||
                item?.photo?.url || item?.photo || "";

            if (normalizeText(direct)) return normalizeText(direct);

            const gallery = Array.isArray(item?.gallery) ? item.gallery : [];
            const first = gallery.find(photo =>
                normalizeText(photo?.url || (typeof photo === "string" ? photo : ""))
            );

            return normalizeText(first?.url || (typeof first === "string" ? first : ""));
        }

        function bookingNights() {
            const duration = normalizeText(selectedPackage?.duration);
            const match = duration.match(/(\d+)\s*D\s*(\d+)\s*N/i);
            if (match) return Math.max(1, Number(match[2]) || 1);

            const days = duration.match(/(\d+)\s*D/i);
            return days ? Math.max(1, (Number(days[1]) || 1) - 1) : 1;
        }

        function renderPostBookingAddons() {
            if (!postBookingAddons || !postBookingAddonList) return;

            const upgrades = optionalPackageAccommodations();

            selectedPostBookingAddon = null;
            postBookingAddonList.innerHTML = "";
            addSelectedAddonButton?.classList.add("hidden");
            postBookingSelectedSummary?.classList.add("hidden");

            if (currentIncludedAccommodation) {
                currentIncludedAccommodation.textContent =
                    selectedAccommodation?.name ||
                    "Package Included Accommodation";
            }

            if (!upgrades.length) {
                postBookingAddons.classList.add("hidden");
                return;
            }

            postBookingAddons.classList.remove("hidden");

            const nights = bookingNights();
            const currentTotal = Math.max(
                0,
                normalizeNumber(submittedBooking?.data?.totalAmount)
            );

            upgrades.forEach(item => {
                const price = addonPricePerNight(item);
                const image = addonPhoto(item);
                const resort = normalizeText(item.resortName);
                const roomName = normalizeText(item.name) || "Accommodation Upgrade";
                const maxGuests = Math.max(
                    0,
                    normalizeNumber(item.maxGuests || item.capacity)
                );
                const totalUpgrade = price * nights;

                const card = document.createElement("article");
                card.className = "post-booking-addon-card";

                card.innerHTML = `
                    <div class="post-booking-addon-photo">
                        ${
                            image
                                ? `<img src="${image}" alt="${roomName}" loading="lazy">`
                                : `<div class="post-booking-addon-placeholder"><i class="fa-solid fa-bed"></i></div>`
                        }
                    </div>

                    <div class="post-booking-addon-info">
                        <div class="post-booking-addon-top">
                            <div>
                                <strong>${roomName}</strong>
                                ${resort ? `<span><i class="fa-solid fa-location-dot"></i> ${resort}</span>` : ""}
                            </div>
                            <span class="optional-badge">Optional</span>
                        </div>

                        <div class="post-booking-addon-meta">
                            ${
                                maxGuests > 0
                                    ? `<span><i class="fa-solid fa-user-group"></i> Up to ${maxGuests} guest${maxGuests === 1 ? "" : "s"}</span>`
                                    : ""
                            }
                            <span><i class="fa-regular fa-moon"></i> ${nights} night${nights === 1 ? "" : "s"}</span>
                        </div>

                        <div class="post-booking-addon-price-row">
                            <div>
                                <small>Upgrade Rate</small>
                                <b>₱${formatMoney(price)} <em>/ night</em></b>
                            </div>

                            <div class="post-booking-addon-total">
                                <small>Total Upgrade</small>
                                <strong>+₱${formatMoney(totalUpgrade)}</strong>
                            </div>
                        </div>

                        <button type="button" class="post-booking-select-addon">
                            Select Upgrade
                        </button>
                    </div>
                `;

                const selectButton = card.querySelector(".post-booking-select-addon");

                selectButton?.addEventListener("click", () => {
                    postBookingAddonList
                        .querySelectorAll(".post-booking-addon-card")
                        .forEach(element => {
                            element.classList.remove("selected");
                            const button = element.querySelector(".post-booking-select-addon");
                            if (button) button.innerHTML = "Select Upgrade";
                        });

                    card.classList.add("selected");

                    if (selectButton) {
                        selectButton.innerHTML =
                            `<i class="fa-solid fa-check"></i> Selected`;
                    }

                    selectedPostBookingAddon = {
                        ...item,
                        pricePerNight: price,
                        nights,
                        amount: totalUpgrade
                    };

                    if (selectedAddonName) selectedAddonName.textContent = roomName;
                    if (selectedAddonAmount) {
                        selectedAddonAmount.textContent =
                            `+₱${formatMoney(totalUpgrade)}`;
                    }
                    if (selectedAddonNewTotal) {
                        selectedAddonNewTotal.textContent =
                            `New booking total: ₱${formatMoney(currentTotal + totalUpgrade)}`;
                    }

                    postBookingSelectedSummary?.classList.remove("hidden");
                    addSelectedAddonButton?.classList.remove("hidden");
                });

                postBookingAddonList.appendChild(card);
            });
        }


        function showPostBookingMessage(message, type = "error") {
            if (!postBookingAddonMessage) return;
            postBookingAddonMessage.textContent = message;
            postBookingAddonMessage.className = `post-booking-addon-message ${type}`;
        }

        async function addSelectedAddonToBooking() {
            if (!submittedBooking?.ref || !selectedPostBookingAddon) return;

            const original = addSelectedAddonButton?.innerHTML;

            try {
                if (addSelectedAddonButton) {
                    addSelectedAddonButton.disabled = true;
                    addSelectedAddonButton.innerHTML =
                        `<i class="fa-solid fa-spinner fa-spin"></i> Adding...`;
                }

                const addon = selectedPostBookingAddon;
                const amount = Math.max(0, normalizeNumber(addon.amount));
                const previousTotal = Math.max(
                    0, normalizeNumber(submittedBooking.data?.totalAmount)
                );
                const previousPaid = Math.max(
                    0, normalizeNumber(submittedBooking.data?.amountPaid)
                );
                const newTotal = previousTotal + amount;

                const addonRecord = {
                    category: "accommodation",
                    accommodationId: normalizeText(addon.id || addon.accommodationId),
                    resortName: normalizeText(addon.resortName),
                    name: normalizeText(addon.name) || "Accommodation Upgrade",
                    quantity: 1,
                    unitPrice: addon.pricePerNight,
                    nights: addon.nights,
                    amount,
                    status: "requested",
                    addedBy: "customer",
                    addedAt: new Date().toISOString()
                };

                await updateDoc(submittedBooking.ref, {
                    addons: [addonRecord],
                    addonsTotal: amount,
                    totalAmount: newTotal,
                    balance: Math.max(0, newTotal - previousPaid),
                    updatedAt: new Date().toISOString()
                });

                showPostBookingMessage(
                    `${addonRecord.name} was added to booking ${submittedBooking.bookingNumber}.`,
                    "success"
                );

                if (addSelectedAddonButton) {
                    addSelectedAddonButton.innerHTML =
                        `<i class="fa-solid fa-check"></i> Added to Booking`;
                }

                window.setTimeout(() => {
                    window.location.href = "home.html";
                }, 900);

            } catch (error) {
                console.error("ADD POST-BOOKING ADDON ERROR:", error);
                showPostBookingMessage(
                    "Unable to add the accommodation upgrade. Your original booking is still saved.",
                    "error"
                );

                if (addSelectedAddonButton) {
                    addSelectedAddonButton.disabled = false;
                    addSelectedAddonButton.innerHTML =
                        original || `<i class="fa-solid fa-plus"></i> Add to Booking`;
                }
            }
        }

        function renderPostBookingAccountPrompt() {

            if (!bookingSuccessModal) {
                return;
            }

            /*
             * Registered customers already have an account,
             * so no account-creation prompt is needed.
             */
            if (currentCustomer?.uid || auth.currentUser?.uid) {

                bookingSuccessModal
                    .querySelector(
                        "#postBookingAccountPrompt"
                    )
                    ?.remove();

                return;
            }


            let prompt =
                bookingSuccessModal.querySelector(
                    "#postBookingAccountPrompt"
                );


            if (!prompt) {

                prompt =
                    document.createElement(
                        "section"
                    );

                prompt.id =
                    "postBookingAccountPrompt";

                prompt.className =
                    "post-booking-account-prompt";

                prompt.innerHTML = `
                    <div
                        style="
                            margin-top:16px;
                            padding:16px;
                            border:1px solid #e2e8f0;
                            border-radius:14px;
                            background:#f8fafc;
                            text-align:center;
                        "
                    >
                        <div
                            style="
                                width:42px;
                                height:42px;
                                margin:0 auto 10px;
                                display:grid;
                                place-items:center;
                                border-radius:50%;
                                background:#eaf2ff;
                                color:#1264e8;
                                font-size:18px;
                            "
                        >
                            <i class="fa-regular fa-user"></i>
                        </div>

                        <strong
                            style="
                                display:block;
                                margin-bottom:5px;
                                color:#0f172a;
                                font-size:14px;
                            "
                        >
                            Manage your booking easier
                        </strong>

                        <p
                            style="
                                margin:0 auto 13px;
                                max-width:320px;
                                color:#64748b;
                                font-size:11px;
                                line-height:1.5;
                            "
                        >
                            Create a Trips Wonder account to track your trip,
                            view booking updates, and access My Trip and Messages.
                        </p>

                        <div
                            style="
                                display:flex;
                                gap:8px;
                                justify-content:center;
                                flex-wrap:wrap;
                            "
                        >
                            <button
                                type="button"
                                id="createAccountAfterBooking"
                                style="
                                    min-height:40px;
                                    padding:0 16px;
                                    border:0;
                                    border-radius:10px;
                                    background:#1264e8;
                                    color:#ffffff;
                                    font:inherit;
                                    font-size:11px;
                                    font-weight:700;
                                    cursor:pointer;
                                "
                            >
                                <i class="fa-solid fa-user-plus"></i>
                                Create Account
                            </button>

                            <button
                                type="button"
                                id="maybeLaterAfterBooking"
                                style="
                                    min-height:40px;
                                    padding:0 16px;
                                    border:1px solid #cbd5e1;
                                    border-radius:10px;
                                    background:#ffffff;
                                    color:#334155;
                                    font:inherit;
                                    font-size:11px;
                                    font-weight:700;
                                    cursor:pointer;
                                "
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                `;


                const modalPanel =
                    bookingSuccessModal.querySelector(
                        ".success-modal-panel"
                    ) ||
                    bookingSuccessModal.firstElementChild ||
                    bookingSuccessModal;


                modalPanel.appendChild(
                    prompt
                );
            }


            const bookingEmail =
                normalizeLower(
                    submittedBooking?.data?.customerEmail ||
                    customerEmail?.value ||
                    ""
                );


            const bookingNumber =
                normalizeText(
                    submittedBooking?.bookingNumber ||
                    bookingRequestReference?.textContent ||
                    ""
                );


            prompt
                .querySelector(
                    "#createAccountAfterBooking"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        const params =
                            new URLSearchParams();

                        if (bookingEmail) {
                            params.set(
                                "email",
                                bookingEmail
                            );
                        }

                        if (bookingNumber) {
                            params.set(
                                "booking",
                                bookingNumber
                            );
                        }

                        params.set(
                            "from",
                            "booking"
                        );


                        window.location.href =
                            `../../register.html?${params.toString()}`;

                    },
                    {
                        once:
                            true
                    }
                );


            prompt
                .querySelector(
                    "#maybeLaterAfterBooking"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            "home.html";

                    },
                    {
                        once:
                            true
                    }
                );
        }


        function showSuccessModal(requestReference) {
            if (bookingRequestReference) {
                bookingRequestReference.textContent = requestReference;
            }

            renderPostBookingAddons();
            renderPostBookingAccountPrompt();

            bookingSuccessModal?.classList.add("show");
            bookingSuccessModal?.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
        }

        function closeSuccessModal() {
            bookingSuccessModal?.classList.remove("show");
            bookingSuccessModal?.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
            window.location.href = "home.html";
        }


        /* =====================================================
   COPY PAYMENT DETAILS
   ===================================================== */

document.addEventListener("click", async event => {

    const copyButton =
        event.target.closest(".payment-copy-btn");

    if (!copyButton) {
        return;
    }

    const value =
        copyButton.dataset.copy || "";

    if (!value) {
        return;
    }

    try {

        await navigator.clipboard.writeText(
            value.replace(/\s+/g, "")
        );

        const originalHTML =
            copyButton.innerHTML;

        copyButton.innerHTML = `
            <i class="fa-solid fa-check"></i>
            Copied
        `;

        copyButton.classList.add("copied");

        setTimeout(() => {

            copyButton.innerHTML =
                originalHTML;

            copyButton.classList.remove(
                "copied"
            );

        }, 1500);

    } catch (error) {

        console.error(
            "COPY PAYMENT DETAIL ERROR:",
            error
        );

    }

});


        /* =====================================================
           EVENTS
           ===================================================== */

        numberOfGuests
            ?.addEventListener(
                "input",
                () => {

                    const passenger =
                        getPassengerBreakdown();

                    if (
                        passenger.childTotal >
                        passenger.totalPax
                    ) {

                        numberOfGuests.setCustomValidity(
                            "Total pax must be equal to or greater than the children count."
                        );

                    } else {

                        numberOfGuests.setCustomValidity(
                            ""
                        );

                        children0To3
                            ?.setCustomValidity(
                                ""
                            );

                        children4To8
                            ?.setCustomValidity(
                                ""
                            );

                    }

                    if (appliedPromo) {
                        clearAppliedPromo(
                            "Booking amount changed. Please apply the promo again."
                        );
                    } else {
                        updateBookingSummary();
                    }

                    showPaymentInstructions();
                }
            );


        [
            children0To3,
            children4To8
        ].forEach(
            element => {

                element
                    ?.addEventListener(
                        "input",
                        () => {

                            const passenger =
                                getPassengerBreakdown();

                            if (
                                passenger.childTotal >
                                passenger.totalPax
                            ) {

                                element.setCustomValidity(
                                    "Children count cannot be greater than total pax."
                                );

                            } else {

                                children0To3
                                    ?.setCustomValidity(
                                        ""
                                    );

                                children4To8
                                    ?.setCustomValidity(
                                        ""
                                    );

                            }

                            if (appliedPromo) {

                                clearAppliedPromo(
                                    "Passenger pricing changed. Please apply the promo again."
                                );

                            } else {

                                updateBookingSummary();

                            }

                            showPaymentInstructions();

                        }
                    );

            }
        );


        applyPromoButton
            ?.addEventListener(
                "click",
                handleApplyPromo
            );


        bookingPromoCode
            ?.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        event.preventDefault();
                        handleApplyPromo();

                    }

                }
            );



        pickupPoint
            ?.addEventListener(
                "change",
                handlePickupChange
            );


        paymentMethodInputs
            .forEach(
                input => {

                    input.addEventListener(
                        "change",
                        showPaymentInstructions
                    );

                }
            );


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


        addSelectedAddonButton
            ?.addEventListener(
                "click",
                addSelectedAddonToBooking
            );


        /* =====================================================
           INITIALIZE
           ===================================================== */
        setMinimumTravelDate();
handlePickupChange();


onAuthStateChanged(
    auth,
    async user => {

        /*
         * GUEST MODE:
         * Visitors may book without creating an account first.
         */
        if (!user) {

            currentCustomer = null;
            currentCustomerProfile = null;

            if (customerEmail) {
                customerEmail.readOnly = false;
            }

            await loadSelectedPackage();

            console.log(
                "GUEST BOOKING READY"
            );

            return;
        }


        /*
         * REGISTERED CUSTOMER:
         * Prefill the booking form from the saved customer profile.
         */
        const profileLoaded =
            await loadCustomerProfile(
                user
            );


        if (!profileLoaded) {

            console.warn(
                "BOOKING: Signed-in profile could not be loaded. Continuing with editable booking form."
            );

            currentCustomer = user;
            currentCustomerProfile = null;

            if (customerEmail) {
                customerEmail.value =
                    normalizeLower(user.email || "");

                customerEmail.readOnly = false;
            }
        }


        await loadSelectedPackage();


        console.log(
            "CUSTOMER BOOKING READY:",
            {
                uid:
                    user.uid,

                email:
                    user.email
            }
        );

    }
);  // closes onAuthStateChanged
        
        

/* CLOSE DOMContentLoaded */
    }
);