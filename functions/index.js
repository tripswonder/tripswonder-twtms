const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {defineSecret} = require("firebase-functions/params");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");
const crypto = require("crypto");
const OpenAI = require("openai");

// ======================================================
// INITIALIZE FIREBASE ADMIN
// ======================================================

initializeApp();

const auth = getAuth();
const db = getFirestore();

const resendApiKey = defineSecret("RESEND_API_KEY");
const openaiApiKey = defineSecret("OPENAI_API_KEY");

async function getSupportPersonaSettings() {
  try {
    const settingsDoc = await db
        .collection("systemSettings")
        .doc("general")
        .get();

    const settings = settingsDoc.exists ?
      settingsDoc.data() :
      {};

    const persona =
      settings.supportPersona &&
      typeof settings.supportPersona === "object" ?
        settings.supportPersona :
        {};

    return {
      name:
        String(persona.name || "Spark").trim() ||
        "Spark",
      title:
        String(
            persona.title ||
            "Trips Wonder Support",
        ).trim() ||
        "Trips Wonder Support",
      meaning:
        String(
            persona.meaning ||
            "Support for Planning Adventures, Reservations & Knowledge",
        ).trim() ||
        "Support for Planning Adventures, Reservations & Knowledge",
    };
  } catch (error) {
    console.warn(
        "Unable to load support persona settings:",
        error,
    );

    return {
      name: "Spark",
      title: "Trips Wonder Support",
      meaning:
        "Support for Planning Adventures, Reservations & Knowledge",
    };
  }
}

// ======================================================
// VERIFY USER ACCESS
// ======================================================

/**
 * Verifies that the current user is logged in and has
 * the required role/permission.
 *
 * OWNER:
 * - Full control
 *
 * ADMIN:
 * - Access only when the requested permission is enabled
 *
 * @param {object} request Firebase callable request
 * @param {string|null} permission Required task permission
 * @return {Promise<object>}
 */
async function verifyAccess(
    request,
    permission = null,
) {
  // User must be logged in
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "You must be logged in.",
    );
  }

  const uid = request.auth.uid;

  // Get user profile from Firestore
  const userDoc = await db
      .collection("users")
      .doc(uid)
      .get();

  if (!userDoc.exists) {
    throw new HttpsError(
        "permission-denied",
        "User profile not found.",
    );
  }

  const userData = userDoc.data();

  // Account must be active
  if (
    userData.status &&
    userData.status !== "active"
  ) {
    throw new HttpsError(
        "permission-denied",
        "Your account is inactive.",
    );
  }

  const role =
    userData.role || "client";

  // OWNER = FULL CONTROL
  if (role === "owner") {
    return {
      uid,
      userData,
    };
  }

  // ADMIN = PERMISSION BASED
  if (role === "admin") {
    if (!permission) {
      return {
        uid,
        userData,
      };
    }

    const permissions =
      userData.permissions || {};

    if (
      permissions[permission] !== true
    ) {
      throw new HttpsError(
          "permission-denied",
          `You do not have access to ${permission}.`,
      );
    }

    return {
      uid,
      userData,
    };
  }

  throw new HttpsError(
      "permission-denied",
      "Admin access required.",
  );
}

// ======================================================
// VERIFY OWNER
// ======================================================

/**
 * Only OWNER can create/manage admin accounts.
 *
 * @param {object} request Firebase callable request
 * @return {Promise<object>}
 */
async function verifyOwner(request) {
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "You must be logged in.",
    );
  }

  const uid = request.auth.uid;

  const userDoc = await db
      .collection("users")
      .doc(uid)
      .get();

  if (!userDoc.exists) {
    throw new HttpsError(
        "permission-denied",
        "User profile not found.",
    );
  }

  const userData =
    userDoc.data();

  if (userData.role !== "owner") {
    throw new HttpsError(
        "permission-denied",
        "Only the Owner can manage admin accounts.",
    );
  }

  if (
    userData.status &&
    userData.status !== "active"
  ) {
    throw new HttpsError(
        "permission-denied",
        "Owner account is inactive.",
    );
  }

  return {
    uid,
    userData,
  };
}

// ======================================================
// CREATE ADMIN ACCOUNT
// ======================================================

/**
 * Creates a Firebase Authentication account
 * and Firestore profile for an ADMIN.
 *
 * IMPORTANT:
 * This uses Firebase Admin SDK.
 *
 * Creating the new user this way does NOT replace
 * the Owner's currently authenticated session.
 */
exports.createAdminAccount = onCall(
    async (request) => {
    // ==================================================
      // ONLY OWNER CAN CREATE ADMIN
      // ==================================================

      const owner =
      await verifyOwner(request);

      // ==================================================
      // GET REQUEST DATA
      // ==================================================

      const {
        name,
        email,
        password,
        permissions,
      } = request.data || {};

      // ==================================================
      // VALIDATION
      // ==================================================

      if (
        !name ||
      !email ||
      !password
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Name, email and password are required.",
        );
      }

      const cleanName =
      String(name).trim();

      const cleanEmail =
      String(email)
          .trim()
          .toLowerCase();

      const cleanPassword =
      String(password);

      // ==================================================
      // VALIDATE NAME
      // ==================================================

      if (cleanName.length < 2) {
        throw new HttpsError(
            "invalid-argument",
            "Admin name is too short.",
        );
      }

      // ==================================================
      // VALIDATE PASSWORD
      // ==================================================

      if (cleanPassword.length < 6) {
        throw new HttpsError(
            "invalid-argument",
            "Password must be at least 6 characters.",
        );
      }

      // ==================================================
      // VALIDATE EMAIL
      // ==================================================

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            cleanEmail,
        )
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Please enter a valid email address.",
        );
      }

      // ==================================================
      // ALLOWED TASK PERMISSIONS
      // ==================================================

      const allowedPermissions = [
        "dashboard",
        "bookings",
        "customers",
        "packages",
        "payments",
        "invoices",
        "resortBookings",
        "reports",
      ];

      // ==================================================
      // NORMALIZE PERMISSIONS
      // ==================================================

      const submittedPermissions =
      permissions &&
      typeof permissions === "object" ?
        permissions :
        {};

      const cleanPermissions = {};

      for (
        const permission of allowedPermissions
      ) {
        cleanPermissions[permission] =
        submittedPermissions[permission] === true;
      }

      // ==================================================
      // AT LEAST ONE ACCESS REQUIRED
      // ==================================================

      const hasPermission =
      Object.values(
          cleanPermissions,
      ).some(
          (value) => value === true,
      );

      if (!hasPermission) {
        throw new HttpsError(
            "invalid-argument",
            "At least one task access permission is required.",
        );
      }

      // ==================================================
      // SPLIT ADMIN NAME
      // ==================================================

      const nameParts =
      cleanName.split(/\s+/);

      const firstName =
      nameParts.shift() ||
      cleanName;

      const lastName =
      nameParts.join(" ");

      // ==================================================
      // CREATE USER VARIABLE
      // ==================================================

      let newUser = null;

      try {
        // ==================================================
        // CREATE FIREBASE AUTHENTICATION ACCOUNT
        // ==================================================

        newUser =
      await auth.createUser({
        email: cleanEmail,
        password: cleanPassword,
        displayName: cleanName,
      });

        // ==================================================
        // CREATE FIRESTORE USER PROFILE
        // ==================================================

        await db
            .collection("users")
            .doc(newUser.uid)
            .set({
              uid: newUser.uid,

              email: cleanEmail,

              firstName,

              lastName,

              role: "admin",

              status: "active",

              permissions:
          cleanPermissions,

              createdAt: new Date(),

              createdBy:
          owner.uid,
            });

        // ==================================================
        // SUCCESS
        // ==================================================

        console.log(
            "Admin account created:",
            newUser.uid,
            "by owner:",
            owner.uid,
        );

        return {
          success: true,

          uid:
        newUser.uid,

          email:
        cleanEmail,

          name:
        cleanName,

          role:
        "admin",

          permissions:
        cleanPermissions,

          message:
        "Admin account created successfully.",
        };
      } catch (error) {
        // ==================================================
        // LOG CREATE ERROR
        // ==================================================

        console.error(
            "Create admin account error:",
            error,
        );

        // ==================================================
        // CLEANUP AUTH ACCOUNT
        //
        // If Firebase Authentication account was created
        // but Firestore profile failed, remove the Auth
        // account so we don't leave an incomplete account.
        // ==================================================

        if (newUser) {
          try {
            await auth.deleteUser(
                newUser.uid,
            );
          } catch (cleanupError) {
            console.error(
                "Admin account cleanup error:",
                cleanupError,
            );
          }
        }

        // ==================================================
        // DUPLICATE EMAIL
        // ==================================================

        if (
          error.code ===
      "auth/email-already-exists"
        ) {
          throw new HttpsError(
              "already-exists",
              "An account with this email already exists.",
          );
        }

        // ==================================================
        // GENERAL ERROR
        // ==================================================

        throw new HttpsError(
            "internal",
            "Unable to create admin account.",
        );
      }
    },

);

// ======================================================
// UPDATE ADMIN ACCOUNT
// ======================================================
//
// OWNER ONLY
//
// Updates:
//
// - First name
// - Last name
// - Contact number
// - Account status
// - Module permissions
// - Firebase Auth display name
//
// IMPORTANT:
//
// Email is intentionally NOT changed here.
// Password is intentionally NOT changed here.
//
// Those should use separate secure actions later.
//
// ======================================================

