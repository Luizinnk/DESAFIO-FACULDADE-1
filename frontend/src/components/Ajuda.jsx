import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { DUVIDAS, TUTORIAIS, perfilDe } from '../ajuda.js';
import Icone from './Icone.jsx';

// Controla qual ajuda está aberta. Qualquer tela pode abrir um tópico com abrirAjuda('solicitar').
const AjudaContext = createContext({ abrirAjuda: () => {} });

export function AjudaProvider({ children }) {
  const [topico, setTopico] = useState(null);
  const { pathname } = useLocation();
  useEffect(() => { setTopico(null); }, [pathname]); // fecha ao trocar de tela

  return (
    <AjudaContext.Provider value={{ abrirAjuda: setTopico }}>
      {children}
      {topico && <PainelAjuda topico={topico} aoFechar={() => setTopico(null)} trocar={setTopico} />}
    </AjudaContext.Provider>
  );
}

export const useAjuda = () => useContext(AjudaContext);

const tituloDe = (topico) => TUTORIAIS[topico]?.titulo || DUVIDAS[topico]?.pergunta || 'Ajuda';

/** Botão minimalista "?" colocado ao lado de títulos e campos que costumam gerar dúvida. */
export function BotaoAjuda({ topico, claro = false }) {
  const { abrirAjuda } = useAjuda();
  return (
    <button type="button" className={`botao-ajuda ${claro ? 'claro' : ''}`} onClick={() => abrirAjuda(topico)}
      aria-label={`Ajuda: ${tituloDe(topico)}`} title={tituloDe(topico)}>
      ?
    </button>
  );
}

/** Pergunta frequente que abre e fecha (sanfona). */
export function Duvida({ id, aberta = false }) {
  const d = DUVIDAS[id];
  if (!d) return null;
  return (
    <details className="duvida" open={aberta}>
      <summary>{d.pergunta}</summary>
      <p>{d.resposta}</p>
    </details>
  );
}

/** Painel lateral (no celular, sobe de baixo) com o tutorial do tópico e as dúvidas relacionadas. */
function PainelAjuda({ topico, aoFechar, trocar }) {
  const { usuario } = useAuth();
  const perfil = perfilDe(usuario);
  const painel = useRef(null);
  const tutorial = TUTORIAIS[topico];
  const duvida = DUVIDAS[topico];

  // Fecha com Esc e leva o foco para o painel (bom para teclado e leitor de tela)
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', esc);
    painel.current?.focus();
    return () => window.removeEventListener('keydown', esc);
  }, [aoFechar, topico]);

  const acao = tutorial?.acao?.(perfil);
  // Tutoriais que este perfil também pode querer ver
  const outros = Object.entries(TUTORIAIS)
    .filter(([chave, t]) => chave !== topico && t.perfis.includes(perfil)).slice(0, 4);

  return (
    <div className="ajuda-fundo" onClick={aoFechar}>
      <aside className="ajuda-painel" role="dialog" aria-modal="true" aria-labelledby="ajuda-titulo"
        ref={painel} tabIndex={-1} onClick={(e) => e.stopPropagation()}>
        <div className="ajuda-topo">
          <span className="ajuda-selo">{tutorial ? 'Passo a passo' : 'Dúvida frequente'}</span>
          <button className="botao-icone" onClick={aoFechar} aria-label="Fechar ajuda"><Icone nome="x" /></button>
        </div>

        {tutorial && (
          <>
            <h2 id="ajuda-titulo">{tutorial.titulo}</h2>
            <p className="texto-apoio">{tutorial.resumo}</p>
            {!tutorial.perfis.includes(perfil) && (
              <p className="dica-caixa">Esta ação é feita por {tutorial.perfis.includes('ADMIN') && tutorial.perfis.length === 1 ? 'administradores' : 'solicitantes'}.</p>
            )}
            <ol className="ajuda-passos">
              {tutorial.passos(perfil).map((p, i) => <li key={i}>{p}</li>)}
            </ol>
            {acao && (
              <Link to={acao.para} className="botao botao-primario ajuda-acao" onClick={aoFechar}>
                {acao.texto} <Icone nome="voltar" tamanho={18} />
              </Link>
            )}
            {tutorial.duvidas?.length > 0 && (
              <section className="ajuda-bloco">
                <h3>Dúvidas relacionadas</h3>
                {tutorial.duvidas.map((id) => <Duvida key={id} id={id} />)}
              </section>
            )}
          </>
        )}

        {!tutorial && duvida && (
          <>
            <h2 id="ajuda-titulo">{duvida.pergunta}</h2>
            <p className="ajuda-resposta">{duvida.resposta}</p>
          </>
        )}

        {outros.length > 0 && (
          <section className="ajuda-bloco">
            <h3>Outras ajudas</h3>
            <ul className="ajuda-links">
              {outros.map(([chave, t]) => (
                <li key={chave}><button type="button" onClick={() => trocar(chave)}>{t.titulo}</button></li>
              ))}
            </ul>
          </section>
        )}

        <Link to="/ajuda" className="ajuda-tudo" onClick={aoFechar}>Ver toda a ajuda e as dúvidas frequentes →</Link>
      </aside>
    </div>
  );
}
