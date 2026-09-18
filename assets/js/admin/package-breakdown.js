// ======================================================
// TRIPS WONDER - PACKAGE BREAKDOWN
// PRIVATE / CUSTOM TOUR COSTING MANAGER
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
    showLoading,
    hideLoading,
    showLoadingError
} from "../shared/loading-screen.js";


// ======================================================
// ACCESS
// ======================================================

requireAuth({

    allowedRoles: [
        "owner",
        "admin"
    ],

    requiredPermission:
        "packages",

    onAuthorized: () => {
        initializePackageBreakdown();
    }

});


// ======================================================
// INIT
// ======================================================

async function initializePackageBreakdown() {

    showLoading?.();

    try {

        await loadPackagesAndBreakdowns();

        bindEvents();

        renderDestinationOptions();

        resetPackageSelection();

        renderEmptyState();

        hideLoading?.();

    } catch (error) {

        console.error(
            "PACKAGE BREAKDOWN INIT ERROR:",
            error
        );

        showLoadingError?.(
            "Unable to load Package Breakdown."
        );

    }

}


// ======================================================
// STATE
// ======================================================

let packages = [];

let packageBreakdowns = [];

let categorySettingsDocumentId = null;

let pricingDefaultsDocumentId = null;

let globalPricingDefaults = {
    minimumPayingPax: 12,
    defaultTransportUnitId: "",
    transportUnits: []
};

let customExpenseCategories = [];

const BUILT_IN_EXPENSE_CATEGORIES = [
    "Food",
    "Accommodation / Resort",
    "Tour Coordinator",
    "Activities / Entrance Fees",
    "Driver Expenses",
    "Local Transportation",
    "Boat / Ferry",
    "Other Expenses"
];

let selectedPackage = null;

let selectedBreakdownDocumentId = null;

let hasUnsavedChanges = false;


// ======================================================
// ELEMENTS
// ======================================================

const backToPackagesButton =
    document.getElementById(
        "backToPackagesButton"
    );

const destinationSelect =
    document.getElementById(
        "breakdownDestination"
    );

const packageOptionSelect =
    document.getElementById(
        "breakdownPackageOption"
    );

const selectedPackageSummary =
    document.getElementById(
        "selectedPackageSummary"
    );

const selectedPackageName =
    document.getElementById(
        "selectedPackageName"
    );

const selectedPackageMeta =
    document.getElementById(
        "selectedPackageMeta"
    );

const selectedPackagePrice =
    document.getElementById(
        "selectedPackagePrice"
    );

const breakdownEmptyState =
    document.getElementById(
        "breakdownEmptyState"
    );

const packageBreakdownForm =
    document.getElementById(
        "packageBreakdownForm"
    );

const breakdownSaveState =
    document.getElementById(
        "breakdownSaveState"
    );

const globalMinimumPayingPax =
    document.getElementById(
        "globalMinimumPayingPax"
    );

const globalDefaultTransportUnit =
    document.getElementById(
        "globalDefaultTransportUnit"
    );

const globalTransportUnitList =
    document.getElementById(
        "globalTransportUnitList"
    );

const addGlobalTransportUnitButton =
    document.getElementById(
        "addGlobalTransportUnitButton"
    );

const saveGlobalPricingDefaultsButton =
    document.getElementById(
        "saveGlobalPricingDefaultsButton"
    );

const useGlobalMinimumPax =
    document.getElementById(
        "useGlobalMinimumPax"
    );

const useGlobalTransportUnit =
    document.getElementById(
        "useGlobalTransportUnit"
    );

const globalUnitPreview =
    document.getElementById(
        "globalUnitPreview"
    );

const minimumPayingPaxHelp =
    document.getElementById(
        "minimumPayingPaxHelp"
    );

const privateTourEnabled =
    document.getElementById(
        "privateTourEnabled"
    );

const minimumPayingPax =
    document.getElementById(
        "minimumPayingPax"
    );

const markupPerPaxPerDay =
    document.getElementById(
        "markupPerPaxPerDay"
    );

const addTransportUnitButton =
    document.getElementById(
        "addTransportUnitButton"
    );

const transportUnitList =
    document.getElementById(
        "transportUnitList"
    );

const transportUnitTemplate =
    document.getElementById(
        "transportUnitTemplate"
    );

const addExpenseButton =
    document.getElementById(
        "addExpenseButton"
    );

const manageExpenseCategoriesButton =
    document.getElementById(
        "manageExpenseCategoriesButton"
    );

const expenseCategoryModal =
    document.getElementById(
        "expenseCategoryModal"
    );

const expenseCategoryModalOverlay =
    document.getElementById(
        "expenseCategoryModalOverlay"
    );

const closeExpenseCategoryModal =
    document.getElementById(
        "closeExpenseCategoryModal"
    );

const newExpenseCategoryName =
    document.getElementById(
        "newExpenseCategoryName"
    );

const addExpenseCategoryButton =
    document.getElementById(
        "addExpenseCategoryButton"
    );

const builtInExpenseCategoryList =
    document.getElementById(
        "builtInExpenseCategoryList"
    );

const customExpenseCategoryList =
    document.getElementById(
        "customExpenseCategoryList"
    );

const expenseList =
    document.getElementById(
        "expenseList"
    );

const expenseTemplate =
    document.getElementById(
        "expenseTemplate"
    );

const previewPax =
    document.getElementById(
        "previewPax"
    );

const previewTransportUnit =
    document.getElementById(
        "previewTransportUnit"
    );

const previewDuration =
    document.getElementById(
        "previewDuration"
    );

const previewChargeablePax =
    document.getElementById(
        "previewChargeablePax"
    );

const previewTransportation =
    document.getElementById(
        "previewTransportation"
    );

const previewExpenses =
    document.getElementById(
        "previewExpenses"
    );

const previewOperatingCost =
    document.getElementById(
        "previewOperatingCost"
    );

const previewMarkup =
    document.getElementById(
        "previewMarkup"
    );

const previewGrandTotal =
    document.getElementById(
        "previewGrandTotal"
    );

const previewPricePerPax =
    document.getElementById(
        "previewPricePerPax"
    );

const breakdownFooterPackage =
    document.getElementById(
        "breakdownFooterPackage"
    );

const savePackageBreakdownButton =
    document.getElementById(
        "savePackageBreakdownButton"
    );


// ======================================================
// LOAD DATA
// ======================================================

async function loadPackagesAndBreakdowns() {

    const [
        packageSnapshot,
        breakdownSnapshot
    ] = await Promise.all([

        getDocs(
            collection(
                db,
                "packages"
            )
        ),

        getDocs(
            collection(
                db,
                "packageBreakdowns"
            )
        )

    ]);

    packages =
        packageSnapshot.docs.map(
            packageDocument => ({
                id: packageDocument.id,
                ...packageDocument.data()
            })
        );

    const allBreakdownDocuments =
        breakdownSnapshot.docs.map(
            breakdownDocument => ({
                id: breakdownDocument.id,
                ...breakdownDocument.data()
            })
        );

    const categorySettings =
        allBreakdownDocuments.find(
            item =>
                item.documentType === "expenseCategorySettings"
        ) || null;

    const pricingDefaults =
        allBreakdownDocuments.find(
            item =>
                item.documentType === "pricingDefaults"
        ) || null;

    categorySettingsDocumentId =
        categorySettings?.id ||
        null;

    pricingDefaultsDocumentId =
        pricingDefaults?.id ||
        null;

    globalPricingDefaults = {
        minimumPayingPax:
            Math.max(
                1,
                Number(
                    pricingDefaults?.minimumPayingPax
                ) || 12
            ),
        defaultTransportUnitId:
            String(
                pricingDefaults?.defaultTransportUnitId || ""
            ),
        transportUnits:
            Array.isArray(
                pricingDefaults?.transportUnits
            )
                ? pricingDefaults.transportUnits
                : []
    };

    customExpenseCategories =
        Array.isArray(
            categorySettings?.customExpenseCategories
        )
            ? categorySettings
                .customExpenseCategories
                .map(
                    value =>
                        String(
                            value || ""
                        ).trim()
                )
                .filter(
                    Boolean
                )
            : [];

    packageBreakdowns =
        allBreakdownDocuments.filter(
            item =>
                ![
                    "expenseCategorySettings",
                    "pricingDefaults"
                ].includes(
                    item.documentType
                )
        );

    renderExpenseCategoryManager();

    renderGlobalPricingDefaults();

}


