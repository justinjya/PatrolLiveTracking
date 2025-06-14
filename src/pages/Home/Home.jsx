import {
  faCircleNotch,
  faCity,
  faTriangleExclamation,
  faUserShield,
  faVideo,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
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
  const { loading, initialized, isEditing, setIsEditing, selectedCluster, setTempPatrolPoints, selectedTask } =
    useMapDataContext();

  return (
    <div>
      {/* Global Loading Spinner */}
      {loading && (
        <div className="loading-overlay">
          <FontAwesomeIcon icon={faCircleNotch} size="2x" spin />
          {!initialized && <span>Memuat...</span>}
        </div>
      )}

      <InteractiveMap />

      {/* Editing Indicator */}
      {isEditing && (
        <EditingIndicator
          isEditing={isEditing}
          onClose={() => {
            setIsEditing(null);
            setTempPatrolPoints(selectedCluster ? selectedCluster.cluster_coordinates : []); // Clear temporary patrol points when editing is closed
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

function EditingIndicator({ isEditing, onClose }) {
  const isEditingLabels = {
    Cameras: "Kamera",
    "Patrol Points": "Patroli"
  };

  return (
    <div className="editing-indicator">
      <span className="editing-text">Sedang Mengedit Titik {isEditingLabels[isEditing]}</span>
      <button className="editing-indicator-close-button" onClick={onClose}>
        <FontAwesomeIcon icon={faXmark} />
      </button>
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
