/* ==========================================================
   HOME
========================================================== */

const customerName = document.getElementById("customerName");

if (customerName) {

    customerName.textContent = "Eric";

}

/* ==========================================================
   SEARCH
========================================================== */

const searchInput = document.getElementById("searchInput");

if (searchInput) {

    searchInput.addEventListener("input", () => {

        console.log(searchInput.value);

    });

}
