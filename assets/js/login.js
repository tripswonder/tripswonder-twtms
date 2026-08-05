/*************************************************
 * =================================================
 * TWTMS v1.1.0
 * Customer Login Module
 * login.js
 * =================================================
 *************************************************/

/* =================================================
   WEB APP URL
================================================= */

const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbzuLrAiwUKLSwQcisfnghepngM2a4pjVLUJY6WW5Y59gn5lt5v3GgYqlgay0uaKbz9g/exec";

/* =================================================
   DOM ELEMENTS
================================================= */

const loginForm = document.getElementById("loginForm");

const username = document.getElementById("username");

const password = document.getElementById("password");

const rememberMe = document.getElementById("rememberMe");

const togglePassword = document.getElementById("togglePassword");

/* =================================================
   TOGGLE PASSWORD
================================================= */

togglePassword.addEventListener("click", function(){

    if(password.type==="password"){

        password.type="text";

        togglePassword.innerHTML=
        '<i class="fa-solid fa-eye-slash"></i>';

    }else{

        password.type="password";

        togglePassword.innerHTML=
        '<i class="fa-solid fa-eye"></i>';

    }

});

/* =================================================
   FORM SUBMIT
================================================= */

loginForm.addEventListener("submit", function(event){

    event.preventDefault();

    if(!validateLogin()){

        return;

    }

    loginUser();

});

/* =================================================
   VALIDATE LOGIN
================================================= */

function validateLogin(){

    if(username.value.trim()===""){

        alert("Please enter your username or email.");

        username.focus();

        return false;

    }

    if(password.value===""){

        alert("Please enter your password.");

        password.focus();

        return false;

    }

    return true;

}