// ======================================================
// GLOBAL PRICING DEFAULTS
// ======================================================

function renderGlobalPricingDefaults() {

    if (globalMinimumPayingPax) {
        globalMinimumPayingPax.value =
            globalPricingDefaults.minimumPayingPax;
    }

    renderGlobalTransportUnitRows();
    refreshGlobalDefaultTransportOptions();
    syncGlobalInheritanceUI();

}


function renderGlobalTransportUnitRows() {

    if (!globalTransportUnitList) {
        return;
    }

    globalTransportUnitList.innerHTML = "";

    const units =
        Array.isArray(globalPricingDefaults.transportUnits)
            ? globalPricingDefaults.transportUnits
            : [];

    if (units.length === 0) {

        globalTransportUnitList.innerHTML = `
            <div class="dynamic-empty-state">
                No default transportation unit yet.
            </div>
        `;

        return;
    }

    units.forEach(
        unit =>
            addGlobalTransportUnitRow(
                unit,
                false
            )
    );

}


function addGlobalTransportUnitRow(
    data = {},
    markDirty = true
) {

    globalTransportUnitList
        ?.querySelector(".dynamic-empty-state")
        ?.remove();

    const fragment =
        transportUnitTemplate
            .content
            .cloneNode(true);

    const row =
        fragment.querySelector(
            ".transport-unit-row"
        );

    row.dataset.id =
        data.id ||
        createLocalRowId("global-transport");

    row.querySelector(".transport-unit-name").value =
        data.name || "";

    row.querySelector(".transport-unit-capacity").value =
        data.capacity ?? "";

    row.querySelector(".transport-unit-base-rate").value =
        data.baseRate ?? "";

    row.querySelector(".transport-unit-additional-day-rate").value =
        data.additionalDayRate ?? "";

    row.querySelector(".remove-transport-unit")
        ?.addEventListener(
            "click",
            () => {

                row.remove();

                renumberGlobalTransportRows();
                refreshGlobalDefaultTransportOptions();
                updateGlobalUnitPreview();

            }
        );

    row.querySelectorAll("input, select")
        .forEach(
            input =>
                input.addEventListener(
                    "input",
                    () => {

                        refreshGlobalDefaultTransportOptions();
                        updateGlobalUnitPreview();

                    }
                )
        );

    globalTransportUnitList.appendChild(fragment);

    renumberGlobalTransportRows();
    refreshGlobalDefaultTransportOptions();

}


function renumberGlobalTransportRows() {

    globalTransportUnitList
        ?.querySelectorAll(".transport-unit-row")
        .forEach(
            (row, index) => {

                const number =
                    row.querySelector(".transport-row-number");

                if (number) {
                    number.textContent =
                        String(index + 1).padStart(2, "0");
                }

            }
        );

}


function collectGlobalTransportUnits() {

    return [
        ...(globalTransportUnitList
            ?.querySelectorAll(".transport-unit-row") || [])
    ]
        .map(
            row => ({

                id:
                    row.dataset.id,

                name:
                    row
                        .querySelector(".transport-unit-name")
                        .value
                        .trim(),

                capacity:
                    Math.max(
                        1,
                        Number(
                            row
                                .querySelector(".transport-unit-capacity")
                                .value
                        ) || 1
                    ),

                baseRate:
                    Math.max(
                        0,
                        Number(
                            row
                                .querySelector(".transport-unit-base-rate")
                                .value
                        ) || 0
                    ),

                additionalDayRate:
                    Math.max(
                        0,
                        Number(
                            row
                                .querySelector(".transport-unit-additional-day-rate")
                                .value
                        ) || 0
                    )

            })
        )
        .filter(unit => unit.name);

}


function refreshGlobalDefaultTransportOptions() {

    if (!globalDefaultTransportUnit) {
        return;
    }

    const currentValue =
        globalDefaultTransportUnit.value ||
        globalPricingDefaults.defaultTransportUnitId;

    const units =
        collectGlobalTransportUnits();

    globalDefaultTransportUnit.innerHTML = `
        <option value="">
            No default unit
        </option>

        ${units
            .map(
                unit => `
                    <option value="${escapeHtml(unit.id)}">
                        ${escapeHtml(unit.name)} • ${unit.capacity} pax
                    </option>
                `
            )
            .join("")}
    `;

    if (units.some(unit => unit.id === currentValue)) {
        globalDefaultTransportUnit.value = currentValue;
    }

    updateGlobalUnitPreview();

}


function getEffectiveGlobalTransportUnit() {

    const unitId =
        globalDefaultTransportUnit?.value ||
        globalPricingDefaults.defaultTransportUnitId;

    return collectGlobalTransportUnits()
        .find(unit => unit.id === unitId) || null;

}


function updateGlobalUnitPreview() {

    if (!globalUnitPreview) {
        return;
    }

    const unit =
        getEffectiveGlobalTransportUnit();

    if (!unit) {

        globalUnitPreview.innerHTML = `
            <i class="fa-solid fa-van-shuttle"></i>
            <span>No global default unit selected.</span>
        `;

        return;
    }

    globalUnitPreview.innerHTML = `
        <i class="fa-solid fa-van-shuttle"></i>
        <span>
            <strong>${escapeHtml(unit.name)}</strong>
            • ${unit.capacity} pax
            • Base ${formatMoney(unit.baseRate)}
            • +${formatMoney(unit.additionalDayRate)} / additional day
        </span>
    `;

}


