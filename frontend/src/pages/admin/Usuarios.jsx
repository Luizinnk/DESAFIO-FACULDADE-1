import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { useAvisos } from '../../components/Avisos.jsx';
import Icone from '../../components/Icone.jsx';
import { CaixaErros, Carregando, TituloPagina } from '../../components/Comuns.jsx';

const NOVO = { id: null, nome: '', email: '', senha: '', perfil: 'SOLICITANTE' };

/** TELA 8 — Usuários: só o administrador cria contas (não existe autocadastro). */
export default function Usuarios() {
  const { usuario: eu } = useAuth();
  const avisar = useAvisos();
  const [lista, setLista] = useState(null);
  const [form, setForm] = useState(NOVO);
  const [erros, setErros] = useState([]);

  const carregar = useCallback(() => { api('/admin/usuarios').then(setLista); }, []);
  useEffect(carregar, [carregar]);

  async function salvar(e) {
    e.preventDefault();
    setErros([]);
    try {
      await api(form.id ? `/admin/usuarios/${form.id}` : '/admin/usuarios', { metodo: form.id ? 'PUT' : 'POST', corpo: form });
      avisar(form.id ? 'Usuário atualizado.' : 'Usuário cadastrado. Envie o e-mail e a senha para a pessoa.');
      setForm(NOVO);
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

  return (
    <>
      <TituloPagina titulo="Usuários" subtitulo="Quem pode entrar no sistema e o que pode fazer." />
      <div className="duas-colunas">
        <form className="cartao" onSubmit={salvar}>
          <h2 className="titulo-cartao">{form.id ? 'Editar usuário' : 'Novo usuário'}</h2>
          <CaixaErros erros={erros} />
          <label className="campo"><span>Nome completo</span><input value={form.nome} onChange={alterar('nome')} /></label>
          <label className="campo"><span>E-mail (usado para entrar)</span><input type="email" value={form.email} onChange={alterar('email')} /></label>
          <label className="campo">
            <span>{form.id ? 'Nova senha' : 'Senha'}</span>
            <input type="password" autoComplete="new-password" value={form.senha} onChange={alterar('senha')} />
            <small className="ajuda">{form.id ? 'Deixe em branco para manter a senha atual.' : 'Mínimo de 6 caracteres.'}</small>
          </label>
          <div className="campo">
            <span>Perfil</span>
            <div className="sim-nao largo">
              <button type="button" className={form.perfil === 'SOLICITANTE' ? 'ativo' : ''} onClick={() => setForm({ ...form, perfil: 'SOLICITANTE' })}>Solicitante</button>
              <button type="button" className={form.perfil === 'ADMIN' ? 'ativo' : ''} onClick={() => setForm({ ...form, perfil: 'ADMIN' })}>Administrador</button>
            </div>
            <small className="ajuda">{form.perfil === 'ADMIN' ? 'Aprova pedidos, mantém cadastros e emite relatórios.' : 'Faz e acompanha pedidos de evento.'}</small>
          </div>
          <div className="linha-botoes">
            <button className="botao botao-primario"><Icone nome={form.id ? 'check' : 'mais'} /> {form.id ? 'Salvar' : 'Cadastrar'}</button>
            {form.id && <button type="button" className="botao botao-secundario" onClick={() => setForm(NOVO)}>Cancelar</button>}
          </div>
        </form>

        <div className="cartao sem-espaco">
          {!lista && <Carregando />}
          <ul className="lista-simples">
            {lista?.map((u) => (
              <li key={u.id} className={`${u.ativo ? '' : 'inativo'} ${form.id === u.id ? 'editando' : ''}`}>
                <div>
                  <strong>{u.nome}</strong>
                  <small>{u.email} · {u.perfil === 'ADMIN' ? 'Administrador' : 'Solicitante'}{u.ativo ? '' : ' · Desativado'}</small>
                </div>
                <div className="acoes-linha">
                  <button className="botao-icone" title="Editar" aria-label={`Editar ${u.nome}`}
                    onClick={() => setForm({ ...NOVO, ...u, senha: '' })}><Icone nome="lapis" /></button>
                  {u.id !== eu.id && (
                    <button className="botao botao-pequeno botao-secundario" onClick={() => alternar(u)}>
                      {u.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
