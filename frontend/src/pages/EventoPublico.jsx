import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAvisos } from '../components/Avisos.jsx';
import Icone from '../components/Icone.jsx';
import { CaixaErros, Carregando, TituloPagina } from '../components/Comuns.jsx';
import { partesData } from '../util.js';

/** "2026-10-25" + "19:00" -> "20261025T190000" (formato dos calendários) */
const carimbo = (data, hora) => `${data.replaceAll('-', '')}T${hora.replace(':', '')}00`;

/** Gera e baixa um arquivo .ics, que abre em qualquer calendário (Google, Outlook, celular). */
function baixarIcs(e) {
  const texto = (t = '') => t.replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AgendaUNI//PT-BR',
    'BEGIN:VEVENT',
    `UID:evento-${e.id}@agendauni`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=America/Sao_Paulo:${carimbo(e.data, e.horaInicio)}`,
    `DTEND;TZID=America/Sao_Paulo:${carimbo(e.data, e.horaFim)}`,
    `SUMMARY:${texto(e.nome)}`,
    `LOCATION:${texto(`${e.local} - Univille`)}`,
    `DESCRIPTION:${texto(`Palestrante: ${e.palestrante}. ${e.objetivo || ''}`)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  link.download = `${e.nome.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase()}.ics`;
  link.click();
}

/** Página pública de um evento aprovado: detalhes, calendário e compartilhamento. */
export default function EventoPublico() {
  const { id } = useParams();
  const avisar = useAvisos();
  const [e, setE] = useState(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api(`/publico/eventos/${id}`).then((ev) => { setE(ev); document.title = `${ev.nome} — AgendaUNI`; }).catch((err) => setErro(err.message));
    return () => { document.title = 'AgendaUNI — Eventos Univille'; };
  }, [id]);

  if (erro) return <CaixaErros erros={[erro]} />;
  if (!e) return <Carregando />;

  const p = partesData(e.data);
  const endereco = window.location.href;
  const resumo = `${e.nome} — ${p.dia} de ${p.mes}, ${e.horaInicio} às ${e.horaFim}, ${e.local}.`;
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(e.nome)}`
    + `&dates=${carimbo(e.data, e.horaInicio)}/${carimbo(e.data, e.horaFim)}&ctz=America/Sao_Paulo`
    + `&location=${encodeURIComponent(`${e.local} - Univille`)}&details=${encodeURIComponent(`Palestrante: ${e.palestrante}`)}`;

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(endereco);
      avisar('Link copiado.');
    } catch {
      avisar('Não foi possível copiar. Copie o endereço da barra do navegador.', 'erro');
    }
  }

  return (
    <article className="pagina-evento">
      <TituloPagina titulo={e.nome} voltar="/" ajuda="calendario" subtitulo={`${e.tema} · Realização: ${e.curso}`} />
      {e.imagem && <img className="evento-capa" src={e.imagem} alt={`Arte do evento ${e.nome}`} />}

      <div className="resumo-evento">
        <div><Icone nome="agenda" /><span><small>Data</small>{p.semana}, {p.dia} de {p.mes}</span></div>
        <div className="hora"><Icone nome="relogio" /><span><small>Horário</small>{e.horaInicio} às {e.horaFim}</span></div>
        <div><Icone nome="local" /><span><small>Local</small>{e.local}</span></div>
        <div><Icone nome="microfone" /><span><small>Palestrante</small>{e.palestrante}</span></div>
      </div>

      <div className="cartao">
        <dl className="dados">
          <div className="largo"><dt>Sobre o evento</dt><dd>{e.objetivo || '—'}</dd></div>
          <div className="largo"><dt>Para quem</dt><dd>{e.publicoAlvo || '—'}</dd></div>
        </dl>
      </div>

      <div className="acoes-detalhe">
        <button className="botao botao-primario" onClick={() => baixarIcs(e)}><Icone nome="agenda" /> Adicionar ao calendário</button>
        <a className="botao botao-secundario" href={google} target="_blank" rel="noreferrer">Google Agenda</a>
        <a className="botao botao-secundario" href={`https://wa.me/?text=${encodeURIComponent(`${resumo} ${endereco}`)}`} target="_blank" rel="noreferrer">
          <Icone nome="compartilhar" /> Compartilhar no WhatsApp
        </a>
        <button className="botao botao-secundario" onClick={copiarLink}>Copiar link</button>
      </div>
    </article>
  );
}
