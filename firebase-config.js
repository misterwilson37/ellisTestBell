/**
 * Ellis Web Bell — Shared Firebase Configuration
 * Version: 1.0.0
 *
 * This file is loaded as a plain (non-module) script so it works equally well
 * in the module-based main app (script.js, Firebase v11 modules) and in the
 * compat-based surfaces (clock.html, dashboard.html, dashboard-config.html,
 * all using Firebase v9 compat). Anything that needs the config reads it
 * from window.firebaseConfig — which is the ONLY place it should be defined.
 *
 * If the Firebase API key or project ever rotates, this is the single place
 * to update. Do NOT re-inline the config into any consuming file.
 */
(function () {
    "use strict";

    window.firebaseConfig = {
        apiKey: "AIzaSyDfo45UBu-pR8nqMQhVlS_QgyYZ2kzBdvM",
        authDomain: "ellisbell-c185c.firebaseapp.com",
        projectId: "ellisbell-c185c",
        storageBucket: "ellisbell-c185c.firebasestorage.app",
        appId: "1:441560045695:web:94e51a006663404b8f474a"
    };

    // Convenience: the app ID is used as a Firestore path segment in several
    // places. Exposing it separately saves every consumer from repeating
    // `window.firebaseConfig.appId`.
    window.firebaseAppId = window.firebaseConfig.appId;
})();
