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
    where
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-functions.js";



/* ==========================================================
   FULL-PAGE MEMBER MESSENGER BRIDGE
   ========================================================== */

let currentUser = null;
let currentProfile = null;

function getCustomerAvatarUrl() {
    const profile = currentProfile || {};

    return String(
        profile.profilePhotoUrl ||
        profile.profilePhoto ||
        profile.photoURL ||
        profile.photoUrl ||
        profile.avatarUrl ||
        profile.avatar ||
        profile.imageUrl ||
        currentUser?.photoURL ||
        ""
    ).trim();
}

/* Home Messenger uses escapeHtml(); Message Center already has escapeHTML(). */
function escapeHtml(value) {
    return escapeHTML(value);
}

const state = {
    user: null,
    profile: null,
    conversationId: null,
    unsubscribeMessages: null,
    unsubscribeConversation: null,
    unsubscribeSupportProfile: null,
    unsubscribeNotifications: null,
    supportProfile: {
        supportName: "Trips Wonder Support",
        supportStatus: "We’re here to help",
        supportPhoto: "../../assets/images/logo.png"
    },
    currentMessages: [],
    notifications: [],
    selectedNotificationId: null,
    activeTab: "messages",
    unreadOnly: false,
    notificationSearch: "",
    unreadMessages: 0,
    unreadNotifications: 0
};

const stream = document.getElementById("customerMessageStream");
const form = document.getElementById("customerMessageForm");
const input = document.getElementById("customerMessageInput");
const sendButton = document.getElementById("customerSendButton");
const supportHeader = document.querySelector(".customer-message-header");
const supportHeaderAvatar = supportHeader?.querySelector(".support-avatar img");
const supportHeaderName = supportHeader?.querySelector("h2");
const supportHeaderStatus = supportHeader?.querySelector("p");

const tabButtons = [...document.querySelectorAll("[data-center-tab]")];
const panels = [...document.querySelectorAll("[data-center-panel]")];
const messagesTabBadge = document.getElementById("messagesTabBadge");
const notificationsTabBadge = document.getElementById("notificationsTabBadge");
const messageCenterBell = document.getElementById("messageCenterBell");
const messageCenterBellBadge = document.getElementById("messageCenterBellBadge");
const notificationSearch = document.getElementById("notificationSearch");
const notificationUnreadFilter = document.getElementById("notificationUnreadFilter");
const notificationsList = document.getElementById("notificationsList");
const markAllNotificationsRead = document.getElementById("markAllNotificationsRead");
const notificationDetailEmpty = document.getElementById("notificationDetailEmpty");
const notificationDetailCard = document.getElementById("notificationDetailCard");
const notificationDetailIcon = document.getElementById("notificationDetailIcon");
const notificationDetailType = document.getElementById("notificationDetailType");
const notificationDetailTitle = document.getElementById("notificationDetailTitle");
const notificationDetailDate = document.getElementById("notificationDetailDate");
const notificationDetailMessage = document.getElementById("notificationDetailMessage");
const notificationDetailMeta = document.getElementById("notificationDetailMeta");
const notificationDetailAction = document.getElementById("notificationDetailAction");
const notificationsWorkspace = document.querySelector(".notifications-workspace");
const notificationsListPane = document.querySelector(".notifications-list-pane");
const notificationDetailPane = document.querySelector(".notification-detail-pane");


const MESSAGE_INPUT_MIN_HEIGHT = 42;
const MESSAGE_INPUT_MAX_HEIGHT = 110;

function resizeMessageInput() {
    if (!input) return;
    input.style.height = "auto";
    const nextHeight = Math.min(
        Math.max(input.scrollHeight, MESSAGE_INPUT_MIN_HEIGHT),
        MESSAGE_INPUT_MAX_HEIGHT
    );
    input.style.height = `${nextHeight}px`;
    input.style.overflowY = input.scrollHeight > MESSAGE_INPUT_MAX_HEIGHT ? "auto" : "hidden";
}

function resetMessageInputSize() {
    if (!input) return;
    input.style.height = `${MESSAGE_INPUT_MIN_HEIGHT}px`;
    input.style.overflowY = "hidden";
}

input?.addEventListener("input", resizeMessageInput);
resetMessageInputSize();
form?.addEventListener("submit", sendMessage);

tabButtons.forEach(button => {
    button.addEventListener("click", () => activateTab(button.dataset.centerTab));
});

messageCenterBell?.addEventListener("click", () => activateTab("notifications"));

function activateTab(tabName) {
    if (!["messages", "notifications"].includes(tabName)) return;

    state.activeTab = tabName;

    tabButtons.forEach(button => {
        const active = button.dataset.centerTab === tabName;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
    });

    panels.forEach(panel => {
        const active = panel.dataset.centerPanel === tabName;
        panel.classList.toggle("active", active);
        panel.hidden = !active;
    });

    if (tabName === "messages") {
        markCustomerRead();
        requestAnimationFrame(() => {
            if (stream) stream.scrollTop = stream.scrollHeight;
        });
    } else {
        closeMobileNotificationDetail();
        renderNotifications();
    }
}

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.href = "../../index.html";
        return;
    }

    state.user = user;
    currentUser = user;

    try {
        const userSnap = await getDoc(
            doc(db, "users", user.uid)
        );

        state.profile =
            userSnap.exists()
                ? userSnap.data()
                : {};

        currentProfile =
            state.profile || {};

        // Keep the shared Customer Support Profile in sync with
        // Admin > Page Setup > Customer Support Profile.
        subscribeSupportProfile();

        startMemberMessenger();
        subscribeNotifications();
        syncMessageRoute();

    } catch (error) {
        console.error(
            "Customer Message Center initialization error:",
            error
        );
    }
});

