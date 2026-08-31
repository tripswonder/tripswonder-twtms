/* =========================================================
   TWTMS v2
   GLOBAL MODULE LOADING SYSTEM
   assets/js/shared/loading-screen.js

   SHARED BY:
   - Dashboard
   - Packages
   - Bookings
   - Customers
   - Payments
   - Invoices
   - Resort Bookings
   - Reports
   - Admin Profile
========================================================= */

"use strict";


/* =========================================================
   GLOBAL STATE
========================================================= */

let loaderElement = null;

let slowConnectionTimer = null;
let connectionTimeoutTimer = null;
let toastTimer = null;

let currentRetryCallback = null;

let loaderVisible = false;
let loaderFailed = false;


/* =========================================================
   SETTINGS
========================================================= */

/*
 * After 5 seconds:
 * Show "Still loading..."
 */
const SLOW_CONNECTION_DELAY = 5000;


/*
 * After 15 seconds:
 * Show connection error + Retry.
 *
 * IMPORTANT:
 * This does NOT cancel Firebase requests.
 * It only tells the user that loading is taking too long.
 */
const CONNECTION_TIMEOUT_DELAY = 15000;


/* =========================================================
   CREATE LOADING SCREEN
========================================================= */

function createLoadingScreen() {

    if (loaderElement) {
        return loaderElement;
    }


    const existingLoader =
        document.getElementById(
            "twtmsGlobalLoader"
        );


    if (existingLoader) {

        loaderElement =
            existingLoader;

        bindRetryButton();

        return loaderElement;
    }


    loaderElement =
        document.createElement(
            "div"
        );


    loaderElement.id =
        "twtmsGlobalLoader";


    loaderElement.className =
        "twtms-loader is-hidden";


    /*
     * Keep the loader completely outside the page layout
     * until showLoading() intentionally displays it.
     * This works even when a module forgot to load the
     * shared .is-hidden CSS rule.
     */
    loaderElement.hidden = true;

    


    loaderElement.setAttribute(
        "aria-live",
        "polite"
    );


    loaderElement.setAttribute(
        "aria-busy",
        "false"
    );


    loaderElement.innerHTML = `
        <div class="twtms-loader-card">

            <div class="twtms-loader-logo">
                <img
                    src="../../../assets/images/logo.png"
                    alt="Trips Wonder">
            </div>

            <div
                class="twtms-loader-spinner"
                aria-hidden="true">
            </div>

            <div
                class="twtms-loader-status-icon"
                aria-hidden="true">

                <i
                    class="fa-solid fa-triangle-exclamation">
                </i>

            </div>

            <h2
                class="twtms-loader-title"
                id="twtmsLoaderTitle">

                Loading...

            </h2>

            <p
                class="twtms-loader-message"
                id="twtmsLoaderMessage">

                Please wait while we load the module.

            </p>

            <div class="twtms-loader-connection">

                <span
                    class="twtms-loader-connection-dot">
                </span>

                <span id="twtmsLoaderConnectionText">
                    Connecting...
                </span>

            </div>

            <button
                type="button"
                class="twtms-loader-retry"
                id="twtmsLoaderRetry">

                <i class="fa-solid fa-rotate-right"></i>

                <span>
                    Retry
                </span>

            </button>

        </div>
    `;


    document.body.appendChild(
        loaderElement
    );


    bindRetryButton();


    return loaderElement;
}


/* =========================================================
   GET ELEMENT
========================================================= */

function getLoaderElement(
    selector
) {

    createLoadingScreen();


    return loaderElement.querySelector(
        selector
    );
}


/* =========================================================
   BIND RETRY BUTTON
========================================================= */

function bindRetryButton() {

    if (!loaderElement) {
        return;
    }


    const retryButton =
        loaderElement.querySelector(
            "#twtmsLoaderRetry"
        );


    if (!retryButton) {
        return;
    }


    if (
        retryButton.dataset.initialized ===
        "true"
    ) {
        return;
    }


    retryButton.dataset.initialized =
        "true";


    retryButton.addEventListener(
        "click",
        async () => {

            if (
                typeof currentRetryCallback !==
                "function"
            ) {

                /*
                 * Fallback:
                 * reload current page.
                 */

                window.location.reload();

                return;
            }


            try {

                showLoading({
                    title:
                        "Retrying...",

                    message:
                        "Trying to reconnect to Trips Wonder.",

                    retry:
                        currentRetryCallback
                });


                await currentRetryCallback();


            } catch (error) {

                console.error(
                    "TWTMS LOADER RETRY ERROR:",
                    error
                );


                showLoadingError(
                    "Unable to load the module. Please check your internet connection.",
                    currentRetryCallback
                );
            }
        }
    );
}


/* =========================================================
   CLEAR TIMERS
========================================================= */

function clearLoadingTimers() {

    if (slowConnectionTimer) {

        clearTimeout(
            slowConnectionTimer
        );


        slowConnectionTimer =
            null;
    }


    if (connectionTimeoutTimer) {

        clearTimeout(
            connectionTimeoutTimer
        );


        connectionTimeoutTimer =
            null;
    }
}


