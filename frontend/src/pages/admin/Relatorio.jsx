import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import Campo from '../../components/Campo.jsx';
import Icone from '../../components/Icone.jsx';
import { Carregando, SeloStatus, TituloPagina } from '../../components/Comuns.jsx';
import { STATUS, dataBR, hojeISO, somarDias } from '../../util.js';

const FILTROS_VAZIOS = { dataInicio: '', dataFim: '', cursoId: '', temaId: '', localId: '', status: '' };

/** Transforma os filtros preenchidos em "dataInicio=...&temaId=..." (os vazios ficam de fora). */
const montarConsulta = (f) => new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();

/** Atalhos de período mais usados */
function periodos() {
  const hoje = new Date();
  const iso = (d) => d.toLocaleDateString('en-CA');
  const semestre = hoje.getMonth() < 6
    ? [new Date(hoje.getFullYear(), 0, 1), new Date(hoje.getFullYear(), 5, 30)]
    : [new Date(hoje.getFullYear(), 6, 1), new Date(hoje.getFullYear(), 11, 31)];
  return [
    { texto: 'Este mês', de: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), ate: iso(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)) },
    { texto: 'Próximos 30 dias', de: hojeISO(), ate: somarDias(hojeISO(), 30) },
    { texto: 'Este semestre', de: iso(semestre[0]), ate: iso(semestre[1]) },
  ];
}

/** TELA 9 — Relatório com filtros combináveis (aplicados na hora) e exportação em CSV. */
export default function Relatorio() {
  const [opcoes, setOpcoes] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [linhas, setLinhas] = useState(null);

  useEffect(() => { api('/opcoes').then(setOpcoes); }, []);
  useEffect(() => {
    setLinhas(null);
    api(`/admin/relatorio?${montarConsulta(filtros)}`).then(setLinhas);
  }, [filtros]);

  const alterar = (c) => (e) => setFiltros({ ...filtros, [c]: e.target.value });
  const atalhos = periodos();

  // Indicadores calculados a partir do resultado filtrado
  const total = linhas?.length || 0;
  const conta = (s) => linhas?.filter((l) => l.status === s).length || 0;
  const analisados = conta('APROVADO') + conta('REJEITADO');
  const taxaRejeicao = analisados ? Math.round((conta('REJEITADO') / analisados) * 100) : 0;
  const porLocal = Object.entries((linhas || []).reduce((acc, l) => ({ ...acc, [l.local || 'Sem local']: (acc[l.local || 'Sem local'] || 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1]);

  return (
    <>
      <TituloPagina titulo="Relatório de eventos" ajuda="relatorio" subtitulo="Os filtros são aplicados na hora. Exporte o resultado para planilha." />

      <section className="cartao">
        <div className="atalhos" role="group" aria-label="Atalhos de período">
          {atalhos.map((a) => {
            const ativo = filtros.dataInicio === a.de && filtros.dataFim === a.ate;
            return (
              <button key={a.texto} type="button" className={`chip ${ativo ? 'marcado' : ''}`} aria-pressed={ativo}
                onClick={() => setFiltros({ ...filtros, dataInicio: ativo ? '' : a.de, dataFim: ativo ? '' : a.ate })}>
                {a.texto}
              </button>
            );
          })}
        </div>
        <div className="filtros">
          <Campo rotulo="De" opcional><input type="date" value={filtros.dataInicio} onChange={alterar('dataInicio')} /></Campo>
          <Campo rotulo="Até" opcional><input type="date" value={filtros.dataFim} onChange={alterar('dataFim')} /></Campo>
          <Campo rotulo="Curso / coordenação" opcional>
            <select value={filtros.cursoId} onChange={alterar('cursoId')}>
              <option value="">Todos</option>
              {opcoes?.cursos.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Tema" opcional>
            <select value={filtros.temaId} onChange={alterar('temaId')}>
              <option value="">Todos</option>
              {opcoes?.temas.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Local" opcional>
            <select value={filtros.localId} onChange={alterar('localId')}>
              <option value="">Todos</option>
              {opcoes?.locais.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Status" opcional>
            <select value={filtros.status} onChange={alterar('status')}>
              <option value="">Todos</option>
              {['AGUARDANDO', 'APROVADO', 'REJEITADO', 'CANCELADO'].map((s) => <option key={s} value={s}>{STATUS[s].texto}</option>)}
            </select>
          </Campo>
        </div>
        {montarConsulta(filtros) && (
          <button type="button" className="botao-texto" onClick={() => setFiltros(FILTROS_VAZIOS)}>Limpar filtros</button>
        )}
      </section>

      {linhas && (
        <div className="indicadores">
          <div className="indicador"><strong>{total}</strong><span>evento(s) no resultado</span></div>
          <div className="indicador"><strong>{conta('APROVADO')}</strong><span>aprovado(s)</span></div>
          <div className="indicador"><strong>{conta('AGUARDANDO')}</strong><span>aguardando análise</span></div>
          <div className="indicador"><strong>{taxaRejeicao}%</strong><span>de rejeição entre os analisados</span></div>
        </div>
      )}
      {porLocal.length > 0 && (
        <p className="por-local"><strong>Por local:</strong> {porLocal.map(([l, n]) => `${l} (${n})`).join(' · ')}</p>
      )}

      <div className="titulo-resultado">
        <p>{linhas ? `${total} evento(s) encontrado(s)` : 'Buscando…'}</p>
        {/* O CSV usa exatamente os mesmos filtros da tabela */}
        <a className="botao botao-secundario" href={`/api/admin/relatorio/csv?${montarConsulta(filtros)}`}>
          <Icone nome="baixar" /> Exportar CSV
        </a>
      </div>

      {!linhas && <Carregando />}
      {linhas && linhas.length === 0 && <div className="vazio"><h3>Nenhum evento com esses filtros</h3></div>}
      {linhas && linhas.length > 0 && (
        <>
          {/* Computador: tabela compacta com a coluna Status sempre visível */}
          <div className="tabela-rolagem cartao sem-espaco so-computador">
            <table>
              <thead>
                <tr><th>Evento</th><th>Quando</th><th>Tema</th><th>Curso / centro de custo</th><th>Local</th><th>Solicitante</th><th className="coluna-fixa">Status</th></tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.nome}</strong></td>
                    <td className="nowrap">{dataBR(l.data)}<small className="bloco">{l.horaInicio}–{l.horaFim}</small></td>
                    <td>{l.tema}</td>
                    <td>{l.curso}<small className="bloco">{l.centroCusto}</small></td>
                    <td>{l.local}</td>
                    <td>{l.solicitante}</td>
                    <td className="coluna-fixa"><SeloStatus status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: um cartão por evento, sem rolagem lateral */}
          <ul className="cartoes-relatorio so-celular">
            {linhas.map((l) => (
              <li key={l.id} className="cartao">
                <div className="pedido-topo"><SeloStatus status={l.status} /><small>{l.tema}</small></div>
                <h3>{l.nome}</h3>
                <dl>
                  <dt>Quando</dt><dd>{dataBR(l.data)}, {l.horaInicio}–{l.horaFim}</dd>
                  <dt>Local</dt><dd>{l.local}</dd>
                  <dt>Curso</dt><dd>{l.curso} ({l.centroCusto})</dd>
                  <dt>Solicitante</dt><dd>{l.solicitante}</dd>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
