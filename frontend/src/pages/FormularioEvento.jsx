import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, enviarArquivo } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useAvisos } from '../components/Avisos.jsx';
import Campo from '../components/Campo.jsx';
import { BotaoAjuda } from '../components/Ajuda.jsx';
import Disponibilidade from '../components/Disponibilidade.jsx';
import Icone from '../components/Icone.jsx';
import { CaixaErros, Carregando, TituloPagina } from '../components/Comuns.jsx';
import { emMinutos, hojeISO } from '../util.js';

const VAZIO = {
  nome: '', temaId: '', palestrante: '', publicoAlvo: '', publicoEstimado: '',
  data: '', horaInicio: '', horaFim: '', localId: '', recursoIds: [],
  solicitante: '', cursoId: '',
  justificativa: '', objetivo: '', cerimonial: null, inscricoes: null, declaracoes: null, observacoes: '',
};

// Campos obrigatórios para ENVIAR, agrupados pela etapa em que aparecem
const ETAPAS = {
  1: ['nome', 'temaId', 'palestrante', 'publicoAlvo'],
  2: ['data', 'horaInicio', 'horaFim', 'localId'],
  3: ['solicitante', 'cursoId'],
  4: ['justificativa', 'objetivo', 'cerimonial', 'inscricoes', 'declaracoes'],
};
const OBRIGATORIOS = Object.values(ETAPAS).flat();
const ULTIMO_CURSO = 'agendauni:ultimoCurso';

const vazio = (v) => v === '' || v === null || v === undefined;

function paraFormulario(ev) {
  const f = { ...VAZIO };
  for (const c of Object.keys(VAZIO)) if (!vazio(ev[c])) f[c] = ev[c];
  return f;
}

/** Converte os campos do formulário para o formato que a API espera (vazio vira null). */
function paraApi(f) {
  const numero = (v) => (vazio(v) ? null : Number(v));
  return {
    ...Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === '' ? null : v])),
    temaId: numero(f.temaId), localId: numero(f.localId), cursoId: numero(f.cursoId),
    publicoEstimado: numero(f.publicoEstimado), recursoIds: f.recursoIds,
  };
}

