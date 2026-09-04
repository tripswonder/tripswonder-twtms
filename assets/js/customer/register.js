import {
  auth,
  db
} from "../firebase/firebase-config.js";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


// =========================================
// REGISTER FORM
// =========================================

const registerForm =
  document.getElementById("registerForm");

const emailInput =
  document.getElementById("email");


// =========================================
// BOOKING REGISTRATION CONTEXT
// =========================================

const registerParams =
  new URLSearchParams(
    window.location.search
  );

const bookingEmail =
  (registerParams.get("email") || "")
    .trim()
    .toLowerCase();

const bookingReference =
  (registerParams.get("booking") || "")
    .trim();

const registrationSource =
  (registerParams.get("from") || "")
    .trim()
    .toLowerCase();

const isBookingRegistration =
  registrationSource === "booking" &&
  bookingReference !== "";


// =========================================
// PREFILL BOOKING EMAIL
// =========================================

if (
  isBookingRegistration &&
  bookingEmail &&
  emailInput
) {

  emailInput.value =
    bookingEmail;

}


// =========================================
// SUBMIT
// =========================================

registerForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    // ---------------------------------------
    // GET FORM DATA
    // ---------------------------------------

    const username =
      document
        .getElementById("username")
        .value
        .trim();

    const email =
      document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    const password =
      document
        .getElementById("password")
        .value;

    const confirmPassword =
      document
        .getElementById("confirmPassword")
        .value;

    const firstName =
      document
        .getElementById("firstName")
        .value
        .trim();

    const middleName =
      document
        .getElementById("middleName")
        .value
        .trim();

    const lastName =
      document
        .getElementById("lastName")
        .value
        .trim();

    const suffix =
      document
        .getElementById("suffix")
        .value
        .trim();

    const contactNumber =
      document
        .getElementById("contactNumber")
        .value
        .trim();

    const birthDate =
      document
        .getElementById("birthDate")
        .value;

    const gender =
      document
        .getElementById("gender")
        .value;

    const address =
      document
        .getElementById("address")
        .value
        .trim();

    const terms =
      document
        .getElementById("terms")
        .checked;

    const privacy =
      document
        .getElementById("privacy")
        .checked;


    // =======================================
    // VALIDATION
    // =======================================

    if (
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !firstName ||
      !lastName ||
      !contactNumber
    ) {

      alert(
        "Please complete all required fields."
      );

      return;
    }


    // ---------------------------------------
    // PASSWORD
    // ---------------------------------------

    if (
      password.length < 6
    ) {

      alert(
        "Password must be at least 6 characters."
      );

      return;
    }


    if (
      password !== confirmPassword
    ) {

      alert(
        "Passwords do not match."
      );

      return;
    }


    // ---------------------------------------
    // TERMS & PRIVACY
    // ---------------------------------------

    if (
      !terms ||
      !privacy
    ) {

      alert(
        "Please agree to the Terms & Conditions and Privacy Policy."
      );

      return;
    }


    // =======================================
    // DISABLE BUTTON
    // =======================================

    const submitButton =
      registerForm.querySelector(
        ".register-btn"
      );

    const originalButtonText =
      submitButton.textContent;

    submitButton.disabled =
      true;

    submitButton.textContent =
      "Creating Account...";


    try {

      // =====================================
      // CREATE FIREBASE AUTH USER
      // =====================================

      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );


      const user =
        userCredential.user;


      // =====================================
      // UPDATE DISPLAY NAME
      // =====================================

      const displayName =
        `${firstName} ${lastName}`.trim();

      await updateProfile(
        user,
        {
          displayName:
            displayName
        }
      );


      // =====================================
      // CREATE FIRESTORE USER PROFILE
      // =====================================

      await setDoc(
        doc(
          db,
          "users",
          user.uid
        ),
        {

          uid:
            user.uid,

          username:
            username,

          email:
            email,

          firstName:
            firstName,

          middleName:
            middleName,

          lastName:
            lastName,

          suffix:
            suffix,

          phone:
            contactNumber,

          birthDate:
            birthDate,

          gender:
            gender,

          address:
            address,

          role:
            "client",

          status:
            "active",

          registrationSource:
            isBookingRegistration
              ? "booking"
              : "direct",

          pendingBookingReference:
            isBookingRegistration
              ? bookingReference
              : "",

          createdAt:
            serverTimestamp()

        }
      );


      // =====================================
      // SEND EMAIL VERIFICATION
      // =====================================

      await sendEmailVerification(
        user
      );


      /*
       * Firebase automatically signs in
       * the newly-created account.
       *
       * We sign it out so the customer
       * must verify the email first.
       */

      await signOut(
        auth
      );


      // =====================================
      // SUCCESS
      // =====================================

      if (
        isBookingRegistration
      ) {

        alert(
          "Account created! We sent a verification link to your email. Please verify your email first, then sign in to link your booking."
        );

      } else {

        alert(
          "Account created! We sent a verification link to your email. Please verify your email before signing in."
        );

      }


      // =====================================
      // REDIRECT TO LOGIN
      // =====================================

      const loginParams =
        new URLSearchParams();


      loginParams.set(
        "email",
        email
      );


      loginParams.set(
        "verify",
        "1"
      );


      if (
        isBookingRegistration
      ) {

        loginParams.set(
          "booking",
          bookingReference
        );

        loginParams.set(
          "from",
          "booking"
        );

      }


      window.location.href =
        `index.html?${loginParams.toString()}`;


    } catch (error) {

      console.error(
        "Registration error:",
        error
      );


      // =====================================
      // FIREBASE ERROR HANDLING
      // =====================================

      let message =
        "Unable to create your account. Please try again.";


      switch (
        error.code
      ) {

        case "auth/email-already-in-use":

          message =
            "This email address is already registered.";

          break;


        case "auth/invalid-email":

          message =
            "Please enter a valid email address.";

          break;


        case "auth/weak-password":

          message =
            "Password is too weak. Please use a stronger password.";

          break;


        case "auth/network-request-failed":

          message =
            "Network error. Please check your internet connection.";

          break;


        case "auth/too-many-requests":

          message =
            "Too many requests. Please wait a moment and try again.";

          break;


        default:

          message =
            error.message ||
            message;

          break;

      }


      alert(
        message
      );


    } finally {

      // =====================================
      // RESTORE BUTTON
      // =====================================

      submitButton.disabled =
        false;

      submitButton.textContent =
        originalButtonText;

    }

  }
);