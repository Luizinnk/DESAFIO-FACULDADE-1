// Ponto de entrada da aplicação: configura o Express e registra as rotas.
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
// Funções auxiliares usadas dentro das telas
app.locals.dataBR = (d) => (d ? d.split('-').reverse().join('/') : '—'); // 2026-10-23 -> 23/10/2026
app.locals.STATUS_TEXTO = {
  RASCUNHO: 'Rascunho', AGUARDANDO: 'Aguardando aprovação', APROVADO: 'Aprovado',
  REJEITADO: 'Rejeitado', CANCELADO: 'Cancelado',
};

app.use(express.urlencoded({ extended: true })); // lê dados de formulários HTML
app.use((req, res, next) => { req.body ??= {}; next(); }); // Express 5 deixa undefined quando não há corpo
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 }, // 8 horas
}));

// Disponibiliza usuário logado e mensagens (flash) para todas as telas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.caminho = req.path;
  next();
});

app.use(require('./routes/publico'));
app.use(require('./routes/auth'));
app.use(require('./routes/solicitante'));
app.use('/admin', require('./routes/admin'));

app.use((req, res) => res.status(404).render('erro', { mensagem: 'Página não encontrada.' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('erro', { mensagem: 'Erro inesperado no servidor.' });
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => console.log(`AgendaUni rodando em http://localhost:${PORTA}`));
