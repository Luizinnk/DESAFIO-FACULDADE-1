import { createContext, useCallback, useContext, useState } from 'react';
import Icone from './Icone.jsx';

// Mensagens rápidas ("toast") que aparecem e somem sozinhas após uma ação.
const AvisosContext = createContext(() => {});

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);

  const avisar = useCallback((texto, tipo = 'sucesso') => {
    const id = Date.now() + Math.random();
    setAvisos((lista) => [...lista, { id, texto, tipo }]);
    setTimeout(() => setAvisos((lista) => lista.filter((a) => a.id !== id)), 4500);
  }, []);

  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((a) => (
          <div key={a.id} className={`aviso-flutuante ${a.tipo}`}>
            <Icone nome={a.tipo === 'erro' ? 'alerta' : 'check'} />
            <span>{a.texto}</span>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  );
}

export const useAvisos = () => useContext(AvisosContext);
