import { APIProvider } from "@vis.gl/react-google-maps";
import React from "react";
import "./App.css";
import { LocationProvider } from "./contexts/LocationContext";
import Home from "./pages/Home";

function App() {
  const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <APIProvider apiKey={API_KEY}>
      <LocationProvider>
        <Home />
      </LocationProvider>
    </APIProvider>
  );
}

export default App;
