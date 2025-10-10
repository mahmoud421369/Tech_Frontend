import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
   <React.StrictMode>
      <GoogleOAuthProvider clientId="679059889469-e0ea05skqoo139i6vmcr6bq4j8vu7b9r.apps.googleusercontent.com">
        <AuthProvider>
      <App />
    </AuthProvider>
    </GoogleOAuthProvider>

    {/* <AuthProvider>
      <App />
    </AuthProvider> */}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
