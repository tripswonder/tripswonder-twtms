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
    storage,
    ref,
    uploadBytes,
    getDownloadURL
} from "../firebase/firebase-storage.js";


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

        let packageGalleryFiles = [];

        let existingGalleryPhotos = [];

        let accommodationCount = 0;

        let exclusionCount = 0;


        // ======================================================
        // ELEMENTS
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

            element.value =
                value ?? "";

        }


        // ======================================================
        // LOAD PACKAGES
        // ======================================================

        async function loadPackages() {

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
                                    data.name ||
                                    "",

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

                                accommodations:
                                    Array.isArray(
                                        data.accommodations
                                    )
                                        ? data.accommodations
                                        : [],

                                itinerary:
                                    data.itinerary ||
                                    "",

                                createdAt:
                                    data.createdAt ||
                                    "",

                                updatedAt:
                                    data.updatedAt ||
                                    "",

                                image:
                                    data.gallery?.[0]
                                        ?.url ||
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


            } catch (error) {

                console.error(
                    "FAILED TO LOAD PACKAGES:",
                    error
                );

            }

        }


        // ======================================================
        // RENDER PACKAGES
        // ======================================================

        function renderPackages() {

            if (!packageGrid) {
                return;
            }


            const searchValue =
                searchInput?.value
                    ?.trim()
                    .toLowerCase() ||
                "";


            const selectedCategory =
                categoryFilter?.value ||
                "all";


            const filteredPackages =
                packages.filter(
                    packageItem => {

                        const matchesSearch =
                            (
                                packageItem.name ||
                                ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchValue
                                );


                        const matchesCategory =
                            selectedCategory ===
                                "all" ||
                            packageItem.category ===
                                selectedCategory;


                        return (
                            matchesSearch &&
                            matchesCategory
                        );

                    }
                );


            packageGrid.innerHTML =
                "";


            if (
                filteredPackages.length ===
                0
            ) {

                packageGrid.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-state-icon">
                            📦
                        </div>

                        <h3>
                            No packages found
                        </h3>

                        <p>
                            Try another search or category.
                        </p>

                    </div>

                `;

                return;
            }


            filteredPackages.forEach(
                packageItem => {

                    const card =
                        document.createElement(
                            "article"
                        );


                    card.className =
                        "package-card";


                    card.innerHTML = `

                        <img
                            class="package-card-image"
                            src="${escapeHtml(
                                packageItem
                                    .gallery?.[0]
                                    ?.url || ""
                            )}"
                            alt="${escapeHtml(
                                packageItem.name
                            )}"
                        >


                        <div class="package-card-content">


                            <span
                                class="package-category"
                            >
                                ${escapeHtml(
                                    packageItem.category
                                )}
                            </span>


                            <h3>
                                ${escapeHtml(
                                    packageItem.name
                                )}
                            </h3>


                            <p
                                class="package-location"
                            >
                                ${escapeHtml(
                                    packageItem.location
                                )}
                            </p>


                            <div
                                class="package-price"
                            >
                                From
                                ${escapeHtml(
                                    packageItem.price
                                )}
                            </div>


                            <div
                                class="package-card-footer"
                            >


                                <span
                                    class="status ${escapeHtml(
                                        packageItem.status
                                    )}"
                                >

                                    ●

                                    ${
                                        packageItem.status ===
                                        "active"
                                            ? "Active"
                                            : "Hidden"
                                    }

                                </span>


                                <div
                                    class="card-actions"
                                >


                                    <button
                                        class="card-action edit-package-btn"
                                        type="button"
                                        title="Edit"
                                        data-id="${escapeHtml(
                                            packageItem.id
                                        )}"
                                    >
                                        ✏️
                                    </button>


                                    <button
                                        class="card-action"
                                        type="button"
                                        title="More"
                                    >
                                        ⋮
                                    </button>


                                </div>


                            </div>


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


            packageModal.classList.remove(
                "show"
            );


            document.body.style.overflow =
                "";

        }


        // ======================================================
        // ADD EMPTY DYNAMIC ROW
        // ======================================================

        function addEmptyDynamicRow(
            container,
            placeholder
        ) {

            if (!container) {
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
                    placeholder="${escapeHtml(
                        placeholder
                    )}"
                >

                <button
                    type="button"
                    class="remove-row"
                    title="Remove"
                >
                    ×
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
                        container.children
                            .length === 0
                    ) {

                        addEmptyDynamicRow(
                            container,
                            placeholder
                        );

                    }

                }
            );


            container.appendChild(
                row
            );

        }


        // ======================================================
        // RESET PACKAGE FORM
        // ======================================================

        function resetPackageForm() {

            editingPackageId =
                null;


            if (packageForm) {
                packageForm.reset();
            }


            setInputValue(
                "formStatus",
                "active"
            );


            // INCLUSIONS

            if (inclusionsList) {

                inclusionsList.innerHTML =
                    "";

                addInclusionRow();

            }


            // EXCLUSIONS

            if (exclusionsList) {

                exclusionsList.innerHTML =
                    "";

                exclusionCount =
                    0;

                addExclusionItem();

            }


            // ACCOMMODATIONS

            if (accommodationList) {

                accommodationList.innerHTML =
                    "";

            }


            accommodationCount =
                0;


            // GALLERY

            packageGalleryFiles =
                [];

            existingGalleryPhotos =
                [];


            if (packagePhotos) {

                packagePhotos.value =
                    "";

            }


            renderPackageGallery();

        }


        // ======================================================
        // NEW PACKAGE
        // ======================================================

        function openNewPackageModal() {

            resetPackageForm();

            openPackageModal();

        }


        // ======================================================
        // INCLUSIONS
        // ======================================================

        function addInclusionRow(
            value = ""
        ) {

            if (!inclusionsList) {
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
                    title="Remove"
                >
                    ×
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

            if (!exclusionsList) {
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
                >
                    ×
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

            if (!exclusionsList) {
                return;
            }


            const items =
                exclusionsList.querySelectorAll(
                    ".dynamic-row"
                );


            items.forEach(
                (item, index) => {

                    const number =
                        item.querySelector(
                            ".exclusion-number span"
                        );


                    if (number) {

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

            if (!accommodationList) {
                return;
            }


            accommodationCount++;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "accommodation-card";


            // Preserve existing photo

            card.dataset.existingPhoto =
                accommodation.photo ||
                "";


            card.innerHTML = `

                <div
                    class="accommodation-card-header"
                >

                    <strong>
                        Accommodation
                        ${accommodationCount}
                    </strong>


                    <button
                        type="button"
                        class="remove-accommodation"
                    >
                        Remove
                    </button>

                </div>


                <div
                    class="accommodation-grid"
                >

                    <!-- PHOTO -->

                    <div
                        class="accommodation-field full"
                    >

                        <label>
                            Accommodation Photo
                        </label>


                        <div
                            class="accommodation-photo-upload"
                        >

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

                                📷

                                <strong>
                                    Add Accommodation Photo
                                </strong>

                                <small>
                                    Upload a photo of this accommodation
                                </small>

                            </button>


                            <div
                                class="accommodation-photo-preview"
                            ></div>


                        </div>

                    </div>


                    <!-- NAME -->

                    <div
                        class="accommodation-field"
                    >

                        <label>
                            Accommodation Name
                        </label>


                        <input
                            type="text"
                            class="accommodation-name"
                            value="${escapeHtml(
                                accommodation.name ||
                                ""
                            )}"
                            placeholder="e.g. Tent Accommodation"
                        >

                    </div>


                    <!-- CAPACITY -->

                    <div
                        class="accommodation-field"
                    >

                        <label>
                            Capacity
                        </label>


                        <input
                            type="text"
                            class="accommodation-capacity"
                            value="${escapeHtml(
                                accommodation.capacity ||
                                ""
                            )}"
                            placeholder="e.g. Good for 2–4 persons"
                        >

                    </div>


                    <!-- TYPE -->

                    <div
                        class="accommodation-field"
                    >

                        <label>
                            Type
                        </label>


                        <select
                            class="accommodation-type"
                        >

                            <option
                                value="included"
                                ${
                                    accommodation.type ===
                                    "included"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Included
                            </option>


                            <option
                                value="additional"
                                ${
                                    accommodation.type ===
                                    "additional"
                                        ? "selected"
                                        : ""
                                }
                            >
                                Additional
                            </option>

                        </select>

                    </div>


                    <!-- PRICE -->

                    <div
                        class="accommodation-field"
                    >

                        <label>
                            Additional Price
                        </label>


                        <input
                            type="text"
                            class="accommodation-price"
                            value="${escapeHtml(
                                accommodation.price ||
                                "TBD"
                            )}"
                            placeholder="TBD"
                        >

                    </div>


                </div>

            `;


            accommodationList.appendChild(
                card
            );


            // ==================================================
            // PHOTO ELEMENTS
            // ==================================================

            const photoInput =
                card.querySelector(
                    ".accommodation-photo-input"
                );


            const uploadButton =
                card.querySelector(
                    ".accommodation-upload-button"
                );


            const preview =
                card.querySelector(
                    ".accommodation-photo-preview"
                );


            // ==================================================
            // EXISTING PHOTO
            // ==================================================

            if (
                accommodation.photo
            ) {

                preview.innerHTML = `

                    <div
                        class="accommodation-preview-image"
                    >

                        <img
                            src="${escapeHtml(
                                accommodation.photo
                            )}"
                            alt="Accommodation photo"
                        >


                        <button
                            type="button"
                            class="remove-accommodation-photo"
                        >
                            ×
                        </button>

                    </div>

                `;


                uploadButton.style.display =
                    "none";

            }


            // ==================================================
            // UPLOAD BUTTON
            // ==================================================

            uploadButton?.addEventListener(
                "click",
                () => {

                    photoInput?.click();

                }
            );


            // ==================================================
            // NEW PHOTO
            // ==================================================

            photoInput?.addEventListener(
                "change",
                () => {

                    const file =
                        photoInput.files?.[0];


                    if (!file) {
                        return;
                    }


                    const reader =
                        new FileReader();


                    reader.onload =
                        event => {

                            preview.innerHTML = `

                                <div
                                    class="accommodation-preview-image"
                                >

                                    <img
                                        src="${event.target.result}"
                                        alt="Accommodation photo"
                                    >


                                    <button
                                        type="button"
                                        class="remove-accommodation-photo"
                                    >
                                        ×
                                    </button>

                                </div>

                            `;


                            uploadButton.style.display =
                                "none";


                            card.dataset.existingPhoto =
                                "";

                        };


                    reader.readAsDataURL(
                        file
                    );

                }
            );


            // ==================================================
            // REMOVE PHOTO
            // ==================================================

            preview?.addEventListener(
                "click",
                event => {

                    if (
                        !event.target.classList.contains(
                            "remove-accommodation-photo"
                        )
                    ) {
                        return;
                    }


                    photoInput.value =
                        "";


                    preview.innerHTML =
                        "";


                    card.dataset.existingPhoto =
                        "";


                    uploadButton.style.display =
                        "flex";

                }
            );

        }


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


                if (!button) {
                    return;
                }


                const card =
                    button.closest(
                        ".accommodation-card"
                    );


                if (card) {

                    card.remove();

                }

            }
        );


        // ======================================================
        // PACKAGE GALLERY
        // ======================================================

        function renderPackageGallery() {

            if (!photoPreviewGrid) {
                return;
            }


            photoPreviewGrid.innerHTML =
                "";


            // ==================================================
            // EXISTING FIREBASE PHOTOS
            // ==================================================

            existingGalleryPhotos.forEach(
                (photo, index) => {

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
                        >
                            ×
                        </button>

                    `;


                    photoPreviewGrid.appendChild(
                        item
                    );

                }
            );


            // ==================================================
            // NEW PHOTOS
            // ==================================================

            packageGalleryFiles.forEach(
                (file, index) => {

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


                            item.innerHTML = `

                                <img
                                    src="${event.target.result}"
                                    alt="New Package Photo"
                                >


                                ${
                                    existingGalleryPhotos.length ===
                                        0 &&
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
                                    class="remove-photo new-photo"
                                    data-index="${index}"
                                    title="Remove photo"
                                >
                                    ×
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


                        if (duplicate) {
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


                // Allow same file to be selected again

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


                if (!removeButton) {
                    return;
                }


                // Existing Firebase photo

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


                // New photo

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


            if (!packageItem) {

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
                packageItem.duration
            );


            setInputValue(
                "formDescription",
                packageItem.description
            );


            setInputValue(
                "formStatus",
                packageItem.status ||
                "active"
            );


            setInputValue(
                "formSchedule",
                packageItem.itinerary
            );


            // ==================================================
            // RESET GALLERY STATE
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


            if (packagePhotos) {

                packagePhotos.value =
                    "";

            }


            // ==================================================
            // LOAD INCLUSIONS
            // ==================================================

            if (inclusionsList) {

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
            // LOAD EXCLUSIONS
            // ==================================================

            if (exclusionsList) {

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
            // LOAD ACCOMMODATIONS
            // ==================================================

            if (accommodationList) {

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


            // ==================================================
            // RENDER GALLERY
            // ==================================================

            renderPackageGallery();


            // ==================================================
            // OPEN MODAL
            // ==================================================

            openPackageModal();

        }


        // ======================================================
        // EDIT BUTTON EVENT
        // ======================================================

        packageGrid?.addEventListener(
            "click",
            event => {

                const editButton =
                    event.target.closest(
                        ".edit-package-btn"
                    );


                if (!editButton) {
                    return;
                }


                editPackage(
                    editButton.dataset.id
                );

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


        // ======================================================
        // CLOSE BUTTONS
        // ======================================================

        closePackageModal?.addEventListener(
            "click",
            closeModal
        );


        cancelPackage?.addEventListener(
            "click",
            closeModal
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
                    packageModal?.classList.contains(
                        "show"
                    )
                ) {

                    closeModal();

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

                // Prevent double-submit.

                if (saveButton?.disabled) {
                    return;
                }


                // ==============================================
                // BASIC INFORMATION
                // ==============================================

                const packageData = {

                    name:
                        getInputValue(
                            "formPackageName"
                        ),

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
                        getInputValue(
                            "formPrice"
                        ),

                    duration:
                        getInputValue(
                            "formDuration"
                        ),

                    description:
                        getInputValue(
                            "formDescription"
                        ),

                    status:
                        document.getElementById(
                            "formStatus"
                        )?.value ||
                        "active",

                    inclusions:
                        collectInclusions(),

                    exclusions:
                        collectExclusions(),

                    accommodations:
                        [],

                    itinerary:
                        getInputValue(
                            "formSchedule"
                        )

                };


                // ==============================================
                // VALIDATION
                // ==============================================

                if (!packageData.name) {

                    alert(
                        "Please enter a package name."
                    );

                    return;

                }


                if (!packageData.category) {

                    alert(
                        "Please select a package category."
                    );

                    return;

                }


                // ==============================================
                // LOCK SAVE BUTTON
                // ==============================================

                const originalSaveText =
                    saveButton?.innerHTML ||
                    "Save Package";


                if (saveButton) {

                    saveButton.disabled = true;

                    saveButton.innerHTML = `
                        <span class="save-loading-spinner"></span>
                        Saving...
                    `;

                }


                try {

                    // ==============================================
                    // CREATE / UPDATE DOCUMENT
                    // ==============================================

                    let packageRef;

                    let packageId;


                    if (editingPackageId) {

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


                    // ==============================================
                    // GALLERY
                    // ==============================================

                    const uploadedGallery = [
                        ...existingGalleryPhotos
                    ];


                    for (
                        const file of
                        packageGalleryFiles
                    ) {

                        const fileName =
                            `${Date.now()}_${file.name}`;


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


                    // ==============================================
                    // ACCOMMODATIONS
                    // ==============================================

                    const accommodationCards =
                        accommodationList
                            ? accommodationList.querySelectorAll(
                                ".accommodation-card"
                            )
                            : [];


                    for (
                        const card of
                        accommodationCards
                    ) {

                        const name =
                            card.querySelector(
                                ".accommodation-name"
                            )?.value
                                ?.trim() ||
                            "";


                        const capacity =
                            card.querySelector(
                                ".accommodation-capacity"
                            )?.value
                                ?.trim() ||
                            "";


                        const type =
                            card.querySelector(
                                ".accommodation-type"
                            )?.value ||
                            "included";


                        const price =
                            card.querySelector(
                                ".accommodation-price"
                            )?.value
                                ?.trim() ||
                            "TBD";


                        let photo =
                            card.dataset
                                .existingPhoto ||
                            "";


                        const photoInput =
                            card.querySelector(
                                ".accommodation-photo-input"
                            );


                        if (
                            photoInput &&
                            photoInput.files &&
                            photoInput.files.length >
                                0
                        ) {

                            const file =
                                photoInput.files[0];


                            const fileName =
                                `${Date.now()}_${file.name}`;


                            const accommodationStorageRef =
                                ref(
                                    storage,
                                    `packages/${packageId}/accommodations/${fileName}`
                                );


                            const snapshot =
                                await uploadBytes(
                                    accommodationStorageRef,
                                    file
                                );


                            photo =
                                await getDownloadURL(
                                    snapshot.ref
                                );

                        }


                        packageData
                            .accommodations
                            .push({

                                name:
                                    name,

                                capacity:
                                    capacity,

                                type:
                                    type,

                                price:
                                    price,

                                photo:
                                    photo

                            });

                    }


                    // ==============================================
                    // FINAL FIRESTORE UPDATE
                    // ==============================================

                    await updateDoc(
                        packageRef,
                        {

                            ...packageData,

                            gallery:
                                uploadedGallery,

                            accommodations:
                                packageData
                                    .accommodations,

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


                    // ==============================================
                    // SUCCESS
                    // ==============================================

                    alert(
                        editingPackageId
                            ? "Package updated successfully!"
                            : "Package created successfully!"
                    );


                    // ==============================================
                    // RESET STATE
                    // ==============================================

                    editingPackageId =
                        null;


                    packageGalleryFiles =
                        [];


                    existingGalleryPhotos =
                        [];


                    if (packagePhotos) {

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
                        "Failed to save package. Please check the Console."
                    );


                } finally {

                    // Always unlock Save.
                    // This prevents the next Add/Edit operation
                    // from inheriting a disabled button.

                    if (saveButton) {

                        saveButton.disabled = false;

                        saveButton.innerHTML =
                            originalSaveText;

                    }

                }

            }
        );


        // ======================================================
        // INITIAL LOAD
        // ======================================================

        loadPackages();

    }
);
