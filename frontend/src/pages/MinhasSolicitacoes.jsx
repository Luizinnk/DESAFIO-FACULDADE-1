import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Icone from '../components/Icone.jsx';
import { Esqueleto, SeloStatus, TituloPagina, Vazio } from '../components/Comuns.jsx';
import { STATUS, dataBR, horario } from '../util.js';

const ABAS = [
  { chave: '', texto: 'Todos' },
  { chave: 'RASCUNHO', texto: 'Rascunhos' },
  { chave: 'AGUARDANDO', texto: 'Em análise' },
  { chave: 'APROVADO', texto: 'Aprovados' },
  { chave: 'REJEITADO', texto: 'Rejeitados' },
  { chave: 'CANCELADO', texto: 'Cancelados' },
];

/** TELA 3 — Meus pedidos: o solicitante acompanha as próprias solicitações. */
export default function MinhasSolicitacoes() {
  const [lista, setLista] = useState(null);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState('');

  useEffect(() => {
    api('/solicitacoes').then(setLista).catch((e) => setErro(e.message));
  }, []);

  const conta = (chave) => (lista || []).filter((e) => !chave || e.status === chave).length;
  const visiveis = (lista || []).filter((e) => !aba || e.status === aba);

  return (
    <>
      <TituloPagina titulo="Meus pedidos" ajuda="acompanhar" subtitulo="Acompanhe aqui a situação de cada solicitação.">
        <Link to="/solicitacoes/nova" className="botao botao-primario"><Icone nome="mais" /> Novo pedido</Link>
      </TituloPagina>

      {lista?.length > 0 && (
        <nav className="abas" aria-label="Filtrar pedidos">
          {ABAS.filter((a) => !a.chave || conta(a.chave) > 0).map((a) => (
            <button key={a.chave} className={aba === a.chave ? 'ativa' : ''} onClick={() => setAba(a.chave)} aria-pressed={aba === a.chave}>
              {a.texto} <span className="aba-numero">{conta(a.chave)}</span>
            </button>
          ))}
        </nav>
      )}

      {erro && <div className="caixa-erros">{erro}</div>}
      {!lista && !erro && <Esqueleto />}
      {lista?.length === 0 && (
        <Vazio titulo="Você ainda não fez nenhum pedido" texto="Comece pedindo o seu primeiro evento."
          acao="Fazer meu primeiro pedido" para="/solicitacoes/nova" />
      )}

      <div className="lista-pedidos">
        {visiveis.map((e) => (
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
