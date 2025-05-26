import { APIProvider } from "@vis.gl/react-google-maps";
import React from "react";
import "./App.css";
import { FirebaseProvider } from "./contexts/FirebaseContext";
import { MapDataProvider } from "./contexts/MapDataContext";
import { SidebarProvider } from "./contexts/SidebarContext"; // Import SidebarProvider
import Home from "./pages/Home";

function App() {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    testEmail: import.meta.env.VITE_TEST_EMAIL,
    testPassword: import.meta.env.VITE_TEST_PASSWORD
  };

  return (
    <APIProvider apiKey={API_KEY}>
      <FirebaseProvider config={firebaseConfig}>
        <MapDataProvider>
          <SidebarProvider>
            <Home />
          </SidebarProvider>
        </MapDataProvider>
      </FirebaseProvider>
    </APIProvider>
  );
}

export default App;
