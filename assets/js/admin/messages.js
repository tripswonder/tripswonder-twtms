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



} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";



import {



    onAuthStateChanged



} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";



const state = {
    admin: null,
    conversations: [],
    activeConversation: null,
    currentMessages: [],
    customerProfiles: new Map(),
    unsubscribeConversations: null,
    unsubscribeMessages: null,
    unsubscribeSupportProfile: null,

    supportProfile: {



        supportPersonaName: "Spark",



        supportPersonaTitle: "Trips Wonder Support"



    },
    savedReplies: [],
    savedRepliesSearch: "",
    savedRepliesSort: "frequent",
    unsubscribeSavedReplies: null,



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



        greetingButton: $("adminGreetingButton"),



        savedRepliesWrap: $("savedRepliesWrap"),



        savedRepliesButton: $("savedRepliesButton"),



        savedRepliesMenu: $("savedRepliesMenu"),
        savedRepliesList: $("savedRepliesList"),
        savedRepliesEmpty: $("savedRepliesEmpty"),
        savedRepliesSearch: $("savedRepliesSearch"),
        savedRepliesSort: $("savedRepliesSort"),
        savedReplyAddButton: $("savedReplyAddButton"),
        savedReplyModal: $("savedReplyModal"),
        savedReplyModalTitle: $("savedReplyModalTitle"),
        savedReplyModalClose: $("savedReplyModalClose"),
        savedReplyForm: $("savedReplyForm"),
        savedReplyId: $("savedReplyId"),
        savedReplyTitle: $("savedReplyTitle"),
        savedReplyText: $("savedReplyText"),
        savedReplyDelete: $("savedReplyDelete"),
        savedReplyCancel: $("savedReplyCancel"),
        savedReplySave: $("savedReplySave"),



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



        supportPersonaLabel: $("supportPersonaLabel"),



        supportModeBadge: $("supportModeBadge"),



        supportAssignment: $("supportAssignment"),



        supportAssignedAdmin: $("supportAssignedAdmin"),



        handoffBriefUpdated: $("handoffBriefUpdated"),



        handoffBriefDetails: $("handoffBriefDetails"),



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



    el.greetingButton?.addEventListener("click", sendAdminIntroduction);

    el.savedRepliesButton?.addEventListener("click", toggleSavedRepliesMenu);
    el.savedRepliesList?.addEventListener("click", handleSavedRepliesListClick);
    el.savedReplyAddButton?.addEventListener("click", () => openSavedReplyModal());
    el.savedRepliesSearch?.addEventListener("input", event => { state.savedRepliesSearch = event.target.value.trim().toLowerCase(); renderSavedReplies(); });
    el.savedRepliesSort?.addEventListener("change", event => { state.savedRepliesSort = event.target.value; renderSavedReplies(); });
    el.savedReplyModalClose?.addEventListener("click", closeSavedReplyModal);
    el.savedReplyCancel?.addEventListener("click", closeSavedReplyModal);
    el.savedReplyForm?.addEventListener("submit", saveSavedReply);
    el.savedReplyDelete?.addEventListener("click", deleteSavedReply);
    el.savedReplyModal?.addEventListener("click", event => { if (event.target.matches("[data-close-saved-reply-modal]")) closeSavedReplyModal(); });



    document.addEventListener("click", event => {

        if (el.savedRepliesWrap && !el.savedRepliesWrap.contains(event.target)) {

            closeSavedRepliesMenu();

        }

    });



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



        subscribeSupportProfile();
        subscribeSavedReplies();



        subscribeConversations();



    });



}