/** TELA 4 — Formulário de pedido (o admin usa o mesmo para editar um evento aprovado). */
export default function FormularioEvento({ modo }) {
  const { id } = useParams();
  const navegar = useNavigate();
  const avisar = useAvisos();
  const { usuario } = useAuth();
  const admin = modo === 'admin';
  const topo = useRef(null);

  const [opcoes, setOpcoes] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [status, setStatus] = useState(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState(null);
  const [imagemAtual, setImagemAtual] = useState(null);   // arte já salva
  const [novaImagem, setNovaImagem] = useState(null);     // arquivo escolhido agora
  const [previaNova, setPreviaNova] = useState(null);     // endereço temporário para mostrar a prévia
  const [removerImagem, setRemoverImagem] = useState(false);
  const [erros, setErros] = useState([]);
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [ocupacao, setOcupacao] = useState(null);

  useEffect(() => {
    api('/opcoes').then(setOpcoes).catch((e) => setErros([e.message]));
    if (id) {
      api(admin ? `/admin/solicitacoes/${id}` : `/solicitacoes/${id}`)
        .then((r) => {
          const ev = admin ? r.evento : r;
          setForm(paraFormulario(ev));
          setStatus(ev.status);
          setMotivoRejeicao(ev.motivoRejeicao);
          setImagemAtual(ev.imagem);
        })
        .catch((e) => setErros([e.message]));
    } else {
      // Pedido novo: já preenche o solicitante com o nome da conta e lembra o último curso usado
      setForm((f) => ({ ...f, solicitante: usuario?.nome || '', cursoId: localStorage.getItem(ULTIMO_CURSO) || '' }));
    }
  }, [id, admin, usuario]);

  if (!opcoes) return <Carregando />;

  const local = opcoes.locais.find((l) => String(l.id) === String(form.localId));
  const curso = opcoes.cursos.find((c) => String(c.id) === String(form.cursoId));
  const alterar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  // ---- Validação imediata (antes de enviar) ----
  const errosNaHora = {};
  if (form.data && form.data < hojeISO()) errosNaHora.data = 'A data não pode estar no passado.';
  if (form.horaInicio && form.horaFim && emMinutos(form.horaFim) <= emMinutos(form.horaInicio)) {
    errosNaHora.horaFim = 'O término precisa ser depois do início.';
  }
  const capacidade = ocupacao?.capacidade;
  if (capacidade && Number(form.publicoEstimado) > capacidade) {
    errosNaHora.publicoEstimado = `Este local comporta até ${capacidade} pessoas.`;
  }
  const erroDe = (campo) => errosNaHora[campo] || (tentouEnviar && vazio(form[campo]) ? 'Preencha este campo para enviar.' : null);

  const faltando = OBRIGATORIOS.filter((c) => vazio(form[c]));
  const etapaCompleta = (n) => ETAPAS[n].every((c) => !vazio(form[c])) && !ETAPAS[n].some((c) => errosNaHora[c]);

  const trocarLocal = (e) => setForm({ ...form, localId: e.target.value, recursoIds: [] });
  const marcarRecurso = (rid) => setForm({
    ...form,
    recursoIds: form.recursoIds.includes(rid) ? form.recursoIds.filter((r) => r !== rid) : [...form.recursoIds, rid],
  });

  /** Leva o usuário até o primeiro campo que falta preencher. */
  function irParaPrimeiroFaltando() {
    setTentouEnviar(true);
    const alvo = document.querySelector(`[data-campo="${faltando[0]}"] input, [data-campo="${faltando[0]}"] select, [data-campo="${faltando[0]}"] textarea, [data-campo="${faltando[0]}"] button`);
    alvo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => alvo?.focus(), 300);
  }

  function escolherImagem(e) {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type)) return avisar('Use uma imagem JPG, PNG ou WEBP.', 'erro');
    if (arquivo.size > 5 * 1024 * 1024) return avisar('A imagem deve ter no máximo 5 MB.', 'erro');
    setNovaImagem(arquivo);
    setPreviaNova(URL.createObjectURL(arquivo));
    setRemoverImagem(false);
  }

  async function gravar(acao) {
    const enviar = acao === 'enviar';
    setTentouEnviar(enviar);
    setErros([]);
    if (enviar && Object.keys(errosNaHora).length) {
      setErros(Object.values(errosNaHora));
      return topo.current?.scrollIntoView({ behavior: 'smooth' });
    }
    setSalvando(true);
    try {
      let salvo;
      if (admin) {
        salvo = await api(`/admin/solicitacoes/${id}`, { metodo: 'PUT', corpo: paraApi(form) });
      } else {
        const caminho = id ? `/solicitacoes/${id}?acao=${acao}` : `/solicitacoes?acao=${acao}`;
        salvo = await api(caminho, { metodo: id ? 'PUT' : 'POST', corpo: paraApi(form) });
      }
      if (form.cursoId) localStorage.setItem(ULTIMO_CURSO, form.cursoId);

      // A arte vai depois que o pedido existe (o pedido novo só ganha id ao ser salvo)
      const base = admin ? `/admin/solicitacoes/${salvo.id}` : `/solicitacoes/${salvo.id}`;
      try {
        if (novaImagem) await enviarArquivo(`${base}/imagem`, novaImagem);
        else if (removerImagem) await api(`${base}/imagem`, { metodo: 'DELETE' });
      } catch (erroImagem) {
        avisar(`Pedido salvo, mas a imagem não foi enviada: ${erroImagem.message}`, 'erro');
      }

      avisar(admin ? 'Evento atualizado.' : enviar ? 'Pedido enviado! Agora é só aguardar a análise.' : 'Rascunho salvo.');
      navegar(admin ? `/admin/solicitacoes/${salvo.id}` : `/solicitacoes/${salvo.id}`);
    } catch (e) {
      // Se só faltam campos, uma frase curta basta: os campos já ficam marcados em vermelho
      const soFaltando = e.erros.every((m) => m.startsWith('Preencha:'));
      setErros(soFaltando && e.erros.length > 1
        ? [`Faltam ${e.erros.length} campos obrigatórios. Eles estão marcados em vermelho abaixo.`]
        : e.erros);
      topo.current?.scrollIntoView({ behavior: 'smooth' });
    } finally {
      setSalvando(false);
    }
  }

  const titulo = admin ? 'Editar evento aprovado' : id ? 'Editar pedido' : 'Novo pedido de evento';
  const voltar = admin ? `/admin/solicitacoes/${id}` : id ? `/solicitacoes/${id}` : '/minhas';
  const previa = novaImagem ? previaNova : removerImagem ? null : imagemAtual;

  return (
    <form onSubmit={(e) => { e.preventDefault(); gravar('enviar'); }} noValidate>
      <div ref={topo} />
      <TituloPagina titulo={titulo} voltar={voltar} ajuda={admin ? 'analisar' : status === 'REJEITADO' ? 'corrigir' : 'solicitar'}
        subtitulo={admin ? 'As mudanças passam pela verificação de conflito de agenda.'
          : 'Preencha com calma. Você pode salvar e terminar depois.'} />

      {status === 'REJEITADO' && motivoRejeicao && (
        <div className="alerta-card alerta-card-erro">
          <Icone nome="info" />
          <div><strong>Motivo da rejeição</strong><p>{motivoRejeicao}</p><p className="texto-apoio">Corrija o que foi pedido e envie de novo.</p></div>
        </div>
      )}
      <CaixaErros erros={erros} />

      <section className="cartao secao-form">
        <Etapa n={1} completa={etapaCompleta(1)}>Sobre o evento</Etapa>
        <div className="grade-campos">
          <div className="largo" data-campo="nome">
            <Campo rotulo="Nome do evento" erro={erroDe('nome')}>
              <input value={form.nome} onChange={alterar('nome')} maxLength={150} placeholder="Ex.: Palestra sobre Inteligência Artificial" />
            </Campo>
          </div>
          <div data-campo="temaId">
            <Campo rotulo="Tipo de evento (tema)" erro={erroDe('temaId')} topicoAjuda="tema">
              <select value={form.temaId} onChange={alterar('temaId')}>
                <option value="">Escolha…</option>
                {opcoes.temas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
            </Campo>
          </div>
          <div data-campo="palestrante">
            <Campo rotulo="Palestrante" erro={erroDe('palestrante')}>
              <input value={form.palestrante} onChange={alterar('palestrante')} placeholder="Quem vai apresentar" />
            </Campo>
          </div>
          <div data-campo="publicoAlvo">
            <Campo rotulo="Público-alvo" erro={erroDe('publicoAlvo')}>
              <input value={form.publicoAlvo} onChange={alterar('publicoAlvo')} placeholder="Ex.: alunos de Engenharia" />
            </Campo>
          </div>
          <div data-campo="publicoEstimado">
            <Campo rotulo="Público estimado" opcional erro={errosNaHora.publicoEstimado} topicoAjuda="capacidade"
              ajuda={capacidade ? `O local escolhido comporta até ${capacidade} pessoas.` : 'Quantas pessoas devem participar.'}>
              <input type="number" min="1" inputMode="numeric" value={form.publicoEstimado} onChange={alterar('publicoEstimado')} placeholder="Ex.: 80" />
            </Campo>
          </div>
        </div>
      </section>

      <section className="cartao secao-form">
        <Etapa n={2} completa={etapaCompleta(2)}>Quando e onde <BotaoAjuda topico="horario" /></Etapa>
        <div className="grade-campos">
          <div data-campo="data">
            <Campo rotulo="Data" erro={erroDe('data')}>
              <input type="date" min={hojeISO()} value={form.data} onChange={alterar('data')} />
            </Campo>
          </div>
          <div data-campo="horaInicio">
            <Campo rotulo="Começa às" erro={erroDe('horaInicio')}>
              <input type="time" value={form.horaInicio} onChange={alterar('horaInicio')} />
            </Campo>
          </div>
          <div data-campo="horaFim">
            <Campo rotulo="Termina às" erro={erroDe('horaFim')}>
              <input type="time" value={form.horaFim} onChange={alterar('horaFim')} />
            </Campo>
          </div>
          <div data-campo="localId">
            <Campo rotulo="Local" erro={erroDe('localId')}>
              <select value={form.localId} onChange={trocarLocal}>
                <option value="">Escolha…</option>
                {opcoes.locais.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
              </select>
            </Campo>
          </div>
        </div>

        <Disponibilidade localId={form.localId} data={form.data} inicio={form.horaInicio} fim={form.horaFim}
          ignorarId={id} aoCarregar={setOcupacao}
          aoEscolherHorario={(ini, fim) => setForm((f) => ({ ...f, horaInicio: ini, horaFim: fim }))} />

        <fieldset className="bloco-recursos">
          <legend className="rotulo-grupo">Do que você vai precisar? <small>(opcional)</small> <BotaoAjuda topico="recursos" /></legend>
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
        </fieldset>
      </section>

      <section className="cartao secao-form">
        <Etapa n={3} completa={etapaCompleta(3)}>Responsáveis</Etapa>
        <div className="grade-campos">
          <div data-campo="solicitante">
            <Campo rotulo="Responsável pelo evento" topicoAjuda="responsavel" ajuda="Já vem com o seu nome. Troque se outra pessoa responder pelo evento."
              erro={erroDe('solicitante')}>
              <input value={form.solicitante} onChange={alterar('solicitante')} />
            </Campo>
          </div>
          <div data-campo="cursoId">
            <Campo rotulo="Curso ou coordenação" erro={erroDe('cursoId')}>
              <select value={form.cursoId} onChange={alterar('cursoId')}>
                <option value="">Escolha…</option>
                {opcoes.cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Campo>
          </div>
          <Campo rotulo="Centro de custo" ajuda="Preenchido automaticamente pelo curso." opcional topicoAjuda="centro-custo">
            <input value={curso?.centroCusto || ''} readOnly placeholder="—" tabIndex={-1} />
          </Campo>
        </div>
      </section>

      <section className="cartao secao-form">
        <Etapa n={4} completa={etapaCompleta(4)}>Detalhes</Etapa>
        <div className="grade-campos">
          <div className="largo" data-campo="justificativa">
            <Campo rotulo="Por que fazer este evento? (justificativa)" erro={erroDe('justificativa')}>
              <textarea rows={3} value={form.justificativa} onChange={alterar('justificativa')} />
            </Campo>
          </div>
          <div className="largo" data-campo="objetivo">
            <Campo rotulo="O que se espera alcançar? (objetivo)" erro={erroDe('objetivo')}>
              <textarea rows={3} value={form.objetivo} onChange={alterar('objetivo')} />
            </Campo>
          </div>
        </div>
        <p className="rotulo-grupo">Organização do evento <BotaoAjuda topico="perguntas" /></p>
        <div className="perguntas">
          <SimNao campo="cerimonial" rotulo="Vai precisar de cerimonial?" valor={form.cerimonial} invalido={tentouEnviar && vazio(form.cerimonial)}
            aoMudar={(v) => setForm({ ...form, cerimonial: v })} />
          <SimNao campo="inscricoes" rotulo="Haverá inscrições?" valor={form.inscricoes} invalido={tentouEnviar && vazio(form.inscricoes)}
            aoMudar={(v) => setForm({ ...form, inscricoes: v })} />
          <SimNao campo="declaracoes" rotulo="Precisa emitir declarações?" valor={form.declaracoes} invalido={tentouEnviar && vazio(form.declaracoes)}
            aoMudar={(v) => setForm({ ...form, declaracoes: v })} />
        </div>
        <Campo rotulo="Observações" largo opcional>
          <textarea rows={2} value={form.observacoes} onChange={alterar('observacoes')} placeholder="Algo mais que o setor de Eventos precisa saber?" />
        </Campo>
      </section>

      <section className="cartao secao-form">
        <h2><span className="passo opcional" aria-hidden="true"><Icone nome="imagem" tamanho={18} /></span>Arte do evento <small className="opcional-texto">(opcional)</small> <BotaoAjuda topico="arte" /></h2>
        <p className="texto-apoio">Se o evento já tem cartaz ou arte de divulgação, anexe aqui. Ela aparece no cartão da agenda pública depois da aprovação.</p>
        <div className="upload">
          {previa ? (
            <div className="upload-previa">
              <img src={previa} alt="Prévia da arte do evento" />
              <div className="linha-botoes">
                <label className="botao botao-secundario">
                  <Icone nome="imagem" /> Trocar imagem
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={escolherImagem} hidden />
                </label>
                <button type="button" className="botao botao-perigo-leve" onClick={() => { setNovaImagem(null); setRemoverImagem(true); }}>
                  <Icone nome="lixo" /> Remover
                </button>
              </div>
            </div>
          ) : (
            <label className="upload-area">
              <Icone nome="imagem" tamanho={32} />
              <strong>Toque para escolher uma imagem</strong>
              <small>JPG, PNG ou WEBP, até 5 MB. Formato ideal: horizontal (1200 × 630).</small>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={escolherImagem} className="sr-only" />
            </label>
          )}
        </div>
      </section>

      {/* Barra de ações: fica presa embaixo da tela enquanto rola */}
      <div className="barra-acoes">
        {!admin && (
          faltando.length === 0
            ? <span className="progresso ok"><Icone nome="check" tamanho={16} /> Tudo pronto para enviar</span>
            : <button type="button" className="progresso link-progresso" onClick={irParaPrimeiroFaltando}>
                {faltando.length} campo(s) obrigatório(s) faltando · <u>ir para o próximo</u>
              </button>
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

/** Título da etapa: mostra ✓ quando todos os campos obrigatórios dela estão preenchidos. */
function Etapa({ n, completa, children }) {
  return (
    <h2>
      <span className={`passo ${completa ? 'completo' : ''}`} aria-hidden="true">
        {completa ? <Icone nome="check" tamanho={18} /> : n}
      </span>
      {children}
      {completa && <span className="sr-only"> (etapa completa)</span>}
    </h2>
  );
}

function SimNao({ campo, rotulo, valor, aoMudar, invalido }) {
  return (
    <div className={`pergunta ${invalido ? 'invalido' : ''}`} data-campo={campo}>
      <span id={`rotulo-${campo}`}>{rotulo}<em className="obrigatorio" aria-hidden="true"> *</em></span>
      <div className="sim-nao" role="radiogroup" aria-labelledby={`rotulo-${campo}`} aria-invalid={invalido || undefined}>
        <button type="button" role="radio" aria-checked={valor === true} className={valor === true ? 'ativo' : ''} onClick={() => aoMudar(true)}>Sim</button>
        <button type="button" role="radio" aria-checked={valor === false} className={valor === false ? 'ativo' : ''} onClick={() => aoMudar(false)}>Não</button>
      </div>
      {invalido && <small className="ajuda erro" role="alert">Escolha Sim ou Não.</small>}
    </div>
  );
}
