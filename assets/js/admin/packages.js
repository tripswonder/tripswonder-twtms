// ======================================================
// TRIPS WONDER - ADMIN PACKAGES
// FULL PACKAGE MANAGEMENT MODULE
// ======================================================

import {
    db,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc
} from "../firebase/firebase-db.js";

import {
    requireAuth
} from "../auth/auth-guard.js";

import {
    storage,
    ref,
    uploadBytes,
    getDownloadURL
} from "../firebase/firebase-storage.js";

import {
    showLoading,
    hideLoading,
    showLoadingError
} from "../shared/loading-screen.js";


// =========================================
// PACKAGE PAGE ACCESS
// =========================================

requireAuth({

    allowedRoles: [
        "owner",
        "admin"
    ],

    requiredPermission:
        "packages",

    onAuthorized: (
        user,
        profile
    ) => {

        console.log(
            "PACKAGES ACCESS GRANTED:",
            {
                uid: user.uid,
                role: profile.role,
                packages:
                    profile.permissions?.packages
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

        // ======================================================
        // STATE
        // ======================================================

        let packages = [];

        let editingPackageId = null;

        let saveAsDraftMode = false;

        let activeBuilderSectionId =
            "packageSectionBasic";

        let packageGalleryFiles = [];

        let existingGalleryPhotos = [];

        let accommodationCount = 0;

        let exclusionCount = 0;

        let packageTemplates =
            new Map();

        let packageTemplateDocIds =
            new Map();

        let activePackageTemplateCategory =
            "Beach Tour";

        let categoryTemplateManuallyApplied =
            false;

        let selectedExistingDestinationKey =
            "";

        let destinationLookupBlurTimer =
            null;


        // ======================================================
        // PACKAGE PAGE ELEMENTS
        // ======================================================

        const packageGrid =
            document.getElementById(
                "packageGrid"
            );

        const searchInput =
            document.getElementById(
                "packageSearch"
            );

        const categoryFilter =
            document.getElementById(
                "packageFilter"
            );

        const statusFilter =
            document.getElementById(
                "packageStatusFilter"
            );

        const managePackageTemplatesButton =
            document.getElementById(
                "managePackageTemplatesButton"
            );

        const manageVanRentalButton =
            document.getElementById(
                "manageVanRentalButton"
            );

        manageVanRentalButton?.addEventListener(
            "click",
            () => {
                window.location.href =
                    "van-rental.html";
            }
        );

        const packageTemplateModal =
            document.getElementById(
                "packageTemplateModal"
            );

        const packageTemplateModalOverlay =
            document.getElementById(
                "packageTemplateModalOverlay"
            );

        const closePackageTemplateModalButton =
            document.getElementById(
                "closePackageTemplateModal"
            );

        const cancelPackageTemplateButton =
            document.getElementById(
                "cancelPackageTemplateButton"
            );

        const savePackageTemplateButton =
            document.getElementById(
                "savePackageTemplateButton"
            );

        const resetPackageTemplateButton =
            document.getElementById(
                "resetPackageTemplateButton"
            );

        const packageTemplateDetails =
            document.getElementById(
                "packageTemplateDetails"
            );

        const packageTemplateInclusions =
            document.getElementById(
                "packageTemplateInclusions"
            );

        const packageTemplateExclusions =
            document.getElementById(
                "packageTemplateExclusions"
            );

        const addPackageTemplateInclusion =
            document.getElementById(
                "addPackageTemplateInclusion"
            );

        const addPackageTemplateExclusion =
            document.getElementById(
                "addPackageTemplateExclusion"
            );

        const packageTemplateEditingCategory =
            document.getElementById(
                "packageTemplateEditingCategory"
            );

        const packageTemplateSourceBadge =
            document.getElementById(
                "packageTemplateSourceBadge"
            );

        const categoryTemplateApplied =
            document.getElementById(
                "categoryTemplateApplied"
            );

        const categoryTemplateAppliedText =
            document.getElementById(
                "categoryTemplateAppliedText"
            );

        const destinationSuggestions =
            document.getElementById(
                "destinationSuggestions"
            );

        const existingDestinationPanel =
            document.getElementById(
                "existingDestinationPanel"
            );

        const existingDestinationName =
            document.getElementById(
                "existingDestinationName"
            );

        const existingDestinationCount =
            document.getElementById(
                "existingDestinationCount"
            );

        const existingDestinationOptions =
            document.getElementById(
                "existingDestinationOptions"
            );

        const searchDestinationButton =
            document.getElementById("searchDestinationButton");

        const existingPackageDurationSelect =
            document.getElementById("existingPackageDurationSelect");

        const destinationPackageSelector =
            document.getElementById("destinationPackageSelector");

        const existingDestinationMeta =
            document.getElementById("existingDestinationMeta");

        const existingDestinationThumb =
            document.getElementById("existingDestinationThumb");

        const clearDestinationSearch =
            document.getElementById("clearDestinationSearch");

        const changeDestinationButton =
            document.getElementById("changeDestinationButton");

        const packageEditConfirm =
            document.getElementById("packageEditConfirm");

        const packageEditConfirmMessage =
            document.getElementById("packageEditConfirmMessage");

        const confirmExistingPackageEdit =
            document.getElementById("confirmExistingPackageEdit");

        const cancelExistingPackageEdit =
            document.getElementById("cancelExistingPackageEdit");

        let pendingExistingPackageId = "";

        const packageModalTitle =
            document.getElementById(
                "packageModalTitle"
            );

        const sortSelect =
            document.getElementById(
                "packageSort"
            );


        // ======================================================
        // SUMMARY ELEMENTS
        // ======================================================

        const totalPackagesElement =
            document.getElementById(
                "totalPackages"
            );

        const activePackagesElement =
            document.getElementById(
                "activePackages"
            );

        const hiddenPackagesElement =
            document.getElementById(
                "hiddenPackages"
            );

        const packageCategoriesElement =
            document.getElementById(
                "packageCategories"
            );

        const packageResultText =
            document.getElementById(
                "packageResultText"
            );


        // ======================================================
        // ADD PACKAGE
        // ======================================================

        const addButton =
            document.getElementById(
                "addPackageButton"
            );


        // ======================================================
        // MODAL ELEMENTS
        // ======================================================

        const packageModal =
            document.getElementById(
                "packageModal"
            );

        const closePackageModal =
            document.getElementById(
                "closePackageModal"
            );

        const cancelPackage =
            document.getElementById(
                "cancelPackage"
            );

        const packageModalOverlay =
            document.getElementById(
                "packageModalOverlay"
            );

        const packageForm =
            document.getElementById(
                "packageForm"
            );

        const packageBuilderContent =
            document.getElementById(
                "packageBuilderContent"
            );

        const packageBuilderSideNav =
            document.getElementById(
                "packageBuilderSideNav"
            );

        const packageBuilderStepLabel =
            document.getElementById(
                "packageBuilderStepLabel"
            );

        const packageBuilderStatus =
            document.getElementById(
                "packageBuilderStatus"
            );

        const savePackageDraftButton =
            document.getElementById(
                "savePackageDraftButton"
            );

        const nextPackageSection =
            document.getElementById(
                "nextPackageSection"
            );

        const savePackageButton =
            document.getElementById(
                "savePackageButton"
            );


        // ======================================================
        // INCLUSIONS
        // ======================================================

        const inclusionsList =
            document.getElementById(
                "inclusionsList"
            );

        const addInclusion =
            document.getElementById(
                "addInclusion"
            );

            // ======================================================
// PICK UP LOCATION ELEMENTS
// ======================================================

const pickupLocationList =
    document.getElementById(
        "pickupLocationList"
    );

const addPickupLocation =
    document.getElementById(
        "addPickupLocation"
    );


        // ======================================================
        // EXCLUSIONS
        // ======================================================

        const exclusionsList =
            document.getElementById(
                "exclusionsList"
            );

        const addExclusion =
            document.getElementById(
                "addExclusion"
            );


        // ======================================================
        // ACCOMMODATION
        // ======================================================

        const accommodationList =
            document.getElementById(
                "accommodationList"
            );

        const addAccommodation =
            document.getElementById(
                "addAccommodation"
            );

        const addAccommodationTop =
            document.getElementById(
                "addAccommodationTop"
            );

        const accommodationEmptyHelper =
            document.getElementById(
                "accommodationEmptyHelper"
            );

        // ======================================================
        // TRAVEL SCHEDULE AVAILABILITY
        // ======================================================

        const addTravelSchedule =
            document.getElementById(
                "addTravelSchedule"
            );

        const travelScheduleList =
            document.getElementById(
                "travelScheduleList"
            );

        const travelScheduleEmpty =
            document.getElementById(
                "travelScheduleEmpty"
            );

        const travelScheduleTemplate =
            document.getElementById(
                "travelScheduleTemplate"
            );



// ======================================================
// ADD PICK UP LOCATION ROW
// ======================================================

function addPickupLocationRow(
    value = ""
) {

    if (!pickupLocationList) {
        return;
    }

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "dynamic-row pickup-location-row";

    row.innerHTML = `

        <input
            type="text"
            class="pickup-location-input"
            placeholder="e.g. Greenfield Shaw"
            value="${escapeHtml(value)}"
        >

        <button
            type="button"
            class="remove-row remove-pickup-location"
            aria-label="Remove pick up location"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>

    `;

    const removeButton =
        row.querySelector(
            ".remove-pickup-location"
        );

    removeButton?.addEventListener(
        "click",
        () => {

            row.remove();

            if (
                pickupLocationList
                    .querySelectorAll(
                        ".pickup-location-row"
                    ).length === 0
            ) {

                addPickupLocationRow();

            }

        }
    );

    pickupLocationList.appendChild(
        row
    );

}

// ======================================================
// ADD PICK UP LOCATION BUTTON
// ======================================================

addPickupLocation?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        addPickupLocationRow();

    }
);


        // ======================================================
        // PACKAGE GALLERY
        // ======================================================

        const packagePhotos =
            document.getElementById(
                "packagePhotos"
            );

        const uploadPhotosButton =
            document.getElementById(
                "uploadPhotosButton"
            );

        const photoPreviewGrid =
            document.getElementById(
                "photoPreviewGrid"
            );


        // ======================================================
        // HTML ESCAPE
        // ======================================================

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


        // ======================================================
        // GET INPUT VALUE
        // ======================================================

        function getInputValue(id) {

            const element =
                document.getElementById(id);

            if (!element) {
                return "";
            }

            return (
                element.value || ""
            ).trim();

        }


        // ======================================================
        // SET INPUT VALUE
        // ======================================================

        function setInputValue(
            id,
            value
        ) {

            const element =
                document.getElementById(id);

            if (!element) {
                return;
            }

            let nextValue = value ?? "";

            if (id === "formLocation") {
                const locationAliases = {
                    "quezon prov.": "Quezon",
                    "quezon province": "Quezon",
                    "ncr": "Metro Manila",
                    "metro manila / ncr": "Metro Manila",
                    "national capital region": "Metro Manila",
                    "mt. province": "Mountain Province",
                    "mountain prov.": "Mountain Province"
                };

                const normalizedLocation =
                    String(nextValue).trim().toLowerCase();

                nextValue =
                    locationAliases[normalizedLocation] ??
                    nextValue;

                // If an older saved value is not in the standardized list,
                // keep the field usable instead of silently clearing it.
                if (
                    element.tagName === "SELECT" &&
                    nextValue &&
                    !Array.from(element.options).some(
                        option => option.value === nextValue
                    )
                ) {
                    const legacyOption =
                        document.createElement("option");

                    legacyOption.value = nextValue;
                    legacyOption.textContent =
                        `${nextValue} (Saved value)`;

                    element.appendChild(legacyOption);
                }
            }

            element.value = nextValue;

        }


        // ======================================================
        // NORMALIZE PRICE
        // ======================================================

        function normalizePrice(value) {

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


            return Number.isFinite(number)
                ? number
                : 0;

        }


        // ======================================================
        // GET TIMESTAMP
        // ======================================================

        function getTimestamp(value) {

            if (!value) {
                return 0;
            }


            const parsed =
                Date.parse(
                    value
                );


            return Number.isNaN(parsed)
                ? 0
                : parsed;

        }



        // ======================================================
        // PACKAGE PRICING RULE HELPERS
        // ======================================================

        function getNumberInputValue(
            id,
            fallback = 0
        ) {

            const element =
                document.getElementById(id);

            const value =
                Number(
                    element?.value
                );

            return Number.isFinite(value)
                ? value
                : fallback;

        }


        function updatePackageRuleVisibility() {

            const kidsEnabled =
                document.getElementById(
                    "kidsPricingEnabled"
                )?.checked === true;

            const exclusiveEnabled =
                document.getElementById(
                    "exclusiveTourEnabled"
                )?.checked === true;

            const kidsFields =
                document.getElementById(
                    "kidsPricingFields"
                );

            const exclusiveFields =
                document.getElementById(
                    "exclusiveTourFields"
                );

            kidsFields?.classList.toggle(
                "rule-disabled",
                !kidsEnabled
            );

            exclusiveFields?.classList.toggle(
                "rule-disabled",
                !exclusiveEnabled
            );

            const child3to7Enabled =
                document.getElementById("child3to7Enabled");

            const child8to11Enabled =
                document.getElementById("child8to11Enabled");

            const child3to7Rate =
                document.getElementById("child3to7Rate");

            const child8to11Rate =
                document.getElementById("child8to11Rate");

            if (child3to7Rate) {
                child3to7Rate.disabled =
                    !kidsEnabled ||
                    child3to7Enabled?.checked !== true;
            }

            if (child8to11Rate) {
                child8to11Rate.disabled =
                    !kidsEnabled ||
                    child8to11Enabled?.checked !== true;
            }
        }


        // ======================================================
        // REGULAR SCHEDULE SETTINGS
        // ======================================================

        const scheduleDayNames = [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"
        ];

        function updateScheduleSettingsVisibility() {

            const regularEnabled =
                document.getElementById(
                    "regularScheduleEnabled"
                )?.checked === true;

            const day0IsEnabled =
                document.getElementById(
                    "day0Enabled"
                )?.checked === true;

            document
                .getElementById(
                    "regularScheduleFields"
                )
                ?.classList.toggle(
                    "rule-disabled",
                    !regularEnabled
                );

            document
                .getElementById(
                    "day0ScheduleFields"
                )
                ?.classList.toggle(
                    "rule-disabled",
                    !day0IsEnabled
                );

            const requestedDateEnabled =
                document.getElementById(
                    "requestedTravelDateEnabled"
                )?.checked === true;

            document
                .getElementById(
                    "requestedTravelDateFields"
                )
                ?.classList.toggle(
                    "rule-disabled",
                    !requestedDateEnabled
                );

            updateRegularSchedulePreview();
        }


        function updateRegularSchedulePreview() {

            const preview =
                document.getElementById(
                    "regularSchedulePreview"
                );

            if (!preview) {
                return;
            }

            const enabled =
                document.getElementById(
                    "regularScheduleEnabled"
                )?.checked === true;

            const startDay =
                Math.min(
                    6,
                    Math.max(
                        0,
                        getNumberInputValue(
                            "regularStartDay",
                            5
                        )
                    )
                );

            const durationDays =
                Math.max(
                    1,
                    getNumberInputValue(
                        "regularDurationDays",
                        3
                    )
                );

            const endDay =
                (
                    startDay +
                    durationDays -
                    1
                ) % 7;

            const nights =
                Math.max(
                    0,
                    durationDays - 1
                );

            preview.textContent =
                enabled
                    ? `${scheduleDayNames[startDay]} → ${scheduleDayNames[endDay]} • ${durationDays}D${nights}N`
                    : "Regular schedule disabled";
        }


        document
            .getElementById(
                "regularScheduleEnabled"
            )
            ?.addEventListener(
                "change",
                updateScheduleSettingsVisibility
            );

        document
            .getElementById(
                "day0Enabled"
            )
            ?.addEventListener(
                "change",
                updateScheduleSettingsVisibility
            );

        document
            .getElementById(
                "requestedTravelDateEnabled"
            )
            ?.addEventListener(
                "change",
                updateScheduleSettingsVisibility
            );

        document
            .getElementById(
                "regularStartDay"
            )
            ?.addEventListener(
                "change",
                updateRegularSchedulePreview
            );

        document
            .getElementById(
                "regularDurationDays"
            )
            ?.addEventListener(
                "input",
                updateRegularSchedulePreview
            );


        document
            .getElementById(
                "kidsPricingEnabled"
            )
            ?.addEventListener(
                "change",
                updatePackageRuleVisibility
            );


        document
            .getElementById(
                "exclusiveTourEnabled"
            )
            ?.addEventListener(
                "change",
                updatePackageRuleVisibility
            );

        document
            .getElementById("child3to7Enabled")
            ?.addEventListener(
                "change",
                updatePackageRuleVisibility
            );

        document
            .getElementById("child8to11Enabled")
            ?.addEventListener(
                "change",
                updatePackageRuleVisibility
            );



        // ======================================================
        // PACKAGE BUILDER NAVIGATION / PREVIEW / DRAFT
        // ======================================================

        const PACKAGE_BUILDER_SECTIONS = [
            { id: "packageSectionBasic", label: "Basic Info", sections: ["packageSectionBasic"] },
            { id: "packageSectionGallery", label: "Package Details", sections: ["packageSectionGallery","packageSectionInclusions","packageSectionExclusions","packageSectionPickup"] },
            { id: "packageSectionAccommodation", label: "Accommodation", sections: ["packageSectionAccommodation"] },
            { id: "packageSectionSchedule", label: "Schedule & Itinerary", sections: ["packageSectionSchedule","packageSectionScheduleAvailability","packageSectionItinerary"] },
            { id: "packageSectionPassengerPricing", label: "Pricing Rules", sections: ["packageSectionPassengerPricing"] },
            { id: "packageSectionCostPricing", label: "Cost & Pricing", sections: ["packageSectionCostPricing"] },
            { id: "packageSectionReview", label: "Review & Publish", sections: ["packageSectionReview"] }
        ];


        function updatePackageBuilderStatus(
            status = "draft"
        ) {

            if (!packageBuilderStatus) {
                return;
            }

            const normalized =
                String(status || "draft")
                    .toLowerCase();

            packageBuilderStatus.classList.remove(
                "draft",
                "active",
                "hidden"
            );

            packageBuilderStatus.classList.add(
                normalized === "active" ||
                normalized === "hidden"
                    ? normalized
                    : "draft"
            );

            packageBuilderStatus.textContent =
                normalized === "active"
                    ? "Active"
                    : normalized === "hidden"
                        ? "Hidden"
                        : "Draft";
        }


        function getBuilderSectionIndex(
            sectionId
        ) {

            return Math.max(
                0,
                PACKAGE_BUILDER_SECTIONS.findIndex(item =>
                    item.id === sectionId ||
                    (Array.isArray(item.sections) && item.sections.includes(sectionId))
                )
            );
        }


        function setActiveBuilderSection(
            sectionId,
            {
                scroll = false,
                behavior = "smooth"
            } = {}
        ) {

            const stepIndex = getBuilderSectionIndex(sectionId);
            const stepMeta = PACKAGE_BUILDER_SECTIONS[stepIndex];
            const target = document.getElementById(stepMeta?.id || sectionId);
            if (!target || !stepMeta) return;
            activeBuilderSectionId = stepMeta.id;
            packageBuilderContent?.classList.add("package-step-mode");
            if (packageBuilderContent) {
                packageBuilderContent.dataset.activeStep = String(stepIndex + 1);
            }

            packageBuilderSideNav
                ?.querySelectorAll(
                    "[data-builder-section]"
                )
                .forEach(
                    button => {

                        button.classList.toggle(
                            "active",
                            button.dataset.builderSection === stepMeta.id
                        );
                    }
                );

            document
                .querySelectorAll(
                    ".package-builder-section.builder-section-current"
                )
                .forEach(
                    section =>
                        section.classList.remove(
                            "builder-section-current"
                        )
                );

            (stepMeta.sections || [stepMeta.id]).forEach(id => {
                document.getElementById(id)?.classList.add("builder-section-current");
            });

            // Review & Publish must always reflect the latest live form/costing state.
            // Run after Step 7 becomes active so direct tab clicks and Next both refresh it.
            if (stepMeta.id === "packageSectionReview") {
                if (typeof calculatePackageCosting === "function") {
                    calculatePackageCosting();
                } else if (typeof updatePackageReview === "function") {
                    updatePackageReview();
                }

                window.requestAnimationFrame(() => {
                    if (typeof updatePackageReview === "function") {
                        updatePackageReview();
                    }
                });
            }

            const sectionIndex =
                getBuilderSectionIndex(
                    sectionId
                );

            const sectionMeta =
                PACKAGE_BUILDER_SECTIONS[
                    sectionIndex
                ];

            if (packageBuilderStepLabel) {
                packageBuilderStepLabel.textContent =
                    sectionMeta?.label ||
                    "Package";
            }

            const isLast =
                sectionIndex ===
                PACKAGE_BUILDER_SECTIONS.length -
                1;

            if (nextPackageSection) {
                nextPackageSection.hidden =
                    isLast;
            }

            if (savePackageButton) {
                savePackageButton.hidden = !isLast;
            }

            if (cancelPackage) {
                cancelPackage.innerHTML = sectionIndex > 0
                    ? '<i class="fa-solid fa-arrow-left"></i> Back'
                    : 'Cancel';
            }

            // Each builder step behaves like its own screen.
            // Reset every possible INNER builder scroll container when switching tabs.
            // Do not scroll the browser/window; keep the package header + step navigation fixed.
            const builderScrollContainers = [
                packageBuilderContent,
                packageBuilderContent?.closest(".package-builder-form"),
                packageForm?.querySelector(".package-builder-form")
            ].filter((element, index, list) =>
                element && list.indexOf(element) === index
            );

            builderScrollContainers.forEach(container => {
                if (behavior === "smooth" && scroll) {
                    container.scrollTo({ top: 0, left: 0, behavior: "smooth" });
                } else {
                    container.scrollTop = 0;
                    container.scrollLeft = 0;
                }
            });

            // Run once more after the selected step has been painted.
            // This prevents the browser from restoring the previous tab's inner scroll position.
            window.requestAnimationFrame(() => {
                builderScrollContainers.forEach(container => {
                    container.scrollTop = 0;
                    container.scrollLeft = 0;
                });
            });
        }


        function goToNextBuilderSection() {

            const currentIndex =
                getBuilderSectionIndex(
                    activeBuilderSectionId
                );

            const next =
                PACKAGE_BUILDER_SECTIONS[
                    currentIndex + 1
                ];

            if (!next) {
                return;
            }

            setActiveBuilderSection(
                next.id,
                {
                    scroll: true
                }
            );
        }


        function syncBuilderSectionFromScroll() {

            if (!packageBuilderContent) {
                return;
            }

            const containerTop =
                packageBuilderContent
                    .getBoundingClientRect()
                    .top;

            let bestSection =
                PACKAGE_BUILDER_SECTIONS[0];

            let bestDistance =
                Number.POSITIVE_INFINITY;

            PACKAGE_BUILDER_SECTIONS.forEach(
                item => {

                    const element =
                        document.getElementById(
                            item.id
                        );

                    if (!element) {
                        return;
                    }

                    const distance =
                        Math.abs(
                            element
                                .getBoundingClientRect()
                                .top -
                            containerTop -
                            10
                        );

                    if (
                        distance <
                        bestDistance
                    ) {
                        bestDistance =
                            distance;

                        bestSection =
                            item;
                    }
                }
            );

            if (
                bestSection?.id &&
                bestSection.id !==
                    activeBuilderSectionId
            ) {
                setActiveBuilderSection(
                    bestSection.id
                );
            }
        }


        function updateBuilderLivePreview() {

            const name =
                getInputValue(
                    "formPackageName"
                ) ||
                "Tour Destination";

            const location =
                getInputValue(
                    "formLocation"
                ) ||
                "Location";

            const duration =
                getInputValue(
                    "formDuration"
                ) ||
                "Package Option";

            const price =
                normalizePrice(
                    getInputValue(
                        "formPrice"
                    )
                );

            const nameElement =
                document.getElementById(
                    "builderPreviewName"
                );

            const locationElement =
                document.getElementById(
                    "builderPreviewLocation"
                );

            const durationElement =
                document.getElementById(
                    "builderPreviewDuration"
                );

            const priceElement =
                document.getElementById(
                    "builderPreviewPrice"
                );

            if (nameElement) {
                nameElement.textContent =
                    getBaseDestinationName(
                        name
                    );
            }

            if (locationElement) {
                locationElement.textContent =
                    location;
            }

            if (durationElement) {
                durationElement.textContent =
                    duration;
            }

            if (priceElement) {
                priceElement.textContent =
                    price > 0
                        ? `₱${price.toLocaleString(
                            "en-PH"
                        )}`
                        : "Price TBA";
            }

            const previewImage =
                document.getElementById(
                    "builderPreviewImage"
                );

            if (previewImage) {

                const imageUrl =
                    existingGalleryPhotos?.[0]?.url ||
                    "";

                if (imageUrl) {

                    previewImage.innerHTML = `
                        <img
                            src="${escapeHtml(imageUrl)}"
                            alt="${escapeHtml(name)}"
                        >
                    `;

                } else if (
                    packageGalleryFiles?.[0]
                ) {

                    const previewUrl =
                        URL.createObjectURL(
                            packageGalleryFiles[0]
                        );

                    previewImage.innerHTML = `
                        <img
                            src="${previewUrl}"
                            alt="${escapeHtml(name)}"
                        >
                    `;

                } else {

                    previewImage.innerHTML = `
                        <i class="fa-regular fa-image"></i>
                    `;
                }
            }
        }


        // ======================================================
        // COST & PRICING
        // ======================================================
        const COST_FIELD_IDS = ["costTransportation","costAccommodation","costMeals","costTourGuide","costBoatFerry","costOtherExpenses"];
        const money = value => `₱${Number(value || 0).toLocaleString("en-PH", {minimumFractionDigits:2, maximumFractionDigits:2})}`;

        

        function updatePackageReview(){
            const expectedPax = Math.max(1,getNumberInputValue("costExpectedPax",12));
            const duration = typeof getCostingDuration === "function" ? getCostingDuration() : {days:1,nights:0};
            const totalCost = Array.isArray(dynamicCostItemsState)
                ? dynamicCostItemsState.reduce((sum,item)=>sum + Math.max(0,Number(item.rate||0)) * costMultiplier(item.type,expectedPax,duration,item.qty),0)
                : 0;

            const finalRate = Math.max(0,getNumberInputValue("costFinalSellingRate",0));
            const costPerPax = totalCost / expectedPax;
            const profitPerPax = finalRate - costPerPax;
            const estimatedTourProfit = profitPerPax * expectedPax;
            const profitMargin = finalRate > 0 ? (profitPerPax / finalRate) * 100 : 0;

            const setText=(id,v)=>{const el=document.getElementById(id); if(el) el.textContent=v;};

            setText("reviewDestination",getInputValue("formPackageName")||"—");
            setText("reviewDuration",getInputValue("formDuration")||"—");
            setText("reviewLocation",getInputValue("formLocation")||"—");
            setText("reviewStatus",document.getElementById("formStatus")?.value||"Draft");

            setText("reviewTotalCost",money(totalCost));
            setText("reviewCostPerPax",money(costPerPax));
            setText("reviewExpectedPax",`${expectedPax} pax`);
            setText("reviewFinalRate",`${money(finalRate)} / pax`);
            setText("reviewProfitMargin",`${profitMargin.toFixed(2)}%`);
            setText("reviewTourProfit",money(estimatedTourProfit));
        }

        ["costExpectedPax","costMarkup","costFinalSellingRate",...COST_FIELD_IDS].forEach(id=>document.getElementById(id)?.addEventListener("input",calculatePackageCosting));
        ["formPackageName","formDuration","formLocation","formStatus"].forEach(id=>document.getElementById(id)?.addEventListener("input",updatePackageReview));

        packageBuilderSideNav
            ?.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-builder-section]"
                        );

                    if (!button) {
                        return;
                    }

                    setActiveBuilderSection(
                        button.dataset
                            .builderSection,
                        {
                            scroll: true
                        }
                    );
                }
            );


        nextPackageSection
            ?.addEventListener(
                "click",
                goToNextBuilderSection
            );


        // Do not change tabs from scrolling.
        // The active step changes only through the step buttons, Back, or Next.


        [
            "formPackageName",
            "formLocation",
            "formDuration",
            "formPrice"
        ].forEach(
            inputId => {

                document
                    .getElementById(
                        inputId
                    )
                    ?.addEventListener(
                        "input",
                        updateBuilderLivePreview
                    );
            }
        );



        document
            .querySelectorAll(
                "[data-package-duration]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const value =
                                button.dataset
                                    .packageDuration ||
                                "";

                            const durationDays =
                                Math.max(
                                    1,
                                    Number(
                                        button.dataset
                                            .durationDays
                                    ) || 1
                                );

                            setInputValue(
                                "formDuration",
                                value
                            );

                            setInputValue(
                                "regularDurationDays",
                                durationDays
                            );

                            document
                                .querySelectorAll(
                                    "[data-package-duration]"
                                )
                                .forEach(
                                    item =>
                                        item.classList.toggle(
                                            "active",
                                            item === button
                                        )
                                );

                            updateRegularSchedulePreview();

                            updateBuilderLivePreview();
                        }
                    );
                }
            );


        document
            .getElementById(
                "formDuration"
            )
            ?.addEventListener(
                "input",
                event => {

                    const value =
                        String(
                            event.target.value ||
                            ""
                        ).trim().toLowerCase();

                    document
                        .querySelectorAll(
                            "[data-package-duration]"
                        )
                        .forEach(
                            button =>
                                button.classList.toggle(
                                    "active",
                                    String(
                                        button.dataset
                                            .packageDuration ||
                                        ""
                                    )
                                        .trim()
                                        .toLowerCase() ===
                                    value
                                )
                        );
                }
            );


        savePackageDraftButton
            ?.addEventListener(
                "click",
                () => {

                    if (!packageForm) {
                        return;
                    }

                    saveAsDraftMode =
                        true;

                    const previousNoValidate =
                        packageForm.noValidate;

                    packageForm.noValidate =
                        true;

                    packageForm.requestSubmit();

                    window.setTimeout(
                        () => {
                            packageForm.noValidate =
                                previousNoValidate;
                        },
                        0
                    );
                }
            );




        // ======================================================
        // EXISTING DESTINATION LOOKUP / OPTION REUSE
        // ======================================================

        function normalizeDestinationLookupName(
            value
        ) {

            return getBaseDestinationName(
                String(
                    value ||
                    ""
                )
            )
                .trim()
                .toLowerCase()
                .replace(
                    /\s+/g,
                    " "
                );
        }


        function getDestinationLookupGroups() {

            return groupPackagesByDestination(
                packages
            )
                .map(
                    group => ({
                        ...group,

                        lookupName:
                            normalizeDestinationLookupName(
                                group.name
                            )
                    })
                )
                .sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name
                        )
                );
        }


        function findExistingDestinationByName(
            value
        ) {

            const lookup =
                normalizeDestinationLookupName(
                    value
                );

            if (!lookup) {
                return null;
            }

            return (
                getDestinationLookupGroups()
                    .find(
                        group =>
                            group.lookupName ===
                            lookup
                    ) ||
                null
            );
        }


        function hideDestinationSuggestions() {

            if (!destinationSuggestions) {
                return;
            }

            destinationSuggestions.hidden =
                true;

            destinationSuggestions.innerHTML =
                "";
        }


        function hideExistingDestinationPanel() {

            selectedExistingDestinationKey =
                "";

            if (existingDestinationPanel) {
                existingDestinationPanel.hidden =
                    true;
            }

            // Keep Package Option / Duration visible at all times.
            // Only its dropdown state changes depending on the selected destination.
            if (destinationPackageSelector) {
                destinationPackageSelector.hidden = false;
            }

            if (existingDestinationOptions) {
                existingDestinationOptions.innerHTML =
                    "";
            }
        }


        function renderDestinationSuggestions(
            searchValue
        ) {

            if (!destinationSuggestions) {
                return;
            }

            const query =
                normalizeDestinationLookupName(
                    searchValue
                );

            if (!query) {
                hideDestinationSuggestions();
                return;
            }

            const groups =
                getDestinationLookupGroups();

            const matches =
                groups
                    .filter(
                        group =>
                            group.lookupName.includes(
                                query
                            ) ||
                            String(
                                group.location ||
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    query
                                )
                    )
                    .slice(
                        0,
                        7
                    );

            if (!matches.length) {

                destinationSuggestions.innerHTML = `
                    <div class="destination-suggestion-empty">
                        <i class="fa-solid fa-circle-plus"></i>
                        <span>
                            No existing destination found. This will be created as a new destination.
                        </span>
                    </div>
                `;

                destinationSuggestions.hidden =
                    false;

                return;
            }

            destinationSuggestions.innerHTML =
                matches
                    .map(
                        group => {

                            const optionLabels =
                                group.packages
                                    .map(
                                        item =>
                                            getPackageOptionLabel(
                                                item
                                            )
                                    )
                                    .filter(Boolean)
                                    .slice(
                                        0,
                                        4
                                    );

                            return `
                                <button
                                    type="button"
                                    class="destination-suggestion-item"
                                    data-existing-destination-key="${escapeHtml(group.key)}">

                                    <span class="destination-suggestion-main">
                                        <strong>
                                            ${escapeHtml(group.name)}
                                        </strong>

                                        <span>
                                            ${escapeHtml(group.category || "Other")}
                                            ${group.location ? " • " + escapeHtml(group.location) : ""}
                                            • ${group.packages.length} option${group.packages.length === 1 ? "" : "s"}
                                        </span>
                                    </span>

                                    <span class="destination-suggestion-options">
                                        ${optionLabels
                                            .map(
                                                label =>
                                                    `<span>${escapeHtml(label)}</span>`
                                            )
                                            .join("")}
                                    </span>

                                </button>
                            `;
                        }
                    )
                    .join("");

            destinationSuggestions.hidden =
                false;
        }


        function showExistingPackageOptionMode() {
            const durationInput = document.getElementById("formDuration");
            const durationHelp = document.getElementById("packageDurationHelp");

            if (existingPackageDurationSelect) {
                existingPackageDurationSelect.hidden = false;
            }

            if (durationInput) {
                durationInput.hidden = true;
            }

            if (durationHelp) {
                durationHelp.textContent =
                    "Choose an existing duration to edit its saved package details.";
            }
        }


        function showNewPackageOptionMode() {
            const durationInput = document.getElementById("formDuration");
            const durationHelp = document.getElementById("packageDurationHelp");

            if (existingPackageDurationSelect) {
                existingPackageDurationSelect.hidden = true;
            }

            if (durationInput) {
                durationInput.hidden = false;
                durationInput.disabled = false;
            }

            if (durationHelp) {
                durationHelp.textContent =
                    "Enter the duration for this new package, e.g. Day Tour, 2D1N or 3D2N.";
            }
        }


        function renderExistingDestinationOptions(
            group
        ) {

            if (!existingDestinationPanel) {
                return;
            }

            selectedExistingDestinationKey = group.key;
            showExistingPackageOptionMode();

            if (existingDestinationName) {
                existingDestinationName.textContent = group.name;
            }

            if (existingDestinationMeta) {
                existingDestinationMeta.innerHTML = `
                    <span><i class="fa-regular fa-image"></i>${escapeHtml(group.category || "Tour Package")}</span>
                    <span><i class="fa-solid fa-location-dot"></i>${escapeHtml(group.location || "Location TBA")}</span>
                `;
            }

            if (existingDestinationCount) {
                existingDestinationCount.innerHTML =
                    `<i class="fa-solid fa-box-open"></i> ${group.packages.length} Package Option${group.packages.length === 1 ? "" : "s"}`;
            }

            if (existingDestinationThumb) {
                const imageUrl = group.packages
                    .map(item => item?.gallery?.[0]?.url || "")
                    .find(Boolean) || "";

                existingDestinationThumb.innerHTML = imageUrl
                    ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(group.name)}">`
                    : `<i class="fa-solid fa-umbrella-beach"></i>`;
            }

            if (existingPackageDurationSelect) {
                existingPackageDurationSelect.disabled = false;
                existingPackageDurationSelect.innerHTML =
                    `<option value="">Select package option to edit</option>` +
                    group.packages
                        .map(item => {
                            const duration = getPackageOptionLabel(item);
                            return `<option value="${escapeHtml(item.id)}">${escapeHtml(duration)}</option>`;
                        })
                        .join("");
            }

            if (existingDestinationOptions) {
                existingDestinationOptions.innerHTML = `
                    <button type="button" class="existing-option-add" data-add-package-option>
                        <i class="fa-solid fa-plus"></i>
                        <span>Add New Package Option</span>
                    </button>
                `;
            }

            if (destinationPackageSelector) {
                destinationPackageSelector.hidden = false;
            }

            existingDestinationPanel.hidden = true;
        }


        function selectExistingDestination(
            group
        ) {

            if (!group) {
                return;
            }

            setInputValue(
                "formPackageName",
                group.name
            );

            if (group.location) {
                setInputValue(
                    "formLocation",
                    group.location
                );
            }

            renderExistingDestinationOptions(
                group
            );

            hideDestinationSuggestions();

            updateBuilderLivePreview();
        }


        function copyExistingPackageOption(
            packageId
        ) {

            const sourcePackage =
                packages.find(
                    item =>
                        item.id ===
                        packageId
                );

            if (!sourcePackage) {
                return;
            }

            /*
             * Reuse the existing complete editor loader so Gallery,
             * Details, Inclusions, Exclusions, Accommodation,
             * Pick Up, schedules and itinerary are all copied using
             * the same field mapping as normal Edit Package.
             */
            editPackage(
                packageId
            );

            /*
             * Convert the loaded record into a NEW package option.
             * The source document remains untouched.
             */
            editingPackageId =
                null;

            saveAsDraftMode =
                false;

            if (packageModalTitle) {
                packageModalTitle.textContent =
                    "Add Package Option";
            }

            updatePackageBuilderStatus(
                "draft"
            );

            setInputValue(
                "formStatus",
                "active"
            );

            const group =
                findExistingDestinationByName(
                    sourcePackage.name
                );

            if (group) {
                selectedExistingDestinationKey =
                    group.key;

                window.setTimeout(
                    () =>
                        renderExistingDestinationOptions(
                            group
                        ),
                    80
                );
            }

            window.setTimeout(
                () => {

                    setActiveBuilderSection(
                        "packageSectionBasic",
                        {
                            scroll: true,
                            behavior: "auto"
                        }
                    );

                    document
                        .getElementById(
                            "formDuration"
                        )
                        ?.focus();
                },
                100
            );
        }


        let destinationAutoDetectTimer = null;

        document
            .getElementById("formPackageName")
            ?.addEventListener("input", () => {
                hideDestinationSuggestions();
                hideExistingDestinationPanel();

                window.clearTimeout(destinationAutoDetectTimer);

                const value = getInputValue("formPackageName").trim();

                showExistingPackageOptionMode();

                if (existingPackageDurationSelect) {
                    existingPackageDurationSelect.value = "";
                    existingPackageDurationSelect.disabled = true;
                    existingPackageDurationSelect.innerHTML =
                        `<option value="">${value ? "Detecting package options..." : "Select destination first"}</option>`;
                }

                setInputValue("formDuration", "");
                selectedExistingDestinationKey = "";

                if (!value) {
                    return;
                }

                destinationAutoDetectTimer = window.setTimeout(() => {
                    const groups = getDestinationLookupGroups();
                    const normalizedValue = normalizeDestinationLookupName(value);
                    const exact = groups.find(group => group.key === normalizedValue);

                    if (exact) {
                        selectExistingDestination(exact);
                        return;
                    }

                    showNewPackageOptionMode();
                    setInputValue("formDuration", "");

                    renderDestinationSuggestions(value);
                }, 220);
            });



        clearDestinationSearch
            ?.addEventListener("click", () => {
                setInputValue("formPackageName", "");
                hideDestinationSuggestions();
                hideExistingDestinationPanel();
                selectedExistingDestinationKey = "";
                showExistingPackageOptionMode();
                if (existingPackageDurationSelect) {
                    existingPackageDurationSelect.disabled = true;
                    existingPackageDurationSelect.innerHTML =
                        `<option value="">Select destination first</option>`;
                }
                setInputValue("formDuration", "");
                document.getElementById("formPackageName")?.focus();
            });


        changeDestinationButton
            ?.addEventListener("click", () => {
                hideExistingDestinationPanel();
                selectedExistingDestinationKey = "";
                const input = document.getElementById("formPackageName");
                input?.focus();
                input?.select();
            });


        document
            .getElementById(
                "formPackageName"
            )
            ?.addEventListener(
                "blur",
                () => {

                    window.clearTimeout(
                        destinationLookupBlurTimer
                    );

                    destinationLookupBlurTimer =
                        window.setTimeout(
                            hideDestinationSuggestions,
                            180
                        );
                }
            );


        destinationSuggestions
            ?.addEventListener(
                "mousedown",
                event => {

                    const button =
                        event.target.closest(
                            "[data-existing-destination-key]"
                        );

                    if (!button) {
                        return;
                    }

                    event.preventDefault();

                    const group =
                        getDestinationLookupGroups()
                            .find(
                                item =>
                                    item.key ===
                                    button.dataset
                                        .existingDestinationKey
                            );

                    selectExistingDestination(
                        group
                    );
                }
            );


        function startNewPackageOptionForSelectedDestination() {
            const selectedGroup = getDestinationLookupGroups()
                .find(item => item.key === selectedExistingDestinationKey);

            if (!selectedGroup) {
                document.getElementById("formPackageName")?.focus();
                return;
            }

            editingPackageId = null;
            saveAsDraftMode = false;

            if (packageModalTitle) {
                packageModalTitle.textContent = "Add Package Option";
            }

            updatePackageBuilderStatus("draft");
            setInputValue("formCategory", selectedGroup.category);
            setInputValue("formLocation", selectedGroup.location);
            showNewPackageOptionMode();
            setInputValue("formDuration", "");
            setInputValue("formPrice", "");
            setInputValue("formStatus", "active");
            updateBuilderLivePreview();
            document.getElementById("formDuration")?.focus();
        }

        document
            .getElementById("basicInfoNewOptionButton")
            ?.addEventListener("click", startNewPackageOptionForSelectedDestination);


        existingDestinationOptions
            ?.addEventListener("click", event => {
                const addButton = event.target.closest("[data-add-package-option]");

                if (!addButton) {
                    return;
                }

                startNewPackageOptionForSelectedDestination();
            });


        function closePackageEditConfirmation() {
            pendingExistingPackageId = "";

            if (packageEditConfirm) {
                packageEditConfirm.hidden = true;
            }

            if (existingPackageDurationSelect) {
                existingPackageDurationSelect.value = "";
            }
        }


        existingPackageDurationSelect
            ?.addEventListener("change", event => {
                const packageId = String(event.target.value || "").trim();

                if (!packageId) {
                    return;
                }

                const packageItem = packages.find(item => item.id === packageId);

                if (!packageItem) {
                    event.target.value = "";
                    return;
                }

                pendingExistingPackageId = packageId;

                const selectedFinalRate = normalizePrice(
                    packageItem?.costing?.finalSellingRate ??
                    packageItem?.price ??
                    0
                );

                setInputValue(
                    "formPrice",
                    selectedFinalRate > 0 ? selectedFinalRate : ""
                );
                updateBuilderLivePreview();

                const duration = getPackageOptionLabel(packageItem);
                const destination = getBaseDestinationName(packageItem.name || getInputValue("formPackageName"));

                if (packageEditConfirmMessage) {
                    packageEditConfirmMessage.innerHTML =
                        `You selected the <strong>${escapeHtml(duration)} – ${escapeHtml(destination)}</strong> package.<br>Are you sure you want to edit this package?`;
                }

                if (packageEditConfirm) {
                    packageEditConfirm.hidden = false;
                }
            });


        confirmExistingPackageEdit
            ?.addEventListener("click", () => {
                const packageId = pendingExistingPackageId;

                if (!packageId) {
                    closePackageEditConfirmation();
                    return;
                }

                pendingExistingPackageId = "";

                if (packageEditConfirm) {
                    packageEditConfirm.hidden = true;
                }

                editPackage(packageId);

                const editedPackage = packages.find(item => item.id === packageId);
                const selectedGroup = editedPackage
                    ? findExistingDestinationByName(editedPackage.name)
                    : null;

                if (selectedGroup) {
                    selectedExistingDestinationKey = selectedGroup.key;
                    renderExistingDestinationOptions(selectedGroup);
                    if (existingPackageDurationSelect) {
                        existingPackageDurationSelect.value = packageId;
                    }
                    if (destinationPackageSelector) {
                        destinationPackageSelector.hidden = false;
                    }
                    if (existingDestinationPanel) {
                        existingDestinationPanel.hidden = false;
                    }
                }
            });


        cancelExistingPackageEdit
            ?.addEventListener("click", closePackageEditConfirmation);


        packageEditConfirm
            ?.addEventListener("click", event => {
                if (event.target.closest("[data-package-edit-cancel]")) {
                    closePackageEditConfirmation();
                }
            });


        // ======================================================
        // CATEGORY PACKAGE TEMPLATES
        // ======================================================

        const STARTER_PACKAGE_TEMPLATES = {

            "Beach Tour": {
                details:
                    "Enjoy a relaxing beach getaway with coordinated transportation, accommodation and tour assistance. Final activities and inclusions may vary depending on the destination and selected package option.",

                inclusions: [
                    "Roundtrip Van Transfer",
                    "Driver's Meal, Accommodation and Expenses",
                    "Transportation Expenses",
                    "Accommodation",
                    "Tour Coordinator"
                ],

                exclusions: [
                    "Other Meals not stated in the package",
                    "Entrance / Environmental Fees unless stated as included",
                    "Optional Water Activities",
                    "Personal Expenses"
                ]
            },

            "Island Tour": {
                details:
                    "Experience an island getaway with coordinated land and boat transfers, accommodation and tour assistance. Final island activities depend on the destination and selected package option.",

                inclusions: [
                    "Roundtrip Van Transfer",
                    "Boat Transfer / Island Tour as stated in the package",
                    "Driver's Meal, Accommodation and Expenses",
                    "Accommodation",
                    "Tour Coordinator"
                ],

                exclusions: [
                    "Other Meals not stated in the package",
                    "Entrance / Environmental Fees unless stated as included",
                    "Optional Island Activities",
                    "Personal Expenses"
                ]
            },

            "City Tour": {
                details:
                    "Explore the destination through a coordinated city tour with transportation, accommodation and tour assistance. Attractions and meal inclusions may vary depending on the selected package option.",

                inclusions: [
                    "Roundtrip Van Transfer",
                    "Driver's Meal, Accommodation and Expenses",
                    "Transportation Expenses",
                    "Hotel Accommodation",
                    "Tour Coordinator"
                ],

                exclusions: [
                    "Other Meals not stated in the package",
                    "Entrance Fees unless stated as included",
                    "Optional Activities",
                    "Personal Expenses"
                ]
            },

            "Land Tour": {
                details:
                    "Enjoy a coordinated land tour covering the destination's featured attractions with transportation and tour assistance. Exact stops depend on the package itinerary.",

                inclusions: [
                    "Roundtrip Van Transfer",
                    "Driver's Meal, Accommodation and Expenses",
                    "Transportation Expenses",
                    "Accommodation as stated in the package",
                    "Tour Coordinator"
                ],

                exclusions: [
                    "Other Meals not stated in the package",
                    "Entrance Fees unless stated as included",
                    "Optional Activities",
                    "Personal Expenses"
                ]
            },

            "Hiking": {
                details:
                    "A coordinated hiking experience with transportation and tour assistance. Trail fees, guide requirements and equipment inclusions depend on the destination.",

                inclusions: [
                    "Roundtrip Transportation",
                    "Tour Coordinator",
                    "Local Guide when stated in the package"
                ],

                exclusions: [
                    "Meals not stated in the package",
                    "Personal Hiking Gear",
                    "Porter Fees unless stated as included",
                    "Personal Expenses"
                ]
            },

            "Chill Camp": {
                details:
                    "A relaxed camping getaway with coordinated transportation and basic tour assistance. Camping inclusions depend on the selected destination and package.",

                inclusions: [
                    "Roundtrip Transportation",
                    "Camping Area / Accommodation as stated",
                    "Tour Coordinator"
                ],

                exclusions: [
                    "Meals not stated in the package",
                    "Personal Camping Gear unless stated as included",
                    "Optional Activities",
                    "Personal Expenses"
                ]
            },

            "Home Stay": {
                details:
                    "A local stay experience with coordinated transportation, accommodation and tour assistance. Exact inclusions depend on the destination and package option.",

                inclusions: [
                    "Roundtrip Transportation",
                    "Home Stay Accommodation",
                    "Tour Coordinator"
                ],

                exclusions: [
                    "Meals not stated in the package",
                    "Entrance Fees unless stated as included",
                    "Optional Activities",
                    "Personal Expenses"
                ]
            },

            "Domestic": {
                details:
                    "A domestic travel package with coordinated transportation, accommodation and tour assistance. Flight, transfer and activity inclusions depend on the selected package.",

                inclusions: [
                    "Accommodation as stated in the package",
                    "Tour Coordinator / Local Assistance"
                ],

                exclusions: [
                    "Airfare unless stated as included",
                    "Meals not stated in the package",
                    "Optional Activities",
                    "Personal Expenses"
                ]
            },

            "Other": {
                details: "",
                inclusions: [],
                exclusions: []
            }
        };


        function cloneTemplateData(
            template
        ) {

            return {
                details:
                    String(
                        template?.details ||
                        ""
                    ),

                inclusions:
                    Array.isArray(
                        template?.inclusions
                    )
                        ? [
                            ...template
                                .inclusions
                        ]
                        : [],

                exclusions:
                    Array.isArray(
                        template?.exclusions
                    )
                        ? [
                            ...template
                                .exclusions
                        ]
                        : []
            };
        }


        function getPackageTemplate(
            category
        ) {

            const saved =
                packageTemplates.get(
                    category
                );

            if (saved) {
                return cloneTemplateData(
                    saved
                );
            }

            return cloneTemplateData(
                STARTER_PACKAGE_TEMPLATES[
                    category
                ] ||
                STARTER_PACKAGE_TEMPLATES
                    .Other
            );
        }


        async function loadPackageTemplates() {

            try {

                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            "packageTemplates"
                        )
                    );

                packageTemplates.clear();
                packageTemplateDocIds.clear();

                snapshot.forEach(
                    templateDoc => {

                        const data =
                            templateDoc.data() ||
                            {};

                        const category =
                            String(
                                data.category ||
                                ""
                            ).trim();

                        if (!category) {
                            return;
                        }

                        packageTemplates.set(
                            category,
                            cloneTemplateData(
                                data
                            )
                        );

                        packageTemplateDocIds.set(
                            category,
                            templateDoc.id
                        );
                    }
                );

            } catch (error) {

                console.warn(
                    "PACKAGE TEMPLATE LOAD WARNING:",
                    error
                );
            }
        }


        function packageFormTemplateHasContent() {

            const details =
                getInputValue(
                    "formAbout"
                ).trim();

            const inclusions =
                collectInclusions()
                    .filter(Boolean);

            const exclusions =
                collectExclusions()
                    .filter(Boolean);

            return Boolean(
                details ||
                inclusions.length ||
                exclusions.length
            );
        }


        function showCategoryTemplateApplied(
            category
        ) {

            if (
                !categoryTemplateApplied ||
                !categoryTemplateAppliedText
            ) {
                return;
            }

            categoryTemplateAppliedText.textContent =
                `${category} defaults applied`;

            categoryTemplateApplied.hidden =
                false;

            window.clearTimeout(
                showCategoryTemplateApplied
                    .timer
            );

            showCategoryTemplateApplied.timer =
                window.setTimeout(
                    () => {
                        categoryTemplateApplied.hidden =
                            true;
                    },
                    3500
                );
        }


        function applyPackageTemplate(
            category,
            {
                force = false,
                confirmReplace = true
            } = {}
        ) {

            const normalizedCategory =
                String(
                    category ||
                    ""
                ).trim();

            if (!normalizedCategory) {
                return false;
            }

            const hasCurrentContent =
                packageFormTemplateHasContent();

            if (
                hasCurrentContent &&
                !force &&
                confirmReplace
            ) {

                const shouldReplace =
                    window.confirm(
                        `Apply the ${normalizedCategory} template?\n\nThis will replace the current Details, Inclusions and Exclusions.`
                    );

                if (!shouldReplace) {
                    return false;
                }
            }

            const template =
                getPackageTemplate(
                    normalizedCategory
                );

            setInputValue(
                "formAbout",
                template.details
            );

            if (inclusionsList) {

                inclusionsList.innerHTML =
                    "";

                if (
                    template.inclusions.length
                ) {

                    template.inclusions.forEach(
                        item =>
                            addInclusionRow(
                                item
                            )
                    );

                } else {

                    addInclusionRow();
                }
            }

            if (exclusionsList) {

                exclusionsList.innerHTML =
                    "";

                if (
                    template.exclusions.length
                ) {

                    template.exclusions.forEach(
                        item =>
                            addExclusionRow(
                                item
                            )
                    );

                } else {

                    addExclusionRow();
                }

                updateExclusionNumbers();
            }

            categoryTemplateManuallyApplied =
                true;

            showCategoryTemplateApplied(
                normalizedCategory
            );

            return true;
        }


        function addPackageTemplateItemRow(
            container,
            value = ""
        ) {

            if (!container) {
                return;
            }

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "package-template-item";

            row.innerHTML = `
                <input
                    type="text"
                    value="${escapeHtml(value)}"
                    placeholder="Enter default item"
                >

                <button
                    type="button"
                    aria-label="Remove item"
                    title="Remove item">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;

            row
                .querySelector(
                    "button"
                )
                ?.addEventListener(
                    "click",
                    () => {
                        row.remove();

                        if (
                            container.children
                                .length === 0
                        ) {
                            addPackageTemplateItemRow(
                                container
                            );
                        }
                    }
                );

            container.appendChild(
                row
            );
        }


        function collectPackageTemplateItems(
            container
        ) {

            if (!container) {
                return [];
            }

            return [
                ...container
                    .querySelectorAll(
                        "input"
                    )
            ]
                .map(
                    input =>
                        input.value.trim()
                )
                .filter(Boolean);
        }


        function renderPackageTemplateEditor(
            category
        ) {

            activePackageTemplateCategory =
                category;

            document
                .querySelectorAll(
                    "[data-template-category]"
                )
                .forEach(
                    button =>
                        button.classList.toggle(
                            "active",
                            button.dataset
                                .templateCategory ===
                                category
                        )
                );

            if (
                packageTemplateEditingCategory
            ) {
                packageTemplateEditingCategory
                    .textContent =
                    category;
            }

            const isSaved =
                packageTemplates.has(
                    category
                );

            if (
                packageTemplateSourceBadge
            ) {

                packageTemplateSourceBadge
                    .classList.toggle(
                        "saved",
                        isSaved
                    );

                packageTemplateSourceBadge
                    .textContent =
                    isSaved
                        ? "Saved Template"
                        : "Starter Template";
            }

            const template =
                getPackageTemplate(
                    category
                );

            if (packageTemplateDetails) {
                packageTemplateDetails.value =
                    template.details;
            }

            if (packageTemplateInclusions) {

                packageTemplateInclusions.innerHTML =
                    "";

                const items =
                    template.inclusions.length
                        ? template.inclusions
                        : [""];

                items.forEach(
                    item =>
                        addPackageTemplateItemRow(
                            packageTemplateInclusions,
                            item
                        )
                );
            }

            if (packageTemplateExclusions) {

                packageTemplateExclusions.innerHTML =
                    "";

                const items =
                    template.exclusions.length
                        ? template.exclusions
                        : [""];

                items.forEach(
                    item =>
                        addPackageTemplateItemRow(
                            packageTemplateExclusions,
                            item
                        )
                );
            }
        }


        function openPackageTemplateModal() {

            if (!packageTemplateModal) {
                return;
            }

            renderPackageTemplateEditor(
                activePackageTemplateCategory ||
                "Beach Tour"
            );

            packageTemplateModal
                .classList.add(
                    "active"
                );

            packageTemplateModal
                .setAttribute(
                    "aria-hidden",
                    "false"
                );

            document.body.classList.add(
                "modal-open"
            );
        }


        function closePackageTemplateModal() {

            if (!packageTemplateModal) {
                return;
            }

            packageTemplateModal
                .classList.remove(
                    "active"
                );

            packageTemplateModal
                .setAttribute(
                    "aria-hidden",
                    "true"
                );

            if (
                !packageModal?.classList
                    .contains("active")
            ) {
                document.body.classList.remove(
                    "modal-open"
                );
            }
        }


        async function saveCurrentPackageTemplate() {

            const category =
                activePackageTemplateCategory;

            if (!category) {
                return;
            }

            const templateData = {
                category,

                details:
                    packageTemplateDetails
                        ?.value
                        .trim() ||
                    "",

                inclusions:
                    collectPackageTemplateItems(
                        packageTemplateInclusions
                    ),

                exclusions:
                    collectPackageTemplateItems(
                        packageTemplateExclusions
                    ),

                updatedAt:
                    new Date()
            };

            const originalHtml =
                savePackageTemplateButton
                    ?.innerHTML ||
                "Save Template";

            try {

                if (savePackageTemplateButton) {
                    savePackageTemplateButton.disabled =
                        true;

                    savePackageTemplateButton.innerHTML = `
                        <i class="fa-solid fa-spinner fa-spin"></i>
                        Saving...
                    `;
                }

                const existingDocId =
                    packageTemplateDocIds.get(
                        category
                    );

                if (existingDocId) {

                    await updateDoc(
                        doc(
                            db,
                            "packageTemplates",
                            existingDocId
                        ),
                        templateData
                    );

                } else {

                    const created =
                        await addDoc(
                            collection(
                                db,
                                "packageTemplates"
                            ),
                            {
                                ...templateData,
                                createdAt:
                                    new Date()
                            }
                        );

                    packageTemplateDocIds.set(
                        category,
                        created.id
                    );
                }

                packageTemplates.set(
                    category,
                    cloneTemplateData(
                        templateData
                    )
                );

                renderPackageTemplateEditor(
                    category
                );

                alert(
                    `${category} template saved successfully.`
                );

            } catch (error) {

                console.error(
                    "SAVE PACKAGE TEMPLATE ERROR:",
                    error
                );

                alert(
                    "Unable to save the package template. Please check Firestore permissions and try again."
                );

            } finally {

                if (savePackageTemplateButton) {
                    savePackageTemplateButton.disabled =
                        false;

                    savePackageTemplateButton.innerHTML =
                        originalHtml;
                }
            }
        }


        managePackageTemplatesButton
            ?.addEventListener(
                "click",
                openPackageTemplateModal
            );


        packageTemplateModalOverlay
            ?.addEventListener(
                "click",
                closePackageTemplateModal
            );


        closePackageTemplateModalButton
            ?.addEventListener(
                "click",
                closePackageTemplateModal
            );


        cancelPackageTemplateButton
            ?.addEventListener(
                "click",
                closePackageTemplateModal
            );


        document
            .querySelectorAll(
                "[data-template-category]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            renderPackageTemplateEditor(
                                button.dataset
                                    .templateCategory
                            );
                        }
                    );
                }
            );


        addPackageTemplateInclusion
            ?.addEventListener(
                "click",
                () =>
                    addPackageTemplateItemRow(
                        packageTemplateInclusions
                    )
            );


        addPackageTemplateExclusion
            ?.addEventListener(
                "click",
                () =>
                    addPackageTemplateItemRow(
                        packageTemplateExclusions
                    )
            );


        savePackageTemplateButton
            ?.addEventListener(
                "click",
                saveCurrentPackageTemplate
            );


        resetPackageTemplateButton
            ?.addEventListener(
                "click",
                () => {

                    const category =
                        activePackageTemplateCategory;

                    const starter =
                        cloneTemplateData(
                            STARTER_PACKAGE_TEMPLATES[
                                category
                            ] ||
                            STARTER_PACKAGE_TEMPLATES
                                .Other
                        );

                    if (packageTemplateDetails) {
                        packageTemplateDetails.value =
                            starter.details;
                    }

                    if (packageTemplateInclusions) {
                        packageTemplateInclusions.innerHTML =
                            "";

                        (
                            starter.inclusions.length
                                ? starter.inclusions
                                : [""]
                        ).forEach(
                            item =>
                                addPackageTemplateItemRow(
                                    packageTemplateInclusions,
                                    item
                                )
                        );
                    }

                    if (packageTemplateExclusions) {
                        packageTemplateExclusions.innerHTML =
                            "";

                        (
                            starter.exclusions.length
                                ? starter.exclusions
                                : [""]
                        ).forEach(
                            item =>
                                addPackageTemplateItemRow(
                                    packageTemplateExclusions,
                                    item
                                )
                        );
                    }

                    if (packageTemplateSourceBadge) {
                        packageTemplateSourceBadge
                            .classList.remove(
                                "saved"
                            );

                        packageTemplateSourceBadge
                            .textContent =
                            "Starter Template";
                    }
                }
            );


        document
            .getElementById(
                "formCategory"
            )
            ?.addEventListener(
                "change",
                event => {

                    const category =
                        event.target.value;

                    if (!category) {
                        return;
                    }

                    const hasContent =
                        packageFormTemplateHasContent();

                    applyPackageTemplate(
                        category,
                        {
                            force:
                                !hasContent,

                            confirmReplace:
                                hasContent
                        }
                    );
                }
            );


        // ======================================================
        // LOAD PACKAGES
        // ======================================================

        async function loadPackages() {

            showLoading({

                title:
                    "Loading Packages...",

                message:
                    "Please wait while we load your travel packages.",

                retry:
                    loadPackages

            });


            try {

                const snapshot =
                    await getDocs(
                        collection(
                            db,
                            "packages"
                        )
                    );


                packages =
                    snapshot.docs.map(
                        docSnapshot => {

                            const data =
                                docSnapshot.data();


                            return {

                                id:
                                    docSnapshot.id,

                                name:
                                    data.destinationName ||
                                    data.name ||
                                    "",

                                destinationName:
                                    data.destinationName ||
                                    data.name ||
                                    "",

                                packageOptionLabel:
                                    data.packageOptionLabel ||
                                    data.duration ||
                                    "",

                                destinationGroupKey:
                                    data.destinationGroupKey ||
                                    "",

                                draftLastSection:
                                    data.draftLastSection ||
                                    "packageSectionBasic",

                                category:
                                    data.category ||
                                    "",

                                location:
                                    data.location ||
                                    "",

                                price:
                                    data.price ||
                                    "",

                                duration:
                                    data.duration ||
                                    "",

                                description:
                                    data.description ||
                                    "",

                                about:
                                    data.about ||
                                    "",

                                status:
                                    data.status ||
                                    "active",

                                gallery:
                                    Array.isArray(
                                        data.gallery
                                    )
                                        ? data.gallery
                                        : [],

                                inclusions:
                                    Array.isArray(
                                        data.inclusions
                                    )
                                        ? data.inclusions
                                        : [],

                                exclusions:
                                    Array.isArray(
                                        data.exclusions
                                    )
                                        ? data.exclusions
                                        : [],

                                pickupLocations:
                                    Array.isArray(
                                        data.pickupLocations
                                    )
                                        ? data.pickupLocations
                                        : [],

                                accommodations:
                                    Array.isArray(
                                        data.accommodations
                                    )
                                        ? data.accommodations
                                        : [],

                                itinerary:
                                    data.itinerary ||
                                    { day0: [], day1: [], day2: [], day3: [], notes: "" },

                                // Cost & Pricing must be carried into the in-memory package object.
                                // Without this, Firestore saves costing correctly but Edit Package
                                // receives packageItem.costing as undefined after loadPackages().
                                costing:
                                    data.costing ||
                                    {},

                                pricingOptions:
                                    data.pricingOptions ||
                                    {},

                                // Keep saved Required Downpayment settings
                                // available after refresh / Edit Package.
                                downpaymentRules:
                                    data.downpaymentRules ||
                                    {
                                        joiner: {
                                            type: "per_paying_pax",
                                            amount: 500
                                        },
                                        exclusive: {
                                            type: "per_paying_pax",
                                            amount: 500
                                        }
                                    },

                                passengerPricing:
                                    data.passengerPricing ||
                                    {
                                        kidsPricingEnabled: false,
                                        childFreeMaxAge: 3,
                                        childDiscountMinAge: 4,
                                        childDiscountMaxAge: 8,
                                        childDiscountAmount: 500
                                    },

                                exclusiveTour:
                                    data.exclusiveTour ||
                                    {
                                        enabled: false,
                                        minimumPayingPax: 10,
                                        vanType: "high",
                                        vanCapacity: 15,
                                        includedVanUnits: 1,
                                        additionalVanRate: 0
                                    },

                                scheduleSettings:
                                    data.scheduleSettings ||
                                    {
                                        enabled: false,
                                        startDay: 5,
                                        durationDays: 3,
                                        day0Enabled: true,
                                        day0Offset: -1,
                                        pickupStartTime: "",
                                        pickupEndTime: "",
                                        departureNote: "",
                                        requestedTravelDateEnabled: false,
                                        requestedTravelDateMinPax: 10
                                    },

                                schedules:
                                    Array.isArray(data.schedules)
                                        ? data.schedules
                                        : (
                                            Array.isArray(data.travelSchedules)
                                                ? data.travelSchedules
                                                : []
                                        ),

                                createdAt:
                                    data.createdAt ||
                                    "",

                                updatedAt:
                                    data.updatedAt ||
                                    "",

                                image:
                                    data.gallery?.[0]?.url ||
                                    data.image ||
                                    ""

                            };

                        }
                    );


                console.log(
                    "PACKAGES LOADED FROM FIRESTORE:",
                    packages
                );


                renderPackages();

                hideLoading();


            } catch (error) {

                console.error(
                    "FAILED TO LOAD PACKAGES:",
                    error
                );


                showLoadingError(
                    navigator.onLine
                        ? "Unable to load Packages. Please try again."
                        : "No internet connection. Check your connection and try again.",
                    loadPackages
                );

            }

        }


        // ======================================================
        // UPDATE PACKAGE SUMMARY
        // ======================================================

        function updatePackageSummary() {

            const total =
                packages.length;


            const active =
                packages.filter(
                    item =>
                        (
                            item.status ||
                            "active"
                        ) ===
                        "active"
                ).length;


            const hidden =
                packages.filter(
                    item =>
                        (
                            item.status ||
                            "active"
                        ) ===
                        "hidden"
                ).length;


            const categories =
                new Set(
                    packages
                        .map(
                            item =>
                                (
                                    item.category ||
                                    ""
                                ).trim()
                        )
                        .filter(Boolean)
                );


            if (
                totalPackagesElement
            ) {

                totalPackagesElement
                    .textContent =
                    String(total);

            }


            if (
                activePackagesElement
            ) {

                activePackagesElement
                    .textContent =
                    String(active);

            }


            if (
                hiddenPackagesElement
            ) {

                hiddenPackagesElement
                    .textContent =
                    String(hidden);

            }


            if (
                packageCategoriesElement
            ) {

                packageCategoriesElement
                    .textContent =
                    String(
                        categories.size
                    );

            }

        }



        // ======================================================
        // DESTINATION / PACKAGE OPTION GROUPING
        // ======================================================

        function getBaseDestinationName(value) {

            let name =
                String(value || "").trim();

            const patterns = [
                /\bday\s*tour\b/gi,
                /\b1\s*day(?:\s*0?\s*night)?s?\b/gi,
                /\b2\s*days?\s*1\s*nights?\b/gi,
                /\b3\s*days?\s*2\s*nights?\b/gi,
                /\b4\s*days?\s*3\s*nights?\b/gi,
                /\b5\s*days?\s*4\s*nights?\b/gi,
                /\b6\s*days?\s*5\s*nights?\b/gi,
                /\b7\s*days?\s*6\s*nights?\b/gi,
                /\b\d+\s*d\s*\d+\s*n\b/gi
            ];

            patterns.forEach(pattern => {
                name = name.replace(pattern, " ");
            });

            return name
                .replace(/\s{2,}/g, " ")
                .replace(/[-–—|/]+$/g, "")
                .trim() ||
                String(value || "").trim() ||
                "Tour Destination";
        }


        function getDestinationGroupKey(packageItem) {

            return [
                getBaseDestinationName(
                    packageItem?.name
                ).toLowerCase(),
                String(
                    packageItem?.location || ""
                ).trim().toLowerCase()
            ].join("::");
        }


        function getPackageOptionLabel(packageItem) {

            const rawDuration = String(
                packageItem?.duration || ""
            ).trim();

            if (!rawDuration) {
                return "Tour Option";
            }

            // Normalize older saved formats such as:
            // "2Days 1Night" -> "2D1N"
            // "3 Days 2 Nights" -> "3D2N"
            const normalized = rawDuration
                .replace(
                    /\b(\d+)\s*days?\s*(\d+)\s*nights?\b/i,
                    "$1D$2N"
                )
                .replace(
                    /\b(\d+)\s*d\s*(\d+)\s*n\b/i,
                    "$1D$2N"
                );

            return normalized;
        }


        function groupPackagesByDestination(packageItems) {

            const map = new Map();

            packageItems.forEach(packageItem => {

                const key =
                    getDestinationGroupKey(
                        packageItem
                    );

                if (!map.has(key)) {
                    map.set(key, {
                        key,
                        name:
                            getBaseDestinationName(
                                packageItem.name
                            ),
                        location:
                            packageItem.location || "",
                        category:
                            packageItem.category || "Other",
                        packages: []
                    });
                }

                map.get(key)
                    .packages
                    .push(packageItem);
            });

            return Array.from(
                map.values()
            ).map(group => {

                group.packages.sort(
                    (a, b) =>
                        normalizePrice(a.price) -
                        normalizePrice(b.price)
                );

                return group;
            });
        }


        function openDestinationPackageOptions(basePackageId) {

            const sourcePackage =
                packages.find(
                    item =>
                        item.id === basePackageId
                );

            if (!sourcePackage) {
                return;
            }

            const destinationGroup =
                findExistingDestinationByName(
                    sourcePackage.name
                );

            if (!destinationGroup) {
                return;
            }

            resetPackageForm();

            setInputValue(
                "formPackageName",
                getBaseDestinationName(
                    sourcePackage.name
                )
            );

            setInputValue(
                "formCategory",
                sourcePackage.category || ""
            );

            setInputValue(
                "formLocation",
                sourcePackage.location || ""
            );

            renderExistingDestinationOptions(
                destinationGroup
            );

            setInputValue(
                "formStatus",
                sourcePackage.status || "active"
            );

            updateBuilderLivePreview();

            openPackageModal();

            setActiveBuilderSection(
                "packageSectionBasic",
                {
                    scroll: false,
                    behavior: "auto"
                }
            );

            window.requestAnimationFrame(() => {

                setActiveBuilderSection(
                    "packageSectionBasic",
                    {
                        scroll: false,
                        behavior: "auto"
                    }
                );

                existingPackageDurationSelect?.focus();

            });

        }


        function openNewPackageOption(basePackageId) {

            const sourcePackage =
                packages.find(
                    item =>
                        item.id ===
                        basePackageId
                );

            if (!sourcePackage) {
                openNewPackageModal();
                return;
            }

            resetPackageForm();

            setInputValue(
                "formPackageName",
                getBaseDestinationName(
                    sourcePackage.name
                )
            );

            setInputValue(
                "formCategory",
                sourcePackage.category
            );

            setInputValue(
                "formLocation",
                sourcePackage.location
            );

            const destinationGroup =
                findExistingDestinationByName(
                    sourcePackage.name
                );

            if (destinationGroup) {
                renderExistingDestinationOptions(
                    destinationGroup
                );
            }

            setInputValue(
                "formStatus",
                "active"
            );

            // A new option starts with a clean Cost & Pricing table.
            dynamicCostItemsState = [];
            setInputValue("costExpectedPax", 12);
            setInputValue("costMarkup", 15);
            setInputValue("costFinalSellingRate", "");
            renderDynamicCostItems();
            calculatePackageCosting();

            setInputValue(
                "formDuration",
                ""
            );

            setInputValue(
                "formPrice",
                ""
            );

            updatePackageBuilderStatus(
                "draft"
            );

            updateBuilderLivePreview();

            openPackageModal();

            window.setTimeout(
                () => {

                    setActiveBuilderSection(
                        "packageSectionBasic",
                        {
                            scroll: true,
                            behavior: "auto"
                        }
                    );

                    document
                        .querySelectorAll(
                            "[data-package-duration]"
                        )
                        .forEach(
                            button =>
                                button.classList.remove(
                                    "active"
                                )
                        );

                    document
                        .getElementById(
                            "formDuration"
                        )
                        ?.focus();
                },
                120
            );
        }


        // ======================================================
        // RENDER PACKAGES
        // ======================================================

        function renderPackages() {

            if (!packageGrid) {
                return;
            }

            updatePackageSummary();

            const searchValue =
                searchInput?.value
                    ?.trim()
                    .toLowerCase() ||
                "";

            const selectedCategory =
                categoryFilter?.value ||
                "all";

            const selectedStatus =
                statusFilter?.value ||
                "all";

            const selectedSort =
                sortSelect?.value ||
                "newest";

            let filteredPackages =
                packages.filter(
                    packageItem => {

                        const searchableText =
                            [
                                packageItem.name,
                                packageItem.category,
                                packageItem.location,
                                packageItem.duration
                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();

                        const matchesSearch =
                            !searchValue ||
                            searchableText.includes(
                                searchValue
                            );

                        const matchesCategory =
                            selectedCategory === "all" ||
                            packageItem.category ===
                                selectedCategory;

                        const packageStatus =
                            packageItem.status ||
                            "active";

                        const matchesStatus =
                            selectedStatus === "all" ||
                            packageStatus ===
                                selectedStatus;

                        return (
                            matchesSearch &&
                            matchesCategory &&
                            matchesStatus
                        );
                    }
                );

            filteredPackages =
                [...filteredPackages].sort(
                    (a, b) => {

                        switch (selectedSort) {

                            case "oldest":
                                return (
                                    getTimestamp(a.createdAt) -
                                    getTimestamp(b.createdAt)
                                );

                            case "name-asc":
                                return (
                                    a.name || ""
                                ).localeCompare(
                                    b.name || "",
                                    undefined,
                                    { sensitivity: "base" }
                                );

                            case "name-desc":
                                return (
                                    b.name || ""
                                ).localeCompare(
                                    a.name || "",
                                    undefined,
                                    { sensitivity: "base" }
                                );

                            case "price-low":
                                return (
                                    normalizePrice(a.price) -
                                    normalizePrice(b.price)
                                );

                            case "price-high":
                                return (
                                    normalizePrice(b.price) -
                                    normalizePrice(a.price)
                                );

                            case "newest":
                            default:
                                return (
                                    getTimestamp(b.createdAt) -
                                    getTimestamp(a.createdAt)
                                );
                        }
                    }
                );

            const destinationGroups =
                groupPackagesByDestination(
                    filteredPackages
                );

            if (packageResultText) {

                packageResultText.textContent =
                    `${destinationGroups.length} ${
                        destinationGroups.length === 1
                            ? "destination"
                            : "destinations"
                    } • ${filteredPackages.length} ${
                        filteredPackages.length === 1
                            ? "package option"
                            : "package options"
                    }`;
            }

            packageGrid.innerHTML = "";

            if (
                destinationGroups.length ===
                0
            ) {

                packageGrid.innerHTML = `
                    <div class="package-empty-state">
                        <div class="package-empty-icon">
                            <i class="fa-solid fa-suitcase-rolling"></i>
                        </div>
                        <strong>No packages found</strong>
                        <span>
                            Try changing your search,
                            category, status or sort.
                        </span>
                    </div>
                `;

                return;
            }

            destinationGroups.forEach(
                group => {

                    const representative =
                        group.packages[0];

                    const image =
                        group.packages
                            .map(
                                item =>
                                    item.gallery?.[0]?.url ||
                                    item.image ||
                                    ""
                            )
                            .find(Boolean) ||
                        "";

                    const validPrices =
                        group.packages
                            .map(
                                item =>
                                    normalizePrice(
                                        item.price
                                    )
                            )
                            .filter(
                                price =>
                                    price > 0
                            );

                    const lowestPrice =
                        validPrices.length
                            ? Math.min(
                                ...validPrices
                            )
                            : 0;

                    const activeCount =
                        group.packages.filter(
                            item =>
                                (
                                    item.status ||
                                    "active"
                                ) === "active"
                        ).length;

                    const card =
                        document.createElement(
                            "article"
                        );

                    card.className =
                        "package-card package-destination-card";

                    card.dataset.packageId =
                        representative.id;

                    card.innerHTML = `

                        <div class="package-card-image">

                            ${
                                image
                                    ? `
                                        <img
                                            src="${escapeHtml(image)}"
                                            alt="${escapeHtml(group.name)}"
                                        >
                                      `
                                    : `
                                        <div class="package-card-image-placeholder">
                                            <i class="fa-solid fa-image"></i>
                                        </div>
                                      `
                            }

                            <span class="package-category">
                                ${escapeHtml(group.category)}
                            </span>

                            <span class="package-option-count-badge">
                                <i class="fa-solid fa-layer-group"></i>
                                ${group.packages.length}
                                ${
                                    group.packages.length === 1
                                        ? "Option"
                                        : "Options"
                                }
                            </span>

                        </div>


                        <div class="package-card-body">

                            <h3>
                                ${escapeHtml(group.name)}
                            </h3>

                            <div class="package-card-compact-meta">
                                <div class="package-location">
                                    <i class="fa-solid fa-location-dot"></i>
                                    <span>
                                        ${escapeHtml(
                                            group.location ||
                                            "Location not specified"
                                        )}
                                    </span>
                                </div>

                                <div class="package-destination-price">
                                ${
                                    lowestPrice > 0
                                        ? `
                                            <small>
                                                ${
                                                    group.packages.length > 1
                                                        ? "Starting from"
                                                        : "Package price"
                                                }
                                            </small>
                                            <strong>
                                                ₱${escapeHtml(
                                                    lowestPrice.toLocaleString(
                                                        "en-PH"
                                                    )
                                                )}
                                            </strong>
                                        `
                                        : `
                                            <strong class="price-tba">
                                                Price TBA
                                            </strong>
                                        `
                                }
                                </div>
                            </div>

                            <div class="package-destination-footer">

                            <span>
                                <span class="status-dot"></span>
                                ${activeCount}/${group.packages.length}
                                active
                            </span>

                            <button
                                type="button"
                                class="package-add-option-btn add-package-option-btn"
                                data-id="${escapeHtml(representative.id)}"
                            >
                                <i class="fa-solid fa-plus"></i>
                                Add Option
                            </button>

                        </div>
                    `;

                    packageGrid.appendChild(
                        card
                    );
                }
            );
        }

                // ======================================================
        // OPEN MODAL
        // ======================================================

        function openPackageModal() {

            if (!packageModal) {
                return;
            }


            packageModal.classList.add(
                "show"
            );


            packageModal.setAttribute(
                "aria-hidden",
                "false"
            );


            document.body.style.overflow =
                "hidden";

        }


        // ======================================================
        // CLOSE MODAL
        // ======================================================

        function closeModal() {

            if (!packageModal) {
                return;
            }


            if (
                packageModal.contains(
                    document.activeElement
                )
            ) {

                document.activeElement.blur();

            }


            packageModal.classList.remove(
                "show"
            );


            packageModal.setAttribute(
                "aria-hidden",
                "true"
            );


            document.body.style.overflow =
                "";

        }


        // ======================================================
        // RESET PACKAGE FORM
        // ======================================================

        function resetPackageForm() {

            editingPackageId =
                null;

            saveAsDraftMode =
                false;

            activeBuilderSectionId =
                "packageSectionBasic";

            categoryTemplateManuallyApplied =
                false;

            if (categoryTemplateApplied) {
                categoryTemplateApplied.hidden =
                    true;
            }

            selectedExistingDestinationKey =
                "";

            hideDestinationSuggestions();

            hideExistingDestinationPanel();

            if (packageModalTitle) {
                packageModalTitle.textContent =
                    "Add New Package";
            }


            if (
                packageForm
            ) {

                packageForm.reset();

            }

            resetItineraryBuilder();


            setInputValue(
                "formStatus",
                "active"
            );


            const kidsPricingEnabled =
                document.getElementById(
                    "kidsPricingEnabled"
                );

            const exclusiveTourEnabled =
                document.getElementById(
                    "exclusiveTourEnabled"
                );


            if (kidsPricingEnabled) {
                kidsPricingEnabled.checked = false;
            }

            if (exclusiveTourEnabled) {
                exclusiveTourEnabled.checked = false;
            }


            setInputValue(
                "childFreeMaxAge",
                3
            );

            setInputValue(
                "childDiscountMinAge",
                4
            );

            setInputValue(
                "childDiscountMaxAge",
                8
            );

            setInputValue(
                "childDiscountAmount",
                500
            );

            const child3to7Enabled =
                document.getElementById(
                    "child3to7Enabled"
                );

            const child8to11Enabled =
                document.getElementById(
                    "child8to11Enabled"
                );

            if (child3to7Enabled) {
                child3to7Enabled.checked = true;
            }

            if (child8to11Enabled) {
                child8to11Enabled.checked = true;
            }

            setInputValue(
                "child3to7Rate",
                50
            );

            setInputValue(
                "child8to11Rate",
                75
            );

            setInputValue(
                "infantPricingType",
                "free"
            );

            setInputValue(
                "singleSupplement",
                0
            );

            setInputValue(
                "defaultRoomUpgrade",
                0
            );

            setInputValue(
                "packagePromoDiscount",
                0
            );

            setInputValue(
                "joinerDownpaymentType",
                "per_paying_pax"
            );

            setInputValue(
                "joinerDownpaymentAmount",
                500
            );

            setInputValue(
                "exclusiveDownpaymentType",
                "per_paying_pax"
            );

            setInputValue(
                "exclusiveDownpaymentAmount",
                500
            );


            setInputValue(
                "exclusiveMinimumPayingPax",
                10
            );

            setInputValue(
                "exclusiveVanType",
                "high"
            );

            setInputValue(
                "exclusiveIncludedVanUnits",
                1
            );

            setInputValue(
                "exclusiveAdditionalVanRate",
                0
            );


            updatePackageRuleVisibility();


            const regularScheduleEnabled =
                document.getElementById(
                    "regularScheduleEnabled"
                );

            const day0Enabled =
                document.getElementById(
                    "day0Enabled"
                );

            if (regularScheduleEnabled) {
                regularScheduleEnabled.checked = false;
            }

            if (day0Enabled) {
                day0Enabled.checked = true;
            }

            setInputValue(
                "regularStartDay",
                5
            );

            setInputValue(
                "regularDurationDays",
                3
            );

            setInputValue(
                "day0Offset",
                -1
            );

            setInputValue(
                "pickupStartTime",
                ""
            );

            setInputValue(
                "pickupEndTime",
                ""
            );

            setInputValue(
                "departureNote",
                ""
            );

            const requestedTravelDateEnabled =
                document.getElementById(
                    "requestedTravelDateEnabled"
                );

            if (requestedTravelDateEnabled) {
                requestedTravelDateEnabled.checked = false;
            }

            setInputValue(
                "requestedTravelDateMinPax",
                10
            );

            updateScheduleSettingsVisibility();


            // ==============================================
            // INCLUSIONS
            // ==============================================

            if (
                inclusionsList
            ) {

                inclusionsList.innerHTML =
                    "";


                addInclusionRow();

            }


            // ==============================================
            // EXCLUSIONS
            // ==============================================

            if (
                exclusionsList
            ) {

                exclusionsList.innerHTML =
                    "";


                exclusionCount =
                    0;


                addExclusionItem();

            }

            // ==================================================
// RESET PICK UP LOCATIONS
// ==================================================

if (pickupLocationList) {

    pickupLocationList.innerHTML = "";

    addPickupLocationRow();

}

            // ==================================================
// PICK UP LOCATIONS
// ==================================================

if (
    pickupLocationList
) {

    pickupLocationList.innerHTML =
        "";

    const pickupLocations = [];

    if (
        pickupLocations.length >
        0
    ) {

        pickupLocations.forEach(
            value => {

                addPickupLocationRow(
                    value
                );

            }
        );

    } else {

        addPickupLocationRow();

    }

}


            // ==============================================
            // ACCOMMODATIONS
            // ==============================================

            if (
                accommodationList
            ) {

                accommodationList.innerHTML =
                    "";

            }


            accommodationCount =
                0;

            syncAccommodationEmptyState();

            if (travelScheduleList) {
                travelScheduleList.innerHTML = "";
            }

            syncTravelScheduleEmptyState();


            // ==============================================
            // GALLERY
            // ==============================================

            packageGalleryFiles =
                [];


            existingGalleryPhotos =
                [];


            if (
                packagePhotos
            ) {

                packagePhotos.value =
                    "";

            }


            renderPackageGallery();

            // New packages must always start with a clean costing table.
            // Existing package expenses are restored by editPackage().
            dynamicCostItemsState = [];
            const resetCostPax = document.getElementById("costExpectedPax");
            const resetCostMarkup = document.getElementById("costMarkup");
            const resetCostFinalRate = document.getElementById("costFinalSellingRate");
            if (resetCostPax) resetCostPax.value = 12;
            if (resetCostMarkup) resetCostMarkup.value = 15;
            if (resetCostFinalRate) resetCostFinalRate.value = "";
            renderDynamicCostItems();
            calculatePackageCosting();

        }


        // ======================================================
        // NEW PACKAGE
        // ======================================================

        function openNewPackageModal() {

            resetPackageForm();

            openPackageModal();

            // Always initialize the builder on the first screen immediately.
            // This is required on a fresh page load because resetPackageForm()
            // only resets the state variable; it does not apply the step-mode
            // classes that isolate the active section.
            setActiveBuilderSection(
                "packageSectionBasic",
                {
                    scroll: false,
                    behavior: "auto"
                }
            );

            // Re-apply after the modal has been painted so the browser cannot
            // restore a stale/continuous scroll layout on the first open.
            window.requestAnimationFrame(() => {

                setActiveBuilderSection(
                    "packageSectionBasic",
                    {
                        scroll: false,
                        behavior: "auto"
                    }
                );

            });

        }


        // ======================================================
        // INCLUSIONS
        // ======================================================

        function addInclusionRow(
            value = ""
        ) {

            if (
                !inclusionsList
            ) {
                return;
            }


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "dynamic-row";


            row.innerHTML = `

                <input
                    type="text"
                    value="${escapeHtml(
                        value
                    )}"
                    placeholder="Enter package inclusion"
                >


                <button
                    type="button"
                    class="remove-row"
                    title="Remove inclusion"
                    aria-label="Remove inclusion"
                >

                    <i
                        class="fa-solid fa-xmark"
                    ></i>

                </button>

            `;


            const removeButton =
                row.querySelector(
                    ".remove-row"
                );


            removeButton?.addEventListener(
                "click",
                () => {

                    row.remove();


                    if (
                        inclusionsList
                            .children
                            .length === 0
                    ) {

                        addInclusionRow();

                    }

                }
            );


            inclusionsList.appendChild(
                row
            );

        }


        // ======================================================
        // EXCLUSIONS
        // ======================================================

        function addExclusionItem(
            value = ""
        ) {

            if (
                !exclusionsList
            ) {
                return;
            }


            exclusionCount++;


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "dynamic-row";


            item.innerHTML = `

                <div
                    class="exclusion-number"
                >

                    <span>
                        ${exclusionCount}
                    </span>

                </div>


                <input
                    type="text"
                    class="exclusion-input"
                    value="${escapeHtml(
                        value
                    )}"
                    placeholder="e.g. Personal expenses"
                >


                <button
                    type="button"
                    class="remove-exclusion"
                    title="Remove exclusion"
                    aria-label="Remove exclusion"
                >

                    <i
                        class="fa-solid fa-xmark"
                    ></i>

                </button>

            `;


            exclusionsList.appendChild(
                item
            );


            const removeButton =
                item.querySelector(
                    ".remove-exclusion"
                );


            removeButton?.addEventListener(
                "click",
                () => {

                    item.remove();


                    renumberExclusions();


                    if (
                        exclusionsList
                            .children
                            .length === 0
                    ) {

                        addExclusionItem();

                    }

                }
            );

        }


        // ======================================================
        // RENUMBER EXCLUSIONS
        // ======================================================

        function renumberExclusions() {

            if (
                !exclusionsList
            ) {
                return;
            }


            const items =
                exclusionsList.querySelectorAll(
                    ".dynamic-row"
                );


            items.forEach(
                (
                    item,
                    index
                ) => {

                    const number =
                        item.querySelector(
                            ".exclusion-number span"
                        );


                    if (
                        number
                    ) {

                        number.textContent =
                            String(
                                index + 1
                            );

                    }

                }
            );


            exclusionCount =
                items.length;

        }


        // ======================================================
        // ACCOMMODATION
        // ======================================================

        function addAccommodationCard(
            accommodation = {}
        ) {

            if (!accommodationList) return;

            accommodationCount++;

            const card = document.createElement("div");
            card.className = "accommodation-card";

            const legacyPhoto =
                accommodation.mainPhoto ||
                accommodation.coverPhoto ||
                accommodation.photo ||
                "";

            const existingGallery =
                Array.isArray(accommodation.gallery)
                    ? accommodation.gallery
                        .map(item =>
                            typeof item === "string"
                                ? item
                                : item?.url
                        )
                        .filter(Boolean)
                    : [];

            card.dataset.existingPhoto = legacyPhoto;
            card.dataset.existingGallery =
                JSON.stringify(existingGallery);
            card.dataset.accommodationId =
                accommodation.id ||
                `acc_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 8)}`;

            const amenitiesValue =
                Array.isArray(accommodation.amenities)
                    ? accommodation.amenities.join("\n")
                    : (accommodation.amenities || "");

            const maxGuests =
                Number(accommodation.maxGuests) ||
                Number(
                    String(accommodation.capacity || "")
                        .match(/\d+/)?.[0]
                ) ||
                2;

            const pricePerNight =
                normalizePrice(
                    accommodation.pricePerNight ??
                    accommodation.price ??
                    0
                );

            const resortName =
                accommodation.resortName ||
                accommodation.resort ||
                "";

            const defaultAvailableUnits =
                Math.max(
                    0,
                    Number(
                        accommodation.defaultAvailableUnits ??
                        accommodation.defaultUnits ??
                        accommodation.availableUnits ??
                        0
                    ) || 0
                );

            const isActive =
                accommodation.active !== false &&
                accommodation.status !== "hidden";

            card.innerHTML = `

                <div class="accommodation-card-header">

                    <div class="accommodation-card-heading">

                        <span class="accommodation-card-icon">
                            <i class="fa-solid fa-bed"></i>
                        </span>

                        <div>
                            <strong>
                                Accommodation ${accommodationCount}
                            </strong>
                            <small>
                                Photos, room details and per-night pricing
                            </small>
                        </div>

                    </div>

                    <div class="accommodation-card-actions">
                        <button
                            type="button"
                            class="toggle-accommodation"
                            aria-expanded="false"
                        >
                            <i class="fa-solid fa-chevron-down"></i>
                            <span>Edit</span>
                        </button>

                        <button
                        type="button"
                        class="remove-accommodation"
                        title="Remove accommodation"
                        aria-label="Remove accommodation ${accommodationCount}"
                    >
                        <i class="fa-regular fa-trash-can"></i>
                        <span>Remove</span>
                        </button>
                    </div>

                </div>

                <button
                    type="button"
                    class="accommodation-compact-summary"
                >
                    <strong class="compact-accommodation-name">
                        ${escapeHtml(accommodation.name || "New Accommodation")}
                    </strong>
                    <span class="compact-resort-name">
                        ${escapeHtml(resortName || "Resort not set")}
                    </span>
                    <span class="compact-separator">•</span>
                    <span class="compact-units">
                        ${escapeHtml(defaultAvailableUnits)} unit${defaultAvailableUnits === 1 ? "" : "s"}
                    </span>
                </button>

                <div class="accommodation-layout">

                    <div class="accommodation-photo-column">

                        <label>Main Photo</label>

                        <div class="accommodation-photo-upload">

                            <input
                                type="file"
                                class="accommodation-photo-input"
                                accept="image/*"
                                hidden
                            >

                            <button
                                type="button"
                                class="accommodation-upload-button"
                            >
                                <span class="accommodation-upload-icon">
                                    <i class="fa-regular fa-image"></i>
                                </span>
                                <strong>Add Main Photo</strong>
                                <small>JPG, PNG or WEBP</small>
                            </button>

                            <div class="accommodation-photo-preview"></div>

                        </div>

                        <div class="accommodation-gallery-block">

                            <div class="accommodation-gallery-head">
                                <div>
                                    <strong>Other Photos</strong>
                                    <small>Shown inside the customer room modal.</small>
                                </div>

                                <button
                                    type="button"
                                    class="accommodation-gallery-add"
                                >
                                    <i class="fa-solid fa-plus"></i>
                                    Add Photos
                                </button>
                            </div>

                            <input
                                type="file"
                                class="accommodation-gallery-input"
                                accept="image/*"
                                multiple
                                hidden
                            >

                            <div class="accommodation-gallery-preview"></div>

                        </div>

                    </div>

                    <div class="accommodation-fields-column">

                        <div class="accommodation-grid">

                            <div class="accommodation-field full">
                                <label>Resort Name <span class="accommodation-required">*</span></label>
                                <input
                                    type="text"
                                    class="accommodation-resort-name"
                                    value="${escapeHtml(resortName)}"
                                    placeholder="e.g. Tala Resort"
                                    required
                                >
                                <small class="accommodation-field-help">
                                    Automatically follows this accommodation in Trip Operations.
                                </small>
                            </div>

                            <div class="accommodation-field full">
                                <label>Accommodation Name <span class="accommodation-required">*</span></label>
                                <input
                                    type="text"
                                    class="accommodation-name"
                                    required
                                    value="${escapeHtml(accommodation.name || "")}"
                                    placeholder="e.g. Solo Room Upgrade"
                                >
                            </div>

                            <div class="accommodation-field">
                                <label>Maximum Guests <span class="accommodation-required">*</span></label>
                                <input
                                    type="number"
                                    class="accommodation-max-guests"
                                    min="1"
                                    step="1"
                                    value="${escapeHtml(maxGuests)}"
                                    required
                                >
                            </div>

                            <div class="accommodation-field">
                                <label>Default Available Units <span class="accommodation-required">*</span></label>
                                <input
                                    type="number"
                                    class="accommodation-default-units"
                                    min="0"
                                    step="1"
                                    value="${escapeHtml(defaultAvailableUnits)}"
                                    required
                                >
                                <small class="accommodation-field-help">
                                    Starting inventory copied to newly created schedules.
                                </small>
                            </div>

                            <div class="accommodation-field">
                                <label>Option Type <span class="accommodation-required">*</span></label>
                                <select class="accommodation-type" required>
                                    <option
                                        value="included"
                                        ${accommodation.type === "included" ? "selected" : ""}
                                    >
                                        Included in Package
                                    </option>
                                    <option
                                        value="additional"
                                        ${
                                            accommodation.type === "additional" ||
                                            !accommodation.type
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Optional Upgrade
                                    </option>
                                </select>
                            </div>

                            <div class="accommodation-field">
                                <label>Price per Night <span class="accommodation-required">*</span></label>
                                <div class="accommodation-price-wrap">
                                    <span>₱</span>
                                    <input
                                        type="number"
                                        class="accommodation-price"
                                        min="0"
                                        step="0.01"
                                        value="${escapeHtml(pricePerNight)}"
                                        placeholder="1500"
                                    >
                                </div>
                                <small class="accommodation-field-help">
                                    Customer total = price × nights × rooms.
                                </small>
                            </div>

                            <div class="accommodation-field">
                                <label>Status <span class="accommodation-required">*</span></label>
                                <select class="accommodation-status" required>
                                    <option value="active" ${isActive ? "selected" : ""}>
                                        Active
                                    </option>
                                    <option value="hidden" ${!isActive ? "selected" : ""}>
                                        Hidden
                                    </option>
                                </select>
                            </div>

                            <div class="accommodation-field full">
                                <label>Room Description</label>
                                <textarea
                                    class="accommodation-description"
                                    rows="4"
                                    placeholder="Describe the room, location, sleeping setup, bathroom, air-conditioning, etc."
                                >${escapeHtml(accommodation.description || "")}</textarea>
                            </div>

                            <div class="accommodation-field full">
                                <label>Room Details / Amenities</label>
                                <textarea
                                    class="accommodation-amenities"
                                    rows="4"
                                    placeholder="One per line, e.g.&#10;Air-conditioned&#10;Private CR&#10;Beachfront&#10;Good for couples"
                                >${escapeHtml(amenitiesValue)}</textarea>
                                <small class="accommodation-field-help">
                                    Enter one detail per line. These will appear in the customer room details modal.
                                </small>
                            </div>

                        </div>

                    </div>

                </div>
            `;

            accommodationList.appendChild(card);

            syncAccommodationEmptyState();
            refreshTravelScheduleAccommodationInventories();

            updateAccommodationCompactSummary(card);
            setAccommodationCardExpanded(card, false);


            const accommodationTypeSelect =
                card.querySelector(".accommodation-type");

            const accommodationPriceInput =
                card.querySelector(".accommodation-price");

            function syncAccommodationPriceState() {
                if (
                    !accommodationTypeSelect ||
                    !accommodationPriceInput
                ) {
                    return;
                }

                const included =
                    accommodationTypeSelect.value ===
                    "included";

                if (included) {
                    accommodationPriceInput.value = "0";
                    accommodationPriceInput.disabled = true;
                } else {
                    accommodationPriceInput.disabled = false;
                }
            }

            accommodationTypeSelect?.addEventListener(
                "change",
                syncAccommodationPriceState
            );

            syncAccommodationPriceState();


            const photoInput =
                card.querySelector(".accommodation-photo-input");
            const uploadButton =
                card.querySelector(".accommodation-upload-button");
            const preview =
                card.querySelector(".accommodation-photo-preview");

            function renderMainPhoto(src) {
                if (!src) {
                    preview.innerHTML = "";
                    uploadButton.style.display = "flex";
                    return;
                }

                preview.innerHTML = `
                    <div class="accommodation-preview-image">
                        <img
                            src="${escapeHtml(src)}"
                            alt="Accommodation main photo"
                        >
                        <button
                            type="button"
                            class="remove-accommodation-photo"
                            title="Remove main photo"
                            aria-label="Remove accommodation main photo"
                        >
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                `;

                uploadButton.style.display = "none";
            }

            renderMainPhoto(legacyPhoto);

            uploadButton?.addEventListener(
                "click",
                () => photoInput?.click()
            );

            photoInput?.addEventListener(
                "change",
                () => {

                    const file =
                        photoInput.files?.[0];

                    if (!file) return;

                    if (!file.type.startsWith("image/")) {
                        alert("Please select a valid image file.");
                        photoInput.value = "";
                        return;
                    }

                    const reader =
                        new FileReader();

                    reader.onload =
                        event => {

                            renderMainPhoto(
                                event.target.result
                            );

                            card.dataset.existingPhoto =
                                "";

                        };

                    reader.readAsDataURL(file);

                }
            );

            preview?.addEventListener(
                "click",
                event => {

                    const removePhotoButton =
                        event.target.closest(
                            ".remove-accommodation-photo"
                        );

                    if (!removePhotoButton) return;

                    photoInput.value = "";
                    card.dataset.existingPhoto = "";
                    renderMainPhoto("");

                }
            );

            // ==============================================
            // ACCOMMODATION GALLERY
            // ==============================================

            const galleryInput =
                card.querySelector(
                    ".accommodation-gallery-input"
                );

            const galleryAddButton =
                card.querySelector(
                    ".accommodation-gallery-add"
                );

            const galleryPreview =
                card.querySelector(
                    ".accommodation-gallery-preview"
                );

            card._accommodationGalleryFiles = [];

            function getExistingGallery() {

                try {
                    return JSON.parse(
                        card.dataset.existingGallery ||
                        "[]"
                    );
                } catch {
                    return [];
                }

            }

            function renderAccommodationGallery() {

                const saved =
                    getExistingGallery();

                const newFiles =
                    card._accommodationGalleryFiles ||
                    [];

                const savedHtml =
                    saved.map(
                        (url, index) => `
                            <div class="accommodation-gallery-thumb">
                                <img
                                    src="${escapeHtml(url)}"
                                    alt="Saved room photo ${index + 1}"
                                >
                                <button
                                    type="button"
                                    class="remove-saved-accommodation-gallery"
                                    data-index="${index}"
                                    aria-label="Remove saved room photo"
                                >
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        `
                    ).join("");

                const newHtml =
                    newFiles.map(
                        (file, index) => `
                            <div class="accommodation-gallery-thumb">
                                <img
                                    src="${escapeHtml(
                                        URL.createObjectURL(file)
                                    )}"
                                    alt="New room photo ${index + 1}"
                                >
                                <button
                                    type="button"
                                    class="remove-new-accommodation-gallery"
                                    data-index="${index}"
                                    aria-label="Remove new room photo"
                                >
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        `
                    ).join("");

                galleryPreview.innerHTML =
                    savedHtml +
                    newHtml +
                    (
                        saved.length === 0 &&
                        newFiles.length === 0
                            ? `<div class="accommodation-gallery-empty">
                                   No additional photos yet.
                               </div>`
                            : ""
                    );

            }

            renderAccommodationGallery();

            galleryAddButton?.addEventListener(
                "click",
                () => galleryInput?.click()
            );

            galleryInput?.addEventListener(
                "change",
                () => {

                    const files =
                        Array.from(
                            galleryInput.files ||
                            []
                        ).filter(
                            file =>
                                file.type.startsWith(
                                    "image/"
                                )
                        );

                    if (files.length === 0) return;

                    card._accommodationGalleryFiles.push(
                        ...files
                    );

                    galleryInput.value = "";

                    renderAccommodationGallery();

                }
            );

            galleryPreview?.addEventListener(
                "click",
                event => {

                    const savedRemove =
                        event.target.closest(
                            ".remove-saved-accommodation-gallery"
                        );

                    if (savedRemove) {

                        const saved =
                            getExistingGallery();

                        saved.splice(
                            Number(savedRemove.dataset.index),
                            1
                        );

                        card.dataset.existingGallery =
                            JSON.stringify(saved);

                        renderAccommodationGallery();
                        return;

                    }

                    const newRemove =
                        event.target.closest(
                            ".remove-new-accommodation-gallery"
                        );

                    if (newRemove) {

                        card._accommodationGalleryFiles.splice(
                            Number(newRemove.dataset.index),
                            1
                        );

                        renderAccommodationGallery();

                    }

                }
            );

        }

        // ======================================================
        // COMPACT / EXPAND ACCOMMODATION
        // ======================================================

        function setAccommodationCardExpanded(
            card,
            expanded
        ) {
            if (!card) return;

            card.classList.toggle(
                "is-expanded",
                expanded
            );

            const toggle =
                card.querySelector(
                    ".toggle-accommodation"
                );

            toggle?.setAttribute(
                "aria-expanded",
                String(expanded)
            );

            const icon =
                toggle?.querySelector("i");

            const label =
                toggle?.querySelector("span");

            if (icon) {
                icon.className =
                    expanded
                        ? "fa-solid fa-chevron-up"
                        : "fa-solid fa-chevron-down";
            }

            if (label) {
                label.textContent =
                    expanded
                        ? "Minimize"
                        : "Edit";
            }
        }

        function updateAccommodationCompactSummary(
            card
        ) {
            if (!card) return;

            const name =
                card.querySelector(
                    ".accommodation-name"
                )?.value?.trim() ||
                "New Accommodation";

            const resort =
                card.querySelector(
                    ".accommodation-resort-name"
                )?.value?.trim() ||
                "Resort not set";

            const units =
                Math.max(
                    0,
                    Number(
                        card.querySelector(
                            ".accommodation-default-units"
                        )?.value
                    ) || 0
                );

            const nameEl =
                card.querySelector(
                    ".compact-accommodation-name"
                );

            const resortEl =
                card.querySelector(
                    ".compact-resort-name"
                );

            const unitsEl =
                card.querySelector(
                    ".compact-units"
                );

            if (nameEl) {
                nameEl.textContent = name;
            }

            if (resortEl) {
                resortEl.textContent = resort;
            }

            if (unitsEl) {
                unitsEl.textContent =
                    `${units} unit${units === 1 ? "" : "s"}`;
            }
        }

        accommodationList?.addEventListener(
            "click",
            event => {
                const toggle =
                    event.target.closest(
                        ".toggle-accommodation, .accommodation-compact-summary"
                    );

                if (!toggle) return;

                const card =
                    toggle.closest(
                        ".accommodation-card"
                    );

                if (!card) return;

                setAccommodationCardExpanded(
                    card,
                    !card.classList.contains(
                        "is-expanded"
                    )
                );
            }
        );

        accommodationList?.addEventListener(
            "input",
            event => {
                const card =
                    event.target.closest(
                        ".accommodation-card"
                    );

                if (card) {
                    updateAccommodationCompactSummary(
                        card
                    );
                }
            }
        );

        accommodationList?.addEventListener(
            "change",
            event => {
                const card =
                    event.target.closest(
                        ".accommodation-card"
                    );

                if (card) {
                    updateAccommodationCompactSummary(
                        card
                    );
                }
            }
        );


        // ======================================================
        // REMOVE ACCOMMODATION
        // ======================================================

        accommodationList?.addEventListener(
            "click",
            event => {


                const button =
                    event.target.closest(
                        ".remove-accommodation"
                    );


                if (
                    !button
                ) {
                    return;
                }


                const card =
                    button.closest(
                        ".accommodation-card"
                    );


                if (
                    !card
                ) {
                    return;
                }


                card.remove();


                const remainingCards =
                    accommodationList
                        .querySelectorAll(
                            ".accommodation-card"
                        );


                remainingCards.forEach(
                    (
                        accommodationCard,
                        index
                    ) => {


                        const title =
                            accommodationCard
                                .querySelector(
                                    ".accommodation-card-heading strong"
                                );


                        if (
                            title
                        ) {

                            title.textContent =
                                `Accommodation ${
                                    index + 1
                                }`;

                        }


                        const removeButton =
                            accommodationCard
                                .querySelector(
                                    ".remove-accommodation"
                                );


                        if (
                            removeButton
                        ) {

                            removeButton.setAttribute(
                                "aria-label",
                                `Remove accommodation ${
                                    index + 1
                                }`
                            );

                        }

                    }
                );


                accommodationCount =
                    remainingCards.length;

                syncAccommodationEmptyState();
                refreshTravelScheduleAccommodationInventories();

            }
        );


        // ======================================================
        // ACCOMMODATION EMPTY STATE
        // ======================================================

        function syncAccommodationEmptyState() {

            if (!accommodationEmptyHelper) {
                return;
            }

            const count =
                accommodationList
                    ?.querySelectorAll(
                        ".accommodation-card"
                    ).length || 0;

            accommodationEmptyHelper.style.display =
                count > 0
                    ? "none"
                    : "flex";

        }


        // ======================================================
        // TRAVEL SCHEDULE HELPERS
        // ======================================================

        function createTravelScheduleId() {

            return `schedule_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 8)}`;

        }


        function formatTravelScheduleTitle(
            startDate,
            endDate
        ) {

            if (!startDate) {
                return "New Schedule";
            }

            const formatDate =
                value => {

                    if (!value) {
                        return "";
                    }

                    const date =
                        new Date(
                            `${value}T00:00:00`
                        );

                    if (
                        Number.isNaN(
                            date.getTime()
                        )
                    ) {
                        return value;
                    }

                    return date.toLocaleDateString(
                        "en-PH",
                        {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                        }
                    );

                };

            const start =
                formatDate(startDate);

            const end =
                formatDate(endDate);

            return end && end !== start
                ? `${start} – ${end}`
                : start;

        }


        function getAccommodationCardsForSchedule() {

            if (!accommodationList) {
                return [];
            }

            return Array.from(
                accommodationList.querySelectorAll(
                    ".accommodation-card"
                )
            );

        }


        function getAccommodationCardSnapshot(
            card
        ) {

            const id =
                card.dataset.accommodationId ||
                createTravelScheduleId()
                    .replace(
                        "schedule_",
                        "acc_"
                    );

            card.dataset.accommodationId =
                id;

            const resortName =
                card.querySelector(
                    ".accommodation-resort-name"
                )?.value?.trim() ||
                "";

            const name =
                card.querySelector(
                    ".accommodation-name"
                )?.value?.trim() ||
                "Unnamed Accommodation";

            const defaultUnits =
                Math.max(
                    0,
                    Number(
                        card.querySelector(
                            ".accommodation-default-units"
                        )?.value
                    ) || 0
                );

            const active =
                (
                    card.querySelector(
                        ".accommodation-status"
                    )?.value ||
                    "active"
                ) === "active";

            return {
                id,
                resortName,
                name,
                defaultUnits,
                active
            };

        }


        function readScheduleInventoryFromCard(
            scheduleCard
        ) {

            const inventory = {};

            scheduleCard
                .querySelectorAll(
                    ".schedule-accommodation-row"
                )
                .forEach(
                    row => {

                        const accommodationId =
                            row.dataset.accommodationId ||
                            "";

                        if (!accommodationId) {
                            return;
                        }

                        inventory[
                            accommodationId
                        ] = {

                            available:
                                row.querySelector(
                                    ".schedule-accommodation-status"
                                )?.value !== "unavailable",

                            remaining:
                                Math.max(
                                    0,
                                    Number(
                                        row.querySelector(
                                            ".schedule-accommodation-units"
                                        )?.value
                                    ) || 0
                                )

                        };

                    }
                );

            return inventory;

        }


        function renderScheduleAccommodationInventory(
            scheduleCard,
            sourceInventory = null
        ) {

            const container =
                scheduleCard.querySelector(
                    "[data-schedule-accommodations]"
                );

            if (!container) {
                return;
            }

            const preserved =
                sourceInventory ||
                readScheduleInventoryFromCard(
                    scheduleCard
                );

            const accommodations =
                getAccommodationCardsForSchedule()
                    .map(
                        getAccommodationCardSnapshot
                    );

            if (
                accommodations.length === 0
            ) {

                container.innerHTML = `
                    <div class="travel-schedule-empty">
                        <i class="fa-solid fa-bed"></i>
                        <div>
                            <strong>No accommodation options yet</strong>
                            <span>
                                Add an accommodation above first.
                            </span>
                        </div>
                    </div>
                `;

                return;
            }

            container.innerHTML =
                accommodations
                    .map(
                        accommodation => {

                            const saved =
                                preserved[
                                    accommodation.id
                                ] ||
                                {};

                            const available =
                                saved.available !== false &&
                                accommodation.active;

                            const remaining =
                                Number.isFinite(
                                    Number(
                                        saved.remaining
                                    )
                                )
                                    ? Math.max(
                                        0,
                                        Number(
                                            saved.remaining
                                        )
                                    )
                                    : accommodation
                                        .defaultUnits;

                            return `
                                <div
                                    class="schedule-accommodation-row"
                                    data-accommodation-id="${escapeHtml(
                                        accommodation.id
                                    )}"
                                >

                                    <div class="schedule-accommodation-name">

                                        <strong>
                                            ${escapeHtml(
                                                accommodation.name
                                            )}
                                        </strong>

                                        <span>
                                            ${escapeHtml(
                                                accommodation.resortName ||
                                                "Resort not set"
                                            )}
                                        </span>

                                    </div>

                                    <select
                                        class="schedule-accommodation-status"
                                        aria-label="Accommodation availability"
                                    >
                                        <option
                                            value="available"
                                            ${available ? "selected" : ""}
                                        >
                                            Available
                                        </option>
                                        <option
                                            value="unavailable"
                                            ${!available ? "selected" : ""}
                                        >
                                            Unavailable
                                        </option>
                                    </select>

                                    <input
                                        type="number"
                                        class="schedule-accommodation-units"
                                        min="0"
                                        step="1"
                                        value="${escapeHtml(
                                            remaining
                                        )}"
                                        aria-label="Available accommodation units"
                                    >

                                </div>
                            `;

                        }
                    )
                    .join("");

        }


        function refreshTravelScheduleAccommodationInventories() {

            if (!travelScheduleList) {
                return;
            }

            travelScheduleList
                .querySelectorAll(
                    ".travel-schedule-card"
                )
                .forEach(
                    scheduleCard => {

                        const existing =
                            readScheduleInventoryFromCard(
                                scheduleCard
                            );

                        renderScheduleAccommodationInventory(
                            scheduleCard,
                            existing
                        );

                    }
                );

        }


        function syncTravelScheduleEmptyState() {

            if (!travelScheduleEmpty) {
                return;
            }

            const count =
                travelScheduleList
                    ?.querySelectorAll(
                        ".travel-schedule-card"
                    ).length || 0;

            travelScheduleEmpty.style.display =
                count > 0
                    ? "none"
                    : "flex";

        }


        function updateTravelScheduleCardTitle(
            card
        ) {

            const startDate =
                card.querySelector(
                    ".travel-schedule-start-date"
                )?.value ||
                "";

            const endDate =
                card.querySelector(
                    ".travel-schedule-end-date"
                )?.value ||
                "";

            const title =
                card.querySelector(
                    ".travel-schedule-title"
                );

            if (title) {

                title.textContent =
                    formatTravelScheduleTitle(
                        startDate,
                        endDate
                    );

            }

        }


        function normalizeScheduleInventory(
            schedule = {}
        ) {

            const inventory = {};

            const source =
                schedule.accommodationAvailability ||
                schedule.accommodationInventory ||
                schedule.accommodations ||
                {};

            if (
                Array.isArray(source)
            ) {

                source.forEach(
                    item => {

                        const id =
                            item?.accommodationId ||
                            item?.id ||
                            "";

                        if (!id) {
                            return;
                        }

                        inventory[id] = {
                            available:
                                item.available !== false &&
                                item.status !== "unavailable",
                            remaining:
                                Math.max(
                                    0,
                                    Number(
                                        item.remaining ??
                                        item.availableUnits ??
                                        item.units ??
                                        0
                                    ) || 0
                                )
                        };

                    }
                );

                return inventory;

            }

            if (
                source &&
                typeof source === "object"
            ) {

                Object.entries(source)
                    .forEach(
                        ([id, value]) => {

                            if (
                                value &&
                                typeof value === "object"
                            ) {

                                inventory[id] = {
                                    available:
                                        value.available !== false &&
                                        value.status !== "unavailable",
                                    remaining:
                                        Math.max(
                                            0,
                                            Number(
                                                value.remaining ??
                                                value.availableUnits ??
                                                value.units ??
                                                0
                                            ) || 0
                                        )
                                };

                            }

                        }
                    );

            }

            return inventory;

        }


        function addTravelScheduleCard(
            schedule = {}
        ) {

            if (
                !travelScheduleList ||
                !travelScheduleTemplate
            ) {
                return;
            }

            const fragment =
                travelScheduleTemplate
                    .content
                    .cloneNode(true);

            const card =
                fragment.querySelector(
                    ".travel-schedule-card"
                );

            if (!card) {
                return;
            }

            const scheduleId =
                schedule.id ||
                schedule.scheduleId ||
                createTravelScheduleId();

            card.dataset.scheduleId =
                scheduleId;

            const startInput =
                card.querySelector(
                    ".travel-schedule-start-date"
                );

            const endInput =
                card.querySelector(
                    ".travel-schedule-end-date"
                );

            const statusSelect =
                card.querySelector(
                    ".travel-schedule-status"
                );

            const totalSlotsInput =
                card.querySelector(
                    ".travel-schedule-total-slots"
                );

            const availableSlotsInput =
                card.querySelector(
                    ".travel-schedule-available-slots"
                );

            const visibilitySelect =
                card.querySelector(
                    ".travel-schedule-visibility"
                );

            const noteInput =
                card.querySelector(
                    ".travel-schedule-note"
                );

            const startDate =
                schedule.startDate ||
                schedule.date ||
                "";

            const endDate =
                schedule.endDate ||
                "";

            if (startInput) {
                startInput.value =
                    String(startDate)
                        .slice(0, 10);
            }

            if (endInput) {
                endInput.value =
                    String(endDate)
                        .slice(0, 10);
            }

            if (statusSelect) {
                statusSelect.value =
                    schedule.status ||
                    (
                        Number(
                            schedule.slotsRemaining ??
                            schedule.availableSlots
                        ) === 0
                            ? "full"
                            : "available"
                    );
            }

            if (totalSlotsInput) {
                totalSlotsInput.value =
                    Math.max(
                        0,
                        Number(
                            schedule.capacity ??
                            schedule.totalSlots ??
                            schedule.slots ??
                            0
                        ) || 0
                    );
            }

            if (availableSlotsInput) {
                availableSlotsInput.value =
                    Math.max(
                        0,
                        Number(
                            schedule.slotsRemaining ??
                            schedule.availableSlots ??
                            schedule.slots ??
                            0
                        ) || 0
                    );
            }

            if (visibilitySelect) {
                visibilitySelect.value =
                    schedule.visibility ||
                    (
                        schedule.hidden === true
                            ? "hidden"
                            : "published"
                    );
            }

            if (noteInput) {
                noteInput.value =
                    schedule.note ||
                    schedule.scheduleNote ||
                    "";
            }

            travelScheduleList.appendChild(
                card
            );

            renderScheduleAccommodationInventory(
                card,
                normalizeScheduleInventory(
                    schedule
                )
            );

            updateTravelScheduleCardTitle(
                card
            );

            syncTravelScheduleEmptyState();

        }


        function populateTravelSchedules(
            schedules = []
        ) {

            if (!travelScheduleList) {
                return;
            }

            travelScheduleList.innerHTML =
                "";

            const normalized =
                Array.isArray(schedules)
                    ? schedules
                    : [];

            normalized.forEach(
                schedule => {

                    addTravelScheduleCard(
                        schedule
                    );

                }
            );

            syncTravelScheduleEmptyState();

        }


        function collectTravelSchedules() {

            if (!travelScheduleList) {
                return [];
            }

            return Array.from(
                travelScheduleList.querySelectorAll(
                    ".travel-schedule-card"
                )
            )
                .map(
                    card => {

                        const id =
                            card.dataset.scheduleId ||
                            createTravelScheduleId();

                        card.dataset.scheduleId =
                            id;

                        const startDate =
                            card.querySelector(
                                ".travel-schedule-start-date"
                            )?.value ||
                            "";

                        const endDate =
                            card.querySelector(
                                ".travel-schedule-end-date"
                            )?.value ||
                            startDate;

                        const status =
                            card.querySelector(
                                ".travel-schedule-status"
                            )?.value ||
                            "available";

                        const totalSlots =
                            Math.max(
                                0,
                                Number(
                                    card.querySelector(
                                        ".travel-schedule-total-slots"
                                    )?.value
                                ) || 0
                            );

                        const availableSlots =
                            Math.max(
                                0,
                                Number(
                                    card.querySelector(
                                        ".travel-schedule-available-slots"
                                    )?.value
                                ) || 0
                            );

                        const visibility =
                            card.querySelector(
                                ".travel-schedule-visibility"
                            )?.value ||
                            "published";

                        const note =
                            card.querySelector(
                                ".travel-schedule-note"
                            )?.value?.trim() ||
                            "";

                        const accommodationAvailability =
                            readScheduleInventoryFromCard(
                                card
                            );

                        return {

                            id,

                            scheduleId:
                                id,

                            startDate,

                            endDate,

                            status:
                                status === "available" &&
                                totalSlots > 0 &&
                                availableSlots === 0
                                    ? "full"
                                    : status,

                            capacity:
                                totalSlots,

                            totalSlots,

                            slots:
                                availableSlots,

                            slotsRemaining:
                                availableSlots,

                            availableSlots,

                            visibility,

                            hidden:
                                visibility === "hidden",

                            note,

                            accommodationAvailability

                        };

                    }
                )
                .filter(
                    schedule =>
                        Boolean(
                            schedule.startDate
                        )
                )
                .sort(
                    (a, b) =>
                        String(a.startDate)
                            .localeCompare(
                                String(b.startDate)
                            )
                );

        }


        function buildAccommodationScheduleAvailability(
            schedules,
            accommodationId
        ) {

            const result = {};

            schedules.forEach(
                schedule => {

                    const item =
                        schedule
                            .accommodationAvailability?.[
                                accommodationId
                            ];

                    if (!item) {
                        return;
                    }

                    result[
                        schedule.id
                    ] = {
                        available:
                            item.available !== false,
                        remaining:
                            Math.max(
                                0,
                                Number(
                                    item.remaining
                                ) || 0
                            )
                    };

                }
            );

            return result;

        }


        // ======================================================
        // TRAVEL SCHEDULE EVENTS
        // ======================================================

        addTravelSchedule?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                addTravelScheduleCard();

            }
        );


        travelScheduleList?.addEventListener(
            "click",
            event => {

                const removeButton =
                    event.target.closest(
                        ".travel-schedule-remove"
                    );

                if (!removeButton) {
                    return;
                }

                const card =
                    removeButton.closest(
                        ".travel-schedule-card"
                    );

                card?.remove();

                syncTravelScheduleEmptyState();

            }
        );


        travelScheduleList?.addEventListener(
            "input",
            event => {

                const card =
                    event.target.closest(
                        ".travel-schedule-card"
                    );

                if (card) {
                    updateTravelScheduleCardTitle(
                        card
                    );
                }

            }
        );


        travelScheduleList?.addEventListener(
            "change",
            event => {

                const card =
                    event.target.closest(
                        ".travel-schedule-card"
                    );

                if (card) {
                    updateTravelScheduleCardTitle(
                        card
                    );
                }

            }
        );


        accommodationList?.addEventListener(
            "input",
            event => {

                if (
                    event.target.matches(
                        ".accommodation-name, .accommodation-resort-name, .accommodation-default-units"
                    )
                ) {

                    refreshTravelScheduleAccommodationInventories();

                }

            }
        );


        accommodationList?.addEventListener(
            "change",
            event => {

                if (
                    event.target.matches(
                        ".accommodation-status"
                    )
                ) {

                    refreshTravelScheduleAccommodationInventories();

                }

            }
        );


        // ======================================================
        // PACKAGE GALLERY
        // ======================================================

        function renderPackageGallery() {

            if (
                !photoPreviewGrid
            ) {
                return;
            }


            photoPreviewGrid.innerHTML =
                "";

                            // ==================================================
            // EXISTING FIREBASE PHOTOS
            // ==================================================

            existingGalleryPhotos.forEach(
                (
                    photo,
                    index
                ) => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "photo-preview-item";


                    item.innerHTML = `

                        <img
                            src="${escapeHtml(
                                photo.url ||
                                ""
                            )}"
                            alt="Package Photo ${
                                index + 1
                            }"
                        >


                        ${
                            index === 0
                                ? `

                                    <span
                                        class="main-photo-badge"
                                    >

                                        MAIN

                                    </span>

                                  `
                                : ""
                        }


                        <button
                            type="button"
                            class="remove-photo existing-photo"
                            data-existing-index="${index}"
                            title="Remove photo"
                            aria-label="Remove package photo ${
                                index + 1
                            }"
                        >

                            <i
                                class="fa-solid fa-trash-can"
                            ></i>

                        </button>

                    `;


                    photoPreviewGrid.appendChild(
                        item
                    );

                }
            );


            // ==================================================
            // NEW LOCAL PHOTOS
            // ==================================================

            packageGalleryFiles.forEach(
                (
                    file,
                    index
                ) => {

                    const reader =
                        new FileReader();


                    reader.onload =
                        event => {


                            const item =
                                document.createElement(
                                    "div"
                                );


                            item.className =
                                "photo-preview-item";


                            const isMainPhoto =
                                existingGalleryPhotos
                                    .length === 0 &&
                                index === 0;


                            item.innerHTML = `

                                <img
                                    src="${event.target.result}"
                                    alt="New Package Photo ${
                                        index + 1
                                    }"
                                >


                                ${
                                    isMainPhoto
                                        ? `

                                            <span
                                                class="main-photo-badge"
                                            >

                                                MAIN

                                            </span>

                                          `
                                        : ""
                                }


                                <button
                                    type="button"
                                    class="remove-photo new-photo"
                                    data-index="${index}"
                                    title="Remove photo"
                                    aria-label="Remove new package photo ${
                                        index + 1
                                    }"
                                >

                                    <i
                                        class="fa-solid fa-trash-can"
                                    ></i>

                                </button>

                            `;


                            photoPreviewGrid.appendChild(
                                item
                            );

                        };


                    reader.readAsDataURL(
                        file
                    );

                }
            );

        }


        // ======================================================
        // OPEN GALLERY FILE SELECTOR
        // ======================================================

        uploadPhotosButton?.addEventListener(
            "click",
            event => {

                event.preventDefault();


                packagePhotos?.click();

            }
        );


        // ======================================================
        // SELECT GALLERY PHOTOS
        // ======================================================

        packagePhotos?.addEventListener(
            "change",
            event => {


                const selectedFiles =
                    Array.from(
                        event.target.files ||
                        []
                    );


                if (
                    selectedFiles.length ===
                    0
                ) {
                    return;
                }


                selectedFiles.forEach(
                    file => {


                        if (
                            !file.type.startsWith(
                                "image/"
                            )
                        ) {
                            return;
                        }


                        const duplicate =
                            packageGalleryFiles.some(
                                existingFile =>
                                    existingFile.name ===
                                        file.name &&
                                    existingFile.size ===
                                        file.size
                            );


                        if (
                            duplicate
                        ) {
                            return;
                        }


                        const totalPhotos =
                            existingGalleryPhotos.length +
                            packageGalleryFiles.length;


                        if (
                            totalPhotos >=
                            10
                        ) {
                            return;
                        }


                        packageGalleryFiles.push(
                            file
                        );

                    }
                );


                renderPackageGallery();


                packagePhotos.value =
                    "";

            }
        );


        // ======================================================
        // REMOVE GALLERY PHOTO
        // ======================================================

        photoPreviewGrid?.addEventListener(
            "click",
            event => {


                const removeButton =
                    event.target.closest(
                        ".remove-photo"
                    );


                if (
                    !removeButton
                ) {
                    return;
                }


                // ----------------------------------------------
                // EXISTING FIREBASE PHOTO
                // ----------------------------------------------

                if (
                    removeButton.classList.contains(
                        "existing-photo"
                    )
                ) {

                    const index =
                        Number(
                            removeButton
                                .dataset
                                .existingIndex
                        );


                    if (
                        Number.isNaN(
                            index
                        )
                    ) {
                        return;
                    }


                    existingGalleryPhotos.splice(
                        index,
                        1
                    );


                    renderPackageGallery();


                    return;

                }


                // ----------------------------------------------
                // NEW LOCAL PHOTO
                // ----------------------------------------------

                const index =
                    Number(
                        removeButton
                            .dataset
                            .index
                    );


                if (
                    Number.isNaN(
                        index
                    )
                ) {
                    return;
                }


                packageGalleryFiles.splice(
                    index,
                    1
                );


                renderPackageGallery();

            }
        );


        // ======================================================
        // EDIT PACKAGE
        // ======================================================

        function editPackage(
            packageId
        ) {

            const packageItem =
                packages.find(
                    item =>
                        item.id ===
                        packageId
                );


            if (
                !packageItem
            ) {

                console.error(
                    "PACKAGE NOT FOUND:",
                    packageId
                );


                return;

            }


            console.log(
                "EDIT PACKAGE:",
                packageItem
            );


            editingPackageId =
                packageId;

            if (packageModalTitle) {
                packageModalTitle.textContent =
                    "Edit Package";
            }


            // ==================================================
            // BASIC INFORMATION
            // ==================================================

            setInputValue(
                "formPackageName",
                packageItem.name
            );


            setInputValue(
                "formCategory",
                packageItem.category
            );


            setInputValue(
                "formLocation",
                packageItem.location
            );


            setInputValue(
                "formPrice",
                packageItem.price
            );


            setInputValue(
                "formDuration",
                packageItem.packageOptionLabel ||
                packageItem.duration
            );


            setInputValue(
                "formDescription",
                packageItem.description
            );


            setInputValue(
                "formAbout",
                packageItem.about
            );


            setInputValue(
                "formStatus",
                packageItem.status ===
                    "draft"
                    ? "active"
                    : (
                        packageItem.status ||
                        "active"
                    )
            );

            updatePackageBuilderStatus(
                packageItem.status ||
                "draft"
            );


            const passengerPricing =
                packageItem.passengerPricing ||
                {};

            const exclusiveTour =
                packageItem.exclusiveTour ||
                {};


            const kidsPricingEnabled =
                document.getElementById(
                    "kidsPricingEnabled"
                );

            const exclusiveTourEnabled =
                document.getElementById(
                    "exclusiveTourEnabled"
                );


            if (kidsPricingEnabled) {

                kidsPricingEnabled.checked =
                    passengerPricing
                        .kidsPricingEnabled === true;

            }


            if (exclusiveTourEnabled) {

                exclusiveTourEnabled.checked =
                    exclusiveTour
                        .enabled === true;

            }


            setInputValue(
                "childFreeMaxAge",
                passengerPricing
                    .childFreeMaxAge ?? 3
            );

            setInputValue(
                "childDiscountMinAge",
                passengerPricing
                    .childDiscountMinAge ?? 4
            );

            setInputValue(
                "childDiscountMaxAge",
                passengerPricing
                    .childDiscountMaxAge ?? 8
            );

            setInputValue(
                "childDiscountAmount",
                passengerPricing
                    .childDiscountAmount ?? 500
            );

            const child3to7Enabled = document.getElementById("child3to7Enabled");
            if (child3to7Enabled) child3to7Enabled.checked = passengerPricing.child3to7Enabled === true;
            setInputValue("child3to7Rate", passengerPricing.child3to7RatePercent ?? 50);

            const child8to11Enabled = document.getElementById("child8to11Enabled");
            if (child8to11Enabled) child8to11Enabled.checked = passengerPricing.child8to11Enabled === true;
            setInputValue("child8to11Rate", passengerPricing.child8to11RatePercent ?? 75);
            setInputValue("infantPricingType", passengerPricing.infantPricingType ?? "free");

            const pricingOptions = packageItem.pricingOptions || {};
            setInputValue("singleSupplement", pricingOptions.singleSupplement ?? 0);
            setInputValue("defaultRoomUpgrade", pricingOptions.defaultRoomUpgrade ?? 0);
            setInputValue("packagePromoDiscount", pricingOptions.promoDiscount ?? 0);

            const downpaymentRules =
                packageItem.downpaymentRules ||
                {};

            const joinerDownpayment =
                downpaymentRules.joiner ||
                {};

            const exclusiveDownpayment =
                downpaymentRules.exclusive ||
                {};

            setInputValue(
                "joinerDownpaymentType",
                joinerDownpayment.type ||
                "per_paying_pax"
            );

            setInputValue(
                "joinerDownpaymentAmount",
                joinerDownpayment.amount ?? 500
            );

            setInputValue(
                "exclusiveDownpaymentType",
                exclusiveDownpayment.type ||
                "per_paying_pax"
            );

            setInputValue(
                "exclusiveDownpaymentAmount",
                exclusiveDownpayment.amount ?? 500
            );

            setInputValue(
                "exclusiveMinimumPayingPax",
                exclusiveTour
                    .minimumPayingPax ?? 10
            );

            const savedExclusiveVanType =
                exclusiveTour.vanType ||
                (Number(exclusiveTour.vanCapacity) >= 18
                    ? "xl"
                    : Number(exclusiveTour.vanCapacity) <= 12
                        ? "low"
                        : "high");

            setInputValue(
                "exclusiveVanType",
                savedExclusiveVanType
            );

            setInputValue(
                "exclusiveIncludedVanUnits",
                exclusiveTour
                    .includedVanUnits ?? 1
            );

            setInputValue(
                "exclusiveAdditionalVanRate",
                exclusiveTour
                    .additionalVanRate ?? 0
            );


            updatePackageRuleVisibility();


            const scheduleSettings =
                packageItem.scheduleSettings ||
                {};

            const regularScheduleEnabled =
                document.getElementById(
                    "regularScheduleEnabled"
                );

            const day0Enabled =
                document.getElementById(
                    "day0Enabled"
                );

            if (regularScheduleEnabled) {
                regularScheduleEnabled.checked =
                    scheduleSettings.enabled === true;
            }

            if (day0Enabled) {
                day0Enabled.checked =
                    scheduleSettings.day0Enabled !== false;
            }

            setInputValue(
                "regularStartDay",
                scheduleSettings.startDay ?? 5
            );

            setInputValue(
                "regularDurationDays",
                scheduleSettings.durationDays ?? 3
            );

            setInputValue(
                "day0Offset",
                scheduleSettings.day0Offset ?? -1
            );

            setInputValue(
                "pickupStartTime",
                scheduleSettings.pickupStartTime || ""
            );

            setInputValue(
                "pickupEndTime",
                scheduleSettings.pickupEndTime || ""
            );

            setInputValue(
                "departureNote",
                scheduleSettings.departureNote || ""
            );

            const requestedTravelDateEnabled =
                document.getElementById(
                    "requestedTravelDateEnabled"
                );

            if (requestedTravelDateEnabled) {
                requestedTravelDateEnabled.checked =
                    scheduleSettings.requestedTravelDateEnabled === true;
            }

            setInputValue(
                "requestedTravelDateMinPax",
                Math.max(
                    1,
                    Number(
                        scheduleSettings.requestedTravelDateMinPax
                    ) || 10
                )
            );

            updateScheduleSettingsVisibility();


            populateItineraryBuilder(
                packageItem.itinerary
            );


            // ==================================================
            // GALLERY
            // ==================================================

            packageGalleryFiles =
                [];


            existingGalleryPhotos =
                Array.isArray(
                    packageItem.gallery
                )
                    ? [
                        ...packageItem.gallery
                      ]
                    : [];


            if (
                packagePhotos
            ) {

                packagePhotos.value =
                    "";

            }


            // ==================================================
            // INCLUSIONS
            // ==================================================

            if (
                inclusionsList
            ) {

                inclusionsList.innerHTML =
                    "";


                const inclusions =
                    Array.isArray(
                        packageItem.inclusions
                    )
                        ? packageItem.inclusions
                        : [];


                if (
                    inclusions.length >
                    0
                ) {

                    inclusions.forEach(
                        value => {

                            addInclusionRow(
                                value
                            );

                        }
                    );

                } else {

                    addInclusionRow();

                }

            }


            // ==================================================
            // EXCLUSIONS
            // ==================================================

            if (
                exclusionsList
            ) {

                exclusionsList.innerHTML =
                    "";


                exclusionCount =
                    0;


                const exclusions =
                    Array.isArray(
                        packageItem.exclusions
                    )
                        ? packageItem.exclusions
                        : [];


                if (
                    exclusions.length >
                    0
                ) {

                    exclusions.forEach(
                        value => {

                            addExclusionItem(
                                value
                            );

                        }
                    );

                } else {

                    addExclusionItem();

                }

            }


            // ==================================================
            // ACCOMMODATIONS
            // ==================================================

            if (
                accommodationList
            ) {

                accommodationList.innerHTML =
                    "";


                accommodationCount =
                    0;


                const accommodations =
                    Array.isArray(
                        packageItem.accommodations
                    )
                        ? packageItem.accommodations
                        : [];


                accommodations.forEach(
                    accommodation => {

                        addAccommodationCard(
                            accommodation
                        );

                    }
                );

            }

            syncAccommodationEmptyState();

            populateTravelSchedules(
                packageItem.schedules ||
                packageItem.travelSchedules ||
                []
            );


            renderPackageGallery();

            // Load Cost & Pricing for this existing package.
            // New-format packages restore their exact dynamic items.
            // Legacy packages are migrated into sensible editable cost items.
            loadPackageCostingForEditor(packageItem);

            const existingDestinationGroup =
                findExistingDestinationByName(
                    packageItem.name
                );

            if (existingDestinationGroup) {
                renderExistingDestinationOptions(
                    existingDestinationGroup
                );
            }


            openPackageModal();

            updateBuilderLivePreview();

            window.setTimeout(
                () => {
                    setActiveBuilderSection(
                        packageItem.status ===
                            "draft"
                            ? (
                                packageItem
                                    .draftLastSection ||
                                "packageSectionBasic"
                            )
                            : "packageSectionBasic",
                        {
                            scroll: true,
                            behavior: "auto"
                        }
                    );
                },
                60
            );

        }


        // ======================================================
        // CLOSE ALL PACKAGE MENUS
        // ======================================================

        function closeAllPackageMenus(
            exceptMenu = null
        ) {

            document
                .querySelectorAll(
                    ".package-more-menu.open"
                )
                .forEach(
                    menu => {


                        if (
                            menu ===
                            exceptMenu
                        ) {
                            return;
                        }


                        menu.classList.remove(
                            "open"
                        );


                        const toggle =
                            menu
                                .closest(
                                    ".package-more-wrap"
                                )
                                ?.querySelector(
                                    ".package-more-btn"
                                );


                        toggle?.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

        }


        // ======================================================
        // PACKAGE CARD ACTIONS
        // ======================================================

        packageGrid?.addEventListener(
            "click",
            async event => {


                // ----------------------------------------------
                // ADD PACKAGE OPTION
                // ----------------------------------------------

                const addOptionButton =
                    event.target.closest(
                        ".add-package-option-btn"
                    );

                if (addOptionButton) {

                    closeAllPackageMenus();

                    openNewPackageOption(
                        addOptionButton.dataset.id
                    );

                    return;
                }


                // ----------------------------------------------
                // EDIT BUTTON
                // ----------------------------------------------

                const editButton =
                    event.target.closest(
                        ".edit-package-btn, .package-menu-edit"
                    );


                if (
                    editButton
                ) {

                    closeAllPackageMenus();


                    editPackage(
                        editButton.dataset.id
                    );


                    return;

                }


                // ----------------------------------------------
                // MORE BUTTON
                // ----------------------------------------------

                const moreButton =
                    event.target.closest(
                        ".package-more-btn"
                    );


                if (
                    moreButton
                ) {

                    const menu =
                        moreButton
                            .closest(
                                ".package-more-wrap"
                            )
                            ?.querySelector(
                                ".package-more-menu"
                            );


                    if (
                        !menu
                    ) {
                        return;
                    }


                    const willOpen =
                        !menu.classList.contains(
                            "open"
                        );


                    closeAllPackageMenus(
                        menu
                    );


                    menu.classList.toggle(
                        "open",
                        willOpen
                    );


                    moreButton.setAttribute(
                        "aria-expanded",
                        String(
                            willOpen
                        )
                    );


                    return;

                }


                // ----------------------------------------------
                // SHOW / HIDE PACKAGE
                // ----------------------------------------------

                const statusButton =
                    event.target.closest(
                        ".package-menu-status"
                    );


                if (
                    statusButton
                ) {

                    const packageId =
                        statusButton
                            .dataset
                            .id;


                    const currentStatus =
                        statusButton
                            .dataset
                            .status ||
                        "active";

                    if (
                        currentStatus ===
                        "draft"
                    ) {

                        closeAllPackageMenus();

                        editPackage(
                            packageId
                        );

                        return;
                    }


                    const nextStatus =
                        currentStatus ===
                        "active"
                            ? "hidden"
                            : "active";


                    closeAllPackageMenus();


                    try {

                        await updateDoc(
                            doc(
                                db,
                                "packages",
                                packageId
                            ),
                            {

                                status:
                                    nextStatus,

                                updatedAt:
                                    new Date()
                                        .toISOString()

                            }
                        );


                        await loadPackages();


                    } catch (error) {

                        console.error(
                            "PACKAGE STATUS UPDATE ERROR:",
                            error
                        );


                        alert(
                            "Unable to update package status. Please try again."
                        );

                    }


                    return;

                }


                // ----------------------------------------------
                // OPEN DESTINATION PACKAGE OPTIONS
                // ----------------------------------------------

                const destinationCard =
                    event.target.closest(
                        ".package-destination-card"
                    );

                if (destinationCard) {

                    openDestinationPackageOptions(
                        destinationCard.dataset.packageId
                    );

                    return;
                }


                closeAllPackageMenus();

            }
        );


        // ======================================================
        // CLOSE MORE MENU WHEN CLICKING OUTSIDE
        // ======================================================

        document.addEventListener(
            "click",
            event => {

                if (
                    !event.target.closest(
                        ".package-more-wrap"
                    )
                ) {

                    closeAllPackageMenus();

                }

            }
        );


        // ======================================================
        // ADD PACKAGE BUTTON
        // ======================================================

        addButton?.addEventListener(
            "click",
            event => {

                event.preventDefault();


                openNewPackageModal();

            }
        );


        // ======================================================
        // ADD INCLUSION BUTTON
        // ======================================================

        addInclusion?.addEventListener(
            "click",
            event => {

                event.preventDefault();


                addInclusionRow();

            }
        );


        // ======================================================
        // ADD EXCLUSION BUTTON
        // ======================================================

        addExclusion?.addEventListener(
            "click",
            event => {

                event.preventDefault();


                addExclusionItem();

            }
        );


        // ======================================================
        // ADD ACCOMMODATION BUTTON
        // ======================================================

        addAccommodation?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                addAccommodationCard();

            }
        );

        addAccommodationTop?.addEventListener(
            "click",
            event => {

                event.preventDefault();

                addAccommodationCard();

            }
        );


        // ======================================================
        // CLOSE MODAL BUTTONS
        // ======================================================

        closePackageModal?.addEventListener(
            "click",
            closeModal
        );


        cancelPackage?.addEventListener(
            "click",
            () => {
                const currentIndex = getBuilderSectionIndex(activeBuilderSectionId);
                if (currentIndex > 0) {
                    const previous = PACKAGE_BUILDER_SECTIONS[currentIndex - 1];
                    if (previous) {
                        setActiveBuilderSection(previous.id, { scroll: true });
                        return;
                    }
                }
                closeModal();
            }
        );


        packageModalOverlay?.addEventListener(
            "click",
            closeModal
        );


        // ======================================================
        // ESC KEY
        // ======================================================

        document.addEventListener(
            "keydown",
            event => {


                if (
                    event.key ===
                        "Escape" &&
                    packageModal
                        ?.classList
                        .contains(
                            "show"
                        )
                ) {

                    closeModal();


                    return;

                }


                if (
                    event.key ===
                    "Escape"
                ) {

                    closeAllPackageMenus();

                }

            }
        );


        // ======================================================
        // SEARCH
        // ======================================================

        searchInput?.addEventListener(
            "input",
            renderPackages
        );


        // ======================================================
        // CATEGORY FILTER
        // ======================================================

        categoryFilter?.addEventListener(
            "change",
            renderPackages
        );


        // ======================================================
        // STATUS FILTER
        // ======================================================

        statusFilter?.addEventListener(
            "change",
            renderPackages
        );


        // ======================================================
        // SORT
        // ======================================================

        sortSelect?.addEventListener(
            "change",
            renderPackages
        );

                // ======================================================
        // COLLECT INCLUSIONS
        // ======================================================

        function collectInclusions() {

            if (!inclusionsList) {
                return [];
            }


            return Array.from(
                inclusionsList.querySelectorAll(
                    ".dynamic-row input"
                )
            )
                .map(
                    input =>
                        input.value.trim()
                )
                .filter(Boolean);

        }


        // ======================================================
        // COLLECT EXCLUSIONS
        // ======================================================

        function collectExclusions() {

            if (!exclusionsList) {
                return [];
            }


            return Array.from(
                exclusionsList.querySelectorAll(
                    ".exclusion-input"
                )
            )
                .map(
                    input =>
                        input.value.trim()
                )
                .filter(Boolean);

        }

        // ======================================================
// COLLECT PICK UP LOCATIONS
// ======================================================

// ======================================================
// ITINERARY BUILDER
// Supports:
// 1) Schedule entries: time + activity
// 2) Section entries: title + bullet/activity list
// Old itinerary rows remain compatible.
// ======================================================

function getItineraryList(day) {
    const map = {
        day0: "itineraryDay0List",
        day1: "itineraryDay1List",
        day2: "itineraryDay2List",
        day3: "itineraryDay3List"
    };

    return document.getElementById(map[day]);
}

function addItineraryRow(day, item = {}) {
    const list = getItineraryList(day);
    if (!list) return;

    const row = document.createElement("div");
    row.className = "itinerary-schedule-row";
    row.dataset.entryType = "schedule";

    row.innerHTML = `
        <div class="itinerary-field">
            <label>Time</label>
            <input
                type="text"
                class="itinerary-time"
                placeholder="e.g. 05:00 AM"
                value="${escapeHtml(item.time || "")}"
            >
        </div>

        <div class="itinerary-field activity">
            <label>Activity / Schedule</label>
            <input
                type="text"
                class="itinerary-activity"
                placeholder="e.g. Wake-up call"
                value="${escapeHtml(item.activity || "")}"
            >
        </div>

        <button
            type="button"
            class="itinerary-remove-row"
            title="Remove schedule"
            aria-label="Remove schedule"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    row.querySelector(".itinerary-remove-row")?.addEventListener(
        "click",
        () => row.remove()
    );

    list.appendChild(row);
}

