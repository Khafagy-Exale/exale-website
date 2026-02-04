// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your specific Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBUpPgWDmz97LOvwO38EeiEmDjTocXsGHY",
  authDomain: "exalegroup.firebaseapp.com",
  projectId: "exalegroup",
  storageBucket: "exalegroup.firebasestorage.app",
  messagingSenderId: "253829142773",
  appId: "1:253829142773:web:bba63d2bc61bdcd7678dbc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Export them so other files can use them
export { db, auth };