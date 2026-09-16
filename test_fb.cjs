const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const firebaseConfig = {
  "projectId": "noted-veld-ztxfk",
  "appId": "1:443110813447:web:ea2277f28b3b6c89129fa2",
  "apiKey": "AIzaSyCK5oFgLotltE8O7Jici-yh-FmHGIa_iuQ",
  "authDomain": "noted-veld-ztxfk.firebaseapp.com",
  "firestoreDatabaseId": "ai-studio-aikuchaka-ee59696f-b4eb-4e53-977b-8e68342ed55c",
  "storageBucket": "noted-veld-ztxfk.firebasestorage.app",
  "messagingSenderId": "443110813447",
  "measurementId": "",
  "oAuthClientId": "443110813447-8d3n5bvvk1pjv0q2c78flhl7l923bbp9.apps.googleusercontent.com",
  "recaptchaSiteKey": ""
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  console.log("Fetching...");
  try {
    const snap = await getDocs(collection(db, "recipes"));
    console.log("Count:", snap.docs.length);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
test();
