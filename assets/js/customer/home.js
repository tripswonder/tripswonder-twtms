/* ==========================================================
   TRIPS WONDER — CUSTOMER HOME
   DIRECT FIREBASE AUTH VERSION
   ========================================================== */


/* ==========================================================
   FIREBASE CONFIG
   ========================================================== */

import {

    auth,
    db,
    storage

} from "../firebase/firebase-config.js";


import {

    onAuthStateChanged

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {

    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    addDoc,
    arrayUnion

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


import {

    ref as storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";


import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";


/* ==========================================================
   ELEMENTS
   ========================================================== */

const customerName =
    document.getElementById(
        "customerName"
    );


const customerGreeting =
    document.getElementById(
        "customerGreeting"
    );


const headerSearchButton =
    document.getElementById(
        "headerSearchButton"
    );


const searchSection =
    document.getElementById(
        "searchSection"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const searchCloseButton =
    document.getElementById(
        "searchCloseButton"
    );


const tourCategoryList =
    document.getElementById(
        "tourCategoryList"
    );


const exploreTours =
    document.getElementById(
        "exploreTours"
    );


const packageResultText =
    document.getElementById(
        "packageResultText"
    );


const upcomingTripCard =
    document.getElementById(
        "upcomingTripCard"
    );


const noUpcomingTrip =
    document.getElementById(
        "noUpcomingTrip"
    );


const upcomingTripImage =
    document.getElementById(
        "upcomingTripImage"
    );


const upcomingTripCategory =
    document.getElementById(
        "upcomingTripCategory"
    );


const upcomingTripName =
    document.getElementById(
        "upcomingTripName"
    );


const upcomingTripLocation =
    document.getElementById(
        "upcomingTripLocation"
    );


const upcomingTripSchedule =
    document.getElementById(
        "upcomingTripSchedule"
    );


const upcomingTripReference =
    document.getElementById(
        "upcomingTripReference"
    );


const upcomingTripButton =
    document.getElementById(
        "upcomingTripButton"
    );



/* ==========================================================
   PACKAGE DETAILS MODAL ELEMENTS
   ========================================================== */

const packageDetailsModal = document.getElementById("packageDetailsModal");
const packageModalClose = document.getElementById("packageModalClose");
const packageModalGallery = document.getElementById("packageModalGallery");
const packageModalTitle = document.getElementById("packageModalTitle");
const packageModalCategory = document.getElementById("packageModalCategory");
const packageModalName = document.getElementById("packageModalName");
const packageModalLocation = document.getElementById("packageModalLocation");
const packageModalPrice = document.getElementById("packageModalPrice");
const packageModalDuration = document.getElementById("packageModalDuration");
const packageModalAboutSection = document.getElementById("packageModalAboutSection");
const packageModalAbout = document.getElementById("packageModalAbout");
const packageModalInclusionsSection = document.getElementById("packageModalInclusionsSection");
const packageModalInclusions = document.getElementById("packageModalInclusions");
const packageModalExclusionsSection = document.getElementById("packageModalExclusionsSection");
const packageModalExclusions = document.getElementById("packageModalExclusions");
const packageModalAccommodationSection = document.getElementById("packageModalAccommodationSection");
const packageModalAccommodations = document.getElementById("packageModalAccommodations");
const packageModalItinerarySection = document.getElementById("packageModalItinerarySection");
const packageModalItinerary = document.getElementById("packageModalItinerary");
const packageModalBookButton = document.getElementById("packageModalBookButton");

let selectedDetailsPackage = null;


/* ==========================================================
   STATE
   ========================================================== */

let currentUser =
    null;


let currentProfile =
    null;


let customerPackages =
    [];


let customerBookings =
    [];


let activeCategory =
    "all";


let currentSearch =
    "";


let customerPosts =
    [];


let customerPostsUnsubscribe =
    null;


let selectedPostFiles =
    [];


/* ==========================================================
   FACEBOOK-STYLE TRAVEL HOME — MOCKUP ELEMENTS
   ========================================================== */

const homeStories = document.getElementById("homeStories");
const tripsWonderFeed = document.getElementById("tripsWonderFeed");
const popularTours = document.getElementById("popularTours");
const upcomingDepartures = document.getElementById("upcomingDepartures");
const homeShortcutTours = document.getElementById("homeShortcutTours");
const twSearchClear = document.getElementById("searchCloseButton");

const openPostComposerButton = document.getElementById("openPostComposer");
const openPostPhotoButton = document.getElementById("openPostPhoto");
const customerPostModal = document.getElementById("customerPostModal");
const customerPostCaption = document.getElementById("customerPostCaption");
const customerPostFiles = document.getElementById("customerPostFiles");
const customerPostPreview = document.getElementById("customerPostPreview");
const choosePostPhotos = document.getElementById("choosePostPhotos");
const publishCustomerPostButton = document.getElementById("publishCustomerPost");
const customerPostMessage = document.getElementById("customerPostMessage");
const postAuthorName = document.getElementById("postAuthorName");



/* ==========================================================
   HELPERS
   ========================================================== */

function normalizeText(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

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


function getPackageImage(
    packageItem
) {

    if (
        Array.isArray(
            packageItem?.gallery
        )
    ) {

        const firstValidImage =
            packageItem.gallery.find(
                item =>
                    typeof item ===
                        "string" ||
                    (
                        item &&
                        item.url
                    )
            );


        if (
            typeof firstValidImage ===
            "string"
        ) {

            return firstValidImage;

        }


        if (
            firstValidImage?.url
        ) {

            return firstValidImage.url;

        }

    }


    return (
        packageItem?.image ||
        ""
    );

}


function getPackageDuration(
    packageItem
) {

    return String(
        packageItem?.duration ||
        ""
    ).trim();

}


function toDate(
    value
) {

    if (!value) {
        return null;
    }


    if (
        typeof value?.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    const date =
        value instanceof Date
            ? value
            : new Date(
                value
            );


    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

}


function formatDate(
    value
) {

    const date =
        toDate(
            value
        );


    if (!date) {
        return "";
    }


    return date.toLocaleDateString(
        "en-PH",
        {
            month:
                "short",

            day:
                "numeric",

            year:
                "numeric"
        }
    );

}


/* ==========================================================
   CUSTOMER DISPLAY NAME
   ========================================================== */

function getDisplayName(
    user,
    profile
) {

    const candidates = [

        profile?.firstName,
        profile?.firstname,
        profile?.givenName,
        profile?.displayName,
        profile?.fullName,
        profile?.name,
        profile?.customerName,
        user?.displayName

    ];


    const selected =
        candidates.find(
            value =>
                String(
                    value ||
                    ""
                ).trim()
        );


    if (selected) {

        return String(
            selected
        )
            .trim()
            .split(/\s+/)[0];

    }


    const email =
        String(
            user?.email ||
            profile?.email ||
            ""
        ).trim();


    if (email) {

        const emailName =
            email
                .split("@")[0]
                .replace(
                    /[._-]+/g,
                    " "
                )
                .trim();


        return emailName
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );

    }


    return "Traveler";

}



function getCustomerAvatarUrl(
    profile = currentProfile,
    user = currentUser
) {

    const candidates = [
        profile?.profilePhotoUrl,
        profile?.profilePhoto,
        profile?.photoURL,
        profile?.photoUrl,
        profile?.avatarUrl,
        profile?.avatar,
        profile?.imageUrl,
        user?.photoURL
    ];

    return String(
        candidates.find(
            value => String(value || "").trim()
        ) || ""
    ).trim();

}


function renderCustomerAvatars() {

    const avatarUrl =
        getCustomerAvatarUrl();

    document
        .querySelectorAll(
            "[data-customer-avatar]"
        )
        .forEach(
            holder => {

                if (!avatarUrl) {

                    holder.innerHTML =
                        '<i class="fa-solid fa-user"></i>';

                    return;

                }

                holder.innerHTML = `
                    <img
                        src="${escapeHtml(avatarUrl)}"
                        alt=""
                        loading="lazy">
                `;

            }
        );

}


function renderCustomerProfile() {

    renderCustomerAvatars();

    if (
        customerName
    ) {

        customerName.textContent =
            getDisplayName(
                currentUser,
                currentProfile
            );

    }


    if (
        customerGreeting
    ) {

        customerGreeting.textContent =
            "Ready for your next adventure?";

    }

}


/* ==========================================================
   SEARCH
   ========================================================== */

function openSearch() {

    if (!searchSection) {
        return;
    }


    searchSection.hidden =
        false;


    requestAnimationFrame(
        () => {

            searchInput?.focus();

        }
    );

}


function closeSearch() {

    if (!searchSection) {
        return;
    }


    searchSection.hidden =
        true;


    if (
        searchInput
    ) {

        searchInput.value =
            "";

    }


    currentSearch =
        "";


    renderCustomerPackages();

}


headerSearchButton
    ?.addEventListener(
        "click",
        openSearch
    );


searchCloseButton
    ?.addEventListener(
        "click",
        closeSearch
    );


searchInput
    ?.addEventListener(
        "input",
        event => {

            currentSearch =
                normalizeText(
                    event.target.value
                );


            renderCustomerPackages();

            renderApprovedHomeMockup();

            if (twSearchClear) {
                twSearchClear.hidden = !currentSearch;
            }

        }
    );


/* ==========================================================
   LOAD PROFILE
   ========================================================== */

async function loadCurrentProfile(
    user
) {

    const profileSnapshot =
        await getDoc(
            doc(
                db,
                "users",
                user.uid
            )
        );


    if (
        !profileSnapshot.exists()
    ) {

        throw new Error(
            "Customer profile was not found."
        );

    }


    return {

        uid:
            user.uid,

        ...profileSnapshot.data()

    };

}


/* ==========================================================
   LOAD ACTIVE PACKAGES
   ========================================================== */

async function loadCustomerPackages() {

    console.log(
        "HOME: Loading packages..."
    );


    const snapshot =
        await getDocs(
            collection(
                db,
                "packages"
            )
        );


    customerPackages =
        snapshot.docs
            .map(
                packageDoc => ({

                    id:
                        packageDoc.id,

                    ...packageDoc.data()

                })
            )
            .filter(
                packageItem => {

                    return (
                        normalizeText(
                            packageItem.status ||
                            "active"
                        ) ===
                        "active"
                    );

                }
            );


    console.log(
        "HOME ACTIVE PACKAGES:",
        customerPackages.length
    );


    populateCategories();

    renderCustomerPackages();

    renderApprovedHomeMockup();

}


/* ==========================================================
   CATEGORY FILTER
   ========================================================== */

function populateCategories() {

    if (!tourCategoryList) {
        return;
    }


    const categories =
        [
            ...new Set(
                customerPackages
                    .map(
                        packageItem =>
                            String(
                                packageItem.category ||
                                ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ]
            .sort(
                (
                    a,
                    b
                ) =>
                    a.localeCompare(
                        b
                    )
            );


    tourCategoryList.innerHTML = `
        <button
            type="button"
            class="tour-category-btn active"
            data-category="all"
        >
            All
        </button>
    `;


    categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "tour-category-btn";


            button.dataset.category =
                category;


            button.textContent =
                category;


            tourCategoryList.appendChild(
                button
            );

        }
    );


    tourCategoryList
        .querySelectorAll(
            ".tour-category-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        activeCategory =
                            button.dataset.category ||
                            "all";


                        tourCategoryList
                            .querySelectorAll(
                                ".tour-category-btn.active"
                            )
                            .forEach(
                                activeButton =>
                                    activeButton.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add(
                            "active"
                        );


                        renderCustomerPackages();

                    }
                );

            }
        );

}


/* ==========================================================
   PACKAGE FILTER
   ========================================================== */

function getVisiblePackages() {

    return customerPackages.filter(
        packageItem => {

            const matchesCategory =
                activeCategory ===
                    "all" ||
                String(
                    packageItem.category ||
                    ""
                ) ===
                    activeCategory;


            const searchable =
                [
                    packageItem.name,
                    packageItem.location,
                    packageItem.category,
                    packageItem.duration,
                    packageItem.code,
                    packageItem.description
                ]
                    .join(
                        " "
                    )
                    .toLowerCase();


            const matchesSearch =
                !currentSearch ||
                searchable.includes(
                    currentSearch
                );


            return (
                matchesCategory &&
                matchesSearch
            );

        }
    );

}






/* ==========================================================
   CENTRALIZED BRANDING — ADMIN PAGE SETUP
   Source: systemSettings/general.businessLogo
   ========================================================== */

const DEFAULT_BUSINESS_LOGO =
    "../../assets/images/logo.png";

let currentBusinessLogo =
    DEFAULT_BUSINESS_LOGO;


function applyBusinessLogo(
    logoUrl = DEFAULT_BUSINESS_LOGO
) {

    currentBusinessLogo =
        String(
            logoUrl ||
            DEFAULT_BUSINESS_LOGO
        ).trim() ||
        DEFAULT_BUSINESS_LOGO;


    document
        .querySelectorAll(
            "[data-business-logo]"
        )
        .forEach(
            image => {

                if (
                    image.tagName !==
                    "IMG"
                ) {
                    return;
                }


                image.src =
                    currentBusinessLogo;


                image.onerror =
                    () => {

                        image.onerror =
                            null;

                        image.src =
                            DEFAULT_BUSINESS_LOGO;

                    };

            }
        );

}


function startBusinessBrandingListener() {

    const settingsRef =
        doc(
            db,
            "systemSettings",
            "general"
        );


    return onSnapshot(
        settingsRef,
        snapshot => {

            const settings =
                snapshot.exists()
                    ? snapshot.data()
                    : {};


            applyBusinessLogo(
                settings.businessLogo ||
                DEFAULT_BUSINESS_LOGO
            );

        },
        error => {

            console.error(
                "HOME BRANDING ERROR:",
                error
            );


            applyBusinessLogo(
                DEFAULT_BUSINESS_LOGO
            );

        }
    );

}


applyBusinessLogo();
startBusinessBrandingListener();


/* ==========================================================
   APPROVED HOME MOCKUP RENDERERS
   ========================================================== */

function getPackageScheduleText(packageItem) {

    const direct =
        packageItem?.travelDate ||
        packageItem?.departureDate ||
        packageItem?.schedule ||
        packageItem?.tourDate ||
        packageItem?.date ||
        "";

    if (direct) {

        const formatted =
            formatDate(direct);

        return formatted || String(direct).trim();

    }

    return getPackageDuration(packageItem) || "Schedule available";

}


function getPackageShortLocation(packageItem) {

    return String(
        packageItem?.location ||
        packageItem?.category ||
        "Philippines"
    ).trim();

}


function renderMockupStories() {

    if (!homeStories) {
        return;
    }

    const createStory =
        homeStories.querySelector(".tw-create-story")?.outerHTML ||
        `
            <button type="button" class="tw-create-story">
                <span><i class="fa-solid fa-plus"></i></span>
                <strong>Create<br>story</strong>
            </button>
        `;

    const packages =
        getVisiblePackages().slice(0, 5);

    homeStories.innerHTML = createStory;

    packages.forEach(
        packageItem => {

            const image =
                getPackageImage(packageItem);

            const card =
                document.createElement("button");

            card.type = "button";
            card.className = "tw-story-card";

            card.innerHTML = `
                ${
                    image
                        ? `
                            <img
                                src="${escapeHtml(image)}"
                                alt="${escapeHtml(packageItem.name || "Tour")}"
                                loading="lazy">
                          `
                        : `
                            <span class="tw-story-placeholder">
                                <i class="fa-solid fa-image"></i>
                            </span>
                          `
                }

                <span class="tw-story-logo">
                    <img src="${escapeHtml(currentBusinessLogo)}" alt="" data-business-logo>
                </span>

                <span class="tw-story-gradient"></span>

                <span class="tw-story-copy">
                    <strong>${escapeHtml(packageItem.name || "Tour Package")}</strong>
                    <small>${escapeHtml(getPackageScheduleText(packageItem))}</small>
                </span>
            `;

            card.addEventListener(
                "click",
                () => openPackageDetails(packageItem)
            );

            homeStories.appendChild(card);

        }
    );

}



/* ==========================================================
   CUSTOMER COMMUNITY POSTS
   ========================================================== */

function getCustomerAuthorName() {

    const first =
        String(
            currentProfile?.firstName ||
            currentProfile?.firstname ||
            currentProfile?.givenName ||
            ""
        ).trim();

    const last =
        String(
            currentProfile?.lastName ||
            currentProfile?.lastname ||
            currentProfile?.surname ||
            ""
        ).trim();

    const full =
        [first, last]
            .filter(Boolean)
            .join(" ")
            .trim();

    return (
        full ||
        String(
            currentProfile?.displayName ||
            currentProfile?.fullName ||
            currentProfile?.name ||
            currentUser?.displayName ||
            getDisplayName(currentUser, currentProfile)
        ).trim() ||
        "Traveler"
    );

}


function setPostMessage(message = "", type = "") {

    if (!customerPostMessage) {
        return;
    }

    customerPostMessage.textContent =
        String(message || "");

    customerPostMessage.dataset.type =
        type || "";

}


function resetPostComposer() {

    selectedPostFiles = [];

    if (customerPostCaption) {
        customerPostCaption.value = "";
    }

    if (customerPostFiles) {
        customerPostFiles.value = "";
    }

    if (customerPostPreview) {
        customerPostPreview.innerHTML = "";
        customerPostPreview.hidden = true;
    }

    setPostMessage("");

}


function openCustomerPostModal(openFiles = false) {

    if (!customerPostModal) {
        return;
    }

    if (postAuthorName) {
        postAuthorName.textContent =
            getCustomerAuthorName();
    }

    customerPostModal.hidden = false;
    document.body.classList.add("tw-modal-open");

    requestAnimationFrame(
        () => {

            if (openFiles) {
                customerPostFiles?.click();
            } else {
                customerPostCaption?.focus();
            }

        }
    );

}


function closeCustomerPostModal() {

    if (!customerPostModal) {
        return;
    }

    customerPostModal.hidden = true;
    document.body.classList.remove("tw-modal-open");
    resetPostComposer();

}


function removeSelectedPostFile(index) {

    selectedPostFiles.splice(index, 1);
    renderSelectedPostFiles();

}


function renderSelectedPostFiles() {

    if (!customerPostPreview) {
        return;
    }

    customerPostPreview.innerHTML = "";

    if (!selectedPostFiles.length) {
        customerPostPreview.hidden = true;
        return;
    }

    customerPostPreview.hidden = false;
    customerPostPreview.className =
        `tw-post-preview tw-post-preview-${Math.min(selectedPostFiles.length, 5)}`;

    selectedPostFiles.forEach(
        (file, index) => {

            const item =
                document.createElement("div");

            item.className =
                "tw-post-preview-item";

            const image =
                document.createElement("img");

            const objectUrl =
                URL.createObjectURL(file);

            image.src =
                objectUrl;

            image.alt =
                `Selected photo ${index + 1}`;

            image.onload =
                () => URL.revokeObjectURL(objectUrl);

            const remove =
                document.createElement("button");

            remove.type =
                "button";

            remove.className =
                "tw-post-preview-remove";

            remove.setAttribute(
                "aria-label",
                `Remove photo ${index + 1}`
            );

            remove.innerHTML =
                '<i class="fa-solid fa-xmark"></i>';

            remove.addEventListener(
                "click",
                () => removeSelectedPostFile(index)
            );

            item.append(
                image,
                remove
            );

            customerPostPreview.appendChild(item);

        }
    );

}


function validatePostFiles(fileList) {

    const incoming =
        Array.from(fileList || []);

    const allowedTypes =
        new Set([
            "image/jpeg",
            "image/png",
            "image/webp"
        ]);

    const valid = [];

    for (const file of incoming) {

        if (!allowedTypes.has(file.type)) {

            setPostMessage(
                "JPG, PNG or WEBP photos only.",
                "error"
            );

            continue;

        }

        if (file.size > 5 * 1024 * 1024) {

            setPostMessage(
                `${file.name} is larger than 5 MB.`,
                "error"
            );

            continue;

        }

        valid.push(file);

    }

    const merged =
        [...selectedPostFiles, ...valid]
            .slice(0, 5);

    if (
        selectedPostFiles.length +
        valid.length >
        5
    ) {

        setPostMessage(
            "Maximum of 5 photos per post.",
            "error"
        );

    } else if (valid.length) {

        setPostMessage("");

    }

    selectedPostFiles =
        merged;

    renderSelectedPostFiles();

}


function getPostFileExtension(file) {

    const type =
        String(file?.type || "");

    if (type === "image/png") {
        return "png";
    }

    if (type === "image/webp") {
        return "webp";
    }

    return "jpg";

}


async function uploadCustomerPostPhotos(postId) {

    const imageUrls = [];
    const imageStoragePaths = [];

    for (
        let index = 0;
        index < selectedPostFiles.length;
        index += 1
    ) {

        const file =
            selectedPostFiles[index];

        const extension =
            getPostFileExtension(file);

        const path =
            `customerPosts/${currentUser.uid}/${postId}/${Date.now()}-${index + 1}.${extension}`;

        const fileRef =
            storageRef(
                storage,
                path
            );

        await uploadBytes(
            fileRef,
            file,
            {
                contentType:
                    file.type
            }
        );

        imageUrls.push(
            await getDownloadURL(fileRef)
        );

        imageStoragePaths.push(path);

    }

    return {
        imageUrls,
        imageStoragePaths
    };

}


async function publishCustomerPost() {

    if (
        !currentUser ||
        !currentProfile ||
        !publishCustomerPostButton
    ) {
        return;
    }

    const caption =
        String(
            customerPostCaption?.value ||
            ""
        ).trim();

    if (
        !caption &&
        !selectedPostFiles.length
    ) {

        setPostMessage(
            "Write something or add at least one photo.",
            "error"
        );

        return;

    }

    if (caption.length > 1500) {

        setPostMessage(
            "Caption is too long.",
            "error"
        );

        return;

    }

    publishCustomerPostButton.disabled =
        true;

    publishCustomerPostButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Posting...';

    setPostMessage(
        selectedPostFiles.length
            ? "Uploading photos..."
            : "Publishing post..."
    );

    const postRef =
        doc(
            collection(
                db,
                "customerPosts"
            )
        );

    let uploadedPaths = [];

    try {

        const uploads =
            await uploadCustomerPostPhotos(
                postRef.id
            );

        uploadedPaths =
            uploads.imageStoragePaths;

        await setDoc(
            postRef,
            {
                authorUid:
                    currentUser.uid,

                authorName:
                    getCustomerAuthorName(),

                authorFirstName:
                    getDisplayName(
                        currentUser,
                        currentProfile
                    ),

                authorPhotoUrl:
                    getCustomerAvatarUrl(),

                caption,

                imageUrls:
                    uploads.imageUrls,

                imageStoragePaths:
                    uploads.imageStoragePaths,

                status:
                    "active",

                createdAt:
                    serverTimestamp(),

                createdAtMs:
                    Date.now(),

                updatedAt:
                    serverTimestamp(),

                reportCount:
                    0,

                warningCount:
                    0
            }
        );

        closeCustomerPostModal();

    } catch (error) {

        console.error(
            "CUSTOMER POST ERROR:",
            error
        );

        for (const path of uploadedPaths) {

            try {
                await deleteObject(
                    storageRef(storage, path)
                );
            } catch (cleanupError) {
                console.warn(
                    "POST PHOTO CLEANUP ERROR:",
                    cleanupError
                );
            }

        }

        setPostMessage(
            "Unable to publish your post. Please try again.",
            "error"
        );

    } finally {

        publishCustomerPostButton.disabled =
            false;

        publishCustomerPostButton.textContent =
            "Post";

    }

}


function startCustomerPostsListener() {

    if (customerPostsUnsubscribe) {
        customerPostsUnsubscribe();
    }

    const activeCustomerPostsQuery =
        query(
            collection(
                db,
                "customerPosts"
            ),
            where(
                "status",
                "==",
                "active"
            )
        );

    customerPostsUnsubscribe =
        onSnapshot(
            activeCustomerPostsQuery,
            snapshot => {

                customerPosts =
                    snapshot.docs
                        .map(
                            postDoc => ({
                                id:
                                    postDoc.id,
                                ...postDoc.data()
                            })
                        )
                        .filter(
                            post =>
                                normalizeText(
                                    post.status ||
                                    "active"
                                ) === "active"
                        )
                        .sort(
                            (a, b) => {

                                const aTime =
                                    Number(
                                        a.createdAtMs ||
                                        a.createdAt?.toMillis?.() ||
                                        0
                                    );

                                const bTime =
                                    Number(
                                        b.createdAtMs ||
                                        b.createdAt?.toMillis?.() ||
                                        0
                                    );

                                return bTime - aTime;

                            }
                        );

                renderMockupFeed();

            },
            error => {

                console.error(
                    "CUSTOMER POSTS LISTENER ERROR:",
                    error
                );

            }
        );

}


function getVisibleCustomerPosts() {

    if (!currentSearch) {
        return customerPosts;
    }

    return customerPosts.filter(
        post => {

            const haystack =
                normalizeText(
                    [
                        post.authorName,
                        post.authorFirstName,
                        post.caption
                    ].join(" ")
                );

            return haystack.includes(
                currentSearch
            );

        }
    );

}


function formatCustomerPostTime(post) {

    const millis =
        Number(
            post?.createdAtMs ||
            post?.createdAt?.toMillis?.() ||
            0
        );

    if (!millis) {
        return "Just now";
    }

    const diff =
        Math.max(
            0,
            Date.now() - millis
        );

    const minute =
        60 * 1000;

    const hour =
        60 * minute;

    const day =
        24 * hour;

    if (diff < minute) {
        return "Just now";
    }

    if (diff < hour) {
        return `${Math.floor(diff / minute)}m`;
    }

    if (diff < day) {
        return `${Math.floor(diff / hour)}h`;
    }

    if (diff < 7 * day) {
        return `${Math.floor(diff / day)}d`;
    }

    return new Date(millis)
        .toLocaleDateString(
            "en-PH",
            {
                month:
                    "short",
                day:
                    "numeric",
                year:
                    new Date(millis).getFullYear() !== new Date().getFullYear()
                        ? "numeric"
                        : undefined
            }
        );

}


async function deleteOwnCustomerPost(post) {

    if (
        !post ||
        !currentUser ||
        post.authorUid !== currentUser.uid
    ) {
        return;
    }

    const confirmed =
        window.confirm(
            "Delete this post?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const paths =
            Array.isArray(
                post.imageStoragePaths
            )
                ? post.imageStoragePaths
                : [];

        for (const path of paths) {

            try {

                await deleteObject(
                    storageRef(
                        storage,
                        path
                    )
                );

            } catch (photoError) {

                console.warn(
                    "DELETE POST PHOTO ERROR:",
                    photoError
                );

            }

        }

        await updateDoc(
            doc(
                db,
                "customerPosts",
                post.id
            ),
            {
                status:
                    "deleted",

                updatedAt:
                    serverTimestamp()
            }
        );

    } catch (error) {

        console.error(
            "DELETE CUSTOMER POST ERROR:",
            error
        );

        window.alert(
            "Unable to delete the post right now."
        );

    }

}


async function toggleCustomerPostLike(post, button) {

    if (
        !currentUser ||
        !post
    ) {
        return;
    }

    const likeRef =
        doc(
            db,
            "customerPosts",
            post.id,
            "likes",
            currentUser.uid
        );

    try {

        const snapshot =
            await getDoc(
                likeRef
            );

        if (snapshot.exists()) {

            await deleteDoc(
                likeRef
            );

            button?.classList.remove(
                "is-liked"
            );

        } else {

            await setDoc(
                likeRef,
                {
                    userUid:
                        currentUser.uid,

                    createdAt:
                        serverTimestamp()
                }
            );

            button?.classList.add(
                "is-liked"
            );

        }

    } catch (error) {

        console.error(
            "LIKE POST ERROR:",
            error
        );

    }

}


async function addCustomerPostComment(post, input, commentsList) {

    if (
        !currentUser ||
        !post ||
        !input
    ) {
        return;
    }

    const text =
        String(
            input.value ||
            ""
        ).trim();

    if (!text) {
        return;
    }

    if (text.length > 500) {
        window.alert(
            "Comment is too long."
        );
        return;
    }

    const commentRef =
        doc(
            collection(
                db,
                "customerPosts",
                post.id,
                "comments"
            )
        );

    try {

        await setDoc(
            commentRef,
            {
                authorUid:
                    currentUser.uid,

                authorName:
                    getCustomerAuthorName(),

                authorPhotoUrl:
                    getCustomerAvatarUrl(),

                text,

                createdAt:
                    serverTimestamp(),

                createdAtMs:
                    Date.now()
            }
        );

        input.value =
            "";

        await loadCustomerPostComments(
            post,
            commentsList
        );

    } catch (error) {

        console.error(
            "COMMENT POST ERROR:",
            error
        );

    }

}


async function loadCustomerPostComments(post, commentsList) {

    if (
        !post ||
        !commentsList
    ) {
        return;
    }

    commentsList.innerHTML =
        '<span class="tw-comments-loading">Loading comments...</span>';

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "customerPosts",
                    post.id,
                    "comments"
                )
            );

        const comments =
            snapshot.docs
                .map(
                    commentDoc => ({
                        id:
                            commentDoc.id,
                        ...commentDoc.data()
                    })
                )
                .sort(
                    (a, b) =>
                        Number(
                            a.createdAtMs ||
                            a.createdAt?.toMillis?.() ||
                            0
                        ) -
                        Number(
                            b.createdAtMs ||
                            b.createdAt?.toMillis?.() ||
                            0
                        )
                )
                .slice(-20);

        if (!comments.length) {

            commentsList.innerHTML =
                '<span class="tw-comments-empty">No comments yet.</span>';

            return;

        }

        commentsList.innerHTML =
            comments.map(
                comment => `
                    <div class="tw-comment-item">
                        <span class="tw-comment-avatar">
                            ${
                                comment.authorPhotoUrl
                                    ? `<img src="${escapeHtml(comment.authorPhotoUrl)}" alt="" loading="lazy">`
                                    : `<i class="fa-solid fa-user"></i>`
                            }
                        </span>
                        <div>
                            <strong>${escapeHtml(comment.authorName || "Traveler")}</strong>
                            <p>${escapeHtml(comment.text || "")}</p>
                        </div>
                    </div>
                `
            ).join("");

    } catch (error) {

        console.error(
            "LOAD COMMENTS ERROR:",
            error
        );

        commentsList.innerHTML =
            '<span class="tw-comments-empty">Unable to load comments.</span>';

    }

}


async function shareCustomerPost(post) {

    const shareText =
        String(
            post?.caption ||
            "Check out this travel post on Trips Wonder."
        ).trim();

    const shareData = {
        title:
            "Trips Wonder Travel Post",
        text:
            shareText,
        url:
            window.location.href
    };

    try {

        if (navigator.share) {

            await navigator.share(
                shareData
            );

            return;

        }

        await navigator.clipboard.writeText(
            `${shareText}\n${window.location.href}`
        );

        window.alert(
            "Post link copied."
        );

    } catch (error) {

        if (error?.name !== "AbortError") {

            console.error(
                "SHARE POST ERROR:",
                error
            );

        }

    }

}



async function hydrateCustomerPostSocial(
    post,
    card
) {

    if (
        !post ||
        !card
    ) {
        return;
    }

    const likeCount =
        card.querySelector(
            "[data-post-like-count]"
        );

    const commentCount =
        card.querySelector(
            "[data-post-comment-count]"
        );

    const likeButton =
        card.querySelector(
            "[data-like-post]"
        );

    try {

        const [
            likesSnapshot,
            commentsSnapshot,
            ownLikeSnapshot
        ] =
            await Promise.all([
                getDocs(
                    collection(
                        db,
                        "customerPosts",
                        post.id,
                        "likes"
                    )
                ),
                getDocs(
                    collection(
                        db,
                        "customerPosts",
                        post.id,
                        "comments"
                    )
                ),
                currentUser
                    ? getDoc(
                        doc(
                            db,
                            "customerPosts",
                            post.id,
                            "likes",
                            currentUser.uid
                        )
                    )
                    : Promise.resolve(null)
            ]);

        const likes =
            likesSnapshot.size;

        const comments =
            commentsSnapshot.size;

        if (likeCount) {

            likeCount.textContent =
                likes === 1
                    ? "1 like"
                    : `${likes} likes`;

            likeCount.hidden =
                likes === 0;

        }

        if (commentCount) {

            commentCount.textContent =
                comments === 1
                    ? "1 comment"
                    : `${comments} comments`;

            commentCount.hidden =
                comments === 0;

        }

        likeButton?.classList.toggle(
            "is-liked",
            Boolean(
                ownLikeSnapshot?.exists?.()
            )
        );

        const icon =
            likeButton?.querySelector("i");

        if (icon) {

            icon.className =
                ownLikeSnapshot?.exists?.()
                    ? "fa-solid fa-thumbs-up"
                    : "fa-regular fa-thumbs-up";

        }

    } catch (error) {

        console.error(
            "POST SOCIAL STATS ERROR:",
            error
        );

    }

}


function createCustomerPostCard(post) {

    const images =
        Array.isArray(
            post.imageUrls
        )
            ? post.imageUrls
                .filter(Boolean)
                .slice(0, 5)
            : [];

    const imageMarkup =
        images.length
            ? `
                <div class="tw-community-gallery tw-community-gallery-${Math.min(images.length, 5)}">
                    ${images.map(
                        (url, index) => `
                            <button
                                type="button"
                                class="tw-community-photo"
                                data-post-photo="${index}">
                                <img
                                    src="${escapeHtml(url)}"
                                    alt="Travel photo ${index + 1}"
                                    loading="lazy">
                            </button>
                        `
                    ).join("")}
                </div>
              `
            : "";

    const isOwner =
        post.authorUid ===
        currentUser?.uid;

    const authorPhoto =
        String(
            post.authorPhotoUrl ||
            ""
        ).trim();

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "tw-feed-card tw-community-post";

    card.dataset.postId =
        post.id;

    card.innerHTML = `
        <header class="tw-feed-card-head">
            <span class="tw-community-avatar">
                ${
                    authorPhoto
                        ? `<img src="${escapeHtml(authorPhoto)}" alt="" loading="lazy">`
                        : `<i class="fa-solid fa-user"></i>`
                }
            </span>

            <span class="tw-feed-brand-copy">
                <strong>${escapeHtml(post.authorName || post.authorFirstName || "Traveler")}</strong>
                <small>${escapeHtml(formatCustomerPostTime(post))} · <i class="fa-solid fa-earth-americas"></i></small>
            </span>

            ${
                isOwner
                    ? `
                        <button type="button" class="tw-feed-more" data-delete-post aria-label="Delete your post" title="Delete post">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                      `
                    : `
                        <button type="button" class="tw-feed-more" aria-label="Post options" title="Post options">
                            <i class="fa-solid fa-ellipsis"></i>
                        </button>
                      `
            }
        </header>

        ${
            post.caption
                ? `
                    <div class="tw-community-caption">
                        <p>${escapeHtml(post.caption)}</p>
                    </div>
                  `
                : ""
        }

        ${imageMarkup}

        <div class="tw-community-social-summary">
            <span data-post-like-count hidden></span>
            <button type="button" data-open-comments>
                <span data-post-comment-count hidden></span>
            </button>
        </div>

        <div class="tw-feed-actions tw-community-actions">
            <button type="button" data-like-post>
                <i class="fa-regular fa-thumbs-up"></i>
                <span>Like</span>
            </button>

            <button type="button" data-comment-post>
                <i class="fa-regular fa-comment"></i>
                <span>Comment</span>
            </button>

            <button type="button" data-share-post>
                <i class="fa-solid fa-share"></i>
                <span>Share</span>
            </button>
        </div>

        <div class="tw-comment-panel" hidden>
            <div class="tw-comment-list"></div>

            <div class="tw-comment-compose">
                <span class="tw-comment-avatar" data-customer-avatar>
                    ${
                        getCustomerAvatarUrl()
                            ? `<img src="${escapeHtml(getCustomerAvatarUrl())}" alt="" loading="lazy">`
                            : `<i class="fa-solid fa-user"></i>`
                    }
                </span>

                <input
                    type="text"
                    maxlength="500"
                    placeholder="Write a comment...">

                <button type="button" aria-label="Send comment">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;

    card.querySelector(
        "[data-delete-post]"
    )?.addEventListener(
        "click",
        () => deleteOwnCustomerPost(post)
    );

    const likeButton =
        card.querySelector(
            "[data-like-post]"
        );

    likeButton?.addEventListener(
        "click",
        async () => {

            await toggleCustomerPostLike(
                post,
                likeButton
            );

            await hydrateCustomerPostSocial(
                post,
                card
            );

        }
    );

    const commentPanel =
        card.querySelector(
            ".tw-comment-panel"
        );

    const commentsList =
        card.querySelector(
            ".tw-comment-list"
        );

    const commentInput =
        card.querySelector(
            ".tw-comment-compose input"
        );

    const commentSend =
        card.querySelector(
            ".tw-comment-compose button"
        );

    const toggleComments =
        async () => {

            const opening =
                commentPanel?.hidden;

            if (commentPanel) {
                commentPanel.hidden =
                    !opening;
            }

            if (opening) {

                await loadCustomerPostComments(
                    post,
                    commentsList
                );

                commentInput?.focus();

            }

        };

    card.querySelector(
        "[data-comment-post]"
    )?.addEventListener(
        "click",
        toggleComments
    );

    card.querySelector(
        "[data-open-comments]"
    )?.addEventListener(
        "click",
        toggleComments
    );

    const submitComment =
        async () => {

            await addCustomerPostComment(
                post,
                commentInput,
                commentsList
            );

            await hydrateCustomerPostSocial(
                post,
                card
            );

        };

    commentSend?.addEventListener(
        "click",
        submitComment
    );

    commentInput?.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                submitComment();

            }

        }
    );

    card.querySelector(
        "[data-share-post]"
    )?.addEventListener(
        "click",
        () => shareCustomerPost(post)
    );

    hydrateCustomerPostSocial(
        post,
        card
    );

    return card;

}

openPostComposerButton
    ?.addEventListener(
        "click",
        () => openCustomerPostModal(false)
    );


openPostPhotoButton
    ?.addEventListener(
        "click",
        () => openCustomerPostModal(true)
    );


choosePostPhotos
    ?.addEventListener(
        "click",
        () => customerPostFiles?.click()
    );


customerPostFiles
    ?.addEventListener(
        "change",
        event => validatePostFiles(
            event.target.files
        )
    );


publishCustomerPostButton
    ?.addEventListener(
        "click",
        publishCustomerPost
    );


customerPostModal
    ?.querySelectorAll(
        "[data-close-post-modal]"
    )
    .forEach(
        element => element.addEventListener(
            "click",
            closeCustomerPostModal
        )
    );


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            customerPostModal &&
            !customerPostModal.hidden
        ) {

            closeCustomerPostModal();

        }

    }
);



function getFeedTimestamp(value) {

    return Number(
        value?.toMillis?.() ||
        toDate(value)?.getTime?.() ||
        0
    );

}


function getPackageFeedTimestamp(packageItem) {

    return (
        getFeedTimestamp(packageItem?.feedPublishedAt) ||
        getFeedTimestamp(packageItem?.postPublishedAt) ||
        getFeedTimestamp(packageItem?.publishedAt) ||
        getFeedTimestamp(packageItem?.createdAt) ||
        getFeedTimestamp(packageItem?.updatedAt) ||
        Number(packageItem?.createdAtMs || 0) ||
        Number(packageItem?.updatedAtMs || 0) ||
        0
    );

}


function formatPackageFeedTime(packageItem) {

    const millis =
        getPackageFeedTimestamp(
            packageItem
        );

    if (!millis) {
        return "Official tour package";
    }

    return formatCustomerPostTime({
        createdAtMs:
            millis
    });

}



function getPackagePostImages(packageItem) {

    const candidates = [
        packageItem?.feedImages,
        packageItem?.postImages,
        packageItem?.postingPhotos,
        packageItem?.postingImages
    ];

    for (const candidate of candidates) {

        if (Array.isArray(candidate)) {

            const images =
                candidate
                    .map(item =>
                        typeof item === "string"
                            ? item
                            : item?.url
                    )
                    .filter(Boolean);

            if (images.length) {
                return images;
            }

        }

    }

    return getPackageGallery(
        packageItem
    );

}


function getPackagePostCaption(packageItem) {

    return String(
        packageItem?.feedCaption ||
        packageItem?.postCaption ||
        packageItem?.caption ||
        packageItem?.description ||
        packageItem?.about ||
        "Plan your next getaway with Trips Wonder."
    ).trim();

}


function getPackageAllInText(packageItem) {

    const direct =
        String(
            packageItem?.feedAllInMessage ||
            packageItem?.allInMessage ||
            packageItem?.packageAllInMessage ||
            ""
        ).trim();

    if (direct) {
        return direct;
    }

    const inclusions =
        normalizeDetailArray(
            packageItem?.inclusions
        )
            .slice(0, 5);

    if (inclusions.length) {

        return (
            inclusions.join(", ") +
            (normalizeDetailArray(packageItem?.inclusions).length > inclusions.length
                ? " and more!"
                : ".")
        );

    }

    return "Tap any photo to view the complete package details.";

}


function buildPackagePostGallery(packageItem) {

    const allImages =
        getPackagePostImages(
            packageItem
        );

    if (!allImages.length) {

        return `
            <button
                type="button"
                class="tw-package-post-gallery tw-package-post-gallery-empty"
                data-package-photo>
                <i class="fa-solid fa-image"></i>
            </button>
        `;

    }

    const total =
        allImages.length;

    const visibleCount =
        total >= 5
            ? 4
            : total;

    const visible =
        allImages.slice(
            0,
            visibleCount
        );

    const classCount =
        total >= 5
            ? "5plus"
            : String(total);

    return `
        <div class="tw-package-post-gallery tw-package-post-gallery-${classCount}">
            ${visible.map(
                (url, index) => {

                    const remaining =
                        total >= 5 &&
                        index === visible.length - 1
                            ? total - visible.length
                            : 0;

                    return `
                        <button
                            type="button"
                            class="tw-package-post-photo tw-package-post-photo-${index + 1}"
                            data-package-photo="${index}"
                            aria-label="Open package details">
                            <img
                                src="${escapeHtml(url)}"
                                alt="${escapeHtml(packageItem?.name || "Tour package")} photo ${index + 1}"
                                loading="lazy">
                            ${
                                remaining > 0
                                    ? `<span class="tw-package-more-photos">+${remaining}</span>`
                                    : ""
                            }
                        </button>
                    `;

                }
            ).join("")}
        </div>
    `;

}


async function togglePackagePostLike(packageItem, button) {

    if (
        !currentUser ||
        !packageItem?.id
    ) {
        return;
    }

    const likeRef =
        doc(
            db,
            "packages",
            packageItem.id,
            "likes",
            currentUser.uid
        );

    try {

        const snapshot =
            await getDoc(
                likeRef
            );

        if (snapshot.exists()) {

            await deleteDoc(
                likeRef
            );

        } else {

            await setDoc(
                likeRef,
                {
                    userUid:
                        currentUser.uid,
                    createdAt:
                        serverTimestamp()
                }
            );

        }

        button?.classList.toggle(
            "is-liked",
            !snapshot.exists()
        );

    } catch (error) {

        console.error(
            "PACKAGE LIKE ERROR:",
            error
        );

    }

}


async function addPackagePostComment(
    packageItem,
    input,
    commentsList
) {

    if (
        !currentUser ||
        !packageItem?.id ||
        !input
    ) {
        return;
    }

    const text =
        String(
            input.value ||
            ""
        ).trim();

    if (!text) {
        return;
    }

    if (text.length > 500) {

        window.alert(
            "Comment is too long."
        );

        return;
    }

    const commentRef =
        doc(
            collection(
                db,
                "packages",
                packageItem.id,
                "comments"
            )
        );

    try {

        await setDoc(
            commentRef,
            {
                authorUid:
                    currentUser.uid,
                authorName:
                    getCustomerAuthorName(),
                authorPhotoUrl:
                    getCustomerAvatarUrl(),
                text,
                createdAt:
                    serverTimestamp(),
                createdAtMs:
                    Date.now()
            }
        );

        input.value =
            "";

        await loadPackagePostComments(
            packageItem,
            commentsList
        );

    } catch (error) {

        console.error(
            "PACKAGE COMMENT ERROR:",
            error
        );

    }

}


async function loadPackagePostComments(
    packageItem,
    commentsList
) {

    if (
        !packageItem?.id ||
        !commentsList
    ) {
        return;
    }

    commentsList.innerHTML =
        '<span class="tw-comments-loading">Loading comments...</span>';

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "packages",
                    packageItem.id,
                    "comments"
                )
            );

        const comments =
            snapshot.docs
                .map(commentDoc => ({
                    id:
                        commentDoc.id,
                    ...commentDoc.data()
                }))
                .sort(
                    (a, b) =>
                        Number(
                            a.createdAtMs ||
                            a.createdAt?.toMillis?.() ||
                            0
                        ) -
                        Number(
                            b.createdAtMs ||
                            b.createdAt?.toMillis?.() ||
                            0
                        )
                )
                .slice(-20);

        if (!comments.length) {

            commentsList.innerHTML =
                '<span class="tw-comments-empty">No comments yet.</span>';

            return;
        }

        commentsList.innerHTML =
            comments.map(
                comment => `
                    <div class="tw-comment-item">
                        <span class="tw-comment-avatar">
                            ${
                                comment.authorPhotoUrl
                                    ? `<img src="${escapeHtml(comment.authorPhotoUrl)}" alt="" loading="lazy">`
                                    : `<i class="fa-solid fa-user"></i>`
                            }
                        </span>
                        <div>
                            <strong>${escapeHtml(comment.authorName || "Traveler")}</strong>
                            <p>${escapeHtml(comment.text || "")}</p>
                        </div>
                    </div>
                `
            ).join("");

    } catch (error) {

        console.error(
            "LOAD PACKAGE COMMENTS ERROR:",
            error
        );

        commentsList.innerHTML =
            '<span class="tw-comments-empty">Unable to load comments.</span>';

    }

}


async function hydratePackagePostSocial(
    packageItem,
    card
) {

    if (
        !packageItem?.id ||
        !card
    ) {
        return;
    }

    const likeCount =
        card.querySelector(
            "[data-package-like-count]"
        );

    const commentCount =
        card.querySelector(
            "[data-package-comment-count]"
        );

    const likeButton =
        card.querySelector(
            "[data-package-like]"
        );

    try {

        const [
            likesSnapshot,
            commentsSnapshot,
            ownLikeSnapshot
        ] =
            await Promise.all([
                getDocs(
                    collection(
                        db,
                        "packages",
                        packageItem.id,
                        "likes"
                    )
                ),
                getDocs(
                    collection(
                        db,
                        "packages",
                        packageItem.id,
                        "comments"
                    )
                ),
                currentUser
                    ? getDoc(
                        doc(
                            db,
                            "packages",
                            packageItem.id,
                            "likes",
                            currentUser.uid
                        )
                    )
                    : Promise.resolve(null)
            ]);

        const likes =
            likesSnapshot.size;

        const comments =
            commentsSnapshot.size;

        if (likeCount) {

            likeCount.textContent =
                likes === 1
                    ? "1 like"
                    : `${likes} likes`;

            likeCount.hidden =
                likes === 0;

        }

        if (commentCount) {

            commentCount.textContent =
                comments === 1
                    ? "1 comment"
                    : `${comments} comments`;

            commentCount.hidden =
                comments === 0;

        }

        const liked =
            Boolean(
                ownLikeSnapshot?.exists?.()
            );

        likeButton?.classList.toggle(
            "is-liked",
            liked
        );

        const icon =
            likeButton?.querySelector("i");

        if (icon) {

            icon.className =
                liked
                    ? "fa-solid fa-thumbs-up"
                    : "fa-regular fa-thumbs-up";

        }

    } catch (error) {

        console.error(
            "PACKAGE SOCIAL STATS ERROR:",
            error
        );

    }

}


async function sharePackagePost(packageItem) {

    const name =
        String(
            packageItem?.name ||
            "Trips Wonder Tour Package"
        ).trim();

    const price =
        normalizeNumber(
            packageItem?.price
        );

    const text =
        `${name}${price ? ` · ₱${formatMoney(price)}/person` : ""}`;

    const url =
        `${window.location.origin}${window.location.pathname}?package=${encodeURIComponent(packageItem.id || "")}`;

    try {

        if (navigator.share) {

            await navigator.share({
                title:
                    name,
                text,
                url
            });

            return;

        }

        await navigator.clipboard.writeText(
            `${text}\n${url}`
        );

        window.alert(
            "Package link copied."
        );

    } catch (error) {

        if (error?.name !== "AbortError") {

            console.error(
                "SHARE PACKAGE ERROR:",
                error
            );

        }

    }

}


function createFeedCard(packageItem, index) {

    const duration =
        getPackageDuration(
            packageItem
        );

    const caption =
        getPackagePostCaption(
            packageItem
        );

    const shortCaption =
        caption.length > 180
            ? `${caption.slice(0, 180).trim()}…`
            : caption;

    const allInText =
        getPackageAllInText(
            packageItem
        );

    const galleryMarkup =
        buildPackagePostGallery(
            packageItem
        );

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "tw-feed-card tw-package-feed-post";

    card.dataset.packageId =
        packageItem.id ||
        "";

    card.innerHTML = `
        <header class="tw-feed-card-head">
            <span class="tw-feed-brand-avatar">
                <img
                    src="${escapeHtml(currentBusinessLogo)}"
                    alt="Trips Wonder"
                    data-business-logo>
            </span>

            <span class="tw-feed-brand-copy">
                <strong>
                    Trips Wonder Travel &amp; Tours
                    <i
                        class="fa-solid fa-circle-check tw-official-check"
                        title="Trips Wonder">
                    </i>
                </strong>

                <small>
                    ${escapeHtml(formatPackageFeedTime(packageItem))}
                    ·
                    <i class="fa-solid fa-earth-americas"></i>
                </small>
            </span>

            <button
                type="button"
                class="tw-feed-more"
                aria-label="More options">
                <i class="fa-solid fa-ellipsis"></i>
            </button>
        </header>

        <div class="tw-package-caption">
            <h3>
                🏝️ ${escapeHtml(packageItem.name || "Tour Package")}
                ${duration ? `– ${escapeHtml(duration)}` : ""}
            </h3>

            <p data-package-caption-text>
                ${escapeHtml(shortCaption)}
            </p>

            ${
                caption.length > 180
                    ? `
                        <button
                            type="button"
                            class="tw-package-see-more"
                            data-package-see-more>
                            See more
                        </button>
                      `
                    : ""
            }
        </div>

        ${galleryMarkup}

        <section class="tw-package-offer-strip">
            <div class="tw-package-price-inline">
                <strong>₱${formatMoney(packageItem.price)}</strong>
                <span>/ person</span>
            </div>

            <span class="tw-all-in-badge">
                <i class="fa-solid fa-shield-heart"></i>
                ALL-IN PACKAGE
            </span>
        </section>

        <div class="tw-all-in-message">
            <i class="fa-solid fa-shield-halved"></i>
            <span>${escapeHtml(allInText)}</span>
        </div>

        <div class="tw-community-social-summary tw-package-social-summary">
            <span data-package-like-count hidden></span>

            <button
                type="button"
                data-package-open-comments>
                <span data-package-comment-count hidden></span>
            </button>
        </div>

        <div class="tw-feed-actions tw-package-actions">
            <button
                type="button"
                data-package-like>
                <i class="fa-regular fa-thumbs-up"></i>
                <span>Like</span>
            </button>

            <button
                type="button"
                data-package-comment>
                <i class="fa-regular fa-comment"></i>
                <span>Comment</span>
            </button>

            <button
                type="button"
                data-package-share>
                <i class="fa-solid fa-share"></i>
                <span>Share</span>
            </button>
        </div>

        <div class="tw-comment-panel tw-package-comment-panel" hidden>
            <div class="tw-comment-list"></div>

            <div class="tw-comment-compose">
                <span
                    class="tw-comment-avatar"
                    data-customer-avatar>
                    ${
                        getCustomerAvatarUrl()
                            ? `<img src="${escapeHtml(getCustomerAvatarUrl())}" alt="" loading="lazy">`
                            : `<i class="fa-solid fa-user"></i>`
                    }
                </span>

                <input
                    type="text"
                    maxlength="500"
                    placeholder="Write a comment...">

                <button
                    type="button"
                    aria-label="Send comment">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;

    card.querySelectorAll(
        "[data-package-photo]"
    ).forEach(
        photoButton => {

            photoButton.addEventListener(
                "click",
                () => openPackageDetails(
                    packageItem
                )
            );

        }
    );

    const captionText =
        card.querySelector(
            "[data-package-caption-text]"
        );

    const seeMore =
        card.querySelector(
            "[data-package-see-more]"
        );

    seeMore?.addEventListener(
        "click",
        () => {

            const expanded =
                seeMore.dataset.expanded ===
                "true";

            seeMore.dataset.expanded =
                expanded
                    ? "false"
                    : "true";

            captionText.textContent =
                expanded
                    ? shortCaption
                    : caption;

            seeMore.textContent =
                expanded
                    ? "See more"
                    : "See less";

        }
    );

    const likeButton =
        card.querySelector(
            "[data-package-like]"
        );

    likeButton?.addEventListener(
        "click",
        async () => {

            await togglePackagePostLike(
                packageItem,
                likeButton
            );

            await hydratePackagePostSocial(
                packageItem,
                card
            );

        }
    );

    const commentPanel =
        card.querySelector(
            ".tw-package-comment-panel"
        );

    const commentsList =
        card.querySelector(
            ".tw-package-comment-panel .tw-comment-list"
        );

    const commentInput =
        card.querySelector(
            ".tw-package-comment-panel .tw-comment-compose input"
        );

    const commentSend =
        card.querySelector(
            ".tw-package-comment-panel .tw-comment-compose button"
        );

    const toggleComments =
        async () => {

            const opening =
                commentPanel?.hidden;

            if (commentPanel) {

                commentPanel.hidden =
                    !opening;

            }

            if (opening) {

                await loadPackagePostComments(
                    packageItem,
                    commentsList
                );

                commentInput?.focus();

            }

        };

    card.querySelector(
        "[data-package-comment]"
    )?.addEventListener(
        "click",
        toggleComments
    );

    card.querySelector(
        "[data-package-open-comments]"
    )?.addEventListener(
        "click",
        toggleComments
    );

    const submitComment =
        async () => {

            await addPackagePostComment(
                packageItem,
                commentInput,
                commentsList
            );

            await hydratePackagePostSocial(
                packageItem,
                card
            );

        };

    commentSend?.addEventListener(
        "click",
        submitComment
    );

    commentInput?.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                submitComment();

            }

        }
    );

    card.querySelector(
        "[data-package-share]"
    )?.addEventListener(
        "click",
        () => sharePackagePost(
            packageItem
        )
    );

    hydratePackagePostSocial(
        packageItem,
        card
    );

    return card;

}

