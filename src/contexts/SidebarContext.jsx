import React, { createContext, useContext, useState } from "react";

const SidebarContext = createContext();

export const useSidebarContext = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [secondaryContent, setSecondaryContent] = useState(null);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleMenuClick = (menu, content) => {
    setActiveMenu(menu);
    setSecondaryContent(content);
    setIsCollapsed(true);
  };

  const closeSecondarySidebar = () => {
    setActiveMenu(null);
    setSecondaryContent(null);
  };

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        activeMenu,
        secondaryContent,
        toggleSidebar,
        handleMenuClick,
        closeSecondarySidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};