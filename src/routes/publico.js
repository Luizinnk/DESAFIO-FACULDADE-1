// Página inicial pública: grade dos eventos APROVADOS do mês atual + 2 meses seguintes.
const router = require('express').Router();
const db = require('../db');

router.get('/', (req, res) => {
  const agora = new Date();
  const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);   // 1º dia do mês atual
  const fim = new Date(agora.getFullYear(), agora.getMonth() + 3, 0);  // último dia do mês atual + 2
  const fmt = (d) => d.toLocaleDateString('en-CA');

  const eventos = db.prepare(`
    SELECT e.data, e.nome, t.nome AS tema, e.hora_inicio, e.hora_fim, l.nome AS local,
           e.palestrante, c.nome AS curso
    FROM eventos e
    JOIN temas t ON t.id = e.tema_id
    JOIN locais l ON l.id = e.local_id
    JOIN cursos c ON c.id = e.curso_id
    WHERE e.status = 'APROVADO' AND e.data BETWEEN ? AND ?
    ORDER BY e.data, e.hora_inicio`).all(fmt(inicio), fmt(fim));

  res.render('publico', { eventos, inicio, fim });
});

module.exports = router;