function renderMockupFeed() {

    if (!tripsWonderFeed) {
        return;
    }

    const posts =
        getVisibleCustomerPosts();

    const packages =
        getVisiblePackages();

    tripsWonderFeed.innerHTML = "";

    if (
        !posts.length &&
        !packages.length
    ) {

        tripsWonderFeed.innerHTML = `
            <div class="tw-home-empty">
                <i class="fa-regular fa-compass"></i>
                <strong>No feed results found</strong>
                <span>Try another search term or share a travel moment.</span>
            </div>
        `;

        return;

    }

    const feedItems = [
        ...posts
            .slice(0, 30)
            .map(
                post => ({
                    type:
                        "customer",
                    timestamp:
                        Number(
                            post.createdAtMs ||
                            post.createdAt?.toMillis?.() ||
                            0
                        ),
                    data:
                        post
                })
            ),
        ...packages
            .slice(0, 20)
            .map(
                packageItem => ({
                    type:
                        "package",
                    timestamp:
                        getPackageFeedTimestamp(
                            packageItem
                        ),
                    data:
                        packageItem
                })
            )
    ];

    feedItems.sort(
        (a, b) => {

            if (
                a.timestamp &&
                b.timestamp
            ) {
                return b.timestamp - a.timestamp;
            }

            if (a.timestamp) {
                return -1;
            }

            if (b.timestamp) {
                return 1;
            }

            if (
                a.type === "customer" &&
                b.type !== "customer"
            ) {
                return -1;
            }

            if (
                b.type === "customer" &&
                a.type !== "customer"
            ) {
                return 1;
            }

            return 0;

        }
    );

    feedItems.forEach(
        (item, index) => {

            tripsWonderFeed.appendChild(
                item.type === "customer"
                    ? createCustomerPostCard(
                        item.data
                    )
                    : createFeedCard(
                        item.data,
                        index
                    )
            );

        }
    );

    applyBusinessLogo(
        currentBusinessLogo
    );

    renderCustomerAvatars();

}

