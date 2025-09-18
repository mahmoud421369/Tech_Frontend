import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthSuccess = ({ setAuth }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("access_token");

    if (token) {
      localStorage.setItem("access_token", token); // store token
      setAuth(true); // update state to authenticated
      navigate("/home"); // redirect to home page
    } else {
      navigate("/login");
    }
  }, [location, navigate, setAuth]);

  return <p>Loading...</p>;
};

export default AuthSuccess;