function subscribeSupportProfile() {



    state.unsubscribeSupportProfile?.();



    state.unsubscribeSupportProfile = onSnapshot(



        doc(db, "systemSettings", "general"),



        snapshot => {



            const settings = snapshot.exists() ? snapshot.data() : {};



            const persona =



                settings.supportPersona &&



                typeof settings.supportPersona === "object"



                    ? settings.supportPersona



                    : {};



            state.supportProfile = {



                supportPersonaName:



                    String(persona.name || "Spark").trim() || "Spark",



                supportPersonaTitle:



                    String(persona.title || "Trips Wonder Support").trim() || "Trips Wonder Support"



            };



            if (el.supportPersonaLabel) {



                el.supportPersonaLabel.textContent = getSupportPersonaLabel();



            }



            if (state.currentMessages.length && el.stream) {



                el.stream.innerHTML =



                    state.currentMessages.map(renderMessage).join("");



                requestAnimationFrame(() => {



                    el.stream.scrollTop = el.stream.scrollHeight;



                });



            }



        },



        error => {



            console.warn("Support persona listener error:", error);



        }



    );



}



function getSupportPersonaName() {



    return String(



        state.supportProfile?.supportPersonaName || "Spark"



    ).trim() || "Spark";



}



function getSupportPersonaLabel() {



    const name = getSupportPersonaName();



    const title = String(



        state.supportProfile?.supportPersonaTitle || "Trips Wonder Support"



    ).trim() || "Trips Wonder Support";



    return `${name} ${title}`.trim();



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



                <span class="conversation-avatar" data-customer-avatar="${escapeAttr(c.customerUid || "")}">
    ${escapeHTML(initials(c.customerName))}
</span>


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

items.forEach(async c => {
    const uid =
        String(c.customerUid || "").trim();

    if (!uid) return;

    const avatar =
        el.list.querySelector(
            `[data-customer-avatar="${CSS.escape(uid)}"]`
        );

    if (!avatar) return;

    const profile =
        await getCustomerProfile(uid);

    renderCustomerAvatar(
        avatar,
        profile?.photoURL || "",
        profile?.name ||
            c.customerName ||
            "Customer"
    );
});

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


const customerProfile =
    await getCustomerProfile(
        conversation.customerUid
    );

const customerName =
    customerProfile?.name ||
    conversation.customerName ||
    "Customer";

const customerEmail =
    customerProfile?.email ||
    conversation.customerEmail ||
    "";

const customerContact =
    customerProfile?.contact ||
    conversation.customerContact ||
    "";

const customerPhotoURL =
    customerProfile?.photoURL ||
    "";

const displayConversation = {
    ...conversation,
    customerName,
    customerEmail,
    customerContact,
    customerPhotoURL
};

state.activeConversation =
    displayConversation;

renderCustomerAvatar(
    el.chatAvatar,
    customerPhotoURL,
    customerName
);

el.chatName.textContent =
    customerName;

el.chatMeta.textContent =
    conversation.bookingReference
        ? `Booking ${conversation.bookingReference}`
        : "Trips Wonder customer";

renderCustomerDetails(
    displayConversation
);



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



    const senderRole = String(message.senderRole || "").trim().toLowerCase();



    const role =



        senderRole === "customer"



            ? "customer"



            : senderRole === "support"



                ? "support"



                : "admin";



    const senderLabel =



        role === "support"



            ? `<span class="message-sender-label">${escapeHTML(getSupportPersonaLabel())}</span>`



            : "";



    return `



        <div class="message-row ${role}">



            <div class="message-bubble">



                ${senderLabel}



                <span class="message-text">${escapeHTML(message.text || "")}</span>



                <span class="message-time">${escapeHTML(formatDateTime(message.createdAt))}</span>



            </div>



        </div>`;



}