function renderMockupPopular() {

    if (!popularTours) {
        return;
    }

    const packages =
        getVisiblePackages().slice(0, 4);

    popularTours.innerHTML = "";

    packages.forEach(
        packageItem => {

            const image =
                getPackageImage(packageItem);

            const button =
                document.createElement("button");

            button.type = "button";
            button.className =
                "tw-popular-item";

            button.innerHTML = `
                <span class="tw-popular-image">
                    ${
                        image
                            ? `<img src="${escapeHtml(image)}" alt="" loading="lazy">`
                            : `<i class="fa-solid fa-image"></i>`
                    }
                </span>

                <span class="tw-popular-copy">
                    <strong>${escapeHtml(packageItem.name || "Tour Package")}</strong>
                    <span>₱${formatMoney(packageItem.price)} <small>/person</small></span>
                    <small>🔥 Most Booked</small>
                </span>
            `;

            button.addEventListener(
                "click",
                () => openPackageDetails(packageItem)
            );

            popularTours.appendChild(button);

        }
    );

}


function renderMockupDepartures() {

    if (!upcomingDepartures) {
        return;
    }

    const packages =
        getVisiblePackages().slice(0, 3);

    upcomingDepartures.innerHTML = "";

    packages.forEach(
        packageItem => {

            const schedule =
                packageItem?.travelDate ||
                packageItem?.departureDate ||
                packageItem?.tourDate ||
                packageItem?.date ||
                null;

            const date =
                toDate(schedule);

            const month =
                date
                    ? date.toLocaleDateString("en-US", { month: "short" }).toUpperCase()
                    : "TRIP";

            const day =
                date
                    ? String(date.getDate()).padStart(2, "0")
                    : "•";

            const item =
                document.createElement("button");

            item.type = "button";
            item.className =
                "tw-departure-item";

            item.innerHTML = `
                <span class="tw-date-box">
                    <small>${escapeHtml(month)}</small>
                    <strong>${escapeHtml(day)}</strong>
                </span>

                <span class="tw-departure-copy">
                    <strong>${escapeHtml(packageItem.name || "Tour Package")}</strong>
                    <small>${escapeHtml(getPackageScheduleText(packageItem))}</small>
                </span>

                <span class="tw-joiners-pill">JOINERS</span>
            `;

            item.addEventListener(
                "click",
                () => openPackageDetails(packageItem)
            );

            upcomingDepartures.appendChild(item);

        }
    );

}


