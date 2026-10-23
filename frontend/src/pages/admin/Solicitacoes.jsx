import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import Icone from '../../components/Icone.jsx';
import { Esqueleto, TituloPagina } from '../../components/Comuns.jsx';
import { STATUS, dataBR, horario } from '../../util.js';

const ABAS = ['AGUARDANDO', 'APROVADO', 'REJEITADO', 'CANCELADO'];
const normalizar = (t = '') => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const espera = (dias) => (dias <= 0 ? 'chegou hoje' : dias === 1 ? 'espera há 1 dia' : `espera há ${dias} dias`);

/** TELA 6 — Pedidos para o administrador, separados por status. */
export default function Solicitacoes() {
  const [params, setParams] = useSearchParams();
  const status = ABAS.includes(params.get('status')) ? params.get('status') : 'AGUARDANDO';
  const [lista, setLista] = useState(null);
  const [contagem, setContagem] = useState({});
  const [busca, setBusca] = useState('');

  useEffect(() => {
    setLista(null);
    api(`/admin/solicitacoes?status=${status}`).then(setLista).catch(() => setLista([]));
    api('/admin/solicitacoes/contagem').then(setContagem).catch(() => {});
  }, [status]);

  const filtrados = (lista || []).filter(({ evento: e }) =>
    !busca || normalizar(`${e.nome} ${e.solicitante} ${e.local}`).includes(normalizar(busca)));

  return (
    <>
      <TituloPagina titulo="Solicitações" ajuda="analisar" subtitulo="Analise os pedidos e publique os eventos na agenda." />
      <nav className="abas" aria-label="Filtrar por status">
        {ABAS.map((s) => (
          <button key={s} className={s === status ? 'ativa' : ''} onClick={() => setParams({ status: s })} aria-pressed={s === status}>
            {STATUS[s].texto} <span className="aba-numero">{contagem[s] ?? '…'}</span>
          </button>
        ))}
      </nav>

      {lista?.length > 0 && (
        <label className="busca busca-larga">
          <Icone nome="busca" />
          <span className="sr-only">Buscar pedido</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por evento, solicitante ou local" />
        </label>
      )}

      {!lista && <Esqueleto />}
      {lista && filtrados.length === 0 && (
        <div className="vazio"><Icone nome="check" tamanho={36} />
          <h3>{busca ? 'Nenhum pedido encontrado com essa busca'
            : status === 'AGUARDANDO' ? 'Nenhum pedido esperando análise' : `Nenhum pedido "${STATUS[status].texto.toLowerCase()}"`}</h3>
        </div>
      )}

      <div className="lista-pedidos">
        {filtrados.map(({ evento: e, conflito, diasEsperando }) => (
          <Link key={e.id} to={`/admin/solicitacoes/${e.id}`} className={`cartao-pedido ${conflito ? 'com-conflito' : ''}`}>
            <div className="pedido-topo">
              <span className="etiqueta">{e.tema}</span>
              {status === 'AGUARDANDO' && <small className={diasEsperando >= 3 ? 'texto-alerta' : ''}>{espera(diasEsperando)}</small>}
            </div>
            <h3>{e.nome}</h3>
            <ul className="cartao-info">
              <li><Icone nome="agenda" tamanho={16} /> {dataBR(e.data)}</li>
              <li><Icone nome="relogio" tamanho={16} /> {horario(e.horaInicio, e.horaFim)}</li>
              <li><Icone nome="local" tamanho={16} /> {e.local}</li>
              <li><Icone nome="pessoa" tamanho={16} /> <span><span className="rotulo-info">Solicitante:</span> {e.solicitante}</span></li>
            </ul>
            {conflito && <p className="aviso-card"><Icone nome="alerta" tamanho={16} /> Conflita com {conflito}</p>}
            {status === 'AGUARDANDO' && <span className="pedido-chamada">Analisar pedido →</span>}
          </Link>
        ))}
      </div>
    </>
  );
}