const DEFAULT_SAVED_REPLIES = [
    { id: "checking", title: "Checking Availability", text: "Let me check the availability for you po. I'll get back to you once I've verified the details.", usageCount: 0 },
    { id: "please-wait", title: "Please Wait", text: "One moment please while I verify the details for you po.", usageCount: 0 },
    { id: "booking-details", title: "Booking Details", text: "May I please have your booking reference or the name used for the booking so I can check the details for you po?", usageCount: 0 },
    { id: "payment", title: "Payment Instructions", text: "I'll send you the payment instructions po. Please review the details carefully before completing your payment.", usageCount: 0 },
    { id: "follow-up", title: "Follow-up", text: "Hello po! Just following up regarding your request. Please let me know if you still need assistance.", usageCount: 0 },
    { id: "closing", title: "Closing / Thank You", text: "Thank you for contacting Trips Wonder po. If you have any other questions, feel free to message us anytime. Have a great day!", usageCount: 0 }
];
function normalizeSavedReply(item = {}) { return { id:String(item.id||"").trim(), title:String(item.title||"Saved Reply").trim()||"Saved Reply", text:String(item.text||"").trim(), usageCount:Math.max(0,Number(item.usageCount||0)), createdAtMs:Number(item.createdAtMs||0), updatedAtMs:Number(item.updatedAtMs||0) }; }
function subscribeSavedReplies(){ state.unsubscribeSavedReplies?.(); state.unsubscribeSavedReplies=onSnapshot(doc(db,"systemSettings","savedReplies"),snap=>{const data=snap.exists()?snap.data():{};const replies=Array.isArray(data.replies)?data.replies:[];state.savedReplies=(replies.length?replies:DEFAULT_SAVED_REPLIES).map(normalizeSavedReply).filter(r=>r.id&&r.text);renderSavedReplies();},error=>{console.warn("Saved replies listener error:",error);state.savedReplies=DEFAULT_SAVED_REPLIES.map(normalizeSavedReply);renderSavedReplies();}); }
function getVisibleSavedReplies() {
    const search = state.savedRepliesSearch;

    const replies = state.savedReplies.filter(reply => {
        if (!search) return true;

        return `${reply.title} ${reply.text}`
            .toLowerCase()
            .includes(search);
    });

    // A–Z
    if (state.savedRepliesSort === "az") {
        return replies.sort((a, b) =>
            a.title.localeCompare(b.title)
        );
    }

    // Recently Updated
    if (state.savedRepliesSort === "recent") {
        return replies.sort((a, b) =>
            Number(b.updatedAtMs || 0) -
            Number(a.updatedAtMs || 0)
        );
    }

    // Frequently Used
    // Higher usage first.
    // If usage is equal, preserve the existing saved order.
    return replies.sort((a, b) =>
        Number(b.usageCount || 0) -
        Number(a.usageCount || 0)
    );
}

