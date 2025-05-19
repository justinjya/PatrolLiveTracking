import React from "react";
import InteractiveMap from "../components/InteractiveMap/InteractiveMap";
import { MenuItem, Sidebar } from "../components/Sidebar/Sidebar";

function Home() {
  return (
    <div>
      <InteractiveMap />

      <div style={{ position: "fixed", top: 0, left: 0 }}>
        <Sidebar>
          <MenuItem icon="➕" label="Add Patrol Route">
            <p>Add Patrol Route Page</p>
          </MenuItem>
          <MenuItem icon="👮" label="Patrols">
            <p>Patrols Page</p>
          </MenuItem>
          <MenuItem icon="⚠️" label="Incidents">
            <p>Incidents Page</p>
          </MenuItem>
          <MenuItem icon="⚙️" label="Settings">
            <p>Settings Page</p>
          </MenuItem>
        </Sidebar>
      </div>
    </div>
  );
}

export default Home;
