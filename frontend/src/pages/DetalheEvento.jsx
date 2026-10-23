import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAvisos } from '../components/Avisos.jsx';
import Confirmar from '../components/Confirmar.jsx';
import Icone from '../components/Icone.jsx';
import { CaixaErros, Carregando, SeloStatus, TituloPagina } from '../components/Comuns.jsx';
import { STATUS, dataBR, horario, simNao } from '../util.js';

const EDITAVEIS = ['RASCUNHO', 'AGUARDANDO', 'REJEITADO'];

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

  useEffect(carregar, [carregar]);

  if (!ev) return erros.length ? <CaixaErros erros={erros} /> : <Carregando />;

  // Executa a ação confirmada na janela e mostra o resultado
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

  return (
    <>
      <TituloPagina titulo={ev.nome} voltar={admin ? `/admin/solicitacoes?status=${ev.status}` : '/minhas'}>
        <SeloStatus status={ev.status} />
      </TituloPagina>

      <CaixaErros erros={erros} />

      {/* Explica em palavras simples o que significa o status atual */}
      <div className={`faixa-status faixa-${ev.status}`}>
        <Icone nome="info" />
        <span><strong>{STATUS[ev.status].texto}.</strong> {STATUS[ev.status].explicacao}</span>
      </div>

      {ev.status === 'REJEITADO' && ev.motivoRejeicao && (
        <div className="caixa-motivo"><Icone nome="info" /><div><strong>Motivo da rejeição</strong><p>{ev.motivoRejeicao}</p></div></div>
      )}
      {conflito && (
        <div className="caixa-erros"><Icone nome="alerta" />
          <div><strong>Atenção: conflito de agenda</strong><p>O local já tem o evento aprovado {conflito}. A aprovação será bloqueada.</p></div>
        </div>
      )}

      <div className="resumo-evento">
        <div><Icone nome="agenda" /><span><small>Data</small>{dataBR(ev.data)}</span></div>
        <div><Icone nome="relogio" /><span><small>Horário</small>{horario(ev.horaInicio, ev.horaFim)}</span></div>
        <div><Icone nome="local" /><span><small>Local</small>{ev.local || '—'}</span></div>
        <div><Icone nome="lista" /><span><small>Tema</small>{ev.tema || '—'}</span></div>
      </div>

      <div className="cartao">
        <section className="bloco-detalhe">
          <h2>Responsáveis</h2>
          <dl className="dados">
            <Dado rotulo="Solicitante" valor={ev.solicitante} />
            <Dado rotulo="Palestrante" valor={ev.palestrante} />
            <Dado rotulo="Curso / coordenação" valor={ev.curso} />
            <Dado rotulo="Centro de custo" valor={ev.centroCusto} />
          </dl>
        </section>
        <section className="bloco-detalhe">
          <h2>Detalhes</h2>
          <dl className="dados">
            <Dado rotulo="Público-alvo" valor={ev.publicoAlvo} largo />
            <Dado rotulo="Justificativa" valor={ev.justificativa} largo />
            <Dado rotulo="Objetivo" valor={ev.objetivo} largo />
            <Dado rotulo="Cerimonial" valor={simNao(ev.cerimonial)} />
            <Dado rotulo="Inscrições" valor={simNao(ev.inscricoes)} />
            <Dado rotulo="Declarações" valor={simNao(ev.declaracoes)} />
            <Dado rotulo="Recursos" valor={ev.recursos.join(', ')} />
            {ev.observacoes && <Dado rotulo="Observações" valor={ev.observacoes} largo />}
          </dl>
        </section>
        <p className="rodape-cartao">Registrado por {ev.autor} · última alteração em {ev.atualizadoEm}</p>
      </div>

      <div className="acoes-detalhe">
        {!admin && EDITAVEIS.includes(ev.status) && (
          <Link to={`/solicitacoes/${id}/editar`} className="botao botao-primario">
            <Icone nome="lapis" /> {ev.status === 'REJEITADO' ? 'Corrigir e reenviar' : 'Editar pedido'}
          </Link>
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
        <label className="campo">
          <span>Motivo (o solicitante vai ver) <em className="obrigatorio">*</em></span>
          <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus
            placeholder="Ex.: O auditório estará em manutenção. Escolha outra data." />
        </label>
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
