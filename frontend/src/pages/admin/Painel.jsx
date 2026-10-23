import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import Icone from '../../components/Icone.jsx';
import { Esqueleto, TituloPagina } from '../../components/Comuns.jsx';
import { dataBR } from '../../util.js';

/** Tela inicial do administrador: o que precisa de atenção hoje. */
export default function Painel() {
  const { usuario } = useAuth();
  const [painel, setPainel] = useState(null);

  useEffect(() => { api('/admin/painel').then(setPainel).catch(() => setPainel(null)); }, []);

  return (
    <>
      <TituloPagina titulo={`Olá, ${usuario.nome.split(' ')[0]}`} subtitulo="Veja o que precisa da sua atenção." ajuda="analisar" />

      {!painel && <Esqueleto quantidade={3} />}
      {painel && (
        <>
          <div className="indicadores">
            <Link to="/admin/solicitacoes" className={`indicador ${painel.aguardando ? 'destaque-amarelo' : ''}`}>
              <strong>{painel.aguardando}</strong><span>pedido(s) aguardando análise</span>
            </Link>
            <Link to="/admin/solicitacoes" className={`indicador ${painel.comConflito ? 'destaque-vermelho' : ''}`}>
              <strong>{painel.comConflito}</strong><span>pedido(s) com conflito de horário</span>
            </Link>
            <Link to="/admin/ocupacao" className="indicador">
              <strong>{painel.estaSemana}</strong><span>evento(s) aprovado(s) nesta semana</span>
            </Link>
          </div>

          <div className="duas-colunas-iguais">
            <section className="cartao">
              <h2 className="titulo-cartao"><Icone nome="alerta" /> Urgentes: acontecem em até 7 dias</h2>
              {painel.urgentes.length === 0
                ? <p className="texto-apoio">Nenhum pedido urgente esperando análise.</p>
                : <ListaPainel itens={painel.urgentes} para={(i) => `/admin/solicitacoes/${i.id}`} />}
            </section>
            <section className="cartao">
              <h2 className="titulo-cartao"><Icone nome="agenda" /> Próximos 7 dias na agenda</h2>
              {painel.proximos.length === 0
                ? <p className="texto-apoio">Nenhum evento aprovado nos próximos dias.</p>
                : <ListaPainel itens={painel.proximos} para={(i) => `/admin/solicitacoes/${i.id}`} />}
            </section>
          </div>
        </>
      )}
    </>
  );
}

function ListaPainel({ itens, para }) {
  return (
    <ul className="lista-simples compacta">
      {itens.map((i) => (
        <li key={i.id}>
          <Link to={para(i)}>
            <strong>{i.nome}</strong>
            <small>{dataBR(i.data)} às {i.horaInicio} · {i.local}</small>
            {i.conflito && <small className="texto-erro"><Icone nome="alerta" tamanho={14} /> Conflita com "{i.conflito}"</small>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
