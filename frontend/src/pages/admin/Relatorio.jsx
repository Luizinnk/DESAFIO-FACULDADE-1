import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import Icone from '../../components/Icone.jsx';
import { Carregando, SeloStatus, TituloPagina } from '../../components/Comuns.jsx';
import { STATUS, dataBR } from '../../util.js';

const FILTROS_VAZIOS = { dataInicio: '', dataFim: '', cursoId: '', temaId: '', status: '' };

/** Transforma os filtros preenchidos em "?dataInicio=...&temaId=..." (os vazios ficam de fora). */
const montarConsulta = (f) => new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();

/** TELA 9 — Relatório com filtros combináveis e exportação em CSV. */
export default function Relatorio() {
  const [opcoes, setOpcoes] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [aplicados, setAplicados] = useState(FILTROS_VAZIOS);
  const [linhas, setLinhas] = useState(null);

  useEffect(() => { api('/opcoes').then(setOpcoes); }, []);
  useEffect(() => {
    setLinhas(null);
    api(`/admin/relatorio?${montarConsulta(aplicados)}`).then(setLinhas);
  }, [aplicados]);

  const alterar = (c) => (e) => setFiltros({ ...filtros, [c]: e.target.value });

  return (
    <>
      <TituloPagina titulo="Relatório de eventos" subtitulo="Combine os filtros e exporte o resultado para planilha." />

      <form className="cartao filtros" onSubmit={(e) => { e.preventDefault(); setAplicados(filtros); }}>
        <label className="campo"><span>De</span><input type="date" value={filtros.dataInicio} onChange={alterar('dataInicio')} /></label>
        <label className="campo"><span>Até</span><input type="date" value={filtros.dataFim} onChange={alterar('dataFim')} /></label>
        <label className="campo"><span>Curso / coordenação</span>
          <select value={filtros.cursoId} onChange={alterar('cursoId')}>
            <option value="">Todos</option>
            {opcoes?.cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        <label className="campo"><span>Tema</span>
          <select value={filtros.temaId} onChange={alterar('temaId')}>
            <option value="">Todos</option>
            {opcoes?.temas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
          </select>
        </label>
        <label className="campo"><span>Status</span>
          <select value={filtros.status} onChange={alterar('status')}>
            <option value="">Todos</option>
            {['AGUARDANDO', 'APROVADO', 'REJEITADO', 'CANCELADO'].map((s) => <option key={s} value={s}>{STATUS[s].texto}</option>)}
          </select>
        </label>
        <div className="linha-botoes filtros-botoes">
          <button className="botao botao-primario"><Icone nome="check" /> Aplicar filtros</button>
          <button type="button" className="botao botao-secundario" onClick={() => { setFiltros(FILTROS_VAZIOS); setAplicados(FILTROS_VAZIOS); }}>Limpar</button>
        </div>
      </form>

      <div className="titulo-resultado">
        <p>{linhas ? `${linhas.length} evento(s) encontrado(s)` : 'Buscando…'}</p>
        {/* O CSV usa exatamente os mesmos filtros aplicados na tabela */}
        <a className="botao botao-secundario" href={`/api/admin/relatorio/csv?${montarConsulta(aplicados)}`}>
          <Icone nome="baixar" /> Exportar CSV
        </a>
      </div>

      {!linhas && <Carregando />}
      {linhas && (
        <div className="tabela-rolagem cartao sem-espaco">
          <table>
            <thead>
              <tr><th>Evento</th><th>Data</th><th>Horário</th><th>Tema</th><th>Curso</th><th>Centro de custo</th><th>Local</th><th>Solicitante</th><th>Status</th></tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.id}>
                  <td><strong>{l.nome}</strong></td>
                  <td className="nowrap">{dataBR(l.data)}</td>
                  <td className="nowrap">{l.horaInicio} – {l.horaFim}</td>
                  <td>{l.tema}</td><td>{l.curso}</td><td>{l.centroCusto}</td><td>{l.local}</td><td>{l.solicitante}</td>
                  <td><SeloStatus status={l.status} /></td>
                </tr>
              ))}
              {linhas.length === 0 && <tr><td colSpan={9} className="centro texto-apoio">Nenhum evento com esses filtros.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