async function saveGlobalPricingDefaults() {

    const units =
        collectGlobalTransportUnits();

    const payload = {

        documentType:
            "pricingDefaults",

        minimumPayingPax:
            Math.max(
                1,
                Number(globalMinimumPayingPax?.value) || 12
            ),

        defaultTransportUnitId:
            globalDefaultTransportUnit?.value || "",

        transportUnits:
            units,

        updatedAt:
            new Date().toISOString()

    };

    const originalHtml =
        saveGlobalPricingDefaultsButton.innerHTML;

    saveGlobalPricingDefaultsButton.disabled = true;
    saveGlobalPricingDefaultsButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Saving...</span>
    `;

    try {

        if (pricingDefaultsDocumentId) {

            await updateDoc(
                doc(
                    db,
                    "packageBreakdowns",
                    pricingDefaultsDocumentId
                ),
                payload
            );

        } else {

            const documentReference =
                await addDoc(
                    collection(
                        db,
                        "packageBreakdowns"
                    ),
                    payload
                );

            pricingDefaultsDocumentId =
                documentReference.id;

        }

        globalPricingDefaults = {
            minimumPayingPax:
                payload.minimumPayingPax,
            defaultTransportUnitId:
                payload.defaultTransportUnitId,
            transportUnits:
                payload.transportUnits
        };

        renderGlobalPricingDefaults();

        if (selectedPackage) {
            syncGlobalInheritanceUI();
            updateCostPreview();
        }

        alert("Global pricing defaults saved.");

    } catch (error) {

        console.error(
            "SAVE GLOBAL PRICING DEFAULTS ERROR:",
            error
        );

        alert(
            "Unable to save global pricing defaults."
        );

    } finally {

        saveGlobalPricingDefaultsButton.disabled = false;
        saveGlobalPricingDefaultsButton.innerHTML = originalHtml;

    }

}


function syncGlobalInheritanceUI() {

    const useGlobalPax =
        useGlobalMinimumPax?.checked !== false;

    if (minimumPayingPax) {

        minimumPayingPax.disabled =
            useGlobalPax;

        if (useGlobalPax) {
            minimumPayingPax.value =
                globalPricingDefaults.minimumPayingPax;
        }

    }

    if (minimumPayingPaxHelp) {

        minimumPayingPaxHelp.textContent =
            useGlobalPax
                ? `Using global default: ${globalPricingDefaults.minimumPayingPax} paying pax.`
                : "Package-specific minimum headcount override.";

    }

    const useGlobalUnit =
        useGlobalTransportUnit?.checked !== false;

    if (transportUnitList) {
        transportUnitList.style.display =
            useGlobalUnit
                ? "none"
                : "";
    }

    updateGlobalUnitPreview();

}


// ======================================================
// PACKAGE HELPERS
// ======================================================

function getDestinationName(
    packageItem
) {

    return String(
        packageItem?.destinationName ||
        packageItem?.name ||
        packageItem?.packageName ||
        packageItem?.title ||
        "Untitled Destination"
    ).trim();

}


function getPackageOptionName(
    packageItem
) {

    return String(
        packageItem?.packageOptionLabel ||
        packageItem?.duration ||
        packageItem?.optionLabel ||
        "Package Option"
    ).trim();

}


function normalizePrice(
    value
) {

    const number =
        Number(
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
                )
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

    return new Intl.NumberFormat(
        "en-PH",
        {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0
        }
    ).format(
        Number(
            value
        ) || 0
    );

}


function getDurationDays(
    packageItem
) {

    const candidates = [

        packageItem
            ?.scheduleSettings
            ?.durationDays,

        packageItem?.durationDays,

        packageItem?.duration,

        packageItem
            ?.packageOptionLabel

    ];

    for (
        const candidate
        of candidates
    ) {

        if (
            Number.isFinite(
                Number(
                    candidate
                )
            ) &&
            Number(
                candidate
            ) > 0
        ) {

            return Number(
                candidate
            );

        }

        const text =
            String(
                candidate ?? ""
            );

        if (
            /day\s*tour/i.test(
                text
            )
        ) {

            return 1;

        }

        const match =
            text.match(
                /(\d+)\s*(?:D|Days?)/i
            );

        if (
            match
        ) {

            return Math.max(
                1,
                Number(
                    match[1]
                )
            );

        }

    }

    return 1;

}


function getDurationNights(
    packageItem
) {

    return Math.max(
        0,
        getDurationDays(
            packageItem
        ) - 1
    );

}


function getPackagePrice(
    packageItem
) {

    return normalizePrice(
        packageItem?.price ??
        packageItem?.packagePrice ??
        packageItem?.startingPrice
    );

}


// ======================================================
// RESET PACKAGE SELECTION
// Prevent browser form/history restoration from auto-selecting
// the first package option before the admin chooses it.
// ======================================================

function resetPackageSelection() {

    selectedPackage = null;
    selectedBreakdownDocumentId = null;
    hasUnsavedChanges = false;

    if (destinationSelect) {
        destinationSelect.value = "";
        destinationSelect.selectedIndex = 0;
    }

    if (packageOptionSelect) {
        packageOptionSelect.innerHTML = `
            <option value="" selected>
                Select package option
            </option>
        `;
        packageOptionSelect.value = "";
        packageOptionSelect.selectedIndex = 0;
        packageOptionSelect.disabled = true;
    }

    if (selectedPackageSummary) {
        selectedPackageSummary.hidden = true;
    }

    if (packageBreakdownForm) {
        packageBreakdownForm.hidden = true;
    }

    if (breakdownEmptyState) {
        breakdownEmptyState.hidden = false;
    }

    setSaveState(
        "",
        "Select a package"
    );

}


// ======================================================
// DESTINATION / OPTION SELECT
// ======================================================

function renderDestinationOptions() {

    const destinationNames =
        [
            ...new Set(
                packages
                    .map(
                        getDestinationName
                    )
                    .filter(
                        Boolean
                    )
            )
        ].sort(
            (
                first,
                second
            ) =>
                first.localeCompare(
                    second
                )
        );

    destinationSelect.innerHTML = `

        <option value="">
            Select destination
        </option>

        ${destinationNames
            .map(
                destinationName => `

                    <option
                        value="${escapeHtml(
                            destinationName
                        )}">

                        ${escapeHtml(
                            destinationName
                        )}

                    </option>

                `
            )
            .join("")}

    `;

}


function renderPackageOptions(
    destinationName
) {

    selectedPackage =
        null;

    selectedBreakdownDocumentId =
        null;

    packageOptionSelect.innerHTML = `

        <option value="">
            Select package option
        </option>

    `;

    packageOptionSelect.disabled =
        !destinationName;

    if (
        !destinationName
    ) {

        renderEmptyState();

        return;

    }

    const packageOptions =
        packages
            .filter(
                packageItem =>
                    getDestinationName(
                        packageItem
                    ) ===
                    destinationName
            )
            .sort(
                (
                    first,
                    second
                ) =>
                    getPackageOptionName(
                        first
                    ).localeCompare(
                        getPackageOptionName(
                            second
                        )
                    )
            );

    packageOptionSelect.insertAdjacentHTML(
        "beforeend",
        packageOptions
            .map(
                packageItem => `

                    <option
                        value="${packageItem.id}">

                        ${escapeHtml(
                            getPackageOptionName(
                                packageItem
                            )
                        )}

                    </option>

                `
            )
            .join("")
    );

    // Always keep the placeholder selected until the admin
    // manually chooses a package option.
    packageOptionSelect.value = "";
    packageOptionSelect.selectedIndex = 0;

    renderEmptyState();

}


// ======================================================
// SELECT PACKAGE
// ======================================================

function selectPackage(
    packageId
) {

    if (!packageId) {

        selectedPackage = null;
        selectedBreakdownDocumentId = null;

        renderEmptyState();

        return;
    }

    selectedPackage =
        packages.find(
            packageItem =>
                packageItem.id ===
                packageId
        ) || null;

    if (
        !selectedPackage
    ) {

        renderEmptyState();

        return;

    }

    renderSelectedPackageSummary();

    loadSelectedPackageBreakdown();

}


function renderSelectedPackageSummary() {

    selectedPackageSummary.hidden =
        false;

    selectedPackageName.textContent =
        getDestinationName(
            selectedPackage
        );

    selectedPackageMeta.textContent =
        `${getPackageOptionName(
            selectedPackage
        )} • ${getDurationDays(
            selectedPackage
        )} Day${getDurationDays(
            selectedPackage
        ) === 1 ? "" : "s"}`;

    selectedPackagePrice.textContent =
        formatMoney(
            getPackagePrice(
                selectedPackage
            )
        );

    breakdownFooterPackage.textContent =
        `${getDestinationName(
            selectedPackage
        )} • ${getPackageOptionName(
            selectedPackage
        )}`;

}


// ======================================================
// LOAD BREAKDOWN
// ======================================================

function loadSelectedPackageBreakdown() {

    // Show the editor immediately after a valid package is selected.
    // This prevents the old empty-state card from remaining visible if
    // one of the dynamic render helpers encounters incomplete legacy data.
    if (breakdownEmptyState) {
        breakdownEmptyState.hidden = true;
        breakdownEmptyState.style.display = "none";
    }

    if (packageBreakdownForm) {
        packageBreakdownForm.hidden = false;
        packageBreakdownForm.style.display = "grid";
    }

    const existingBreakdown =
        packageBreakdowns.find(
            breakdown =>
                breakdown.packageId ===
                selectedPackage.id
        ) || null;

    selectedBreakdownDocumentId =
        existingBreakdown?.id ||
        null;

    const data =
        normalizeBreakdown(
            existingBreakdown
        );

    privateTourEnabled.checked =
        data.enabled;

    useGlobalMinimumPax.checked =
        data.useGlobalMinimumPax;

    useGlobalTransportUnit.checked =
        data.useGlobalTransportUnit;

    minimumPayingPax.value =
        data.useGlobalMinimumPax
            ? globalPricingDefaults.minimumPayingPax
            : data.minimumPayingPax;

    markupPerPaxPerDay.value =
        data.markupPerPaxPerDay;

    previewPax.value =
        data.minimumPayingPax;

    transportUnitList.innerHTML =
        "";

    expenseList.innerHTML =
        "";

    data.transportUnits.forEach(
        transportUnit =>
            addTransportUnitRow(
                transportUnit,
                false
            )
    );

    data.expenses.forEach(
        expense =>
            addExpenseRow(
                expense,
                false
            )
    );

    ensureDynamicEmptyStates();

    syncGlobalInheritanceUI();

    refreshTransportPreviewOptions();

    updateCostPreview();

    breakdownEmptyState.hidden =
        true;
    breakdownEmptyState.style.display =
        "none";

    packageBreakdownForm.hidden =
        false;
    packageBreakdownForm.style.display =
        "grid";

    setUnsavedChanges(
        false
    );

}


function normalizeBreakdown(
    breakdown
) {

    return {

        enabled:
            breakdown?.enabled === true,

        useGlobalMinimumPax:
            breakdown?.useGlobalMinimumPax !== false,

        useGlobalTransportUnit:
            breakdown?.useGlobalTransportUnit !== false,

        minimumPayingPax:
            Math.max(
                1,
                Number(
                    breakdown
                        ?.minimumPayingPax
                ) || globalPricingDefaults.minimumPayingPax
            ),

        markupPerPaxPerDay:
            Math.max(
                0,
                Number(
                    breakdown
                        ?.markupPerPaxPerDay
                ) || 500
            ),

        transportUnits:
            Array.isArray(
                breakdown
                    ?.transportUnits
            )
                ? breakdown
                    .transportUnits
                : [],

        expenses:
            Array.isArray(
                breakdown
                    ?.expenses
            )
                ? breakdown
                    .expenses
                : []

    };

}


// ======================================================
// TRANSPORT UNIT ROWS
// ======================================================

function createLocalRowId(
    prefix
) {

    return `${prefix}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

}