exports.updateAdminAccount = onCall(
    async (request) => {
      // ==================================================
      // OWNER ONLY
      // ==================================================

      const owner =
        await verifyOwner(request);

      // ==================================================
      // REQUEST DATA
      // ==================================================

      const {
        uid,
        firstName,
        lastName,
        phone,
        status,
        permissions,
      } = request.data || {};

      // ==================================================
      // REQUIRED UID
      // ==================================================

      if (!uid) {
        throw new HttpsError(
            "invalid-argument",
            "Administrator UID is required.",
        );
      }

      const cleanUid =
        String(uid).trim();

      // ==================================================
      // PREVENT OWNER SELF-EDIT THROUGH PAGE ACCESS
      // ==================================================

      if (cleanUid === owner.uid) {
        throw new HttpsError(
            "permission-denied",
            "The Owner account cannot be managed through Page Access.",
        );
      }

      // ==================================================
      // LOAD TARGET USER
      // ==================================================

      const adminRef =
        db
            .collection("users")
            .doc(cleanUid);

      const adminDoc =
        await adminRef.get();

      if (!adminDoc.exists) {
        throw new HttpsError(
            "not-found",
            "Administrator account was not found.",
        );
      }

      const existingAdmin =
        adminDoc.data();

      // ==================================================
      // TARGET MUST BE ADMIN
      // ==================================================

      if (
        String(
            existingAdmin.role || "",
        ).toLowerCase() !== "admin"
      ) {
        throw new HttpsError(
            "permission-denied",
            "Only administrator accounts can be managed here.",
        );
      }

      // ==================================================
      // CLEAN NAME
      // ==================================================

      const cleanFirstName =
        String(firstName || "").trim();

      const cleanLastName =
        String(lastName || "").trim();

      if (!cleanFirstName) {
        throw new HttpsError(
            "invalid-argument",
            "First name is required.",
        );
      }

      if (!cleanLastName) {
        throw new HttpsError(
            "invalid-argument",
            "Last name is required.",
        );
      }

      // ==================================================
      // CLEAN PHONE
      // ==================================================

      const cleanPhone =
        phone ?
          String(phone).trim() :
          "";

      // ==================================================
      // VALIDATE STATUS
      // ==================================================

      const cleanStatus =
        String(
            status || "active",
        )
            .trim()
            .toLowerCase();

      const allowedStatuses = [
        "active",
        "inactive",
      ];

      if (
        !allowedStatuses.includes(
            cleanStatus,
        )
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Invalid administrator account status.",
        );
      }

      // ==================================================
      // ALLOWED ADMIN MODULES
      // ==================================================
      //
      // OWNER-ONLY modules are intentionally excluded:
      //
      // page-access
      // page-setup
      // legal-policies
      // system-settings
      //
      // ==================================================

      const allowedPermissions = [
        "dashboard",
        "bookings",
        "customers",
        "packages",
        "payments",
        "invoices",
        "resortBookings",
        "reports",
      ];

      // ==================================================
      // NORMALIZE PERMISSIONS
      // ==================================================

      const submittedPermissions =
        permissions &&
        typeof permissions === "object" ?
          permissions :
          {};

      const cleanPermissions = {};

      for (
        const permission of allowedPermissions
      ) {
        cleanPermissions[permission] =
          submittedPermissions[permission] === true;
      }

      // ==================================================
      // REQUIRE AT LEAST ONE MODULE
      // ==================================================

      const hasPermission =
        Object.values(
            cleanPermissions,
        ).some(
            (value) => value === true,
        );

      if (!hasPermission) {
        throw new HttpsError(
            "invalid-argument",
            "At least one module access permission is required.",
        );
      }

      // ==================================================
      // DISPLAY NAME
      // ==================================================

      const displayName =
        `${cleanFirstName} ${cleanLastName}`
            .trim();

      try {
        // ==================================================
        // VERIFY AUTH ACCOUNT EXISTS
        // ==================================================

        await auth.getUser(
            cleanUid,
        );

        // ==================================================
        // UPDATE FIREBASE AUTH
        // ==================================================

        await auth.updateUser(
            cleanUid,
            {
              displayName,
              disabled:
                cleanStatus === "inactive",
            },
        );

        // ==================================================
        // UPDATE FIRESTORE PROFILE
        // ==================================================

        await adminRef.update({

          firstName:
            cleanFirstName,

          lastName:
            cleanLastName,

          phone:
            cleanPhone,

          status:
            cleanStatus,

          role:
            "admin",

          permissions:
            cleanPermissions,

          updatedAt:
            new Date(),

          updatedBy:
            owner.uid,

        });

        // ==================================================
        // SUCCESS
        // ==================================================

        console.log(
            "Admin account updated:",
            cleanUid,
            "by owner:",
            owner.uid,
        );

        return {

          success:
            true,

          uid:
            cleanUid,

          firstName:
            cleanFirstName,

          lastName:
            cleanLastName,

          status:
            cleanStatus,

          permissions:
            cleanPermissions,

          message:
            "Administrator account updated successfully.",

        };
      } catch (error) {
        console.error(
            "Update admin account error:",
            error,
        );

        // ==================================================
        // AUTH USER NOT FOUND
        // ==================================================

        if (
          error.code ===
          "auth/user-not-found"
        ) {
          throw new HttpsError(
              "not-found",
              "Firebase Authentication account was not found.",
          );
        }

        // ==================================================
        // PRESERVE HTTPS ERRORS
        // ==================================================

        if (
          error instanceof HttpsError
        ) {
          throw error;
        }

        // ==================================================
        // GENERAL ERROR
        // ==================================================

        throw new HttpsError(
            "internal",
            "Unable to update administrator account.",
        );
      }
    },
);

// ======================================================
// CREATE CLIENT ACCOUNT
// ======================================================

exports.createClientAccount = onCall(
    async (request) => {
    // ==================================================
      // VERIFY ACCESS
      //
      // OWNER:
      // Full control
      //
      // ADMIN:
      // Requires Customers permission
      // ==================================================

      await verifyAccess(
          request,
          "customers",
      );

      // ==================================================
      // GET REQUEST DATA
      // ==================================================

      const {
        email,
        password,
        firstName,
        lastName,
        phone,
      } = request.data || {};

      // ==================================================
      // VALIDATION
      // ==================================================

      if (
        !email ||
      !password ||
      !firstName ||
      !lastName
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Email, password, first name and last name are required.",
        );
      }

      // ==================================================
      // CLEAN DATA
      // ==================================================

      const cleanEmail =
      String(email)
          .trim()
          .toLowerCase();

      const cleanPassword =
      String(password);

      const cleanFirstName =
      String(firstName).trim();

      const cleanLastName =
      String(lastName).trim();

      const cleanPhone =
      phone ?
        String(phone).trim() :
        "";

      // ==================================================
      // PASSWORD VALIDATION
      // ==================================================

      if (cleanPassword.length < 6) {
        throw new HttpsError(
            "invalid-argument",
            "Password must be at least 6 characters.",
        );
      }

      // ==================================================
      // CREATE USER VARIABLE
      // ==================================================

      let newUser = null;

      try {
      // ================================================
        // CREATE FIREBASE AUTH ACCOUNT
        // ================================================

        newUser =
        await auth.createUser({
          email: cleanEmail,

          password:
            cleanPassword,

          displayName:
            `${cleanFirstName} ${cleanLastName}`,
        });

        // ================================================
        // CREATE FIRESTORE USER PROFILE
        // ================================================

        await db
            .collection("users")
            .doc(newUser.uid)
            .set({

              uid:
            newUser.uid,

              email:
            cleanEmail,

              firstName:
            cleanFirstName,

              lastName:
            cleanLastName,

              phone:
            cleanPhone,

              role:
            "client",

              status:
            "active",

              createdAt:
            new Date(),

              createdBy:
            request.auth.uid,

            });

        // ================================================
        // SUCCESS
        // ================================================

        console.log(
            "Client account created:",
            newUser.uid,
            "by:",
            request.auth.uid,
        );

        return {

          success:
          true,

          uid:
          newUser.uid,

          message:
          "Client account created successfully.",

        };
      } catch (error) {
      // ================================================
        // LOG ERROR
        // ================================================

        console.error(
            "Create client account error:",
            error,
        );

        // ================================================
        // CLEANUP AUTH ACCOUNT
        //
        // Prevent incomplete accounts if Firestore
        // profile creation fails.
        // ================================================

        if (newUser) {
          try {
            await auth.deleteUser(
                newUser.uid,
            );
          } catch (cleanupError) {
            console.error(
                "Client account cleanup error:",
                cleanupError,
            );
          }
        }

        // ================================================
        // DUPLICATE EMAIL
        // ================================================

        if (
          error.code ===
        "auth/email-already-exists"
        ) {
          throw new HttpsError(
              "already-exists",
              "An account with this email already exists.",
          );
        }

        // ================================================
        // GENERAL ERROR
        // ================================================

        throw new HttpsError(
            "internal",
            "Unable to create client account.",
        );
      }
    },
);

// ======================================================
// SEND PAYMENT RECEIPT
// ======================================================

