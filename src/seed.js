// Popula o banco com dados FICTÍCIOS para a demonstração.
// Uso: npm run seed   (apaga tudo e recria)
const bcrypt = require('bcryptjs');
const db = require('./db');

// Datas relativas a hoje, para a grade pública sempre ter eventos
function diaDaqui(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('en-CA'); // formato AAAA-MM-DD
}

db.exec(`
  DELETE FROM evento_recursos; DELETE FROM eventos; DELETE FROM local_recursos;
  DELETE FROM recursos; DELETE FROM locais; DELETE FROM temas; DELETE FROM cursos;
  DELETE FROM centros_custo; DELETE FROM usuarios; DELETE FROM sqlite_sequence;
`);

const hash = (senha) => bcrypt.hashSync(senha, 10);
const insUsuario = db.prepare('INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES (?, ?, ?, ?)');
insUsuario.run('Ana Administradora', 'admin@teste.com', hash('admin123'), 'ADMIN');
insUsuario.run('Carlos Solicitante', 'carlos@teste.com', hash('carlos123'), 'SOLICITANTE');
insUsuario.run('Beatriz Solicitante', 'bia@teste.com', hash('bia123'), 'SOLICITANTE');

const insCentro = db.prepare('INSERT INTO centros_custo (codigo, nome) VALUES (?, ?)');
insCentro.run('CC-101', 'Engenharias');
insCentro.run('CC-202', 'Computação');
insCentro.run('CC-303', 'Saúde');

const insCurso = db.prepare('INSERT INTO cursos (nome, centro_custo_id) VALUES (?, ?)');
insCurso.run('Engenharia de Software', 2);
insCurso.run('Engenharia Mecânica', 1);
insCurso.run('Enfermagem', 3);

for (const t of ['Palestra', 'Congresso', 'Workshop', 'Semana Acadêmica']) {
  db.prepare('INSERT INTO temas (nome) VALUES (?)').run(t);
}
for (const l of ['Auditório A', 'Miniauditório', 'Sala 213', 'Laboratório 5']) {
  db.prepare('INSERT INTO locais (nome) VALUES (?)').run(l);
}
for (const r of ['Projetor', 'Microfone', 'Som', 'Computadores', 'Coffee break']) {
  db.prepare('INSERT INTO recursos (nome) VALUES (?)').run(r);
}
// local_id -> recursos disponíveis
const mapa = { 1: [1, 2, 3, 5], 2: [1, 2, 3], 3: [1], 4: [1, 4] };
for (const [local, recs] of Object.entries(mapa)) {
  for (const r of recs) db.prepare('INSERT INTO local_recursos VALUES (?, ?)').run(Number(local), r);
}

const insEvento = db.prepare(`
  INSERT INTO eventos (autor_id, solicitante, nome, tema_id, data, hora_inicio, hora_fim, local_id,
    curso_id, palestrante, publico_alvo, justificativa, objetivo, cerimonial, inscricoes, declaracoes,
    observacoes, status, motivo_rejeicao)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

const base = ['Público acadêmico', 'Integração com o mercado', 'Atualizar os alunos', 1, 1, 1, null];
insEvento.run(2, 'Prof. Carlos Lima', 'Palestra: IA na Engenharia', 1, diaDaqui(3), '19:00', '20:00', 1, 1, 'Dra. Marina Souza', ...base, 'APROVADO', null);
insEvento.run(3, 'Coord. Beatriz Ramos', 'Semana da Enfermagem', 4, diaDaqui(10), '08:00', '12:00', 2, 3, 'Equipe de Saúde', ...base, 'APROVADO', null);
insEvento.run(2, 'Prof. Carlos Lima', 'Workshop de Git', 3, diaDaqui(20), '14:00', '17:00', 4, 1, 'João Pereira', ...base, 'APROVADO', null);
insEvento.run(3, 'Coord. Beatriz Ramos', 'Congresso de Mecânica', 2, diaDaqui(5), '19:00', '22:00', 1, 2, 'Dr. Paulo Mendes', ...base, 'AGUARDANDO', null);
// Este conflita com a palestra aprovada (mesmo local/dia, 19:30 dentro de 19:00–20:00) -> bom para a demo
insEvento.run(2, 'Prof. Carlos Lima', 'Bate-papo com egressos', 1, diaDaqui(3), '19:30', '21:00', 1, 1, 'Ex-alunos', ...base, 'RASCUNHO', null);
insEvento.run(2, 'Prof. Carlos Lima', 'Hackathon interno', 3, diaDaqui(15), '08:00', '18:00', 4, 1, 'Comissão', ...base, 'REJEITADO', 'Laboratório em manutenção nessa data, escolha outro local.');
insEvento.run(3, 'Coord. Beatriz Ramos', 'Palestra cancelada', 1, diaDaqui(7), '10:00', '11:00', 3, 3, 'Convidado', ...base, 'CANCELADO', null);

const insEvRec = db.prepare('INSERT INTO evento_recursos VALUES (?, ?)');
insEvRec.run(1, 1); insEvRec.run(1, 2); insEvRec.run(2, 2); insEvRec.run(3, 4);

console.log('Banco populado com dados fictícios.');
