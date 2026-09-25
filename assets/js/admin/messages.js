"use strict";







import { auth, db } from "../firebase/firebase-config.js";







import {



    collection,



    doc,



    getDoc,



    onSnapshot,



    orderBy,



    query,



    serverTimestamp,



    setDoc,



    updateDoc,



    addDoc



} from "https\://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";







import {



    onAuthStateChanged



} from "https\://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";







const state = {



    admin: null,



    conversations: [],



    activeConversation: null,



    currentMessages: [],



    unsubscribeConversations: null,



    unsubscribeMessages: null,



    filter: "all",



    search: ""



};







const el = {};



const $ = id => document.getElementById(id);







document.addEventListener("DOMContentLoaded", () => {



    Object.assign(el, {



        workspace: document.querySelector(".messages-workspace"),



        list: $("conversationList"),



        count: $("conversationCount"),



        unread: $("adminUnreadTotal"),



        search: $("conversationSearch"),



        filters: $("conversationFilters"),



        emptyChat: $("emptyChat"),



        activeChat: $("activeChat"),



        stream: $("messageStream"),



        form: $("adminMessageForm"),



        input: $("adminMessageInput"),



        send: $("adminSendButton"),



        chatAvatar: $("chatAvatar"),



        chatName: $("chatCustomerName"),



        chatMeta: $("chatCustomerMeta"),



        detailsEmpty: $("detailsEmpty"),



        detailsContent: $("detailsContent"),



        detailsAvatar: $("detailsAvatar"),



        detailsName: $("detailsName"),



        detailsEmail: $("detailsEmail"),



        detailsContact: $("detailsContact"),



        detailsType: $("detailsType"),



        detailsBooking: $("detailsBooking"),



        detailsTravelDate: $("detailsTravelDate"),



        viewCustomer: $("viewCustomerButton"),



        viewBooking: $("viewBookingButton"),







        supportModeBadge: $("supportModeBadge"),



        supportAssignment: $("supportAssignment"),



        supportAssignedAdmin: $("supportAssignedAdmin"),
        handoffBriefUpdated: $("handoffBriefUpdated"),
        handoffClientQuestion: $("handoffClientQuestion"),
        handoffNeedsCheck: $("handoffNeedsCheck"),
        handoffSystemStatus: $("handoffSystemStatus"),
        handoffAdminAction: $("handoffAdminAction"),



        returnToSupport: $("returnToSupportButton"),



        supportActionNote: $("supportActionNote")



    });







    bindUI();



    startAuth();



});







function bindUI() {



    el.search?.addEventListener("input", e => {



        state.search = e.target.value.trim().toLowerCase();



        renderConversations();



    });







    el.filters?.addEventListener("click", e => {



        const button = e.target.closest("[data-filter]");



        if (!button) return;







        state.filter = button.dataset.filter;



        el.filters.querySelectorAll(".filter-btn").forEach(b => {



            b.classList.toggle("active", b === button);



        });



        renderConversations();



    });







    el.list?.addEventListener("click", event => {



        const item = event.target.closest(".conversation-item");



        if (!item) return;







        const conversationId = item.dataset.id;



        if (!conversationId) {



            console.warn("MESSAGES: Conversation ID missing.");



            return;



        }







        openConversation(conversationId);



    });







    el.form?.addEventListener("submit", sendAdminMessage);



    el.returnToSupport?.addEventListener("click", returnConversationToSupport);



}







function startAuth() {



    onAuthStateChanged(auth, async user => {



        if (!user) {



            window.location.href = "../login.html";



            return;



        }







        const userSnap = await getDoc(doc(db, "users", user.uid));



        const profile = userSnap.exists() ? userSnap.data() : {};



        const role = String(profile.role || "").toLowerCase();







        if (!["owner", "admin", "staff"].includes(role)) {



            console.error("Messages: admin access denied.");



            return;



        }







        state.admin = {



            uid: user.uid,



            name:



                profile.fullName ||



                profile.name ||



                profile.displayName ||



                user.displayName ||



                "Trips Wonder Admin"



        };







        subscribeConversations();



    });



}







function subscribeConversations() {



    state.unsubscribeConversations?.();







    const q = query(



        collection(db, "conversations"),



        orderBy("lastMessageAt", "desc")



    );







    state.unsubscribeConversations = onSnapshot(q, snap => {



        state.conversations = snap.docs.map(d => ({



            id: d.id,



            ...d.data()



        }));







        renderConversations();







        if (state.activeConversation) {



            const refreshed = state.conversations.find(



                c => c.id === state.activeConversation.id



            );







            if (refreshed) {



                state.activeConversation = refreshed;



                renderCustomerDetails(refreshed);



            }



        }



    }, error => {



        console.error("Conversation listener error:", error);



        el.list.innerHTML = stateMessage("Unable to load conversations.");



    });



}







