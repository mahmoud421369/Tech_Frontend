import React, { useState } from "react";
import { FiUser, FiLogOut } from "react-icons/fi";

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-blue-500 to-blue-700 shadow-md p-4 flex justify-between items-center">
      <h1 className="text-white font-bold text-xl">Tech&Restore</h1>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-md"
        >
          <FiUser className="text-blue-600" size={20} />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg p-2">
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left">
              <FiUser /> Profile
            </button>
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 w-full text-left">
              <FiLogOut /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;