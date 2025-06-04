import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getDatabase } from "firebase/database";
import React, { createContext, useContext, useEffect, useState } from "react";

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

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is already authenticated
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        setIsAuthenticated(true); // User is authenticated
      } else {
        const testEmail = config.testEmail; // Optional test email
        const testPassword = config.testPassword; // Optional test password

        if (testEmail && testPassword) {
          // Sign in with email and password
          signInWithEmailAndPassword(auth, testEmail, testPassword)
            .then(() => setIsAuthenticated(true))
            .catch(error => {
              console.error("Error signing in with email and password:", error.message);
            });
        } else {
          console.error("No test email and password provided for automatic sign-in.");
        }
      }
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, [auth, config]);

  return <FirebaseContext.Provider value={{ db, isAuthenticated }}>{children}</FirebaseContext.Provider>;
};

// Custom hook to use the Firebase context
export const useFirebase = () => useContext(FirebaseContext);
