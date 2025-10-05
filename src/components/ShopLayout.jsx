
import React, { useState, useEffect } from "react";
import ShopHeader from "../Shop/ShopHeader";

const ShopLayout = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);


  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved) setDarkMode(saved === "true");
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      localStorage.setItem("darkMode", !prev);
      return !prev;
    });
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <ShopHeader darkMode={darkMode} setDarkMode={toggleDarkMode} />
      <main
        className={`transition-all w-full duration-300 min-h-screen ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default ShopLayout;