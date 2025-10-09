import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessGoogle = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the access_token cookie is present (indirectly via backend validation)
    // Since the cookie is HttpOnly, we can't access it directly in JavaScript
    fetch('http://localhost:8080/api/auth/test-cookie', {
      method: 'GET',
      credentials: 'include', // Include cookies in the request
    })
      .then((response) => {
        if (response.ok) {
          navigate('/');
        } else {
          // Handle authentication failure
          console.error('Authentication failed');
          navigate('/login');
        }
      })
      .catch((error) => {
        console.error('Error verifying authentication:', error);
        navigate('/login');
      });
  }, [navigate]);

  return (
    <div>
      <h2>Authentication Successful</h2>
      <p>Redirecting to your dashboard...</p>
    </div>
  );
};

export default SuccessGoogle;