function filteredConversations() {



    return state.conversations.filter(c => {



        const haystack = [



            c.customerName,



            c.customerEmail,



            c.customerContact,



            c.lastMessage,



            c.bookingReference,



            c.destination



        ].join(" ").toLowerCase();







        const searchOK = !state.search || haystack.includes(state.search);



        const unread = Number(c.unreadAdmin || 0) > 0;



        const type = String(c.type || "inquiry").toLowerCase();







        const filterOK =



            state.filter === "all" ||



            (state.filter === "unread" && unread) ||



            state.filter === type;







        return searchOK && filterOK;



    });



}







function renderConversations() {



    const items = filteredConversations();



    const unreadTotal = state.conversations.reduce(



        (sum, c) => sum + Number(c.unreadAdmin || 0),



        0



    );







    el.count.textContent =



        `${state.conversations.length} conversation${state.conversations.length === 1 ? "" : "s"}`;



    el.unread.textContent = unreadTotal;







    if (!items.length) {



        el.list.innerHTML = stateMessage("No conversations found.");



        return;



    }







    el.list.innerHTML = items.map(c => {



        const unread = Number(c.unreadAdmin || 0);



        const active = state.activeConversation?.id === c.id ? "active" : "";







        return `



            <button



                class="conversation-item ${active}"



                data-id="${escapeAttr(c.id)}"



                type="button"



                aria-label="Open conversation with ${escapeAttr(c.customerName || "Customer")}"



            >



                <span class="conversation-avatar">${escapeHTML(initials(c.customerName))}</span>



                <span class="conversation-copy">



                    <span class="conversation-name">${escapeHTML(c.customerName || "Customer")}</span>



                    <span class="conversation-preview">${escapeHTML(c.lastMessage || "No messages yet")}</span>



                </span>



                <span>



                    <span class="conversation-time">${escapeHTML(formatRelative(c.lastMessageAt))}</span>



                    ${unread ? `<span class="conversation-badge">${unread}</span>` : ""}



                </span>



            </button>`;



    }).join("");



}







async function openConversation(id) {



    const conversation = state.conversations.find(



        item => String(item.id) === String(id)



    );







    if (!conversation) {



        console.error("MESSAGES: Conversation not found:", id, state.conversations);



        return;



    }







    state.activeConversation = conversation;



    el.emptyChat.hidden = true;



    el.activeChat.hidden = false;



    el.workspace?.classList.add("chat-open");







    el.chatAvatar.textContent = initials(conversation.customerName);



    el.chatName.textContent = conversation.customerName || "Customer";



    el.chatMeta.textContent = conversation.bookingReference



        ? `Booking ${conversation.bookingReference}`



        : "Trips Wonder customer";







    renderCustomerDetails(conversation);



    renderConversations();



    state.currentMessages = [];

    subscribeMessages(id);







    if (Number(conversation.unreadAdmin || 0) > 0) {



        try {



            await updateDoc(doc(db, "conversations", id), {



                unreadAdmin: 0,



                adminLastReadAt: serverTimestamp()



            });



        } catch (error) {



            console.warn("Unable to mark conversation read:", error);



        }



    }



}







function subscribeMessages(conversationId) {



    state.unsubscribeMessages?.();







    const q = query(



        collection(db, "conversations", conversationId, "messages"),



        orderBy("createdAt", "asc")



    );







    state.unsubscribeMessages = onSnapshot(q, snap => {



        const messages = snap.docs.map(d => ({



            id: d.id,



            ...d.data()



        }));









        state.currentMessages = messages;



el.stream.innerHTML = messages.length



            ? messages.map(renderMessage).join("")



            : stateMessage("No messages yet.");







        requestAnimationFrame(() => {



            el.stream.scrollTop = el.stream.scrollHeight;



        });



    }, error => {



        console.error("Message listener error:", error);



        el.stream.innerHTML = stateMessage("Unable to load messages.");



    });



}







function renderMessage(message) {



    const role = message.senderRole === "customer" ? "customer" : "admin";







    return `



        <div class="message-row ${role}">



            <div class="message-bubble">



                ${escapeHTML(message.text || "")}



                <span class="message-time">${escapeHTML(formatDateTime(message.createdAt))}</span>



            </div>



        </div>`;



}







