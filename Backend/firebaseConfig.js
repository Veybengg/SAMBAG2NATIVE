import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from "firebase/database";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCW5BXRki65Mun8bqHaQBR5HFLH6x-Bvg0",
  authDomain: "sambag2-8663a.firebaseapp.com",
  databaseURL: "https://sambag2-8663a-default-rtdb.firebaseio.com",
  projectId: "sambag2-8663a",
  storageBucket: "sambag2-8663a.appspot.com",
  messagingSenderId: "991681556862",
  appId: "1:991681556862:web:2f7b091f8769b91b88432f",
  measurementId: "G-8Y93F193D1"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize other Firebase services
const database = getDatabase(app);
let analytics;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});

export { app, auth, database, analytics };