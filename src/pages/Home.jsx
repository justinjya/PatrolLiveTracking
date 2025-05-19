import React from "react";
import InteractiveMap from "../components/InteractiveMap";
import Sidebar from "../components/Sidebar";

function Home() {
  return (
    <div>
      <InteractiveMap />

      <div style={{ position: "fixed", top: 0, left: 0 }}>
        <Sidebar />
      </div>
    </div>
  );
}

export default Home;
