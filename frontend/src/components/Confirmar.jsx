import { useEffect } from 'react';

/** Janela de confirmação para ações que não têm volta (excluir, cancelar...). */
export default function Confirmar({ aberto, titulo, mensagem, textoConfirmar, perigo, aoConfirmar, aoFechar, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && aoFechar();
    if (aberto) window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aberto, aoFechar]);

  if (!aberto) return null;
  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" onClick={(e) => e.stopPropagation()}>
        <h2 id="modal-titulo">{titulo}</h2>
        {mensagem && <p>{mensagem}</p>}
        {children}
        <div className="modal-acoes">
          <button className="botao botao-secundario" onClick={aoFechar}>Voltar</button>
          <button className={`botao ${perigo ? 'botao-perigo' : 'botao-primario'}`} onClick={aoConfirmar}>{textoConfirmar}</button>
        </div>
      </div>
    </div>
  );
}