function addItinerarySectionItem(section, value = "") {
    const itemsList = section.querySelector(".itinerary-section-items");
    if (!itemsList) return;

    const itemRow = document.createElement("div");
    itemRow.className = "itinerary-section-item-row";

    itemRow.innerHTML = `
        <span class="itinerary-section-bullet">
            <i class="fa-solid fa-circle"></i>
        </span>

        <input
            type="text"
            class="itinerary-section-item"
            placeholder="e.g. Puno ng Walang Forever"
            value="${escapeHtml(value)}"
        >

        <button
            type="button"
            class="itinerary-remove-item"
            title="Remove item"
            aria-label="Remove activity"
        >
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;

    itemRow.querySelector(".itinerary-remove-item")?.addEventListener(
        "click",
        () => itemRow.remove()
    );

    itemsList.appendChild(itemRow);
}

function addItinerarySection(day, item = {}) {
    const list = getItineraryList(day);
    if (!list) return;

    const section = document.createElement("div");
    section.className = "itinerary-activity-section";
    section.dataset.entryType = "section";

    section.innerHTML = `
        <div class="itinerary-section-header">
            <div class="itinerary-section-title-field">
                <label>Section Title</label>
                <input
                    type="text"
                    class="itinerary-section-title"
                    placeholder="e.g. PLACES TO VISIT"
                    value="${escapeHtml(item.title || "")}"
                >
            </div>

            <button
                type="button"
                class="itinerary-remove-section"
                title="Remove section"
                aria-label="Remove section"
            >
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>

        <div class="itinerary-section-items"></div>

        <button type="button" class="itinerary-add-section-item">
            <i class="fa-solid fa-plus"></i>
            Add Activity / Item
        </button>
    `;

    section.querySelector(".itinerary-remove-section")?.addEventListener(
        "click",
        () => section.remove()
    );

    section.querySelector(".itinerary-add-section-item")?.addEventListener(
        "click",
        () => addItinerarySectionItem(section)
    );

    const items = Array.isArray(item.items)
        ? item.items
        : [];

    if (items.length) {
        items.forEach(value => addItinerarySectionItem(section, value));
    } else {
        addItinerarySectionItem(section);
    }

    list.appendChild(section);
}

function normalizeItineraryEntry(item) {
    if (!item) return null;

    // New section format.
    if (
        item.type === "section" ||
        (
            item.title &&
            Array.isArray(item.items) &&
            !item.time &&
            !item.activity
        )
    ) {
        return {
            type: "section",
            title: item.title || "",
            items: Array.isArray(item.items)
                ? item.items.filter(Boolean)
                : []
        };
    }

    // Existing/old schedule format.
    if (
        typeof item === "object" &&
        !Array.isArray(item)
    ) {
        return {
            type: "schedule",
            time: item.time || "",
            activity: item.activity || ""
        };
    }

    // Very old plain-string entry.
    if (typeof item === "string") {
        return {
            type: "schedule",
            time: "",
            activity: item
        };
    }

    return null;
}

function normalizeItinerary(value) {
    const empty = {
        day0: [],
        day1: [],
        day2: [],
        day3: [],
        notes: ""
    };

    if (!value) {
        return empty;
    }

    // Current object format.
    if (
        typeof value === "object" &&
        !Array.isArray(value)
    ) {
        const result = {
            ...empty,
            notes: value.notes || ""
        };

        ["day0", "day1", "day2", "day3"].forEach(day => {
            const source = Array.isArray(value[day])
                ? value[day]
                : [];

            result[day] = source
                .map(normalizeItineraryEntry)
                .filter(Boolean);
        });

        return result;
    }

    // Backward compatibility for the original textarea itinerary.
    const result = { ...empty };
    let currentDay = "day1";

    String(value)
        .split(/\r?\n/)
        .forEach(rawLine => {
            const line = rawLine.trim();
            if (!line) return;

            const heading = line.match(/^DAY\s*([0-3])\b/i);

            if (heading) {
                currentDay = `day${heading[1]}`;
                return;
            }

            const parts = line.split(/\s+[—–-]\s+/);

            if (parts.length >= 2) {
                result[currentDay].push({
                    type: "schedule",
                    time: parts.shift().trim(),
                    activity: parts.join(" - ").trim()
                });
            } else {
                result[currentDay].push({
                    type: "schedule",
                    time: "",
                    activity: line
                });
            }
        });

    return result;
}

function populateItineraryBuilder(value) {
    const itinerary = normalizeItinerary(value);

    ["day0", "day1", "day2", "day3"].forEach(day => {
        const list = getItineraryList(day);
        if (!list) return;

        list.innerHTML = "";

        itinerary[day].forEach(item => {
            if (item.type === "section") {
                addItinerarySection(day, item);
            } else {
                addItineraryRow(day, item);
            }
        });

        // Keep one blank schedule row only for a completely empty day.
        if (!itinerary[day].length) {
            addItineraryRow(day);
        }
    });

    setInputValue(
        "itineraryNotes",
        itinerary.notes
    );
}

function resetItineraryBuilder() {
    populateItineraryBuilder({
        day0: [],
        day1: [],
        day2: [],
        day3: [],
        notes: ""
    });

    document
        .querySelectorAll(".itinerary-tab")
        .forEach(
            (tab, index) =>
                tab.classList.toggle(
                    "active",
                    index === 0
                )
        );

    document
        .querySelectorAll(".itinerary-panel")
        .forEach(
            panel =>
                panel.classList.toggle(
                    "active",
                    panel.dataset.itineraryPanel === "day0"
                )
        );
}

function collectItineraryDay(day) {
    const list = getItineraryList(day);
    if (!list) return [];

    return Array.from(list.children)
        .map(entry => {
            if (
                entry.dataset.entryType === "section" ||
                entry.classList.contains("itinerary-activity-section")
            ) {
                const title =
                    entry
                        .querySelector(".itinerary-section-title")
                        ?.value
                        .trim() || "";

                const items =
                    Array.from(
                        entry.querySelectorAll(
                            ".itinerary-section-item"
                        )
                    )
                        .map(input => input.value.trim())
                        .filter(Boolean);

                if (!title && !items.length) {
                    return null;
                }

                return {
                    type: "section",
                    title,
                    items
                };
            }

            const time =
                entry
                    .querySelector(".itinerary-time")
                    ?.value
                    .trim() || "";

            const activity =
                entry
                    .querySelector(".itinerary-activity")
                    ?.value
                    .trim() || "";

            if (!time && !activity) {
                return null;
            }

            return {
                type: "schedule",
                time,
                activity
            };
        })
        .filter(Boolean);
}

function collectItinerary() {
    return {
        day0: collectItineraryDay("day0"),
        day1: collectItineraryDay("day1"),
        day2: collectItineraryDay("day2"),
        day3: collectItineraryDay("day3"),
        notes: getInputValue("itineraryNotes")
    };
}

document
    .querySelectorAll(".itinerary-tab")
    .forEach(tab => {
        tab.addEventListener(
            "click",
            () => {
                const target =
                    tab.dataset.itineraryTab;

                document
                    .querySelectorAll(".itinerary-tab")
                    .forEach(
                        item =>
                            item.classList.toggle(
                                "active",
                                item === tab
                            )
                    );

                document
                    .querySelectorAll(".itinerary-panel")
                    .forEach(
                        panel =>
                            panel.classList.toggle(
                                "active",
                                panel.dataset.itineraryPanel === target
                            )
                    );
            }
        );
    });

document
    .querySelectorAll(".itinerary-add-row")
    .forEach(button => {
        button.addEventListener(
            "click",
            () => addItineraryRow(
                button.dataset.day
            )
        );
    });

document
    .querySelectorAll(".itinerary-add-section")
    .forEach(button => {
        button.addEventListener(
            "click",
            () => addItinerarySection(
                button.dataset.day
            )
        );
    });

function collectPickupLocations() {

    if (!pickupLocationList) {
        return [];
    }

    return Array.from(
        pickupLocationList.querySelectorAll(
            ".pickup-location-input"
        )
    )
        .map(
            input => input.value.trim()
        )
        .filter(Boolean);

}



        // ======================================================
        // REQUIRED RESORT / ACCOMMODATION VALIDATION
        // ======================================================

        function clearAccommodationValidation() {
            accommodationList
                ?.querySelectorAll(".accommodation-field-error")
                .forEach(item => item.remove());

            accommodationList
                ?.querySelectorAll(".accommodation-invalid")
                .forEach(item =>
                    item.classList.remove("accommodation-invalid")
                );
        }

        function showAccommodationFieldError(
            element,
            message
        ) {
            if (!element) return;

            element.classList.add(
                "accommodation-invalid"
            );

            const field =
                element.closest(
                    ".accommodation-field"
                );

            if (
                field &&
                !field.querySelector(
                    ".accommodation-field-error"
                )
            ) {
                const error =
                    document.createElement("small");

                error.className =
                    "accommodation-field-error";

                error.textContent = message;

                field.appendChild(error);
            }
        }

        function validateAccommodationCards() {
            clearAccommodationValidation();

            const cards =
                accommodationList
                    ? Array.from(
                        accommodationList.querySelectorAll(
                            ".accommodation-card"
                        )
                    )
                    : [];

            if (cards.length === 0) {
                alert(
                    "Please add at least one resort accommodation before saving."
                );

                document
                    .getElementById(
                        "packageSectionAccommodation"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                return false;
            }

            let firstInvalid = null;

            const invalidate = (
                element,
                message
            ) => {
                showAccommodationFieldError(
                    element,
                    message
                );

                if (!firstInvalid) {
                    firstInvalid = element;
                }
            };

            cards.forEach(card => {
                const resort =
                    card.querySelector(
                        ".accommodation-resort-name"
                    );

                const name =
                    card.querySelector(
                        ".accommodation-name"
                    );

                const maxGuests =
                    card.querySelector(
                        ".accommodation-max-guests"
                    );

                const defaultUnits =
                    card.querySelector(
                        ".accommodation-default-units"
                    );

                const type =
                    card.querySelector(
                        ".accommodation-type"
                    );

                const price =
                    card.querySelector(
                        ".accommodation-price"
                    );

                const status =
                    card.querySelector(
                        ".accommodation-status"
                    );

                if (!resort?.value?.trim()) {
                    invalidate(
                        resort,
                        "Resort name is required."
                    );
                }

                if (!name?.value?.trim()) {
                    invalidate(
                        name,
                        "Accommodation name is required."
                    );
                }

                if (
                    maxGuests?.value === "" ||
                    Number(maxGuests.value) < 1
                ) {
                    invalidate(
                        maxGuests,
                        "Maximum guests must be at least 1."
                    );
                }

                if (
                    defaultUnits?.value === "" ||
                    Number(defaultUnits.value) < 0
                ) {
                    invalidate(
                        defaultUnits,
                        "Default available units is required."
                    );
                }

                if (!type?.value) {
                    invalidate(
                        type,
                        "Option type is required."
                    );
                }

                if (
                    type?.value === "additional" &&
                    (
                        price?.value === "" ||
                        Number(price.value) < 0
                    )
                ) {
                    invalidate(
                        price,
                        "Price per night is required for an upgrade."
                    );
                }

                if (!status?.value) {
                    invalidate(
                        status,
                        "Status is required."
                    );
                }
            });

            if (firstInvalid) {
                const invalidCard =
                    firstInvalid.closest(
                        ".accommodation-card"
                    );

                setAccommodationCardExpanded(
                    invalidCard,
                    true
                );

                invalidCard?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                window.setTimeout(
                    () => firstInvalid.focus(),
                    300
                );

                return false;
            }

            return true;
        }


        // ======================================================
        // SAVE PACKAGE
        // ======================================================

        packageForm?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                console.log(
                    "SAVE PACKAGE CLICKED"
                );


                const saveButton =
                    packageForm.querySelector(
                        'button[type="submit"]'
                    );


                if (
                    saveButton?.disabled
                ) {
                    return;
                }


                // ==============================================
                // BASIC INFORMATION
                // ==============================================

                const rawDestinationName =
                    getInputValue(
                        "formPackageName"
                    );

                const destinationName =
                    getBaseDestinationName(
                        rawDestinationName ||
                        (
                            saveAsDraftMode
                                ? "Untitled Package"
                                : ""
                        )
                    );

                const packageOptionLabel =
                    getInputValue(
                        "formDuration"
                    );

                const packageData = {

                    name:
                        destinationName,

                    destinationName,

                    packageOptionLabel,

                    destinationGroupKey:
                        [
                            destinationName
                                .trim()
                                .toLowerCase(),
                            getInputValue(
                                "formLocation"
                            )
                                .trim()
                                .toLowerCase()
                        ].join("::"),

                    category:
                        document.getElementById(
                            "formCategory"
                        )?.value ||
                        "",

                    location:
                        getInputValue(
                            "formLocation"
                        ),

                    price:
                        getInputValue("costFinalSellingRate"),

                    duration:
                        getInputValue(
                            "formDuration"
                        ),

                    description:
                        getInputValue(
                            "formDescription"
                        ),

                    about:
                        getInputValue(
                            "formAbout"
                        ),

                    status:
                        saveAsDraftMode
                            ? "draft"
                            : (
                                document.getElementById(
                                    "formStatus"
                                )?.value ||
                                "active"
                            ),

                    draftLastSection:
                        activeBuilderSectionId ||
                        "packageSectionBasic",

                    costing: getDynamicCostingPayload(),

                    passengerPricing: {

                        kidsPricingEnabled:
                            document.getElementById(
                                "kidsPricingEnabled"
                            )?.checked === true,

                        childFreeMaxAge:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "childFreeMaxAge",
                                    3
                                )
                            ),

                        childDiscountMinAge:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "childDiscountMinAge",
                                    4
                                )
                            ),

                        childDiscountMaxAge:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "childDiscountMaxAge",
                                    8
                                )
                            ),

                        childDiscountAmount:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "childDiscountAmount",
                                    0
                                )
                            ),

                        child3to7Enabled: document.getElementById("child3to7Enabled")?.checked === true,
                        child3to7RatePercent: Math.max(0, getNumberInputValue("child3to7Rate", 50)),
                        child8to11Enabled: document.getElementById("child8to11Enabled")?.checked === true,
                        child8to11RatePercent: Math.max(0, getNumberInputValue("child8to11Rate", 75)),
                        infantPricingType: document.getElementById("infantPricingType")?.value || "free"

                    },

                    pricingOptions: {
                        singleSupplement: Math.max(0, getNumberInputValue("singleSupplement", 0)),
                        defaultRoomUpgrade: Math.max(0, getNumberInputValue("defaultRoomUpgrade", 0)),
                        promoDiscount: Math.max(0, getNumberInputValue("packagePromoDiscount", 0))
                    },

                    downpaymentRules: {
                        joiner: {
                            type:
                                document.getElementById(
                                    "joinerDownpaymentType"
                                )?.value === "fixed"
                                    ? "fixed"
                                    : "per_paying_pax",

                            amount:
                                Math.max(
                                    0,
                                    getNumberInputValue(
                                        "joinerDownpaymentAmount",
                                        500
                                    )
                                )
                        },

                        exclusive: {
                            type:
                                document.getElementById(
                                    "exclusiveDownpaymentType"
                                )?.value === "fixed"
                                    ? "fixed"
                                    : "per_paying_pax",

                            amount:
                                Math.max(
                                    0,
                                    getNumberInputValue(
                                        "exclusiveDownpaymentAmount",
                                        500
                                    )
                                )
                        }
                    },

                    exclusiveTour: {

                        enabled:
                            document.getElementById(
                                "exclusiveTourEnabled"
                            )?.checked === true,

                        minimumPayingPax:
                            Math.max(
                                1,
                                getNumberInputValue(
                                    "exclusiveMinimumPayingPax",
                                    10
                                )
                            ),

                        vanType:
                            document.getElementById(
                                "exclusiveVanType"
                            )?.value || "high",

                        // Keep capacity as a compatibility snapshot for older booking/admin code.
                        vanCapacity:
                            ({ low: 12, high: 15, xl: 18 })[
                                document.getElementById(
                                    "exclusiveVanType"
                                )?.value || "high"
                            ] || 15,

                        includedVanUnits:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "exclusiveIncludedVanUnits",
                                    1
                                )
                            ),

                        additionalVanRate:
                            Math.max(
                                0,
                                getNumberInputValue(
                                    "exclusiveAdditionalVanRate",
                                    0
                                )
                            )

                    },

                    scheduleSettings: {

                        enabled:
                            document.getElementById(
                                "regularScheduleEnabled"
                            )?.checked === true,

                        startDay:
                            Math.min(
                                6,
                                Math.max(
                                    0,
                                    getNumberInputValue(
                                        "regularStartDay",
                                        5
                                    )
                                )
                            ),

                        durationDays:
                            Math.max(
                                1,
                                getNumberInputValue(
                                    "regularDurationDays",
                                    3
                                )
                            ),

                        day0Enabled:
                            document.getElementById(
                                "day0Enabled"
                            )?.checked === true,

                        day0Offset:
                            Math.min(
                                0,
                                getNumberInputValue(
                                    "day0Offset",
                                    -1
                                )
                            ),

                        pickupStartTime:
                            getInputValue(
                                "pickupStartTime"
                            ),

                        pickupEndTime:
                            getInputValue(
                                "pickupEndTime"
                            ),

                        departureNote:
                            getInputValue(
                                "departureNote"
                            ),

                        requestedTravelDateEnabled:
                            document.getElementById(
                                "requestedTravelDateEnabled"
                            )?.checked === true,

                        requestedTravelDateMinPax:
                            Math.max(
                                1,
                                getNumberInputValue(
                                    "requestedTravelDateMinPax",
                                    10
                                )
                            )

                    },

                    inclusions:
                        collectInclusions(),

                    exclusions:
                        collectExclusions(),

                    pickupLocations:
                        collectPickupLocations(),

                    accommodations:
                        [],

                    schedules:
                        collectTravelSchedules(),

                    itinerary:
                        collectItinerary()

                };



                /*
                 * If the typed destination already exists, always reuse
                 * the canonical destination name/category/location.
                 * This prevents a typo in location or capitalization from
                 * creating another destination card/page.
                 */
                const matchingExistingDestination =
                    findExistingDestinationByName(
                        packageData.name
                    );

                if (matchingExistingDestination) {

                    packageData.name =
                        matchingExistingDestination.name;

                    packageData.destinationName =
                        matchingExistingDestination.name;

                    packageData.category =
                        matchingExistingDestination.category;

                    packageData.location =
                        matchingExistingDestination.location;

                    packageData.destinationGroupKey =
                        matchingExistingDestination.key;
                }


                // ==============================================
                // VALIDATION
                // ==============================================


                if (!saveAsDraftMode) {
                    if (
                        !packageData.name
                    ) {

                        alert(
                            "Please enter a package name."
                        );

                        document
                            .getElementById(
                                "formPackageName"
                            )
                            ?.focus();

                        return;

                    }


                    if (
                        !packageData.category
                    ) {

                        alert(
                            "Please select a package category."
                        );

                        document
                            .getElementById(
                                "formCategory"
                            )
                            ?.focus();

                        return;

                    }


                    if (
                        !packageData.location
                    ) {

                        alert(
                            "Please enter the destination or location."
                        );

                        document
                            .getElementById(
                                "formLocation"
                            )
                            ?.focus();

                        return;

                    }



                    if (
                        !packageData.duration
                    ) {

                        alert(
                            "Please enter the package option / duration."
                        );

                        document
                            .getElementById(
                                "formDuration"
                            )
                            ?.focus();

                        return;
                    }


                    const duplicateOption =
                        packages.find(
                            item =>
                                item.id !==
                                    editingPackageId &&
                                getDestinationGroupKey(
                                    item
                                ) ===
                                packageData
                                    .destinationGroupKey &&
                                String(
                                    item.duration ||
                                    item.packageOptionLabel ||
                                    ""
                                )
                                    .trim()
                                    .toLowerCase() ===
                                String(
                                    packageData.duration ||
                                    ""
                                )
                                    .trim()
                                    .toLowerCase()
                        );

                    if (duplicateOption) {

                        alert(
                            `${packageData.duration} already exists for ${packageData.name}. Please edit the existing option instead.`
                        );

                        document
                            .getElementById(
                                "formDuration"
                            )
                            ?.focus();

                        return;
                    }


                    if (
                        packageData.passengerPricing.kidsPricingEnabled
                    ) {

                        if (
                            packageData.passengerPricing.childDiscountMinAge <=
                            packageData.passengerPricing.childFreeMaxAge
                        ) {

                            alert(
                                "Discounted child starting age must be higher than the FREE child maximum age."
                            );

                            document
                                .getElementById(
                                    "childDiscountMinAge"
                                )
                                ?.focus();

                            return;

                        }


                        if (
                            packageData.passengerPricing.childDiscountMaxAge <
                            packageData.passengerPricing.childDiscountMinAge
                        ) {

                            alert(
                                "Discounted child maximum age cannot be lower than the starting age."
                            );

                            document
                                .getElementById(
                                    "childDiscountMaxAge"
                                )
                                ?.focus();

                            return;

                        }

                    }


                    if (
                        packageData.exclusiveTour.enabled
                    ) {

                        if (
                            packageData.exclusiveTour.includedVanUnits < 1
                        ) {

                            alert(
                                "Included Van Units must be at least 1 when Exclusive Tour is enabled."
                            );

                            document
                                .getElementById(
                                    "exclusiveIncludedVanUnits"
                                )
                                ?.focus();

                            return;

                        }

                    }


                    if (!validateAccommodationCards()) {
                        return;
                    }

                }

                // ==============================================
                // LOCK SAVE BUTTON
                // ==============================================

                const originalSaveText =
                    saveButton?.innerHTML ||
                    "Publish Package";

                const activeSaveButton =
                    saveAsDraftMode
                        ? savePackageDraftButton
                        : saveButton;


                if (
                    activeSaveButton
                ) {

                    activeSaveButton.disabled =
                        true;


                    activeSaveButton.innerHTML = `

                        <span
                            class="save-loading-spinner"
                        ></span>

                        Saving...

                    `;

                }


                try {

                    // ==========================================
                    // CREATE / UPDATE DOCUMENT
                    // ==========================================

                    let packageRef;

                    let packageId;


                    if (
                        editingPackageId
                    ) {

                        packageId =
                            editingPackageId;


                        packageRef =
                            doc(
                                db,
                                "packages",
                                packageId
                            );

                    } else {

                        packageRef =
                            await addDoc(
                                collection(
                                    db,
                                    "packages"
                                ),
                                {

                                    ...packageData,

                                    createdAt:
                                        new Date()
                                            .toISOString()

                                }
                            );


                        packageId =
                            packageRef.id;

                    }


                    console.log(
                        "PACKAGE ID:",
                        packageId
                    );


                    // ==========================================
                    // PACKAGE GALLERY
                    // ==========================================

                    const uploadedGallery = [
                        ...existingGalleryPhotos
                    ];


                    for (
                        const file of
                        packageGalleryFiles
                    ) {

                        const safeName =
                            file.name
                                .replace(
                                    /[^a-zA-Z0-9._-]/g,
                                    "_"
                                );


                        const fileName =
                            `${Date.now()}_${safeName}`;


                        const storageRef =
                            ref(
                                storage,
                                `packages/${packageId}/gallery/${fileName}`
                            );


                        const snapshot =
                            await uploadBytes(
                                storageRef,
                                file
                            );


                        const downloadURL =
                            await getDownloadURL(
                                snapshot.ref
                            );


                        uploadedGallery.push({

                            name:
                                file.name,

                            url:
                                downloadURL

                        });

                    }


                    // ==========================================
                    // ACCOMMODATIONS
                    // ==========================================

                    const accommodationCards =
                        accommodationList
                            ? accommodationList.querySelectorAll(
                                ".accommodation-card"
                            )
                            : [];

                    for (const card of accommodationCards) {

                        const resortName =
                            card.querySelector(
                                ".accommodation-resort-name"
                            )?.value?.trim() ||
                            "";

                        const name =
                            card.querySelector(
                                ".accommodation-name"
                            )?.value?.trim() ||
                            "";

                        const defaultAvailableUnits =
                            Math.max(
                                0,
                                Number(
                                    card.querySelector(
                                        ".accommodation-default-units"
                                    )?.value
                                ) || 0
                            );

                        const maxGuests =
                            Math.max(
                                1,
                                Number(
                                    card.querySelector(
                                        ".accommodation-max-guests"
                                    )?.value
                                ) || 1
                            );

                        const type =
                            card.querySelector(
                                ".accommodation-type"
                            )?.value ||
                            "additional";

                        const status =
                            card.querySelector(
                                ".accommodation-status"
                            )?.value ||
                            "active";

                        const pricePerNight =
                            Math.max(
                                0,
                                normalizePrice(
                                    card.querySelector(
                                        ".accommodation-price"
                                    )?.value
                                )
                            );

                        const description =
                            card.querySelector(
                                ".accommodation-description"
                            )?.value?.trim() ||
                            "";

                        const amenities =
                            (
                                card.querySelector(
                                    ".accommodation-amenities"
                                )?.value ||
                                ""
                            )
                                .split(/\r?\n|,/)
                                .map(value =>
                                    value.trim()
                                )
                                .filter(Boolean);

                        let mainPhoto =
                            card.dataset.existingPhoto ||
                            "";

                        const photoInput =
                            card.querySelector(
                                ".accommodation-photo-input"
                            );

                        if (
                            photoInput?.files?.length >
                            0
                        ) {

                            const file =
                                photoInput.files[0];

                            const safeName =
                                file.name.replace(
                                    /[^a-zA-Z0-9._-]/g,
                                    "_"
                                );

                            const accommodationStorageRef =
                                ref(
                                    storage,
                                    `packages/${packageId}/accommodations/main_${Date.now()}_${safeName}`
                                );

                            const snapshot =
                                await uploadBytes(
                                    accommodationStorageRef,
                                    file
                                );

                            mainPhoto =
                                await getDownloadURL(
                                    snapshot.ref
                                );

                        }

                        let gallery = [];

                        try {
                            gallery =
                                JSON.parse(
                                    card.dataset.existingGallery ||
                                    "[]"
                                );
                        } catch {
                            gallery = [];
                        }

                        const galleryFiles =
                            card._accommodationGalleryFiles ||
                            [];

                        for (
                            const file of
                            galleryFiles
                        ) {

                            const safeName =
                                file.name.replace(
                                    /[^a-zA-Z0-9._-]/g,
                                    "_"
                                );

                            const galleryStorageRef =
                                ref(
                                    storage,
                                    `packages/${packageId}/accommodations/gallery_${Date.now()}_${safeName}`
                                );

                            const snapshot =
                                await uploadBytes(
                                    galleryStorageRef,
                                    file
                                );

                            gallery.push(
                                await getDownloadURL(
                                    snapshot.ref
                                )
                            );

                        }

                        const isBlank =
                            !resortName &&
                            !name &&
                            !mainPhoto &&
                            gallery.length === 0 &&
                            !description;

                        if (isBlank) continue;

                        packageData
                            .accommodations
                            .push({

                                id:
                                    card.dataset.accommodationId ||
                                    `acc_${Date.now()}_${Math.random()
                                        .toString(36)
                                        .slice(2, 8)}`,

                                resortName,

                                name,

                                category:
                                    "accommodation",

                                type,

                                priceType:
                                    type === "included"
                                        ? "included"
                                        : "per_night",

                                pricePerNight:
                                    type === "included"
                                        ? 0
                                        : pricePerNight,

                                // Legacy field kept so older screens
                                // continue to work until Booking is upgraded.
                                price:
                                    type === "included"
                                        ? 0
                                        : pricePerNight,

                                maxGuests,

                                defaultAvailableUnits,

                                defaultUnits:
                                    defaultAvailableUnits,

                                capacity:
                                    `Good for up to ${maxGuests} guest${
                                        maxGuests === 1
                                            ? ""
                                            : "s"
                                    }`,

                                description,

                                amenities,

                                mainPhoto,

                                coverPhoto:
                                    mainPhoto,

                                // Legacy photo field.
                                photo:
                                    mainPhoto,

                                gallery,

                                scheduleAvailability:
                                    buildAccommodationScheduleAvailability(
                                        packageData.schedules,
                                        card.dataset.accommodationId
                                    ),

                                availability:
                                    packageData.schedules.map(
                                        schedule => {

                                            const item =
                                                schedule
                                                    .accommodationAvailability?.[
                                                        card.dataset.accommodationId
                                                    ] ||
                                                {
                                                    available:
                                                        status === "active",
                                                    remaining:
                                                        defaultAvailableUnits
                                                };

                                            return {
                                                scheduleId:
                                                    schedule.id,
                                                available:
                                                    item.available !== false,
                                                remaining:
                                                    Math.max(
                                                        0,
                                                        Number(
                                                            item.remaining
                                                        ) || 0
                                                    )
                                            };

                                        }
                                    ),

                                active:
                                    status === "active",

                                status

                            });

                    }


                    // ==========================================
                    // FINAL FIRESTORE UPDATE
                    // ==========================================

                    await updateDoc(
                        packageRef,
                        {

                            ...packageData,

                            gallery:
                                uploadedGallery,

                            accommodations:
                                packageData
                                    .accommodations,

                            schedules:
                                packageData
                                    .schedules,

                            travelSchedules:
                                packageData
                                    .schedules,

                            image:
                                uploadedGallery?.[0]
                                    ?.url ||
                                "",

                            updatedAt:
                                new Date()
                                    .toISOString()

                        }
                    );


                    console.log(
                        "PACKAGE SAVED:",
                        packageId
                    );


                    console.log(
                        "GALLERY:",
                        uploadedGallery
                    );


                    console.log(
                        "INCLUSIONS:",
                        packageData
                            .inclusions
                    );


                    console.log(
                        "EXCLUSIONS:",
                        packageData
                            .exclusions
                    );


                    console.log(
                        "ACCOMMODATIONS:",
                        packageData
                            .accommodations
                    );


                    // ==========================================
                    // SUCCESS
                    // ==========================================

                    alert(
                        saveAsDraftMode
                            ? "Draft saved successfully!"
                            : (
                                editingPackageId
                                    ? "Package updated successfully!"
                                    : "Package published successfully!"
                            )
                    );


                    // ==========================================
                    // RESET STATE
                    // ==========================================

                    editingPackageId =
                        null;


                    packageGalleryFiles =
                        [];


                    existingGalleryPhotos =
                        [];


                    if (
                        packagePhotos
                    ) {

                        packagePhotos.value =
                            "";

                    }


                    closeModal();


                    await loadPackages();


                } catch (error) {

                    console.error(
                        "PACKAGE SAVE ERROR:",
                        error
                    );


                    alert(
                        "Failed to save package. Please check your connection and try again."
                    );


                } finally {

                    if (
                        saveButton
                    ) {

                        saveButton.disabled =
                            false;


                        saveButton.innerHTML =
                            originalSaveText;

                    }

                }

            }
        );


        // ======================================================
        // INITIAL LOAD
        // ======================================================

        syncAccommodationEmptyState();
        syncTravelScheduleEmptyState();

        loadPackageTemplates()
            .finally(
                () => {
                    loadPackages();
                }
            );

    }
);


// =========================================================
// DYNAMIC COST & PRICING
// =========================================================
function dynamicCostEscape(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
const DYNAMIC_COST_TYPES=[["fixed","Fixed"],["perHead","Per Head"],["perDay","Per Day"],["perNight","Per Night"],["perHeadDay","Per Head / Day"],["perHeadNight","Per Head / Night"],["perHeadUnit","Per Head / Unit"]];
let dynamicCostItemsState=[];
let vanRentalRatesCache=[];
let vanRentalRatesLoaded=false;

const VAN_RENTAL_COLLECTION="vanRentalRates";
const VAN_UNIT_ADJUSTMENTS={high:0,low:-2000,xl:3000};
const VAN_UNIT_LABELS={high:"High Roof · 13–15 pax",low:"Low Roof · 10–12 pax",xl:"XL Van · 18 pax"};

async function ensureVanRentalRatesLoaded(){
  if(vanRentalRatesLoaded)return vanRentalRatesCache;
  const snapshot=await getDocs(collection(db,VAN_RENTAL_COLLECTION));
  vanRentalRatesCache=snapshot.docs
    .map(docSnap=>({id:docSnap.id,...docSnap.data()}))
    .filter(rate=>rate.status!=="inactive")
    .sort((a,b)=>String(a.destination||"").localeCompare(String(b.destination||"")));
  vanRentalRatesLoaded=true;
  return vanRentalRatesCache;
}
function getVanRentalDurationKey(){
  const typed=String(document.getElementById("formDuration")?.value||"").trim();
  const selected=String(document.getElementById("existingPackageDurationSelect")?.selectedOptions?.[0]?.textContent||"").trim();
  const raw=typed||selected;
  if(/day\s*tour/i.test(raw))return "dayTour";
  if(/2\s*D\s*1\s*N/i.test(raw))return "twoDOneN";
  if(/3\s*D\s*2\s*N/i.test(raw))return "threeDTwoN";
  return "";
}
function getVanRentalRate(item){
  const route=vanRentalRatesCache.find(rate=>rate.id===item.vanRateId);
  const durationKey=getVanRentalDurationKey();
  if(!route||!durationKey)return 0;
  const base=Number(route[durationKey]||0);
  if(!Number.isFinite(base)||base<=0)return 0;
  return Math.max(0,base+(VAN_UNIT_ADJUSTMENTS[item.vanUnit]??0));
}
function syncVanRentalItemRate(item){
  if(item?.source!=="vanRental")return;
  item.name="Van Rental";
  item.type="fixed";
  if(vanRentalRatesLoaded)item.rate=getVanRentalRate(item);
  item.qty=Math.max(1,Number(item.qty||1));
}

function getCostingDuration(){
  const typed=String(document.getElementById("formDuration")?.value||"").trim();
  const selected=String(document.getElementById("existingPackageDurationSelect")?.selectedOptions?.[0]?.textContent||"").trim();
  const raw=typed||selected;
  const m=raw.match(/(\d+)\s*D\s*(\d+)\s*N/i);
  if(m) return {days:Math.max(1,+m[1]||1),nights:Math.max(0,+m[2]||0)};
  if(/day\s*tour/i.test(raw)) return {days:1,nights:0};
  return {days:1,nights:0};
}
function costPeso(v){return `₱${Number(v||0).toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2})}`;}
function costMultiplier(type,pax,d,qty){
  qty=Math.max(0,+qty||0);
  if(type==="perHead")return pax;
  if(type==="perDay")return d.days;
  if(type==="perNight")return d.nights;
  if(type==="perHeadDay")return pax*d.days;
  if(type==="perHeadNight")return pax*d.nights;
  if(type==="perHeadUnit")return pax*qty;
  return qty||1;
}
function getDynamicCostBasisLabel(type){
  const pax=Math.max(1,+document.getElementById("costExpectedPax")?.value||1);
  const d=getCostingDuration();
  if(type==="perHead") return `${pax} pax`;
  if(type==="perDay") return `${d.days} day${d.days===1?"":"s"}`;
  if(type==="perNight") return `${d.nights} night${d.nights===1?"":"s"}`;
  if(type==="perHeadDay") return `${pax} × ${d.days} days`;
  if(type==="perHeadNight") return `${pax} × ${d.nights} nights`;
  return "1";
}
function renderDynamicCostItems(){
  const host=document.getElementById("dynamicCostItems");
  if(!host)return;

  if(!dynamicCostItemsState.length){
    host.innerHTML=`
      <div class="cost-empty-state">
        No cost items yet. Click <strong>+ Add Cost Item</strong> to add an expense.
      </div>`;
    return;
  }

  host.innerHTML=dynamicCostItemsState.map((x,index)=>{
    const rowNumber=String(index+1).padStart(2,"0");

    if(x.source==="vanRental"){
      syncVanRentalItemRate(x);

      const routeOptions=vanRentalRatesCache
        .map(rate=>`
          <option value="${dynamicCostEscape(rate.id)}" ${x.vanRateId===rate.id?"selected":""}>
            ${dynamicCostEscape(rate.destination)}
          </option>`)
        .join("");

      return `
        <div class="dynamic-cost-row dynamic-cost-row-van tw-cost-card" data-id="${x.id}">
          <div class="tw-cost-card-head">
            <span class="dynamic-cost-row-number">${rowNumber}</span>
            <strong class="tw-cost-name">Van Rental</strong>
            <button type="button" class="remove-dynamic-cost" title="Remove expense" aria-label="Remove expense">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>

          <div class="tw-van-route-field">
            <label>Route</label>
            <select class="dc-van-route" title="Van rental route">
              <option value="">Select van route</option>
              ${routeOptions}
            </select>
          </div>

          <div class="tw-cost-fields">
            <div class="tw-cost-field">
              <label>Van Unit</label>
              <select class="dc-van-unit" title="Van type">
                ${Object.entries(VAN_UNIT_LABELS)
                  .map(([value,label])=>`
                    <option value="${value}" ${x.vanUnit===value?"selected":""}>
                      ${label}
                    </option>`)
                  .join("")}
              </select>
            </div>

            <div class="tw-cost-field">
              <label>Rate</label>
              <input class="dc-rate" type="number" min="0" step=".01" value="${x.rate||0}" readonly aria-label="Van rental rate">
            </div>

            <div class="tw-cost-field">
              <label>Basis / Qty</label>
              <div class="tw-basis-input">
                <input class="dc-qty" type="number" min="1" step="1" value="${x.qty??1}" title="Number of vans">
                <span>van</span>
              </div>
            </div>
          </div>

          <div class="tw-cost-computed">
            <span>Computed Cost</span>
            <strong class="dynamic-cost-computed">₱0.00</strong>
          </div>
        </div>`;
    }

    const basisControl=["fixed","perHeadUnit"].includes(x.type)
      ? `<input class="dc-qty" type="number" min="0" step="1" value="${x.qty??1}">`
      : `<div class="tw-basis-readonly">
           <span class="tw-basis-value">${dynamicCostEscape(getDynamicCostBasisLabel(x.type).replace(/\s*pax$/i,""))}</span>
           <span class="tw-basis-unit">${x.type==="perHead" ? "pax" : ""}</span>
         </div>`;

    return `
      <div class="dynamic-cost-row tw-cost-card" data-id="${x.id}">
        <div class="tw-cost-card-head">
          <span class="dynamic-cost-row-number">${rowNumber}</span>
          <strong class="tw-cost-name">${dynamicCostEscape(x.name || "Cost Item")}</strong>
          <button type="button" class="remove-dynamic-cost" title="Remove expense" aria-label="Remove expense">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>

        <div class="tw-cost-fields">
          <div class="tw-cost-field">
            <label>Rate</label>
            <input class="dc-rate" type="number" min="0" step=".01" value="${x.rate||0}">
          </div>

          <div class="tw-cost-field">
            <label>Calculation</label>
            <select class="dc-type">
              ${DYNAMIC_COST_TYPES
                .map(([v,l])=>`<option value="${v}" ${x.type===v?"selected":""}>${l}</option>`)
                .join("")}
            </select>
          </div>

          <div class="tw-cost-field">
            <label>Basis / Qty</label>
            ${basisControl}
          </div>
        </div>

        <div class="tw-cost-computed">
          <span>Computed Cost</span>
          <strong class="dynamic-cost-computed">₱0.00</strong>
        </div>
      </div>`;
  }).join("");

  host.querySelectorAll(".dynamic-cost-row").forEach(row=>{
    const x=dynamicCostItemsState.find(v=>v.id===row.dataset.id);
    if(!x)return;

    if(x.source==="vanRental"){
      row.querySelector(".dc-van-route").onchange=e=>{
        x.vanRateId=e.target.value;
        syncVanRentalItemRate(x);
        renderDynamicCostItems();
        calculatePackageCosting();
      };

      row.querySelector(".dc-van-unit").onchange=e=>{
        x.vanUnit=e.target.value;
        syncVanRentalItemRate(x);
        renderDynamicCostItems();
        calculatePackageCosting();
      };

      row.querySelector(".dc-qty").oninput=e=>{
        x.qty=Math.max(1,+e.target.value||1);
        calculatePackageCosting();
      };
    }else{
      row.querySelector(".dc-type").onchange=e=>{
        x.type=e.target.value;
        renderDynamicCostItems();
        calculatePackageCosting();
      };

      row.querySelector(".dc-rate").oninput=e=>{
        x.rate=+e.target.value||0;
        calculatePackageCosting();
      };

      const qtyInput=row.querySelector(".dc-qty");
      if(qtyInput){
        qtyInput.oninput=e=>{
          x.qty=+e.target.value||0;
          calculatePackageCosting();
        };
      }
    }

    row.querySelector(".remove-dynamic-cost").onclick=()=>{
      dynamicCostItemsState=dynamicCostItemsState.filter(v=>v.id!==x.id);
      renderDynamicCostItems();
      calculatePackageCosting();
    };
  });
}
function addDynamicCostItem(data={}){
  dynamicCostItemsState.push({id:`dc_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,source:data.source||"custom",name:data.name||"",type:data.type||"fixed",rate:+data.rate||0,qty:data.qty??1,...data});
  renderDynamicCostItems();calculatePackageCosting();
}
function refreshDynamicCostBasis(){
  document.querySelectorAll("#dynamicCostItems .dynamic-cost-row").forEach(row=>{
    const x=dynamicCostItemsState.find(v=>v.id===row.dataset.id);
    const basis=row.querySelector(".dynamic-cost-basis");
    if(x&&basis) basis.textContent=getDynamicCostBasisLabel(x.type);
  });
}
function calculatePackageCosting(){
  const pax=Math.max(1,+document.getElementById("costExpectedPax")?.value||1);
  const d=getCostingDuration();
  refreshDynamicCostBasis();
  const duration=document.getElementById("costDurationSummary");
  if(duration)duration.textContent=`${d.days} Day${d.days===1?"":"s"} / ${d.nights} Night${d.nights===1?"":"s"}`;
  let total=0;
  document.querySelectorAll("#dynamicCostItems .dynamic-cost-row").forEach(row=>{
    const x=dynamicCostItemsState.find(v=>v.id===row.dataset.id); if(!x)return;
    if(x.source==="vanRental"){
      syncVanRentalItemRate(x);
      const rateInput=row.querySelector(".dc-rate");
      if(rateInput)rateInput.value=x.rate||0;
    }
    const amount=Math.max(0,x.rate)*costMultiplier(x.type,pax,d,x.qty); total+=amount;
    row.querySelector(".dynamic-cost-computed").textContent=costPeso(amount);
  });
  const perPax=total/pax;
  const markup=Math.max(0,+document.getElementById("costMarkup")?.value||0);
  const recommended=perPax*(1+markup/100);
  const finalRate=Math.max(0,+document.getElementById("costFinalSellingRate")?.value||0);
  const profitPerPax=finalRate-perPax;
  const totalProfit=profitPerPax*pax;
  const margin=finalRate?(profitPerPax/finalRate)*100:0;
  [["costTotalTour",costPeso(total)],["costPerPax",costPeso(perPax)],["costRecommendedRate",costPeso(recommended)],["costProfitPerPax",costPeso(profitPerPax)],["costPackageProfit",costPeso(totalProfit)],["costProfitMargin",`${margin.toFixed(2)}%`]].forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=val;});
  const basicPrice=document.getElementById("formPrice");
  if(basicPrice) basicPrice.value=finalRate>0?finalRate:"";
  if(typeof updateBuilderLivePreview==="function") updateBuilderLivePreview();
  if(typeof updatePackageReview==="function") updatePackageReview();
}
function getDynamicCostingPayload(){
  return {expectedPax:Math.max(1,+document.getElementById("costExpectedPax")?.value||1),markup:+document.getElementById("costMarkup")?.value||0,finalSellingRate:+document.getElementById("costFinalSellingRate")?.value||0,items:dynamicCostItemsState.map(x=>({...x}))};
}