function addTransportUnitRow(
    data = {},
    markDirty = true
) {

    transportUnitList
        .querySelector(
            ".dynamic-empty-state"
        )
        ?.remove();

    const fragment =
        transportUnitTemplate
            .content
            .cloneNode(
                true
            );

    const row =
        fragment.querySelector(
            ".transport-unit-row"
        );

    row.dataset.id =
        data.id ||
        createLocalRowId(
            "transport"
        );

    row.querySelector(
        ".transport-unit-name"
    ).value =
        data.name || "";

    row.querySelector(
        ".transport-unit-capacity"
    ).value =
        data.capacity ?? "";

    row.querySelector(
        ".transport-unit-base-rate"
    ).value =
        data.baseRate ?? "";

    row.querySelector(
        ".transport-unit-additional-day-rate"
    ).value =
        data.additionalDayRate ?? "";

    row.querySelector(
        ".remove-transport-unit"
    )?.addEventListener(
        "click",
        () => {

            row.remove();

            renumberTransportRows();

            ensureDynamicEmptyStates();

            refreshTransportPreviewOptions();

            updateCostPreview();

            setUnsavedChanges(
                true
            );

        }
    );

    row
        .querySelectorAll(
            "input, select"
        )
        .forEach(
            input =>
                input.addEventListener(
                    "input",
                    () => {

                        refreshTransportPreviewOptions();

                        updateCostPreview();

                        setUnsavedChanges(
                            true
                        );

                    }
                )
        );

    transportUnitList.appendChild(
        fragment
    );

    renumberTransportRows();

    refreshTransportPreviewOptions();

    if (
        markDirty
    ) {

        setUnsavedChanges(
            true
        );

    }

}


function renumberTransportRows() {

    transportUnitList
        .querySelectorAll(
            ".transport-unit-row"
        )
        .forEach(
            (
                row,
                index
            ) => {

                const number =
                    row.querySelector(
                        ".transport-row-number"
                    );

                if (
                    number
                ) {

                    number.textContent =
                        String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        );

                }

            }
        );

}


// ======================================================
// EXPENSE CATEGORIES
// ======================================================

function getAllExpenseCategories() {

    return [
        ...BUILT_IN_EXPENSE_CATEGORIES,
        ...customExpenseCategories
    ];

}


function renderExpenseCategoryOptions(
    selectElement,
    selectedValue = ""
) {

    if (
        !selectElement
    ) {
        return;
    }

    const categories =
        getAllExpenseCategories();

    const normalizedSelected =
        String(
            selectedValue || ""
        ).trim();

    if (
        normalizedSelected &&
        !categories.some(
            category =>
                category.toLowerCase() ===
                normalizedSelected.toLowerCase()
        )
    ) {
        categories.push(
            normalizedSelected
        );
    }

    selectElement.innerHTML =
        categories
            .map(
                category => `

                    <option
                        value="${escapeHtml(
                            category
                        )}">

                        ${escapeHtml(
                            category
                        )}

                    </option>

                `
            )
            .join("");

    selectElement.value =
        normalizedSelected ||
        categories[0] ||
        "";

}


function refreshAllExpenseCategorySelects() {

    expenseList
        ?.querySelectorAll(
            ".expense-category"
        )
        .forEach(
            selectElement => {

                const currentValue =
                    selectElement.value;

                renderExpenseCategoryOptions(
                    selectElement,
                    currentValue
                );

            }
        );

}


function renderExpenseCategoryManager() {

    if (
        builtInExpenseCategoryList
    ) {

        builtInExpenseCategoryList.innerHTML =
            BUILT_IN_EXPENSE_CATEGORIES
                .map(
                    category => `

                        <span class="category-chip">
                            ${escapeHtml(category)}
                        </span>

                    `
                )
                .join("");

    }

    if (
        customExpenseCategoryList
    ) {

        if (
            customExpenseCategories.length === 0
        ) {

            customExpenseCategoryList.innerHTML = `

                <div class="custom-category-empty">
                    No custom category yet.
                </div>

            `;

        } else {

            customExpenseCategoryList.innerHTML =
                customExpenseCategories
                    .map(
                        (
                            category,
                            index
                        ) => `

                            <div
                                class="custom-category-row"
                                data-category-index="${index}">

                                <span>
                                    ${escapeHtml(category)}
                                </span>

                                <div class="custom-category-actions">

                                    <button
                                        type="button"
                                        class="custom-category-action edit-custom-category"
                                        aria-label="Rename ${escapeHtml(category)}">

                                        <i class="fa-solid fa-pen"></i>

                                    </button>

                                    <button
                                        type="button"
                                        class="custom-category-action delete delete-custom-category"
                                        aria-label="Delete ${escapeHtml(category)}">

                                        <i class="fa-solid fa-trash"></i>

                                    </button>

                                </div>

                            </div>

                        `
                    )
                    .join("");

        }

    }

    refreshAllExpenseCategorySelects();

}


function openExpenseCategoryManager() {

    expenseCategoryModal
        ?.classList
        .add(
            "open"
        );

    expenseCategoryModal
        ?.setAttribute(
            "aria-hidden",
            "false"
        );

    renderExpenseCategoryManager();

    window.setTimeout(
        () =>
            newExpenseCategoryName
                ?.focus(),
        30
    );

}


function closeExpenseCategoryManager() {

    expenseCategoryModal
        ?.classList
        .remove(
            "open"
        );

    expenseCategoryModal
        ?.setAttribute(
            "aria-hidden",
            "true"
        );

    if (
        newExpenseCategoryName
    ) {
        newExpenseCategoryName.value =
            "";
    }

}


