import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

// Guarda quem está logado e deixa disponível para todas as telas.
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api('/auth/eu')
      .then((r) => setUsuario(r.usuario || null))
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false));
  }, []);

  async function entrar(email, senha) {
    const u = await api('/auth/login', { metodo: 'POST', corpo: { email, senha } });
    setUsuario(u);
    return u;
  }

  async function sair() {
    await api('/auth/logout', { metodo: 'POST' });
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
