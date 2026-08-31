// =========================================
// Firebase Storage
// =========================================

import {

    storage

} from "./firebase-config.js";


import {

    ref,

    uploadBytes,

    getDownloadURL,

    deleteObject

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";


// =========================================
// Export Storage Functions
// =========================================

export {

    storage,

    ref,

    uploadBytes,

    getDownloadURL,

    deleteObject

};