function normalizeCategoryName(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        );

}


function expenseCategoryExists(
    categoryName,
    ignoreCustomIndex = -1
) {

    const normalized =
        normalizeCategoryName(
            categoryName
        ).toLowerCase();

    if (
        !normalized
    ) {
        return false;
    }

    if (
        BUILT_IN_EXPENSE_CATEGORIES.some(
            category =>
                category.toLowerCase() ===
                normalized
        )
    ) {
        return true;
    }

    return customExpenseCategories.some(
        (
            category,
            index
        ) =>
            index !==
                ignoreCustomIndex &&
            category.toLowerCase() ===
                normalized
    );

}


async function saveExpenseCategorySettings() {

    const payload = {

        documentType:
            "expenseCategorySettings",

        customExpenseCategories:
            [...customExpenseCategories],

        updatedAt:
            new Date()
                .toISOString()

    };

    if (
        categorySettingsDocumentId
    ) {

        await updateDoc(
            doc(
                db,
                "packageBreakdowns",
                categorySettingsDocumentId
            ),
            payload
        );

        return;
    }

    const documentReference =
        await addDoc(
            collection(
                db,
                "packageBreakdowns"
            ),
            payload
        );

    categorySettingsDocumentId =
        documentReference.id;

}


async function addCustomExpenseCategory() {

    const categoryName =
        normalizeCategoryName(
            newExpenseCategoryName?.value
        );

    if (
        !categoryName
    ) {

        alert(
            "Enter a category name first."
        );

        newExpenseCategoryName
            ?.focus();

        return;
    }

    if (
        expenseCategoryExists(
            categoryName
        )
    ) {

        alert(
            "That category already exists."
        );

        return;
    }

    addExpenseCategoryButton.disabled =
        true;

    try {

        customExpenseCategories.push(
            categoryName
        );

        await saveExpenseCategorySettings();

        if (
            newExpenseCategoryName
        ) {
            newExpenseCategoryName.value =
                "";
        }

        renderExpenseCategoryManager();

        newExpenseCategoryName
            ?.focus();

    } catch (error) {

        customExpenseCategories =
            customExpenseCategories.filter(
                category =>
                    category !==
                    categoryName
            );

        console.error(
            "ADD EXPENSE CATEGORY ERROR:",
            error
        );

        alert(
            "Unable to save the new category."
        );

    } finally {

        addExpenseCategoryButton.disabled =
            false;

    }

}


async function renameCustomExpenseCategory(
    index
) {

    const currentName =
        customExpenseCategories[index];

    if (
        !currentName
    ) {
        return;
    }

    const nextName =
        normalizeCategoryName(
            window.prompt(
                "Rename category:",
                currentName
            )
        );

    if (
        !nextName ||
        nextName ===
            currentName
    ) {
        return;
    }

    if (
        expenseCategoryExists(
            nextName,
            index
        )
    ) {

        alert(
            "That category already exists."
        );

        return;
    }

    const previousCategories =
        [...customExpenseCategories];

    customExpenseCategories[index] =
        nextName;

    // Keep currently visible expense rows synchronized.
    expenseList
        ?.querySelectorAll(
            ".expense-category"
        )
        .forEach(
            selectElement => {

                if (
                    selectElement.value ===
                    currentName
                ) {
                    selectElement.dataset.pendingCategory =
                        nextName;
                }

            }
        );

    try {

        await saveExpenseCategorySettings();

        expenseList
            ?.querySelectorAll(
                ".expense-category"
            )
            .forEach(
                selectElement => {

                    const selectedValue =
                        selectElement.dataset
                            .pendingCategory ||
                        selectElement.value;

                    delete selectElement.dataset
                        .pendingCategory;

                    renderExpenseCategoryOptions(
                        selectElement,
                        selectedValue
                    );

                }
            );

        renderExpenseCategoryManager();

        setUnsavedChanges(
            true
        );

    } catch (error) {

        customExpenseCategories =
            previousCategories;

        console.error(
            "RENAME EXPENSE CATEGORY ERROR:",
            error
        );

        alert(
            "Unable to rename the category."
        );

        renderExpenseCategoryManager();

    }

}


async function deleteCustomExpenseCategory(
    index
) {

    const categoryName =
        customExpenseCategories[index];

    if (
        !categoryName
    ) {
        return;
    }

    const isInUse =
        [
            ...expenseList
                ?.querySelectorAll(
                    ".expense-category"
                ) || []
        ].some(
            selectElement =>
                selectElement.value ===
                categoryName
        );

    if (
        isInUse
    ) {

        alert(
            "This category is currently used in an expense row. Change that expense category first before deleting it."
        );

        return;
    }

    const confirmed =
        window.confirm(
            `Delete the custom category "${categoryName}"?`
        );

    if (
        !confirmed
    ) {
        return;
    }

    const previousCategories =
        [...customExpenseCategories];

    customExpenseCategories.splice(
        index,
        1
    );

    try {

        await saveExpenseCategorySettings();

        renderExpenseCategoryManager();

    } catch (error) {

        customExpenseCategories =
            previousCategories;

        console.error(
            "DELETE EXPENSE CATEGORY ERROR:",
            error
        );

        alert(
            "Unable to delete the category."
        );

        renderExpenseCategoryManager();

    }

}


// ======================================================
// EXPENSE ROWS
// ======================================================

// ======================================================
// EXPENSE COMPUTATION BASIS DETAILS
// ======================================================

function renderExpenseBasisDetails(row, data = {}) {
    const basis = row.querySelector('.expense-basis')?.value || 'fixed_trip';
    const box = row.querySelector('.expense-basis-details');
    if (!box) return;

    const numberField = (label, cls, value, min = 0, step = '1') => `
        <div class="mini-form-group">
            <label>${label}</label>
            <input type="number" class="${cls}" min="${min}" step="${step}" value="${value ?? ''}" placeholder="0">
        </div>`;

    box.hidden = false;

    if (basis === 'per_room_night') {
        box.innerHTML = `
            ${numberField('Room Capacity / Pax', 'expense-room-capacity', data.roomCapacity ?? 4, 1)}
            <p class="basis-note">Required rooms = Chargeable Pax ÷ Room Capacity, rounded up. Total = Amount × Required Rooms × Nights.</p>`;
    } else if (basis === 'per_unit_day' || basis === 'per_unit_trip') {
        box.innerHTML = `
            ${numberField('Quantity / Units', 'expense-quantity', data.quantity ?? 1, 1)}
            <p class="basis-note">${basis === 'per_unit_day' ? 'Total = Amount × Quantity × Tour Days.' : 'Total = Amount × Quantity.'}</p>`;
    } else if (basis === 'per_meal_pax') {
        box.innerHTML = `
            ${numberField('Number of Meals', 'expense-quantity', data.quantity ?? 1, 1)}
            <p class="basis-note">Total = Amount × Chargeable Pax × Number of Meals.</p>`;
    } else if (basis === 'custom') {
        box.innerHTML = `
            <div class="mini-form-group">
                <label>Custom Basis Name</label>
                <input type="text" class="expense-custom-basis-name" value="${escapeHtml(data.customBasisName || '')}" placeholder="e.g. Per Cottage / Night">
            </div>
            <div class="mini-form-group">
                <label>Multiplier</label>
                <select class="expense-custom-multiplier">
                    <option value="fixed">Fixed / Trip</option>
                    <option value="days">Tour Days</option>
                    <option value="nights">Nights</option>
                    <option value="pax">Chargeable Pax</option>
                    <option value="pax_days">Pax × Days</option>
                    <option value="pax_nights">Pax × Nights</option>
                    <option value="quantity">Quantity</option>
                    <option value="quantity_days">Quantity × Days</option>
                    <option value="quantity_nights">Quantity × Nights</option>
                    <option value="quantity_pax">Quantity × Pax</option>
                </select>
            </div>
            ${numberField('Quantity', 'expense-quantity', data.quantity ?? 1, 0, '0.01')}
            <p class="basis-note">Custom basis stays structured so the booking pricing engine can calculate it safely.</p>`;
        const mult = box.querySelector('.expense-custom-multiplier');
        if (mult) mult.value = data.customMultiplier || 'fixed';
    } else {
        box.hidden = true;
        box.innerHTML = '';
        return;
    }

    box.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', () => { updateCostPreview(); setUnsavedChanges(true); });
        input.addEventListener('change', () => { updateCostPreview(); setUnsavedChanges(true); });
    });
}

