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
  const { isEditing, setIsEditing, initialized, selectedTask } = useMapDataContext(); // Access selectedTask from context

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
      {isEditing && (
        <EditingIndicator
          isEditing={isEditing}
          onClose={() => {
            setIsEditing(null);
          }}
        />
      )}

      {/* Sidebar */}
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

      {/* Map Legend */}
      {selectedTask && <MapLegend />}
    </div>
  );
}

function MapLegend() {
  return (
    <div className="map-legend">
      <strong>Map Legend</strong>
      <ul>
        <li>
          <span className="legend-icon" style={{ backgroundColor: "#00EB1A" }}></span> Intersected Route
        </li>
        <li>
          <span className="legend-icon" style={{ backgroundColor: "#FE2B25" }}></span> Non-Intersected Route
        </li>
        <li>
          <span className="legend-icon" style={{ backgroundColor: "#9C2CF3" }}></span> Mock Location Detected
        </li>
        <li>
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="legend-icon transparent"
            style={{ color: "#3535F3" }}
          />{" "}
          Incident
        </li>
        <li>
          <span className="legend-line" style={{ backgroundColor: "#1264C6" }}></span> Route Taken
        </li>
      </ul>
    </div>
  );
}

export default Home;
