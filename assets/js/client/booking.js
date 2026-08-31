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
    db
} from "../firebase/firebase-config.js";


import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    query,  
    where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


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


        let isSubmitting =
            false;


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


        const summaryTotal =
            document.getElementById(
                "summaryTotal"
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

gallery:
    Array.isArray(
        data.gallery
    )
        ? data.gallery
        : []

                };


                renderSelectedPackage();

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

        function populateAccommodations() {

            if (
                !accommodation ||
                !selectedPackage
            ) {

                return;

            }


            accommodation.innerHTML =
                "";


            const accommodations =
                selectedPackage
                    .accommodations ||
                [];


            if (
                accommodations.length ===
                0
            ) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    "";


                option.textContent =
                    "Standard / Package Included";


                option.dataset.price =
                    "0";


                option.dataset.type =
                    "included";


                accommodation.appendChild(
                    option
                );


                accommodation.disabled =
                    true;


                selectedAccommodation = {

                    name:
                        "Standard / Package Included",

                    price:
                        0,

                    type:
                        "included"

                };


                return;

            }


            accommodation.disabled =
                false;


            accommodations.forEach(
                (
                    item,
                    index
                ) => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    const name =
                        normalizeText(
                            item.name
                        ) ||
                        `Accommodation ${index + 1}`;


                    const type =
                        normalizeLower(
                            item.type ||
                            "included"
                        );


                    const price =
                        type ===
                        "included"
                            ? 0
                            : normalizeNumber(
                                item.price
                            );


                    option.value =
                        String(index);


                    option.dataset.price =
                        String(price);


                    option.dataset.type =
                        type;


                    option.textContent =
                        type ===
                        "included"

                            ? `${name} — Included`

                            : `${name} — +₱${formatMoney(
                                price
                            )}`;


                    accommodation.appendChild(
                        option
                    );

                }
            );


            accommodation.selectedIndex =
                0;


            updateSelectedAccommodation();

        }


        function updateSelectedAccommodation() {

            if (
                !selectedPackage
            ) {

                return;

            }


            const accommodations =
                selectedPackage
                    .accommodations ||
                [];


            if (
                accommodations.length ===
                0
            ) {

                selectedAccommodation = {

                    name:
                        "Standard / Package Included",

                    price:
                        0,

                    type:
                        "included"

                };


                updateBookingSummary();

                return;

            }


            const selectedIndex =
                Number(
                    accommodation.value
                );


            const item =
                accommodations[
                    selectedIndex
                ];


            if (
                !item
            ) {

                selectedAccommodation =
                    null;


                updateBookingSummary();

                return;

            }


            const type =
                normalizeLower(
                    item.type ||
                    "included"
                );


            selectedAccommodation = {

                name:
                    normalizeText(
                        item.name
                    ) ||
                    "Accommodation",

                capacity:
                    normalizeText(
                        item.capacity
                    ),

                type:
                    type,

                price:
                    type ===
                    "included"
                        ? 0
                        : normalizeNumber(
                            item.price
                        )

            };


            updateBookingSummary();

        }


        /* =====================================================
           BOOKING CALCULATION
           ===================================================== */

        function calculateBooking() {

            const pax =
                getPax();


            const packageRate =
                selectedPackage
                    ?.price ||
                0;


            const packageSubtotal =
                packageRate *
                pax;


            /*
             * Current assumption:
             *
             * Accommodation upgrade price stored in
             * package is charged ONCE per booking.
             *
             * If later we decide accommodation upgrade
             * should be per person, we can change this
             * calculation.
             */

            const accommodationAmount =
                selectedAccommodation
                    ?.price ||
                0;


            const total =
                packageSubtotal +
                accommodationAmount;


            const deposit =
                DEPOSIT_PER_PAX *
                pax;


            return {

                pax,
                packageRate,
                packageSubtotal,
                accommodationAmount,
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
                    )} × ${calculation.pax} ${
                        calculation.pax === 1
                            ? "pax"
                            : "pax"
                    }`;

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
                    selectedAccommodation
                        ?.name ||
                    "Standard / Package Included",

                accommodationType:
                    selectedAccommodation
                        ?.type ||
                    "included",

                accommodationPrice:
                    calculation
                        .accommodationAmount,


                /* =============================================
                   AMOUNTS
                   ============================================= */

                packageSubtotal:
                    calculation.packageSubtotal,

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
                 * Check if payment reference
                 * has already been submitted.
                 */

                const duplicate =
                    await paymentReferenceExists(
                        reference
                    );


                if (
                    duplicate
                ) {

                    alert(
                        "This payment reference number has already been submitted. Please check your reference number or contact Trips Wonder."
                    );


                    paymentReference.focus();


                    return;

                }


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

        function showSuccessModal(
            requestReference
        ) {

            if (
                bookingRequestReference
            ) {

                bookingRequestReference.textContent =
                    requestReference;

            }


            bookingSuccessModal
                ?.classList.add(
                    "show"
                );


            bookingSuccessModal
                ?.setAttribute(
                    "aria-hidden",
                    "false"
                );


            document.body.style.overflow =
                "hidden";

        }


        function closeSuccessModal() {

            bookingSuccessModal
                ?.classList.remove(
                    "show"
                );


            bookingSuccessModal
                ?.setAttribute(
                    "aria-hidden",
                    "true"
                );


            document.body.style.overflow =
                "";


            /*
             * Return to tours after successful submission.
             */

            window.location.href =
                "tours.html";

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

                    updateBookingSummary();

                    showPaymentInstructions();

                }
            );


        accommodation
            ?.addEventListener(
                "change",
                updateSelectedAccommodation
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


        /* =====================================================
           INITIALIZE
           ===================================================== */

        setMinimumTravelDate();

        handlePickupChange();

        loadSelectedPackage();

    }
);