import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAvisos } from '../components/Avisos.jsx';
import Confirmar from '../components/Confirmar.jsx';
import Disponibilidade from '../components/Disponibilidade.jsx';
import { BotaoAjuda } from '../components/Ajuda.jsx';
import Icone from '../components/Icone.jsx';
import { CaixaErros, Carregando, SeloStatus, TituloPagina } from '../components/Comuns.jsx';
import { ACOES, dataBR, horario, simNao } from '../util.js';

const EDITAVEIS = ['RASCUNHO', 'AGUARDANDO', 'REJEITADO'];
const MOTIVOS_RAPIDOS = ['Local indisponível nesta data', 'Fora do prazo para organização', 'Dados incompletos', 'Conflito com outro evento'];

/** Frase do status, escrita para quem está olhando (solicitante ou administrador). */
function fraseStatus(ev, admin) {
  const ultimo = [...(ev.historico || [])].reverse().find((h) => h.acao === ev.status);
  const quando = ultimo ? ` em ${ultimo.dataHora.split(' às')[0]}` : '';
  if (admin) {
    return {
      AGUARDANDO: 'Este pedido espera a sua análise. Confira a ocupação do local antes de aprovar.',
      APROVADO: `Aprovado${quando} e publicado na agenda pública.`,
      REJEITADO: `Rejeitado${quando}. Aguardando correção do solicitante.`,
      CANCELADO: `Cancelado${quando}. Não aparece na agenda pública.`,
    }[ev.status];
  }
  return {
    RASCUNHO: 'Ainda não foi enviado. Só você consegue ver.',
    AGUARDANDO: 'Enviado. O setor de Eventos vai analisar e você verá o resultado aqui.',
    APROVADO: `Confirmado${quando} e publicado na agenda.`,
    REJEITADO: 'O setor de Eventos pediu ajustes. Veja o motivo, corrija e envie de novo.',
    CANCELADO: 'Este pedido foi cancelado. O registro fica guardado no histórico.',
  }[ev.status];
}