/* =========================================================
   RESET LOADER STATE
========================================================= */

function resetLoaderState() {

    createLoadingScreen();


    loaderElement.classList.remove(
        "is-error",
        "is-offline",
        "is-slow"
    );


    loaderFailed =
        false;


    const statusIcon =
        getLoaderElement(
            ".twtms-loader-status-icon i"
        );


    if (statusIcon) {

        statusIcon.className =
            "fa-solid fa-triangle-exclamation";
    }
}


/* =========================================================
   SHOW LOADING
========================================================= */

function showLoading(options = {}) {

    createLoadingScreen();

    clearLoadingTimers();

    resetLoaderState();


    let title =
        "Loading...";


    let message =
        "Please wait while we load the module.";


    let retry =
        currentRetryCallback;


    /*
     * Allow:
     *
     * showLoading("Loading Packages...")
     *
     * OR:
     *
     * showLoading({
     *     title: "...",
     *     message: "...",
     *     retry: async () => {}
     * });
     */

    if (
        typeof options ===
        "string"
    ) {

        title =
            options;

    } else {

        title =
            options.title ||
            title;


        message =
            options.message ||
            message;


        if (
            typeof options.retry ===
            "function"
        ) {

            retry =
                options.retry;
        }
    }


    currentRetryCallback =
        retry;


    const titleElement =
        getLoaderElement(
            "#twtmsLoaderTitle"
        );


    const messageElement =
        getLoaderElement(
            "#twtmsLoaderMessage"
        );


    const connectionElement =
        getLoaderElement(
            "#twtmsLoaderConnectionText"
        );


    if (titleElement) {

        titleElement.textContent =
            title;
    }


    if (messageElement) {

        messageElement.textContent =
            message;
    }


    if (connectionElement) {

        connectionElement.textContent =
            navigator.onLine
                ? "Connecting..."
                : "No internet connection";
    }


    /*
     * If browser already knows we're offline,
     * show offline immediately.
     */

    if (!navigator.onLine) {

        showOffline(
            currentRetryCallback
        );

        return;
    }


    loaderVisible =
        true;


    loaderElement.hidden = false;


    loaderElement.setAttribute(
        "aria-busy",
        "true"
    );


    loaderElement.classList.remove(
        "is-hidden"
    );

    document.body.classList.add(
    "twtms-page-loading"
    );


    /*
     * Slow connection warning.
     */

    slowConnectionTimer =
        setTimeout(
            () => {

                if (
                    !loaderVisible ||
                    loaderFailed
                ) {

                    return;
                }


                showSlowConnection();

            },
            SLOW_CONNECTION_DELAY
        );


    /*
     * Connection timeout.
     */

    connectionTimeoutTimer =
        setTimeout(
            () => {

                if (
                    !loaderVisible ||
                    loaderFailed
                ) {

                    return;
                }


                showLoadingError(
                    "The module is taking longer than expected to load. Check your internet connection and try again.",
                    currentRetryCallback
                );

            },
            CONNECTION_TIMEOUT_DELAY
        );
}


/* =========================================================
   SLOW CONNECTION
========================================================= */

function showSlowConnection() {

    if (
        !loaderElement ||
        !loaderVisible ||
        loaderFailed
    ) {

        return;
    }


    loaderElement.classList.add(
        "is-slow"
    );


    const titleElement =
        getLoaderElement(
            "#twtmsLoaderTitle"
        );


    const messageElement =
        getLoaderElement(
            "#twtmsLoaderMessage"
        );


    const connectionElement =
        getLoaderElement(
            "#twtmsLoaderConnectionText"
        );


    if (titleElement) {

        titleElement.textContent =
            "Still loading...";
    }


    if (messageElement) {

        messageElement.textContent =
            "Your connection may be slow. Please wait while we continue loading.";
    }


    if (connectionElement) {

        connectionElement.textContent =
            "Slow connection";
    }
}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoading() {

    if (!loaderElement) {
        return;
    }


    clearLoadingTimers();


    loaderVisible =
        false;


    loaderFailed =
        false;


    loaderElement.setAttribute(
        "aria-busy",
        "false"
    );


    loaderElement.classList.add(
        "is-hidden"
    );


    loaderElement.hidden = true;

    document.body.classList.remove(
    "twtms-page-loading"
    );


    loaderElement.classList.remove(
        "is-error",
        "is-offline",
        "is-slow"
    );
}


/* =========================================================
   LOADING ERROR
========================================================= */

