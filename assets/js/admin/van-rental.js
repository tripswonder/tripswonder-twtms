// ======================================================
// TRIPS WONDER - VAN RENTAL OPERATOR RATES
// ======================================================

import {
    db,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc
} from "../firebase/firebase-db.js";

import { requireAuth } from "../auth/auth-guard.js";

requireAuth({
    allowedRoles: ["owner", "admin"],
    requiredPermission: "packages"
});

document.addEventListener("DOMContentLoaded", async () => {
    const SEED_RATES = [{"category":"Northbound","destination":"Tarlac","dayTour":11000,"twoDOneN":13000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Northbound","destination":"Bulacan","dayTour":8000,"twoDOneN":9000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Northbound","destination":"Subic","dayTour":10000,"twoDOneN":14000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Northbound","destination":"Pampanga","dayTour":8500,"twoDOneN":11000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Northbound","destination":"Nueva Ecija","dayTour":11000,"twoDOneN":13000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Northbound","destination":"Manaoag","dayTour":11000,"twoDOneN":15000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Northbound","destination":"Baguio","dayTour":14000,"twoDOneN":18000,"threeDTwoN":21000,"notes":"","status":"active"},{"category":"Northbound","destination":"Sagada + Banaue","dayTour":null,"twoDOneN":21000,"threeDTwoN":25000,"notes":"","status":"active"},{"category":"Northbound","destination":"La Union","dayTour":14000,"twoDOneN":18000,"threeDTwoN":23000,"notes":"","status":"active"},{"category":"Northbound","destination":"Banaue + Sagada + Baguio","dayTour":null,"twoDOneN":24000,"threeDTwoN":26000,"notes":"","status":"active"},{"category":"Northbound","destination":"Mt. Ulap","dayTour":14000,"twoDOneN":17000,"threeDTwoN":20000,"notes":"","status":"active"},{"category":"Northbound","destination":"Buscalan","dayTour":null,"twoDOneN":22000,"threeDTwoN":26000,"notes":"","status":"active"},{"category":"Northbound","destination":"Cagayan (Palaui)","dayTour":null,"twoDOneN":null,"threeDTwoN":33000,"notes":"","status":"active"},{"category":"Northbound","destination":"Abra + Vigan","dayTour":null,"twoDOneN":23000,"threeDTwoN":27000,"notes":"","status":"active"},{"category":"Northbound","destination":"Aw-Asen","dayTour":16000,"twoDOneN":19000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Northbound","destination":"Ilocos","dayTour":null,"twoDOneN":22000,"threeDTwoN":25000,"notes":"","status":"active"},{"category":"Northbound","destination":"Isabela","dayTour":null,"twoDOneN":null,"threeDTwoN":25000,"notes":"","status":"active"},{"category":"Northbound","destination":"Alaminos","dayTour":14000,"twoDOneN":16000,"threeDTwoN":19000,"notes":"","status":"active"},{"category":"Northbound","destination":"Bolinao","dayTour":15000,"twoDOneN":17000,"threeDTwoN":20000,"notes":"","status":"active"},{"category":"Northbound","destination":"Burgos","dayTour":14000,"twoDOneN":16000,"threeDTwoN":19000,"notes":"","status":"active"},{"category":"Northbound","destination":"Baler","dayTour":15000,"twoDOneN":17000,"threeDTwoN":20000,"notes":"","status":"active"},{"category":"Northbound","destination":"Mariveles","dayTour":11000,"twoDOneN":14000,"threeDTwoN":17000,"notes":"","status":"active"},{"category":"Northbound","destination":"Bagac","dayTour":12000,"twoDOneN":14000,"threeDTwoN":17000,"notes":"","status":"active"},{"category":"Northbound","destination":"Morong","dayTour":12000,"twoDOneN":14000,"threeDTwoN":17000,"notes":"","status":"active"},{"category":"Northbound","destination":"Dingalan","dayTour":10000,"twoDOneN":14000,"threeDTwoN":17000,"notes":"","status":"active"},{"category":"Northbound","destination":"Potipot","dayTour":15000,"twoDOneN":18000,"threeDTwoN":21000,"notes":"","status":"active"},{"category":"Northbound","destination":"Magalawa","dayTour":15000,"twoDOneN":18000,"threeDTwoN":21000,"notes":"","status":"active"},{"category":"Northbound","destination":"Dinadiawan","dayTour":16000,"twoDOneN":18000,"threeDTwoN":21000,"notes":"","status":"active"},{"category":"Northbound","destination":"Casiguran","dayTour":17000,"twoDOneN":20000,"threeDTwoN":23000,"notes":"","status":"active"},{"category":"Northbound","destination":"Masinloc","dayTour":14000,"twoDOneN":17000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Northbound","destination":"Zambales (San Antonio / Nagsasa / Anawangin / Pundaquit / Lake Mapanuepe / Liwliwa / Kapigpiglatan)","dayTour":11000,"twoDOneN":14500,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Enchanted Kingdom","dayTour":8500,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Tagaytay","dayTour":10000,"twoDOneN":13000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Tanay","dayTour":8000,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Masungi","dayTour":8000,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Pansol","dayTour":8000,"twoDOneN":10000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Batangas City / Pier","dayTour":null,"twoDOneN":null,"threeDTwoN":null,"notes":"Drop-off ₱9,000","status":"active"},{"category":"Southbound","destination":"Puerto Galera","dayTour":null,"twoDOneN":null,"threeDTwoN":20000,"notes":"Excluding RORO","status":"active"},{"category":"Southbound","destination":"Lobo","dayTour":11000,"twoDOneN":14000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Laiya","dayTour":11000,"twoDOneN":14000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Ternate / Pico de Loro","dayTour":9000,"twoDOneN":12000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Nasugbu","dayTour":11000,"twoDOneN":14000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"San Juan","dayTour":11000,"twoDOneN":15000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Gulugod Baboy","dayTour":9500,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Borawan","dayTour":14000,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Calatagan","dayTour":12000,"twoDOneN":14000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Matabungkay","dayTour":11000,"twoDOneN":14000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Real, Quezon","dayTour":11000,"twoDOneN":13000,"threeDTwoN":17000,"notes":"","status":"active"},{"category":"Southbound","destination":"Gen. Luna Port","dayTour":15000,"twoDOneN":18000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"San Andres Port","dayTour":18000,"twoDOneN":21000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Lucban / Pagbilao","dayTour":11000,"twoDOneN":14000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Southbound","destination":"Albay (Bicol Tri-City)","dayTour":null,"twoDOneN":null,"threeDTwoN":28000,"notes":"","status":"active"},{"category":"Southbound","destination":"Calaguas","dayTour":null,"twoDOneN":18000,"threeDTwoN":21000,"notes":"","status":"active"},{"category":"Southbound","destination":"Caramoan","dayTour":null,"twoDOneN":24000,"threeDTwoN":26000,"notes":"","status":"active"},{"category":"Southbound","destination":"Matnog","dayTour":null,"twoDOneN":null,"threeDTwoN":31000,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Batolusong","dayTour":8500,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Batulao","dayTour":9000,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Cayabu","dayTour":9000,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Daraitan","dayTour":9500,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. 387","dayTour":12000,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Maculot","dayTour":9000,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Manalmon","dayTour":9000,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Maynoba","dayTour":8500,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Pinatubo","dayTour":11000,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Pulag","dayTour":null,"twoDOneN":20000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Purgatory","dayTour":null,"twoDOneN":20000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Sawi","dayTour":12000,"twoDOneN":14000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Tapulao","dayTour":15000,"twoDOneN":18000,"threeDTwoN":21000,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Ugo","dayTour":null,"twoDOneN":20000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Ulap","dayTour":15000,"twoDOneN":18000,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Amuyao (Batad)","dayTour":null,"twoDOneN":20000,"threeDTwoN":23000,"notes":"Original list supplied two rates without duration labels; mapped to 2D1N / 3D2N for review.","status":"active"},{"category":"Mountaineer","destination":"Mt. Mariglem","dayTour":12000,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"},{"category":"Mountaineer","destination":"Mt. Kapigpiglatan","dayTour":11000,"twoDOneN":null,"threeDTwoN":null,"notes":"","status":"active"}];
    const COLLECTION = "vanRentalRates";
    const LOW_ADJUSTMENT = -2000;
    const XL_ADJUSTMENT = 3000;

    let rates = [];
    let editingId = null;

    const $ = id => document.getElementById(id);
    const money = value => Number.isFinite(Number(value)) && Number(value) > 0
        ? new Intl.NumberFormat("en-PH", {style:"currency",currency:"PHP",maximumFractionDigits:0}).format(Number(value))
        : "—";

    function adjusted(value, unit) {
        const base = Number(value);
        if (!Number.isFinite(base) || base <= 0) return null;
        if (unit === "low") return Math.max(0, base + LOW_ADJUSTMENT);
        if (unit === "xl") return base + XL_ADJUSTMENT;
        return base;
    }

    async function loadRates() {
        const snapshot = await getDocs(collection(db, COLLECTION));
        rates = snapshot.docs.map(s => ({id:s.id,...s.data()}));

        if (!rates.length) {
            $("resultText").textContent = "Setting up initial operator rates...";
            for (const item of SEED_RATES) {
                await addDoc(collection(db, COLLECTION), {
                    ...item,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            const seeded = await getDocs(collection(db, COLLECTION));
            rates = seeded.docs.map(s => ({id:s.id,...s.data()}));
        }
        render();
    }

    function render() {
        const query = ($("rateSearch").value || "").trim().toLowerCase();
        const category = $("categoryFilter").value;
        const unit = $("unitFilter").value;

        const filtered = rates
            .filter(r => r.status !== "inactive")
            .filter(r => category === "all" || r.category === category)
            .filter(r => !query || String(r.destination || "").toLowerCase().includes(query))
            .sort((a,b) => String(a.destination).localeCompare(String(b.destination)));

        $("totalRates").textContent = rates.filter(r => r.status !== "inactive").length;
        $("northCount").textContent = rates.filter(r => r.status !== "inactive" && r.category === "Northbound").length;
        $("southCount").textContent = rates.filter(r => r.status !== "inactive" && r.category === "Southbound").length;
        $("mountainCount").textContent = rates.filter(r => r.status !== "inactive" && r.category === "Mountaineer").length;
        $("resultText").textContent = `${filtered.length} destination${filtered.length === 1 ? "" : "s"} · ${unit === "low" ? "Low Roof" : unit === "xl" ? "XL Van" : "High Roof"} rates`;

        $("rateTableBody").innerHTML = filtered.map(r => `
            <tr>
                <td class="destination-cell"><strong>${escapeHtml(r.destination)}</strong></td>
                <td><span class="category-pill">${escapeHtml(r.category)}</span></td>
                <td class="${r.dayTour ? "money" : "not-set"}">${money(adjusted(r.dayTour,unit))}</td>
                <td class="${r.twoDOneN ? "money" : "not-set"}">${money(adjusted(r.twoDOneN,unit))}</td>
                <td class="${r.threeDTwoN ? "money" : "not-set"}">${money(adjusted(r.threeDTwoN,unit))}</td>
                <td class="notes">${escapeHtml(r.notes || "—")}</td>
                <td><button class="edit-btn" type="button" data-edit-id="${r.id}" title="Edit rate"><i class="fa-solid fa-pen"></i></button></td>
            </tr>`).join("");

        $("emptyState").hidden = filtered.length > 0;
        $("rateTableBody").closest(".rate-table-wrap").hidden = filtered.length === 0;
    }

    function escapeHtml(v) {
        return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
    }

    function openModal(rate = null) {
        editingId = rate?.id || null;
        $("rateModalTitle").textContent = editingId ? "Edit Operator Rate" : "Add Operator Rate";
        $("rateDestination").value = rate?.destination || "";
        $("rateCategory").value = rate?.category || "Northbound";
        $("rateStatus").value = rate?.status || "active";
        $("rateDayTour").value = rate?.dayTour || "";
        $("rate2D1N").value = rate?.twoDOneN || "";
        $("rate3D2N").value = rate?.threeDTwoN || "";
        $("rateNotes").value = rate?.notes || "";
        $("rateModal").classList.add("open");
        $("rateModal").setAttribute("aria-hidden","false");
        $("rateDestination").focus();
    }

    function closeModal() {
        $("rateModal").classList.remove("open");
        $("rateModal").setAttribute("aria-hidden","true");
        editingId = null;
    }

    $("backToPackages").addEventListener("click", () => location.href = "packages.html");
    $("addRateButton").addEventListener("click", () => openModal());
    $("rateSearch").addEventListener("input", render);
    $("categoryFilter").addEventListener("change", render);
    $("unitFilter").addEventListener("change", render);
    document.querySelectorAll("[data-close-rate-modal]").forEach(el => el.addEventListener("click", closeModal));

    $("rateTableBody").addEventListener("click", event => {
        const btn = event.target.closest("[data-edit-id]");
        if (!btn) return;
        const rate = rates.find(r => r.id === btn.dataset.editId);
        if (rate) openModal(rate);
    });

    $("rateForm").addEventListener("submit", async event => {
        event.preventDefault();
        const payload = {
            destination: $("rateDestination").value.trim(),
            category: $("rateCategory").value,
            status: $("rateStatus").value,
            dayTour: Number($("rateDayTour").value) || null,
            twoDOneN: Number($("rate2D1N").value) || null,
            threeDTwoN: Number($("rate3D2N").value) || null,
            notes: $("rateNotes").value.trim(),
            updatedAt: new Date().toISOString()
        };

        const save = $("saveRateButton");
        save.disabled = true;
        save.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        try {
            if (editingId) {
                await updateDoc(doc(db, COLLECTION, editingId), payload);
            } else {
                await addDoc(collection(db, COLLECTION), {...payload,createdAt:new Date().toISOString()});
            }
            closeModal();
            await loadRates();
        } catch (error) {
            console.error("VAN RATE SAVE ERROR:", error);
            alert("Unable to save the van rate. Please try again.");
        } finally {
            save.disabled = false;
            save.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Rate';
        }
    });

    try {
        await loadRates();
    } catch (error) {
        console.error("VAN RENTAL LOAD ERROR:", error);
        $("resultText").textContent = "Unable to load van rental rates.";
    }
});