async function sendAdminMessage(event) {



    event.preventDefault();







    const conversation = state.activeConversation;



    const text = el.input.value.trim();







    if (!conversation || !text || !state.admin) return;







    el.send.disabled = true;







    try {



        await addDoc(



            collection(db, "conversations", conversation.id, "messages"),



            {



                senderUid: state.admin.uid,



                senderRole: "admin",



                senderName: state.admin.name,



                text,



                createdAt: serverTimestamp()



            }



        );







        const currentMode = normalizeSupportMode(conversation);







        const update = {



            lastMessage: text,



            lastMessageAt: serverTimestamp(),



            lastSenderRole: "admin",



            unreadCustomer: Number(conversation.unreadCustomer || 0) + 1,



            updatedAt: serverTimestamp()



        };







        /*



         * If a human handoff is already active, the first/admin reply also



         * records who is handling the conversation. This does not expose



         * anything new to the customer.



         */



        if (currentMode === "human" || currentMode === "needs_support") {



            update.supportMode = "human";



            update.supportStatus = "active";



            update.handoffRequested = true;



            update.assignedAdminUid = state.admin.uid;



            update.assignedAdminName = state.admin.name;



            update.adminAcceptedAt = serverTimestamp();



        }







        await setDoc(



            doc(db, "conversations", conversation.id),



            update,



            { merge: true }



        );







        el.input.value = "";



    } catch (error) {



        console.error("Send message error:", error);



        alert("Unable to send the message. Check Firestore permissions.");



    } finally {



        el.send.disabled = false;



        el.input.focus();



    }



}







function renderCustomerDetails(c) {



    el.detailsEmpty.hidden = true;



    el.detailsContent.hidden = false;







    el.detailsAvatar.textContent = initials(c.customerName);



    el.detailsName.textContent = c.customerName || "Customer";



    el.detailsEmail.textContent = c.customerEmail || "—";



    el.detailsContact.textContent = c.customerContact || "—";



    el.detailsType.textContent = titleCase(c.type || "inquiry");



    el.detailsBooking.textContent = c.bookingReference || "No linked booking";



    el.detailsTravelDate.textContent = c.travelDateText || "—";







    renderSupportManagement(c);







    el.viewCustomer.onclick = () => {



        if (!c.customerUid) return;



        window.location.href =



            `customers.html?uid=${encodeURIComponent(c.customerUid)}`;



    };







    el.viewBooking.onclick = () => {



        if (!c.bookingId && !c.bookingReference) return;



        const value = c.bookingId || c.bookingReference;



        window.location.href =



            `bookings.html?booking=${encodeURIComponent(value)}`;



    };



}







function renderSupportManagement(c) {
    const mode = normalizeSupportMode(c);
    const brief = normalizeHandoffBrief(c.handoffBrief);

    let label = "Online Support";
    let badgeClass = "online";

    if (mode === "human") {
        label = "Human Support";
        badgeClass = "human";
    } else if (mode === "needs_support") {
        label = "Needs Support";
        badgeClass = "needs-support";
    }

    el.supportModeBadge.textContent = label;
    el.supportModeBadge.className = `support-mode-badge ${badgeClass}`;

    const assignedName = String(c.assignedAdminName || "").trim();
    el.supportAssignment.hidden = !assignedName;
    el.supportAssignedAdmin.textContent = assignedName || "—";

    el.handoffClientQuestion.textContent =
        brief.clientQuestion || "No active handoff.";

    el.handoffNeedsCheck.textContent =
        brief.needsAdminCheck || "—";

    el.handoffSystemStatus.textContent =
        brief.currentSystemStatus || "—";

    el.handoffAdminAction.textContent =
        brief.adminActionNeeded || "—";

    el.handoffBriefUpdated.textContent =
        brief.updatedAt
            ? `Updated ${formatRelative(brief.updatedAt)}`
            : "No active handoff";

    const canReturn =
        mode === "human" ||
        mode === "needs_support";

    el.returnToSupport.hidden = !canReturn;
    el.supportActionNote.hidden = !canReturn;
}


