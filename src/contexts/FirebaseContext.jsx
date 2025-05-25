import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getDatabase } from "firebase/database";
import React, { createContext, useContext } from "react";

// Create the Firebase context
const FirebaseContext = createContext();

// Create a provider component
export const FirebaseProvider = ({ children, config }) => {
  if (!config) {
    throw new Error("Firebase configuration is required for FirebaseProvider.");
  }

  // Initialize Firebase app and Realtime Database
  const app = initializeApp(config);
  const db = getDatabase(app);
  const auth = getAuth(app);

  // Automatically sign in for testing purposes
  const testEmail = config.testEmail; // Optional test email
  const testPassword = config.testPassword; // Optional test password

  if (testEmail && testPassword) {
    // Sign in with email and password
    signInWithEmailAndPassword(auth, testEmail, testPassword).catch(error => {
      console.error("Error signing in with email and password:", error.message);
    });
  } else {
    console.error("No test email and password provided for automatic sign-in.");
  }

  return <FirebaseContext.Provider value={{ db }}>{children}</FirebaseContext.Provider>;
};

// Custom hook to use the Firebase context
export const useFirebase = () => useContext(FirebaseContext);