function addExpenseRow(
    data = {},
    markDirty = true
) {

    expenseList
        .querySelector(
            ".dynamic-empty-state"
        )
        ?.remove();

    const fragment =
        expenseTemplate
            .content
            .cloneNode(
                true
            );

    const row =
        fragment.querySelector(
            ".expense-row"
        );

    row.dataset.id =
        data.id ||
        createLocalRowId(
            "expense"
        );

    row.querySelector(
        ".expense-name"
    ).value =
        data.name || "";

    const expenseCategorySelect =
        row.querySelector(
            ".expense-category"
        );

    renderExpenseCategoryOptions(
        expenseCategorySelect,
        data.category ||
            "Food"
    );

    row.querySelector(
        ".expense-amount"
    ).value =
        data.amount ?? "";

    row.querySelector(
        ".expense-basis"
    ).value =
        data.basis ||
        "fixed_trip";

    renderExpenseBasisDetails(row, data);

    row.querySelector('.expense-basis')?.addEventListener('change', () => {
        renderExpenseBasisDetails(row, {});
        updateCostPreview();
        setUnsavedChanges(true);
    });

    row.querySelector(
        ".remove-expense"
    )?.addEventListener(
        "click",
        () => {

            row.remove();

            renumberExpenseRows();

            ensureDynamicEmptyStates();

            updateCostPreview();

            setUnsavedChanges(
                true
            );

        }
    );

    row
        .querySelectorAll(
            "input, select"
        )
        .forEach(
            input =>
                input.addEventListener(
                    "input",
                    () => {

                        updateCostPreview();

                        setUnsavedChanges(
                            true
                        );

                    }
                )
        );

    expenseList.appendChild(
        fragment
    );

    renumberExpenseRows();

    if (
        markDirty
    ) {

        setUnsavedChanges(
            true
        );

    }

}


function renumberExpenseRows() {

    expenseList
        .querySelectorAll(
            ".expense-row"
        )
        .forEach(
            (
                row,
                index
            ) => {

                const number =
                    row.querySelector(
                        ".expense-row-number"
                    );

                if (
                    number
                ) {

                    number.textContent =
                        String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        );

                }

            }
        );

}


// ======================================================
// EMPTY STATES
// ======================================================

function ensureDynamicEmptyStates() {

    if (
        !transportUnitList
            .querySelector(
                ".transport-unit-row"
            )
    ) {

        transportUnitList.innerHTML = `

            <div class="dynamic-empty-state">
                No transportation unit yet. Click “Add Unit Type”.
            </div>

        `;

    }

    if (
        !expenseList
            .querySelector(
                ".expense-row"
            )
    ) {

        expenseList.innerHTML = `

            <div class="dynamic-empty-state">
                No expense yet. Click “Add Expense”.
            </div>

        `;

    }

}


// ======================================================
// COLLECT DATA
// ======================================================

function collectTransportUnits() {

    return [
        ...transportUnitList
            .querySelectorAll(
                ".transport-unit-row"
            )
    ]
        .map(
            row => ({

                id:
                    row.dataset.id,

                name:
                    row
                        .querySelector(
                            ".transport-unit-name"
                        )
                        .value
                        .trim(),

                capacity:
                    Math.max(
                        1,
                        Number(
                            row
                                .querySelector(
                                    ".transport-unit-capacity"
                                )
                                .value
                        ) || 1
                    ),

                baseRate:
                    Math.max(
                        0,
                        Number(
                            row
                                .querySelector(
                                    ".transport-unit-base-rate"
                                )
                                .value
                        ) || 0
                    ),

                additionalDayRate:
                    Math.max(
                        0,
                        Number(
                            row
                                .querySelector(
                                    ".transport-unit-additional-day-rate"
                                )
                                .value
                        ) || 0
                    )

            })
        )
        .filter(
            unit =>
                unit.name
        );

}


function collectExpenses() {

    return [
        ...expenseList
            .querySelectorAll(
                ".expense-row"
            )
    ]
        .map(
            row => ({

                id:
                    row.dataset.id,

                name:
                    row
                        .querySelector(
                            ".expense-name"
                        )
                        .value
                        .trim(),

                category:
                    row
                        .querySelector(
                            ".expense-category"
                        )
                        .value,

                amount:
                    Math.max(
                        0,
                        Number(
                            row
                                .querySelector(
                                    ".expense-amount"
                                )
                                .value
                        ) || 0
                    ),

                basis:
                    row.querySelector(".expense-basis").value,

                roomCapacity:
                    Math.max(1, Number(row.querySelector('.expense-room-capacity')?.value) || 1),

                quantity:
                    Math.max(0, Number(row.querySelector('.expense-quantity')?.value) || 0),

                customBasisName:
                    row.querySelector('.expense-custom-basis-name')?.value?.trim() || '',

                customMultiplier:
                    row.querySelector('.expense-custom-multiplier')?.value || 'fixed'

            })
        )
        .filter(
            expense =>
                expense.name
        );

}


function collectBreakdownData() {

    return {

        packageId:
            selectedPackage.id,

        destinationNameSnapshot:
            getDestinationName(
                selectedPackage
            ),

        packageOptionLabelSnapshot:
            getPackageOptionName(
                selectedPackage
            ),

        enabled:
            privateTourEnabled.checked,

        useGlobalMinimumPax:
            useGlobalMinimumPax.checked,

        useGlobalTransportUnit:
            useGlobalTransportUnit.checked,

        minimumPayingPax:
            useGlobalMinimumPax.checked
                ? globalPricingDefaults.minimumPayingPax
                : Math.max(
                    1,
                    Number(
                        minimumPayingPax.value
                    ) || globalPricingDefaults.minimumPayingPax
                ),

        markupPerPaxPerDay:
            Math.max(
                0,
                Number(
                    markupPerPaxPerDay.value
                ) || 0
            ),

        transportUnits:
            collectTransportUnits(),

        expenses:
            collectExpenses(),

        updatedAt:
            new Date()
                .toISOString()

    };

}


// ======================================================
// PREVIEW
// ======================================================

function refreshTransportPreviewOptions() {

    const currentValue =
        previewTransportUnit.value;

    if (useGlobalTransportUnit?.checked) {

        const globalUnit =
            getEffectiveGlobalTransportUnit();

        previewTransportUnit.innerHTML =
            globalUnit
                ? `
                    <option value="${escapeHtml(globalUnit.id)}">
                        ${escapeHtml(globalUnit.name)} • ${globalUnit.capacity} pax
                    </option>
                `
                : `
                    <option value="">
                        No global default unit selected
                    </option>
                `;

        previewTransportUnit.disabled = true;
        updateGlobalUnitPreview();

        return;
    }

    previewTransportUnit.disabled = false;

    const transportUnits =
        collectTransportUnits();

    previewTransportUnit.innerHTML = `

        <option value="">
            No unit selected
        </option>

        ${transportUnits
            .map(
                unit => `

                    <option
                        value="${escapeHtml(
                            unit.id
                        )}">

                        ${escapeHtml(
                            unit.name
                        )} • ${unit.capacity} pax

                    </option>

                `
            )
            .join("")}

    `;

    if (
        transportUnits.some(
            unit =>
                unit.id ===
                currentValue
        )
    ) {

        previewTransportUnit.value =
            currentValue;

    }

}


