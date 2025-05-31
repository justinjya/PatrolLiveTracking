import React from "react";
import InteractiveMap from "../components/InteractiveMap/InteractiveMap";
import { MenuItem, Sidebar } from "../components/Sidebar/Sidebar";
import { useMapDataContext } from "../contexts/MapDataContext";
import Cameras from "./Cameras/Cameras";
import Incidents from "./Incidents/Incidents";
import Patrols from "./Patrols/Patrols";
import TatarManagement from "./TatarManagement/TatarMangement";

function Home() {
  const { isEditing, setIsEditing } = useMapDataContext();

  return (
    <div>
      <InteractiveMap />

      {/* Editing Indicator */}
      {isEditing && <EditingIndicator onClose={() => setIsEditing(false)} />}

      <div style={{ position: "fixed", top: 0, left: 0 }}>
        <Sidebar>
          <MenuItem icon="👮" label="Patrols">
            <Patrols />
          </MenuItem>
          <MenuItem icon="⚠️" label="Incidents">
            <Incidents />
          </MenuItem>
          <MenuItem icon="📷" label="Cameras">
            <Cameras />
          </MenuItem>
          <MenuItem icon="🏢" label="Tatar Management">
            <TatarManagement />
          </MenuItem>
        </Sidebar>
      </div>
    </div>
  );
}

function EditingIndicator({ onClose }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "pink",
        padding: "10px 20px",
        borderRadius: "5px",
        fontWeight: "bold",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px"
      }}
    >
      <span>Editing</span>
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "black",
          cursor: "pointer",
          padding: 0
        }}
      >
        X
      </button>
    </div>
  );
}

export default Home;
