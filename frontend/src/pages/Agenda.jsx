import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { BotaoAjuda } from '../components/Ajuda.jsx';
import Icone from '../components/Icone.jsx';
import { Esqueleto } from '../components/Comuns.jsx';
import { CONTATO_EVENTOS, dataBR, hojeISO, partesData, somarDias } from '../util.js';

/** Tira acentos e deixa minúsculo, para a busca achar "auditorio" em "Auditório". */
const normalizar = (t = '') => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** TELA 1 — Agenda pública: eventos aprovados do mês atual + 2 meses. */
export default function Agenda() {
  const { usuario } = useAuth();
  const [agenda, setAgenda] = useState(null);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [tema, setTema] = useState('');

  useEffect(() => {
    api('/publico/agenda').then(setAgenda).catch((e) => setErro(e.message));
  }, []);

  const temas = useMemo(() => [...new Set((agenda?.eventos || []).map((e) => e.tema))].sort(), [agenda]);
  const hoje = hojeISO();
  const fimSemana = somarDias(hoje, 6);

  // Busca por nome, local, palestrante ou curso + filtro por tema
  const filtrados = (agenda?.eventos || []).filter((e) =>
    (!tema || e.tema === tema)
    && (!busca || normalizar(`${e.nome} ${e.local} ${e.palestrante} ${e.curso}`).includes(normalizar(busca))));

  const porMes = {};
  for (const e of filtrados) {
    const { mes, ano } = partesData(e.data);
    (porMes[`${mes} de ${ano}`] ||= []).push(e);
  }

  return (
    <>
      <section className="destaque">
        <div>
          <span className="destaque-etiqueta">Agenda oficial</span>
          <h1>Agenda de eventos <BotaoAjuda topico="calendario" claro /></h1>
          <p>
            {agenda
              ? <>Eventos aprovados de <strong>{dataBR(agenda.inicio)}</strong> até <strong>{dataBR(agenda.fim)}</strong>.</>
              : 'Eventos aprovados da Univille.'}
          </p>
        </div>
        {!usuario && (
          <div className="destaque-cta">
            <span className="linha-com-ajuda">
              <Link to="/entrar" className="botao botao-claro"><Icone nome="mais" /> Quero solicitar um evento</Link>
              <BotaoAjuda topico="solicitar" claro />
            </span>
            <small>Para professores e coordenações. Dúvidas: <a href={`mailto:${CONTATO_EVENTOS}`}>{CONTATO_EVENTOS}</a></small>
          </div>
        )}
        {usuario?.perfil === 'SOLICITANTE' && (
          <span className="linha-com-ajuda">
            <Link to="/solicitacoes/nova" className="botao botao-claro"><Icone nome="mais" /> Novo pedido de evento</Link>
            <BotaoAjuda topico="solicitar" claro />
          </span>
        )}
      </section>

      {agenda?.eventos.length > 0 && (
        <div className="filtros-agenda">
          <label className="busca">
            <Icone nome="busca" />
            <span className="sr-only">Buscar evento</span>
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome, local ou palestrante" />
          </label>
          <div className="chips-rolagem" role="group" aria-label="Filtrar por tema">
            <button className={`chip ${!tema ? 'marcado' : ''}`} onClick={() => setTema('')} aria-pressed={!tema}>Todos</button>
            {temas.map((t) => (
              <button key={t} className={`chip ${tema === t ? 'marcado' : ''}`} onClick={() => setTema(tema === t ? '' : t)} aria-pressed={tema === t}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {erro && <p className="caixa-erros">{erro}</p>}
      {!agenda && !erro && <Esqueleto quantidade={3} />}
      {agenda && filtrados.length === 0 && (
        <div className="vazio"><Icone nome="agenda" tamanho={36} />
          <h3>{agenda.eventos.length ? 'Nenhum evento encontrado com essa busca' : 'Nenhum evento aprovado neste período'}</h3>
          {agenda.eventos.length > 0 && <button className="botao botao-secundario" onClick={() => { setBusca(''); setTema(''); }}>Limpar busca</button>}
        </div>
      )}

      {Object.entries(porMes).map(([mes, eventos]) => (
        <section key={mes} className="grupo-mes">
          <h2 className="mes">{mes}</h2>
          <div className="lista-eventos">
            {eventos.map((e) => {
              const p = partesData(e.data);
              const selo = e.data === hoje ? 'Hoje' : e.data <= fimSemana ? 'Esta semana' : null;
              return (
                <Link key={e.id} to={`/eventos/${e.id}`} className={`cartao-evento ${e.imagem ? 'com-imagem' : ''}`}>
                  {e.imagem && <img className="cartao-imagem" src={e.imagem} alt="" loading="lazy" />}
                  <div className="cartao-conteudo">
                    <div className="cartao-data">
                      <strong>{String(p.dia).padStart(2, '0')}</strong>
                      <span>{p.semana.slice(0, 3)}</span>
                    </div>
                    <div className="cartao-corpo">
                      <div className="cartao-etiquetas">
                        <span className="etiqueta">{e.tema}</span>
                        {selo && <span className="etiqueta etiqueta-destaque">{selo}</span>}
                      </div>
                      <h3>{e.nome}</h3>
                      <ul className="cartao-info">
                        <li><Icone nome="relogio" tamanho={16} /> {e.horaInicio} às {e.horaFim}</li>
                        <li><Icone nome="local" tamanho={16} /> {e.local}</li>
                        <li><Icone nome="microfone" tamanho={16} /> <span><span className="rotulo-info">Palestrante:</span> {e.palestrante}</span></li>
                      </ul>
                      <p className="cartao-realizacao">Realização: {e.curso}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