async function ensureConversation() {
    const customerUid = state.user.uid;
    const conversationRef = doc(db, "conversations", customerUid);
    const existing = await getDoc(conversationRef);

    const name =
        state.profile.fullName ||
        state.profile.name ||
        state.profile.displayName ||
        state.user.displayName ||
        state.user.email ||
        "Customer";

    const email = state.profile.email || state.user.email || "";
    const contact =
        state.profile.contactNumber ||
        state.profile.contact ||
        state.profile.phone ||
        "";

    if (!existing.exists()) {
        await setDoc(conversationRef, {
            customerUid,
            customerName: name,
            customerEmail: email,
            customerContact: contact,
            type: "inquiry",
            status: "open",
            lastMessage: "",
            lastMessageAt: serverTimestamp(),
            lastSenderRole: "",
            unreadAdmin: 0,
            unreadCustomer: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    } else {
        await setDoc(conversationRef, {
            customerName: name || existing.data().customerName || "Customer",
            customerEmail: email || existing.data().customerEmail || "",
            customerContact: contact || existing.data().customerContact || "",
            updatedAt: serverTimestamp()
        }, { merge: true });
    }

    return customerUid;
}

function subscribeConversation() {
    state.unsubscribeConversation?.();
    if (!state.conversationId) return;

    state.unsubscribeConversation = onSnapshot(
        doc(db, "conversations", state.conversationId),
        snapshot => {
            const data = snapshot.exists() ? snapshot.data() : {};
            state.unreadMessages = Math.max(0, Number(data.unreadCustomer || 0));
            updateUnreadBadges();

            if (state.activeTab === "messages" && state.unreadMessages > 0) {
                markCustomerRead();
            }
        },
        error => console.warn("Conversation listener error:", error)
    );
}

function subscribeSupportProfile() {
    state.unsubscribeSupportProfile?.();

    state.unsubscribeSupportProfile = onSnapshot(
        doc(db, "systemSettings", "general"),
        snapshot => {
            const settings = snapshot.exists() ? snapshot.data() : {};
            state.supportProfile = {
                supportName: String(settings.supportName || "Trips Wonder Support").trim() || "Trips Wonder Support",
                supportStatus: String(settings.supportStatus || "We’re here to help").trim() || "We’re here to help",
                supportPhoto: String(settings.supportPhoto || settings.businessLogo || "../../assets/images/logo.png").trim() || "../../assets/images/logo.png"
            };
            applySupportProfile();
            renderCurrentMessages();

            // The current Messages page uses the newer Support tab UI.
            // Re-render it whenever Page Setup support details change.
            if (activeMemberTab === "support") {
                renderTripsWonderSupportList();
                openTripsWonderSupportConversation();
            }
        },
        error => {
            console.error("Support profile listener error:", error);
            applySupportProfile();
        }
    );
}

function applySupportProfile() {
    const profile = state.supportProfile;

    if (supportHeaderName) supportHeaderName.textContent = profile.supportName;

    if (supportHeaderStatus) {
        supportHeaderStatus.innerHTML = "";
        const dot = document.createElement("span");
        dot.className = "online-dot";
        supportHeaderStatus.append(dot, document.createTextNode(` ${profile.supportStatus}`));
    }

    if (supportHeaderAvatar) {
        supportHeaderAvatar.onerror = () => {
            supportHeaderAvatar.onerror = null;
            supportHeaderAvatar.src = "../../assets/images/logo.png";
        };
        supportHeaderAvatar.src = profile.supportPhoto;
        supportHeaderAvatar.alt = profile.supportName;
    }
}

function subscribeMessages() {
    state.unsubscribeMessages?.();

    const messagesQuery = query(
        collection(db, "conversations", state.conversationId, "messages"),
        orderBy("createdAt", "asc")
    );

    state.unsubscribeMessages = onSnapshot(
        messagesQuery,
        async snap => {
            state.currentMessages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            renderCurrentMessages();

            requestAnimationFrame(() => {
                if (stream) stream.scrollTop = stream.scrollHeight;
            });

            if (state.activeTab === "messages") await markCustomerRead();
        },
        error => {
            console.error("Customer message listener error:", error);
            if (stream) stream.innerHTML = loadingState("Unable to load messages.");
        }
    );
}

function renderCurrentMessages() {
    if (!stream) return;

    const messages = state.currentMessages || [];

    stream.innerHTML = messages.length
        ? messages.map((message, index) =>
            renderMessage(message, messages[index - 1])
        ).join("")
        : loadingState(`Send us a message. ${state.supportProfile.supportName} will reply here.`);
}

async function sendMessage(event) {
    event.preventDefault();

    const text = input?.value.trim();

    if (!text || !state.user || !state.conversationId) return;

    sendButton.disabled = true;

    try {
        const conversationRef = doc(db, "conversations", state.conversationId);
        const currentSnap = await getDoc(conversationRef);
        const current = currentSnap.exists() ? currentSnap.data() : {};

        await addDoc(
            collection(db, "conversations", state.conversationId, "messages"),
            {
                senderUid: state.user.uid,
                senderRole: "customer",
                senderName:
                    state.profile.fullName ||
                    state.profile.name ||
                    state.profile.displayName ||
                    state.user.displayName ||
                    "Customer",
                text,
                createdAt: serverTimestamp()
            }
        );

        await setDoc(
            conversationRef,
            {
                lastMessage: text,
                lastMessageAt: serverTimestamp(),
                lastSenderRole: "customer",
                unreadAdmin: Number(current.unreadAdmin || 0) + 1,
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        input.value = "";
        resetMessageInputSize();

    } catch (error) {
        console.error("Customer send message error:", error);
        alert("Unable to send your message. Please try again.");
    } finally {
        sendButton.disabled = false;
        input.focus();
    }
}

async function markCustomerRead() {
    if (!state.conversationId) return;

    try {
        await updateDoc(
            doc(db, "conversations", state.conversationId),
            {
                unreadCustomer: 0,
                customerLastReadAt: serverTimestamp()
            }
        );
    } catch (error) {
        console.warn("Unable to update customer read state:", error);
    }
}

/*
Firestore collection:
notifications/{notificationId}

Supported fields:
customerUid, type, title, message, isRead, createdAt,
bookingId, destination, travelDate, referenceNumber,
actionUrl, actionLabel
*/
function subscribeNotifications() {
    state.unsubscribeNotifications?.();

    const notificationsQuery = query(
        collection(db, "notifications"),
        where("customerUid", "==", state.user.uid)
    );

    state.unsubscribeNotifications = onSnapshot(
        notificationsQuery,
        snapshot => {
            state.notifications = snapshot.docs
                .map(docSnap => ({ id: docSnap.id, ...docSnap.data() }))
                .sort((a, b) =>
                    notificationTimeValue(b.createdAt) -
                    notificationTimeValue(a.createdAt)
                );

            state.unreadNotifications = state.notifications.filter(
                item => item.isRead !== true
            ).length;

            updateUnreadBadges();
            renderNotifications();

            if (
                state.selectedNotificationId &&
                !state.notifications.some(item => item.id === state.selectedNotificationId)
            ) {
                state.selectedNotificationId = null;
                renderNotificationDetail(null);
            }
        },
        error => {
            console.error("Customer notification listener error:", error);

            if (notificationsList) {
                notificationsList.innerHTML =
                    notificationEmptyState("Unable to load notifications.");
            }
        }
    );
}

notificationSearch?.addEventListener("input", event => {
    state.notificationSearch = String(event.target.value || "")
        .trim()
        .toLowerCase();

    renderNotifications();
});

notificationUnreadFilter?.addEventListener("click", () => {
    state.unreadOnly = !state.unreadOnly;

    notificationUnreadFilter.setAttribute(
        "aria-pressed",
        String(state.unreadOnly)
    );

    renderNotifications();
});

markAllNotificationsRead?.addEventListener(
    "click",
    markAllNotificationsAsRead
);

function getVisibleNotifications() {
    return state.notifications.filter(item => {
        if (state.unreadOnly && item.isRead === true) return false;

        if (!state.notificationSearch) return true;

        const haystack = [
            item.title,
            item.message,
            item.type,
            item.destination,
            item.bookingId
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return haystack.includes(state.notificationSearch);
    });
}

function renderNotifications() {
    if (!notificationsList) return;

    const visible = getVisibleNotifications();

    markAllNotificationsRead.hidden = state.unreadNotifications === 0;

    if (!visible.length) {
        notificationsList.innerHTML = notificationEmptyState(
            state.notifications.length
                ? "No notifications match your filter."
                : "No notifications yet."
        );
        return;
    }

    notificationsList.innerHTML = visible.map(renderNotificationItem).join("");

    notificationsList
        .querySelectorAll("[data-notification-id]")
        .forEach(button => {
            button.addEventListener("click", () => {
                openNotification(button.dataset.notificationId);
            });
        });
}

function renderNotificationItem(item) {
    const typeInfo = notificationTypeInfo(item.type);
    const unread = item.isRead !== true;
    const selected = item.id === state.selectedNotificationId;

    return `
        <button
            type="button"
            class="notification-item${unread ? " unread" : ""}${selected ? " selected" : ""}"
            data-notification-id="${escapeAttr(item.id)}">

            <span class="notification-type-icon ${escapeAttr(typeInfo.className)}">
                <i class="${escapeAttr(typeInfo.icon)}"></i>
            </span>

            <span class="notification-copy">
                <h3>${escapeHTML(item.title || typeInfo.label)}</h3>
                <p>${escapeHTML(item.message || "")}</p>
            </span>

            <span class="notification-meta">
                ${escapeHTML(formatNotificationListDate(item.createdAt))}
                ${unread ? '<span class="notification-unread-dot" aria-label="Unread"></span>' : ""}
            </span>
        </button>
    `;
}

async function openNotification(notificationId) {
    const item = state.notifications.find(
        notification => notification.id === notificationId
    );

    if (!item) return;

    state.selectedNotificationId = item.id;
    renderNotifications();
    renderNotificationDetail(item);
    openMobileNotificationDetail();

    if (item.isRead !== true) {
        try {
            await updateDoc(
                doc(db, "notifications", item.id),
                {
                    isRead: true,
                    readAt: serverTimestamp()
                }
            );
        } catch (error) {
            console.warn("Unable to mark notification as read:", error);
        }
    }
}

function isMobileNotificationLayout() {
    return window.matchMedia("(max-width: 899px)").matches;
}

function ensureMobileNotificationBackButton() {
    if (!notificationDetailPane) return null;

    let button = notificationDetailPane.querySelector(
        ".notification-mobile-back"
    );

    if (button) return button;

    button = document.createElement("button");
    button.type = "button";
    button.className = "notification-mobile-back";
    button.setAttribute("aria-label", "Back to notifications");
    button.innerHTML = `
        <i class="fa-solid fa-arrow-left"></i>
        <span>Notifications</span>
    `;

    button.addEventListener("click", closeMobileNotificationDetail);
    notificationDetailPane.prepend(button);

    return button;
}

function openMobileNotificationDetail() {
    if (!isMobileNotificationLayout()) return;
    if (!notificationsWorkspace || !notificationDetailPane) return;

    ensureMobileNotificationBackButton();
    notificationsWorkspace.classList.add("mobile-detail-open");

    if (notificationsListPane) {
        notificationsListPane.setAttribute("aria-hidden", "true");
    }

    notificationDetailPane.removeAttribute("aria-hidden");
    notificationDetailPane.scrollTop = 0;
}

function closeMobileNotificationDetail() {
    if (!notificationsWorkspace) return;

    notificationsWorkspace.classList.remove("mobile-detail-open");

    if (notificationsListPane) {
        notificationsListPane.removeAttribute("aria-hidden");
    }

    if (notificationDetailPane && isMobileNotificationLayout()) {
        notificationDetailPane.setAttribute("aria-hidden", "true");
    }
}

window.addEventListener("resize", () => {
    if (!notificationsWorkspace || !notificationDetailPane) return;

    if (!isMobileNotificationLayout()) {
        notificationsWorkspace.classList.remove("mobile-detail-open");
        notificationsListPane?.removeAttribute("aria-hidden");
        notificationDetailPane.removeAttribute("aria-hidden");
        return;
    }

    if (!notificationsWorkspace.classList.contains("mobile-detail-open")) {
        notificationDetailPane.setAttribute("aria-hidden", "true");
    }
});

ensureMobileNotificationBackButton();

function renderNotificationDetail(item) {
    if (!notificationDetailEmpty || !notificationDetailCard) return;

    if (!item) {
        notificationDetailEmpty.hidden = false;
        notificationDetailCard.hidden = true;
        return;
    }

    const typeInfo = notificationTypeInfo(item.type);

    notificationDetailEmpty.hidden = true;
    notificationDetailCard.hidden = false;

    notificationDetailIcon.className =
        `notification-detail-icon ${typeInfo.className}`;

    notificationDetailIcon.innerHTML =
        `<i class="${escapeAttr(typeInfo.icon)}"></i>`;

    notificationDetailType.textContent = typeInfo.label;
    notificationDetailTitle.textContent = item.title || typeInfo.label;
    notificationDetailDate.textContent = formatDateTime(item.createdAt);
    notificationDetailMessage.textContent = item.message || "";

    const detailRows = [
        ["Booking ID", item.bookingId],
        ["Destination", item.destination],
        ["Travel Date", item.travelDate],
        ["Reference", item.referenceNumber]
    ].filter(([, value]) => value);

    if (detailRows.length) {
        notificationDetailMeta.hidden = false;
        notificationDetailMeta.innerHTML = detailRows
            .map(([label, value]) => `
                <div class="notification-detail-meta-row">
                    <span>${escapeHTML(label)}</span>
                    <strong>${escapeHTML(formatNotificationValue(value))}</strong>
                </div>
            `)
            .join("");
    } else {
        notificationDetailMeta.hidden = true;
        notificationDetailMeta.innerHTML = "";
    }

    const actionUrl = safeActionUrl(item.actionUrl);

    if (actionUrl) {
        notificationDetailAction.hidden = false;
        notificationDetailAction.href = actionUrl;

        notificationDetailAction
            .querySelector("span")
            .textContent = item.actionLabel || "View details";
    } else {
        notificationDetailAction.hidden = true;
        notificationDetailAction.removeAttribute("href");
    }
}

async function markAllNotificationsAsRead() {
    const unread = state.notifications.filter(
        item => item.isRead !== true
    );

    if (!unread.length) return;

    markAllNotificationsRead.disabled = true;

    try {
        await Promise.all(
            unread.map(item =>
                updateDoc(
                    doc(db, "notifications", item.id),
                    {
                        isRead: true,
                        readAt: serverTimestamp()
                    }
                )
            )
        );
    } catch (error) {
        console.error("Unable to mark all notifications as read:", error);
        alert("Unable to mark all notifications as read. Please try again.");
    } finally {
        markAllNotificationsRead.disabled = false;
    }
}

function updateUnreadBadges() {
    setBadge(messagesTabBadge, state.unreadMessages);
    setBadge(notificationsTabBadge, state.unreadNotifications);
    setBadge(messageCenterBellBadge, state.unreadNotifications);

    const totalUnread =
        state.unreadMessages +
        state.unreadNotifications;

    document.dispatchEvent(
        new CustomEvent(
            "tripswonder:message-unread",
            {
                detail: {
                    messages: state.unreadMessages,
                    notifications: state.unreadNotifications,
                    total: totalUnread
                }
            }
        )
    );
}

function setBadge(element, count) {
    if (!element) return;

    const safeCount = Math.max(0, Number(count || 0));
    const hasUnread = safeCount > 0;

    /*
     * FINAL BADGE RULE:
     * Zero unread = completely hide the badge.
     * One or more unread = show the unread count.
     */
    element.hidden = !hasUnread;
    element.style.display = hasUnread ? "" : "none";
    element.setAttribute("aria-hidden", String(!hasUnread));

    if (!hasUnread) {
        element.textContent = "";
        return;
    }

    element.textContent =
        safeCount > 99
            ? "99+"
            : String(safeCount);
}

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

    const grouped = previousRole === role;

    const supportPhoto = escapeAttr(
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
                        onerror="this.onerror=null;this.src='../../assets/images/logo.png';">
                </div>
            `
            : "";

    const readReceipt =
        role === "customer"
            ? `
                <span
                    class="customer-message-read"
                    title="Sent"
                    aria-label="Sent">✓✓</span>
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

function notificationTypeInfo(value) {
    const type = String(value || "system")
        .trim()
        .toLowerCase();

    const map = {
        booking: {
            className: "booking",
            icon: "fa-solid fa-circle-check",
            label: "Booking"
        },
        booking_confirmed: {
            className: "booking",
            icon: "fa-solid fa-circle-check",
            label: "Booking Confirmed"
        },
        payment: {
            className: "payment",
            icon: "fa-regular fa-credit-card",
            label: "Payment"
        },
        payment_reminder: {
            className: "payment",
            icon: "fa-regular fa-credit-card",
            label: "Payment Reminder"
        },
        trip: {
            className: "trip",
            icon: "fa-regular fa-calendar-check",
            label: "Trip"
        },
        trip_reminder: {
            className: "trip",
            icon: "fa-regular fa-calendar-check",
            label: "Trip Reminder"
        },
        promo: {
            className: "promo",
            icon: "fa-solid fa-bullhorn",
            label: "Promo"
        },
        offer: {
            className: "promo",
            icon: "fa-solid fa-bullhorn",
            label: "Promo"
        },
        important: {
            className: "important",
            icon: "fa-solid fa-circle-exclamation",
            label: "Important Alert"
        },
        alert: {
            className: "important",
            icon: "fa-solid fa-circle-exclamation",
            label: "Important Alert"
        },
        schedule: {
            className: "system",
            icon: "fa-solid fa-circle-info",
            label: "Schedule Update"
        },
        schedule_update: {
            className: "system",
            icon: "fa-solid fa-circle-info",
            label: "Schedule Update"
        },
        system: {
            className: "system",
            icon: "fa-solid fa-circle-info",
            label: "Update"
        }
    };

    return map[type] || map.system;
}

function loadingState(text) {
    return `
        <div class="message-loading">
            <i class="fa-regular fa-comments"></i>
            <span>${escapeHTML(text)}</span>
        </div>
    `;
}

function notificationEmptyState(text) {
    return `
        <div class="notification-empty-state">
            <i class="fa-regular fa-bell"></i>
            <span>${escapeHTML(text)}</span>
        </div>
    `;
}

function toDate(value) {
    if (!value) return null;

    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    if (
        typeof value === "object" &&
        Number.isFinite(value.seconds)
    ) {
        return new Date(value.seconds * 1000);
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

function notificationTimeValue(value) {
    const date = toDate(value);
    return date ? date.getTime() : 0;
}

function formatDateTime(value) {
    const date = toDate(value);

    if (!date) return "Just now";

    return date.toLocaleString(
        [],
        {
            month: "short",
            day: "numeric",
            year:
                date.getFullYear() !== new Date().getFullYear()
                    ? "numeric"
                    : undefined,
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

function formatNotificationListDate(value) {
    const date = toDate(value);

    if (!date) return "Now";

    const now = new Date();
    const sameDay =
        date.toDateString() === now.toDateString();

    if (sameDay) {
        return date.toLocaleTimeString(
            [],
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );
    }

    const yesterday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 1
    );

    if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
    }

    return date.toLocaleDateString(
        [],
        {
            month: "short",
            day: "numeric"
        }
    );
}

function formatNotificationValue(value) {
    const date = toDate(value);

    if (
        date &&
        (
            typeof value === "object" ||
            value instanceof Date
        )
    ) {
        return date.toLocaleDateString(
            [],
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );
    }

    return String(value ?? "");
}

function safeActionUrl(value) {
    const url = String(value || "").trim();

    if (!url) return "";

    if (
        url.startsWith("./") ||
        url.startsWith("../") ||
        url.startsWith("/") ||
        /^[a-zA-Z0-9_-]+\.html(?:[?#].*)?$/.test(url)
    ) {
        return url;
    }

    try {
        const parsed = new URL(url, window.location.href);

        if (parsed.origin === window.location.origin) {
            return parsed.href;
        }
    } catch (_) {
        return "";
    }

    return "";
}

function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        ch => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[ch]
    );
}

function escapeAttr(value) {
    return escapeHTML(value);
}

/* ==========================================================
   MEMBER-TO-MEMBER MESSENGER
   One initial request message. The conversation starts automatically when the recipient replies.
   ========================================================== */

const memberMessageTrigger = null;
const memberMessageBadge = document.getElementById("memberMessageBadge");
const memberMessengerPanel = document.getElementById("memberMessengerPanel");
const memberMessengerInbox = document.getElementById("memberMessengerInbox");
const memberChatView = document.getElementById("memberChatView");
const memberSearchInput = document.getElementById("memberSearchInput");
const memberSearchResults = document.getElementById("memberSearchResults");
const memberSearchClear = document.getElementById("memberSearchClear");
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

function memberConversationState(conversation) {
    return String(conversation?.requestState || "").trim().toLowerCase();
}

function memberIsClosedConversation(conversation) {
    const state = memberConversationState(conversation);
    return state === "declined" || state === "blocked";
}

function memberIsBlockedConversation(conversation) {
    return memberConversationState(conversation) === "blocked";
}

function renderMemberRequestActions() {
    const existingHost =
        memberChatRequestInfo?.querySelector(".tw-member-request-actions");

    if (existingHost) {
        existingHost.remove();
    }
}

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

    const safeCount =
        Math.max(
            0,
            Number(count) || 0
        );

    memberMessageBadge.textContent =
        safeCount > 99
            ? "99+"
            : String(safeCount);

    memberMessageBadge.hidden =
        safeCount === 0;
}


function setMemberRequestBadge(count) {

    const requestTab =
        document.querySelector(
            '[data-member-tab="requests"]'
        );

    if (!requestTab) {
        return;
    }


    let badge =
        requestTab.querySelector(
            ".tw-member-request-badge"
        );


    const safeCount =
        Math.max(
            0,
            Number(count) || 0
        );


    if (!badge) {

        badge =
            document.createElement(
                "span"
            );

        badge.className =
            "tw-member-request-badge";

        badge.setAttribute(
            "aria-label",
            "Message requests"
        );

        requestTab.appendChild(
            badge
        );

    }


    badge.textContent =
        safeCount > 99
            ? "99+"
            : String(safeCount);

    badge.hidden =
        safeCount === 0;

}


function updateMemberMessengerBadges() {

    if (!currentUser) {

        setMemberMessageBadge(0);
        setMemberRequestBadge(0);

        return;
    }


    let totalAttentionCount =
        0;

    let requestCount =
        0;


    memberConversations.forEach(
        conversation => {

            const unread =
                Math.max(
                    0,
                    Number(
                        conversation?.unread?.[
                            currentUser.uid
                        ]
                    ) || 0
                );


            const incomingRequest =
                memberIsIncomingRequest(
                    conversation
                );


            /*
             * A pending incoming request must stay visible
             * in the badge even after the user opens it.
             * Opening the request clears unread to 0, but
             * the request still needs a reply/accept action.
             */
            if (incomingRequest) {

                requestCount +=
                    1;

                totalAttentionCount +=
                    Math.max(
                        1,
                        unread
                    );

                return;

            }


            totalAttentionCount +=
                unread;

        }
    );


    setMemberMessageBadge(
        totalAttentionCount
    );

    setMemberRequestBadge(
        requestCount
    );

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

memberChatBack?.addEventListener("click", showMemberInbox);

function setMemberTab(tabName) {
    const allowedTabs = ["chats", "requests", "support"];
    const nextTab = allowedTabs.includes(tabName) ? tabName : "chats";
    activeMemberTab = nextTab;

    const controls = [
        document.getElementById("memberChatsTab"),
        document.getElementById("memberRequestsTab"),
        document.getElementById("memberSupportTab")
    ];

    controls.forEach(control => {
        if (!control) return;
        const active = control.dataset.memberTab === nextTab;
        control.classList.toggle("active", active);
        control.setAttribute("aria-selected", String(active));
    });

    if (nextTab === "support") {
        openTripsWonderSupport();
        return;
    }

    if (memberSearchInput) {
        memberSearchInput.disabled = false;
        memberSearchInput.placeholder = "Search username or email";
    }
    renderMemberConversationList();
}

/*
 * FINAL TAB CONTROLLER
 * Bind directly to the two permanent buttons by ID.
 * No inline onclick, no delegation, no hash routing.
 */
const memberChatsTab =
    document.getElementById("memberChatsTab");

const memberRequestsTab =
    document.getElementById("memberRequestsTab");

const memberSupportTab =
    document.getElementById("memberSupportTab");

memberChatsTab?.addEventListener("click", event => {
    event.preventDefault();
    setMemberTab("chats");
});

memberRequestsTab?.addEventListener("click", event => {
    event.preventDefault();
    setMemberTab("requests");
});

memberSupportTab?.addEventListener("click", event => {
    event.preventDefault();
    setMemberTab("support");
});

setMemberTab("chats");

const memberSearchFunctions =
    getFunctions();

const searchMemberExactCallable =
    httpsCallable(
        memberSearchFunctions,
        "searchMemberExact"
    );

    const askTripsWonderSupportCallable =
    httpsCallable(
        memberSearchFunctions,
        "askTripsWonderSupport"
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
    const term = String(event.target.value || "");

    clearTimeout(memberSearchTimer);

    if (memberSearchClear) {
        memberSearchClear.hidden = !term.trim();
    }

    if (!term.trim()) {
        if (memberSearchResults) {
            memberSearchResults.hidden = true;
            memberSearchResults.innerHTML = "";
        }
        return;
    }

    memberSearchTimer =
        setTimeout(
            () => searchMemberDirectory(term),
            350
        );
});

memberSearchClear?.addEventListener("click", () => {
    clearTimeout(memberSearchTimer);

    if (memberSearchInput) {
        memberSearchInput.value = "";
    }

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

        if (memberIsBlockedConversation(existingConversation)) {
            window.alert(
                existingConversation.blockedByUid === currentUser.uid
                    ? "You blocked this member."
                    : "This member is unavailable for messaging."
            );
            return;
        }

        if (memberConversationState(existingConversation) === "declined") {
            window.alert(
                "This message request was declined."
            );
            return;
        }

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

    if (memberIsIncomingRequest(conversation)) {
        requestAnimationFrame(() => {
            if (memberChatInput) {
                memberChatInput.disabled = false;
                memberChatInput.focus();
            }

            if (memberChatSend) {
                memberChatSend.disabled = false;
            }
        });
    }

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

    if (memberMessengerInbox) {
        memberMessengerInbox.hidden =
            window.matchMedia("(max-width: 899px)").matches;
    }
    if (memberChatView) memberChatView.hidden = false;

    if (memberChatName) {
        memberChatName.textContent =
            memberProfileName(activeMemberProfile);
    }

    if (memberChatAvatar) {
        memberChatAvatar.innerHTML =
            memberAvatarHtml(activeMemberProfile);
    }

    syncSelectedMemberInfo?.();

    const incoming =
        memberIsIncomingRequest(activeMemberConversation);

    const waiting =
        memberIsOutgoingWaiting(activeMemberConversation);

    const blocked =
        memberIsBlockedConversation(activeMemberConversation);

    const declined =
        memberConversationState(activeMemberConversation) === "declined";

    if (memberChatStatus) {
        memberChatStatus.textContent =
            blocked ? "Blocked" :
            declined ? "Request declined" :
            incoming ? "Message request" :
            waiting ? "Waiting for reply" :
            "Trips Wonder member";
    }

    if (memberChatRequestInfo && memberChatRequestText) {
        if (blocked) {
            memberChatRequestInfo.hidden = false;
            memberChatRequestText.textContent =
                activeMemberConversation.blockedByUid === currentUser?.uid
                    ? "You blocked this member."
                    : "This conversation is unavailable.";
        } else if (declined) {
            memberChatRequestInfo.hidden = false;
            memberChatRequestText.textContent =
                "This message request was declined.";
        } else if (waiting) {
            memberChatRequestInfo.hidden = false;
            memberChatRequestText.textContent =
                "Your first message was sent. You can send more messages after this member replies.";
        } else if (incoming) {
            memberChatRequestInfo.hidden = true;
            memberChatRequestText.textContent = "";
        } else {
            memberChatRequestInfo.hidden = true;
            memberChatRequestText.textContent = "";
        }
    }

    renderMemberRequestActions();

    if (memberChatInput && memberChatSend) {
        const locked =
            waiting ||
            blocked ||
            declined;

        memberChatInput.disabled = locked;
        memberChatSend.disabled = locked;

        /*
         * Incoming request = first reply accepts the request.
         * The composer must stay enabled.
         */
        if (incoming && !blocked && !declined) {
            memberChatInput.disabled = false;
            memberChatSend.disabled = false;
        }

        memberChatInput.placeholder =
            blocked ? "This conversation is blocked." :
            declined ? "This request was declined." :
            incoming ? "Write a reply..." :
            waiting ? "Waiting for this member to reply..." :
            "Write a message...";
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

            /*
             * Keep the top Messages badge and the Requests-tab
             * badge synchronized in real time.
             *
             * This covers:
             * - unread replies in normal chats
             * - new first-message requests
             * - pending requests that were opened but not replied to yet
             */
            updateMemberMessengerBadges();

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
    if (activeMemberTab === "support") {
        renderTripsWonderSupportList();
        return;
    }
    if (!memberChatList || !currentUser) return;

    const rows = memberConversations.filter(conversation => {
        if (memberIsClosedConversation(conversation)) {
            return false;
        }

        const incoming =
            memberIsIncomingRequest(conversation);

        const isOpenIncomingRequest =
            incoming &&
            activeMemberConversation?.id === conversation.id;

        return activeMemberTab === "requests"
            ? incoming
            : (!incoming || isOpenIncomingRequest);
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
        button.dataset.conversationId = conversation.id;
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
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            openMemberConversation(conversation);
        });

        memberChatList.appendChild(button);
    });
}


/* ==========================================================
   MESSAGE PAGE CLICK SAFETY
   Ensures conversation rows remain clickable even after
   Firestore re-renders the chat list.
   ========================================================== */

memberChatList?.addEventListener(
    "click",
    event => {

        const row =
            event.target.closest(
                ".tw-member-chat-row"
            );

        if (!row) {
            return;
        }

        const conversationId =
            String(
                row.dataset.conversationId ||
                ""
            ).trim();

        if (!conversationId) {
            return;
        }

        const conversation =
            memberConversations.find(
                item =>
                    item.id ===
                    conversationId
            );

        if (!conversation) {
            return;
        }

        event.preventDefault();

        openMemberConversation(
            conversation
        );
    }
);


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

    if (
        memberIsOutgoingWaiting(activeMemberConversation) ||
        memberIsClosedConversation(activeMemberConversation)
    ) {
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
                updates.acceptedByUid = currentUser.uid;
                updates.acceptedAt = serverTimestamp();
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

            if (incomingRequest) {
                setMemberTab("chats");
            }

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
        const chatLocked =
            memberIsOutgoingWaiting(activeMemberConversation) ||
            memberIsClosedConversation(activeMemberConversation);

        if (!chatLocked) {
            if (memberChatInput) memberChatInput.disabled = false;
            if (memberChatSend) memberChatSend.disabled = false;
            memberChatInput?.focus();
        }
    }
});


/* ==========================================================
   TRIPS WONDER SUPPORT
   Single Firestore Thread + Human Team Handoff
   ========================================================== */

const SUPPORT_NAME = "Trips Wonder Support";
const SUPPORT_STATUS = "We’re here to help";
const AUTOMATED_SUPPORT_LABEL = "Travel Consultant Support";

function getTripsWonderSupportProfile() {
    const profile = state.supportProfile || {};

    return {
        name:
            String(
                profile.supportName ||
                SUPPORT_NAME
            ).trim() ||
            SUPPORT_NAME,

        status:
            String(
                profile.supportStatus ||
                SUPPORT_STATUS
            ).trim() ||
            SUPPORT_STATUS,

        photo:
            String(
                profile.supportPhoto ||
                "../../assets/images/logo.png"
            ).trim() ||
            "../../assets/images/logo.png"
    };
}

function getAdminSupportLabel(message = {}) {
    const rawName =
        String(
            message.senderName ||
            "Team"
        ).trim();

    const firstName =
        rawName
            .split(/\s+/)
            .filter(Boolean)[0] ||
        "Team";

    return `Admin ${firstName}`;
}

function getSupportMessageSenderLabel(message = {}) {
    const role =
        String(
            message.senderRole || ""
        ).trim().toLowerCase();

    if (
        role === "admin" ||
        role === "owner" ||
        role === "staff"
    ) {
        return getAdminSupportLabel(message);
    }

    return AUTOMATED_SUPPORT_LABEL;
}

function renderTripsWonderSupportAvatar(target) {
    if (!target) return;

    const profile =
        getTripsWonderSupportProfile();

    target.innerHTML = "";

    const img =
        document.createElement("img");

    img.src =
        profile.photo;

    img.alt =
        profile.name;

    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    img.style.borderRadius = "inherit";

    img.onerror = () => {
        img.onerror = null;
        img.src =
            "../../assets/images/logo.png";
    };

    target.appendChild(img);
}

const supportQuickQuestions = [
    "Tour packages",
    "Rates & inclusions",
    "Pick-up points",
    "Booking help"
];

let supportNeedsHumanHandoff = false;
let supportHumanMode = false;
let supportHumanMessages = [];
let supportHumanMessagesUnsubscribe = null;
let supportConversationUnsubscribe = null;


/* ==========================================================
   SUPPORT MODE / CONVERSATION LISTENER
   Firestore is the source of truth.
   ========================================================== */

function normalizeTripsWonderSupportMode(data = {}) {
    const mode = String(data.supportMode || "").trim().toLowerCase();
    const status = String(data.supportStatus || "").trim().toLowerCase();

    return (
        mode === "human" ||
        status === "human" ||
        status === "needs_support" ||
        data.handoffRequested === true
    )
        ? "human"
        : "online";
}

async function ensureTripsWonderSupportThread() {
    if (!state.user) return "";

    const conversationId = await ensureConversation();
    state.conversationId = conversationId;

    subscribeTripsWonderSupportMessages();
    subscribeTripsWonderSupportMode();

    return conversationId;
}

function subscribeTripsWonderSupportMode() {
    if (!state.conversationId) return;

    if (supportConversationUnsubscribe) {
        supportConversationUnsubscribe();
        supportConversationUnsubscribe = null;
    }

    supportConversationUnsubscribe = onSnapshot(
        doc(db, "conversations", state.conversationId),
        snapshot => {
            const data = snapshot.exists() ? snapshot.data() : {};
            const nextHumanMode =
                normalizeTripsWonderSupportMode(data) === "human";

            const modeChanged =
                supportHumanMode !== nextHumanMode;

            supportHumanMode = nextHumanMode;

            if (!supportHumanMode) {
                supportNeedsHumanHandoff = false;
            }

            if (activeMemberTab === "support") {
                renderTripsWonderSupportList();
                openTripsWonderSupportConversation();
            }

            if (modeChanged) {
                scrollTripsWonderSupportToBottom();
            }
        },
        error => {
            console.error(
                "TRIPS WONDER SUPPORT MODE LISTENER ERROR:",
                error
            );
        }
    );
}


/* ==========================================================
   SUPPORT LIST CARD
   ========================================================== */

function renderTripsWonderSupportList() {
    if (!memberChatList) return;

    memberChatList.innerHTML = `
        <button
            type="button"
            class="tw-support-list-card"
            data-open-support>

            <span class="tw-member-avatar">
                <i class="fa-solid fa-headset"></i>
            </span>

            <span class="tw-support-list-copy">
                <strong>${escapeHtml(getTripsWonderSupportProfile().name)}</strong>
                <small>
                    ${escapeHtml(getTripsWonderSupportProfile().status)}
                </small>
            </span>

            <span class="tw-support-online">
                ${supportHumanMode ? "Team" : "Online"}
            </span>
        </button>
    `;

    const supportListAvatar =
        memberChatList.querySelector(
            "[data-open-support] .tw-member-avatar"
        );

    renderTripsWonderSupportAvatar(
        supportListAvatar
    );

    memberChatList
        .querySelector("[data-open-support]")
        ?.addEventListener(
            "click",
            openTripsWonderSupportConversation
        );
}


/* ==========================================================
   OPEN SUPPORT TAB
   ========================================================== */

function openTripsWonderSupport() {
    activeMemberConversation = null;
    activeMemberProfile = null;

    if (memberMessagesUnsubscribe) {
        memberMessagesUnsubscribe();
        memberMessagesUnsubscribe = null;
    }

    if (memberSearchResults) {
        memberSearchResults.hidden = true;
        memberSearchResults.innerHTML = "";
    }

    if (memberSearchInput) {
        memberSearchInput.value = "";
        memberSearchInput.disabled = true;
        memberSearchInput.placeholder = "Trips Wonder Support";
    }

    renderTripsWonderSupportList();
    openTripsWonderSupportConversation();

    ensureTripsWonderSupportThread().catch(error => {
        console.error(
            "TRIPS WONDER SUPPORT INITIALIZATION ERROR:",
            error
        );
    });
}


/* ==========================================================
   OPEN SUPPORT CONVERSATION
   ========================================================== */

function openTripsWonderSupportConversation() {
    if (memberMessengerInbox) {
        memberMessengerInbox.hidden =
            window.matchMedia("(max-width: 899px)").matches;
    }

    if (memberChatView) {
        memberChatView.hidden = false;
    }

    const supportProfile =
        getTripsWonderSupportProfile();

    renderTripsWonderSupportAvatar(
        memberChatAvatar
    );

    if (memberChatName) {
        memberChatName.textContent =
            supportProfile.name;
    }

    const statusText =
        supportProfile.status;

    if (memberChatStatus) {
        memberChatStatus.textContent = statusText;
    }

    if (memberChatRequestInfo) {
        memberChatRequestInfo.hidden = true;
    }

    if (memberChatInput) {
        memberChatInput.disabled = false;
        memberChatInput.placeholder =
            supportHumanMode
                ? "Message the Trips Wonder team..."
                : "Ask Trips Wonder Support...";
    }

    if (memberChatSend) {
        memberChatSend.disabled = false;
    }

    renderTripsWonderSupportAvatar(
        memberInfoAvatar
    );

    if (memberInfoName) {
        memberInfoName.textContent =
            supportProfile.name;
    }

    if (memberInfoStatus) {
        memberInfoStatus.textContent = statusText;
    }

    renderTripsWonderUnifiedMessages();
}


/* ==========================================================
   ONE REAL-TIME MESSAGE LISTENER
   Used by both Online Support and Human Support.
   ========================================================== */

function subscribeTripsWonderSupportMessages() {
    if (!state.conversationId) return;

    if (supportHumanMessagesUnsubscribe) {
        supportHumanMessagesUnsubscribe();
        supportHumanMessagesUnsubscribe = null;
    }

    const messagesQuery = query(
        collection(
            db,
            "conversations",
            state.conversationId,
            "messages"
        ),
        orderBy("createdAt", "asc")
    );

    supportHumanMessagesUnsubscribe = onSnapshot(
        messagesQuery,
        snapshot => {
            supportHumanMessages =
                snapshot.docs.map(item => ({
                    id: item.id,
                    ...item.data()
                }));

            if (activeMemberTab === "support") {
                renderTripsWonderUnifiedMessages();
            }

            markTripsWonderHumanMessagesRead();
        },
        error => {
            console.error(
                "TRIPS WONDER SUPPORT MESSAGE LISTENER ERROR:",
                error
            );

            if (
                activeMemberTab === "support" &&
                memberChatMessages
            ) {
                memberChatMessages.innerHTML = `
                    <div class="tw-messenger-empty">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <strong>Unable to load support messages</strong>
                        <span>Please try again in a moment.</span>
                    </div>
                `;
            }
        }
    );
}


/* Backward-compatible name used by the handoff flow. */
function subscribeTripsWonderHumanMessages() {
    subscribeTripsWonderSupportMessages();
}


/* ==========================================================
   UNIFIED SUPPORT MESSAGE RENDERER
   Existing Firestore history never disappears when responder changes.
   ========================================================== */

function renderTripsWonderUnifiedMessages() {
    if (!memberChatMessages) return;

    if (!supportHumanMessages.length) {
        memberChatMessages.innerHTML = `
            <div class="tw-support-welcome">

                <div class="tw-support-welcome-icon">
                    <i class="fa-solid fa-headset"></i>
                </div>

                <h3>Hi! How can we help?</h3>

                <p>
                    Ask us about Trips Wonder tour packages,
                    rates, inclusions, pick-up points,
                    itineraries, or booking assistance.
                </p>

                ${supportHumanMode
                    ? ""
                    : `
                        <div class="tw-support-suggestions">
                            ${supportQuickQuestions
                                .map(
                                    text => `
                                        <button
                                            type="button"
                                            class="tw-support-suggestion"
                                            data-support-question="${escapeAttr(text)}">
                                            ${escapeHtml(text)}
                                        </button>
                                    `
                                )
                                .join("")}
                        </div>
                    `}
            </div>
        `;

        memberChatMessages
            .querySelectorAll("[data-support-question]")
            .forEach(button => {
                button.addEventListener(
                    "click",
                    () => {
                        submitTripsWonderSupportMessage(
                            button.dataset.supportQuestion || ""
                        );
                    }
                );
            });

        return;
    }

    memberChatMessages.innerHTML =
        supportHumanMessages
            .map(message => {
                const mine =
                    message.senderRole === "customer" ||
                    message.senderUid === state.user?.uid;

                const senderLabelText =
                    getSupportMessageSenderLabel(
                        message
                    );

                const senderLabel =
                    mine
                        ? ""
                        : `
                            <small
                                style="
                                    display:block;
                                    margin:0 0 3px;
                                    font-size:8px;
                                    font-weight:700;
                                    opacity:.72;
                                ">
                                ${escapeHtml(senderLabelText)}
                            </small>
                        `;

                return `
                    <div class="tw-support-message${mine ? " mine" : ""}">
                        ${senderLabel}
                        ${escapeHtml(message.text || "")}
                    </div>
                `;
            })
            .join("");

    if (
        !supportHumanMode &&
        supportNeedsHumanHandoff
    ) {
        const handoffHost =
            document.createElement("div");

        handoffHost.className =
            "tw-support-suggestions";

        const teamButton =
            document.createElement("button");

        teamButton.type = "button";
        teamButton.className =
            "tw-support-suggestion";

        teamButton.innerHTML = `
            <i class="fa-solid fa-headset"></i>
            Talk to a Team Member
        `;

        teamButton.addEventListener(
            "click",
            talkToTripsWonderTeam
        );

        handoffHost.appendChild(teamButton);
        memberChatMessages.appendChild(handoffHost);
    }

    scrollTripsWonderSupportToBottom();
}


/* Keep old render function names safe for any existing calls. */
function renderTripsWonderSupportMessages() {
    renderTripsWonderUnifiedMessages();
}

function renderTripsWonderHumanMessages() {
    renderTripsWonderUnifiedMessages();
}


/* ==========================================================
   HUMAN SUPPORT HANDOFF
   ========================================================== */

async function talkToTripsWonderTeam() {
    if (!state.user) return;

    if (memberChatInput) {
        memberChatInput.disabled = true;
    }

    if (memberChatSend) {
        memberChatSend.disabled = true;
    }

    try {
        const conversationId =
            await ensureTripsWonderSupportThread();

        supportHumanMode = true;
        supportNeedsHumanHandoff = false;

        await setDoc(
            doc(
                db,
                "conversations",
                conversationId
            ),
            {
                status: "open",
                supportMode: "human",
                supportStatus: "active",
                handoffRequested: true,
                handoffRequestedAt:
                    serverTimestamp(),
                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

        renderTripsWonderSupportList();
        openTripsWonderSupportConversation();

    } catch (error) {
        console.error(
            "TRIPS WONDER TEAM HANDOFF ERROR:",
            error
        );

        supportHumanMode = false;

        window.alert(
            "Unable to connect you with a Trips Wonder team member right now. Please try again."
        );

        renderTripsWonderUnifiedMessages();

    } finally {
        if (memberChatInput) {
            memberChatInput.disabled = false;
        }

        if (memberChatSend) {
            memberChatSend.disabled = false;
        }

        memberChatInput?.focus();
    }
}


/* ==========================================================
   WRITE A CUSTOMER MESSAGE TO THE OFFICIAL SUPPORT THREAD
   ========================================================== */

async function writeTripsWonderCustomerMessage(
    cleanText,
    forceHumanMode = false
) {
    if (!state.user) return;

    const conversationId =
        await ensureTripsWonderSupportThread();

    const conversationRef =
        doc(
            db,
            "conversations",
            conversationId
        );

    const currentSnap =
        await getDoc(conversationRef);

    const current =
        currentSnap.exists()
            ? currentSnap.data()
            : {};

    /*
     * Re-check Firestore immediately before sending.
     * This prevents an online-support request from racing
     * with an admin takeover.
     */
    const actualHumanMode =
        forceHumanMode ||
        normalizeTripsWonderSupportMode(current) === "human";

    const senderName =
        state.profile?.fullName ||
        state.profile?.name ||
        state.profile?.displayName ||
        state.user.displayName ||
        state.user.email ||
        "Customer";

    await addDoc(
        collection(
            db,
            "conversations",
            conversationId,
            "messages"
        ),
        {
            senderUid:
                state.user.uid,
            senderRole:
                "customer",
            senderName,
            text:
                cleanText,
            createdAt:
                serverTimestamp()
        }
    );

    const updateData = {
        lastMessage:
            cleanText,
        lastMessageAt:
            serverTimestamp(),
        lastSenderRole:
            "customer",
        unreadAdmin:
            Number(
                current.unreadAdmin || 0
            ) + 1,
        status:
            "open",
        updatedAt:
            serverTimestamp()
    };

    if (actualHumanMode) {
        updateData.supportMode = "human";
        updateData.handoffRequested = true;
    }

    await setDoc(
        conversationRef,
        updateData,
        {
            merge: true
        }
    );

    return {
        conversationId,
        humanMode: actualHumanMode
    };
}


/* ==========================================================
   SEND MESSAGE TO HUMAN TEAM
   ========================================================== */

async function sendTripsWonderHumanMessage(text) {
    const cleanText =
        String(text || "").trim();

    if (!cleanText || !state.user) return;

    if (memberChatInput) {
        memberChatInput.disabled = true;
    }

    if (memberChatSend) {
        memberChatSend.disabled = true;
    }

    try {
        await writeTripsWonderCustomerMessage(
            cleanText,
            true
        );

    } catch (error) {
        console.error(
            "TRIPS WONDER HUMAN SUPPORT SEND ERROR:",
            error
        );

        window.alert(
            "Unable to send your message to the Trips Wonder team. Please try again."
        );

    } finally {
        if (memberChatInput) {
            memberChatInput.disabled = false;
        }

        if (memberChatSend) {
            memberChatSend.disabled = false;
        }

        memberChatInput?.focus();
    }
}


/* ==========================================================
   MARK SUPPORT AS READ
   ========================================================== */

async function markTripsWonderHumanMessagesRead() {
    if (
        !state.conversationId ||
        !state.user
    ) {
        return;
    }

    try {
        await setDoc(
            doc(
                db,
                "conversations",
                state.conversationId
            ),
            {
                unreadCustomer: 0,
                customerLastReadAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );

    } catch (error) {
        console.warn(
            "TRIPS WONDER SUPPORT READ ERROR:",
            error
        );
    }
}


/* ==========================================================
   WRITE AN ONLINE-SUPPORT REPLY TO THE SAME THREAD
   ========================================================== */

async function writeTripsWonderOnlineReply(reply) {
    if (
        !reply ||
        !state.conversationId
    ) {
        return;
    }

    const conversationRef =
        doc(
            db,
            "conversations",
            state.conversationId
        );

    const latestSnap =
        await getDoc(conversationRef);

    const latest =
        latestSnap.exists()
            ? latestSnap.data()
            : {};

    /*
     * If an admin took over while the callable was running,
     * do not post an automated reply.
     */
    if (
        normalizeTripsWonderSupportMode(latest) === "human"
    ) {
        return;
    }

    await addDoc(
        collection(
            db,
            "conversations",
            state.conversationId,
            "messages"
        ),
        {
            senderRole:
                "support",
            senderName:
                AUTOMATED_SUPPORT_LABEL,
            text:
                reply,
            createdAt:
                serverTimestamp()
        }
    );

    await setDoc(
        conversationRef,
        {
            lastMessage:
                reply,
            lastMessageAt:
                serverTimestamp(),
            lastSenderRole:
                "support",
            unreadCustomer:
                Number(
                    latest.unreadCustomer || 0
                ) + 1,
            supportMode:
                "online",
            supportStatus:
                "active",
            updatedAt:
                serverTimestamp()
        },
        {
            merge: true
        }
    );
}


/* ==========================================================
   SEND MESSAGE TO ONLINE SUPPORT
   Customer question and support reply both persist in Firestore.
   ========================================================== */

async function submitTripsWonderSupportMessage(text) {
    const cleanText =
        String(text || "").trim();

    if (!cleanText || !state.user) return;

    supportNeedsHumanHandoff = false;

    if (memberChatInput) {
        memberChatInput.disabled = true;
    }

    if (memberChatSend) {
        memberChatSend.disabled = true;
    }

    let typing = null;

    try {
        const writeResult =
            await writeTripsWonderCustomerMessage(
                cleanText,
                false
            );

        /*
         * Human mode may have changed between UI render
         * and the actual send.
         */
        if (writeResult?.humanMode) {
            supportHumanMode = true;
            renderTripsWonderSupportList();
            openTripsWonderSupportConversation();
            return;
        }

        typing =
            document.createElement("div");

        typing.className =
            "tw-support-typing";

        typing.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;

        memberChatMessages?.appendChild(typing);
        scrollTripsWonderSupportToBottom();

        const response =
            await askTripsWonderSupportCallable({
                message: cleanText
            });

        const reply =
            String(
                response?.data?.reply || ""
            ).trim();

        if (!reply) {
            throw new Error(
                "Trips Wonder Support returned an empty reply."
            );
        }

        await writeTripsWonderOnlineReply(reply);

        supportNeedsHumanHandoff = false;

    } catch (error) {
        console.error(
            "TRIPS WONDER SUPPORT ERROR:",
            error
        );

        /*
         * Keep the customer's message in Firestore.
         * The temporary failure text is UI-only so it does not
         * pollute the official support history.
         */
        supportNeedsHumanHandoff = true;

    } finally {
        typing?.remove();

        renderTripsWonderUnifiedMessages();

        if (memberChatInput) {
            memberChatInput.disabled = false;
        }

        if (memberChatSend) {
            memberChatSend.disabled = false;
        }

        memberChatInput?.focus();
        scrollTripsWonderSupportToBottom();
    }
}


/* ==========================================================
   SUPPORT SCROLL HELPER
   ========================================================== */

function scrollTripsWonderSupportToBottom() {
    requestAnimationFrame(() => {
        if (memberChatMessages) {
            memberChatMessages.scrollTop =
                memberChatMessages.scrollHeight;
        }
    });
}


/* ==========================================================
   SUPPORT COMPOSER
   ========================================================== */

memberChatForm?.addEventListener(
    "submit",
    event => {
        if (activeMemberTab !== "support") {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        const text =
            String(
                memberChatInput?.value || ""
            ).trim();

        if (!text) return;

        if (memberChatInput) {
            memberChatInput.value = "";
            memberChatInput.style.height = "auto";
        }

        if (supportHumanMode) {
            sendTripsWonderHumanMessage(text);
            return;
        }

        submitTripsWonderSupportMessage(text);
    },
    true
);


function startMemberMessenger() {
    subscribeMemberConversations();
}


/* ==========================================================
   FULL PAGE ROUTING
   Message icon = message.html
   Notification bell = message.html#notifications
   ========================================================== */

const memberMessagesPage =
    document.getElementById("memberMessagesPage");

const memberNotificationsPage =
    document.getElementById("memberNotificationsPage");

const memberInfoAvatar =
    document.getElementById("memberInfoAvatar");

const memberInfoName =
    document.getElementById("memberInfoName");

const memberInfoStatus =
    document.getElementById("memberInfoStatus");


function syncMessageRoute() {

    const notificationsOpen =
        String(
            window.location.hash || ""
        ).toLowerCase() ===
        "#notifications";


    if (memberMessagesPage) {
        memberMessagesPage.hidden =
            notificationsOpen;
    }


    if (memberNotificationsPage) {
        memberNotificationsPage.hidden =
            !notificationsOpen;
    }


    if (notificationsOpen) {

        closeMobileNotificationDetail();

        renderNotifications();

    }
}


window.addEventListener(
    "hashchange",
    syncMessageRoute
);


function syncSelectedMemberInfo() {

    if (memberInfoName) {

        memberInfoName.textContent =
            memberChatName?.textContent ||
            "Select a conversation";
    }


    if (memberInfoStatus) {

        memberInfoStatus.textContent =
            memberChatStatus?.textContent ||
            "Trips Wonder member";
    }


    if (
        memberInfoAvatar &&
        memberChatAvatar
    ) {

        memberInfoAvatar.innerHTML =
            memberChatAvatar.innerHTML;
    }
}


[
    memberChatName,
    memberChatStatus,
    memberChatAvatar

]
.filter(Boolean)
.forEach(
    element => {

        new MutationObserver(
            syncSelectedMemberInfo
        )
        .observe(
            element,
            {
                childList: true,
                subtree: true,
                characterData: true
            }
        );

    }
);


syncSelectedMemberInfo();


/* Keep desktop chat list visible after returning from a mobile chat. */
window.addEventListener(
    "resize",
    () => {

        if (
            window.matchMedia(
                "(min-width: 900px)"
            ).matches &&
            memberMessengerInbox
        ) {

            memberMessengerInbox.hidden =
                false;

        }

    }
);



/* Shared header Message icon behavior on the Message page. */
document.addEventListener(
    "click",
    event => {

        const messageLink =
            event.target.closest(
                '.customer-shared-action[href="message.html"]'
            );

        if (!messageLink) {
            return;
        }

        if (
            window.location.pathname
                .toLowerCase()
                .endsWith("/message.html")
        ) {

            event.preventDefault();

            if (
                window.location.hash
                    .toLowerCase() ===
                "#notifications"
            ) {

                history.pushState(
                    null,
                    "",
                    "message.html"
                );

                syncMessageRoute();
            }
        }
    }
);