function calculateSingleExpenseTotal(
    expense,
    chargeablePax,
    days,
    nights
) {

    const amount = Math.max(
        0,
        Number(expense?.amount) || 0
    );

    const quantity = Math.max(
        0,
        Number(expense?.quantity) || 0
    );

    switch (expense?.basis) {

        case "per_day":
            return amount * days;

        case "per_night":
            return amount * nights;

        case "per_pax":
            return amount * chargeablePax;

        case "per_pax_day":
            return amount * chargeablePax * days;

        case "per_pax_night":
            return amount * chargeablePax * nights;

        case "per_room_night": {
            const roomCapacity = Math.max(
                1,
                Number(expense?.roomCapacity) || 1
            );

            const requiredRooms = Math.ceil(
                chargeablePax / roomCapacity
            );

            return amount * requiredRooms * nights;
        }

        case "per_unit_day":
            return amount * quantity * days;

        case "per_unit_trip":
            return amount * quantity;

        case "per_meal_pax":
            return amount * chargeablePax * quantity;

        case "custom": {
            let multiplier = 1;

            switch (expense?.customMultiplier) {
                case "days":
                    multiplier = days;
                    break;

                case "nights":
                    multiplier = nights;
                    break;

                case "pax":
                    multiplier = chargeablePax;
                    break;

                case "pax_days":
                    multiplier = chargeablePax * days;
                    break;

                case "pax_nights":
                    multiplier = chargeablePax * nights;
                    break;

                case "quantity":
                    multiplier = quantity;
                    break;

                case "quantity_days":
                    multiplier = quantity * days;
                    break;

                case "quantity_nights":
                    multiplier = quantity * nights;
                    break;

                case "quantity_pax":
                    multiplier = quantity * chargeablePax;
                    break;

                case "fixed":
                default:
                    multiplier = 1;
                    break;
            }

            return amount * multiplier;
        }

        case "fixed_trip":
        default:
            return amount;
    }
}


function calculateExpenseTotal(
    expenses,
    chargeablePax,
    days,
    nights
) {

    return expenses.reduce(
        (total, expense) =>
            total + calculateSingleExpenseTotal(
                expense,
                chargeablePax,
                days,
                nights
            ),
        0
    );
}


function renderExpenseComputedTotals(
    chargeablePax,
    days,
    nights
) {

    const expenses = collectExpenses();
    const expenseMap = new Map(
        expenses.map(expense => [expense.id, expense])
    );

    expenseList
        ?.querySelectorAll(".expense-row")
        .forEach(row => {

            const expense = expenseMap.get(row.dataset.id);

            let result = row.querySelector(
                ".expense-computed-total"
            );

            if (!result) {
                result = document.createElement("div");
                result.className = "expense-computed-total";
                result.style.marginTop = "8px";
                result.style.padding = "7px 10px";
                result.style.borderRadius = "8px";
                result.style.background = "#eef5ff";
                result.style.color = "#0b4f9c";
                result.style.fontSize = "12px";
                result.style.fontWeight = "700";
                result.style.width = "fit-content";
                result.style.marginLeft = "auto";
                row.appendChild(result);
            }

            if (!expense) {
                result.textContent = "Computed: ₱0";
                return;
            }

            const computedTotal = calculateSingleExpenseTotal(
                expense,
                chargeablePax,
                days,
                nights
            );

            result.textContent =
                `Computed: ${formatMoney(computedTotal)}`;
        });
}


function calculateTransportTotal(
    unit,
    days
) {

    if (
        !unit
    ) {

        return 0;

    }

    return (
        Number(
            unit.baseRate
        ) || 0
    ) +
    (
        Number(
            unit.additionalDayRate
        ) || 0
    ) *
    Math.max(
        0,
        days - 1
    );

}


function updateCostPreview() {

    if (
        !selectedPackage
    ) {

        return;

    }

    const days =
        getDurationDays(
            selectedPackage
        );

    const nights =
        getDurationNights(
            selectedPackage
        );

    const actualPax =
        Math.max(
            1,
            Number(
                previewPax.value
            ) || 1
        );

    const minimumPax =
        useGlobalMinimumPax.checked
            ? globalPricingDefaults.minimumPayingPax
            : Math.max(
                1,
                Number(
                    minimumPayingPax.value
                ) || globalPricingDefaults.minimumPayingPax
            );

    const chargeablePax =
        Math.max(
            actualPax,
            minimumPax
        );

    const transportUnits =
        collectTransportUnits();

    const selectedTransport =
        useGlobalTransportUnit.checked
            ? getEffectiveGlobalTransportUnit()
            : (
                transportUnits.find(
                    unit =>
                        unit.id ===
                        previewTransportUnit.value
                ) || null
            );

    const transportationTotal =
        calculateTransportTotal(
            selectedTransport,
            days
        );

    const expensesTotal =
        calculateExpenseTotal(
            collectExpenses(),
            chargeablePax,
            days,
            nights
        );

    renderExpenseComputedTotals(
        chargeablePax,
        days,
        nights
    );

    const markupTotal =
        Math.max(
            0,
            Number(
                markupPerPaxPerDay.value
            ) || 0
        ) *
        chargeablePax *
        days;

    const operatingCost =
        transportationTotal +
        expensesTotal;

    const grandTotal =
        operatingCost +
        markupTotal;

    const pricePerPax =
        chargeablePax > 0
            ? grandTotal / chargeablePax
            : 0;

    previewDuration.textContent =
        `${days}D${nights}N`;

    previewChargeablePax.textContent =
        `${chargeablePax} Pax`;

    previewTransportation.textContent =
        formatMoney(
            transportationTotal
        );

    previewExpenses.textContent =
        formatMoney(
            expensesTotal
        );

    previewOperatingCost.textContent =
        formatMoney(
            operatingCost
        );

    previewMarkup.textContent =
        formatMoney(
            markupTotal
        );

    previewGrandTotal.textContent =
        formatMoney(
            grandTotal
        );

    previewPricePerPax.textContent =
        formatMoney(
            pricePerPax
        );

}


// ======================================================
// SAVE
// ======================================================

async function savePackageBreakdown(
    event
) {

    event.preventDefault();

    if (
        !selectedPackage
    ) {

        return;

    }

    const breakdownData =
        collectBreakdownData();

    const originalButtonHtml =
        savePackageBreakdownButton.innerHTML;

    savePackageBreakdownButton.disabled =
        true;

    savePackageBreakdownButton.innerHTML = `

        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>Saving...</span>

    `;

    try {

        if (
            selectedBreakdownDocumentId
        ) {

            await updateDoc(
                doc(
                    db,
                    "packageBreakdowns",
                    selectedBreakdownDocumentId
                ),
                breakdownData
            );

            const existingIndex =
                packageBreakdowns.findIndex(
                    breakdown =>
                        breakdown.id ===
                        selectedBreakdownDocumentId
                );

            if (
                existingIndex >= 0
            ) {

                packageBreakdowns[
                    existingIndex
                ] = {

                    id:
                        selectedBreakdownDocumentId,

                    ...breakdownData

                };

            }

        } else {

            const documentReference =
                await addDoc(
                    collection(
                        db,
                        "packageBreakdowns"
                    ),
                    breakdownData
                );

            selectedBreakdownDocumentId =
                documentReference.id;

            packageBreakdowns.push({

                id:
                    documentReference.id,

                ...breakdownData

            });

        }

        setUnsavedChanges(
            false
        );

        setSaveState(
            "saved",
            "Breakdown saved"
        );

    } catch (error) {

        console.error(
            "PACKAGE BREAKDOWN SAVE ERROR:",
            error
        );

        alert(
            "Unable to save Package Breakdown. Please check your Firestore rules and try again."
        );

    } finally {

        savePackageBreakdownButton.disabled =
            false;

        savePackageBreakdownButton.innerHTML =
            originalButtonHtml;

    }

}


