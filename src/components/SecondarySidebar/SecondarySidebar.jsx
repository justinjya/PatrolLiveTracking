import React from "react";
import "./SecondarySidebar.css";

function SecondarySidebar({ onClose, children }) {
  return (
    <div className="secondary-sidebar">
      <div className="secondary-sidebar-content">
        <div className="secondary-sidebar-header">
          <button className="close-button" onClick={onClose}>
            X
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default SecondarySidebar;