exports.sendPaymentReceipt = onCall(
    {
      secrets: [resendApiKey],
    },
    async (request) => {
      await verifyAccess(
          request,
          "payments",
      );

      const {
        paymentId,
        recipient,
        message,
      } = request.data || {};

      const cleanPaymentId =
        String(paymentId || "").trim();

      const cleanRecipient =
        String(recipient || "")
            .trim()
            .toLowerCase();

      const cleanMessage =
        String(message || "").trim();

      if (!cleanPaymentId) {
        throw new HttpsError(
            "invalid-argument",
            "Payment ID is required.",
        );
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            cleanRecipient,
        )
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Please enter a valid recipient email.",
        );
      }

      const paymentDoc =
        await db
            .collection("payments")
            .doc(cleanPaymentId)
            .get();

      if (!paymentDoc.exists) {
        throw new HttpsError(
            "not-found",
            "Payment record not found.",
        );
      }

      const payment =
        paymentDoc.data();

      let booking = {};

      if (payment.bookingId) {
        const bookingDoc =
          await db
              .collection("bookings")
              .doc(payment.bookingId)
              .get();

        if (bookingDoc.exists) {
          booking = bookingDoc.data();
        }
      }

      let packageData = {};

      const packageId =
        payment.packageId ||
        payment.tourPackageId ||
        booking.packageId ||
        booking.tourPackageId ||
        "";

      if (packageId) {
        const packageDoc =
          await db
              .collection("packages")
              .doc(String(packageId))
              .get();

        if (packageDoc.exists) {
          packageData = packageDoc.data();
        }
      }

      let bookingPayments = [
        {
          id: paymentDoc.id,
          ...payment,
        },
      ];

      if (payment.bookingId) {
        const paymentsSnapshot =
          await db
              .collection("payments")
              .where(
                  "bookingId",
                  "==",
                  payment.bookingId,
              )
              .get();

        bookingPayments =
          paymentsSnapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),
              }),
          );
      }

      const validBookingPayments =
        bookingPayments.filter(
            (item) => {
              const status =
                String(item.status || "")
                    .trim()
                    .toLowerCase();

              return (
                status !== "void" &&
                status !== "cancelled" &&
                status !== "canceled" &&
                status !== "refunded"
              );
            },
        );

      const currentPayment =
        Number(payment.amount || 0);

      const totalPaid =
        validBookingPayments.reduce(
            (total, item) =>
              total +
              Number(item.amount || 0),
            0,
        );

      const bookingTotal =
        Number(
            booking.totalAmount ||
            booking.total ||
            0,
        );

      const remainingBalance =
        Math.max(
            bookingTotal - totalPaid,
            0,
        );

      const customerName =
        payment.customerName ||
        booking.customerName ||
        "Guest";

      const paymentReference =
        payment.paymentReference ||
        "—";

      const bookingReference =
        payment.bookingReference ||
        booking.bookingReference ||
        "—";

      const packageName =
        payment.packageName ||
        booking.packageName ||
        booking.destination ||
        "—";

      const travelDate =
        booking.travelDate ||
        booking.tourDate ||
        booking.departureDate ||
        "";

      const travelEndDate =
        booking.travelEndDate ||
        booking.tourEndDate ||
        booking.returnDate ||
        booking.endDate ||
        "";

      const packageDuration =
        booking.duration ||
        booking.packageDuration ||
        booking.tourDuration ||
        booking.numberOfDays ||
        packageData.duration ||
        packageData.packageDuration ||
        packageData.tourDuration ||
        packageData.numberOfDays ||
        packageName;

      const guestCount =
        booking.numberOfGuests ||
        booking.guestCount ||
        booking.pax ||
        booking.numberOfPax ||
        "—";

      const formatMoney = (value) =>
        Number(value || 0).toLocaleString(
            "en-PH",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
        );

      const formatReceiptDate = (value) => {
        if (!value) {
          return "—";
        }

        let dateValue = value;

        if (
          value &&
          typeof value.toDate === "function"
        ) {
          dateValue = value.toDate();
        } else {
          dateValue = new Date(value);
        }

        if (
          !(dateValue instanceof Date) ||
          Number.isNaN(dateValue.getTime())
        ) {
          return String(value);
        }

        return dateValue.toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            },
        );
      };

      const getDateValue = (value) => {
        if (!value) {
          return null;
        }

        let dateValue;

        if (typeof value.toDate === "function") {
          dateValue = value.toDate();
        } else if (
          typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {
          dateValue = new Date(`${value}T00:00:00Z`);
        } else {
          dateValue = new Date(value);
        }

        if (Number.isNaN(dateValue.getTime())) {
          return null;
        }

        return dateValue;
      };

      const getDurationDays = (value) => {
        if (typeof value === "number") {
          return Math.max(Math.round(value), 1);
        }

        const durationText =
          String(value || "").trim();

        const durationMatch =
          durationText.match(/(\d+)\s*(?:d|day)/i);

        if (durationMatch) {
          return Math.max(Number(durationMatch[1]), 1);
        }

        if (/^\d+$/.test(durationText)) {
          return Math.max(Number(durationText), 1);
        }

        return 1;
      };

      const formatTravelDateRange = (
          startValue,
          endValue,
          durationValue,
      ) => {
        const startDate = getDateValue(startValue);

        if (!startDate) {
          return formatReceiptDate(startValue);
        }

        let endDate = getDateValue(endValue);

        if (!endDate) {
          const durationDays =
            getDurationDays(durationValue);

          endDate = new Date(startDate.getTime());
          endDate.setUTCDate(
              endDate.getUTCDate() +
              durationDays - 1,
          );
        }

        const startMonth = startDate.toLocaleDateString(
            "en-US",
            {month: "short", timeZone: "UTC"},
        );

        const endMonth = endDate.toLocaleDateString(
            "en-US",
            {month: "short", timeZone: "UTC"},
        );

        const startDay = startDate.getUTCDate();
        const endDay = endDate.getUTCDate();
        const startYear = startDate.getUTCFullYear();
        const endYear = endDate.getUTCFullYear();

        if (
          startYear === endYear &&
          startMonth === endMonth
        ) {
          return `${startMonth} ${startDay}–${endDay}, ` +
            `${startYear}`;
        }

        if (startYear === endYear) {
          return `${startMonth} ${startDay}–` +
            `${endMonth} ${endDay}, ${startYear}`;
        }

        return `${startMonth} ${startDay}, ${startYear}–` +
          `${endMonth} ${endDay}, ${endYear}`;
      };

      const travelDateLabel =
        formatTravelDateRange(
            travelDate,
            travelEndDate,
            packageDuration,
        );

      const safe = (value) =>
        String(
            value === null ||
            value === undefined ?
              "" :
              value,
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

      const emailHtml = `
        <div style="
          margin:0;
          padding:24px 12px;
          background:#f5f7fa;
          font-family:Arial,Helvetica,sans-serif;
          color:#111827;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
          ">
            <div style="
              padding:25px 30px;
              background:#1769b0;
              color:#ffffff;
            ">
              <div style="
                font-size:25px;
                font-weight:800;
              ">
                Trips Wonder
              </div>

              <div style="
                margin-top:4px;
                font-size:13px;
                opacity:.9;
              ">
                Travel and Tours
              </div>
            </div>

            <div style="
              padding:36px 30px 30px;
              font-size:16px;
              line-height:1.55;
            ">
              <p style="margin:0 0 26px;">
                Dear ${safe(customerName)},
              </p>

              <p style="margin:0 0 26px;">
                ${
                  cleanMessage ?
                    safe(cleanMessage) :
                    "We have received your payment " +
                    "for your upcoming trip."
}
              </p>

              <table
                role="presentation"
                style="
                  width:100%;
                  border-collapse:collapse;
                  font-size:15px;
                  line-height:1.45;
                "
              >
                <tr>
                  <td style="padding:3px 12px 3px 0;">
                    Payment date:
                  </td>
                  <td style="
                    padding:3px 0;
                    font-weight:600;
                  ">
                    ${safe(
      formatReceiptDate(
          payment.paymentDate,
      ),
  )}
                  </td>
                </tr>

                <tr>
                  <td style="padding:3px 12px 3px 0;">
                    Booking Reference:
                  </td>
                  <td style="
                    padding:3px 0;
                    font-weight:600;
                  ">
                    ${safe(bookingReference)}
                  </td>
                </tr>

                <tr>
                  <td style="padding:3px 12px 3px 0;">
                    Package:
                  </td>
                  <td style="
                    padding:3px 0;
                    font-weight:600;
                  ">
                    ${safe(packageName)}
                  </td>
                </tr>

                <tr>
                  <td style="padding:3px 12px 3px 0;">
                    Travel date:
                  </td>
                  <td style="
                    padding:3px 0;
                    font-weight:600;
                  ">
                    ${safe(travelDateLabel)}
                  </td>
                </tr>

                <tr>
                  <td style="padding:3px 12px 3px 0;">
                    No. of guests:
                  </td>
                  <td style="
                    padding:3px 0;
                    font-weight:600;
                  ">
                    ${safe(guestCount)}
                  </td>
                </tr>

                <tr>
                  <td style="padding:3px 12px 3px 0;">
                    Booking total:
                  </td>
                  <td style="
                    padding:3px 0;
                    font-weight:600;
                  ">
                    PHP ${formatMoney(bookingTotal)}
                  </td>
                </tr>

                <tr>
                  <td style="padding:3px 12px 3px 0;">
                    Amount received:
                  </td>
                  <td style="
                    padding:3px 0;
                    font-weight:700;
                    color:#1769b0;
                  ">
                    PHP ${formatMoney(currentPayment)}
                  </td>
                </tr>

                <tr>
                  <td style="padding:3px 12px 3px 0;">
                    Total paid:
                  </td>
                  <td style="
                    padding:3px 0;
                    font-weight:600;
                  ">
                    PHP ${formatMoney(totalPaid)}
                  </td>
                </tr>

                <tr>
                  <td style="padding:3px 12px 3px 0;">
                    Remaining balance:
                  </td>
                  <td style="
                    padding:3px 0;
                    font-weight:700;
                    color:${
                      remainingBalance > 0 ?
                        "#dc2626" :
                        "#16a34a"
};
                  ">
                    PHP ${formatMoney(remainingBalance)}
                  </td>
                </tr>

              </table>

              <p style="margin:30px 0 0;">
                Please save this email as reference for
                your booking and payment transaction.
              </p>

              <p style="margin:26px 0 0;">
                We look forward to traveling with you.
              </p>

              <p style="margin:26px 0 0;">
                Yours sincerely,<br>
                <strong>
                  Trips Wonder Travel and Tours
                </strong>
              </p>
            </div>

            <div style="
              margin:0 30px;
              border-top:1px solid #e5e7eb;
            "></div>

            <div style="
              padding:20px 30px 26px;
              color:#9ca3af;
              font-size:11px;
              line-height:1.5;
              text-align:center;
            ">
              This is a system-generated payment receipt.
              Please do not reply to this email.
              <br>
              receipts@tripswonder.tours
            </div>
          </div>
        </div>
      `;

      try {
        const response =
          await fetch(
              "https://api.resend.com/emails",
              {
                method: "POST",

                headers: {
                  "Authorization":
                    `Bearer ${resendApiKey.value()}`,

                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  from:
                    "Trips Wonder Travel and Tours " +
                    "<receipts@tripswonder.tours>",

                  to: [cleanRecipient],

                  subject:
                    `Payment Receipt - ${paymentReference}`,

                  html:
                    emailHtml,
                }),
              },
          );

        const result =
          await response.json();

        if (!response.ok) {
          console.error(
              "Resend API error:",
              result,
          );

          throw new HttpsError(
              "internal",
              result.message ||
              "Unable to send the receipt.",
          );
        }

        await paymentDoc.ref.update({
          receiptSent: true,
          receiptSentTo: cleanRecipient,
          receiptSentAt: new Date(),
          receiptEmailId: result.id || "",
        });

        return {
          success: true,
          message:
            "Payment receipt sent successfully.",
          emailId: result.id || "",
        };
      } catch (error) {
        console.error(
            "Send payment receipt error:",
            error,
        );

        if (error instanceof HttpsError) {
          throw error;
        }

        throw new HttpsError(
            "internal",
            "Unable to send the payment receipt.",
        );
      }
    },
);

