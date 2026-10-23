import { useCallback, useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { api } from '../../api.js';
import { useAvisos } from '../../components/Avisos.jsx';
import Confirmar from '../../components/Confirmar.jsx';
import Icone from '../../components/Icone.jsx';
import { CaixaErros, Carregando, TituloPagina } from '../../components/Comuns.jsx';

// Cada aba usa os mesmos componentes; muda só o que o formulário pede
const TIPOS = {
  temas: { titulo: 'Temas', singular: 'tema' },
  locais: { titulo: 'Locais', singular: 'local', recursos: true },
  recursos: { titulo: 'Recursos', singular: 'recurso' },
  cursos: { titulo: 'Cursos', singular: 'curso', centro: true },
  'centros-custo': { titulo: 'Centros de custo', singular: 'centro de custo', codigo: true },
};

const NOVO = { id: null, nome: '', codigo: '', centroCustoId: '', recursoIds: [] };

/** TELA 7 — Cadastros auxiliares usados no formulário de pedido. */
export default function Cadastros() {
  const { tipo } = useParams();
  const cfg = TIPOS[tipo] || TIPOS.temas;
  const avisar = useAvisos();
  const [itens, setItens] = useState(null);
  const [apoio, setApoio] = useState({ recursos: [], centros: [] });
  const [form, setForm] = useState(NOVO);
  const [erros, setErros] = useState([]);
  const [excluindo, setExcluindo] = useState(null);

  const carregar = useCallback(() => {
    api(`/admin/cadastros/${tipo}`).then(setItens).catch((e) => setErros([e.message]));
  }, [tipo]);

  useEffect(() => {
    setItens(null);
    setForm(NOVO);
    setErros([]);
    carregar();
    if (cfg.recursos) api('/admin/cadastros/recursos').then((r) => setApoio((a) => ({ ...a, recursos: r })));
    if (cfg.centro) api('/admin/cadastros/centros-custo').then((c) => setApoio((a) => ({ ...a, centros: c })));
  }, [tipo, carregar, cfg.recursos, cfg.centro]);

  async function salvar(e) {
    e.preventDefault();
    setErros([]);
    try {
      const corpo = { ...form, centroCustoId: form.centroCustoId ? Number(form.centroCustoId) : null };
      await api(form.id ? `/admin/cadastros/${tipo}/${form.id}` : `/admin/cadastros/${tipo}`,
        { metodo: form.id ? 'PUT' : 'POST', corpo });
      avisar(form.id ? 'Alterações salvas.' : `${cfg.singular[0].toUpperCase() + cfg.singular.slice(1)} cadastrado.`);
      setForm(NOVO);
      carregar();
    } catch (err) {
      setErros(err.erros);
    }
  }

  async function excluir() {
    const item = excluindo;
    setExcluindo(null);
    try {
      await api(`/admin/cadastros/${tipo}/${item.id}`, { metodo: 'DELETE' });
      avisar('Cadastro excluído.');
      carregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }

  const editar = (i) => setForm({ ...NOVO, ...i, codigo: i.codigo || '', centroCustoId: i.centroCustoId || '', recursoIds: i.recursoIds || [] });
  const marcar = (id) => setForm({ ...form, recursoIds: form.recursoIds.includes(id) ? form.recursoIds.filter((r) => r !== id) : [...form.recursoIds, id] });

  return (
    <>
      <TituloPagina titulo="Cadastros" subtitulo="Listas que aparecem para quem faz o pedido de evento." />
      <nav className="abas" aria-label="Tipo de cadastro">
        {Object.entries(TIPOS).map(([chave, t]) => (
          <NavLink key={chave} to={`/admin/cadastros/${chave}`} className={({ isActive }) => (isActive ? 'ativa' : '')}>{t.titulo}</NavLink>
        ))}
      </nav>

      <div className="duas-colunas">
        <form className="cartao" onSubmit={salvar}>
          <h2 className="titulo-cartao">{form.id ? `Editar ${cfg.singular}` : `Novo ${cfg.singular}`}</h2>
          <CaixaErros erros={erros} />
          {cfg.codigo && (
            <label className="campo"><span>Código</span>
              <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} placeholder="Ex.: CC-404" />
            </label>
          )}
          <label className="campo"><span>Nome</span>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </label>
          {cfg.centro && (
            <label className="campo"><span>Centro de custo</span>
              <select value={form.centroCustoId} onChange={(e) => setForm({ ...form, centroCustoId: e.target.value })}>
                <option value="">Escolha…</option>
                {apoio.centros.map((c) => <option key={c.id} value={c.id}>{c.codigo} - {c.nome}</option>)}
              </select>
            </label>
          )}
          {cfg.recursos && (
            <div className="campo"><span>Recursos que este local oferece</span>
              <div className="opcoes-marcar">
                {apoio.recursos.map((r) => (
                  <label key={r.id} className={`chip ${form.recursoIds.includes(r.id) ? 'marcado' : ''}`}>
                    <input type="checkbox" checked={form.recursoIds.includes(r.id)} onChange={() => marcar(r.id)} />
                    {form.recursoIds.includes(r.id) && <Icone nome="check" tamanho={16} />} {r.nome}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="linha-botoes">
            <button className="botao botao-primario"><Icone nome={form.id ? 'check' : 'mais'} /> {form.id ? 'Salvar' : 'Cadastrar'}</button>
            {form.id && <button type="button" className="botao botao-secundario" onClick={() => setForm(NOVO)}>Cancelar</button>}
          </div>
        </form>

        <div className="cartao sem-espaco">
          {!itens && <Carregando />}
          {itens?.length === 0 && <p className="texto-apoio centro">Nada cadastrado ainda.</p>}
          <ul className="lista-simples">
            {itens?.map((i) => (
              <li key={i.id} className={form.id === i.id ? 'editando' : ''}>
                <div>
                  <strong>{cfg.codigo ? `${i.codigo} - ${i.nome}` : i.nome}</strong>
                  {i.centroCusto && <small>{i.centroCusto}</small>}
                  {cfg.recursos && <small>{i.recursos || 'Sem recursos'}</small>}
                </div>
                <div className="acoes-linha">
                  <button className="botao-icone" onClick={() => editar(i)} aria-label={`Editar ${i.nome}`} title="Editar"><Icone nome="lapis" /></button>
                  <button className="botao-icone perigo" onClick={() => setExcluindo(i)} aria-label={`Excluir ${i.nome}`} title="Excluir"><Icone nome="lixo" /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Confirmar aberto={!!excluindo} titulo={`Excluir "${excluindo?.nome}"?`} perigo textoConfirmar="Sim, excluir"
        mensagem="Só é possível excluir se não estiver sendo usado em nenhum evento ou outro cadastro."
        aoConfirmar={excluir} aoFechar={() => setExcluindo(null)} />
    </>
  );
}