function getPackageDurationTextForCosting(packageItem={}){
  const candidates=[
    packageItem.packageOptionLabel,
    packageItem.duration,
    packageItem.packageDuration,
    packageItem.option,
    packageItem.optionLabel,
    packageItem.title,
    document.getElementById("formDuration")?.value,
    document.getElementById("existingPackageDurationSelect")?.selectedOptions?.[0]?.textContent
  ];
  for(const value of candidates){
    const text=String(value||"").trim();
    if(/^\s*\d+\s*D\s*\d+\s*N\s*$/i.test(text)||/day\s*tour/i.test(text)) return text;
    const match=text.match(/(\d+\s*D\s*\d+\s*N)/i);
    if(match) return match[1];
  }
  return "";
}

function migrateLegacyCostingItems(costing={}){
  const items=[];
  const add=(name,type,rate,qty=1)=>{
    rate=Math.max(0,Number(rate||0));
    if(rate>0) items.push({id:`legacy_${name.toLowerCase().replace(/[^a-z0-9]+/g,"_")}`,name,type,rate,qty});
  };
  // Legacy fields were stored as total group costs, so Fixed preserves the
  // exact old computation instead of guessing a per-head/per-night rule.
  add("Transportation","fixed",costing.transportation);
  add("Accommodation","fixed",costing.accommodation);
  add("Meals","fixed",costing.meals);
  add("Tour Guide / Coordinator","fixed",costing.tourGuide);
  add("Boat / Ferry","fixed",costing.boatFerry);
  add("Other Expenses","fixed",costing.otherExpenses);
  return items;
}

