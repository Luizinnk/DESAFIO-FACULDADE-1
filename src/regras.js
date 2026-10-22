// REGRAS DE NEGÓCIO das solicitações de evento.
// Fica separado das rotas para ficar fácil de explicar e de testar.
const db = require('./db');

const CAMPOS_TEXTO = ['nome', 'solicitante', 'palestrante', 'publico_alvo', 'justificativa', 'objetivo', 'observacoes'];
const CAMPOS_ID = ['tema_id', 'local_id', 'curso_id'];
const CAMPOS_SIM_NAO = ['cerimonial', 'inscricoes', 'declaracoes'];

// Data de hoje no formato AAAA-MM-DD (fuso local)
function hoje() {
  return new Date().toLocaleDateString('en-CA');
}

// Converte o que veio do formulário (tudo string) para o formato do banco
function lerFormulario(body) {
  const ev = {};
  for (const c of CAMPOS_TEXTO) ev[c] = (body[c] || '').trim() || null;
  for (const c of CAMPOS_ID) ev[c] = body[c] ? Number(body[c]) : null;
  for (const c of CAMPOS_SIM_NAO) ev[c] = body[c] === '1' ? 1 : body[c] === '0' ? 0 : null;
  ev.data = body.data || null;
  ev.hora_inicio = body.hora_inicio || null;
  ev.hora_fim = body.hora_fim || null;
  // checkbox múltiplo: pode vir string (1 marcado), array (vários) ou nada
  ev.recursos = [].concat(body.recursos || []).map(Number);
  return ev;
}

// Procura evento APROVADO no mesmo local e dia com horário sobreposto.
// Dois intervalos se sobrepõem quando: inicioA < fimB  E  fimA > inicioB.
// Ex.: aprovado 19:00–20:00. Pedido 19:30–21:00 -> conflita. Pedido 20:00–21:00 -> não conflita.
// Horários 'HH:MM' podem ser comparados como texto porque têm sempre 2 dígitos.
function buscarConflito(ev, ignorarId = 0) {
  return db.prepare(`
    SELECT e.id, e.nome, e.hora_inicio, e.hora_fim
    FROM eventos e
    WHERE e.status = 'APROVADO'
      AND e.local_id = ?
      AND e.data = ?
      AND e.id <> ?
      AND e.hora_inicio < ?
      AND e.hora_fim > ?
    LIMIT 1
  `).get(ev.local_id, ev.data, ignorarId, ev.hora_fim, ev.hora_inicio);
}

// Validação de RASCUNHO: pode estar incompleto, só exige o nome para identificar.
function validarRascunho(ev) {
  const erros = [];
  if (!ev.nome) erros.push('Informe pelo menos o nome do evento para salvar o rascunho.');
  erros.push(...validarRecursosDoLocal(ev));
  return erros;
}

// Validação COMPLETA: usada ao ENVIAR, ao APROVAR e quando o admin edita um aprovado.
function validarEnvio(ev, idAtual = 0) {
  const erros = [];
  const obrigatorios = {
    nome: 'Nome do evento', tema_id: 'Tema', data: 'Data', hora_inicio: 'Horário inicial',
    hora_fim: 'Horário final', local_id: 'Local', curso_id: 'Curso/coordenação',
    solicitante: 'Solicitante', palestrante: 'Palestrante', publico_alvo: 'Público-alvo',
    justificativa: 'Justificativa', objetivo: 'Objetivo', cerimonial: 'Cerimonial (sim/não)',
    inscricoes: 'Haverá inscrições (sim/não)', declaracoes: 'Necessidade de declarações (sim/não)',
  };
  for (const [campo, rotulo] of Object.entries(obrigatorios)) {
    if (ev[campo] === null || ev[campo] === undefined || ev[campo] === '') erros.push(`Campo obrigatório: ${rotulo}.`);
  }
  if (erros.length) return erros; // sem os campos básicos não dá pra checar o resto

  if (ev.data < hoje()) erros.push('A data do evento deve ser hoje ou uma data futura.');
  if (ev.hora_fim <= ev.hora_inicio) erros.push('O horário final deve ser posterior ao inicial (mesmo dia).');

  // Os cadastros escolhidos precisam existir
  if (!db.prepare('SELECT 1 FROM temas WHERE id = ?').get(ev.tema_id)) erros.push('Tema inválido.');
  if (!db.prepare('SELECT 1 FROM locais WHERE id = ?').get(ev.local_id)) erros.push('Local inválido.');
  if (!db.prepare('SELECT 1 FROM cursos WHERE id = ?').get(ev.curso_id)) erros.push('Curso inválido.');
  erros.push(...validarRecursosDoLocal(ev));

  if (!erros.length) {
    const conflito = buscarConflito(ev, idAtual);
    if (conflito) {
      erros.push(`Conflito de agenda: o local já está reservado para "${conflito.nome}" ` +
        `das ${conflito.hora_inicio} às ${conflito.hora_fim} nessa data.`);
    }
  }
  return erros;
}