function renderMockupShortcuts() {

    if (!homeShortcutTours) {
        return;
    }

    const packages =
        customerPackages.slice(0, 4);

    homeShortcutTours.innerHTML = "";

    packages.forEach(
        packageItem => {

            const image =
                getPackageImage(packageItem);

            const button =
                document.createElement("button");

            button.type = "button";
            button.className =
                "tw-shortcut-item";

            button.innerHTML = `
                <span class="tw-shortcut-image">
                    ${
                        image
                            ? `<img src="${escapeHtml(image)}" alt="" loading="lazy">`
                            : `<i class="fa-solid fa-image"></i>`
                    }
                </span>

                <span>
                    <strong>${escapeHtml(packageItem.name || "Tour Package")}</strong>
                    <small>${escapeHtml(getPackageDuration(packageItem) || packageItem.category || "Tour")}</small>
                </span>
            `;

            button.addEventListener(
                "click",
                () => openPackageDetails(packageItem)
            );

            homeShortcutTours.appendChild(button);

        }
    );

}


function renderApprovedHomeMockup() {

    renderMockupStories();
    renderMockupFeed();
    renderMockupPopular();
    renderMockupDepartures();
    renderMockupShortcuts();

    applyBusinessLogo(
        currentBusinessLogo
    );

}

