import { Link } from 'react-router-dom';
import { STATUS } from '../util.js';
import Icone from './Icone.jsx';

/** Selo colorido com o status da solicitação. */
export function SeloStatus({ status }) {
  return <span className={`selo selo-${status}`}>{STATUS[status]?.texto || status}</span>;
}

export function Carregando() {
  return <div className="carregando" aria-busy="true"><span className="girando" /> Carregando…</div>;
}

/** Tela vazia com uma mensagem amigável e, opcionalmente, um botão de ação. */
export function Vazio({ titulo, texto, acao, para }) {
  return (
    <div className="vazio">
      <Icone nome="agenda" tamanho={36} />
      <h3>{titulo}</h3>
      {texto && <p>{texto}</p>}
      {acao && <Link to={para} className="botao botao-primario"><Icone nome="mais" /> {acao}</Link>}
    </div>
  );
}

/** Lista de erros de validação, mostrada no topo do formulário. */
export function CaixaErros({ erros }) {
  if (!erros?.length) return null;
  return (
    <div className="caixa-erros" role="alert">
      <Icone nome="alerta" />
      <div>
        <strong>{erros.length === 1 ? 'Corrija o item abaixo:' : 'Corrija os itens abaixo:'}</strong>
        <ul>{erros.map((e) => <li key={e}>{e}</li>)}</ul>
      </div>
    </div>
  );
}

export function TituloPagina({ titulo, subtitulo, children, voltar }) {
  return (
    <div className="titulo-pagina">
      <div>
        {voltar && <Link to={voltar} className="link-voltar"><Icone nome="voltar" tamanho={18} /> Voltar</Link>}
        <h1>{titulo}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {children && <div className="titulo-acoes">{children}</div>}
    </div>
  );
}
