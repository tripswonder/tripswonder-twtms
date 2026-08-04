/* ==========================================================
   TWTMS LOGIN
========================================================== */

const loginForm = document.getElementById("loginForm");
const username = document.getElementById("username");
const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

/* ==========================================================
   SHOW / HIDE PASSWORD
========================================================== */

if (togglePassword) {

    togglePassword.addEventListener("click", () => {

        const icon = togglePassword.querySelector("i");

        if (password.type === "password") {

            password.type = "text";

            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");

        } else {

            password.type = "password";

            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");

        }

    });

}

/* ==========================================================
   LOGIN
========================================================== */

if (loginForm) {

    loginForm.addEventListener("submit", function(e){

        e.preventDefault();

        if(username.value.trim()===""){

            alert("Please enter your username.");
            username.focus();
            return;

        }

        if(password.value.trim()===""){

            alert("Please enter your password.");
            password.focus();
            return;

        }

        login();

    });

}

/* ==========================================================
   LOGIN FUNCTION
========================================================== */

function login(){

    const button=document.querySelector(".login-btn");

    button.disabled=true;

    button.innerHTML=
    `<i class="fa-solid fa-spinner fa-spin"></i> Signing In...`;

    setTimeout(()=>{

        alert("Login Successful!");

        // NEXT:
        // window.location.href="admin/dashboard.html";

    },1500);

}