// ======================================================
// CUSTOMER BOOKING UPDATE DELIVERY
// ======================================================
//
// Server-side Firestore trigger.
// Delivers booking/payment updates to both:
// 1) notifications/{notificationId}
// 2) conversations/{customerUid}/messages/{messageId}
//
// Deterministic IDs make each event idempotent.
// ======================================================

/**
 * Normalizes a booking or payment status value.
 *
 * @param {*} value Status value to normalize.
 * @return {string} Normalized status value.
 */
function normalizeBookingUpdateStatus(value) {
  return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\\s-]+/g, "_");
}

/**
 * Gets the booking reference used in customer updates.
 *
 * @param {object} booking Booking document data.
 * @param {string} bookingId Firestore booking document ID.
 * @return {string} Booking reference.
 */
function getBookingUpdateReference(booking, bookingId) {
  return String(
      booking.bookingReference ||
      booking.referenceNumber ||
      booking.displayReference ||
      bookingId ||
      "",
  ).trim();
}

/**
 * Gets the destination or package label for a booking.
 *
 * @param {object} booking Booking document data.
 * @return {string} Destination or package label.
 */
function getBookingUpdateDestination(booking) {
  return String(
      booking.packageName ||
      booking.destination ||
      booking.packageLocation ||
      "your trip",
  ).trim();
}

/**
 * Gets the primary travel date stored on a booking.
 *
 * @param {object} booking Booking document data.
 * @return {*} Stored travel date value.
 */
function getBookingUpdateTravelDate(booking) {
  return (
    booking.travelStartDate ||
    booking.travelDate ||
    booking.tourDate ||
    booking.departureDate ||
    ""
  );
}

/**
 * Delivers one booking update to the customer notification and inbox.
 *
 * @param {object} options Delivery options.
 * @return {Promise<void>} Resolves after delivery is complete.
 */
async function deliverCustomerBookingUpdate(options) {
  const bookingId = options.bookingId;
  const booking = options.booking;
  const type = options.type;
  const title = options.title;
  const message = options.message;

  const customerUid = String(
      booking.customerUid || "",
  ).trim();

  if (!customerUid) {
    console.log(
        "CUSTOMER UPDATE SKIPPED - NO customerUid:",
        bookingId,
        type,
    );
    return;
  }

  const bookingReference =
    getBookingUpdateReference(booking, bookingId);

  const destination =
    getBookingUpdateDestination(booking);

  const travelDate =
    getBookingUpdateTravelDate(booking);

  const notificationId =
    type + "__" + bookingId;

  const messageId =
    "system__" + type + "__" + bookingId;

  const notificationRef = db
      .collection("notifications")
      .doc(notificationId);

  const conversationRef = db
      .collection("conversations")
      .doc(customerUid);

  const messageRef = conversationRef
      .collection("messages")
      .doc(messageId);

  await db.runTransaction(async (transaction) => {
    const notificationSnapshot =
      await transaction.get(notificationRef);

    const messageSnapshot =
      await transaction.get(messageRef);

    const conversationSnapshot =
      await transaction.get(conversationRef);

    const notificationExists =
      notificationSnapshot.exists;

    const messageExists =
      messageSnapshot.exists;

    if (notificationExists && messageExists) {
      return;
    }

    const now = new Date();

    if (!notificationExists) {
      transaction.set(notificationRef, {
        customerUid: customerUid,
        type: type,
        title: title,
        message: message,
        isRead: false,
        createdAt: now,
        bookingId: bookingId,
        destination: destination,
        travelDate: travelDate,
        referenceNumber: bookingReference,
        actionUrl:
          "my-trip.html?booking=" +
          encodeURIComponent(bookingId),
        actionLabel: "View My Trip",
        source: "booking_update_trigger",
      });
    }

    if (!messageExists) {
      transaction.set(messageRef, {
        senderUid: "system",
        senderRole: "admin",
        senderName: "Trips Wonder Support",
        text: message,
        createdAt: now,
        isSystem: true,
        systemType: type,
        bookingId: bookingId,
        bookingReference: bookingReference,
      });
    }

    const currentConversation =
      conversationSnapshot.exists ?
        conversationSnapshot.data() :
        {};

    const unreadCustomer =
      Number(currentConversation.unreadCustomer || 0) +
      (messageExists ? 0 : 1);

    const conversationUpdate = {
      customerUid: customerUid,
      customerName:
        booking.customerName ||
        currentConversation.customerName ||
        "Customer",
      customerEmail:
        booking.customerEmail ||
        currentConversation.customerEmail ||
        "",
      customerContact:
        booking.customerContact ||
        booking.contactNumber ||
        currentConversation.customerContact ||
        "",
      type: currentConversation.type || "booking",
      status: currentConversation.status || "open",
      bookingId: bookingId,
      bookingReference: bookingReference,
      travelDateText: travelDate,
      lastMessage: message,
      lastMessageAt: now,
      lastSenderRole: "admin",
      unreadCustomer: unreadCustomer,
      updatedAt: now,
    };

    if (!conversationSnapshot.exists) {
      conversationUpdate.unreadAdmin = 0;
      conversationUpdate.createdAt = now;
    }

    transaction.set(
        conversationRef,
        conversationUpdate,
        {merge: true},
    );
  });

  console.log(
      "CUSTOMER BOOKING UPDATE DELIVERED:",
      type,
      bookingId,
      customerUid,
  );
}

exports.notifyCustomerOnBookingUpdate = onDocumentUpdated(
    "bookings/{bookingId}",
    async (event) => {
      const eventData = event.data;

      if (!eventData) {
        return;
      }

      const beforeSnapshot = eventData.before;
      const afterSnapshot = eventData.after;

      if (!beforeSnapshot || !afterSnapshot) {
        return;
      }

      const before = beforeSnapshot.data() || {};
      const after = afterSnapshot.data() || {};
      const bookingId = event.params.bookingId;

      const beforeBookingStatus =
        normalizeBookingUpdateStatus(
            before.bookingStatus,
        );

      const afterBookingStatus =
        normalizeBookingUpdateStatus(
            after.bookingStatus,
        );

      const beforePaymentStatus =
        normalizeBookingUpdateStatus(
            before.paymentStatus,
        );

      const afterPaymentStatus =
        normalizeBookingUpdateStatus(
            after.paymentStatus,
        );

      const bookingReference =
        getBookingUpdateReference(after, bookingId);

      const destination =
        getBookingUpdateDestination(after);

      const referenceSuffix = bookingReference ?
        " (" + bookingReference + ")" :
        "";

      const paymentBecamePartial =
        afterPaymentStatus === "partial" &&
        beforePaymentStatus !== "partial" &&
        beforePaymentStatus !== "paid";

      const paymentBecamePaid =
        afterPaymentStatus === "paid" &&
        beforePaymentStatus !== "paid";

      const bookingBecameConfirmed =
        beforeBookingStatus !== "confirmed" &&
        afterBookingStatus === "confirmed";

      if (paymentBecamePaid) {
        await deliverCustomerBookingUpdate({
          bookingId: bookingId,
          booking: after,
          type: "payment_completed",
          title: "Payment Completed",
          message:
            "Your payment for " +
            destination +
            referenceSuffix +
            " has been fully paid and verified. " +
            "Thank you for booking with Trips Wonder!",
        });
        return;
      }

      if (paymentBecamePartial) {
        const confirmationText =
          bookingBecameConfirmed ?
            " Your booking is now confirmed." :
            "";

        await deliverCustomerBookingUpdate({
          bookingId: bookingId,
          booking: after,
          type: "payment_confirmed",
          title: "Payment Confirmed",
          message:
            "Your payment for " +
            destination +
            referenceSuffix +
            " has been verified successfully." +
            confirmationText +
            " Thank you for booking with Trips Wonder!",
        });
        return;
      }

      if (bookingBecameConfirmed) {
        await deliverCustomerBookingUpdate({
          bookingId: bookingId,
          booking: after,
          type: "booking_confirmed",
          title: "Booking Confirmed",
          message:
            "Great news! Your booking for " +
            destination +
            referenceSuffix +
            " is now confirmed. You can view your " +
            "trip details in My Trip.",
        });
      }
    },
);

// ======================================================
// EXACT CUSTOMER MEMBER SEARCH
// ======================================================

