import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useAvisos } from '../../components/Avisos.jsx';
import Campo from '../../components/Campo.jsx';
import Confirmar from '../../components/Confirmar.jsx';
import { BotaoAjuda } from '../../components/Ajuda.jsx';
import Icone from '../../components/Icone.jsx';
import { CaixaErros, Carregando, TituloPagina } from '../../components/Comuns.jsx';
import { dataBR, emMinutos, hojeISO, partesData, somarDias } from '../../util.js';

const INICIO = 7 * 60;          // a grade vai das 07:00
const FIM = 23 * 60;            // até as 23:00
const HORAS = Array.from({ length: (FIM - INICIO) / 60 + 1 }, (_, i) => 7 + i);
const posicao = (h) => `${((emMinutos(h) - INICIO) / (FIM - INICIO)) * 100}%`;
const largura = (ini, fim) => `${((emMinutos(fim) - emMinutos(ini)) / (FIM - INICIO)) * 100}%`;

/** Grade do dia: uma linha por local, com os eventos aprovados, pendentes e bloqueios. */
export default function Ocupacao() {
  const avisar = useAvisos();
  const [data, setData] = useState(hojeISO());
  const [linhas, setLinhas] = useState(null);
  const [bloqueios, setBloqueios] = useState([]);
  const [novo, setNovo] = useState({ localId: '', dataInicio: '', dataFim: '', motivo: '' });
  const [erros, setErros] = useState([]);
  const [removendo, setRemovendo] = useState(null);

  const carregar = useCallback(() => {
    setLinhas(null);
    api(`/admin/ocupacao?data=${data}`).then(setLinhas);
    api('/admin/bloqueios').then(setBloqueios);
  }, [data]);
  useEffect(() => { carregar(); }, [carregar]);

  async function bloquear(e) {
    e.preventDefault();
    setErros([]);
    try {
      await api('/admin/bloqueios', { metodo: 'POST', corpo: { ...novo, localId: Number(novo.localId) || null, dataFim: novo.dataFim || null } });
      avisar('Local bloqueado. Ninguém conseguirá enviar pedidos para esse período.');
      setNovo({ localId: '', dataInicio: '', dataFim: '', motivo: '' });
      carregar();
    } catch (err) {
      setErros(err.erros);
    }
  }

  async function desbloquear() {
    const b = removendo;
    setRemovendo(null);
    await api(`/admin/bloqueios/${b.id}`, { metodo: 'DELETE' });
    avisar('Bloqueio removido.');
    carregar();
  }

  const p = partesData(data);

  return (
    <>
      <TituloPagina titulo="Ocupação dos locais" ajuda="ocupacao" subtitulo="Veja, dia a dia, o que está reservado em cada sala." />

      <div className="navegar-dia">
        <button className="botao-icone" onClick={() => setData(somarDias(data, -1))} aria-label="Dia anterior"><Icone nome="voltar" /></button>
        <div className="dia-atual">
          <strong>{p.semana}, {p.dia} de {p.mes}</strong>
          <input type="date" value={data} onChange={(e) => e.target.value && setData(e.target.value)} aria-label="Escolher data" />
        </div>
        <button className="botao-icone girar" onClick={() => setData(somarDias(data, 1))} aria-label="Próximo dia"><Icone nome="voltar" /></button>
        {data !== hojeISO() && <button className="botao botao-secundario botao-pequeno" onClick={() => setData(hojeISO())}>Hoje</button>}
      </div>

      <div className="legenda">
        <span><i className="amostra aprovado" /> Aprovado</span>
        <span><i className="amostra pendente" /> Aguardando análise</span>
        <span><i className="amostra bloqueado" /> Bloqueado</span>
      </div>

      {!linhas && <Carregando />}
      {linhas && (
        <div className="cartao sem-espaco grade-rolagem">
          <div className="grade-ocupacao">
            <div className="grade-cabecalho">
              <span className="grade-local" />
              <div className="grade-horas">
                {HORAS.map((h) => <span key={h} style={{ left: posicao(`${h}:00`) }}>{h}h</span>)}
              </div>
            </div>
            {linhas.map((l) => (
              <div key={l.id} className="grade-linha">
                <span className="grade-local"><strong>{l.nome}</strong>{l.capacidade && <small>{l.capacidade} lugares</small>}</span>
                <div className="grade-trilho">
                  {HORAS.map((h) => <i key={h} className="grade-marca" style={{ left: posicao(`${h}:00`) }} />)}
                  {l.bloqueio && <div className="reserva bloqueado" style={{ left: 0, width: '100%' }}><Icone nome="cadeado" tamanho={14} /> {l.bloqueio}</div>}
                  {l.ocupacoes.map((o) => (
                    <Link key={o.id} to={`/admin/solicitacoes/${o.id}`}
                      className={`reserva ${o.status === 'APROVADO' ? 'aprovado' : 'pendente'}`}
                      style={{ left: posicao(o.horaInicio), width: largura(o.horaInicio, o.horaFim) }}
                      title={`${o.horaInicio}–${o.horaFim} · ${o.nome}`}>
                      <span>{o.horaInicio} {o.nome}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="titulo-secao">Bloqueios de local <BotaoAjuda topico="bloqueio" /></h2>
      <p className="texto-apoio">Use para manutenção, provas ou reformas. Durante o bloqueio, o sistema não aceita pedidos para o local.</p>
      <div className="duas-colunas">
        <form className="cartao" onSubmit={bloquear}>
          <h3 className="titulo-cartao">Novo bloqueio</h3>
          <CaixaErros erros={erros} />
          <Campo rotulo="Local">
            <select value={novo.localId} onChange={(e) => setNovo({ ...novo, localId: e.target.value })}>
              <option value="">Escolha…</option>
              {linhas?.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </Campo>
          <div className="grade-campos">
            <Campo rotulo="De"><input type="date" min={hojeISO()} value={novo.dataInicio} onChange={(e) => setNovo({ ...novo, dataInicio: e.target.value })} /></Campo>
            <Campo rotulo="Até" opcional ajuda="Vazio = só um dia"><input type="date" min={novo.dataInicio || hojeISO()} value={novo.dataFim} onChange={(e) => setNovo({ ...novo, dataFim: e.target.value })} /></Campo>
          </div>
          <Campo rotulo="Motivo"><input value={novo.motivo} onChange={(e) => setNovo({ ...novo, motivo: e.target.value })} placeholder="Ex.: Manutenção do ar-condicionado" /></Campo>
          <button className="botao botao-primario"><Icone nome="cadeado" /> Bloquear local</button>
        </form>

        <div className="cartao sem-espaco">
          {bloqueios.length === 0 && <p className="texto-apoio centro espaco">Nenhum bloqueio ativo.</p>}
          <ul className="lista-simples">
            {bloqueios.map((b) => (
              <li key={b.id}>
                <div>
                  <strong>{b.local}</strong>
                  <small>{dataBR(b.dataInicio)}{b.dataFim !== b.dataInicio && ` até ${dataBR(b.dataFim)}`} · {b.motivo}</small>
                </div>
                <button className="botao botao-pequeno botao-secundario" onClick={() => setRemovendo(b)}>Desbloquear</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Confirmar aberto={!!removendo} titulo="Remover este bloqueio?" textoConfirmar="Sim, desbloquear"
        mensagem="O local volta a aceitar pedidos nessas datas." aoConfirmar={desbloquear} aoFechar={() => setRemovendo(null)} />
    </>
  );
}