/* ==========================================================
   PACKAGE DETAILS MODAL
   ========================================================== */

function normalizeDetailArray(value) {

    if (Array.isArray(value)) {

        return value
            .map(item => {

                if (typeof item === "string") {
                    return item.trim();
                }

                return String(
                    item?.name ||
                    item?.title ||
                    item?.label ||
                    item?.description ||
                    ""
                ).trim();

            })
            .filter(Boolean);

    }

    if (typeof value === "string") {

        return value
            .split(/\r?\n|,\s*/)
            .map(item => item.trim())
            .filter(Boolean);

    }

    return [];

}


function getPackageGallery(packageItem) {

    const images = [];

    if (Array.isArray(packageItem?.gallery)) {

        packageItem.gallery.forEach(item => {

            const url =
                typeof item === "string"
                    ? item
                    : item?.url;

            if (url && !images.includes(url)) {
                images.push(url);
            }

        });

    }

    if (packageItem?.image && !images.includes(packageItem.image)) {
        images.unshift(packageItem.image);
    }

    return images;

}


function renderDetailList(element, section, items) {

    const list = normalizeDetailArray(items);

    if (!element || !section) {
        return;
    }

    if (!list.length) {

        section.hidden = true;
        element.innerHTML = "";

        return;
    }

    section.hidden = false;

    element.innerHTML = list
        .map(item => `
            <li>${escapeHtml(item)}</li>
        `)
        .join("");

}