function loadPackageCostingForEditor(packageItem={}){
  const costing=packageItem.costing||{};
  const durationText=getPackageDurationTextForCosting(packageItem);

  // Keep the actual option duration available to the costing calculator even
  // when Edit mode is displaying the existing-option selector.
  if(durationText){
    const durationInput=document.getElementById("formDuration");
    if(durationInput) durationInput.value=durationText;
  }

  const savedItems=Array.isArray(costing.items)&&costing.items.length
    ? costing.items
    : migrateLegacyCostingItems(costing);

  dynamicCostItemsState=savedItems.map((item,index)=>({
    id:item.id||`loaded_${Date.now()}_${index}`,
    source:item.source||"custom",
    name:String(item.name||item.label||"Expense"),
    type:DYNAMIC_COST_TYPES.some(([value])=>value===item.type)?item.type:"fixed",
    rate:Math.max(0,Number(item.rate||0)),
    qty:Math.max(0,Number(item.qty??1)),
    vanRateId:String(item.vanRateId||""),
    vanUnit:String(item.vanUnit||"high")
  }));

  // No saved expenses = clean empty table.
  // Admin adds only the cost items that actually apply to this package.
  if(!dynamicCostItemsState.length){
    dynamicCostItemsState=[];
  }

  const pax=document.getElementById("costExpectedPax");
  const markup=document.getElementById("costMarkup");
  const finalRate=document.getElementById("costFinalSellingRate");
  if(pax) pax.value=Math.max(1,Number(costing.expectedPax||12));
  if(markup) markup.value=Math.max(0,Number(costing.markup ?? costing.markupPercent ?? 15));
  if(finalRate) finalRate.value=Math.max(0,Number(costing.finalSellingRate ?? packageItem.price ?? 0));

  renderDynamicCostItems();
  calculatePackageCosting();

  if(dynamicCostItemsState.some(item=>item.source==="vanRental")){
    ensureVanRentalRatesLoaded()
      .then(()=>{renderDynamicCostItems();calculatePackageCosting();})
      .catch(error=>console.error("VAN RENTAL COST LOAD ERROR:",error));
  }
}

