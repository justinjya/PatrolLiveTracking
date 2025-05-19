import React, { useState } from "react";
import "./Sidebar.css";

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); // Track the active menu item

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const handleMenuClick = menu => {
    setActiveMenu(menu); // Open the secondary sidebar for the selected menu
    setIsCollapsed(true); // Collapse the primary sidebar
  };

  const closeSecondarySidebar = () => {
    setActiveMenu(null); // Close the secondary sidebar
  };

  return (
    <div style={{ display: "flex" }}>
      {/* Primary Sidebar */}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-content">
          {/* Toggle Button */}
          <ToggleButton isCollapsed={isCollapsed} onToggle={toggleSidebar} activeMenu={activeMenu} />

          {/* Sidebar Menu */}
          <div className="menu">
            <MenuItem
              icon="➕"
              label="Add Patrol Route"
              isCollapsed={isCollapsed}
              onClick={() => handleMenuClick("addPatrolRoute")}
            />
            <MenuItem
              icon="👮"
              label="Patrols"
              isCollapsed={isCollapsed}
              onClick={() => handleMenuClick("patrols")}
            />
            <MenuItem
              icon="⚠️"
              label="Incidents"
              isCollapsed={isCollapsed}
              onClick={() => handleMenuClick("incidents")}
            />
          </div>

          {/* Spacer */}
          <div className="spacer"></div>

          {/* Bottom Element */}
          <MenuItem icon="⚙️" label="Settings" isCollapsed={isCollapsed} onClick={() => handleMenuClick("settings")} />
        </div>
      </div>

      {/* Secondary Sidebar */}
      {activeMenu && (
        <div className="secondary-sidebar">
          <div className="secondary-sidebar-content">
            <button className="close-button" onClick={closeSecondarySidebar}>
              X
            </button>
            <div className="secondary-sidebar-header">
              <h3>{activeMenu}</h3>
            </div>
            <p>Details for {activeMenu}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleButton({ isCollapsed, onToggle, activeMenu }) {
  return (
    <div className="toggle-button-container">
      <button
        className="toggle-button"
        onClick={onToggle}
        style={{ visibility: activeMenu ? "hidden" : "visible" }} // Hide button if there's an active menu
      >
        {isCollapsed ? ">" : "X"}
      </button>
    </div>
  );
}

function MenuItem({ icon, label, isCollapsed, onClick }) {
  return (
    <div className="menu-item" onClick={onClick}>
      <span className="menu-icon">{icon}</span>
      {!isCollapsed && <span className="menu-label">{label}</span>}
    </div>
  );
}

export default Sidebar;
