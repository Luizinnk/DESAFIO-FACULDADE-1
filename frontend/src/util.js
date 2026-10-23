// Funções e textos usados em várias telas.

// Contato do setor de Eventos (fictício: troque pelo contato real)
export const CONTATO_EVENTOS = 'eventos@teste.com';

export const STATUS = {
  RASCUNHO: { texto: 'Rascunho', explicacao: 'Ainda não foi enviado. Só você consegue ver.' },
  AGUARDANDO: { texto: 'Aguardando aprovação', explicacao: 'Enviado. O setor de Eventos vai analisar.' },
  APROVADO: { texto: 'Aprovado', explicacao: 'Confirmado e publicado na agenda.' },
  REJEITADO: { texto: 'Rejeitado', explicacao: 'Veja o motivo, corrija e envie de novo.' },
  CANCELADO: { texto: 'Cancelado', explicacao: 'Não acontecerá. Fica guardado no histórico.' },
};

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
  'setembro', 'outubro', 'novembro', 'dezembro'];
const SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** '2026-10-25' -> '25/10/2026' */
export const dataBR = (d) => (d ? d.split('-').reverse().join('/') : '—');

/** '2026-10-25' -> { dia: 25, mes: 'outubro', ano: 2026, semana: 'domingo' } */
export function partesData(d) {
  const [ano, mes, dia] = d.split('-').map(Number);
  return { dia, mes: MESES[mes - 1], ano, semana: SEMANA[new Date(ano, mes - 1, dia).getDay()] };
}

export const horario = (ini, fim) => (ini || fim ? `${ini || '--:--'} às ${fim || '--:--'}` : 'Horário a definir');

export const simNao = (v) => (v === true ? 'Sim' : v === false ? 'Não' : '—');

/** Data de hoje no formato AAAA-MM-DD (fuso local) */
export const hojeISO = () => new Date().toLocaleDateString('en-CA');

/** Soma dias a uma data AAAA-MM-DD */
export function somarDias(iso, dias) {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d + dias).toLocaleDateString('en-CA');
}

/** "19:30" -> 1170 minutos */
export const emMinutos = (h) => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + mm; };
export const deMinutos = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Dois intervalos se sobrepõem quando um começa antes do outro terminar (mesma regra do backend). */
export const sobrepoe = (ini1, fim1, ini2, fim2) => emMinutos(ini1) < emMinutos(fim2) && emMinutos(fim1) > emMinutos(ini2);

/** Iniciais para o avatar: "Ana Administradora" -> "AA" */
export const iniciais = (nome = '') => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

/** Rótulos amigáveis para a linha do tempo */
export const ACOES = {
  CRIADO: 'Pedido criado', ENVIADO: 'Enviado para análise', REENVIADO: 'Corrigido e reenviado',
  APROVADO: 'Aprovado', REJEITADO: 'Rejeitado', CANCELADO: 'Cancelado', EDITADO: 'Alterado', IMAGEM: 'Arte do evento',
};