exports.searchMemberExact = onCall(
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "You must be logged in.",
        );
      }

      const search =
  String(
      (
        request.data &&
        request.data.search
      ) || "",
  )
      .trim()
      .toLowerCase();

      if (
        search.length < 2 ||
        search.length > 120
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Enter a valid username or email.",
        );
      }

      const requesterUid =
        request.auth.uid;

      const requesterDoc =
        await db
            .collection("users")
            .doc(requesterUid)
            .get();

      if (!requesterDoc.exists) {
        throw new HttpsError(
            "permission-denied",
            "Customer profile not found.",
        );
      }

      const requester =
        requesterDoc.data() || {};

      const requesterRole =
        String(
            requester.role || "client",
        )
            .trim()
            .toLowerCase();

      if (
        requesterRole !== "client" &&
        requesterRole !== "customer"
      ) {
        throw new HttpsError(
            "permission-denied",
            "Customer account required.",
        );
      }

      let matchedDoc = null;

      if (search.includes("@")) {
        const snapshot =
          await db
              .collection("users")
              .where(
                  "email",
                  "==",
                  search,
              )
              .limit(5)
              .get();

        matchedDoc =
          snapshot.docs.find(
              (item) =>
                item.id !== requesterUid,
          ) || null;
      } else {
        const fields = [
          "username",
          "displayName",
          "fullName",
          "name",
          "customerName",
        ];

        for (const field of fields) {
          const snapshot =
            await db
                .collection("users")
                .where(
                    field,
                    "==",
                    search,
                )
                .limit(5)
                .get();

          const candidate =
            snapshot.docs.find(
                (item) =>
                  item.id !== requesterUid,
            );

          if (candidate) {
            matchedDoc = candidate;
            break;
          }
        }
      }

      if (!matchedDoc) {
        return {
          member: null,
        };
      }

      const profile =
        matchedDoc.data() || {};

      const role =
        String(
            profile.role || "client",
        )
            .trim()
            .toLowerCase();

      const status =
        String(
            profile.status || "active",
        )
            .trim()
            .toLowerCase();

      if (
        (
          role !== "client" &&
          role !== "customer"
        ) ||
        status !== "active"
      ) {
        return {
          member: null,
        };
      }

      const firstName =
        String(
            profile.firstName ||
            profile.firstname ||
            "",
        ).trim();

      const lastName =
        String(
            profile.lastName ||
            profile.lastname ||
            "",
        ).trim();

      const displayName =
        [firstName, lastName]
            .filter(Boolean)
            .join(" ")
            .trim() ||
        String(
            profile.displayName ||
            profile.fullName ||
            profile.name ||
            profile.customerName ||
            profile.username ||
            "Trips Wonder Member",
        ).trim();

      const avatar =
        String(
            profile.profilePhotoUrl ||
            profile.profilePhoto ||
            profile.photoURL ||
            profile.photoUrl ||
            profile.avatarUrl ||
            profile.avatar ||
            profile.imageUrl ||
            "",
        ).trim();

      return {
        member: {
          uid: matchedDoc.id,
          firstName,
          lastName,
          displayName,
          username:
            String(
                profile.username || "",
            ).trim(),
          email:
            String(
                profile.email || "",
            ).trim(),
          profilePhotoUrl:
            avatar,
          role:
            "client",
        },
      };
    },
);

// ======================================================
// END OF FIREBASE FUNCTIONS
// ======================================================

console.log(
    "TWTMS Firebase Functions loaded successfully.",
);

// ======================================================
// SEND CLIENT EMAIL VERIFICATION
// ======================================================

exports.sendClientVerificationEmail = onCall(
    {
      secrets: [resendApiKey],
    },
    async (request) => {
      // User must be logged in.
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "You must be logged in.",
        );
      }

      const uid = request.auth.uid;

      try {
        // ===============================================
        // GET AUTH USER
        // ===============================================

        const userRecord =
          await auth.getUser(uid);

        const email =
          String(userRecord.email || "")
              .trim()
              .toLowerCase();

        if (!email) {
          throw new HttpsError(
              "failed-precondition",
              "No email address was found for this account.",
          );
        }

        // Already verified.
        if (userRecord.emailVerified) {
          return {
            success: true,
            alreadyVerified: true,
            message: "Email is already verified.",
          };
        }

        // ===============================================
        // GET CUSTOMER NAME
        // ===============================================

        const userDoc =
          await db
              .collection("users")
              .doc(uid)
              .get();

        const userData =
          userDoc.exists ?
            userDoc.data() :
            {};

        const firstName =
          String(
              userData.firstName || "",
          ).trim();

        const customerName =
          firstName ||
          userRecord.displayName ||
          "Traveler";

        // ===============================================
        // GENERATE FIREBASE VERIFICATION LINK
        // ===============================================

        const verificationLink =
          await auth.generateEmailVerificationLink(
              email,
              {
                url:
                  "https://tripswonder.tours/",
                handleCodeInApp:
                  false,
              },
          );

        // ===============================================
        // CREATE TRIPS WONDER VERIFICATION URL
        // ===============================================

        const firebaseVerificationUrl =
  new URL(
      verificationLink,
  );

        const oobCode =
  firebaseVerificationUrl
      .searchParams
      .get("oobCode");

        if (!oobCode) {
          throw new HttpsError(
              "internal",
              "Unable to create verification code.",
          );
        }

        const customVerificationUrl =
  new URL(
      "https://tripswonder.tours/" +
      "pages/customer/verify-email.html",
  );

        customVerificationUrl.searchParams.set(
            "mode",
            "verifyEmail",
        );

        customVerificationUrl.searchParams.set(
            "oobCode",
            oobCode,
        );

        // ===============================================
        // ESCAPE HTML
        // ===============================================

        const safe = (value) =>
          String(value || "")
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");

        // ===============================================
        // EMAIL DESIGN
        // ===============================================

        const emailHtml = `
          <div style="
            margin:0;
            padding:30px 12px;
            background:#f5f7fa;
            font-family:Arial,Helvetica,sans-serif;
            color:#111827;
          ">
            <div style="
              max-width:600px;
              margin:0 auto;
              background:#ffffff;
              border-radius:12px;
              overflow:hidden;
            ">

              <div style="
                padding:28px 30px;
                background:#1769b0;
                color:#ffffff;
                text-align:center;
              ">
                <div style="
                  font-size:26px;
                  font-weight:800;
                ">
                  Trips Wonder
                </div>

                <div style="
                  margin-top:4px;
                  font-size:13px;
                ">
                  Travel and Tours
                </div>
              </div>

              <div style="
                padding:36px 30px;
                font-size:16px;
                line-height:1.6;
              ">

                <p style="margin:0 0 22px;">
                  Hi ${safe(customerName)},
                </p>

                <p style="margin:0 0 22px;">
                  Thank you for creating your
                  Trips Wonder account.
                </p>

                <p style="margin:0 0 28px;">
                  Please verify your email address
                  to activate your account.
                </p>

                <div style="
                  text-align:center;
                  margin:32px 0;
                ">
                  <a
                    href="${safe(customVerificationUrl.toString())}"
                    style="
                      display:inline-block;
                      padding:14px 30px;
                      background:#1769b0;
                      color:#ffffff;
                      text-decoration:none;
                      border-radius:8px;
                      font-weight:700;
                    "
                  >
                    Verify Email
                  </a>
                </div>

                <p style="
                  margin:28px 0 0;
                  font-size:14px;
                  color:#6b7280;
                ">
                  If you did not create this account,
                  you can safely ignore this email.
                </p>

                <p style="margin:28px 0 0;">
                  Regards,<br>
                  <strong>
                    Trips Wonder Travel and Tours
                  </strong>
                </p>

              </div>

              <div style="
                padding:20px 30px;
                border-top:1px solid #e5e7eb;
                color:#9ca3af;
                font-size:11px;
                line-height:1.5;
                text-align:center;
              ">
                This is a system-generated email.
                Please do not reply.
                <br>
                noreply@tripswonder.tours
              </div>

            </div>
          </div>
        `;

        // ===============================================
        // SEND THROUGH RESEND
        // ===============================================

        const response =
          await fetch(
              "https://api.resend.com/emails",
              {
                method: "POST",

                headers: {
                  "Authorization":
                    `Bearer ${resendApiKey.value()}`,

                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  from:
                    "Trips Wonder Travel and Tours " +
                    "<noreply@tripswonder.tours>",

                  to: [email],

                  subject:
                    "Verify Your Email | Trips Wonder",

                  html:
                    emailHtml,
                }),
              },
          );

        const result =
          await response.json();

        if (!response.ok) {
          console.error(
              "Resend verification email error:",
              result,
          );

          throw new HttpsError(
              "internal",
              result.message ||
              "Unable to send verification email.",
          );
        }

        console.log(
            "Verification email sent:",
            uid,
            result.id || "",
        );

        return {
          success: true,
          emailId: result.id || "",
          message:
            "Verification email sent successfully.",
        };
      } catch (error) {
        console.error(
            "Send verification email error:",
            error,
        );

        if (error instanceof HttpsError) {
          throw error;
        }

        throw new HttpsError(
            "internal",
            "Unable to send verification email.",
        );
      }
    },
);

// ======================================================
// POST-BOOKING CUSTOMER ACCOUNT FLOW
// ======================================================
//
// Guest booking flow:
//
// 1. checkBookingAccount
//    - Verifies booking ID + booking email.
//    - Returns whether the email is NEW or EXISTING.
//
// 2. createAccountFromBooking
//    - NEW email only.
//    - Creates Firebase Auth + client profile.
//    - Links the guest booking to the new UID.
//    - Email verification is intentionally NOT required here.
//
// 3. sendBookingConnectEmail
//    - EXISTING account only.
//    - Sends a secure one-time connection link by email.
//
// 4. finalizeBookingConnect
//    - Consumes the one-time token.
//    - Links the guest booking to the existing account.
//
// Existing sendClientVerificationEmail remains available so
// customers can verify their email later from Profile.
// ======================================================

