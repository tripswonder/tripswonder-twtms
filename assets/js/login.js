/* ==========================================================
   TWTMS LOGIN
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");

    const username = document.getElementById("username");

    const password = document.getElementById("password");

    const togglePassword = document.getElementById("togglePassword");

    const loginButton = document.querySelector(".login-btn");

    /* ======================================================
       SHOW / HIDE PASSWORD
    ====================================================== */

    if (togglePassword && password) {

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

    /* ======================================================
       LOGIN
    ====================================================== */

    if (loginForm) {

        loginForm.addEventListener("submit", (e) => {

            e.preventDefault();

            if (username.value.trim() === "") {

                alert("Please enter your username.");

                username.focus();

                return;

            }

            if (password.value.trim() === "") {

                alert("Please enter your password.");

                password.focus();

                return;

            }

            loginButton.disabled = true;

            loginButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                <span>Signing In...</span>
            `;

            setTimeout(() => {

                alert("Login Successful!");

                /* NEXT STEP */

                // window.location.href = "dashboard/index.html";

                loginButton.disabled = false;

                loginButton.innerHTML = `
                    <i class="fa-solid fa-right-to-bracket"></i>
                    <span>Login</span>
                `;

            }, 1500);

        });

    }

});
