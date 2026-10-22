// Área do ADMINISTRADOR: análise de solicitações, cadastros, usuários e relatórios.
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const regras = require('../regras');
const { exigirAdmin, avisar } = require('../middlewares');

router.use(exigirAdmin); // todas as rotas abaixo exigem perfil ADMIN

const STATUS = ['AGUARDANDO', 'APROVADO', 'REJEITADO', 'CANCELADO', 'RASCUNHO'];

/* ===================== SOLICITAÇÕES ===================== */

router.get('/solicitacoes', (req, res) => {
  const status = STATUS.includes(req.query.status) ? req.query.status : 'AGUARDANDO';
  const eventos = db.prepare(`
    SELECT e.id, e.nome, e.data, e.hora_inicio, e.hora_fim, e.status, e.solicitante, l.nome AS local
    FROM eventos e LEFT JOIN locais l ON l.id = e.local_id
    WHERE e.status = ?
    ORDER BY e.data, e.hora_inicio`).all(status);
  // Rascunhos são privados do autor: o admin não vê
  res.render('admin/solicitacoes', { eventos, status, STATUS: STATUS.filter((s) => s !== 'RASCUNHO') });
});

function carregar(req, res) {
  const ev = regras.buscarEvento(req.params.id);
  if (!ev || ev.status === 'RASCUNHO') {
    res.status(404).render('erro', { mensagem: 'Solicitação não encontrada.' });
    return null;
  }
  return ev;
}

router.get('/solicitacoes/:id', (req, res) => {
  const ev = carregar(req, res);
  if (!ev) return;
  // Mostra ao admin, antes de aprovar, se já existe conflito
  const conflito = ev.status === 'AGUARDANDO' ? regras.buscarConflito(ev, ev.id) : null;
  res.render('detalhe_evento', { ev, modo: 'admin', conflito, EDITAVEIS: [] });
});

// APROVAR: revalida tudo (inclusive conflito), pois outro evento pode ter sido aprovado depois do envio
router.post('/solicitacoes/:id/aprovar', (req, res) => {
  const ev = carregar(req, res);
  if (!ev) return;
  if (ev.status !== 'AGUARDANDO') {
    avisar(req, 'erro', 'Só é possível aprovar solicitações aguardando aprovação.');
    return res.redirect(`/admin/solicitacoes/${ev.id}`);
  }
  const erros = regras.validarEnvio(ev, ev.id);
  if (erros.length) {
    avisar(req, 'erro', `Não foi possível aprovar: ${erros.join(' ')}`);
    return res.redirect(`/admin/solicitacoes/${ev.id}`);
  }
  db.prepare(`UPDATE eventos SET status = 'APROVADO', motivo_rejeicao = NULL,
    atualizado_em = datetime('now','localtime') WHERE id = ?`).run(ev.id);
  avisar(req, 'ok', 'Evento aprovado e publicado na página inicial.');
  res.redirect('/admin/solicitacoes');
});

// REJEITAR: justificativa obrigatória (fica visível ao autor)
router.post('/solicitacoes/:id/rejeitar', (req, res) => {
  const ev = carregar(req, res);
  if (!ev) return;
  const motivo = (req.body.motivo || '').trim();
  if (ev.status !== 'AGUARDANDO') {
    avisar(req, 'erro', 'Só é possível rejeitar solicitações aguardando aprovação.');
  } else if (!motivo) {
    avisar(req, 'erro', 'Informe a justificativa da rejeição.');
  } else {
    db.prepare(`UPDATE eventos SET status = 'REJEITADO', motivo_rejeicao = ?,
      atualizado_em = datetime('now','localtime') WHERE id = ?`).run(motivo, ev.id);
    avisar(req, 'ok', 'Solicitação rejeitada. O solicitante verá a justificativa.');
    return res.redirect('/admin/solicitacoes');
  }
  res.redirect(`/admin/solicitacoes/${ev.id}`);
});