/**
 * Normalizes a customer email address.
 *
 * @param {*} value Raw email value.
 * @return {string} Normalized email.
 */
function normalizeCustomerEmail(value) {
  return String(value || "")
      .trim()
      .toLowerCase();
}

/**
 * Validates an email address.
 *
 * @param {string} email Normalized email.
 * @return {boolean} True when valid.
 */
function isValidCustomerEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Splits the booking customer name into first and last name.
 *
 * @param {*} value Full customer name.
 * @return {{firstName: string, lastName: string}}
 */
function splitBookingCustomerName(value) {
  const cleanName = String(value || "")
      .trim()
      .replace(/\s+/g, " ");

  if (!cleanName) {
    return {
      firstName: "Traveler",
      lastName: "",
    };
  }

  const parts = cleanName.split(" ");

  return {
    firstName: parts.shift() || "Traveler",
    lastName: parts.join(" "),
  };
}

/**
 * Returns a Firebase Auth user by email, or null.
 *
 * @param {string} email Normalized email.
 * @return {Promise<object|null>}
 */
async function getAuthUserByEmailOrNull(email) {
  try {
    return await auth.getUserByEmail(email);
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return null;
    }

    throw error;
  }
}

/**
 * Loads and validates the booking used for an account action.
 *
 * Security:
 * - Requires the real Firestore booking ID.
 * - Requires the submitted booking email to match exactly.
 *
 * @param {*} bookingId Firestore booking document ID.
 * @param {*} email Submitted booking email.
 * @return {Promise<{ref: object, data: object, email: string}>}
 */
async function getBookingForAccountAction(
    bookingId,
    email,
) {
  const cleanBookingId = String(bookingId || "").trim();
  const cleanEmail = normalizeCustomerEmail(email);

  if (!cleanBookingId) {
    throw new HttpsError(
        "invalid-argument",
        "Booking ID is required.",
    );
  }

  if (
    !cleanEmail ||
    !isValidCustomerEmail(cleanEmail)
  ) {
    throw new HttpsError(
        "invalid-argument",
        "A valid booking email is required.",
    );
  }

  const bookingRef = db
      .collection("bookings")
      .doc(cleanBookingId);

  const bookingDoc = await bookingRef.get();

  if (!bookingDoc.exists) {
    throw new HttpsError(
        "not-found",
        "Booking could not be found.",
    );
  }

  const booking = bookingDoc.data() || {};

  const storedEmail =
    normalizeCustomerEmail(
        booking.customerEmail,
    );

  if (
    !storedEmail ||
    storedEmail !== cleanEmail
  ) {
    throw new HttpsError(
        "permission-denied",
        "The booking information does not match.",
    );
  }

  return {
    ref: bookingRef,
    data: booking,
    email: cleanEmail,
  };
}

// ======================================================
// CHECK BOOKING ACCOUNT STATUS
// ======================================================

exports.checkBookingAccount = onCall(
    async (request) => {
      const {
        bookingId,
        email,
      } = request.data || {};

      const bookingResult =
        await getBookingForAccountAction(
            bookingId,
            email,
        );

      const booking =
        bookingResult.data;

      const linkedUid =
        String(
            booking.customerUid || "",
        ).trim();

      if (linkedUid) {
        return {
          success: true,
          mode: "linked",
          message:
            "This booking is already connected to an account.",
        };
      }

      const existingUser =
        await getAuthUserByEmailOrNull(
            bookingResult.email,
        );

      return {
        success: true,
        mode:
          existingUser ?
            "existing" :
            "new",
        bookingReference:
          String(
              booking.bookingReference ||
              booking.bookingNumber ||
              "",
          ).trim(),
        email:
          bookingResult.email,
      };
    },
);

// ======================================================
// CREATE ACCOUNT FROM GUEST BOOKING
// ======================================================

exports.createAccountFromBooking = onCall(
    async (request) => {
      const {
        bookingId,
        email,
        password,
      } = request.data || {};

      const cleanPassword =
        String(password || "");

      if (cleanPassword.length < 6) {
        throw new HttpsError(
            "invalid-argument",
            "Password must be at least 6 characters.",
        );
      }

      const bookingResult =
        await getBookingForAccountAction(
            bookingId,
            email,
        );

      const booking =
        bookingResult.data;

      const alreadyLinkedUid =
        String(
            booking.customerUid || "",
        ).trim();

      if (alreadyLinkedUid) {
        throw new HttpsError(
            "failed-precondition",
            "This booking is already connected to an account.",
        );
      }

      const existingUser =
        await getAuthUserByEmailOrNull(
            bookingResult.email,
        );

      if (existingUser) {
        throw new HttpsError(
            "already-exists",
            "An account already exists for this email. " +
            "Use Connect with Email instead.",
        );
      }

      const fullName =
        String(
            booking.customerName || "",
        ).trim();

      const nameParts =
        splitBookingCustomerName(
            fullName,
        );

      const phone =
        String(
            booking.customerContact ||
            booking.contactNumber ||
            "",
        ).trim();

      let newUser = null;

      try {
        newUser =
          await auth.createUser({
            email:
              bookingResult.email,

            password:
              cleanPassword,

            displayName:
              fullName ||
              nameParts.firstName,

            emailVerified:
              false,
          });

        const userRef = db
            .collection("users")
            .doc(newUser.uid);

        await db.runTransaction(
            async (transaction) => {
              const latestBooking =
                await transaction.get(
                    bookingResult.ref,
                );

              if (!latestBooking.exists) {
                throw new HttpsError(
                    "not-found",
                    "Booking could not be found.",
                );
              }

              const latestData =
                latestBooking.data() || {};

              const latestUid =
                String(
                    latestData.customerUid || "",
                ).trim();

              if (latestUid) {
                throw new HttpsError(
                    "failed-precondition",
                    "This booking is already connected to an account.",
                );
              }

              transaction.set(
                  userRef,
                  {
                    uid:
                      newUser.uid,

                    email:
                      bookingResult.email,

                    firstName:
                      nameParts.firstName,

                    lastName:
                      nameParts.lastName,

                    phone:
                      phone,

                    role:
                      "client",

                    status:
                      "active",

                    registrationSource:
                      "booking",

                    emailVerified:
                      false,

                    emailVerificationStatus:
                      "pending",

                    firstBookingId:
                      bookingResult.ref.id,

                    firstBookingReference:
                      String(
                          latestData.bookingReference ||
                          latestData.bookingNumber ||
                          "",
                      ).trim(),

                    createdAt:
                      new Date(),
                  },
                  {
                    merge: true,
                  },
              );

              transaction.update(
                  bookingResult.ref,
                  {
                    customerUid:
                      newUser.uid,

                    customerType:
                      "registered",

                    accountStatus:
                      "registered",

                    accountLinkedAt:
                      new Date(),

                    accountLinkMethod:
                      "created_after_booking",
                  },
              );
            },
        );

        return {
          success: true,
          mode: "created",
          uid: newUser.uid,
          email:
            bookingResult.email,
          emailVerified: false,
          message:
            "Account created and booking connected successfully.",
        };
      } catch (error) {
        console.error(
            "CREATE ACCOUNT FROM BOOKING ERROR:",
            error,
        );

        if (newUser) {
          try {
            await auth.deleteUser(
                newUser.uid,
            );
          } catch (cleanupError) {
            console.error(
                "BOOKING ACCOUNT CLEANUP ERROR:",
                cleanupError,
            );
          }
        }

        if (error instanceof HttpsError) {
          throw error;
        }

        if (
          error.code ===
          "auth/email-already-exists"
        ) {
          throw new HttpsError(
              "already-exists",
              "An account already exists for this email. " +
              "Use Connect with Email instead.",
          );
        }

        throw new HttpsError(
            "internal",
            "Unable to create your account right now.",
        );
      }
    },
);

// ======================================================
// SEND EXISTING-ACCOUNT BOOKING CONNECTION EMAIL
// ======================================================