function renderAccommodations(accommodations) {

    if (!packageModalAccommodationSection || !packageModalAccommodations) {
        return;
    }

    const list =
        Array.isArray(accommodations)
            ? accommodations
            : normalizeDetailArray(accommodations);

    if (!list.length) {

        packageModalAccommodationSection.hidden = true;
        packageModalAccommodations.innerHTML = "";

        return;
    }

    packageModalAccommodationSection.hidden = false;

    packageModalAccommodations.innerHTML = list
        .map(item => {

            if (typeof item === "string") {

                return `
                    <div class="package-accommodation-item">
                        <strong>${escapeHtml(item)}</strong>
                    </div>
                `;
            }

            const name =
                item?.name ||
                item?.type ||
                item?.title ||
                "Accommodation";

            const details = [
                item?.description,
                item?.capacity
                    ? `Capacity: ${item.capacity}`
                    : "",
                item?.price
                    ? `₱${formatMoney(item.price)}`
                    : ""
            ]
                .filter(Boolean)
                .join(" · ");

            return `
                <div class="package-accommodation-item">

                    <strong>
                        ${escapeHtml(name)}
                    </strong>

                    ${
                        details
                            ? `<span>${escapeHtml(details)}</span>`
                            : ""
                    }

                </div>
            `;

        })
        .join("");

}


function openPackageDetails(packageItem) {

    if (!packageDetailsModal) {
        return;
    }

    selectedDetailsPackage = packageItem;

    const name =
        packageItem?.name ||
        "Tour Package";

    const category =
        packageItem?.category ||
        "Tour";

    const location =
        packageItem?.location ||
        "Philippines";

    const duration =
        getPackageDuration(packageItem);

    const about =
        String(
            packageItem?.about ||
            packageItem?.description ||
            ""
        ).trim();

    const gallery =
        getPackageGallery(packageItem);

    packageModalTitle.textContent = name;
    packageModalName.textContent = name;
    packageModalCategory.textContent = category;
    packageModalLocation.textContent = location;
    packageModalPrice.textContent = `₱${formatMoney(packageItem?.price)}`;
    packageModalDuration.textContent = duration ? `/ ${duration}` : "";

    if (gallery.length) {

        packageModalGallery.innerHTML = gallery
            .slice(0, 8)
            .map((image, index) => `
                <img
                    src="${escapeHtml(image)}"
                    alt="${escapeHtml(name)} photo ${index + 1}"
                    loading="lazy">
            `)
            .join("");

    } else {

        packageModalGallery.innerHTML = `
            <div class="package-modal-gallery-empty">
                <i class="fa-solid fa-image"></i>
            </div>
        `;
    }

    if (about) {

        packageModalAboutSection.hidden = false;
        packageModalAbout.textContent = about;

    } else {

        packageModalAboutSection.hidden = true;
        packageModalAbout.textContent = "";
    }

    renderDetailList(
        packageModalInclusions,
        packageModalInclusionsSection,
        packageItem?.inclusions
    );

    renderDetailList(
        packageModalExclusions,
        packageModalExclusionsSection,
        packageItem?.exclusions
    );

    renderAccommodations(
        packageItem?.accommodations ||
        packageItem?.accommodation
    );

    const itinerary =
        typeof packageItem?.itinerary === "string"
            ? packageItem.itinerary.trim()
            : Array.isArray(packageItem?.itinerary)
                ? packageItem.itinerary
                    .map(item =>
                        typeof item === "string"
                            ? item
                            : [
                                item?.day || item?.title,
                                item?.description || item?.details
                            ]
                                .filter(Boolean)
                                .join(" — ")
                    )
                    .filter(Boolean)
                    .join("\n")
                : "";

    if (itinerary) {

        packageModalItinerarySection.hidden = false;
        packageModalItinerary.textContent = itinerary;

    } else {

        packageModalItinerarySection.hidden = true;
        packageModalItinerary.textContent = "";
    }

    packageDetailsModal.classList.add("show");
    packageDetailsModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("package-modal-open");

}


function closePackageDetails() {

    if (!packageDetailsModal) {
        return;
    }

    packageDetailsModal.classList.remove("show");
    packageDetailsModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("package-modal-open");

    selectedDetailsPackage = null;

}


packageModalClose
    ?.addEventListener(
        "click",
        closePackageDetails
    );


packageDetailsModal
    ?.addEventListener(
        "click",
        event => {

            if (event.target.closest("[data-close-package-modal]")) {
                closePackageDetails();
            }

        }
    );


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            packageDetailsModal?.classList.contains("show")
        ) {
            closePackageDetails();
        }

    }
);


packageModalBookButton
    ?.addEventListener(
        "click",
        () => {

            if (!selectedDetailsPackage?.id) {
                return;
            }

            window.location.href =
                `booking.html?package=${encodeURIComponent(
                    selectedDetailsPackage.id
                )}`;

        }
    );


/* ==========================================================
   PACKAGE CARD
   ========================================================== */

function createPackageCard(
    packageItem
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "explore-card";


    const packageImage =
        getPackageImage(
            packageItem
        );


    const duration =
        getPackageDuration(
            packageItem
        );


    card.innerHTML = `

        <div class="explore-image">

            ${
                packageImage

                    ? `
                        <img
                            src="${escapeHtml(
                                packageImage
                            )}"
                            alt="${escapeHtml(
                                packageItem.name ||
                                "Tour Package"
                            )}"
                            loading="lazy"
                        >
                      `

                    : `
                        <div class="explore-image-placeholder">

                            <i class="fa-solid fa-image"></i>

                        </div>
                      `
            }


            ${
                packageItem.category

                    ? `
                        <span class="explore-category">

                            ${escapeHtml(
                                packageItem.category
                            )}

                        </span>
                      `

                    : ""
            }

        </div>


        <div class="explore-content">

            ${
                packageItem.location

                    ? `
                        <p class="explore-location">

                            <i class="fa-solid fa-location-dot"></i>

                            <span>

                                ${escapeHtml(
                                    packageItem.location
                                )}

                            </span>

                        </p>
                      `

                    : ""
            }


            <h3 class="explore-title">

                ${escapeHtml(
                    packageItem.name ||
                    "Tour Package"
                )}

            </h3>


            <div class="explore-price-line">

                <strong class="explore-price">

                    ₱${formatMoney(
                        packageItem.price
                    )}

                </strong>


                ${
                    duration

                        ? `
                            <span class="explore-duration">

                                / ${escapeHtml(
                                    duration
                                )}

                            </span>
                          `

                        : ""
                }

            </div>


            <div class="explore-actions">

                <button
                    type="button"
                    class="explore-details-btn">

                    <i class="fa-regular fa-eye"></i>

                    View Details

                </button>


                <button
                    type="button"
                    class="explore-book-btn">

                    <i class="fa-solid fa-calendar-check"></i>

                    Book Now

                </button>

            </div>

        </div>

    `;


    const detailsButton =
        card.querySelector(
            ".explore-details-btn"
        );


    const bookButton =
        card.querySelector(
            ".explore-book-btn"
        );


    detailsButton
    ?.addEventListener(
        "click",
        () => {

            openPackageDetails(
                packageItem
            );

        }
    );


    bookButton
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    `booking.html?package=${encodeURIComponent(
                        packageItem.id
                    )}`;

            }
        );


    return card;

}


/* ==========================================================
   RENDER PACKAGES
   ========================================================== */

function renderCustomerPackages() {

    if (!exploreTours) {
        return;
    }


    const visiblePackages =
        getVisiblePackages();


    exploreTours.innerHTML =
        "";


    if (
        packageResultText
    ) {

        packageResultText.textContent =
            `${visiblePackages.length} available ${
                visiblePackages.length === 1
                    ? "package"
                    : "packages"
            }`;

    }


    if (
        visiblePackages.length ===
        0
    ) {

        exploreTours.innerHTML = `
            <div class="packages-empty">

                <i class="fa-solid fa-suitcase-rolling"></i>

                <strong>
                    No tours found
                </strong>

                <span>
                    Try another search or category.
                </span>

            </div>
        `;


        return;

    }


    /*
     * HOME NOW SHOWS ALL ACTIVE PACKAGES.
     */

    visiblePackages
        .forEach(
            packageItem => {

                exploreTours.appendChild(
                    createPackageCard(
                        packageItem
                    )
                );

            }
        );

}


/* ==========================================================
   LOAD ACTUAL CUSTOMER BOOKINGS
   ========================================================== */

async function loadCustomerBookings() {

    const email =
        normalizeText(
            currentUser?.email ||
            currentProfile?.email ||
            ""
        );


    if (!email) {

        customerBookings =
            [];

        return;

    }


    console.log(
        "HOME: Loading bookings for:",
        email
    );


    const customerBookingQuery =
    query(
        collection(
            db,
            "bookings"
        ),
        where(
            "customerUid",
            "==",
            currentUser.uid
        )
    );


    const snapshot =
        await getDocs(
            customerBookingQuery
        );


    customerBookings =
        snapshot.docs.map(
            bookingDoc => ({

                id:
                    bookingDoc.id,

                ...bookingDoc.data()

            })
        );


    console.log(
        "HOME CUSTOMER BOOKINGS:",
        customerBookings.length
    );

}


/* ==========================================================
   UPCOMING BOOKING
   ========================================================== */

function getUpcomingBooking() {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return customerBookings
        .filter(
            booking => {

                const status =
                    normalizeText(
                        booking.bookingStatus ||
                        booking.status ||
                        ""
                    );


                /*
                 * HOME RULE:
                 * Only an actually confirmed booking can be shown
                 * as an Upcoming Trip.
                 *
                 * Pending / pending verification / draft / rejected /
                 * cancelled bookings remain accessible in My Trip,
                 * but must not be presented as an upcoming trip here.
                 */
                if (
                    status !==
                    "confirmed"
                ) {

                    return false;

                }


                const travelDate =
                    toDate(
                        booking.travelStartDate ||
                        booking.startTravelDate ||
                        booking.travelDate
                    );


                return (
                    travelDate &&
                    travelDate >=
                        today
                );

            }
        )
        .sort(
            (
                a,
                b
            ) => {

                return (
                    toDate(
                        a.travelStartDate ||
                        a.startTravelDate ||
                        a.travelDate
                    ) -
                    toDate(
                        b.travelStartDate ||
                        b.startTravelDate ||
                        b.travelDate
                    )
                );

            }
        )[0] ||
        null;

}


function renderUpcomingTrip() {

    const booking =
        getUpcomingBooking();


    if (!booking) {

        upcomingTripCard.hidden =
            true;


        noUpcomingTrip.hidden =
            false;


        return;

    }


    const packageItem =
        customerPackages.find(
            item =>
                item.id ===
                booking.packageId
        ) ||
        {};


    const name =
        booking.packageName ||
        packageItem.name ||
        "Upcoming Trip";


    const category =
        booking.packageCategory ||
        packageItem.category ||
        "Tour";


    const location =
        booking.packageLocation ||
        packageItem.location ||
        "Philippines";


    const image =
        booking.packageImage ||
        getPackageImage(
            packageItem
        ) ||
        currentBusinessLogo;


    const start =
        formatDate(
            booking.travelStartDate ||
            booking.startTravelDate ||
            booking.travelDate
        );


    const end =
        formatDate(
            booking.travelEndDate ||
            booking.endTravelDate
        );


    const duration =
        booking.duration ||
        packageItem.duration ||
        "";


    let schedule =
        "";


    if (
        start &&
        end
    ) {

        schedule =
            `${start} – ${end}`;

    } else {

        schedule =
            start;

    }


    if (
        duration
    ) {

        schedule +=
            `${schedule ? " · " : ""}${duration}`;

    }


    upcomingTripImage.src =
        image;


    upcomingTripImage.alt =
        name;


    upcomingTripCategory.textContent =
        category;


    upcomingTripName.textContent =
        name;


    upcomingTripLocation.textContent =
        location;


    upcomingTripSchedule.textContent =
        schedule ||
        "Upcoming trip";


    upcomingTripReference.textContent =
        booking.bookingNumber ||
        booking.bookingReference ||
        "—";


    upcomingTripCard.hidden =
        false;


    noUpcomingTrip.hidden =
        true;

}


