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
    addDoc,
    getDocs,
    where,
    limit
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const state = {
    user: null,
    profile: null,
    conversationId: null,
    unsubscribeMessages: null,
    unsubscribeSupportProfile: null,
    supportProfile: {
        supportName: "Trips Wonder Support",
        supportStatus: "We’re here to help",
        supportPhoto: "../../assets/images/logo.png"
    },
    currentMessages: []
};

const stream = document.getElementById("customerMessageStream");
const form = document.getElementById("customerMessageForm");
const input = document.getElementById("customerMessageInput");
const sendButton = document.getElementById("customerSendButton");

const supportHeader =
    document.querySelector(".customer-message-header");

const supportHeaderAvatar =
    supportHeader?.querySelector(".support-avatar img");

const supportHeaderName =
    supportHeader?.querySelector("h1");

const supportHeaderStatus =
    supportHeader?.querySelector("p");


// =========================================================
// AUTO-GROW MESSAGE INPUT
// =========================================================

const MESSAGE_INPUT_MIN_HEIGHT = 42;
const MESSAGE_INPUT_MAX_HEIGHT = 110;


function resizeMessageInput() {

    if (!input) {
        return;
    }


    // Reset first so scrollHeight can shrink
    // when text is deleted.
    input.style.height = "auto";


    const nextHeight =
        Math.min(
            Math.max(
                input.scrollHeight,
                MESSAGE_INPUT_MIN_HEIGHT
            ),
            MESSAGE_INPUT_MAX_HEIGHT
        );


    input.style.height =
        `${nextHeight}px`;


    // Only show internal scrolling after
    // reaching the maximum height.
    input.style.overflowY =
        input.scrollHeight >
        MESSAGE_INPUT_MAX_HEIGHT
            ? "auto"
            : "hidden";
}


function resetMessageInputSize() {

    if (!input) {
        return;
    }


    input.style.height =
        `${MESSAGE_INPUT_MIN_HEIGHT}px`;

    input.style.overflowY =
        "hidden";
}


input?.addEventListener(
    "input",
    resizeMessageInput
);


// Initial textarea size.
resetMessageInputSize();


// =========================================================
// FORM
// =========================================================

form.addEventListener(
    "submit",
    sendMessage
);


// =========================================================
// AUTH
// =========================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../login.html";

            return;
        }


        state.user =
            user;

        subscribeSupportProfile();


        try {

            const userSnap =
                await getDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    )
                );


            state.profile =
                userSnap.exists()
                    ? userSnap.data()
                    : {};


            state.conversationId =
                await ensureConversation();


            subscribeMessages();


            await markCustomerRead();

        } catch (error) {

            console.error(
                "Customer messages initialization error:",
                error
            );


            stream.innerHTML =
                loadingState(
                    "Unable to open messages."
                );

        }

    }
);


// =========================================================
// ENSURE CONVERSATION
// =========================================================

