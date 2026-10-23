import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAvisos } from '../components/Avisos.jsx';
import Icone from '../components/Icone.jsx';
import { CaixaErros, Carregando, TituloPagina } from '../components/Comuns.jsx';

const VAZIO = {
  nome: '', temaId: '', palestrante: '', publicoAlvo: '',
  data: '', horaInicio: '', horaFim: '', localId: '', recursoIds: [],
  solicitante: '', cursoId: '',
  justificativa: '', objetivo: '', cerimonial: null, inscricoes: null, declaracoes: null, observacoes: '',
};

// Campos que precisam estar preenchidos para ENVIAR (o rascunho aceita incompleto)
const OBRIGATORIOS = ['nome', 'temaId', 'palestrante', 'publicoAlvo', 'data', 'horaInicio', 'horaFim', 'localId',
  'solicitante', 'cursoId', 'justificativa', 'objetivo', 'cerimonial', 'inscricoes', 'declaracoes'];

/** Converte o evento vindo da API para os campos do formulário. */
function paraFormulario(ev) {
  const f = { ...VAZIO };
  for (const c of Object.keys(VAZIO)) if (ev[c] !== null && ev[c] !== undefined) f[c] = ev[c];
  return f;
}

/** Converte os campos do formulário para o formato que a API espera (vazio vira null). */
function paraApi(f) {
  const nulo = (v) => (v === '' ? null : v);
  return {
    ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, nulo(v)])),
    temaId: f.temaId ? Number(f.temaId) : null,
    localId: f.localId ? Number(f.localId) : null,
    cursoId: f.cursoId ? Number(f.cursoId) : null,
    recursoIds: f.recursoIds,
  };
}