/** TELA 5 — Detalhe da solicitação, com as ações permitidas para cada perfil e status. */
export default function DetalheEvento({ modo }) {
  const { id } = useParams();
  const navegar = useNavigate();
  const avisar = useAvisos();
  const admin = modo === 'admin';

  const [ev, setEv] = useState(null);
  const [conflito, setConflito] = useState(null);
  const [erros, setErros] = useState([]);
  const [dialogo, setDialogo] = useState(null); // 'excluir' | 'cancelar' | 'rejeitar' | 'aprovar'
  const [motivo, setMotivo] = useState('');

  const carregar = useCallback(() => {
    api(admin ? `/admin/solicitacoes/${id}` : `/solicitacoes/${id}`)
      .then((r) => {
        setEv(admin ? r.evento : r);
        setConflito(admin ? r.conflito : null);
      })
      .catch((e) => setErros([e.message]));
  }, [id, admin]);

  useEffect(() => { carregar(); }, [carregar]);

  if (!ev) return erros.length ? <CaixaErros erros={erros} /> : <Carregando />;

  async function executar() {
    const acao = dialogo;
    setDialogo(null);
    setErros([]);
    try {
      if (acao === 'excluir') {
        await api(`/solicitacoes/${id}`, { metodo: 'DELETE' });
        avisar('Rascunho excluído.');
        return navegar('/minhas');
      }
      if (acao === 'cancelar') {
        await api(admin ? `/admin/solicitacoes/${id}/cancelar` : `/solicitacoes/${id}/cancelar`, { metodo: 'POST' });
        avisar(admin ? 'Evento cancelado e retirado da agenda.' : 'Pedido cancelado.');
      }
      if (acao === 'aprovar') {
        await api(`/admin/solicitacoes/${id}/aprovar`, { metodo: 'POST' });
        avisar('Evento aprovado e publicado na agenda!');
        return navegar('/admin/solicitacoes');
      }
      if (acao === 'rejeitar') {
        await api(`/admin/solicitacoes/${id}/rejeitar`, { metodo: 'POST', corpo: { motivo } });
        avisar('Pedido rejeitado. O solicitante verá o motivo.');
        return navegar('/admin/solicitacoes');
      }
      carregar();
    } catch (e) {
      setErros(e.erros);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  const rejeitado = ev.status === 'REJEITADO';

  return (
    <>
      <TituloPagina titulo={ev.nome} voltar={admin ? `/admin/solicitacoes?status=${ev.status}` : '/minhas'}
        ajuda={admin ? 'analisar' : rejeitado ? 'corrigir' : 'acompanhar'}>
        <SeloStatus status={ev.status} />
      </TituloPagina>

      <CaixaErros erros={erros} />

      {/* Um único aviso por status. Na rejeição, o motivo e a ação ficam juntos. */}
      <div className={`alerta-card alerta-card-${ev.status}`}>
        <Icone nome={rejeitado ? 'alerta' : 'info'} />
        <div>
          <strong>{fraseStatus(ev, admin)}</strong> <BotaoAjuda topico="status" />
          {rejeitado && ev.motivoRejeicao && <p className="motivo">Motivo: {ev.motivoRejeicao}</p>}
          {rejeitado && !admin && (
            <Link to={`/solicitacoes/${id}/editar`} className="botao botao-primario botao-pequeno"><Icone nome="lapis" /> Corrigir e reenviar</Link>
          )}
        </div>
      </div>

      {conflito && (
        <div className="alerta-card alerta-card-REJEITADO"><Icone nome="alerta" />
          <div><strong>Conflito de agenda</strong><p>O local já tem o evento aprovado {conflito}. A aprovação será bloqueada.</p></div>
        </div>
      )}

      <div className="resumo-evento">
        <div><Icone nome="agenda" /><span><small>Data</small>{dataBR(ev.data)}</span></div>
        <div className="hora"><Icone nome="relogio" /><span><small>Horário</small>{horario(ev.horaInicio, ev.horaFim)}</span></div>
        <div><Icone nome="local" /><span><small>Local</small>{ev.local || '—'}</span></div>
        <div><Icone nome="lista" /><span><small>Tema</small>{ev.tema || '—'}</span></div>
      </div>

      <div className={admin && ev.status === 'AGUARDANDO' ? 'detalhe-com-lateral' : ''}>
        <div>
          <div className="cartao">
            {ev.imagem && <img className="detalhe-imagem" src={ev.imagem} alt={`Arte do evento ${ev.nome}`} />}
            <section className="bloco-detalhe">
              <h2>Responsáveis</h2>
              <dl className="dados">
                <Dado rotulo="Responsável pelo evento" valor={ev.solicitante} />
                <Dado rotulo="Palestrante" valor={ev.palestrante} />
                <Dado rotulo="Curso / coordenação" valor={ev.curso} />
                <Dado rotulo="Centro de custo" valor={ev.centroCusto} />
              </dl>
            </section>
            <section className="bloco-detalhe">
              <h2>Detalhes</h2>
              <dl className="dados">
                <Dado rotulo="Público-alvo" valor={ev.publicoAlvo} largo />
                <Dado rotulo="Público estimado" valor={ev.publicoEstimado
                  ? `${ev.publicoEstimado} pessoas${ev.capacidadeLocal ? ` (local comporta ${ev.capacidadeLocal})` : ''}` : null} />
                <Dado rotulo="Recursos" valor={ev.recursos.join(', ')} />
                <Dado rotulo="Justificativa" valor={ev.justificativa} largo />
                <Dado rotulo="Objetivo" valor={ev.objetivo} largo />
                <Dado rotulo="Cerimonial" valor={simNao(ev.cerimonial)} />
                <Dado rotulo="Inscrições" valor={simNao(ev.inscricoes)} />
                <Dado rotulo="Declarações" valor={simNao(ev.declaracoes)} />
                {ev.observacoes && <Dado rotulo="Observações" valor={ev.observacoes} largo />}
              </dl>
            </section>
          </div>

          {ev.historico?.length > 0 && (
            <section className="cartao">
              <h2 className="titulo-cartao">Histórico</h2>
              <ol className="linha-tempo">
                {ev.historico.map((h, i) => (
                  <li key={i} className={`acao-${h.acao}`}>
                    <strong>{ACOES[h.acao] || h.acao}</strong>
                    <span>{h.dataHora} · por {h.usuario}</span>
                    {h.detalhe && <p>{h.detalhe}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Para o admin decidir com segurança: a ocupação do local naquele dia */}
        {admin && ev.status === 'AGUARDANDO' && (
          <aside className="cartao lateral">
            <h2 className="titulo-cartao">Ocupação do local no dia</h2>
            <Disponibilidade localId={ev.localId} data={ev.data} inicio={ev.horaInicio} fim={ev.horaFim} ignorarId={ev.id} />
          </aside>
        )}
      </div>

      <div className="acoes-detalhe">
        {!admin && EDITAVEIS.includes(ev.status) && !rejeitado && (
          <Link to={`/solicitacoes/${id}/editar`} className="botao botao-primario"><Icone nome="lapis" /> Editar pedido</Link>
        )}
        {!admin && ev.status === 'RASCUNHO' && (
          <button className="botao botao-perigo-leve" onClick={() => setDialogo('excluir')}><Icone nome="lixo" /> Excluir rascunho</button>
        )}
        {!admin && ev.status === 'AGUARDANDO' && (
          <button className="botao botao-perigo-leve" onClick={() => setDialogo('cancelar')}><Icone nome="x" /> Cancelar pedido</button>
        )}

        {admin && ev.status === 'AGUARDANDO' && (
          <>
            <button className="botao botao-sucesso" onClick={() => setDialogo('aprovar')}><Icone nome="check" /> Aprovar e publicar</button>
            <button className="botao botao-perigo-leve" onClick={() => { setMotivo(''); setDialogo('rejeitar'); }}><Icone nome="x" /> Rejeitar</button>
          </>
        )}
        {admin && ev.status === 'APROVADO' && (
          <>
            <Link to={`/admin/solicitacoes/${id}/editar`} className="botao botao-primario"><Icone nome="lapis" /> Editar evento</Link>
            <Link to={`/eventos/${id}`} className="botao botao-secundario"><Icone nome="compartilhar" /> Ver página pública</Link>
            <button className="botao botao-perigo-leve" onClick={() => setDialogo('cancelar')}><Icone nome="x" /> Cancelar evento</button>
          </>
        )}
      </div>

      <Confirmar aberto={dialogo === 'excluir'} titulo="Excluir este rascunho?" perigo textoConfirmar="Sim, excluir"
        mensagem="O rascunho será apagado e não poderá ser recuperado." aoConfirmar={executar} aoFechar={() => setDialogo(null)} />
      <Confirmar aberto={dialogo === 'cancelar'} titulo={admin ? 'Cancelar este evento?' : 'Cancelar este pedido?'} perigo
        textoConfirmar="Sim, cancelar" aoConfirmar={executar} aoFechar={() => setDialogo(null)}
        mensagem={admin ? 'O evento sai da agenda pública. O registro fica guardado.' : 'O pedido sai da análise. O registro fica guardado.'} />
      <Confirmar aberto={dialogo === 'aprovar'} titulo="Aprovar este evento?" textoConfirmar="Sim, aprovar"
        mensagem="O sistema confere o conflito de agenda de novo e publica o evento na agenda."
        aoConfirmar={executar} aoFechar={() => setDialogo(null)} />
      <Confirmar aberto={dialogo === 'rejeitar'} titulo="Rejeitar este pedido" perigo textoConfirmar="Rejeitar pedido"
        aoConfirmar={executar} aoFechar={() => setDialogo(null)}>
        <p className="texto-apoio">Escolha um motivo rápido ou escreva o seu. O solicitante vai ver este texto.</p>
        <div className="opcoes-marcar motivos-rapidos">
          {MOTIVOS_RAPIDOS.map((m) => (
            <button key={m} type="button" className={`chip ${motivo === m ? 'marcado' : ''}`} onClick={() => setMotivo(m)}>{m}</button>
          ))}
        </div>
        <div className="campo">
          <label htmlFor="motivo-rejeicao">Motivo <em className="obrigatorio" aria-hidden="true">*</em></label>
          <textarea id="motivo-rejeicao" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: O auditório estará em manutenção. Escolha outra data." />
        </div>
      </Confirmar>
    </>
  );
}

function Dado({ rotulo, valor, largo }) {
  return (
    <div className={largo ? 'largo' : ''}>
      <dt>{rotulo}</dt>
      <dd>{valor || '—'}</dd>
    </div>
  );
}
