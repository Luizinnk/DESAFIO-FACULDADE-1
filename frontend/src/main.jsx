import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './auth.jsx';
import { AvisosProvider } from './components/Avisos.jsx';
import { AjudaProvider } from './components/Ajuda.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AvisosProvider>
          <AjudaProvider>
            <App />
          </AjudaProvider>
        </AvisosProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
