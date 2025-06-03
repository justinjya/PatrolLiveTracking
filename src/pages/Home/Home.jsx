import { faCity, faTriangleExclamation, faUserShield, faVideo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  const { isEditing, setIsEditing, initialized } = useMapDataContext();

  return (
    <div>
      {!initialized && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}

      <InteractiveMap />

      {/* Editing Indicator */}
      {isEditing && <EditingIndicator isEditing={isEditing} onClose={() => {
        setIsEditing(null);
      }} />}

      <div style={{ position: "fixed", top: 0, left: 0 }}>
        <Sidebar>
          <MenuItem icon={<FontAwesomeIcon icon={faUserShield} />} label="Patrols">
            <Patrols />
          </MenuItem>
          <MenuItem icon={<FontAwesomeIcon icon={faTriangleExclamation} />} label="Incidents">
            <Incidents />
          </MenuItem>
          <MenuItem icon={<FontAwesomeIcon icon={faVideo} />} label="Cameras">
            <Cameras />
          </MenuItem>
          <MenuItem icon={<FontAwesomeIcon icon={faCity} />} label="Tatar Management">
            <TatarManagement />
          </MenuItem>
        </Sidebar>
      </div>
    </div>
  );
}

function EditingIndicator({ isEditing, onClose }) {
  return (
    <div className="editing-indicator">
      <span>Editing {isEditing} Location</span>
      <button className="editing-indicator-close-button" onClick={onClose}>
        X
      </button>
    </div>
  );
}

export default Home;
