import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAEBPh0p2IMyjP4EJY6e0nLI2oHrdCLc9c",
  authDomain: "gerenciador-de-compras-60050.firebaseapp.com",
  projectId: "gerenciador-de-compras-60050",
  storageBucket: "gerenciador-de-compras-60050.appspot.com",
  messagingSenderId: "716525622090",
  appId: "1:716525622090:web:ac8b7ee2a6161e907467b3",
  measurementId: "G-B45SQ851SZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
