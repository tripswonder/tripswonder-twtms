"use strict";

import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    collection,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const promoLoading =
    document.getElementById("promoLoading");

const promoEmpty =
    document.getElementById("promoEmpty");

const promoList =
    document.getElementById("promoList");

const copyToast =
    document.getElementById("copyToast");

let unsubscribePromos =
    null;

onAuthStateChanged(
    auth,
    user => {

        if (!user) {
            window.location.href =
                "../../index.html";
            return;
        }

        subscribeActivePromos();
    }
);

function subscribeActivePromos() {

    unsubscribePromos?.();

    const promoQuery =
        query(
            collection(
                db,
                "promos"
            ),
            where(
                "status",
                "==",
                "active"
            )
        );

    unsubscribePromos =
        onSnapshot(
            promoQuery,
            snapshot => {

                const promos =
                    snapshot.docs
                        .map(
                            item => ({
                                id: item.id,
                                ...item.data()
                            })
                        )
                        .filter(
                            isPromoCurrentlyAvailable
                        )
                        .sort(
                            (a, b) =>
                                getTimestamp(
                                    a.validUntil
                                ) -
                                getTimestamp(
                                    b.validUntil
                                )
                        );

                renderPromos(
                    promos
                );
            },
            error => {

                console.error(
                    "CUSTOMER PROMO LOAD ERROR:",
                    error
                );

                promoLoading.hidden =
                    true;

                promoList.hidden =
                    true;

                promoEmpty.hidden =
                    false;

                promoEmpty.querySelector("h2")
                    .textContent =
                    "Unable to Load Promos";

                promoEmpty.querySelector("p")
                    .textContent =
                    "Please refresh the page and try again.";
            }
        );
}

function isPromoCurrentlyAvailable(
    promo
) {

    const now =
        Date.now();

    const validFrom =
        getTimestamp(
            promo.validFrom
        );

    const validUntil =
        getTimestamp(
            promo.validUntil
        );

    const usageLimit =
        Number(
            promo.usageLimit ||
            0
        );

    const usedCount =
        Number(
            promo.usedCount ||
            0
        );

    if (
        validFrom &&
        now < validFrom
    ) {
        return false;
    }

    if (
        validUntil &&
        now > validUntil
    ) {
        return false;
    }

    if (
        usageLimit > 0 &&
        usedCount >= usageLimit
    ) {
        return false;
    }

    return true;
}

function renderPromos(
    promos
) {

    promoLoading.hidden =
        true;

    if (!promos.length) {

        promoList.hidden =
            true;

        promoEmpty.hidden =
            false;

        return;
    }

    promoEmpty.hidden =
        true;

    promoList.hidden =
        false;

    promoList.innerHTML =
        promos
            .map(
                renderPromoCard
            )
            .join("");
}

