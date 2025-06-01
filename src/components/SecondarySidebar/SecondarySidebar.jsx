import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import "./SecondarySidebar.css";

function SecondarySidebar({ activeMenu, onClose, children }) {
  return (
      <div className={`secondary-sidebar ${activeMenu ? "active" : ""}`}>
        <div className="secondary-sidebar-content">
          <div className="secondary-sidebar-header">
            <button className="close-button" onClick={onClose}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          {children}
        </div>
      </div>
  );
}

export default SecondarySidebar;