// EDITAR evento APROVADO (somente admin), checando conflito de novo
router.get('/solicitacoes/:id/editar', (req, res) => {
  const ev = carregar(req, res);
  if (!ev) return;
  if (ev.status !== 'APROVADO') return res.redirect(`/admin/solicitacoes/${ev.id}`);
  res.render('form_evento', {
    ...regras.opcoesFormulario(), ev, erros: [], modo: 'admin',
    acao: `/admin/solicitacoes/${ev.id}/editar`, titulo: `Editar evento aprovado #${ev.id}`,
  });
});

router.post('/solicitacoes/:id/editar', (req, res) => {
  const atual = carregar(req, res);
  if (!atual) return;
  if (atual.status !== 'APROVADO') return res.redirect(`/admin/solicitacoes/${atual.id}`);
  const ev = regras.lerFormulario(req.body);
  const erros = regras.validarEnvio(ev, atual.id);
  if (erros.length) {
    return res.status(400).render('form_evento', {
      ...regras.opcoesFormulario(), ev, erros, modo: 'admin',
      acao: `/admin/solicitacoes/${atual.id}/editar`, titulo: `Editar evento aprovado #${atual.id}`,
    });
  }
  regras.salvarEvento(ev, { id: atual.id, status: 'APROVADO' });
  avisar(req, 'ok', 'Evento atualizado.');
  res.redirect(`/admin/solicitacoes/${atual.id}`);
});

router.post('/solicitacoes/:id/cancelar', (req, res) => {
  const ev = carregar(req, res);
  if (!ev) return;
  if (ev.status !== 'APROVADO') {
    avisar(req, 'erro', 'Somente eventos aprovados são cancelados por aqui.');
  } else {
    db.prepare(`UPDATE eventos SET status = 'CANCELADO', atualizado_em = datetime('now','localtime')
      WHERE id = ?`).run(ev.id);
    avisar(req, 'ok', 'Evento cancelado e removido da página pública.');
  }
  res.redirect(`/admin/solicitacoes/${ev.id}`);
});

/* ===================== CADASTROS AUXILIARES ===================== */
// Configuração única para os cadastros simples. A tela e as rotas são as mesmas para todos.
const CADASTROS = {
  temas: { titulo: 'Temas', tabela: 'temas', campos: [{ nome: 'nome', rotulo: 'Nome' }] },
  recursos: { titulo: 'Recursos', tabela: 'recursos', campos: [{ nome: 'nome', rotulo: 'Nome' }] },
  'centros-custo': {
    titulo: 'Centros de custo', tabela: 'centros_custo',
    campos: [{ nome: 'codigo', rotulo: 'Código' }, { nome: 'nome', rotulo: 'Nome' }],
  },
  cursos: {
    titulo: 'Cursos / coordenações', tabela: 'cursos',
    campos: [
      { nome: 'nome', rotulo: 'Nome' },
      { nome: 'centro_custo_id', rotulo: 'Centro de custo', tipo: 'select',
        opcoes: () => db.prepare("SELECT id, codigo || ' - ' || nome AS nome FROM centros_custo ORDER BY codigo").all() },
    ],
    listar: `SELECT c.*, cc.codigo || ' - ' || cc.nome AS centro_custo_id_nome
             FROM cursos c JOIN centros_custo cc ON cc.id = c.centro_custo_id ORDER BY c.nome`,
  },
  locais: {
    titulo: 'Locais (ambientes)', tabela: 'locais', campos: [{ nome: 'nome', rotulo: 'Nome' }], comRecursos: true,
  },
};

function config(req, res) {
  const cfg = CADASTROS[req.params.tipo];
  if (!cfg) res.status(404).render('erro', { mensagem: 'Cadastro não encontrado.' });
  return cfg;
}

router.get('/cadastros/:tipo', (req, res) => {
  const cfg = config(req, res);
  if (!cfg) return;
  const itens = db.prepare(cfg.listar || `SELECT * FROM ${cfg.tabela} ORDER BY nome`).all();
  if (cfg.comRecursos) {
    for (const item of itens) {
      const recs = db.prepare(`SELECT r.id, r.nome FROM local_recursos lr JOIN recursos r ON r.id = lr.recurso_id
        WHERE lr.local_id = ? ORDER BY r.nome`).all(item.id);
      item.recursos = recs.map((r) => r.id);
      item.recursos_nomes = recs.map((r) => r.nome).join(', ');
    }
  }
  const editando = itens.find((i) => i.id === Number(req.query.editar)) || null;
  const campos = cfg.campos.map((c) => (c.opcoes ? { ...c, lista: c.opcoes() } : c));
  const todosRecursos = cfg.comRecursos ? db.prepare('SELECT id, nome FROM recursos ORDER BY nome').all() : [];
  res.render('admin/cadastro', { cfg, campos, tipo: req.params.tipo, itens, editando, todosRecursos, CADASTROS });
});