async function returnConversationToSupport() {
    const conversation = state.activeConversation;

    if (!conversation || !state.admin) return;

    const confirmed = window.confirm(
        "Return this conversation to Trips Wonder Support?\n\n" +
        "The customer will not receive a system message. " +
        "The Travel Consultant will check the latest TWTMS data again."
    );

    if (!confirmed) return;

    el.returnToSupport.disabled = true;

    try {
        /*
         * Keep the latest human answer as compact internal continuity context.
         * Operational availability is still re-checked from live TWTMS data.
         */
        const latestAdminMessage = [...state.currentMessages]
            .reverse()
            .find(message => {
                const role = String(message?.senderRole || "").toLowerCase();
                return ["admin", "owner", "staff"].includes(role);
            });

        const lastHumanResolution =
            String(latestAdminMessage?.text || "").trim();

        await setDoc(
            doc(db, "conversations", conversation.id),
            {
                supportMode: "online",
                supportStatus: "active",

                supportContext: {
                    lastHumanResolution: lastHumanResolution || null,
                    resolvedQuestion:
                        String(
                            conversation.handoffBrief?.clientQuestion || ""
                        ).trim() || null,
                    updatedAt: serverTimestamp()
                },

                /*
                 * Resolve the active handoff instead of turning it into
                 * a growing conversation summary.
                 */
                handoffBrief: {
                    clientQuestion: "",
                    needsAdminCheck: "",
                    currentSystemStatus: "",
                    adminActionNeeded: "",
                    resolvedAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                },

                handoffAvailable: false,
                handoffRequested: false,
                assignedAdminUid: null,
                assignedAdminName: null,
                returnedToSupportAt: serverTimestamp(),
                returnedToSupportByUid: state.admin.uid,
                returnedToSupportByName: state.admin.name,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

    } catch (error) {
        console.error("Return to Support error:", error);
        alert("Unable to return this conversation to Support.");
    } finally {
        el.returnToSupport.disabled = false;
    }
}


function normalizeSupportMode(c = {}) {
    const rawMode = String(c.supportMode || "").trim().toLowerCase();
    const rawStatus = String(c.supportStatus || "").trim().toLowerCase();

    if (
        rawMode === "human" ||
        rawStatus === "human" ||
        rawStatus === "needs_support" ||
        rawStatus === "needs support" ||
        c.handoffRequested === true
    ) {
        if (
            rawStatus === "needs_support" ||
            rawStatus === "needs support" ||
            (c.handoffRequested === true && rawMode !== "human")
        ) {
            return "needs_support";
        }

        return "human";
    }

    return "online";
}


function normalizeHandoffBrief(value) {
    const brief =
        value && typeof value === "object" && !Array.isArray(value)
            ? value
            : {};

    return {
        clientQuestion: String(
            brief.clientQuestion ||
            brief.question ||
            ""
        ).trim(),

        needsAdminCheck: String(
            brief.needsAdminCheck ||
            brief.needsCheck ||
            brief.reason ||
            ""
        ).trim(),

        currentSystemStatus: String(
            brief.currentSystemStatus ||
            brief.systemStatus ||
            brief.status ||
            ""
        ).trim(),

        adminActionNeeded: String(
            brief.adminActionNeeded ||
            brief.actionNeeded ||
            brief.adminAction ||
            ""
        ).trim(),

        updatedAt:
            brief.updatedAt ||
            brief.createdAt ||
            null
    };
}


function stateMessage(text) {



    return `



        <div class="panel-state">



            <i class="fa-regular fa-comments"></i>



            <strong>${escapeHTML(text)}</strong>



        </div>`;



}







function initials(name = "") {



    const parts = String(name)



        .trim()



        .split(/\s+/)



        .filter(Boolean);







    return (



        parts



            .slice(0, 2)



            .map(p => p[0])



            .join("") || "TW"



    ).toUpperCase();



}







function titleCase(value) {



    return String(value)



        .replace(/\_/g, " ")



        .replace(/\b\w/g, m => m.toUpperCase());



}







function toDate(value) {



    if (!value) return null;



    if (typeof value.toDate === "function") return value.toDate();







    const d = new Date(value);



    return Number.isNaN(d.getTime()) ? null : d;



}







function formatDateTime(value) {



    const d = toDate(value);



    if (!d) return "Sending...";







    return d.toLocaleString([], {



        month: "short",



        day: "numeric",



        hour: "numeric",



        minute: "2-digit"



    });



}







function formatRelative(value) {



    const d = toDate(value);



    if (!d) return "";







    const diff = Date.now() - d.getTime();







    if (diff < 60000) return "Now";



    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;



    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;







    return d.toLocaleDateString([], {



        month: "short",



        day: "numeric"



    });



}







function escapeHTML(value) {



    return String(value ?? "").replace(/[&<>"']/g, ch => ({



        "&": "&amp;",



        "<": "&lt;",



        ">": "&gt;",



        '"': "&quot;",



        "'": "&#039;"



    })[ch]);



}







function escapeAttr(value) {



    return escapeHTML(value);



}