// ======================================================
// SAVE STATE
// ======================================================

function setSaveState(
    type,
    text
) {

    breakdownSaveState
        .classList
        .remove(
            "saved",
            "dirty"
        );

    if (
        type
    ) {

        breakdownSaveState
            .classList
            .add(
                type
            );

    }

    const iconClass =
        type === "dirty"
            ? "fa-solid fa-circle-exclamation"
            : "fa-regular fa-circle-check";

    breakdownSaveState.innerHTML = `

        <i class="${iconClass}"></i>
        <span>${escapeHtml(text)}</span>

    `;

}


function setUnsavedChanges(
    value
) {

    hasUnsavedChanges =
        value;

    if (
        !selectedPackage
    ) {

        setSaveState(
            "",
            "Select a package"
        );

        return;

    }

    if (
        value
    ) {

        setSaveState(
            "dirty",
            "Unsaved changes"
        );

    } else {

        setSaveState(
            "saved",
            "Saved"
        );

    }

}


// ======================================================
// EMPTY STATE
// ======================================================

function renderEmptyState() {

    selectedPackageSummary.hidden =
        true;

    packageBreakdownForm.hidden =
        true;
    packageBreakdownForm.style.display =
        "none";

    breakdownEmptyState.hidden =
        false;
    breakdownEmptyState.style.display =
        "grid";

    breakdownFooterPackage.textContent =
        "Package Breakdown";

    setSaveState(
        "",
        "Select a package"
    );

}


// ======================================================
// CONFIRM BEFORE SWITCHING
// ======================================================

function canLeaveCurrentPackage() {

    if (
        !hasUnsavedChanges
    ) {

        return true;

    }

    return window.confirm(
        "You have unsaved Package Breakdown changes. Continue without saving?"
    );

}


// ======================================================
// EVENTS
// ======================================================

function bindEvents() {

    backToPackagesButton
        ?.addEventListener(
            "click",
            () => {

                if (
                    !canLeaveCurrentPackage()
                ) {

                    return;

                }

                window.location.href =
                    "packages.html";

            }
        );


    destinationSelect
        ?.addEventListener(
            "change",
            event => {

                if (
                    !canLeaveCurrentPackage()
                ) {

                    event.target.value =
                        selectedPackage
                            ? getDestinationName(
                                selectedPackage
                            )
                            : "";

                    return;

                }

                setUnsavedChanges(
                    false
                );

                renderPackageOptions(
                    event.target.value
                );

            }
        );


    const handlePackageOptionSelection = event => {

        const packageId =
            String(
                event?.target?.value ||
                packageOptionSelect?.value ||
                ""
            ).trim();

        if (
            !canLeaveCurrentPackage()
        ) {

            if (packageOptionSelect) {
                packageOptionSelect.value =
                    selectedPackage?.id ||
                    "";
            }

            return;

        }

        setUnsavedChanges(
            false
        );

        // Once the admin manually chooses a real package option,
        // immediately load its Package Breakdown. No extra click needed.
        selectPackage(
            packageId
        );

    };


    packageOptionSelect
        ?.addEventListener(
            "change",
            handlePackageOptionSelection
        );

    // Some browsers can visually update a <select> before the change
    // event is committed. Input keeps the form and the visible option
    // synchronized without auto-selecting the first package.
    packageOptionSelect
        ?.addEventListener(
            "input",
            handlePackageOptionSelection
        );


    addTransportUnitButton
        ?.addEventListener(
            "click",
            () =>
                addTransportUnitRow()
        );


    addExpenseButton
        ?.addEventListener(
            "click",
            () =>
                addExpenseRow()
        );


    manageExpenseCategoriesButton
        ?.addEventListener(
            "click",
            openExpenseCategoryManager
        );


    closeExpenseCategoryModal
        ?.addEventListener(
            "click",
            closeExpenseCategoryManager
        );


    expenseCategoryModalOverlay
        ?.addEventListener(
            "click",
            closeExpenseCategoryManager
        );


    addExpenseCategoryButton
        ?.addEventListener(
            "click",
            addCustomExpenseCategory
        );


    newExpenseCategoryName
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    addCustomExpenseCategory();

                }

            }
        );


    customExpenseCategoryList
        ?.addEventListener(
            "click",
            event => {

                const row =
                    event.target.closest(
                        ".custom-category-row"
                    );

                if (
                    !row
                ) {
                    return;
                }

                const index =
                    Number(
                        row.dataset
                            .categoryIndex
                    );

                if (
                    event.target.closest(
                        ".edit-custom-category"
                    )
                ) {

                    renameCustomExpenseCategory(
                        index
                    );

                    return;
                }

                if (
                    event.target.closest(
                        ".delete-custom-category"
                    )
                ) {

                    deleteCustomExpenseCategory(
                        index
                    );

                }

            }
        );


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Escape" &&
                expenseCategoryModal
                    ?.classList
                    .contains(
                        "open"
                    )
            ) {

                closeExpenseCategoryManager();

            }

        }
    );


    addGlobalTransportUnitButton
        ?.addEventListener(
            "click",
            () =>
                addGlobalTransportUnitRow()
        );


    saveGlobalPricingDefaultsButton
        ?.addEventListener(
            "click",
            saveGlobalPricingDefaults
        );


    globalMinimumPayingPax
        ?.addEventListener(
            "input",
            () => {

                globalPricingDefaults.minimumPayingPax =
                    Math.max(
                        1,
                        Number(
                            globalMinimumPayingPax.value
                        ) || 12
                    );

                syncGlobalInheritanceUI();
                updateCostPreview();

            }
        );


    globalDefaultTransportUnit
        ?.addEventListener(
            "change",
            () => {

                globalPricingDefaults.defaultTransportUnitId =
                    globalDefaultTransportUnit.value;

                updateGlobalUnitPreview();
                updateCostPreview();

            }
        );


    useGlobalMinimumPax
        ?.addEventListener(
            "change",
            () => {

                syncGlobalInheritanceUI();
                updateCostPreview();
                setUnsavedChanges(true);

            }
        );


    useGlobalTransportUnit
        ?.addEventListener(
            "change",
            () => {

                syncGlobalInheritanceUI();
                refreshTransportPreviewOptions();
                updateCostPreview();
                setUnsavedChanges(true);

            }
        );


    privateTourEnabled
        ?.addEventListener(
            "change",
            () =>
                setUnsavedChanges(
                    true
                )
        );


    minimumPayingPax
        ?.addEventListener(
            "input",
            () => {

                updateCostPreview();

                setUnsavedChanges(
                    true
                );

            }
        );


    markupPerPaxPerDay
        ?.addEventListener(
            "input",
            () => {

                updateCostPreview();

                setUnsavedChanges(
                    true
                );

            }
        );


    previewPax
        ?.addEventListener(
            "input",
            updateCostPreview
        );


    previewTransportUnit
        ?.addEventListener(
            "change",
            updateCostPreview
        );


    packageBreakdownForm
        ?.addEventListener(
            "submit",
            savePackageBreakdown
        );


    window.addEventListener(
        "beforeunload",
        event => {

            if (
                !hasUnsavedChanges
            ) {

                return;

            }

            event.preventDefault();

            event.returnValue =
                "";

        }
    );

}


// ======================================================
// BROWSER HISTORY / BFCache RESET
// Some browsers restore previous <select> values automatically.
// Keep Package Option blank unless the admin actively selects it.
// ======================================================

window.addEventListener(
    "pageshow",
    event => {

        if (event.persisted) {
            resetPackageSelection();
        }

    }
);


// ======================================================
// ESCAPE HTML
// ======================================================

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