/* ==========================================================
   MY TRIP BUTTON
   ========================================================== */

upcomingTripButton
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "my-trip.html";

        }
    );




/* ==========================================================
   MEMBER-TO-MEMBER MESSENGER
   One initial message until the recipient replies.
   ========================================================== */

const memberMessageTrigger = document.getElementById("memberMessageTrigger");
const memberMessageBadge = document.getElementById("memberMessageBadge");
const memberMessengerPanel = document.getElementById("memberMessengerPanel");
const memberMessengerInbox = document.getElementById("memberMessengerInbox");
const memberChatView = document.getElementById("memberChatView");
const memberSearchInput = document.getElementById("memberSearchInput");
const memberSearchClear = document.getElementById("memberSearchClear");
const memberSearchResults = document.getElementById("memberSearchResults");
const memberChatList = document.getElementById("memberChatList");
const memberChatBack = document.getElementById("memberChatBack");
const memberChatAvatar = document.getElementById("memberChatAvatar");
const memberChatName = document.getElementById("memberChatName");
const memberChatStatus = document.getElementById("memberChatStatus");
const memberChatMessages = document.getElementById("memberChatMessages");
const memberChatRequestInfo = document.getElementById("memberChatRequestInfo");
const memberChatRequestText = document.getElementById("memberChatRequestText");
const memberChatForm = document.getElementById("memberChatForm");
const memberChatInput = document.getElementById("memberChatInput");
const memberChatSend = document.getElementById("memberChatSend");

let memberConversationUnsubscribe = null;
let memberMessagesUnsubscribe = null;
let memberConversations = [];
let activeMemberConversation = null;
let activeMemberProfile = null;
let activeMemberTab = "chats";
let memberSearchTimer = null;

function memberConversationId(uidA, uidB) {
    return [String(uidA), String(uidB)].sort().join("__");
}

function memberProfileName(profile = {}) {
    const full = [
        profile.firstName || profile.firstname || profile.givenName || "",
        profile.lastName || profile.lastname || profile.surname || ""
    ].filter(Boolean).join(" ").trim();

    return full ||
        String(
            profile.displayName ||
            profile.fullName ||
            profile.name ||
            profile.customerName ||
            profile.username ||
            profile.email ||
            "Trips Wonder Member"
        ).trim();
}

function memberProfileAvatar(profile = {}) {
    return String(
        profile.profilePhotoUrl ||
        profile.profilePhoto ||
        profile.photoURL ||
        profile.photoUrl ||
        profile.avatarUrl ||
        profile.avatar ||
        profile.imageUrl ||
        ""
    ).trim();
}

function memberAvatarHtml(profile = {}) {
    const avatar = memberProfileAvatar(profile);
    return avatar
        ? `<img src="${escapeHtml(avatar)}" alt="" loading="lazy">`
        : `<i class="fa-solid fa-user"></i>`;
}

function memberTimestampDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function memberTimeLabel(value) {
    const date = memberTimestampDate(value);
    if (!date) return "";
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    return sameDay
        ? date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })
        : date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function memberOtherUid(conversation) {
    return (conversation?.participants || []).find(uid => uid !== currentUser?.uid) || "";
}

function memberOtherProfile(conversation) {
    const otherUid = memberOtherUid(conversation);
    const profiles = conversation?.participantProfiles || {};
    return { uid: otherUid, ...(profiles[otherUid] || {}) };
}

function memberIsIncomingRequest(conversation) {
    return conversation?.requestState === "pending" &&
        conversation?.requestSenderUid &&
        conversation.requestSenderUid !== currentUser?.uid;
}

function memberIsOutgoingWaiting(conversation) {
    return conversation?.requestState === "pending" &&
        conversation?.requestSenderUid === currentUser?.uid &&
        !conversation?.recipientReplyAt;
}

function setMemberMessageBadge(count) {
    if (!memberMessageBadge) return;
    const safeCount = Math.max(0, Number(count) || 0);
    memberMessageBadge.textContent = safeCount > 99 ? "99+" : String(safeCount);
    memberMessageBadge.hidden = safeCount === 0;
}

function openMemberMessenger() {
    if (!memberMessengerPanel) return;
    memberMessengerPanel.hidden = false;
    memberMessengerPanel.setAttribute("aria-hidden", "false");
    memberMessageTrigger?.setAttribute("aria-expanded", "true");
    showMemberInbox();
    setTimeout(() => memberSearchInput?.focus(), 50);
}

function closeMemberMessenger() {
    if (!memberMessengerPanel) return;
    memberMessengerPanel.hidden = true;
    memberMessengerPanel.setAttribute("aria-hidden", "true");
    memberMessageTrigger?.setAttribute("aria-expanded", "false");
}

function showMemberInbox() {
    if (memberMessengerInbox) memberMessengerInbox.hidden = false;
    if (memberChatView) memberChatView.hidden = true;
    activeMemberConversation = null;
    activeMemberProfile = null;
    if (memberMessagesUnsubscribe) {
        memberMessagesUnsubscribe();
        memberMessagesUnsubscribe = null;
    }
    renderMemberConversationList();
}

memberMessageTrigger?.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    if (memberMessengerPanel?.hidden) openMemberMessenger();
    else closeMemberMessenger();
});

memberMessengerPanel?.addEventListener("click", event => event.stopPropagation());
document.addEventListener("click", () => {
    if (memberMessengerPanel && !memberMessengerPanel.hidden) closeMemberMessenger();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && memberMessengerPanel && !memberMessengerPanel.hidden) {
        closeMemberMessenger();
    }
});
memberChatBack?.addEventListener("click", showMemberInbox);

document.querySelectorAll("[data-member-tab]").forEach(button => {
    button.addEventListener("click", () => {
        activeMemberTab = button.dataset.memberTab || "chats";
        document.querySelectorAll("[data-member-tab]").forEach(item => {
            item.classList.toggle("active", item === button);
        });
        renderMemberConversationList();
    });
});

const memberSearchFunctions =
    getFunctions();

const searchMemberExactCallable =
    httpsCallable(
        memberSearchFunctions,
        "searchMemberExact"
    );


async function searchMemberDirectory(term) {

    const raw =
        String(
            term || ""
        ).trim();

    if (
        !raw ||
        raw.length < 2 ||
        !currentUser
    ) {

        if (memberSearchResults) {
            memberSearchResults.hidden =
                true;

            memberSearchResults.innerHTML =
                "";
        }

        return;
    }


    if (memberSearchResults) {

        memberSearchResults.hidden =
            false;

        memberSearchResults.innerHTML = `
            <div class="tw-messenger-empty" style="min-height:110px">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <strong>Searching member...</strong>
                <span>Checking exact username or email.</span>
            </div>
        `;
    }


    try {

        const response =
            await searchMemberExactCallable(
                {
                    search:
                        raw
                }
            );


        const member =
            response?.data?.member ||
            null;


        renderMemberSearchResults(
            member
                ? [member]
                : [],
            raw
        );

    } catch (error) {

        console.error(
            "MEMBER SEARCH ERROR:",
            error
        );


        renderMemberSearchResults(
            [],
            raw
        );

    }

}


function renderMemberSearchResults(results, term) {
    if (!memberSearchResults) return;
    memberSearchResults.hidden = false;

    if (!results.length) {
        memberSearchResults.innerHTML = `
            <div class="tw-messenger-empty" style="min-height:110px">
                <i class="fa-solid fa-user-magnifying-glass"></i>
                <strong>No member found</strong>
                <span>Try the exact username or email address.</span>
            </div>
        `;
        return;
    }

    memberSearchResults.innerHTML = "";

    results.forEach(profile => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tw-member-result";
        button.innerHTML = `
            <span class="tw-member-avatar">${memberAvatarHtml(profile)}</span>
            <span class="tw-member-copy">
                <strong>${escapeHtml(memberProfileName(profile))}</strong>
                <small>${escapeHtml(profile.email || profile.username || "Trips Wonder member")}</small>
            </span>
            <i class="fa-regular fa-message"></i>
        `;
        button.addEventListener("click", () => openMemberConversationWith(profile));
        memberSearchResults.appendChild(button);
    });
}

memberSearchInput?.addEventListener("input", event => {
    const term = event.target.value || "";
    if (memberSearchClear) memberSearchClear.hidden = !term.trim();
    clearTimeout(memberSearchTimer);
    memberSearchTimer = setTimeout(() => searchMemberDirectory(term), 350);
});

memberSearchClear?.addEventListener("click", () => {
    if (memberSearchInput) memberSearchInput.value = "";
    memberSearchClear.hidden = true;
    if (memberSearchResults) {
        memberSearchResults.hidden = true;
        memberSearchResults.innerHTML = "";
    }
    memberSearchInput?.focus();
});

async function openMemberConversationWith(profile) {
    if (!currentUser || !profile?.uid) return;

    const conversationId =
        memberConversationId(
            currentUser.uid,
            profile.uid
        );

    /*
     * IMPORTANT:
     * Do not getDoc() a conversation that may not exist yet.
     * Firestore rules protect memberConversations by participant,
     * and a missing document has no resource.data.participants.
     *
     * The real-time memberConversations listener already contains
     * every conversation where the signed-in customer participates.
     */
    const existingConversation =
        memberConversations.find(
            conversation =>
                conversation.id ===
                conversationId
        );

    if (existingConversation) {

        await openMemberConversation(
            existingConversation
        );

        return;
    }

    activeMemberConversation = {
        id:
            conversationId,

        participants: [
            currentUser.uid,
            profile.uid
        ],

        participantProfiles: {
            [currentUser.uid]: {
                name:
                    memberProfileName(
                        currentProfile ||
                        {}
                    ),

                email:
                    currentProfile?.email ||
                    currentUser.email ||
                    "",

                avatar:
                    getCustomerAvatarUrl()
            },

            [profile.uid]: {
                name:
                    memberProfileName(
                        profile
                    ),

                email:
                    profile.email ||
                    "",

                avatar:
                    memberProfileAvatar(
                        profile
                    )
            }
        },

        requestState:
            "new"
    };

    activeMemberProfile =
        profile;

    renderOpenMemberChat();

    /*
     * IMPORTANT:
     * Do not subscribe to the messages subcollection yet.
     * The parent conversation document does not exist until
     * the first message request is actually sent.
     *
     * Firestore rules correctly deny reads under a missing
     * parent conversation, so we simply render the local
     * empty-chat state for a brand-new conversation.
     */
    renderMemberMessages(
        []
    );
}

async function openMemberConversation(conversation) {
    activeMemberConversation = conversation;
    activeMemberProfile = memberOtherProfile(conversation);
    renderOpenMemberChat();
    subscribeMemberMessages(conversation.id);

    if (conversation.lastMessageSenderUid &&
        conversation.lastMessageSenderUid !== currentUser?.uid) {
        try {
            await updateDoc(doc(db, "memberConversations", conversation.id), {
                [`unread.${currentUser.uid}`]: 0
            });
        } catch (error) {
            console.warn("MEMBER READ UPDATE:", error);
        }
    }
}

