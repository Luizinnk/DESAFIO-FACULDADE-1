import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Icone from '../components/Icone.jsx';
import { Carregando } from '../components/Comuns.jsx';
import { dataBR, partesData } from '../util.js';

/** TELA 1 — Agenda pública: eventos aprovados do mês atual + 2 meses. */
export default function Agenda() {
  const { usuario } = useAuth();
  const [agenda, setAgenda] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api('/publico/agenda').then(setAgenda).catch((e) => setErro(e.message));
  }, []);

  // Agrupa os eventos por mês: { "outubro de 2026": [...], ... }
  const porMes = {};
  for (const e of agenda?.eventos || []) {
    const { mes, ano } = partesData(e.data);
    (porMes[`${mes} de ${ano}`] ||= []).push(e);
  }

  return (
    <>
      <section className="destaque">
        <div>
          <span className="destaque-etiqueta">Agenda oficial</span>
          <h1>Agenda de eventos</h1>
          <p>
            {agenda
              ? <>Eventos aprovados de <strong>{dataBR(agenda.inicio)}</strong> até <strong>{dataBR(agenda.fim)}</strong>.</>
              : 'Eventos aprovados da Univille.'}
          </p>
        </div>
        {!usuario && (
          <Link to="/entrar" className="botao botao-claro">
            <Icone nome="mais" /> Quero solicitar um evento
          </Link>
        )}
        {usuario?.perfil === 'SOLICITANTE' && (
          <Link to="/solicitacoes/nova" className="botao botao-claro">
            <Icone nome="mais" /> Novo pedido de evento
          </Link>
        )}
      </section>

      {erro && <p className="caixa-erros">{erro}</p>}
      {!agenda && !erro && <Carregando />}
      {agenda && agenda.eventos.length === 0 && (
        <div className="vazio"><Icone nome="agenda" tamanho={36} /><h3>Nenhum evento aprovado neste período</h3></div>
      )}

      {Object.entries(porMes).map(([mes, eventos]) => (
        <section key={mes} className="grupo-mes">
          <h2 className="mes">{mes}</h2>
          <div className="lista-eventos">
            {eventos.map((e) => {
              const p = partesData(e.data);
              return (
                <article key={`${e.data}-${e.horaInicio}-${e.nome}`} className="cartao-evento">
                  <div className="cartao-data">
                    <strong>{String(p.dia).padStart(2, '0')}</strong>
                    <span>{p.semana.slice(0, 3)}</span>
                  </div>
                  <div className="cartao-corpo">
                    <span className="etiqueta">{e.tema}</span>
                    <h3>{e.nome}</h3>
                    <ul className="cartao-info">
                      <li><Icone nome="relogio" tamanho={16} /> {e.horaInicio} às {e.horaFim}</li>
                      <li><Icone nome="local" tamanho={16} /> {e.local}</li>
                      <li><Icone nome="pessoa" tamanho={16} /> {e.palestrante}</li>
                    </ul>
                    <p className="cartao-realizacao">Realização: {e.curso}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
