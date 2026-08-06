/* ==========================================================
   HOME
========================================================== */

const customerName = document.getElementById("customerName");

/* ==========================================================
   TEMP USER
========================================================== */

customerName.textContent = "Eric";

/* ==========================================================
   SEARCH
========================================================== */

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {

    console.log(searchInput.value);

});
