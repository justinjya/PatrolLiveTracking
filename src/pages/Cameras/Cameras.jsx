import { useMap } from "@vis.gl/react-google-maps";
import React from "react";
import ExpandableMenu from "../../components/ExpandableMenu/ExpandableMenu";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./Cameras.css";

function Cameras() {
  const { markers, setIsEditing } = useMapDataContext();
  const map = useMap();

  const handleEditClick = () => {
    setIsEditing(true); // Enable edit mode
  };

  const handleViewClick = camera => {
    map.setCenter({ lat: camera.lat, lng: camera.lng }); // Move map center to camera location
    map.setZoom(15); // Zoom in a bit
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", paddingBottom: "40px", gap: "10px" }}>
      <h3 style={{ textAlign: "start", margin: 0 }}>List of Cameras</h3>
      <div style={{ flexDirection: "row", alignSelf: "flex-end" }}>
        <ExpandableMenu icon="⚙️">
          <button className="icon-button" onClick={handleEditClick}>
            Edit
          </button>
        </ExpandableMenu>
      </div>
      <ul className="camera-list">
        {markers.cameras.map(camera => (
          <li key={camera.id} className="camera-item">
            <span>Camera ID: {camera.id}</span>
            <button className="view-map-button" onClick={() => handleViewClick(camera)}>
              View on Map
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Cameras;
