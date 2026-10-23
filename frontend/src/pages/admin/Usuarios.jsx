import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { useAvisos } from '../../components/Avisos.jsx';
import Campo from '../../components/Campo.jsx';
import { BotaoAjuda } from '../../components/Ajuda.jsx';
import Icone from '../../components/Icone.jsx';
import { CaixaErros, Esqueleto, TituloPagina } from '../../components/Comuns.jsx';
import { iniciais } from '../../util.js';

const NOVO = { id: null, nome: '', email: '', senha: '', perfil: 'SOLICITANTE' };
const normalizar = (t = '') => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/** TELA 8 — Usuários: só o administrador cria contas (não existe autocadastro). */
export default function Usuarios() {
  const { usuario: eu } = useAuth();
  const avisar = useAvisos();
  const [lista, setLista] = useState(null);
  const [form, setForm] = useState(null); // null = janela fechada
  const [erros, setErros] = useState([]);
  const [busca, setBusca] = useState('');
  const [perfil, setPerfil] = useState('');

  const carregar = useCallback(() => { api('/admin/usuarios').then(setLista); }, []);
  useEffect(() => { carregar(); }, [carregar]);

  function abrir(u) {
    setErros([]);
    setForm(u ? { ...NOVO, ...u, senha: '' } : NOVO);
  }

  async function salvar(e) {
    e.preventDefault();
    setErros([]);
    try {
      await api(form.id ? `/admin/usuarios/${form.id}` : '/admin/usuarios', { metodo: form.id ? 'PUT' : 'POST', corpo: form });
      avisar(form.id ? 'Usuário atualizado.' : 'Usuário cadastrado. Envie o e-mail e a senha para a pessoa.');
      setForm(null);
      carregar();
    } catch (err) {
      setErros(err.erros);
    }
  }

  async function alternar(u) {
    try {
      await api(`/admin/usuarios/${u.id}/ativo`, { metodo: 'POST' });
      avisar(u.ativo ? `${u.nome} não consegue mais entrar.` : `${u.nome} pode entrar novamente.`);
      carregar();
    } catch (err) {
      avisar(err.message, 'erro');
    }
  }

  const alterar = (c) => (e) => setForm({ ...form, [c]: e.target.value });
  const visiveis = (lista || []).filter((u) => (!perfil || u.perfil === perfil)
    && (!busca || normalizar(`${u.nome} ${u.email}`).includes(normalizar(busca))));

  return (
    <>
      <TituloPagina titulo="Usuários" ajuda="usuarios" subtitulo="Quem pode entrar no sistema e o que pode fazer.">
        <button className="botao botao-primario" onClick={() => abrir(null)}><Icone nome="mais" /> Novo usuário</button>
      </TituloPagina>

      <div className="barra-filtros">
        <label className="busca">
          <Icone nome="busca" />
          <span className="sr-only">Buscar usuário</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por nome ou e-mail" />
        </label>
        <div className="chips-rolagem" role="group" aria-label="Filtrar por perfil">
          {[['', 'Todos'], ['SOLICITANTE', 'Solicitantes'], ['ADMIN', 'Administradores']].map(([v, t]) => (
            <button key={v} className={`chip ${perfil === v ? 'marcado' : ''}`} onClick={() => setPerfil(v)} aria-pressed={perfil === v}>{t}</button>
          ))}
        </div>
      </div>

      {!lista && <Esqueleto quantidade={2} />}
      {lista && (
        <div className="cartao sem-espaco">
          {visiveis.length === 0 && <p className="texto-apoio centro espaco">Nenhum usuário encontrado.</p>}
          <ul className="lista-simples">
            {visiveis.map((u) => (
              <li key={u.id} className={u.ativo ? '' : 'inativo'}>
                <div className="usuario-linha">
                  <span className="avatar avatar-claro" aria-hidden="true">{iniciais(u.nome)}</span>
                  <div>
                    <strong>{u.nome}</strong>
                    <small>{u.email} · {u.perfil === 'ADMIN' ? 'Administrador' : 'Solicitante'}{u.ativo ? '' : ' · Desativado'}</small>
                  </div>
                </div>
                <div className="acoes-linha">
                  <button className="botao-icone" title="Editar" aria-label={`Editar ${u.nome}`} onClick={() => abrir(u)}><Icone nome="lapis" /></button>
                  {u.id !== eu.id && (
                    <button className="botao botao-pequeno botao-secundario" onClick={() => alternar(u)}>{u.ativo ? 'Desativar' : 'Reativar'}</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {form && (
        <div className="modal-fundo" onClick={() => setForm(null)}>
          <form className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-usuario" onClick={(e) => e.stopPropagation()} onSubmit={salvar}>
            <h2 id="titulo-usuario">{form.id ? 'Editar usuário' : 'Novo usuário'}</h2>
            <CaixaErros erros={erros} />
            <Campo rotulo="Nome completo"><input value={form.nome} onChange={alterar('nome')} autoFocus /></Campo>
            <Campo rotulo="E-mail (usado para entrar)"><input type="email" value={form.email} onChange={alterar('email')} /></Campo>
            <Campo rotulo={form.id ? 'Nova senha' : 'Senha'} opcional={!!form.id}
              ajuda={form.id ? 'Deixe em branco para manter a senha atual.' : 'Mínimo de 8 caracteres, com letras e números. A pessoa pode trocar depois.'}>
              <input type="password" autoComplete="new-password" value={form.senha} onChange={alterar('senha')} />
            </Campo>
            <div className="campo">
              <div className="rotulo-linha"><span id="rotulo-perfil" className="rotulo">Perfil</span><BotaoAjuda topico="perfis" /></div>
              <div className="sim-nao largo" role="radiogroup" aria-labelledby="rotulo-perfil">
                <button type="button" role="radio" aria-checked={form.perfil === 'SOLICITANTE'} className={form.perfil === 'SOLICITANTE' ? 'ativo' : ''} onClick={() => setForm({ ...form, perfil: 'SOLICITANTE' })}>Solicitante</button>
                <button type="button" role="radio" aria-checked={form.perfil === 'ADMIN'} className={form.perfil === 'ADMIN' ? 'ativo' : ''} onClick={() => setForm({ ...form, perfil: 'ADMIN' })}>Administrador</button>
              </div>
              <small className="ajuda">{form.perfil === 'ADMIN' ? 'Aprova pedidos, mantém cadastros e emite relatórios.' : 'Faz e acompanha pedidos de evento.'}</small>
            </div>
            <div className="modal-acoes">
              <button type="button" className="botao botao-secundario" onClick={() => setForm(null)}>Voltar</button>
              <button className="botao botao-primario"><Icone nome="check" /> {form.id ? 'Salvar' : 'Cadastrar'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
