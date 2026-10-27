import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdminToken, isTokenExpired } from "../../common/utils/adminAuth";

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("authToken");

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("authToken");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!isAdminToken(token)) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
};

export default AdminRoute;