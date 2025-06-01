import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMap } from "@vis.gl/react-google-maps";
import React from "react";
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
    <div className="cameras-container">
      <div className="cameras-header">
        <h3 className="cameras-title">List of Cameras</h3>
        <button className="edit-cameras-button" onClick={handleEditClick}>
          Edit Cameras
        </button>
      </div>
      <div className="camera-list">
        {markers.cameras.map(camera => (
          <div key={camera.id} className="camera-item">
            <div className="camera-item-header">
              <span className="camera-id">ID: {camera.id}</span>
              <div>
                <button className="camera-item-view-on-map-button" onClick={() => handleViewClick(camera)}>
                  View on Map
                </button>
              </div>
            </div>
            <span className="camera-coordinates">
              <FontAwesomeIcon icon={faLocationDot} style={{ color: "#0B64C6" }} />
              &nbsp;&nbsp;&nbsp;
              {camera.lat.toFixed(5)}, {camera.lng.toFixed(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Cameras;