function showLoadingError(
    message =
        "Unable to load the module. Please try again.",
    retryCallback =
        currentRetryCallback
) {

    createLoadingScreen();

    clearLoadingTimers();


    currentRetryCallback =
        typeof retryCallback === "function"
            ? retryCallback
            : currentRetryCallback;


    loaderVisible =
        true;


    loaderElement.hidden = false;


    loaderFailed =
        true;


    loaderElement.classList.remove(
        "is-hidden",
        "is-offline",
        "is-slow"
    );


    loaderElement.classList.add(
        "is-error"
    );


    loaderElement.setAttribute(
        "aria-busy",
        "false"
    );


    const titleElement =
        getLoaderElement(
            "#twtmsLoaderTitle"
        );


    const messageElement =
        getLoaderElement(
            "#twtmsLoaderMessage"
        );


    const connectionElement =
        getLoaderElement(
            "#twtmsLoaderConnectionText"
        );


    const statusIcon =
        getLoaderElement(
            ".twtms-loader-status-icon i"
        );


    if (titleElement) {

        titleElement.textContent =
            "Unable to load";
    }


    if (messageElement) {

        messageElement.textContent =
            message;
    }


    if (connectionElement) {

        connectionElement.textContent =
            navigator.onLine
                ? "Connection problem"
                : "Offline";
    }


    if (statusIcon) {

        statusIcon.className =
            "fa-solid fa-triangle-exclamation";
    }
}


/* =========================================================
   OFFLINE
========================================================= */

function showOffline(
    retryCallback =
        currentRetryCallback
) {

    createLoadingScreen();

    clearLoadingTimers();


    currentRetryCallback =
        typeof retryCallback === "function"
            ? retryCallback
            : currentRetryCallback;


    loaderVisible =
        true;


    loaderElement.hidden = false;


    loaderFailed =
        true;


    loaderElement.classList.remove(
        "is-hidden",
        "is-error",
        "is-slow"
    );


    loaderElement.classList.add(
        "is-offline"
    );


    loaderElement.setAttribute(
        "aria-busy",
        "false"
    );


    const titleElement =
        getLoaderElement(
            "#twtmsLoaderTitle"
        );


    const messageElement =
        getLoaderElement(
            "#twtmsLoaderMessage"
        );


    const connectionElement =
        getLoaderElement(
            "#twtmsLoaderConnectionText"
        );


    const statusIcon =
        getLoaderElement(
            ".twtms-loader-status-icon i"
        );


    if (titleElement) {

        titleElement.textContent =
            "No Internet Connection";
    }


    if (messageElement) {

        messageElement.textContent =
            "Please check your internet connection, then try again.";
    }


    if (connectionElement) {

        connectionElement.textContent =
            "Offline";
    }


    if (statusIcon) {

        statusIcon.className =
            "fa-solid fa-wifi";
    }
}


/* =========================================================
   CONNECTION RESTORED TOAST
========================================================= */

function showConnectionRestored() {

    let toast =
        document.getElementById(
            "twtmsConnectionToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "twtmsConnectionToast";


        toast.className =
            "twtms-connection-toast";


        toast.innerHTML = `
            <div class="twtms-connection-toast-icon">
                <i class="fa-solid fa-wifi"></i>
            </div>

            <div>
                <strong>
                    Connection restored
                </strong>

                <span>
                    You're back online.
                </span>
            </div>
        `;


        document.body.appendChild(
            toast
        );
    }


    requestAnimationFrame(
        () => {

            toast.classList.add(
                "show"
            );
        }
    );


    if (toastTimer) {

        clearTimeout(
            toastTimer
        );
    }


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );
}


/* =========================================================
   BROWSER CONNECTION EVENTS
========================================================= */

window.addEventListener(
    "offline",
    () => {

        console.warn(
            "TWTMS CONNECTION: Browser is offline."
        );


        /*
         * If a module is currently loading,
         * convert loader into offline state.
         */

        if (loaderVisible) {

            showOffline(
                currentRetryCallback
            );
        }
    }
);


window.addEventListener(
    "online",
    () => {

        console.log(
            "TWTMS CONNECTION: Browser is online."
        );


        showConnectionRestored();


        /*
         * Do NOT automatically retry/save anything.
         *
         * The user can press Retry if the loader
         * is currently showing an error.
         */

        if (
            loaderElement &&
            (
                loaderElement.classList.contains(
                    "is-offline"
                ) ||
                loaderElement.classList.contains(
                    "is-error"
                )
            )
        ) {

            const connectionElement =
                getLoaderElement(
                    "#twtmsLoaderConnectionText"
                );


            if (connectionElement) {

                connectionElement.textContent =
                    "Connection restored — ready to retry";
            }
        }
    }
);


/* =========================================================
   PUBLIC API
========================================================= */

window.TWTMSLoader = {

    show:
        showLoading,

    hide:
        hideLoading,

    error:
        showLoadingError,

    offline:
        showOffline,

    slow:
        showSlowConnection,

    connectionRestored:
        showConnectionRestored
};


/* =========================================================
   ES MODULE EXPORTS
========================================================= */

export {
    showLoading,
    hideLoading,
    showLoadingError,
    showOffline,
    showSlowConnection,
    showConnectionRestored
};


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "TWTMS GLOBAL LOADING SYSTEM LOADED"
);