function renderPromoCard(
    promo
) {

    const discountText =
        promo.discountType ===
        "percentage"
            ? `${formatNumber(
                promo.discountValue
            )}% OFF`
            : `${formatMoney(
                promo.discountValue
            )} OFF`;

    const applicableText =
        promo.applicableTo ===
        "package"
            ? (
                promo.packageName ||
                "Selected package"
            )
            : "All Trips Wonder packages";

    const minimumText =
        Number(
            promo.minimumAmount ||
            0
        ) > 0
            ? `Minimum booking: ${formatMoney(
                promo.minimumAmount
            )}`
            : "No minimum booking amount";

    const maxDiscount =
        promo.discountType ===
            "percentage" &&
        Number(
            promo.maximumDiscount ||
            0
        ) > 0
            ? `
                <div class="promo-meta-row">
                    <i class="fa-solid fa-arrow-down-short-wide"></i>
                    <span>
                        Maximum discount:
                        <strong>${escapeHTML(
                            formatMoney(
                                promo.maximumDiscount
                            )
                        )}</strong>
                    </span>
                </div>
            `
            : "";

    const terms =
        String(
            promo.terms ||
            ""
        ).trim();

    return `
        <article class="promo-card">

            <div class="promo-card-top">

                <span class="promo-card-badge">
                    <i class="fa-solid fa-circle-check"></i>
                    Active Promo
                </span>

                <h2>
                    ${escapeHTML(
                        promo.title ||
                        "Trips Wonder Promo"
                    )}
                </h2>

                <div class="promo-discount">
                    ${escapeHTML(
                        discountText
                    )}
                </div>

            </div>

            <div class="promo-card-body">

                ${
                    promo.description
                        ? `
                            <p class="promo-description">
                                ${escapeHTML(
                                    promo.description
                                )}
                            </p>
                        `
                        : ""
                }

                <div class="promo-meta">

                    <div class="promo-meta-row">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>
                            Applicable to:
                            <strong>${escapeHTML(
                                applicableText
                            )}</strong>
                        </span>
                    </div>

                    <div class="promo-meta-row">
                        <i class="fa-regular fa-calendar"></i>
                        <span>
                            Valid until:
                            <strong>${escapeHTML(
                                formatDate(
                                    promo.validUntil
                                )
                            )}</strong>
                        </span>
                    </div>

                    <div class="promo-meta-row">
                        <i class="fa-solid fa-receipt"></i>
                        <span>
                            ${escapeHTML(
                                minimumText
                            )}
                        </span>
                    </div>

                    ${maxDiscount}

                </div>

                <div class="promo-code-box">

                    <div class="promo-code-copy">
                        <span>Promo Code</span>
                        <strong>
                            ${escapeHTML(
                                promo.code ||
                                ""
                            )}
                        </strong>
                    </div>

                    <button
                        type="button"
                        class="copy-promo-button"
                        data-promo-code="${escapeAttr(
                            promo.code ||
                            ""
                        )}"
                    >
                        <i class="fa-regular fa-copy"></i>
                        Copy
                    </button>

                </div>

                ${
                    terms
                        ? `
                            <details class="promo-terms">
                                <summary>
                                    Terms & Conditions
                                </summary>
                                <p>${escapeHTML(
                                    terms
                                )}</p>
                            </details>
                        `
                        : ""
                }

            </div>

        </article>
    `;
}

promoList?.addEventListener(
    "click",
    async event => {

        const button =
            event.target.closest(
                ".copy-promo-button"
            );

        if (!button) {
            return;
        }

        const code =
            button.dataset.promoCode ||
            "";

        if (!code) {
            return;
        }

        try {

            await navigator.clipboard
                .writeText(
                    code
                );

        } catch {

            const textarea =
                document.createElement(
                    "textarea"
                );

            textarea.value =
                code;

            textarea.style.position =
                "fixed";

            textarea.style.opacity =
                "0";

            document.body.appendChild(
                textarea
            );

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();
        }

        showCopyToast(
            `${code} copied`
        );
    }
);

function showCopyToast(
    text
) {

    if (!copyToast) {
        return;
    }

    copyToast.textContent =
        text;

    copyToast.classList.add(
        "show"
    );

    clearTimeout(
        showCopyToast.timer
    );

    showCopyToast.timer =
        setTimeout(
            () => {
                copyToast.classList.remove(
                    "show"
                );
            },
            1800
        );
}

function getTimestamp(
    value
) {

    if (!value) {
        return 0;
    }

    if (
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .getTime();
    }

    const parsed =
        Date.parse(
            value
        );

    return Number.isNaN(
        parsed
    )
        ? 0
        : parsed;
}

function formatDate(
    value
) {

    const timestamp =
        getTimestamp(
            value
        );

    if (!timestamp) {
        return "No expiry";
    }

    return new Date(
        timestamp
    ).toLocaleDateString(
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

function formatMoney(
    value
) {

    return new Intl
        .NumberFormat(
            "en-PH",
            {
                style:
                    "currency",

                currency:
                    "PHP",

                maximumFractionDigits:
                    2
            }
        )
        .format(
            Number(
                value ||
                0
            )
        );
}

function formatNumber(
    value
) {

    return new Intl
        .NumberFormat(
            "en-PH",
            {
                maximumFractionDigits:
                    2
            }
        )
        .format(
            Number(
                value ||
                0
            )
        );
}

function escapeHTML(
    value
) {

    return String(
        value ??
        ""
    ).replace(
        /[&<>"']/g,
        char => ({
            "&":
                "&amp;",

            "<":
                "&lt;",

            ">":
                "&gt;",

            '"':
                "&quot;",

            "'":
                "&#039;"
        })[char]
    );
}

function escapeAttr(
    value
) {

    return escapeHTML(
        value
    );
}