async function ensureConversation() {

    const customerUid =
        state.user.uid;


    // One support conversation per authenticated customer.
    // UID is used as the document ID to prevent duplicate inbox threads.
    const conversationRef =
        doc(
            db,
            "conversations",
            customerUid
        );


    const existing =
        await getDoc(
            conversationRef
        );


    if (!existing.exists()) {

        const name =
            state.profile.fullName ||
            state.profile.name ||
            state.profile.displayName ||
            state.user.displayName ||
            state.user.email ||
            "Customer";


        await setDoc(
            conversationRef,
            {
                customerUid,

                customerName:
                    name,

                customerEmail:
                    state.profile.email ||
                    state.user.email ||
                    "",

                customerContact:
                    state.profile.contactNumber ||
                    state.profile.contact ||
                    state.profile.phone ||
                    "",

                type:
                    "inquiry",

                status:
                    "open",

                lastMessage:
                    "",

                lastMessageAt:
                    serverTimestamp(),

                lastSenderRole:
                    "",

                unreadAdmin:
                    0,

                unreadCustomer:
                    0,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            }
        );

    } else {

        await setDoc(
            conversationRef,
            {
                customerName:
                    state.profile.fullName ||
                    state.profile.name ||
                    state.profile.displayName ||
                    state.user.displayName ||
                    existing.data().customerName ||
                    "Customer",

                customerEmail:
                    state.profile.email ||
                    state.user.email ||
                    existing.data().customerEmail ||
                    "",

                customerContact:
                    state.profile.contactNumber ||
                    state.profile.contact ||
                    state.profile.phone ||
                    existing.data().customerContact ||
                    "",

                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

    }


    return customerUid;
}


// =========================================================
// CENTRALIZED SUPPORT PROFILE
// Firestore: systemSettings/general
// =========================================================

function subscribeSupportProfile() {

    state.unsubscribeSupportProfile?.();

    const settingsRef =
        doc(
            db,
            "systemSettings",
            "general"
        );

    state.unsubscribeSupportProfile =
        onSnapshot(
            settingsRef,
            snapshot => {

                const settings =
                    snapshot.exists()
                        ? snapshot.data()
                        : {};

                state.supportProfile = {
                    supportName:
                        String(
                            settings.supportName ||
                            "Trips Wonder Support"
                        ).trim() ||
                        "Trips Wonder Support",

                    supportStatus:
                        String(
                            settings.supportStatus ||
                            "We’re here to help"
                        ).trim() ||
                        "We’re here to help",

                    supportPhoto:
                        String(
                            settings.supportPhoto ||
                            settings.businessLogo ||
                            "../../assets/images/logo.png"
                        ).trim() ||
                        "../../assets/images/logo.png"
                };

                applySupportProfile();
                renderCurrentMessages();

            },
            error => {

                console.error(
                    "Support profile listener error:",
                    error
                );

                applySupportProfile();

            }
        );

}


function applySupportProfile() {

    const profile =
        state.supportProfile;

    if (supportHeaderName) {
        supportHeaderName.textContent =
            profile.supportName;
    }

    if (supportHeaderStatus) {

        supportHeaderStatus.innerHTML = "";

        const dot =
            document.createElement("span");

        dot.className =
            "online-dot";

        supportHeaderStatus.append(
            dot,
            document.createTextNode(
                ` ${profile.supportStatus}`
            )
        );

    }

    if (supportHeaderAvatar) {

        supportHeaderAvatar.onerror = () => {

            supportHeaderAvatar.onerror =
                null;

            supportHeaderAvatar.src =
                "../../assets/images/logo.png";

        };

        supportHeaderAvatar.src =
            profile.supportPhoto;

        supportHeaderAvatar.alt =
            profile.supportName;

    }

}


function renderCurrentMessages() {

    if (!stream) return;

    const messages =
        state.currentMessages || [];

    stream.innerHTML =
        messages.length
            ? messages
                .map(
                    (message, index) =>
                        renderMessage(
                            message,
                            messages[index - 1]
                        )
                )
                .join("")
            : loadingState(
                `Send us a message. ${state.supportProfile.supportName} will reply here.`
            );

}


// =========================================================
// LIVE MESSAGES
// =========================================================

function subscribeMessages() {

    state.unsubscribeMessages?.();


    const messagesQuery =
        query(
            collection(
                db,
                "conversations",
                state.conversationId,
                "messages"
            ),
            orderBy(
                "createdAt",
                "asc"
            )
        );


    state.unsubscribeMessages =
        onSnapshot(
            messagesQuery,
            async snap => {

                const messages =
                    snap.docs.map(
                        d => ({
                            id: d.id,
                            ...d.data()
                        })
                    );

                state.currentMessages =
                    messages;

                renderCurrentMessages();


                requestAnimationFrame(
                    () => {

                        stream.scrollTop =
                            stream.scrollHeight;

                    }
                );


                await markCustomerRead();

            },
            error => {

                console.error(
                    "Customer message listener error:",
                    error
                );


                stream.innerHTML =
                    loadingState(
                        "Unable to load messages."
                    );

            }
        );

}


// =========================================================
// SEND MESSAGE
// =========================================================

async function sendMessage(event) {

    event.preventDefault();


    const text =
        input.value.trim();


    if (
        !text ||
        !state.user ||
        !state.conversationId
    ) {

        return;

    }


    sendButton.disabled =
        true;


    try {

        const conversationRef =
            doc(
                db,
                "conversations",
                state.conversationId
            );


        const currentSnap =
            await getDoc(
                conversationRef
            );


        const current =
            currentSnap.exists()
                ? currentSnap.data()
                : {};


        await addDoc(
            collection(
                db,
                "conversations",
                state.conversationId,
                "messages"
            ),
            {
                senderUid:
                    state.user.uid,

                senderRole:
                    "customer",

                senderName:
                    state.profile.fullName ||
                    state.profile.name ||
                    state.user.displayName ||
                    "Customer",

                text,

                createdAt:
                    serverTimestamp()
            }
        );


        await setDoc(
            conversationRef,
            {
                lastMessage:
                    text,

                lastMessageAt:
                    serverTimestamp(),

                lastSenderRole:
                    "customer",

                unreadAdmin:
                    Number(
                        current.unreadAdmin ||
                        0
                    ) + 1,

                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );


        input.value =
            "";


        // Return composer to its original
        // single-line size after sending.
        resetMessageInputSize();

    } catch (error) {

        console.error(
            "Customer send message error:",
            error
        );


        alert(
            "Unable to send your message. Please try again."
        );

    } finally {

        sendButton.disabled =
            false;


        input.focus();

    }

}


// =========================================================
// READ STATE
// =========================================================

async function markCustomerRead() {

    if (!state.conversationId) {
        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "conversations",
                state.conversationId
            ),
            {
                unreadCustomer:
                    0,

                customerLastReadAt:
                    serverTimestamp()
            }
        );

    } catch (error) {

        console.warn(
            "Unable to update customer read state:",
            error
        );

    }

}


// =========================================================
// RENDER MESSAGE
// =========================================================

function renderMessage(message, previousMessage = null) {

    const role =
        message.senderRole === "customer"
            ? "customer"
            : "admin";


    const previousRole =
        previousMessage
            ? (
                previousMessage.senderRole === "customer"
                    ? "customer"
                    : "admin"
            )
            : null;


    const grouped =
        previousRole === role;


    const supportPhoto =
        escapeAttr(
            state.supportProfile.supportPhoto ||
            "../../assets/images/logo.png"
        );

    const avatar =
        role === "admin"
            ? `
                <div class="customer-message-avatar" aria-hidden="true">
                    <img
                        src="${supportPhoto}"
                        alt=""
                        onerror="this.onerror=null;this.src='../../assets/images/logo.png';"
                    >
                </div>
            `
            : "";


    const readReceipt =
        role === "customer"
            ? `
                <span
                    class="customer-message-read"
                    title="Sent"
                    aria-label="Sent"
                >✓✓</span>
            `
            : "";


    return `
        <div class="customer-message-row ${role}${grouped ? " grouped" : ""}">
            ${avatar}

            <div class="customer-message-content">

                <div class="customer-message-bubble">${escapeHTML(message.text || "")}</div>

                <div class="customer-message-meta">
                    <span class="customer-message-time">
                        ${escapeHTML(formatDateTime(message.createdAt))}
                    </span>

                    ${readReceipt}
                </div>

            </div>
        </div>
    `;

}


// =========================================================
// HELPERS
// =========================================================

function loadingState(text) {

    return `
        <div class="message-loading">
            <i class="fa-regular fa-comments"></i>
            <span>
                ${escapeHTML(text)}
            </span>
        </div>
    `;

}


function toDate(value) {

    if (!value) {
        return null;
    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    const d =
        new Date(value);


    return Number.isNaN(
        d.getTime()
    )
        ? null
        : d;

}


function formatDateTime(value) {

    const d =
        toDate(value);


    if (!d) {
        return "Sending...";
    }


    return d.toLocaleString(
        [],
        {
            month:
                "short",

            day:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );

}


function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /[&<>"']/g,
            ch => ({
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
            })[ch]
        );

}



function escapeAttr(value) {

    return escapeHTML(value);

}
