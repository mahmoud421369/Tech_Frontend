// src/pages/SuccessGoogle.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const SuccessGoogle = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const verifyLogin = async () => {
      try {
        const res = await api.get("/api/auth/user"); // this should read cookie automatically
        console.log("Authenticated user:", res.data);

        // Store minimal info in localStorage (not token)
        localStorage.setItem("authToken", JSON.stringify(res.data));

        navigate("/"); // go to home/dashboard
      } catch (error) {
        console.error("User not authenticated:", error);
        navigate("/login");
      }
    };

    verifyLogin();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-semibold">Signing you in...</h2>
    </div>
  );
};

export default SuccessGoogle;