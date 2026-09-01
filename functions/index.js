const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const {defineSecret} = require("firebase-functions/params");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");

// ======================================================
// INITIALIZE FIREBASE ADMIN
// ======================================================

initializeApp();

const auth = getAuth();
const db = getFirestore();
const resendApiKey = defineSecret("RESEND_API_KEY");


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

function normalizeBookingUpdateStatus(value) {
  return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\\s-]+/g, "_");
}

function getBookingUpdateReference(booking, bookingId) {
  return String(
      booking.bookingReference ||
      booking.referenceNumber ||
      booking.displayReference ||
      bookingId ||
      "",
  ).trim();
}

function getBookingUpdateDestination(booking) {
  return String(
      booking.packageName ||
      booking.destination ||
      booking.packageLocation ||
      "your trip",
  ).trim();
}

function getBookingUpdateTravelDate(booking) {
  return (
    booking.travelStartDate ||
    booking.travelDate ||
    booking.tourDate ||
    booking.departureDate ||
    ""
  );
}

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
// END OF FIREBASE FUNCTIONS
// ======================================================

console.log(
    "TWTMS Firebase Functions loaded successfully.",
);
