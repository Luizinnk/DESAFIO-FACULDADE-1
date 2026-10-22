// Controle de acesso por perfil e mensagens de aviso entre telas.

// Exige estar logado (qualquer perfil)
function exigirLogin(req, res, next) {
  if (!req.session.usuario) {
    avisar(req, 'erro', 'Faça login para continuar.');
    return res.redirect('/login');
  }
  next();
}

// Exige perfil ADMIN
function exigirAdmin(req, res, next) {
  if (!req.session.usuario) return exigirLogin(req, res, next);
  if (req.session.usuario.perfil !== 'ADMIN') {
    return res.status(403).render('erro', { mensagem: 'Acesso permitido somente ao administrador.' });
  }
  next();
}

// Guarda uma mensagem que aparece na próxima página (padrão "flash")
function avisar(req, tipo, texto) {
  req.session.flash = { tipo, texto };
}

module.exports = { exigirLogin, exigirAdmin, avisar };
