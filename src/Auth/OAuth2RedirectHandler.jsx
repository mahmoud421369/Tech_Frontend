import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");

    if (accessToken) {
      localStorage.setItem("authToken", accessToken);
      navigate("/"); // redirect to home/dashboard
    } else {
      console.error("No access token found in redirect URL");
      navigate("/login");
    }
  }, [navigate]);

  return <p>Logging you in with Google...</p>;
};

export default OAuth2RedirectHandler;