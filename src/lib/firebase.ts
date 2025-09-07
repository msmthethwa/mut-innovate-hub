import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBVOdDDTkz1m0Jj4aqQjhWVSmQW8wZ5fA0",
  authDomain: "mut-innovation-lab-7c4e3.firebaseapp.com",
  projectId: "mut-innovation-lab-7c4e3",
  storageBucket: "mut-innovation-lab-7c4e3.firebasestorage.app",
  messagingSenderId: "828537739190",
  appId: "1:828537739190:web:dfa3920e75f2f159591317",
  measurementId: "G-TCT9M1D8YV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);
