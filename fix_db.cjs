import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

async function reset() {
  const recipesSnapshot = await getDocs(collection(db, "recipes"));
  for (const d of recipesSnapshot.docs) {
    await deleteDoc(doc(db, "recipes", d.id));
  }
  console.log("Deleted all from Firestore");
}
reset();
