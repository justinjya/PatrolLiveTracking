import React from "react";
import { useSidebarContext } from "../../contexts/SidebarContext"; // Import the context
import SecondarySidebar from "../SecondarySidebar/SecondarySidebar";
import "./Sidebar.css";
import { useMapDataContext } from "../../contexts/MapDataContext";

function Sidebar({ children }) {
  const {
    isCollapsed,
    activeMenu,
    secondaryContent,
    toggleSidebar,
    handleMenuClick,
    closeSecondarySidebar,
  } = useSidebarContext();
  const { setSelectedIncident } = useMapDataContext(); // Import setSelectedIncident from MapDataContext

  return (
    <div style={{ display: "flex" }}>
      {/* Primary Sidebar */}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-content">
          {/* Toggle Button */}
          <ToggleButton isCollapsed={isCollapsed} onToggle={toggleSidebar} activeMenu={activeMenu} />

          {/* Render Menu Items */}
          <div className="menu">
            {React.Children.map(children, (child) =>
              React.cloneElement(child, {
                isCollapsed,
                onClick: () =>
                  handleMenuClick(child.props.label, child.props.children || child.props.pageComponent),
              })
            )}
          </div>
        </div>
      </div>

      {/* Secondary Sidebar */}
      {activeMenu && (
        <SecondarySidebar onClose={() => {
          closeSecondarySidebar();
          setSelectedIncident(null); // Reset selected incident when closing the sidebar
        }} title={activeMenu}>
          {secondaryContent}
        </SecondarySidebar>
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

export { MenuItem, Sidebar };