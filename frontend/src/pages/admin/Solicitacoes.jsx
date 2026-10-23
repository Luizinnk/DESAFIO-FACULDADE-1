import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api.js';
import Icone from '../../components/Icone.jsx';
import { Carregando, TituloPagina } from '../../components/Comuns.jsx';
import { STATUS, dataBR, horario } from '../../util.js';

const ABAS = ['AGUARDANDO', 'APROVADO', 'REJEITADO', 'CANCELADO'];

/** TELA 6 — Painel do administrador: pedidos separados por status. */
export default function Solicitacoes() {
  const [params, setParams] = useSearchParams();
  const status = ABAS.includes(params.get('status')) ? params.get('status') : 'AGUARDANDO';
  const [lista, setLista] = useState(null);

  useEffect(() => {
    setLista(null);
    api(`/admin/solicitacoes?status=${status}`).then(setLista).catch(() => setLista([]));
  }, [status]);

  return (
    <>
      <TituloPagina titulo="Solicitações" subtitulo="Analise os pedidos e publique os eventos na agenda." />
      <nav className="abas" aria-label="Filtrar por status">
        {ABAS.map((s) => (
          <button key={s} className={s === status ? 'ativa' : ''} onClick={() => setParams({ status: s })}>
            {STATUS[s].texto}
          </button>
        ))}
      </nav>

      {!lista && <Carregando />}
      {lista?.length === 0 && (
        <div className="vazio"><Icone nome="check" tamanho={36} />
          <h3>{status === 'AGUARDANDO' ? 'Nenhum pedido esperando análise' : `Nenhum pedido "${STATUS[status].texto.toLowerCase()}"`}</h3>
        </div>
      )}

      <div className="lista-pedidos">
        {lista?.map((e) => (
          <Link key={e.id} to={`/admin/solicitacoes/${e.id}`} className="cartao-pedido">
            <div className="pedido-topo"><span className="etiqueta">{e.tema}</span><Icone nome="voltar" tamanho={18} /></div>
            <h3>{e.nome}</h3>
            <ul className="cartao-info">
              <li><Icone nome="agenda" tamanho={16} /> {dataBR(e.data)}</li>
              <li><Icone nome="relogio" tamanho={16} /> {horario(e.horaInicio, e.horaFim)}</li>
              <li><Icone nome="local" tamanho={16} /> {e.local}</li>
              <li><Icone nome="pessoa" tamanho={16} /> {e.solicitante}</li>
            </ul>
            {status === 'AGUARDANDO' && <span className="pedido-chamada">Analisar pedido →</span>}
          </Link>
        ))}
      </div>
    </>
  );
}