function renderOpenMemberChat() {
    if (!activeMemberConversation || !activeMemberProfile) return;
    if (memberMessengerInbox) memberMessengerInbox.hidden = true;
    if (memberChatView) memberChatView.hidden = false;

    if (memberChatName) memberChatName.textContent = memberProfileName(activeMemberProfile);
    if (memberChatAvatar) memberChatAvatar.innerHTML = memberAvatarHtml(activeMemberProfile);

    const incoming = memberIsIncomingRequest(activeMemberConversation);
    const waiting = memberIsOutgoingWaiting(activeMemberConversation);

    if (memberChatStatus) {
        memberChatStatus.textContent =
            incoming ? "Message request" :
            waiting ? "Waiting for reply" :
            "Trips Wonder member";
    }

    if (memberChatRequestInfo && memberChatRequestText) {
        if (waiting) {
            memberChatRequestInfo.hidden = false;
            memberChatRequestText.textContent =
                "Your first message was sent. You can send more messages after this member replies.";
        } else if (incoming) {
            memberChatRequestInfo.hidden = false;
            memberChatRequestText.textContent =
                "This member sent you a message request. Replying will open the conversation for both of you.";
        } else {
            memberChatRequestInfo.hidden = true;
            memberChatRequestText.textContent = "";
        }
    }

    if (memberChatInput && memberChatSend) {
        memberChatInput.disabled = waiting;
        memberChatSend.disabled = waiting;
        memberChatInput.placeholder = waiting
            ? "Waiting for this member to reply..."
            : "Write a message...";
    }
}

function subscribeMemberConversations() {
    if (!currentUser) return;
    if (memberConversationUnsubscribe) memberConversationUnsubscribe();

    const conversationQuery = query(
        collection(db, "memberConversations"),
        where("participants", "array-contains", currentUser.uid)
    );

    memberConversationUnsubscribe = onSnapshot(
        conversationQuery,
        snapshot => {
            memberConversations = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            })).sort((a, b) => {
                const aDate = memberTimestampDate(a.updatedAt || a.createdAt)?.getTime() || 0;
                const bDate = memberTimestampDate(b.updatedAt || b.createdAt)?.getTime() || 0;
                return bDate - aDate;
            });

            const unreadCount = memberConversations.reduce((sum, conversation) => {
                const unread = conversation?.unread?.[currentUser.uid];
                return sum + (Number(unread) || 0);
            }, 0);

            setMemberMessageBadge(unreadCount);
            renderMemberConversationList();

            if (activeMemberConversation) {
                const fresh = memberConversations.find(item => item.id === activeMemberConversation.id);
                if (fresh) {
                    activeMemberConversation = fresh;
                    activeMemberProfile = memberOtherProfile(fresh);
                    renderOpenMemberChat();
                }
            }
        },
        error => console.error("MEMBER CONVERSATIONS ERROR:", error)
    );
}

function renderMemberConversationList() {
    if (!memberChatList || !currentUser) return;

    const rows = memberConversations.filter(conversation => {
        const incoming = memberIsIncomingRequest(conversation);
        return activeMemberTab === "requests" ? incoming : !incoming;
    });

    if (!rows.length) {
        memberChatList.innerHTML = `
            <div class="tw-messenger-empty">
                <i class="${activeMemberTab === "requests" ? "fa-regular fa-envelope" : "fa-regular fa-comments"}"></i>
                <strong>${activeMemberTab === "requests" ? "No message requests" : "No conversations yet"}</strong>
                <span>${activeMemberTab === "requests"
                    ? "New member requests will appear here."
                    : "Search a username or email above to start a conversation."}</span>
            </div>
        `;
        return;
    }

    memberChatList.innerHTML = "";

    rows.forEach(conversation => {
        const profile = memberOtherProfile(conversation);
        const unread = Number(conversation?.unread?.[currentUser.uid]) || 0;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tw-member-chat-row";
        button.innerHTML = `
            <span class="tw-member-avatar">${memberAvatarHtml(profile)}</span>
            <span class="tw-member-chat-copy">
                <strong>${escapeHtml(memberProfileName(profile))}</strong>
                <small>${escapeHtml(conversation.lastMessage || "Start a conversation")}</small>
            </span>
            <span class="tw-chat-meta">
                ${escapeHtml(memberTimeLabel(conversation.updatedAt || conversation.createdAt))}
                ${unread ? '<span class="tw-chat-unread-dot"></span>' : ""}
            </span>
        `;
        button.addEventListener("click", () => openMemberConversation(conversation));
        memberChatList.appendChild(button);
    });
}

function subscribeMemberMessages(conversationId) {
    if (memberMessagesUnsubscribe) memberMessagesUnsubscribe();

    memberMessagesUnsubscribe = onSnapshot(
        collection(db, "memberConversations", conversationId, "messages"),
        snapshot => {
            const messages = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            })).sort((a, b) => {
                const aDate = memberTimestampDate(a.createdAt)?.getTime() || 0;
                const bDate = memberTimestampDate(b.createdAt)?.getTime() || 0;
                return aDate - bDate;
            });
            renderMemberMessages(messages);
        },
        error => console.error("MEMBER MESSAGES ERROR:", error)
    );
}

function renderMemberMessages(messages) {
    if (!memberChatMessages) return;

    if (!messages.length) {
        memberChatMessages.innerHTML = `
            <div class="tw-messenger-empty">
                <i class="fa-regular fa-message"></i>
                <strong>Start the conversation</strong>
                <span>Your first message acts as a message request.</span>
            </div>
        `;
        return;
    }

    memberChatMessages.innerHTML = "";

    messages.forEach(message => {
        const bubble = document.createElement("div");
        bubble.className = "tw-message-bubble" +
            (message.senderUid === currentUser?.uid ? " mine" : "");
        bubble.innerHTML = `
            ${escapeHtml(message.text || "")}
            <span class="tw-message-time">${escapeHtml(memberTimeLabel(message.createdAt))}</span>
        `;
        memberChatMessages.appendChild(bubble);
    });

    requestAnimationFrame(() => {
        memberChatMessages.scrollTop = memberChatMessages.scrollHeight;
    });
}

memberChatInput?.addEventListener("input", () => {
    memberChatInput.style.height = "auto";
    memberChatInput.style.height = Math.min(memberChatInput.scrollHeight, 100) + "px";
});

memberChatForm?.addEventListener("submit", async event => {
    event.preventDefault();

    const text = String(memberChatInput?.value || "").trim();
    if (!text || !currentUser || !activeMemberConversation || !activeMemberProfile) return;

    if (memberIsOutgoingWaiting(activeMemberConversation)) {
        renderOpenMemberChat();
        return;
    }

    const conversationId = activeMemberConversation.id ||
        memberConversationId(currentUser.uid, activeMemberProfile.uid);
    const conversationRef = doc(db, "memberConversations", conversationId);
    const otherUid = activeMemberProfile.uid || memberOtherUid(activeMemberConversation);
    const isNew = activeMemberConversation.requestState === "new";
    const incomingRequest = memberIsIncomingRequest(activeMemberConversation);

    if (memberChatInput) memberChatInput.disabled = true;
    if (memberChatSend) memberChatSend.disabled = true;

    try {
        const currentSafeProfile = {
            name: memberProfileName(currentProfile || {}),
            email: currentProfile?.email || currentUser.email || "",
            avatar: getCustomerAvatarUrl()
        };
        const otherSafeProfile = {
            name: memberProfileName(activeMemberProfile),
            email: activeMemberProfile.email || "",
            avatar: memberProfileAvatar(activeMemberProfile)
        };

        if (isNew) {
            await setDoc(conversationRef, {
                participants: [currentUser.uid, otherUid],
                participantProfiles: {
                    [currentUser.uid]: currentSafeProfile,
                    [otherUid]: otherSafeProfile
                },
                requestState: "pending",
                requestSenderUid: currentUser.uid,
                recipientReplyAt: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastMessage: text,
                lastMessageSenderUid: currentUser.uid,
                unread: {
                    [currentUser.uid]: 0,
                    [otherUid]: 1
                }
            });
        } else {
            const updates = {
                updatedAt: serverTimestamp(),
                lastMessage: text,
                lastMessageSenderUid: currentUser.uid,
                [`unread.${currentUser.uid}`]: 0,
                [`unread.${otherUid}`]: (Number(activeMemberConversation?.unread?.[otherUid]) || 0) + 1
            };

            if (incomingRequest) {
                updates.requestState = "accepted";
                updates.recipientReplyAt = serverTimestamp();
            }

            await updateDoc(conversationRef, updates);
        }

        const messageData = {
            senderUid: currentUser.uid,
            recipientUid: otherUid,
            text,
            createdAt: serverTimestamp()
        };

        if (isNew) {

            // Security rule: only one initial request message is permitted.
            // A fixed document id prevents duplicate/spam request messages.
            await setDoc(
                doc(
                    db,
                    "memberConversations",
                    conversationId,
                    "messages",
                    "request"
                ),
                messageData
            );

        } else {

            await addDoc(
                collection(
                    db,
                    "memberConversations",
                    conversationId,
                    "messages"
                ),
                messageData
            );

        }

        if (memberChatInput) {
            memberChatInput.value = "";
            memberChatInput.style.height = "auto";
        }

        const fresh = await getDoc(conversationRef);

        if (fresh.exists()) {

            activeMemberConversation = {
                id:
                    fresh.id,
                ...fresh.data()
            };

            activeMemberProfile =
                memberOtherProfile(
                    activeMemberConversation
                );

            renderOpenMemberChat();

            /*
             * The parent conversation now exists, so the
             * messages listener is permitted by Firestore.
             */
            subscribeMemberMessages(
                conversationId
            );
        }
    } catch (error) {
        console.error("MEMBER SEND ERROR:", error);
        if (memberChatRequestInfo && memberChatRequestText) {
            memberChatRequestInfo.hidden = false;
            memberChatRequestText.textContent =
                "Message could not be sent. Check your Firestore rules for memberConversations.";
        }
    } finally {
        if (!memberIsOutgoingWaiting(activeMemberConversation)) {
            if (memberChatInput) memberChatInput.disabled = false;
            if (memberChatSend) memberChatSend.disabled = false;
            memberChatInput?.focus();
        }
    }
});

function startMemberMessenger() {
    subscribeMemberConversations();
}


/* ==========================================================
   AUTH + HOME INITIALIZATION
   ========================================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            console.warn(
                "HOME: No authenticated customer."
            );


            window.location.replace(
                "../../index.html"
            );


            return;

        }


        try {

            currentUser =
                user;


            currentProfile =
                await loadCurrentProfile(
                    user
                );


            /* Show the actual customer's first name in the Home profile */
            renderCustomerProfile();

            /* Start member-to-member Messenger after profile is ready */
            startMemberMessenger();


            const role =
                normalizeText(
                    currentProfile.role ||
                    "client"
                );


            if (
                role !==
                "client"
            ) {

                console.warn(
                    "HOME: Non-client account denied.",
                    role
                );


                window.location.replace(
                    "../../index.html"
                );


                return;

            }


            console.log(
                "HOME AUTHORIZED CUSTOMER:",
                {
                    uid:
                        user.uid,

                    email:
                        user.email,

                    profile:
                        currentProfile
                }
            );


            if (postAuthorName) {
                postAuthorName.textContent =
                    getCustomerAuthorName();
            }


            startCustomerPostsListener();


            try {

                await loadCustomerPackages();

            } catch (packageError) {

                console.error(
                    "HOME PACKAGE ERROR:",
                    packageError
                );


                if (
                    packageResultText
                ) {

                    packageResultText.textContent =
                        "Unable to load tours";

                }


                if (
                    exploreTours
                ) {

                    exploreTours.innerHTML = `
                        <div class="packages-empty">

                            <i class="fa-solid fa-triangle-exclamation"></i>

                            <strong>
                                Unable to load tours
                            </strong>

                            <span>
                                Please refresh and try again.
                            </span>

                        </div>
                    `;

                }

            }


            try {

                await loadCustomerBookings();

                renderUpcomingTrip();

            } catch (bookingError) {

                console.error(
                    "HOME BOOKING ERROR:",
                    bookingError
                );


                upcomingTripCard.hidden =
                    true;


                noUpcomingTrip.hidden =
                    false;

            }


            console.log(
                "CUSTOMER HOME READY"
            );


        } catch (error) {

            console.error(
                "CUSTOMER HOME INITIALIZATION ERROR:",
                error
            );

        }

    }
);


/* ==========================================================
   APPROVED MOCKUP SEARCH BEHAVIOR
   ========================================================== */

if (searchSection) {
    searchSection.hidden = true;
}

headerSearchButton?.addEventListener(
    "click",
    () => {
        searchInput?.focus();
    }
);

twSearchClear?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        if (!searchInput) {
            return;
        }

        searchInput.value = "";
        currentSearch = "";
        twSearchClear.hidden = true;

        renderCustomerPackages();
        renderApprovedHomeMockup();

        searchInput.focus();

    }
);
