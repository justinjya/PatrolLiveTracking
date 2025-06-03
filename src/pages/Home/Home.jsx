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
          <span>Memuat...</span>
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
          <MenuItem icon={<FontAwesomeIcon icon={faUserShield} />} label="Patroli">
            <Patrols />
          </MenuItem>
          <MenuItem icon={<FontAwesomeIcon icon={faTriangleExclamation} />} label="Insiden">
            <Incidents />
          </MenuItem>
          <MenuItem icon={<FontAwesomeIcon icon={faVideo} />} label="Kamera">
            <Cameras />
          </MenuItem>
          <MenuItem icon={<FontAwesomeIcon icon={faCity} />} label="Manajemen Tatar">
            <TatarManagement />
          </MenuItem>
        </Sidebar>
      </div>

      {/* Map Legend */}
      {selectedTask && <MapLegend selectedTask={selectedTask} />}
    </div>
  );
}

function MapLegend({ selectedTask }) {
  return (
    <div className="map-legend">
      <strong>Legenda Peta</strong>
      <ul>
        <li>
          <span className="legend-icon" style={{ backgroundColor: "#00EB1A" }}></span> Titk Dikunjungi
        </li>
        <li>
          <span className="legend-icon" style={{ backgroundColor: "#FE2B25" }}></span> Titik Belum Dikunjungi
        </li>
        <li>
          <span className="legend-icon" style={{ backgroundColor: "#9C2CF3" }}></span> Fake GPS
        </li>
        {selectedTask?.status === "ongoing" && (
          <li>
            <span className="legend-icon" style={{ backgroundColor: "#1D1D1D" }}></span> Patroli
          </li>
        )}
        <li>
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="legend-icon transparent"
            style={{ color: "#3535F3" }}
          />{" "}
          Insiden
        </li>
        <li>
          <span className="legend-line" style={{ backgroundColor: "#1264C6" }}></span> Rute Aktual
        </li>
      </ul>
    </div>
  );
}

export default Home;
