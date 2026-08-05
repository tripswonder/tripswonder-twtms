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

/* =================================================
   LOGIN USER
================================================= */

async function loginUser(){

    const loginData = {

        action:"login",

        username:username.value.trim(),

        password:password.value

    };

    try{

        const response = await fetch(WEB_APP_URL,{

            method:"POST",

            body:JSON.stringify(loginData)

        });

        const result = await response.json();

        if(result.success){

            alert(result.message);

            window.location.href = result.redirect;

        }else{

            alert(result.message);

        }

    }catch(error){

        alert("Unable to connect to server.");

        console.error(error);

    }

}
