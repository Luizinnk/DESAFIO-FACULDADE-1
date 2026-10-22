// Área do SOLICITANTE: criar, salvar rascunho, enviar, editar, excluir e cancelar.
const router = require('express').Router();
const db = require('../db');
const regras = require('../regras');
const { exigirLogin, avisar } = require('../middlewares');

router.use(['/minhas', '/solicitacoes'], exigirLogin);

// Estados em que o AUTOR ainda pode editar (aprovado só o admin altera)
const EDITAVEIS = ['RASCUNHO', 'AGUARDANDO', 'REJEITADO'];

router.get('/minhas', (req, res) => {
  const eventos = db.prepare(`
    SELECT e.id, e.nome, e.data, e.hora_inicio, e.hora_fim, e.status, l.nome AS local
    FROM eventos e LEFT JOIN locais l ON l.id = e.local_id
    WHERE e.autor_id = ?
    ORDER BY e.atualizado_em DESC`).all(req.session.usuario.id);
  res.render('minhas', { eventos });
});

router.get('/solicitacoes/nova', (req, res) => {
  res.render('form_evento', {
    ...regras.opcoesFormulario(), ev: { recursos: [] }, erros: [], modo: 'solicitante',
    acao: '/solicitacoes', titulo: 'Nova solicitação de evento',
  });
});

router.post('/solicitacoes', (req, res) => gravar(req, res, null));

// Carrega um evento do próprio usuário (ou responde 404)
function eventoDoAutor(req, res) {
  const ev = regras.buscarEvento(req.params.id);
  if (!ev || ev.autor_id !== req.session.usuario.id) {
    res.status(404).render('erro', { mensagem: 'Solicitação não encontrada.' });
    return null;
  }
  return ev;
}

router.get('/solicitacoes/:id', (req, res) => {
  const ev = eventoDoAutor(req, res);
  if (ev) res.render('detalhe_evento', { ev, modo: 'solicitante', EDITAVEIS });
});

router.get('/solicitacoes/:id/editar', (req, res) => {
  const ev = eventoDoAutor(req, res);
  if (!ev) return;
  if (!EDITAVEIS.includes(ev.status)) {
    avisar(req, 'erro', 'Esta solicitação não pode mais ser editada.');
    return res.redirect(`/solicitacoes/${ev.id}`);
  }
  res.render('form_evento', {
    ...regras.opcoesFormulario(), ev, erros: [], modo: 'solicitante',
    acao: `/solicitacoes/${ev.id}`, titulo: `Editar solicitação #${ev.id}`,
  });
});

router.post('/solicitacoes/:id', (req, res) => {
  const ev = eventoDoAutor(req, res);
  if (!ev) return;
  if (!EDITAVEIS.includes(ev.status)) {
    avisar(req, 'erro', 'Esta solicitação não pode mais ser editada.');
    return res.redirect(`/solicitacoes/${ev.id}`);
  }
  gravar(req, res, ev.id);
});

// Botão clicado define a ação: "salvar" (rascunho) ou "enviar" (validação completa + conflito)
function gravar(req, res, id) {
  const ev = regras.lerFormulario(req.body);
  const enviar = req.body.acao === 'enviar';
  const erros = enviar ? regras.validarEnvio(ev, id || 0) : regras.validarRascunho(ev);

  if (erros.length) {
    return res.status(400).render('form_evento', {
      ...regras.opcoesFormulario(), ev, erros, modo: 'solicitante',
      acao: id ? `/solicitacoes/${id}` : '/solicitacoes',
      titulo: id ? `Editar solicitação #${id}` : 'Nova solicitação de evento',
    });
  }

  const novoId = regras.salvarEvento(ev, {
    id, autorId: req.session.usuario.id, status: enviar ? 'AGUARDANDO' : 'RASCUNHO',
  });
  avisar(req, 'ok', enviar ? 'Solicitação enviada para aprovação!' : 'Rascunho salvo.');
  res.redirect(`/solicitacoes/${novoId}`);
}

// Excluir: somente rascunho (nunca foi enviado, então pode sumir)
router.post('/solicitacoes/:id/excluir', (req, res) => {
  const ev = eventoDoAutor(req, res);
  if (!ev) return;
  if (ev.status !== 'RASCUNHO') {
    avisar(req, 'erro', 'Só é possível excluir rascunhos.');
    return res.redirect(`/solicitacoes/${ev.id}`);
  }
  db.prepare('DELETE FROM eventos WHERE id = ?').run(ev.id);
  avisar(req, 'ok', 'Rascunho excluído.');
  res.redirect('/minhas');
});

// Cancelar: somente pendente (o registro é mantido com status CANCELADO)
router.post('/solicitacoes/:id/cancelar', (req, res) => {
  const ev = eventoDoAutor(req, res);
  if (!ev) return;
  if (ev.status !== 'AGUARDANDO') {
    avisar(req, 'erro', 'Só é possível cancelar solicitações aguardando aprovação.');
    return res.redirect(`/solicitacoes/${ev.id}`);
  }
  db.prepare("UPDATE eventos SET status = 'CANCELADO', atualizado_em = datetime('now','localtime') WHERE id = ?").run(ev.id);
  avisar(req, 'ok', 'Solicitação cancelada.');
  res.redirect(`/solicitacoes/${ev.id}`);
});

module.exports = router;
