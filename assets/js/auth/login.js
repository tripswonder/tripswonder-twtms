/*************************************************
 * ================================================
 * TWTMS v2
 * Firebase Login Module
 * assets/js/auth/login.js
 * ================================================
 */

import { login } from "../firebase/firebase-auth.js";

/* ================================================
   DOM
================================================ */

const form = document.getElementById("loginForm");

const username = document.getElementById("username");

const password = document.getElementById("password");

const remember = document.getElementById("rememberMe");

const button = form.querySelector("button[type='submit']");

let processing = false;

/* ================================================
   SUBMIT
================================================ */

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    if(processing) return;

    if(username.value.trim()===""){

        alert("Enter email.");

        return;

    }

    if(password.value===""){

        alert("Enter password.");

        return;

    }

    processing=true;

    button.disabled=true;

    button.innerHTML="Signing In...";

    try{

        const userCredential = await login(

            username.value.trim(),

            password.value

        );

        if(remember.checked){

            localStorage.setItem(

                "rememberEmail",

                username.value.trim()

            );

        }else{

            localStorage.removeItem(

                "rememberEmail"

            );

        }

        window.location.href="/pages/customer/dashboard.html";

    }

    catch(error){

        alert(error.message);

    }

    finally{

        processing=false;

        button.disabled=false;

        button.innerHTML="Sign In";

    }

});
