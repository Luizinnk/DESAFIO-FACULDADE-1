// Funções e textos usados em várias telas.

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
