import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { dataBR, deMinutos, emMinutos, sobrepoe } from '../util.js';
import Icone from './Icone.jsx';
import { BotaoAjuda } from './Ajuda.jsx';

const ABRE = 7 * 60;   // 07:00
const FECHA = 23 * 60; // 23:00

/** Horários livres entre os eventos APROVADOS, das 07:00 às 23:00. */
function horariosLivres(ocupacoes) {
  const aprovados = ocupacoes.filter((o) => o.status === 'APROVADO')
    .map((o) => [emMinutos(o.horaInicio), emMinutos(o.horaFim)]).sort((a, b) => a[0] - b[0]);
  const livres = [];
  let cursor = ABRE;
  for (const [ini, fim] of aprovados) {
    if (ini - cursor >= 30) livres.push([cursor, ini]);
    cursor = Math.max(cursor, fim);
  }
  if (FECHA - cursor >= 30) livres.push([cursor, FECHA]);
  return livres;
}

/**
 * Mostra a ocupação de um local num dia, ANTES de enviar o pedido:
 * vermelho = conflita com aprovado (será bloqueado); amarelo = outro pedido em análise no mesmo horário.
 * Os horários livres são clicáveis e preenchem o início e o término.
 */
export default function Disponibilidade({ localId, data, inicio, fim, ignorarId, aoEscolherHorario, aoCarregar }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    if (!localId || !data) { setInfo(null); aoCarregar?.(null); return; }
    const params = new URLSearchParams({ localId, data, ...(ignorarId ? { ignorarId } : {}) });
    api(`/disponibilidade?${params}`).then((r) => { setInfo(r); aoCarregar?.(r); }).catch(() => setInfo(null));
  }, [localId, data, ignorarId]);

  if (!localId || !data) {
    return <p className="disponibilidade vazia"><Icone nome="info" /> Escolha a data e o local para ver os horários ocupados.</p>;
  }
  if (!info) return null;

  const horarioValido = inicio && fim && emMinutos(fim) > emMinutos(inicio);
  const conflitoAprovado = horarioValido && info.ocupacoes.find((o) => o.status === 'APROVADO' && sobrepoe(inicio, fim, o.horaInicio, o.horaFim));
  const conflitoPendente = horarioValido && info.ocupacoes.find((o) => o.status === 'AGUARDANDO' && sobrepoe(inicio, fim, o.horaInicio, o.horaFim));
  const livres = horariosLivres(info.ocupacoes);

  function escolher([ini, fimLivre]) {
    // Mantém a duração já digitada (ou 1 hora), sem passar do fim do horário livre
    const duracao = horarioValido ? emMinutos(fim) - emMinutos(inicio) : 60;
    aoEscolherHorario(deMinutos(ini), deMinutos(Math.min(ini + duracao, fimLivre)));
  }

  return (
    <div className="disponibilidade" aria-live="polite">
      <p className="disponibilidade-titulo">
        <strong>{info.local}</strong> em {dataBR(data)}
        {info.capacidade && <span className="etiqueta">até {info.capacidade} pessoas</span>}
        <BotaoAjuda topico="conflito" />
      </p>

      {info.bloqueio && (
        <p className="alerta alerta-erro"><Icone nome="cadeado" /> Local bloqueado nesta data: {info.bloqueio}. Escolha outra data ou local.</p>
      )}
      {!info.bloqueio && conflitoAprovado && (
        <p className="alerta alerta-erro"><Icone nome="alerta" /> Este horário já está ocupado por "{conflitoAprovado.nome}" ({conflitoAprovado.horaInicio}–{conflitoAprovado.horaFim}). O envio será bloqueado.</p>
      )}
      {!info.bloqueio && !conflitoAprovado && conflitoPendente && (
        <p className="alerta alerta-aviso"><Icone nome="info" /> Há outro pedido em análise neste horário. Você pode enviar, mas só um deles poderá ser aprovado.</p>
      )}
      {!info.bloqueio && horarioValido && !conflitoAprovado && !conflitoPendente && (
        <p className="alerta alerta-ok"><Icone nome="check" /> Horário livre neste local.</p>
      )}

      {info.ocupacoes.length > 0 ? (
        <ul className="ocupados">
          {info.ocupacoes.map((o) => (
            <li key={o.id} className={o.status === 'APROVADO' ? 'aprovado' : 'pendente'}>
              <span className="nowrap">{o.horaInicio}–{o.horaFim}</span> {o.nome}
              <small>{o.status === 'APROVADO' ? 'ocupado' : 'em análise'}</small>
            </li>
          ))}
        </ul>
      ) : !info.bloqueio && <p className="texto-apoio">Nenhum evento neste local nesta data.</p>}

      {!info.bloqueio && aoEscolherHorario && livres.length > 0 && (
        <div className="livres">
          <span>Horários livres (toque para usar):</span>
          {livres.map((l) => (
            <button type="button" key={l[0]} className="chip" onClick={() => escolher(l)}>
              {deMinutos(l[0])}–{deMinutos(l[1])}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