exports.sendBookingConnectEmail = onCall(
    {
      secrets: [resendApiKey],
    },
    async (request) => {
      const {
        bookingId,
        email,
      } = request.data || {};

      const bookingResult =
        await getBookingForAccountAction(
            bookingId,
            email,
        );

      const booking =
        bookingResult.data;

      const alreadyLinkedUid =
        String(
            booking.customerUid || "",
        ).trim();

      if (alreadyLinkedUid) {
        return {
          success: true,
          alreadyLinked: true,
          message:
            "This booking is already connected to an account.",
        };
      }

      const existingUser =
        await getAuthUserByEmailOrNull(
            bookingResult.email,
        );

      if (!existingUser) {
        throw new HttpsError(
            "not-found",
            "No existing Trips Wonder account was found for this email.",
        );
      }

      const rawToken =
        crypto
            .randomBytes(32)
            .toString("hex");

      const tokenHash =
        crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

      const now =
        new Date();

      const expiresAt =
        new Date(
            now.getTime() +
            (30 * 60 * 1000),
        );

      const tokenRef = db
          .collection("bookingConnectTokens")
          .doc(tokenHash);

      await tokenRef.set({
        bookingId:
          bookingResult.ref.id,

        bookingReference:
          String(
              booking.bookingReference ||
              booking.bookingNumber ||
              "",
          ).trim(),

        uid:
          existingUser.uid,

        email:
          bookingResult.email,

        createdAt:
          now,

        expiresAt:
          expiresAt,

        used:
          false,
      });

      const connectUrl =
        "https://tripswonder.tours/" +
        "pages/customer/connect-booking.html?token=" +
        encodeURIComponent(rawToken);

      const safeName =
        String(
            booking.customerName ||
            existingUser.displayName ||
            "Traveler",
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

      const safeReference =
        String(
            booking.bookingReference ||
            booking.bookingNumber ||
            "",
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

      const emailHtml = `
        <div style="
          margin:0;
          padding:24px 12px;
          background:#f5f7fa;
          font-family:Arial,Helvetica,sans-serif;
          color:#111827;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            overflow:hidden;
            background:#ffffff;
            border-radius:16px;
          ">
            <div style="
              padding:25px 30px;
              background:#1769b0;
              color:#ffffff;
            ">
              <div style="
                font-size:24px;
                font-weight:800;
              ">
                Trips Wonder
              </div>

              <div style="
                margin-top:4px;
                font-size:13px;
                opacity:.9;
              ">
                Travel and Tours
              </div>
            </div>

            <div style="
              padding:34px 30px 30px;
              font-size:15px;
              line-height:1.6;
            ">
              <p style="margin:0 0 20px;">
                Hi ${safeName},
              </p>

              <h2 style="
                margin:0 0 14px;
                color:#111827;
                font-size:22px;
              ">
                Connect your booking
              </h2>

              <p style="margin:0 0 18px;">
                A booking was made using the email address
                connected to your Trips Wonder account.
              </p>

              <p style="margin:0 0 24px;">
                Booking reference:
                <strong>${safeReference}</strong>
              </p>

              <p style="margin:0 0 26px;">
                Click the button below to confirm that this
                email belongs to you and connect the booking
                to your existing account.
              </p>

              <div style="text-align:center;">
                <a
                  href="${connectUrl}"
                  style="
                    display:inline-block;
                    padding:14px 24px;
                    color:#ffffff;
                    background:#1769b0;
                    border-radius:9px;
                    text-decoration:none;
                    font-weight:700;
                  "
                >
                  Connect Booking
                </a>
              </div>

              <p style="
                margin:26px 0 0;
                color:#6b7280;
                font-size:12px;
              ">
                This secure link expires in 30 minutes.
                If you did not make this booking, you can
                safely ignore this email.
              </p>
            </div>

            <div style="
              padding:20px 30px 26px;
              border-top:1px solid #e5e7eb;
              color:#9ca3af;
              font-size:11px;
              line-height:1.5;
              text-align:center;
            ">
              Trips Wonder Travel and Tours
              <br>
              noreply@tripswonder.tours
            </div>
          </div>
        </div>
      `;

      const response =
        await fetch(
            "https://api.resend.com/emails",
            {
              method: "POST",

              headers: {
                "Authorization":
                  `Bearer ${resendApiKey.value()}`,

                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                from:
                  "Trips Wonder Travel and Tours " +
                  "<noreply@tripswonder.tours>",

                to: [
                  bookingResult.email,
                ],

                subject:
                  "Connect Your Booking | Trips Wonder",

                html:
                  emailHtml,
              }),
            },
        );

      const result =
        await response.json();

      if (!response.ok) {
        console.error(
            "BOOKING CONNECT EMAIL ERROR:",
            result,
        );

        await tokenRef.delete();

        throw new HttpsError(
            "internal",
            result.message ||
            "Unable to send the connection email.",
        );
      }

      return {
        success: true,
        emailSent: true,
        message:
          "Connection email sent successfully.",
      };
    },
);

// ======================================================
// FINALIZE EXISTING-ACCOUNT BOOKING CONNECTION
// ======================================================

exports.finalizeBookingConnect = onCall(
    async (request) => {
      const rawToken =
  String(
      (
        request.data &&
        request.data.token
      ) || "",
  ).trim();

      if (
        !rawToken ||
        rawToken.length < 32
      ) {
        throw new HttpsError(
            "invalid-argument",
            "Invalid connection link.",
        );
      }

      const tokenHash =
        crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

      const tokenRef = db
          .collection("bookingConnectTokens")
          .doc(tokenHash);

      await db.runTransaction(
          async (transaction) => {
            const tokenDoc =
              await transaction.get(
                  tokenRef,
              );

            if (!tokenDoc.exists) {
              throw new HttpsError(
                  "not-found",
                  "This connection link is invalid or has expired.",
              );
            }

            const token =
              tokenDoc.data() || {};

            if (token.used === true) {
              throw new HttpsError(
                  "failed-precondition",
                  "This connection link has already been used.",
              );
            }

            const expiresAt =
  token.expiresAt &&
  typeof token.expiresAt.toDate === "function" ?
    token.expiresAt.toDate() :
    new Date(token.expiresAt);

            if (
              !expiresAt ||
              Number.isNaN(
                  expiresAt.getTime(),
              ) ||
              expiresAt.getTime() <
              Date.now()
            ) {
              throw new HttpsError(
                  "deadline-exceeded",
                  "This connection link has expired.",
              );
            }

            const bookingId =
              String(
                  token.bookingId || "",
              ).trim();

            const uid =
              String(
                  token.uid || "",
              ).trim();

            const email =
              normalizeCustomerEmail(
                  token.email,
              );

            if (
              !bookingId ||
              !uid ||
              !email
            ) {
              throw new HttpsError(
                  "failed-precondition",
                  "This connection request is incomplete.",
              );
            }

            const bookingRef = db
                .collection("bookings")
                .doc(bookingId);

            const bookingDoc =
              await transaction.get(
                  bookingRef,
              );

            if (!bookingDoc.exists) {
              throw new HttpsError(
                  "not-found",
                  "Booking could not be found.",
              );
            }

            const booking =
              bookingDoc.data() || {};

            const bookingEmail =
              normalizeCustomerEmail(
                  booking.customerEmail,
              );

            if (bookingEmail !== email) {
              throw new HttpsError(
                  "permission-denied",
                  "The booking email no longer matches.",
              );
            }

            const currentUid =
              String(
                  booking.customerUid || "",
              ).trim();

            if (
              currentUid &&
              currentUid !== uid
            ) {
              throw new HttpsError(
                  "failed-precondition",
                  "This booking is already connected to another account.",
              );
            }

            transaction.update(
                bookingRef,
                {
                  customerUid:
                    uid,

                  customerType:
                    "registered",

                  accountStatus:
                    "registered",

                  accountLinkedAt:
                    new Date(),

                  accountLinkMethod:
                    "email_connection",
                },
            );

            transaction.update(
                tokenRef,
                {
                  used:
                    true,

                  usedAt:
                    new Date(),
                },
            );
          },
      );

      return {
        success: true,
        connected: true,
        message:
          "Your booking has been connected successfully.",
      };
    },
);

// ======================================================
// TRIPS WONDER SUPPORT
// ======================================================

function cleanSupportText(value, maxLength) {
  const text = String(value || "")
      .replace(/\s+/g, " ")
      .trim();

  if (!maxLength || text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength).trim();
}

function getSupportMessageRole(data) {
  const role = String(data.senderRole || "")
      .trim()
      .toLowerCase();

  if (role === "customer" || role === "client") {
    return "Customer";
  }

  if (
    role === "admin" ||
    role === "owner" ||
    role === "staff"
  ) {
    return "Trips Wonder Team";
  }

  return "Support Consultant";
}

function parseTripsWonderSupportDecision(rawText) {
  const raw = String(rawText || "").trim();

  if (!raw) {
    throw new Error("OpenAI returned an empty response.");
  }

  let cleaned = raw;

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
  }

  let result;

  try {
    result = JSON.parse(cleaned);
  } catch (error) {
    console.error("Support JSON parse error:", raw);
    throw new Error("Trips Wonder Support returned invalid structured data.");
  }

  const status = String(result.status || "")
      .trim()
      .toLowerCase();

  if (status !== "answered" && status !== "needs_human") {
    throw new Error("Trips Wonder Support returned an invalid status.");
  }

  const reply = cleanSupportText(result.reply, 1800);

  if (!reply) {
    throw new Error("Trips Wonder Support returned an empty reply.");
  }

  if (status === "answered") {
    return {
      status: "answered",
      reply: reply,
      handoffBrief: null,
    };
  }

  const brief = result.handoffBrief || {};

  const handoffBrief = {
    clientQuestion: cleanSupportText(
        brief.clientQuestion,
        500,
    ),
    needsAdminCheck: cleanSupportText(
        brief.needsAdminCheck,
        300,
    ),
    currentSystemStatus: cleanSupportText(
        brief.currentSystemStatus,
        700,
    ),
    adminActionNeeded: cleanSupportText(
        brief.adminActionNeeded,
        500,
    ),
  };

  if (!handoffBrief.clientQuestion) {
    throw new Error("Human handoff is missing the client question.");
  }

  if (!handoffBrief.needsAdminCheck) {
    throw new Error("Human handoff is missing the admin check.");
  }

  if (!handoffBrief.currentSystemStatus) {
    throw new Error("Human handoff is missing the system status.");
  }

  if (!handoffBrief.adminActionNeeded) {
    throw new Error("Human handoff is missing the admin action.");
  }

  return {
    status: "needs_human",
    reply: reply,
    handoffBrief: handoffBrief,
  };
}

