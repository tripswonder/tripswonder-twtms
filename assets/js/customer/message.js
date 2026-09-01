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
    subscribeSupportProfile();

    try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        state.profile = userSnap.exists() ? userSnap.data() : {};
        state.conversationId = await ensureConversation();
        subscribeConversation();
        subscribeMessages();
        subscribeNotifications();
    } catch (error) {
        console.error("Customer Message Center initialization error:", error);
        if (stream) stream.innerHTML = loadingState("Unable to open Message Center.");
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
