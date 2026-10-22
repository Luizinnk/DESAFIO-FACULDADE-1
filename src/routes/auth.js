// Login e logout. A senha é comparada com o hash salvo no banco (bcrypt).
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { avisar } = require('../middlewares');

router.get('/login', (req, res) => {
  if (req.session.usuario) return res.redirect(destinoInicial(req.session.usuario));
  res.render('login', { email: '' });
});

router.post('/login', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  const u = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);

  // Mesma mensagem para e-mail ou senha errados (não revela qual dos dois falhou)
  if (!u || !bcrypt.compareSync(req.body.senha || '', u.senha_hash)) {
    res.locals.flash = { tipo: 'erro', texto: 'E-mail ou senha inválidos.' };
    return res.status(401).render('login', { email });
  }
  if (!u.ativo) {
    res.locals.flash = { tipo: 'erro', texto: 'Usuário desativado. Procure o setor de Eventos.' };
    return res.status(403).render('login', { email });
  }

  req.session.regenerate(() => {
    req.session.usuario = { id: u.id, nome: u.nome, perfil: u.perfil };
    avisar(req, 'ok', `Bem-vindo(a), ${u.nome}!`);
    res.redirect(destinoInicial(req.session.usuario));
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

function destinoInicial(u) {
  return u.perfil === 'ADMIN' ? '/admin/solicitacoes' : '/minhas';
}

module.exports = router;
