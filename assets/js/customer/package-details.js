/* ==========================================================
   PACKAGE DATABASE
========================================================== */

const packages = {

    jomalig: {

        name: "Jomalig Island",

        category: "Beach Tour",

        location: "Quezon, Philippines",

        price: "₱4,699",

        days: "3 Days",

        nights: "2 Nights",

        image: "../../assets/images/jomalig.jpeg",

        description:
            "Enjoy a relaxing island getaway in Jomalig Island with beautiful beaches, island attractions, and an organized tour experience.",

        inclusions: [

            "Roundtrip transportation",

            "Roundtrip boat transfer",

            "Accommodation",

            "Tour coordinator",

            "Environmental fees",

            "Tourism and registration fees"

        ],

        schedule:
            "Weekend Schedule • Friday to Sunday"

    },


    baguio: {

        name: "Baguio Tour",

        category: "City Tour",

        location: "Benguet, Philippines",

        price: "₱2,799",

        days: "2 Days",

        nights: "1 Night",

        image: "../../assets/images/baguio.jpeg",

        description:
            "Explore the City of Pines and enjoy a relaxing city tour around Baguio.",

        inclusions: [

            "Roundtrip transportation",

            "Accommodation",

            "Tour coordinator",

            "Tour assistance"

        ],

        schedule:
            "2D1N Baguio City Tour"

    },


    calaguas: {

        name: "Calaguas Island",

        category: "Beach Tour",

        location: "Camarines Norte, Philippines",

        price: "₱5,799",

        days: "3 Days",

        nights: "2 Nights",

        image: "../../assets/images/calaguas.jpeg",

        description:
            "Experience the beautiful beaches and island scenery of Calaguas.",

        inclusions: [

            "Roundtrip transportation",

            "Boat transfer",

            "Accommodation",

            "Tour coordinator",

            "Environmental fees"

        ],

        schedule:
            "3D2N Calaguas Island Tour"

    }

};


/* ==========================================================
   GET PACKAGE ID
========================================================== */

const params = new URLSearchParams(
    window.location.search
);

const packageId =
    params.get("id") || "jomalig";


/* ==========================================================
   GET PACKAGE
========================================================== */

const packageData =
    packages[packageId];


/* ==========================================================
   DISPLAY PACKAGE
========================================================== */

if (packageData) {

    document.getElementById("packageImage").src =
        packageData.image;

    document.getElementById("packageImage").alt =
        packageData.name;

    document.getElementById("packageCategory").textContent =
        packageData.category;

    document.getElementById("packageName").textContent =
        packageData.name;

    document.getElementById("packageLocation").textContent =
        packageData.location;

    document.getElementById("packagePrice").textContent =
        packageData.price;

    document.getElementById("packageDays").textContent =
        packageData.days;

    document.getElementById("packageNights").textContent =
        packageData.nights;

    document.getElementById("packageDescription").textContent =
        packageData.description;

    document.getElementById("packageSchedule").textContent =
        packageData.schedule;


    const inclusionList =
        document.getElementById("packageInclusions");


    inclusionList.innerHTML = "";


    packageData.inclusions.forEach(item => {

        const li =
            document.createElement("li");

        li.textContent = item;

        inclusionList.appendChild(li);

    });


    /* BOOK NOW */

    document.getElementById("bookButton")
        .addEventListener("click", () => {

            window.location.href =
                `booking.html?package=${packageId}`;

        });

}
