/* =========================================================
   TRIPS WONDER TRAVEL AND TOURS
   TOUR PRICING CALCULATOR

   FILE:
   assets/js/admin/tour-pricing.js
========================================================= */

(() => {
  "use strict";


  /* =======================================================
     ELEMENTS
  ======================================================= */

  const panels = document.querySelectorAll(".pricing-panel");
  const steps = document.querySelectorAll(".pricing-step");

  const expectedPaxInput =
    document.getElementById("expectedPax");

  const expenseExpectedPax =
    document.getElementById("expenseExpectedPax");

  const expensePaxLabel =
    document.getElementById("expensePaxLabel");

  const expenseRunningTotal =
    document.getElementById("expenseRunningTotal");

  const expenseGrandTotal =
    document.getElementById("expenseGrandTotal");

  const expenseList =
    document.getElementById("expenseList");


  /* =======================================================
     BUTTONS
  ======================================================= */

  const goToExpenses =
    document.getElementById("goToExpenses");

  const backToDetails =
    document.getElementById("backToDetails");

  const goToPricing =
    document.getElementById("goToPricing");

  const backToExpenses =
    document.getElementById("backToExpenses");

  const goToSummary =
    document.getElementById("goToSummary");

  const backToPricing =
    document.getElementById("backToPricing");

  const addExpenseBtn =
    document.getElementById("addExpenseBtn");

  const addExpenseMobileBtn =
    document.getElementById("addExpenseMobileBtn");


  const targetProfitPerPax =
    document.getElementById("targetProfitPerPax");

  const markupPercent =
    document.getElementById("markupPercent");

  const useOwnSellingPrice =
    document.getElementById("useOwnSellingPrice");

  const ownPriceField =
    document.getElementById("ownPriceField");

  const ownSellingPrice =
    document.getElementById("ownSellingPrice");

  const customSimulatorPax =
    document.getElementById("customSimulatorPax");

  const saveTourPricing =
    document.getElementById("saveTourPricing");


  /* =======================================================
     HELPERS
  ======================================================= */

  function getExpectedPax() {

    const value =
      parseInt(expectedPaxInput?.value, 10);

    if (!Number.isFinite(value) || value < 1) {
      return 1;
    }

    return value;
  }


  function getNumber(value) {

    const number =
      parseFloat(value);

    if (!Number.isFinite(number) || number < 0) {
      return 0;
    }

    return number;
  }


  function formatMoney(value) {

    const amount =
      Number.isFinite(value)
        ? value
        : 0;

    return new Intl.NumberFormat(
      "en-PH",
      {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    ).format(amount);

  }


  /* =======================================================
     STEP NAVIGATION
  ======================================================= */

  function showStep(stepNumber) {

    panels.forEach((panel, index) => {

      panel.classList.toggle(
        "active",
        index === stepNumber - 1
      );

    });


    steps.forEach((step, index) => {

      step.classList.toggle(
        "active",
        index === stepNumber - 1
      );

    });


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  /* =======================================================
     UPDATE PAX DISPLAY
  ======================================================= */

  function updatePaxDisplays() {

    const pax =
      getExpectedPax();


    if (expenseExpectedPax) {
      expenseExpectedPax.textContent = pax;
    }


    if (expensePaxLabel) {
      expensePaxLabel.textContent = pax;
    }


    /*
      Update disabled Per Pax quantity
      fields automatically.
    */

    document
      .querySelectorAll(".expense-row")
      .forEach(row => {

        const type =
          row.querySelector(".expense-type");

        const capacity =
          row.querySelector(".expense-capacity");


        if (
          type &&
          capacity &&
          type.value === "perPax"
        ) {

          capacity.value = pax;

        }

      });

  }


  /* =======================================================
     CONFIGURE EXPENSE ROW
  ======================================================= */

  function configureExpenseRow(row) {

    const typeSelect =
      row.querySelector(".expense-type");

    const capacityInput =
      row.querySelector(".expense-capacity");

    const capacityWrapper =
      capacityInput?.closest(".capacity-input");

    const suffix =
      capacityWrapper?.querySelector("span");

    const capacityField =
      capacityInput?.closest(".expense-field");


    if (
      !typeSelect ||
      !capacityInput
    ) {
      return;
    }


    const type =
      typeSelect.value;

    const pax =
      getExpectedPax();


    /* FIXED COST */

    if (type === "fixed") {

      capacityInput.disabled = true;
      capacityInput.value = 1;

      if (suffix) {
        suffix.textContent = "qty";
      }

      if (capacityField) {
        capacityField.dataset.label = "Quantity";
      }

    }


    /* PER PAX */

    else if (type === "perPax") {

      capacityInput.disabled = true;
      capacityInput.value = pax;

      if (suffix) {
        suffix.textContent = "pax";
      }

      if (capacityField) {
        capacityField.dataset.label = "Guests";
      }

    }


    /* CAPACITY */

    else if (type === "capacity") {

      capacityInput.disabled = false;

      if (
        getNumber(capacityInput.value) < 1
      ) {
        capacityInput.value = 1;
      }

      if (suffix) {
        suffix.textContent = "pax";
      }

      if (capacityField) {
        capacityField.dataset.label = "Capacity";
      }

    }

  }


  /* =======================================================
     CALCULATE SINGLE EXPENSE ROW
  ======================================================= */

  function calculateExpenseRow(row) {

    const typeSelect =
      row.querySelector(".expense-type");

    const amountInput =
      row.querySelector(".expense-amount");

    const capacityInput =
      row.querySelector(".expense-capacity");

    const totalDisplay =
      row.querySelector(".expense-total");


    if (
      !typeSelect ||
      !amountInput ||
      !capacityInput ||
      !totalDisplay
    ) {
      return 0;
    }


    const type =
      typeSelect.value;

    const amount =
      getNumber(amountInput.value);

    const pax =
      getExpectedPax();

    let total = 0;


    /* ---------------------------------------
       FIXED COST
    --------------------------------------- */

    if (type === "fixed") {

      total = amount;

    }


    /* ---------------------------------------
       PER PAX
    --------------------------------------- */

    else if (type === "perPax") {

      total =
        amount * pax;

    }


    /* ---------------------------------------
       PER UNIT / CAPACITY

       Example:

       12 pax capacity
       12 guests = 1 van
       13 guests = 2 vans
       24 guests = 2 vans
       25 guests = 3 vans
    --------------------------------------- */

    else if (type === "capacity") {

      const capacity =
        Math.max(
          1,
          getNumber(capacityInput.value)
        );

      const unitsNeeded =
        Math.ceil(
          pax / capacity
        );

      total =
        amount * unitsNeeded;

    }


    totalDisplay.textContent =
      formatMoney(total);


    return total;

  }


  /* =======================================================
     CALCULATE ALL EXPENSES
  ======================================================= */

  function calculateExpenses() {

    updatePaxDisplays();


    let grandTotal = 0;


    document
      .querySelectorAll(".expense-row")
      .forEach(row => {

        configureExpenseRow(row);

        grandTotal +=
          calculateExpenseRow(row);

      });


    if (expenseRunningTotal) {

      expenseRunningTotal.textContent =
        formatMoney(grandTotal);

    }


    if (expenseGrandTotal) {

      expenseGrandTotal.textContent =
        formatMoney(grandTotal);

    }


    return grandTotal;

  }


  /* =======================================================
     EXPENSE COST FOR ANY PAX
     Used by the Pax Pricing Simulator.
  ======================================================= */

  function getExpenseTotalForPax(row, pax) {

    const typeSelect =
      row.querySelector(".expense-type");

    const amountInput =
      row.querySelector(".expense-amount");

    const capacityInput =
      row.querySelector(".expense-capacity");


    if (
      !typeSelect ||
      !amountInput ||
      !capacityInput
    ) {
      return 0;
    }


    const type =
      typeSelect.value;

    const amount =
      getNumber(amountInput.value);


    if (type === "fixed") {
      return amount;
    }


    if (type === "perPax") {
      return amount * pax;
    }


    if (type === "capacity") {

      const capacity =
        Math.max(
          1,
          getNumber(capacityInput.value)
        );

      return (
        amount *
        Math.ceil(pax / capacity)
      );

    }


    return 0;

  }


  function getTotalCostForPax(pax) {

    let total = 0;

    document
      .querySelectorAll(".expense-row")
      .forEach(row => {

        total +=
          getExpenseTotalForPax(
            row,
            pax
          );

      });

    return total;

  }


  /* =======================================================
     PRICING CALCULATION
  ======================================================= */

  function getSuggestedSellingPrice() {

    const pax =
      getExpectedPax();

    const totalCost =
      getTotalCostForPax(pax);

    const costPerPax =
      totalCost / pax;

    const targetProfit =
      getNumber(
        targetProfitPerPax?.value
      );

    const markup =
      getNumber(
        markupPercent?.value
      );

    return (
      costPerPax +
      targetProfit +
      (
        costPerPax *
        markup /
        100
      )
    );

  }


  function getFinalSellingPrice() {

    const suggestedPrice =
      getSuggestedSellingPrice();


    if (
      useOwnSellingPrice?.checked
    ) {

      const ownPrice =
        getNumber(
          ownSellingPrice?.value
        );


      if (ownPrice > 0) {
        return ownPrice;
      }

    }


    return suggestedPrice;

  }


  function calculatePricing() {

    const pax =
      getExpectedPax();

    const totalCost =
      getTotalCostForPax(pax);

    const costPerPax =
      totalCost / pax;

    const suggestedPrice =
      getSuggestedSellingPrice();

    const finalPrice =
      getFinalSellingPrice();

    const revenue =
      finalPrice * pax;

    const profit =
      revenue - totalCost;

    const profitPerPax =
      profit / pax;


    const pricingTotalCost =
      document.getElementById(
        "pricingTotalCost"
      );

    const pricingExpectedPax =
      document.getElementById(
        "pricingExpectedPax"
      );

    const pricingCostPerPax =
      document.getElementById(
        "pricingCostPerPax"
      );

    const suggestedSellingPrice =
      document.getElementById(
        "suggestedSellingPrice"
      );

    const finalSellingPrice =
      document.getElementById(
        "finalSellingPrice"
      );

    const expectedRevenue =
      document.getElementById(
        "expectedRevenue"
      );

    const estimatedProfit =
      document.getElementById(
        "estimatedProfit"
      );

    const actualProfitPerPax =
      document.getElementById(
        "actualProfitPerPax"
      );


    if (pricingTotalCost) {
      pricingTotalCost.textContent =
        formatMoney(totalCost);
    }

    if (pricingExpectedPax) {
      pricingExpectedPax.textContent =
        pax;
    }

    if (pricingCostPerPax) {
      pricingCostPerPax.textContent =
        formatMoney(costPerPax);
    }

    if (suggestedSellingPrice) {
      suggestedSellingPrice.textContent =
        formatMoney(suggestedPrice);
    }

    if (finalSellingPrice) {
      finalSellingPrice.textContent =
        formatMoney(finalPrice);
    }

    if (expectedRevenue) {
      expectedRevenue.textContent =
        formatMoney(revenue);
    }

    if (estimatedProfit) {
      estimatedProfit.textContent =
        formatMoney(profit);
    }

    if (actualProfitPerPax) {
      actualProfitPerPax.textContent =
        formatMoney(profitPerPax);
    }


    return {
      pax,
      totalCost,
      costPerPax,
      suggestedPrice,
      finalPrice,
      revenue,
      profit,
      profitPerPax
    };

  }


  function updateOwnPriceVisibility() {

    if (!ownPriceField) {
      return;
    }


    ownPriceField.hidden =
      !useOwnSellingPrice?.checked;


    calculatePricing();

  }


  /* =======================================================
     SUMMARY / PAX SIMULATOR
  ======================================================= */

  function getSimulatorPaxValues() {

    const values =
      [10, 12, 14, 16];

    const currentPax =
      getExpectedPax();

    values.push(currentPax);


    const customPax =
      parseInt(
        customSimulatorPax?.value,
        10
      );


    if (
      Number.isFinite(customPax) &&
      customPax > 0
    ) {
      values.push(customPax);
    }


    return [
      ...new Set(values)
    ].sort(
      (a, b) => a - b
    );

  }


  function calculateBreakEvenPax(
    finalPrice
  ) {

    if (finalPrice <= 0) {
      return null;
    }


    /*
      Capacity expenses can jump when another
      van/boat/unit is required, so we test
      each pax count instead of using only
      a simple division formula.
    */

    for (
      let pax = 1;
      pax <= 500;
      pax++
    ) {

      const cost =
        getTotalCostForPax(pax);

      const revenue =
        finalPrice * pax;


      if (revenue >= cost) {
        return pax;
      }

    }


    return null;

  }


  function renderSummary() {

    const pricing =
      calculatePricing();

    const destination =
      document.getElementById(
        "tourDestination"
      )?.value.trim() ||
      "Untitled Tour";

    const duration =
      document.getElementById(
        "tourDuration"
      )?.value ||
      "Duration not set";

    const tourType =
      document.getElementById(
        "tourType"
      )?.value ||
      "Tour";

    const tourDate =
      document.getElementById(
        "tourDate"
      )?.value;


    const summaryDestination =
      document.getElementById(
        "summaryDestination"
      );

    const summaryMeta =
      document.getElementById(
        "summaryMeta"
      );

    const summarySellingPrice =
      document.getElementById(
        "summarySellingPrice"
      );

    const summaryTotalCost =
      document.getElementById(
        "summaryTotalCost"
      );

    const summaryCostPerPax =
      document.getElementById(
        "summaryCostPerPax"
      );

    const summaryRevenue =
      document.getElementById(
        "summaryRevenue"
      );

    const summaryProfit =
      document.getElementById(
        "summaryProfit"
      );


    if (summaryDestination) {
      summaryDestination.textContent =
        destination;
    }


    if (summaryMeta) {

      summaryMeta.textContent =
        `${duration} • ${tourType} • ${pricing.pax} pax` +
        (
          tourDate
            ? ` • ${tourDate}`
            : ""
        );

    }


    if (summarySellingPrice) {
      summarySellingPrice.textContent =
        formatMoney(
          pricing.finalPrice
        );
    }

    if (summaryTotalCost) {
      summaryTotalCost.textContent =
        formatMoney(
          pricing.totalCost
        );
    }

    if (summaryCostPerPax) {
      summaryCostPerPax.textContent =
        formatMoney(
          pricing.costPerPax
        );
    }

    if (summaryRevenue) {
      summaryRevenue.textContent =
        formatMoney(
          pricing.revenue
        );
    }

    if (summaryProfit) {
      summaryProfit.textContent =
        formatMoney(
          pricing.profit
        );
    }


    const simulatorTableBody =
      document.getElementById(
        "simulatorTableBody"
      );


    if (simulatorTableBody) {

      simulatorTableBody.innerHTML =
        "";


      getSimulatorPaxValues()
        .forEach(pax => {

          const totalCost =
            getTotalCostForPax(pax);

          const costPerPax =
            totalCost / pax;

          const revenue =
            pricing.finalPrice *
            pax;

          const profit =
            revenue -
            totalCost;


          const row =
            document.createElement(
              "tr"
            );


          if (
            pax === pricing.pax
          ) {
            row.classList.add(
              "current-scenario"
            );
          }


          row.innerHTML = `
            <td>
              <strong>${pax}</strong>
              ${
                pax === pricing.pax
                  ? "<small>Current</small>"
                  : ""
              }
            </td>

            <td>
              ${formatMoney(totalCost)}
            </td>

            <td>
              ${formatMoney(costPerPax)}
            </td>

            <td>
              ${formatMoney(revenue)}
            </td>

            <td class="${
              profit >= 0
                ? "positive-profit"
                : "negative-profit"
            }">
              ${formatMoney(profit)}
            </td>
          `;


          simulatorTableBody
            .appendChild(row);

        });

    }


    const breakEven =
      calculateBreakEvenPax(
        pricing.finalPrice
      );

    const breakEvenPax =
      document.getElementById(
        "breakEvenPax"
      );

    const breakEvenNote =
      document.getElementById(
        "breakEvenNote"
      );


    if (breakEvenPax) {

      breakEvenPax.textContent =
        breakEven
          ? `${breakEven} pax`
          : "Not reached";

    }


    if (breakEvenNote) {

      breakEvenNote.textContent =
        breakEven
          ? `At ${formatMoney(pricing.finalPrice)} selling price per pax. Capacity-based costs are included.`
          : "Break-even was not reached within 500 pax using the current setup.";

    }

  }


  /* =======================================================
     CREATE NEW EXPENSE ROW
  ======================================================= */

  function createExpenseRow() {

    const row =
      document.createElement("div");

    row.className =
      "expense-row";


    row.innerHTML = `

      <div
        class="expense-field expense-name-field"
        data-label="Expense"
      >

        <input
          type="text"
          class="expense-name"
          placeholder="Example: Entrance Fee"
        />

      </div>


      <div
        class="expense-field"
        data-label="Type"
      >

        <select class="expense-type">

          <option value="fixed">
            Fixed Cost
          </option>

          <option value="perPax">
            Per Pax
          </option>

          <option value="capacity">
            Per Unit / Capacity
          </option>

        </select>

      </div>


      <div
        class="expense-field"
        data-label="Amount"
      >

        <div class="money-input">

          <span>
            ₱
          </span>

          <input
            type="number"
            class="expense-amount"
            min="0"
            step="0.01"
            value="0"
            inputmode="decimal"
          />

        </div>

      </div>


      <div
        class="expense-field"
        data-label="Quantity"
      >

        <div class="capacity-input">

          <input
            type="number"
            class="expense-capacity"
            min="1"
            value="1"
            inputmode="numeric"
            disabled
          />

          <span>
            qty
          </span>

        </div>

      </div>


      <div
        class="expense-total"
        data-label="Total"
      >
        ${formatMoney(0)}
      </div>


      <button
        type="button"
        class="expense-remove-btn"
        aria-label="Remove expense"
      >
        ×
      </button>

    `;


    expenseList.appendChild(row);


    configureExpenseRow(row);

    calculateExpenses();


    /*
      Focus new expense name automatically.
    */

    const nameInput =
      row.querySelector(".expense-name");

    if (nameInput) {
      nameInput.focus();
    }

  }


  /* =======================================================
     EXPENSE LIST EVENTS
  ======================================================= */

  if (expenseList) {

    /*
      INPUT CHANGES
    */

    expenseList.addEventListener(
      "input",
      event => {

        const row =
          event.target.closest(".expense-row");

        if (!row) {
          return;
        }

        calculateExpenses();
        calculatePricing();

      }
    );


    /*
      SELECT CHANGES
    */

    expenseList.addEventListener(
      "change",
      event => {

        const row =
          event.target.closest(".expense-row");

        if (!row) {
          return;
        }


        if (
          event.target.classList.contains(
            "expense-type"
          )
        ) {

          configureExpenseRow(row);

        }


        calculateExpenses();
        calculatePricing();

      }
    );


    /*
      REMOVE EXPENSE
    */

    expenseList.addEventListener(
      "click",
      event => {

        const removeButton =
          event.target.closest(
            ".expense-remove-btn"
          );


        if (!removeButton) {
          return;
        }


        const row =
          removeButton.closest(
            ".expense-row"
          );


        if (row) {

          row.remove();

          calculateExpenses();

        }

      }
    );

  }


  /* =======================================================
     ADD EXPENSE
  ======================================================= */

  addExpenseBtn?.addEventListener(
    "click",
    createExpenseRow
  );


  addExpenseMobileBtn?.addEventListener(
    "click",
    createExpenseRow
  );


  /* =======================================================
     EXPECTED PAX
  ======================================================= */

  expectedPaxInput?.addEventListener(
    "input",
    () => {

      if (
        expectedPaxInput.value !== "" &&
        Number(expectedPaxInput.value) < 1
      ) {

        expectedPaxInput.value = 1;

      }


      calculateExpenses();
      calculatePricing();

    }
  );


  /* =======================================================
     PRICING INPUT EVENTS
  ======================================================= */

  targetProfitPerPax?.addEventListener(
    "input",
    calculatePricing
  );

  markupPercent?.addEventListener(
    "input",
    calculatePricing
  );

  ownSellingPrice?.addEventListener(
    "input",
    calculatePricing
  );

  useOwnSellingPrice?.addEventListener(
    "change",
    updateOwnPriceVisibility
  );

  customSimulatorPax?.addEventListener(
    "input",
    renderSummary
  );


  /* =======================================================
     NAVIGATION BUTTONS
  ======================================================= */

  goToExpenses?.addEventListener(
    "click",
    () => {

      calculateExpenses();

      showStep(2);

    }
  );


  backToDetails?.addEventListener(
    "click",
    () => {

      showStep(1);

    }
  );


  goToPricing?.addEventListener(
    "click",
    () => {

      calculateExpenses();
      calculatePricing();

      showStep(3);

    }
  );


  backToExpenses?.addEventListener(
    "click",
    () => {

      showStep(2);

    }
  );


  goToSummary?.addEventListener(
    "click",
    () => {

      renderSummary();

      showStep(4);

    }
  );


  backToPricing?.addEventListener(
    "click",
    () => {

      showStep(3);

    }
  );


  /* =======================================================
     SAVE
     Database connection will be added separately.
  ======================================================= */

  saveTourPricing?.addEventListener(
    "click",
    () => {

      alert(
        "Tour Pricing is ready. Database saving will be connected next."
      );

    }
  );


  /* =======================================================
     INITIAL CALCULATION
  ======================================================= */

  calculateExpenses();
  calculatePricing();
  updateOwnPriceVisibility();

})();