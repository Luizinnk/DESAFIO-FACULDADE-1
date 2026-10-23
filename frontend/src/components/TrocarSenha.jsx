import { useState } from 'react';
import { api } from '../api.js';
import { useAvisos } from './Avisos.jsx';
import Campo from './Campo.jsx';
import { CaixaErros } from './Comuns.jsx';

/** Janela para o próprio usuário trocar a senha (não depende do administrador). */
export default function TrocarSenha({ aoFechar }) {
  const avisar = useAvisos();
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [confirma, setConfirma] = useState('');
  const [erros, setErros] = useState([]);

  async function salvar(e) {
    e.preventDefault();
    if (nova !== confirma) return setErros(['A confirmação não é igual à nova senha.']);
    try {
      await api('/auth/senha', { metodo: 'PUT', corpo: { senhaAtual: atual, novaSenha: nova } });
      avisar('Senha alterada.');
      aoFechar();
    } catch (err) {
      setErros(err.erros);
    }
  }

  return (
    <div className="modal-fundo" onClick={aoFechar}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-senha" onClick={(e) => e.stopPropagation()} onSubmit={salvar}>
        <h2 id="titulo-senha">Trocar minha senha</h2>
        <CaixaErros erros={erros} />
        <Campo rotulo="Senha atual"><input type="password" autoComplete="current-password" value={atual} onChange={(e) => setAtual(e.target.value)} autoFocus /></Campo>
        <Campo rotulo="Nova senha" ajuda="Mínimo de 8 caracteres, com letras e números.">
          <input type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} />
        </Campo>
        <Campo rotulo="Repita a nova senha"><input type="password" autoComplete="new-password" value={confirma} onChange={(e) => setConfirma(e.target.value)} /></Campo>
        <div className="modal-acoes">
          <button type="button" className="botao botao-secundario" onClick={aoFechar}>Voltar</button>
          <button className="botao botao-primario">Salvar nova senha</button>
        </div>
      </form>
    </div>
  );
}
