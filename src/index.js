import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GoogleOAuthProvider } from "@react-oauth/google";
import './i18n';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
   <React.StrictMode>
      <GoogleOAuthProvider clientId="679059889469-e0ea05skqoo139i6vmcr6bq4j8vu7b9r.apps.googleusercontent.com">
      
      <App />

    </GoogleOAuthProvider>

    {/* <AuthProvider>
      <App />
    </AuthProvider> */}
  </React.StrictMode>
);


reportWebVitals();
