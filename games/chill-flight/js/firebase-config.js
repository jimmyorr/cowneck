import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getDatabase, ref, set, onChildAdded, onChildChanged, onChildRemoved, onValue, goOffline, goOnline, onDisconnect, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCPeDeN9w52WynaSSasPIeGYZCO7Dq6IRw",
    authDomain: "chill-flight.firebaseapp.com",
    databaseURL: "https://chill-flight-default-rtdb.firebaseio.com",
    projectId: "chill-flight",
    storageBucket: "chill-flight.firebasestorage.app",
    messagingSenderId: "164886656663",
    appId: "1:164886656663:web:249418e3fe76d60a4d1bd2",
    measurementId: "G-N6RGBLQCZ8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

export {
    app,
    analytics,
    auth,
    db,
    ref,
    set,
    onChildAdded,
    onChildChanged,
    onChildRemoved,
    onValue,
    goOffline,
    goOnline,
    onDisconnect,
    get,
    signInAnonymously
};
