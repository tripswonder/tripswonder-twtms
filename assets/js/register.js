/*************************************************
 * =================================================
 * TWTMS v1.1.0
 * Customer Registration Module
 * register.js
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

const registerForm = document.getElementById("registerForm");

const username = document.getElementById("username");

const email = document.getElementById("email");

const password = document.getElementById("password");

const confirmPassword = document.getElementById("confirmPassword");

const firstName = document.getElementById("firstName");

const middleName = document.getElementById("middleName");

const lastName = document.getElementById("lastName");

const suffix = document.getElementById("suffix");

const contactNumber = document.getElementById("contactNumber");

const birthDate = document.getElementById("birthDate");

const gender = document.getElementById("gender");

const address = document.getElementById("address");

const terms = document.getElementById("terms");

const privacy = document.getElementById("privacy");

/* =================================================
   FORM SUBMIT
================================================= */

registerForm.addEventListener("submit", function(event){

    event.preventDefault();

    if(!validateForm()){

        return;

    }

    registerUser();

});

/* =================================================
   REGISTER USER
================================================= */

async function registerUser(){

    const userData = {

        action:"register",

        username:username.value.trim(),

        email:email.value.trim(),

        password:password.value,

        firstName:firstName.value.trim(),

        middleName:middleName.value.trim(),

        lastName:lastName.value.trim(),

        suffix:suffix.value.trim(),

        contactNumber:contactNumber.value.trim(),

        birthDate:birthDate.value,

        gender:gender.value,

        address:address.value.trim()

    };

    try{

        const response = await fetch(WEB_APP_URL,{

            method:"POST",

            body:JSON.stringify(userData)

        });

        const result = await response.json();

        if(result.success){

            alert("Registration Successful!");

            window.location.href="index.html";

        }else{

            alert(result.message);

        }

    }catch(error){

        alert("Unable to connect to server.");

        console.error(error);

    }

}
