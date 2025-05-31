import React from "react";
import InteractiveMap from "../../components/InteractiveMap/InteractiveMap";
import { MenuItem, Sidebar } from "../../components/Sidebar/Sidebar";
import { useMapDataContext } from "../../contexts/MapDataContext";
import Cameras from "../Cameras/Cameras";
import Incidents from "../Incidents/Incidents";
import Patrols from "../Patrols/Patrols";
import TatarManagement from "../TatarManagement/TatarMangement";
import "./Home.css";

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
    <div className="editing-indicator">
      <span>Editing</span>
      <button className="editing-indicator-close-button" onClick={onClose}>
        X
      </button>
    </div>
  );
}

export default Home;
