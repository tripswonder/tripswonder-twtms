/*************************************************
 * ================================================
 * TWTMS v1.2.0
 * Customer Login Module
 * login.js
 * ================================================
 *************************************************/

/* ================================================
   WEB APP URL
================================================ */

const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycby-2ETVEomJoh805zjHn1BU7Jcjj9gje3t0dO1sFtdX0xRep_MuxkODUl5URJybdrz_/exec";

/* ================================================
   DOM ELEMENTS
================================================ */

const loginForm = document.getElementById("loginForm");
const username = document.getElementById("username");
const password = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const togglePassword = document.getElementById("togglePassword");

const loginButton =
    loginForm.querySelector("button[type='submit']");

const originalButtonHTML = loginButton.innerHTML;

let isProcessing = false;

/* ================================================
   TOGGLE PASSWORD
================================================ */

togglePassword.addEventListener("click", () => {

    if (password.type === "password") {

        password.type = "text";

        togglePassword.innerHTML =
            '<i class="fa-solid fa-eye-slash"></i>';

    } else {

        password.type = "password";

        togglePassword.innerHTML =
            '<i class="fa-solid fa-eye"></i>';

    }

});

/* ================================================
   FORM SUBMIT
================================================ */

loginForm.addEventListener("submit", function (event) {

    event.preventDefault();

    if (isProcessing) return;

    if (!validateLogin()) return;

    loginUser();

});

/* ================================================
   VALIDATE LOGIN
================================================ */

function validateLogin() {

    if (username.value.trim() === "") {

        alert("Please enter your username or email.");

        username.focus();

        return false;

    }

    if (password.value.trim() === "") {

        alert("Please enter your password.");

        password.focus();

        return false;

    }

    return true;

}

/* ================================================
   BUTTON STATE
================================================ */

function startLoading() {

    isProcessing = true;

    loginButton.disabled = true;

    loginButton.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Signing In...
    `;

}

function stopLoading() {

    isProcessing = false;

    loginButton.disabled = false;

    loginButton.innerHTML = originalButtonHTML;

}

/* ================================================
   LOGIN USER
================================================ */

async function loginUser() {

    startLoading();

    const loginData = {

        action: "login",

        username: username.value.trim(),

        password: password.value,

        remember: rememberMe.checked

    };

    try {

        const response = await fetch(WEB_APP_URL, {

    method: "POST",

    headers: {

        "Content-Type":"application/x-www-form-urlencoded"

    },

    body: new URLSearchParams(loginData)

});

        const result = await response.json();

        if (result.success) {

            loginButton.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                Success
            `;

            setTimeout(() => {

                window.location.href = result.redirect;

            }, 500);

        } else {

            stopLoading();

            alert(result.message);

        }

    } catch (error) {

        stopLoading();

        alert("Unable to connect to server.");

        console.error(error);

    }

}