// Cria (sem :id) ou atualiza (com :id)
router.post(['/cadastros/:tipo', '/cadastros/:tipo/:id'], (req, res) => {
  const cfg = config(req, res);
  if (!cfg) return;
  const valores = cfg.campos.map((c) => (req.body[c.nome] || '').trim());
  const voltar = `/admin/cadastros/${req.params.tipo}`;
  if (valores.some((v) => !v)) {
    avisar(req, 'erro', 'Preencha todos os campos.');
    return res.redirect(voltar);
  }
  const nomes = cfg.campos.map((c) => c.nome);
  db.exec('BEGIN');
  try {
    let id = Number(req.params.id) || null;
    if (id) {
      db.prepare(`UPDATE ${cfg.tabela} SET ${nomes.map((n) => `${n} = ?`).join(', ')} WHERE id = ?`).run(...valores, id);
    } else {
      id = Number(db.prepare(`INSERT INTO ${cfg.tabela} (${nomes.join(', ')}) VALUES (${nomes.map(() => '?').join(', ')})`)
        .run(...valores).lastInsertRowid);
    }
    if (cfg.comRecursos) {
      // Recalcula a lista de recursos do local
      db.prepare('DELETE FROM local_recursos WHERE local_id = ?').run(id);
      for (const r of [].concat(req.body.recursos || [])) {
        db.prepare('INSERT INTO local_recursos (local_id, recurso_id) VALUES (?, ?)').run(id, Number(r));
      }
    }
    db.exec('COMMIT');
    avisar(req, 'ok', 'Cadastro salvo.');
  } catch (e) {
    db.exec('ROLLBACK');
    avisar(req, 'erro', mensagemErroBanco(e));
  }
  res.redirect(voltar);
});

// Excluir: o banco recusa (chave estrangeira) se o cadastro estiver em uso
router.post('/cadastros/:tipo/:id/excluir', (req, res) => {
  const cfg = config(req, res);
  if (!cfg) return;
  try {
    db.prepare(`DELETE FROM ${cfg.tabela} WHERE id = ?`).run(Number(req.params.id));
    avisar(req, 'ok', 'Cadastro excluído.');
  } catch (e) {
    avisar(req, 'erro', mensagemErroBanco(e));
  }
  res.redirect(`/admin/cadastros/${req.params.tipo}`);
});

function mensagemErroBanco(e) {
  if (/FOREIGN KEY/.test(e.message)) {
    return 'Não é possível excluir/alterar: este cadastro está vinculado a eventos ou a outros cadastros.';
  }
  if (/UNIQUE/.test(e.message)) return 'Já existe um cadastro com esse nome/código.';
  throw e;
}

/* ===================== USUÁRIOS ===================== */

router.get('/usuarios', (req, res) => {
  const usuarios = db.prepare('SELECT id, nome, email, perfil, ativo FROM usuarios ORDER BY nome').all();
  const editando = usuarios.find((u) => u.id === Number(req.query.editar)) || null;
  res.render('admin/usuarios', { usuarios, editando });
});