function initDynamicCosting(){
  if(!dynamicCostItemsState.length){
    dynamicCostItemsState=[];
    renderDynamicCostItems();
  }
  document.getElementById("addCostItemBtn")?.addEventListener("click",()=>addDynamicCostItem());
  document.getElementById("addCostItemBtnTable")?.addEventListener("click",()=>addDynamicCostItem());
  document.getElementById("addVanRentalCostBtn")?.addEventListener("click",async()=>{
    const button=document.getElementById("addVanRentalCostBtn");
    try{
      if(button){button.disabled=true;button.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Loading...';}
      await ensureVanRentalRatesLoaded();
      if(!vanRentalRatesCache.length){alert("No active van rental rates found. Add rates in Van Rental first.");return;}
      const item={id:`dc_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,source:"vanRental",name:"Van Rental",type:"fixed",rate:0,qty:1,vanRateId:"",vanUnit:"high"};
      dynamicCostItemsState.push(item);
      renderDynamicCostItems();
      calculatePackageCosting();
      document.querySelector(`[data-id="${item.id}"] .dc-van-route`)?.focus();
    }catch(error){
      console.error("VAN RENTAL COST LOAD ERROR:",error);
      alert("Unable to load Van Rental rates. Please check Firestore access and try again.");
    }finally{
      if(button){button.disabled=false;button.innerHTML='<i class="fa-solid fa-van-shuttle"></i> + Van Rental';}
    }
  });
  ["costExpectedPax","costMarkup","costFinalSellingRate","formDuration","existingPackageDurationSelect"].forEach(id=>{
    document.getElementById(id)?.addEventListener("input",calculatePackageCosting);
    document.getElementById(id)?.addEventListener("change",calculatePackageCosting);
  });
  calculatePackageCosting();
}
document.addEventListener("DOMContentLoaded",initDynamicCosting);
 