function renderSavedReplies(){if(!el.savedRepliesList)return;const a=getVisibleSavedReplies();el.savedRepliesList.innerHTML=a.map(r=>`<article class="saved-reply-item" data-saved-reply-id="${escapeAttr(r.id)}"><button type="button" class="saved-reply-insert" data-action="insert"><span class="saved-reply-item-icon"><i class="fa-regular fa-message"></i></span><span class="saved-reply-item-copy"><strong>${escapeHTML(r.title)}</strong><small>${escapeHTML(r.text)}</small></span></button><button type="button" class="saved-reply-more" data-action="edit" aria-label="Edit ${escapeAttr(r.title)}"><i class="fa-solid fa-ellipsis"></i></button></article>`).join("");if(el.savedRepliesEmpty)el.savedRepliesEmpty.hidden=a.length>0;}
function toggleSavedRepliesMenu(event){event?.stopPropagation();if(!el.savedRepliesMenu||!el.savedRepliesButton)return;const open=el.savedRepliesMenu.hidden;el.savedRepliesMenu.hidden=!open;el.savedRepliesButton.setAttribute("aria-expanded",open?"true":"false");if(open){renderSavedReplies();requestAnimationFrame(()=>el.savedRepliesSearch?.focus());}}
function closeSavedRepliesMenu(){if(el.savedRepliesMenu)el.savedRepliesMenu.hidden=true;if(el.savedRepliesButton)el.savedRepliesButton.setAttribute("aria-expanded","false");}
async function handleSavedRepliesListClick(event){const item=event.target.closest("[data-saved-reply-id]");if(!item)return;const r=state.savedReplies.find(x=>x.id===item.dataset.savedReplyId);if(!r)return;const action=event.target.closest("[data-action]")?.dataset.action;if(action==="edit"){openSavedReplyModal(r);return;}if(action!=="insert"||!el.input)return;el.input.value=r.text;el.input.dispatchEvent(new Event("input",{bubbles:true}));closeSavedRepliesMenu();el.input.focus();try{el.input.setSelectionRange(el.input.value.length,el.input.value.length);}catch(_){}const next=state.savedReplies.map(x=>x.id===r.id?{...x,usageCount:x.usageCount+1}:x);state.savedReplies=next;renderSavedReplies();try{await persistSavedReplies(next);}catch(error){console.warn("Unable to update saved reply usage:",error);}}
function openSavedReplyModal(r=null){if(!el.savedReplyModal)return;const editing=Boolean(r?.id);el.savedReplyModal.hidden=false;document.body.classList.add("saved-reply-modal-open");el.savedReplyModalTitle.textContent=editing?"Edit Saved Reply":"Add Saved Reply";el.savedReplyId.value=editing?r.id:"";el.savedReplyTitle.value=editing?r.title:"";el.savedReplyText.value=editing?r.text:"";el.savedReplyDelete.hidden=!editing;requestAnimationFrame(()=>el.savedReplyTitle?.focus());}
function closeSavedReplyModal(){if(!el.savedReplyModal)return;el.savedReplyModal.hidden=true;document.body.classList.remove("saved-reply-modal-open");el.savedReplyForm?.reset();if(el.savedReplyId)el.savedReplyId.value="";}
function makeSavedReplyId(){if(globalThis.crypto?.randomUUID)return crypto.randomUUID();return `reply-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
async function persistSavedReplies(replies){await setDoc(doc(db,"systemSettings","savedReplies"),{replies:replies.map(normalizeSavedReply),updatedAt:serverTimestamp(),updatedByUid:state.admin?.uid||"",updatedByName:state.admin?.name||"Trips Wonder Admin"},{merge:true});}
async function saveSavedReply(event){event.preventDefault();if(!state.admin)return;const id=String(el.savedReplyId?.value||"").trim(),title=String(el.savedReplyTitle?.value||"").trim(),text=String(el.savedReplyText?.value||"").trim();if(!title||!text)return;const now=Date.now(),existing=state.savedReplies.find(r=>r.id===id),item=normalizeSavedReply({id:id||makeSavedReplyId(),title,text,usageCount:existing?.usageCount||0,createdAtMs:existing?.createdAtMs||now,updatedAtMs:now});const next=existing?state.savedReplies.map(r=>r.id===existing.id?item:r):[item,...state.savedReplies];el.savedReplySave.disabled=true;try{await persistSavedReplies(next);state.savedReplies=next;renderSavedReplies();closeSavedReplyModal();}catch(error){console.error("Save saved reply error:",error);alert("Unable to save the saved reply. Check Firestore permissions.");}finally{el.savedReplySave.disabled=false;}}
async function deleteSavedReply(){const id=String(el.savedReplyId?.value||"").trim();if(!id)return;const r=state.savedReplies.find(x=>x.id===id);if(!r||!confirm(`Delete saved reply “${r.title}”?`))return;const next=state.savedReplies.filter(x=>x.id!==id);el.savedReplyDelete.disabled=true;try{await persistSavedReplies(next);state.savedReplies=next;renderSavedReplies();closeSavedReplyModal();}catch(error){console.error("Delete saved reply error:",error);alert("Unable to delete the saved reply. Check Firestore permissions.");}finally{el.savedReplyDelete.disabled=false;}}

function hasAdminIntroduction(c = {}) {



    return Boolean(c.adminIntroducedAt);



}



function updateAdminComposerState(c = {}) {



    if (!el.form || !el.input || !el.send) return;



    const mode = normalizeSupportMode(c);



    const humanMode =



        mode === "human" ||



        mode === "needs_support";



    if (!humanMode) {



        el.form.hidden = true;



        el.input.hidden = false;



        el.send.hidden = false;



        if (el.greetingButton) {



            el.greetingButton.hidden = true;



        }



        if (el.savedRepliesWrap) {

            el.savedRepliesWrap.hidden = true;

        }



        closeSavedRepliesMenu();



        return;



    }



    el.form.hidden = false;



    const introduced =



        hasAdminIntroduction(c);



    el.input.hidden = !introduced;



    el.send.hidden = !introduced;



    el.input.disabled = !introduced;



    if (el.greetingButton) {



        el.greetingButton.hidden = introduced;



    }



    if (el.savedRepliesWrap) {

        el.savedRepliesWrap.hidden = !introduced;

    }



    if (!introduced) {

        closeSavedRepliesMenu();

    }



    if (introduced) {



        el.input.placeholder = "Type a message...";



    }



}



function getAdminFirstName() {



    const rawName =



        String(state.admin?.name || "Admin").trim();



    return (



        rawName



            .split(/\s+/)



            .filter(Boolean)[0] ||



        "Admin"



    );



}



async function sendAdminIntroduction() {



    const conversation =



        state.activeConversation;



    if (!conversation || !state.admin) return;



    const mode =



        normalizeSupportMode(conversation);



    if (



        mode !== "human" &&



        mode !== "needs_support"



    ) {



        return;



    }



    if (hasAdminIntroduction(conversation)) {



        updateAdminComposerState(conversation);



        return;



    }



    const firstName =



        getAdminFirstName();



    const greeting =



        `Hello po! I'm ${firstName} from Trips Wonder. ` +



        `I'll be assisting you with your concern.`;



    if (el.greetingButton) {



        el.greetingButton.disabled = true;



    }



    try {



        await addDoc(



            collection(



                db,



                "conversations",



                conversation.id,



                "messages"



            ),



            {



                senderUid: state.admin.uid,



                senderRole: "admin",



                senderName: state.admin.name,



                text: greeting,



                messageType: "admin_introduction",



                createdAt: serverTimestamp()



            }



        );



        await setDoc(



            doc(db, "conversations", conversation.id),



            {



                lastMessage: greeting,



                lastMessageAt: serverTimestamp(),



                lastSenderRole: "admin",



                unreadCustomer:



                    Number(conversation.unreadCustomer || 0) + 1,



                supportMode: "human",



                supportStatus: "active",



                handoffRequested: true,



                assignedAdminUid: state.admin.uid,



                assignedAdminName: state.admin.name,



                adminAcceptedAt: serverTimestamp(),



                adminIntroducedAt: serverTimestamp(),



                adminIntroducedByUid: state.admin.uid,



                adminIntroducedByName: state.admin.name,



                updatedAt: serverTimestamp()



            },



            { merge: true }



        );



    } catch (error) {



        console.error("Admin introduction error:", error);



        alert("Unable to send the introduction. Please try again.");



    } finally {



        if (el.greetingButton) {



            el.greetingButton.disabled = false;



        }



    }



}