/** TELA 4 — Formulário de solicitação (o admin usa o mesmo para editar um evento aprovado). */
export default function FormularioEvento({ modo }) {
  const { id } = useParams();
  const navegar = useNavigate();
  const avisar = useAvisos();
  const admin = modo === 'admin';

  const [opcoes, setOpcoes] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [status, setStatus] = useState(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState(null);
  const [erros, setErros] = useState([]);
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    api('/opcoes').then(setOpcoes).catch((e) => setErros([e.message]));
    if (id) {
      const caminho = admin ? `/admin/solicitacoes/${id}` : `/solicitacoes/${id}`;
      api(caminho)
        .then((r) => {
          const ev = admin ? r.evento : r;
          setForm(paraFormulario(ev));
          setStatus(ev.status);
          setMotivoRejeicao(ev.motivoRejeicao);
        })
        .catch((e) => setErros([e.message]));
    }
  }, [id, admin]);

  if (!opcoes) return <Carregando />;

  const local = opcoes.locais.find((l) => String(l.id) === String(form.localId));
  const curso = opcoes.cursos.find((c) => String(c.id) === String(form.cursoId));
  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const invalido = (campo) => tentouEnviar && (form[campo] === '' || form[campo] === null);

  // Trocar o local desmarca os recursos, pois cada local tem os seus
  const trocarLocal = (e) => setForm({ ...form, localId: e.target.value, recursoIds: [] });
  const marcarRecurso = (rid) => setForm({
    ...form,
    recursoIds: form.recursoIds.includes(rid) ? form.recursoIds.filter((r) => r !== rid) : [...form.recursoIds, rid],
  });

  async function gravar(acao) {
    const enviar = acao === 'enviar';
    setTentouEnviar(enviar);
    setErros([]);
    setSalvando(true);
    try {
      let salvo;
      if (admin) {
        salvo = await api(`/admin/solicitacoes/${id}`, { metodo: 'PUT', corpo: paraApi(form) });
      } else {
        const caminho = id ? `/solicitacoes/${id}?acao=${acao}` : `/solicitacoes?acao=${acao}`;
        salvo = await api(caminho, { metodo: id ? 'PUT' : 'POST', corpo: paraApi(form) });
      }
      avisar(admin ? 'Evento atualizado.' : enviar ? 'Pedido enviado! Agora é só aguardar a análise.' : 'Rascunho salvo.');
      navegar(admin ? `/admin/solicitacoes/${salvo.id}` : `/solicitacoes/${salvo.id}`);
    } catch (e) {
      // Se só faltam campos, uma frase curta basta: os campos já ficam marcados em vermelho
      const soFaltando = e.erros.every((m) => m.startsWith('Preencha:'));
      setErros(soFaltando && e.erros.length > 1
        ? [`Faltam ${e.erros.length} campos obrigatórios. Eles estão marcados em vermelho abaixo.`]
        : e.erros);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSalvando(false);
    }
  }

  const titulo = admin ? 'Editar evento aprovado' : id ? 'Editar pedido' : 'Novo pedido de evento';
  const voltar = admin ? `/admin/solicitacoes/${id}` : id ? `/solicitacoes/${id}` : '/minhas';
  const faltando = OBRIGATORIOS.filter((c) => form[c] === '' || form[c] === null).length;

  return (
    <form onSubmit={(e) => { e.preventDefault(); gravar('enviar'); }} noValidate>
      <TituloPagina titulo={titulo} voltar={voltar}
        subtitulo={admin ? 'As mudanças passam pela verificação de conflito de agenda.'
          : 'Preencha com calma. Você pode salvar e terminar depois.'} />

      {status === 'REJEITADO' && motivoRejeicao && (
        <div className="caixa-motivo"><Icone nome="info" /><div><strong>Motivo da rejeição</strong><p>{motivoRejeicao}</p></div></div>
      )}
      <CaixaErros erros={erros} />

      <section className="cartao secao-form">
        <h2><span className="passo">1</span> Sobre o evento</h2>
        <div className="grade-campos">
          <Campo rotulo="Nome do evento" largo invalido={invalido('nome')}>
            <input value={form.nome} onChange={alterar('nome')} maxLength={150} placeholder="Ex.: Palestra sobre Inteligência Artificial" />
          </Campo>
          <Campo rotulo="Tipo de evento (tema)" invalido={invalido('temaId')}>
            <select value={form.temaId} onChange={alterar('temaId')}>
              <option value="">Escolha…</option>
              {opcoes.temas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Palestrante" invalido={invalido('palestrante')}>
            <input value={form.palestrante} onChange={alterar('palestrante')} placeholder="Quem vai apresentar" />
          </Campo>
          <Campo rotulo="Público-alvo" largo invalido={invalido('publicoAlvo')}>
            <input value={form.publicoAlvo} onChange={alterar('publicoAlvo')} placeholder="Ex.: alunos do 1º ano de Engenharia" />
          </Campo>
        </div>
      </section>

      <section className="cartao secao-form">
        <h2><span className="passo">2</span> Quando e onde</h2>
        <div className="grade-campos">
          <Campo rotulo="Data" invalido={invalido('data')}>
            <input type="date" value={form.data} onChange={alterar('data')} />
          </Campo>
          <Campo rotulo="Começa às" invalido={invalido('horaInicio')}>
            <input type="time" value={form.horaInicio} onChange={alterar('horaInicio')} />
          </Campo>
          <Campo rotulo="Termina às" invalido={invalido('horaFim')}>
            <input type="time" value={form.horaFim} onChange={alterar('horaFim')} />
          </Campo>
          <Campo rotulo="Local" invalido={invalido('localId')}>
            <select value={form.localId} onChange={trocarLocal}>
              <option value="">Escolha…</option>
              {opcoes.locais.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </Campo>
        </div>
        <div className="bloco-recursos">
          <p className="rotulo-grupo">Do que você vai precisar? <small>(opcional)</small></p>
          {!local && <p className="texto-apoio">Escolha o local para ver os recursos disponíveis nele.</p>}
          {local && local.recursos.length === 0 && <p className="texto-apoio">Este local não oferece recursos extras.</p>}
          <div className="opcoes-marcar">
            {local?.recursos.map((r) => (
              <label key={r.id} className={`chip ${form.recursoIds.includes(r.id) ? 'marcado' : ''}`}>
                <input type="checkbox" checked={form.recursoIds.includes(r.id)} onChange={() => marcarRecurso(r.id)} />
                {form.recursoIds.includes(r.id) && <Icone nome="check" tamanho={16} />} {r.nome}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="cartao secao-form">
        <h2><span className="passo">3</span> Responsáveis</h2>
        <div className="grade-campos">
          <Campo rotulo="Nome do solicitante" ajuda="Quem está pedindo o evento" invalido={invalido('solicitante')}>
            <input value={form.solicitante} onChange={alterar('solicitante')} placeholder="Ex.: Prof. Carlos Lima" />
          </Campo>
          <Campo rotulo="Curso ou coordenação" invalido={invalido('cursoId')}>
            <select value={form.cursoId} onChange={alterar('cursoId')}>
              <option value="">Escolha…</option>
              {opcoes.cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Centro de custo" ajuda="Preenchido automaticamente pelo curso" opcional>
            <input value={curso?.centroCusto || ''} readOnly placeholder="—" tabIndex={-1} />
          </Campo>
        </div>
      </section>

      <section className="cartao secao-form">
        <h2><span className="passo">4</span> Detalhes</h2>
        <div className="grade-campos">
          <Campo rotulo="Por que fazer este evento? (justificativa)" largo invalido={invalido('justificativa')}>
            <textarea rows={3} value={form.justificativa} onChange={alterar('justificativa')} />
          </Campo>
          <Campo rotulo="O que se espera alcançar? (objetivo)" largo invalido={invalido('objetivo')}>
            <textarea rows={3} value={form.objetivo} onChange={alterar('objetivo')} />
          </Campo>
        </div>
        <div className="perguntas">
          <SimNao rotulo="Vai precisar de cerimonial?" valor={form.cerimonial} invalido={invalido('cerimonial')}
            aoMudar={(v) => setForm({ ...form, cerimonial: v })} />
          <SimNao rotulo="Haverá inscrições?" valor={form.inscricoes} invalido={invalido('inscricoes')}
            aoMudar={(v) => setForm({ ...form, inscricoes: v })} />
          <SimNao rotulo="Precisa emitir declarações?" valor={form.declaracoes} invalido={invalido('declaracoes')}
            aoMudar={(v) => setForm({ ...form, declaracoes: v })} />
        </div>
        <Campo rotulo="Observações" largo opcional>
          <textarea rows={2} value={form.observacoes} onChange={alterar('observacoes')} placeholder="Algo mais que o setor de Eventos precisa saber?" />
        </Campo>
      </section>

      {/* Barra de ações: fica presa embaixo da tela enquanto rola */}
      <div className="barra-acoes">
        {!admin && (
          <span className="progresso">
            {faltando === 0 ? <><Icone nome="check" tamanho={16} /> Tudo pronto para enviar</> : `${faltando} campo(s) obrigatório(s) faltando`}
          </span>
        )}
        <div className="barra-botoes">
          {!admin && (
            <button type="button" className="botao botao-secundario" disabled={salvando} onClick={() => gravar('salvar')}>
              Salvar rascunho
            </button>
          )}
          <button type="submit" className="botao botao-primario" disabled={salvando}>
            <Icone nome="check" /> {salvando ? 'Salvando…' : admin ? 'Salvar alterações' : 'Enviar pedido'}
          </button>
        </div>
      </div>
    </form>
  );
}

function Campo({ rotulo, ajuda, largo, opcional, invalido, children }) {
  return (
    <label className={`campo ${largo ? 'largo' : ''} ${invalido ? 'invalido' : ''}`}>
      <span>{rotulo}{!opcional && <em className="obrigatorio" aria-label="obrigatório"> *</em>}</span>
      {children}
      {invalido ? <small className="ajuda erro">Preencha este campo para enviar.</small> : ajuda && <small className="ajuda">{ajuda}</small>}
    </label>
  );
}

function SimNao({ rotulo, valor, aoMudar, invalido }) {
  return (
    <div className={`pergunta ${invalido ? 'invalido' : ''}`} role="radiogroup" aria-label={rotulo}>
      <span>{rotulo}<em className="obrigatorio"> *</em></span>
      <div className="sim-nao">
        <button type="button" className={valor === true ? 'ativo' : ''} onClick={() => aoMudar(true)} aria-pressed={valor === true}>Sim</button>
        <button type="button" className={valor === false ? 'ativo' : ''} onClick={() => aoMudar(false)} aria-pressed={valor === false}>Não</button>
      </div>
    </div>
  );
}
