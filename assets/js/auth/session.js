/*************************************************
 * ================================================
 * TWTMS v2
 * Session Module
 * assets/js/auth/session.js
 * ================================================
 */

import {

    authListener,
    logout

} from "../firebase/firebase-auth.js";


/* ================================================
   AUTH STATE
================================================ */

authListener((user)=>{

    if(user){

        sessionStorage.setItem(

            "uid",

            user.uid

        );

        sessionStorage.setItem(

            "email",

            user.email

        );

    }

});


/* ================================================
   LOGOUT
================================================ */

export async function logoutUser(){

    await logout();

    sessionStorage.clear();

    window.location.href="/";

}


/* ================================================
   CHECK LOGIN
================================================ */

export function isLoggedIn(){

    return sessionStorage.getItem("uid")!==null;

}
