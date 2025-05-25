import React, { useEffect, useState } from "react";
import { useMapDataContext } from "../../contexts/MapDataContext"; // Import the context
import SecondarySidebar from "../SecondarySidebar/SecondarySidebar";
import "./Sidebar.css";

function Sidebar({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null); // Track the active menu item
  const [secondaryContent, setSecondaryContent] = useState(null); // Track the content for the secondary sidebar
  const { isEditing, setSelectedTask, clearPolylines } = useMapDataContext(); // Access the editing state

  const toggleSidebar = () => {
    if (isEditing) return;

    setIsCollapsed(prev => !prev);
  };

  const handleMenuClick = (menu, content) => {
    if (isEditing) return;

    setActiveMenu(menu); // Open the secondary sidebar for the selected menu
    setSecondaryContent(content); // Set the content for the secondary sidebar
    setIsCollapsed(true); // Collapse the primary sidebar
    setSelectedTask(null); // Clear the selected task in the context
    clearPolylines(); // Clear any existing polylines
  };

  const closeSecondarySidebar = () => {
    setActiveMenu(null); // Close the secondary sidebar
    setSecondaryContent(null); // Clear the content for the secondary sidebar
    setSelectedTask(null); // Clear the selected task in the context
    clearPolylines(); // Clear any existing polylines
  };

  // Automatically collapse the sidebar when in editing mode
  useEffect(() => {
    if (isEditing) {
      closeSecondarySidebar();
      setIsCollapsed(true);
    }
  }, [isEditing]);

  return (
    <div style={{ display: "flex" }}>
      {/* Primary Sidebar */}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-content">
          {/* Toggle Button */}
          <ToggleButton isCollapsed={isCollapsed} onToggle={toggleSidebar} activeMenu={activeMenu} />

          {/* Render Menu Items */}
          <div className="menu">
            {React.Children.map(children, child =>
              React.cloneElement(child, {
                isCollapsed,
                onClick: () => handleMenuClick(child.props.label, child.props.children || child.props.pageComponent)
              })
            )}
          </div>
        </div>
      </div>

      {/* Secondary Sidebar */}
      {activeMenu && (
        <SecondarySidebar onClose={closeSecondarySidebar} title={activeMenu}>
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