async function activateServerSideSupportHandoff(
    conversationRef,
    customerQuestion,
    handoffBrief
) {
  const supportPersona =
    await getSupportPersonaSettings();

  const cleanQuestion =
    cleanSupportText(customerQuestion, 500) ||
    "Customer requested help from Trips Wonder Support.";

  const brief = handoffBrief || {};

  const finalBrief = {
    clientQuestion:
      cleanSupportText(brief.clientQuestion, 500) ||
      cleanQuestion,
    needsAdminCheck:
      cleanSupportText(brief.needsAdminCheck, 300) ||
      "Customer needs a Trips Wonder team member to verify this request.",
    currentSystemStatus:
      cleanSupportText(brief.currentSystemStatus, 700) ||
      "Travel Consultant could not safely verify the requested information.",
    adminActionNeeded:
      cleanSupportText(brief.adminActionNeeded, 500) ||
      "Review the customer's latest question and verify the required information in TWTMS.",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const holdingReply =
    "Let me verify that for you po. One moment please.";

  const conversationDoc = await conversationRef.get();
  const current = conversationDoc.exists ?
    conversationDoc.data() :
    {};

  const unreadCustomer =
    Number(current.unreadCustomer || 0) + 1;

  const batch = db.batch();
  const replyRef = conversationRef
      .collection("messages")
      .doc();

  batch.set(replyRef, {
    senderRole: "support",
    senderName: supportPersona.name,
    text: holdingReply,
    createdAt: new Date(),
  });

  batch.set(
      conversationRef,
      {
        status: "open",
        supportMode: "human",
        supportStatus: "active",
        handoffAvailable: false,
        handoffRequested: true,
        handoffRequestedAt: new Date(),
        handoffBrief: finalBrief,
        lastMessage: holdingReply,
        lastMessageAt: new Date(),
        lastSenderRole: "support",
        unreadCustomer: unreadCustomer,
        updatedAt: new Date(),
      },
      {merge: true},
  );

  await batch.commit();

  return {
    holdingReply: holdingReply,
    handoffBrief: finalBrief,
  };
}

exports.askTripsWonderSupport = onCall(
    {
      secrets: [openaiApiKey],
    },
    async (request) => {
      if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "You must be logged in.",
        );
      }

      const uid = request.auth.uid;

      const message = String(
          (
            request.data &&
            request.data.message
          ) || "",
      ).trim();

      if (!message) {
        throw new HttpsError(
            "invalid-argument",
            "Message is required.",
        );
      }

      if (message.length > 1500) {
        throw new HttpsError(
            "invalid-argument",
            "Message is too long.",
        );
      }

      const conversationRef = db
          .collection("conversations")
          .doc(uid);

      try {
        // ===============================================
        // VERIFY SUPPORT MODE
        // ===============================================

        const conversationDoc =
          await conversationRef.get();

        const conversation =
          conversationDoc.exists ?
            conversationDoc.data() :
            {};

        const supportMode = String(
            conversation.supportMode || "online",
        )
            .trim()
            .toLowerCase();

        if (supportMode === "human") {
          throw new HttpsError(
              "failed-precondition",
              "A Trips Wonder team member is currently assisting this conversation.",
          );
        }

        // ===============================================
        // LOAD RECENT OFFICIAL CONVERSATION HISTORY
        // ===============================================

        const recentMessagesSnapshot =
          await conversationRef
              .collection("messages")
              .orderBy("createdAt", "desc")
              .limit(12)
              .get();

        const recentMessages =
          recentMessagesSnapshot.docs
              .map((doc) => doc.data() || {})
              .reverse()
              .map((item) => ({
                role: getSupportMessageRole(item),
                text: cleanSupportText(item.text, 1200),
              }))
              .filter((item) => item.text);

        // ===============================================
        // LOAD PUBLISHED / ACTIVE TOUR PACKAGES
        // ===============================================

        const packagesSnapshot =
          await db
              .collection("packages")
              .get();

        const packages = packagesSnapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((item) => {
              const status = String(
                  item.status ||
                  item.packageStatus ||
                  "",
              )
                  .trim()
                  .toLowerCase();

              return (
                status === "active" ||
                status === "published"
              );
            });

        // ===============================================
        // PREPARE LIVE TWTMS PACKAGE DATA
        // ===============================================

        const packageContext =
          packages.map((item) => ({
            id: item.id,

            name:
              item.packageName ||
              item.destinationName ||
              item.destination ||
              item.name ||
              "",

            destination:
              item.destination ||
              item.destinationName ||
              item.location ||
              "",

            duration:
              item.duration ||
              item.packageDuration ||
              item.packageOption ||
              "",

            price:
              item.price !== undefined &&
              item.price !== null ?
                item.price :
                (
                  item.packagePrice !== undefined &&
                  item.packagePrice !== null ?
                    item.packagePrice :
                    (
                      item.rate !== undefined &&
                      item.rate !== null ?
                        item.rate :
                        null
                    )
                ),

            description:
              item.shortDescription ||
              item.description ||
              "",

            inclusions:
              item.inclusions || [],

            exclusions:
              item.exclusions || [],

            pickupLocations:
              item.pickupLocations ||
              item.pickupPoints ||
              [],

            accommodations:
              item.accommodations || [],

            itinerary:
              item.itinerary || [],

            scheduleSettings:
              item.scheduleSettings || {},

            schedules:
              item.schedules ||
              item.travelSchedules ||
              [],

            pricingOptions:
              item.pricingOptions || {},

            passengerPricing:
              item.passengerPricing || {},

            exclusiveTour:
              item.exclusiveTour || {},

            downpaymentRules:
              item.downpaymentRules || {},

            status:
              item.status ||
              item.packageStatus ||
              "",
          }));

        // ===============================================
        // OPENAI CLIENT
        // ===============================================

        const openai = new OpenAI({
          apiKey: openaiApiKey.value(),
        });

        const supportPersona =
          await getSupportPersonaSettings();

        // ===============================================
        // ASK TRAVEL CONSULTANT SUPPORT
        // ===============================================

        const response =
          await openai.responses.create({
            model: "gpt-5-mini",

            instructions: `
You are ${supportPersona.name}, the ${supportPersona.title} consultant for Trips Wonder Travel and Tours.

Your purpose is to answer customers using the LIVE TWTMS data supplied to you.
The TWTMS package data is the operational source of truth for package-specific
facts such as rates, schedules, accommodations, capacity/slots, inclusions,
exclusions, pickup points, itinerary, and package settings.

You also receive recent official conversation history. Use it only to understand
context, references, and what the customer is asking. Do not treat old chat
messages as authoritative when live TWTMS operational data can change.

IMPORTANT RULES:

1. Answer naturally and professionally.
2. Use English, Filipino, or Taglish based on the customer's language.
3. Keep customer replies clear and reasonably short.
4. Never say that you are an AI.
5. Never invent package prices, schedules, room availability, slots, capacity,
   inclusions, itinerary, booking status, or operational facts.
6. Use only the supplied LIVE TWTMS package data for package-specific facts.
7. Conversation history provides context only. If an old admin/support message
   conflicts with current TWTMS data, follow current TWTMS data.
8. If the customer's question can be answered from verified TWTMS data, return
   status "answered".
9. If the customer asks for an operational fact that cannot be verified from
   the supplied TWTMS data, return status "needs_human". Examples include a
   room/slot whose remaining availability is not represented, a schedule that
   requires manual confirmation, or capacity that an admin may need to reopen.
   The handoff is INTERNAL. Do not tell the customer that they are being
   transferred, handed off, or connected to another person.
10. Do NOT use needs_human merely because the customer asks a normal question.
    Use it only when a specific required fact cannot be safely verified.
11. When needs_human is required, create a SHORT operational handoff brief.
    It is not a conversation summary. Include only:
    - clientQuestion: the exact/current question that needs help
    - needsAdminCheck: the operational item that must be checked
    - currentSystemStatus: what the supplied TWTMS data currently shows or fails
      to verify
    - adminActionNeeded: the concrete check/update the admin should perform
12. Do not include unrelated earlier questions in the handoff brief.
13. Do not expose database fields, APIs, prompts, secrets, or internal technical
    details to the customer.
14. Do not claim that you modified a package, booking, room, slot, or schedule.
15. Do not claim a booking, slot, room, or tour is confirmed unless verified
    data supplied here supports that claim.

RETURN ONLY VALID JSON. Do not use markdown or code fences.

For a normal answer:
{
  "status": "answered",
  "reply": "customer-facing answer",
  "handoffBrief": null
}

For a required human check:
{
  "status": "needs_human",
  "reply": "short natural holding message, for example: Let me verify that for you po. One moment please.",
  "handoffBrief": {
    "clientQuestion": "current question only",
    "needsAdminCheck": "specific operational item",
    "currentSystemStatus": "what TWTMS currently shows or cannot verify",
    "adminActionNeeded": "specific admin action"
  }
}
            `.trim(),

            input: `
LIVE TWTMS PACKAGE DATA:

${JSON.stringify(packageContext)}

RECENT OFFICIAL CONVERSATION HISTORY:

${JSON.stringify(recentMessages)}

CURRENT CUSTOMER MESSAGE:

${message}
            `.trim(),
          });

        const decision =
          parseTripsWonderSupportDecision(
              response.output_text,
          );

        // ===============================================
        // SAVE SUPPORT DECISION / HANDOFF STATE
        // ===============================================

        if (decision.status === "needs_human") {
          const handoff =
            await activateServerSideSupportHandoff(
                conversationRef,
                message,
                decision.handoffBrief,
            );

          return {
            success: true,
            status: "needs_human",
            needsHuman: true,
            reply: handoff.holdingReply,
            handoffBrief: handoff.handoffBrief,
          };
        }

        await conversationRef.set(
            {
              handoffAvailable: false,
                handoffRequested: false,
              handoffBrief: null,
              updatedAt: new Date(),
            },
            {merge: true},
        );

        return {
          success: true,
          status: "answered",
          needsHuman: false,
          reply: decision.reply,
          handoffBrief: null,
        };
      } catch (error) {
        console.error(
            "Trips Wonder Support error:",
            error,
        );

        if (error instanceof HttpsError) {
          throw error;
        }

        /*
         * OpenAI/API/service failures must not leave the customer waiting
         * without acknowledgement. The server creates the same internal
         * Human Support handoff and persists the holding reply.
         */
        try {
          const handoff =
            await activateServerSideSupportHandoff(
                conversationRef,
                message,
                null,
            );

          return {
            success: true,
            status: "needs_human",
            needsHuman: true,
            reply: handoff.holdingReply,
            handoffBrief: handoff.handoffBrief,
          };
        } catch (handoffError) {
          console.error(
              "Trips Wonder server-side handoff error:",
              handoffError,
          );

          throw new HttpsError(
              "internal",
              "Trips Wonder Support is temporarily unavailable.",
          );
        }
      }
    },
);