// Só podem ser marcados recursos que o local escolhido possui
function validarRecursosDoLocal(ev) {
  if (!ev.recursos.length) return [];
  if (!ev.local_id) return ['Escolha o local antes de marcar recursos.'];
  const permitidos = db.prepare('SELECT recurso_id FROM local_recursos WHERE local_id = ?')
    .all(ev.local_id).map((r) => r.recurso_id);
  const invalido = ev.recursos.some((r) => !permitidos.includes(r));
  return invalido ? ['Algum recurso marcado não está disponível no local escolhido.'] : [];
}

// Insere ou atualiza o evento e seus recursos dentro de uma transação
function salvarEvento(ev, { id, autorId, status }) {
  const valores = [ev.nome, ev.solicitante, ev.tema_id, ev.data, ev.hora_inicio, ev.hora_fim, ev.local_id,
    ev.curso_id, ev.palestrante, ev.publico_alvo, ev.justificativa, ev.objetivo, ev.cerimonial,
    ev.inscricoes, ev.declaracoes, ev.observacoes, status];
  db.exec('BEGIN');
  try {
    if (id) {
      db.prepare(`UPDATE eventos SET nome=?, solicitante=?, tema_id=?, data=?, hora_inicio=?, hora_fim=?,
        local_id=?, curso_id=?, palestrante=?, publico_alvo=?, justificativa=?, objetivo=?, cerimonial=?,
        inscricoes=?, declaracoes=?, observacoes=?, status=?, atualizado_em=datetime('now','localtime')
        WHERE id=?`).run(...valores, id);
      db.prepare('DELETE FROM evento_recursos WHERE evento_id = ?').run(id);
    } else {
      id = Number(db.prepare(`INSERT INTO eventos (nome, solicitante, tema_id, data, hora_inicio, hora_fim,
        local_id, curso_id, palestrante, publico_alvo, justificativa, objetivo, cerimonial, inscricoes,
        declaracoes, observacoes, status, autor_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(...valores, autorId).lastInsertRowid);
    }
    const ins = db.prepare('INSERT INTO evento_recursos (evento_id, recurso_id) VALUES (?, ?)');
    for (const r of ev.recursos) ins.run(id, r);
    db.exec('COMMIT');
    return id;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

// Busca o evento com os nomes dos cadastros (para telas de detalhe)
function buscarEvento(id) {
  const ev = db.prepare(`
    SELECT e.*, t.nome AS tema, l.nome AS local, c.nome AS curso, cc.codigo || ' - ' || cc.nome AS centro_custo,
           u.nome AS autor
    FROM eventos e
    LEFT JOIN temas t ON t.id = e.tema_id
    LEFT JOIN locais l ON l.id = e.local_id
    LEFT JOIN cursos c ON c.id = e.curso_id
    LEFT JOIN centros_custo cc ON cc.id = c.centro_custo_id
    JOIN usuarios u ON u.id = e.autor_id
    WHERE e.id = ?`).get(id);
  if (!ev) return null;
  const recs = db.prepare(`SELECT r.id, r.nome FROM evento_recursos er JOIN recursos r ON r.id = er.recurso_id
    WHERE er.evento_id = ? ORDER BY r.nome`).all(id);
  ev.recursos = recs.map((r) => r.id);
  ev.recursos_nomes = recs.map((r) => r.nome);
  return ev;
}

// Dados para preencher os selects do formulário
function opcoesFormulario() {
  return {
    temas: db.prepare('SELECT id, nome FROM temas ORDER BY nome').all(),
    locais: db.prepare('SELECT id, nome FROM locais ORDER BY nome').all(),
    cursos: db.prepare(`SELECT c.id, c.nome, cc.codigo || ' - ' || cc.nome AS centro_custo
      FROM cursos c JOIN centros_custo cc ON cc.id = c.centro_custo_id ORDER BY c.nome`).all(),
    // { local_id: [{id, nome}, ...] } usado pelo JavaScript da página
    recursosPorLocal: db.prepare(`SELECT lr.local_id, r.id, r.nome FROM local_recursos lr
      JOIN recursos r ON r.id = lr.recurso_id ORDER BY r.nome`).all()
      .reduce((acc, r) => { (acc[r.local_id] ||= []).push({ id: r.id, nome: r.nome }); return acc; }, {}),
  };
}

module.exports = {
  hoje, lerFormulario, validarRascunho, validarEnvio, buscarConflito, salvarEvento, buscarEvento, opcoesFormulario,
};
