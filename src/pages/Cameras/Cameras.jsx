import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMap } from "@vis.gl/react-google-maps";
import React from "react";
import { useMapDataContext } from "../../contexts/MapDataContext";
import "./Cameras.css";

function Cameras() {
  const { markers, isEditing, setIsEditing, setSelectedCamera } = useMapDataContext();
  const map = useMap();

  const handleEditClick = () => {
    if (isEditing === "Cameras") {
      setIsEditing(null); // Disable edit mode
      return;
    }

    // If not in edit mode, enable it
    setIsEditing("Cameras"); // Enable edit mode
  };

  const handleViewClick = camera => {
    map.setCenter({ lat: camera.lat, lng: camera.lng }); // Move map center to camera location
    map.setZoom(17); // Zoom in a bit
    setSelectedCamera(camera); // Set the selected camera in context
  };

  return (
    <div className="cameras-container">
      <div className="cameras-header">
        <h3 className="cameras-title">Daftar Kamera</h3>
        <button className="edit-cameras-button" onClick={handleEditClick}>
          {isEditing === "Cameras" ? "Selesai Mengedit" : "Edit Kamera"}
        </button>
      </div>
      <span className="edit-cameras-hint">
        Klik pada peta untuk menambahkan atau menghapus titik kamera.
      </span>
      <div className="camera-list">
        {markers.cameras.map(camera => (
          <div key={camera.id} className="camera-item">
            <div className="camera-item-details">
              <span className="camera-name">{camera.name}</span>
              <span className="camera-coordinates">
                <FontAwesomeIcon icon={faLocationDot} />
                &nbsp;&nbsp;&nbsp;
                {camera.lat.toFixed(5)}, {camera.lng.toFixed(5)}
              </span>
            </div>
            <div className="camera-actions">
              <button className="camera-item-view-on-map-button" onClick={() => handleViewClick(camera)}>
                Lihat di Peta
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Cameras;