async function sendAdminMessage(event) {



    event.preventDefault();



    const conversation = state.activeConversation;



    const text = el.input.value.trim();



    if (!conversation || !text || !state.admin) return;



    const mode = normalizeSupportMode(conversation);



    if (



        mode !== "human" &&



        mode !== "needs_support"



    ) {



        updateAdminComposerState(conversation);



        return;



    }



    if (!hasAdminIntroduction(conversation)) {



        updateAdminComposerState(conversation);



        return;



    }



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

        closeSavedRepliesMenu();



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



    renderCustomerAvatar(
    el.detailsAvatar,
    c.customerPhotoURL,
    c.customerName
);



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



    el.supportModeBadge.className =



        `support-mode-badge ${badgeClass}`;



    const assignedName =



        String(c.assignedAdminName || "").trim();



    el.supportAssignment.hidden = !assignedName;



    el.supportAssignedAdmin.textContent =



        assignedName || "—";



    // =========================================



    // HANDOFF BRIEF



    // =========================================



    const hasActiveBrief = Boolean(



        brief.clientQuestion ||



        brief.needsAdminCheck ||



        brief.currentSystemStatus ||



        brief.adminActionNeeded



    );



    if (el.handoffBriefDetails) {



        el.handoffBriefDetails.hidden = !hasActiveBrief;



    }



    if (hasActiveBrief) {



        el.handoffClientQuestion.textContent =



            brief.clientQuestion || "—";



        el.handoffNeedsCheck.textContent =



            brief.needsAdminCheck || "—";



        el.handoffSystemStatus.textContent =



            brief.currentSystemStatus || "—";



        el.handoffAdminAction.textContent =



            brief.adminActionNeeded || "—";



        el.handoffBriefUpdated.textContent =



            brief.updatedAt



                ? `Updated ${formatRelative(brief.updatedAt)}`



                : "Active handoff";



    } else {



        el.handoffClientQuestion.textContent = "—";



        el.handoffNeedsCheck.textContent = "—";



        el.handoffSystemStatus.textContent = "—";



        el.handoffAdminAction.textContent = "—";



        el.handoffBriefUpdated.textContent =



            "No active handoff";



    }



    // =========================================



    // RETURN TO SUPPORT



    // =========================================



    const canReturn =



        mode === "human" ||



        mode === "needs_support";



    el.returnToSupport.hidden = !canReturn;



    if (el.supportActionNote) {



        el.supportActionNote.hidden = !canReturn;



    }



    updateAdminComposerState(c);



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



                adminIntroducedAt: null,



                adminIntroducedByUid: null,



                adminIntroducedByName: null,



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

async function getCustomerProfile(customerUid) {
    const uid = String(customerUid || "").trim();

    if (!uid) {
        return null;
    }

    // Use cached profile if already loaded
    if (state.customerProfiles.has(uid)) {
        return state.customerProfiles.get(uid);
    }

    try {
        const snapshot = await getDoc(
            doc(db, "users", uid)
        );

        if (!snapshot.exists()) {
            state.customerProfiles.set(uid, null);
            return null;
        }

        const data = snapshot.data();

        const fullName = [
            data.firstName,
            data.lastName
        ]
            .filter(Boolean)
            .join(" ")
            .trim();

        const profile = {
            uid,
            name:
                fullName ||
                data.fullName ||
                data.name ||
                data.displayName ||
                "",

            email:
                data.email ||
                "",

            contact:
                data.contact ||
                data.contactNumber ||
                data.phone ||
                "",

            photoURL:
                String(data.photoURL || "").trim()
        };

        state.customerProfiles.set(
            uid,
            profile
        );

        return profile;

    } catch (error) {
        console.warn(
            "Unable to load customer profile:",
            error
        );

        return null;
    }
}

function renderCustomerAvatar(
    element,
    photoURL = "",
    customerName = ""
) {
    if (!element) return;

    const normalizedPhotoURL =
        String(photoURL || "").trim();

    // Fallback to initials when there is no profile photo
    if (!normalizedPhotoURL) {
        element.textContent =
            initials(customerName);

        return;
    }

    const image =
        document.createElement("img");

    image.src =
        normalizedPhotoURL;

    image.alt =
        customerName
            ? `${customerName} profile photo`
            : "Customer profile photo";

    image.referrerPolicy =
        "no-referrer";

    image.style.width =
        "100%";

    image.style.height =
        "100%";

    image.style.display =
        "block";

    image.style.objectFit =
        "cover";

    image.style.borderRadius =
        "inherit";

    // If the image URL fails, restore initials
    image.addEventListener(
        "error",
        () => {
            element.textContent =
                initials(customerName);
        },
        { once: true }
    );

    element.replaceChildren(image);
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



        .replace(/\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\_/g, " ")



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
