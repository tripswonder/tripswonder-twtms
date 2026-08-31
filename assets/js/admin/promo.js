"use strict";

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

import {
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

requireAuth({
    allowedRoles: ["owner", "admin"],
    requiredPermission: "promo",
    onAuthorized: () => {}
});

document.addEventListener("DOMContentLoaded", () => {

    let promos = [];
    let packages = [];
    let editingPromoId = null;

    const $ = id => document.getElementById(id);

    const tableBody = $("promoTableBody");
    const emptyState = $("promoEmpty");
    const modal = $("promoModal");
    const form = $("promoForm");
    const search = $("promoSearch");
    const statusFilter = $("promoStatusFilter");
    const sort = $("promoSort");
    const applicableTo = $("applicableTo");
    const packageField = $("packageField");
    const packageSelect = $("packageId");

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, ch => ({
            "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
        })[ch]);
    }

    function numberValue(id) {
        const n = Number($(id)?.value || 0);
        return Number.isFinite(n) ? n : 0;
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function effectiveStatus(promo) {
        if (promo.status === "disabled" || promo.status === "draft") return promo.status;

        const now = Date.now();
        const start = promo.validFrom ? Date.parse(promo.validFrom) : 0;
        const end = promo.validUntil ? Date.parse(promo.validUntil) : 0;

        if (start && now < start) return "scheduled";
        if (end && now > end) return "expired";

        if (promo.usageLimit > 0 && Number(promo.usedCount || 0) >= promo.usageLimit) {
            return "expired";
        }

        return "active";
    }

    function formatMoney(value) {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 2
        }).format(Number(value || 0));
    }

    function formatDate(value) {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "—";
        return date.toLocaleDateString("en-PH", {
            month: "short", day: "numeric", year: "numeric"
        });
    }

    function formatDiscount(promo) {
        const type = promo.discountType || "fixed";
        const value = Number(promo.discountValue || 0);

        if (type === "percentage") {
            return `${value}%`;
        }

        if (type === "per_pax") {
            return `${formatMoney(value)} / pax`;
        }

        return `${formatMoney(value)} / booking`;
    }

    async function loadData() {
        showLoading({
            title: "Loading Promos...",
            message: "Please wait while we load promo records.",
            retry: loadData
        });

        try {
            const [promoSnap, packageSnap] = await Promise.all([
                getDocs(collection(db, "promos")),
                getDocs(collection(db, "packages"))
            ]);

            promos = promoSnap.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

            packages = packageSnap.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

            populatePackages();
            render();
            hideLoading();
        } catch (error) {
            console.error("PROMO LOAD ERROR:", error);
            showLoadingError(
                navigator.onLine
                    ? "Unable to load Promo module. Please try again."
                    : "No internet connection. Check your connection and try again.",
                loadData
            );
        }
    }

    function populatePackages() {
        packageSelect.innerHTML = `<option value="">Select package</option>` +
            packages
                .filter(item => (item.status || "active") === "active")
                .sort((a,b) => String(a.name || "").localeCompare(String(b.name || "")))
                .map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name || "Untitled Package")}</option>`)
                .join("");
    }

    function updateSummary() {
        $("totalPromos").textContent = promos.length;
        $("activePromos").textContent = promos.filter(p => effectiveStatus(p) === "active").length;
        $("scheduledPromos").textContent = promos.filter(p => effectiveStatus(p) === "scheduled").length;
        $("expiredPromos").textContent = promos.filter(p => effectiveStatus(p) === "expired").length;
    }

    function render() {
        updateSummary();

        const q = (search.value || "").trim().toLowerCase();
        const selectedStatus = statusFilter.value || "all";

        let list = promos.filter(promo => {
            const packageName = promo.packageName || "";
            const searchable = [
                promo.title, promo.code, promo.description, packageName
            ].filter(Boolean).join(" ").toLowerCase();

            const status = effectiveStatus(promo);
            return (!q || searchable.includes(q))
                && (selectedStatus === "all" || status === selectedStatus);
        });

        if (sort.value === "code-asc") {
            list.sort((a,b) => String(a.code || "").localeCompare(String(b.code || "")));
        } else if (sort.value === "ending-soon") {
            list.sort((a,b) => Date.parse(a.validUntil || "9999-12-31") - Date.parse(b.validUntil || "9999-12-31"));
        } else {
            list.sort((a,b) => Date.parse(b.createdAt || 0) - Date.parse(a.createdAt || 0));
        }

        $("promoResultText").textContent =
            `Showing ${list.length} of ${promos.length} promo${promos.length === 1 ? "" : "s"}`;

        tableBody.innerHTML = "";
        emptyState.hidden = list.length !== 0;

        list.forEach(promo => {
            const tr = document.createElement("tr");
            const status = effectiveStatus(promo);

            const discount = formatDiscount(promo);

            const applicable = promo.applicableTo === "package"
                ? (promo.packageName || "Specific Package")
                : "All Packages";

            const usage = Number(promo.usageLimit || 0) > 0
                ? `${Number(promo.usedCount || 0)} / ${Number(promo.usageLimit)}`
                : `${Number(promo.usedCount || 0)} / Unlimited`;

            const minimumPax = Math.max(1, Number(promo.minimumPax || 1));

            tr.innerHTML = `
                <td>
                    <div class="promo-name">
                        <strong>${escapeHtml(promo.title || "Untitled Promo")}</strong>
                        <span class="promo-code">${escapeHtml(promo.code || "")}</span>
                    </div>
                </td>
                <td>
                    <strong>${escapeHtml(discount)}</strong>
                    <small style="display:block;margin-top:4px;color:#7d91ad;">
                        Min. ${escapeHtml(minimumPax)} pax
                    </small>
                </td>
                <td>${escapeHtml(applicable)}</td>
                <td>${escapeHtml(formatDate(promo.validFrom))} – ${escapeHtml(formatDate(promo.validUntil))}</td>
                <td>${escapeHtml(usage)}</td>
                <td><span class="status-badge status-${escapeHtml(status)}">${escapeHtml(status)}</span></td>
                <td>
                    <div class="action-row">
                        <button class="icon-button edit-promo" data-id="${escapeHtml(promo.id)}" title="Edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button class="icon-button delete-promo" data-id="${escapeHtml(promo.id)}" title="Delete">
                            <i class="fa-regular fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            `;

            tableBody.appendChild(tr);
        });
    }

    function openModal(promo = null) {
        editingPromoId = promo?.id || null;
        form.reset();

        $("promoModalTitle").textContent = promo ? "Edit Promo" : "Create Promo";
        $("promoId").value = editingPromoId || "";
        $("promoTitle").value = promo?.title || "";
        $("promoCode").value = promo?.code || "";
        $("promoStatus").value = promo?.status || "draft";
        $("discountType").value = promo?.discountType || "fixed";
        $("discountValue").value = promo?.discountValue ?? "";
        $("minimumPax").value = Math.max(1, Number(promo?.minimumPax || 1));
        $("minimumAmount").value = promo?.minimumAmount ?? 0;
        $("maximumDiscount").value = promo?.maximumDiscount ?? "";
        $("validFrom").value = toLocalInput(promo?.validFrom);
        $("validUntil").value = toLocalInput(promo?.validUntil);
        $("usageLimit").value = promo?.usageLimit ?? 0;
        $("perCustomerLimit").value = promo?.perCustomerLimit ?? 1;
        $("applicableTo").value = promo?.applicableTo || "all";
        $("packageId").value = promo?.packageId || "";
        $("promoDescription").value = promo?.description || "";
        $("promoTerms").value = promo?.terms || "";

        updatePackageField();
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        editingPromoId = null;
    }

    function toLocalInput(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        const offset = date.getTimezoneOffset();
        return new Date(date.getTime() - offset * 60000).toISOString().slice(0,16);
    }

    function updatePackageField() {
        const specific = applicableTo.value === "package";
        packageField.hidden = !specific;
        packageSelect.required = specific;
    }

    async function savePromo(event) {
        event.preventDefault();

        const code = $("promoCode").value.trim().toUpperCase();
        const title = $("promoTitle").value.trim();
        const validFromRaw = $("validFrom").value;
        const validUntilRaw = $("validUntil").value;
        const discountType = $("discountType").value;
        const discountValue = numberValue("discountValue");
        const minimumPax = Math.max(1, Math.floor(numberValue("minimumPax") || 1));

        if (!title || !code || !validFromRaw || !validUntilRaw) {
            alert("Please complete all required promo fields.");
            return;
        }

        if (discountValue <= 0) {
            alert("Discount Value must be greater than 0.");
            return;
        }

        const validFrom = new Date(validFromRaw);
        const validUntil = new Date(validUntilRaw);

        if (validUntil <= validFrom) {
            alert("Valid Until must be later than Valid From.");
            return;
        }

        if (discountType === "percentage" && discountValue > 100) {
            alert("Percentage discount cannot be more than 100%.");
            return;
        }

        const duplicate = promos.find(item =>
            String(item.code || "").toUpperCase() === code &&
            item.id !== editingPromoId
        );

        if (duplicate) {
            alert("Promo code already exists.");
            return;
        }

        if (applicableTo.value === "package" && !packageSelect.value) {
            alert("Please select the package for this promo.");
            return;
        }

        const selectedPackage = packages.find(item => item.id === packageSelect.value);

        const payload = {
            title,
            code,
            status: $("promoStatus").value,
            discountType,
            discountValue,
            minimumPax,
            minimumAmount: numberValue("minimumAmount"),
            maximumDiscount: numberValue("maximumDiscount"),
            validFrom: validFrom.toISOString(),
            validUntil: validUntil.toISOString(),
            usageLimit: Math.max(0, Math.floor(numberValue("usageLimit"))),
            perCustomerLimit: Math.max(1, Math.floor(numberValue("perCustomerLimit") || 1)),
            applicableTo: applicableTo.value,
            packageId: applicableTo.value === "package" ? packageSelect.value : "",
            packageName: applicableTo.value === "package" ? (selectedPackage?.name || "") : "All Packages",
            description: $("promoDescription").value.trim(),
            terms: $("promoTerms").value.trim(),
            updatedAt: nowIso()
        };

        try {
            $("savePromoButton").disabled = true;

            if (editingPromoId) {
                await updateDoc(doc(db, "promos", editingPromoId), payload);
            } else {
                await addDoc(collection(db, "promos"), {
                    ...payload,
                    usedCount: 0,
                    createdAt: nowIso()
                });
            }

            closeModal();
            await loadData();

        } catch (error) {
            console.error("PROMO SAVE ERROR:", error);
            alert("Unable to save promo. Please check Firestore permissions and try again.");
        } finally {
            $("savePromoButton").disabled = false;
        }
    }

    async function removePromo(id) {
        const promo = promos.find(item => item.id === id);
        if (!promo) return;

        if (!confirm(`Delete promo "${promo.title || promo.code}"?`)) return;

        try {
            await deleteDoc(doc(db, "promos", id));
            await loadData();
        } catch (error) {
            console.error("PROMO DELETE ERROR:", error);
            alert("Unable to delete promo.");
        }
    }

    $("addPromoButton").addEventListener("click", () => openModal());
    $("closePromoModal").addEventListener("click", closeModal);
    $("cancelPromo").addEventListener("click", closeModal);
    form.addEventListener("submit", savePromo);
    applicableTo.addEventListener("change", updatePackageField);
    search.addEventListener("input", render);
    statusFilter.addEventListener("change", render);
    sort.addEventListener("change", render);

    $("promoCode").addEventListener("input", event => {
        event.target.value = event.target.value.toUpperCase().replace(/\s+/g, "");
    });

    tableBody.addEventListener("click", event => {
        const edit = event.target.closest(".edit-promo");
        const remove = event.target.closest(".delete-promo");

        if (edit) {
            const promo = promos.find(item => item.id === edit.dataset.id);
            if (promo) openModal(promo);
        }

        if (remove) removePromo(remove.dataset.id);
    });

    modal.addEventListener("click", event => {
        if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    loadData();
});