router.post(['/usuarios', '/usuarios/:id'], (req, res) => {
  const id = Number(req.params.id) || null;
  const nome = (req.body.nome || '').trim();
  const email = (req.body.email || '').trim().toLowerCase();
  const perfil = req.body.perfil === 'ADMIN' ? 'ADMIN' : 'SOLICITANTE';
  const senha = req.body.senha || '';

  if (!nome || !email || (!id && !senha)) {
    avisar(req, 'erro', 'Nome, e-mail e senha são obrigatórios.');
  } else if (senha && senha.length < 6) {
    avisar(req, 'erro', 'A senha deve ter pelo menos 6 caracteres.');
  } else {
    try {
      if (id) {
        db.prepare('UPDATE usuarios SET nome = ?, email = ?, perfil = ? WHERE id = ?').run(nome, email, perfil, id);
        // Senha só muda se o admin digitar uma nova
        if (senha) db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(bcrypt.hashSync(senha, 10), id);
      } else {
        db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)')
          .run(nome, email, bcrypt.hashSync(senha, 10), perfil);
      }
      avisar(req, 'ok', 'Usuário salvo.');
    } catch (e) {
      avisar(req, 'erro', /UNIQUE/.test(e.message) ? 'Este e-mail já está cadastrado.' : e.message);
    }
  }
  res.redirect('/admin/usuarios');
});

// Ativar/desativar (não apagamos usuários, pois eles são autores de eventos)
router.post('/usuarios/:id/ativo', (req, res) => {
  const id = Number(req.params.id);
  if (id === req.session.usuario.id) {
    avisar(req, 'erro', 'Você não pode desativar o próprio usuário.');
  } else {
    db.prepare('UPDATE usuarios SET ativo = 1 - ativo WHERE id = ?').run(id);
    avisar(req, 'ok', 'Situação do usuário alterada.');
  }
  res.redirect('/admin/usuarios');
});

/* ===================== RELATÓRIO ===================== */

// Monta a consulta com os filtros que foram preenchidos (podem ser combinados)
function consultaRelatorio(q) {
  const where = ["e.status <> 'RASCUNHO'"];
  const params = [];
  if (q.data_inicio) { where.push('e.data >= ?'); params.push(q.data_inicio); }
  if (q.data_fim) { where.push('e.data <= ?'); params.push(q.data_fim); }
  if (q.curso_id) { where.push('e.curso_id = ?'); params.push(Number(q.curso_id)); }
  if (q.tema_id) { where.push('e.tema_id = ?'); params.push(Number(q.tema_id)); }
  if (STATUS.includes(q.status)) { where.push('e.status = ?'); params.push(q.status); }
  return db.prepare(`
    SELECT e.nome, e.data, e.hora_inicio, e.hora_fim, t.nome AS tema, c.nome AS curso,
           cc.codigo || ' - ' || cc.nome AS centro_custo, l.nome AS local, e.solicitante, e.status
    FROM eventos e
    LEFT JOIN temas t ON t.id = e.tema_id
    LEFT JOIN cursos c ON c.id = e.curso_id
    LEFT JOIN centros_custo cc ON cc.id = c.centro_custo_id
    LEFT JOIN locais l ON l.id = e.local_id
    WHERE ${where.join(' AND ')}
    ORDER BY e.data, e.hora_inicio`).all(...params);
}

router.get('/relatorio', (req, res) => {
  const { temas, cursos } = regras.opcoesFormulario();
  res.render('admin/relatorio', {
    linhas: consultaRelatorio(req.query), filtros: req.query, temas, cursos,
    STATUS: STATUS.filter((s) => s !== 'RASCUNHO'),
    queryString: new URLSearchParams(req.query).toString(),
  });
});

// Mesmo filtro, mesmas colunas, em CSV (separador ';' abre direto no Excel em português)
router.get('/relatorio.csv', (req, res) => {
  const colunas = ['nome', 'data', 'hora_inicio', 'hora_fim', 'tema', 'curso', 'centro_custo', 'local', 'solicitante', 'status'];
  const cabecalho = ['Evento', 'Data', 'Início', 'Fim', 'Tema', 'Curso/Coordenação', 'Centro de custo', 'Local', 'Solicitante', 'Status'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const linhas = consultaRelatorio(req.query)
    .map((l) => ({ ...l, data: req.app.locals.dataBR(l.data) }))
    .map((l) => colunas.map((c) => esc(l[c])).join(';'));
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="relatorio-eventos.csv"');
  res.send('﻿' + [cabecalho.map(esc).join(';'), ...linhas].join('\r\n')); // ﻿ = acentos corretos no Excel
});

module.exports = router;
