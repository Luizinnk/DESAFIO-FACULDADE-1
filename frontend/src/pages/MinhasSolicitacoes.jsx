import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Icone from '../components/Icone.jsx';
import { Carregando, SeloStatus, TituloPagina, Vazio } from '../components/Comuns.jsx';
import { STATUS, dataBR, horario } from '../util.js';

/** TELA 3 — Meus pedidos: o solicitante acompanha as próprias solicitações. */
export default function MinhasSolicitacoes() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('/solicitacoes').then(setLista).catch((e) => setErro(e.message));
  }, []);

  return (
    <>
      <TituloPagina titulo="Meus pedidos" subtitulo="Acompanhe aqui a situação de cada solicitação.">
        <Link to="/solicitacoes/nova" className="botao botao-primario"><Icone nome="mais" /> Novo pedido</Link>
      </TituloPagina>

      {erro && <div className="caixa-erros">{erro}</div>}
      {!lista && !erro && <Carregando />}
      {lista?.length === 0 && (
        <Vazio titulo="Você ainda não fez nenhum pedido" texto="Comece pedindo o seu primeiro evento."
          acao="Fazer meu primeiro pedido" para="/solicitacoes/nova" />
      )}

      <div className="lista-pedidos">
        {lista?.map((e) => (
          <Link key={e.id} to={`/solicitacoes/${e.id}`} className="cartao-pedido">
            <div className="pedido-topo">
              <SeloStatus status={e.status} />
              <Icone nome="voltar" tamanho={18} />
            </div>
            <h3>{e.nome}</h3>
            <ul className="cartao-info">
              <li><Icone nome="agenda" tamanho={16} /> {e.data ? dataBR(e.data) : 'Data a definir'}</li>
              <li><Icone nome="relogio" tamanho={16} /> {horario(e.horaInicio, e.horaFim)}</li>
              <li><Icone nome="local" tamanho={16} /> {e.local || 'Local a definir'}</li>
            </ul>
            <p className="pedido-dica">{STATUS[e.status].explicacao}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
