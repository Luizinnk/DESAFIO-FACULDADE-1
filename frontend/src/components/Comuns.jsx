import { Link } from 'react-router-dom';
import { STATUS } from '../util.js';
import Icone from './Icone.jsx';
import { BotaoAjuda } from './Ajuda.jsx';

/** Selo colorido com o status da solicitação. */
export function SeloStatus({ status }) {
  return <span className={`selo selo-${status}`}>{STATUS[status]?.texto || status}</span>;
}

export function Carregando() {
  return <div className="carregando" aria-busy="true"><span className="girando" /> Carregando…</div>;
}

/** Cartões "fantasma" enquanto a lista carrega (evita a tela vazia). */
export function Esqueleto({ quantidade = 3 }) {
  return (
    <div className="lista-pedidos" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: quantidade }, (_, i) => (
        <div key={i} className="esqueleto">
          <span className="linha curta" /><span className="linha" /><span className="linha media" /><span className="linha media" />
        </div>
      ))}
    </div>
  );
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

export function TituloPagina({ titulo, subtitulo, children, voltar, ajuda }) {
  return (
    <div className="titulo-pagina">
      <div>
        {voltar && <Link to={voltar} className="link-voltar"><Icone nome="voltar" tamanho={18} /> Voltar</Link>}
        <h1>{titulo}{ajuda && <BotaoAjuda topico={ajuda} />}</h1>
        {subtitulo && <p>{subtitulo}</p>}
      </div>
      {children && <div className="titulo-acoes">{children}</div>}
    </div>
  );
}
