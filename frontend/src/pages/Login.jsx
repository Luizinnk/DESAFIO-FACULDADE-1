import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';
import Icone from '../components/Icone.jsx';

/** TELA 2 — Login. Não existe autocadastro: o setor de Eventos cria as contas. */
export default function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={usuario.perfil === 'ADMIN' ? '/admin/solicitacoes' : '/minhas'} replace />;

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const u = await entrar(email, senha);
      navegar(u.perfil === 'ADMIN' ? '/admin/solicitacoes' : '/minhas');
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <form className="cartao login-cartao" onSubmit={enviar}>
        <div className="login-logo"><Logo /></div>
        <h1>Entrar</h1>
        <p className="texto-apoio">Use o e-mail e a senha que o setor de Eventos enviou para você.</p>

        {erro && <div className="caixa-erros" role="alert"><Icone nome="alerta" /> {erro}</div>}

        <label className="campo">
          <span>E-mail</span>
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@univille.br" required autoFocus />
        </label>
        <label className="campo">
          <span>Senha</span>
          <div className="campo-senha">
            <input type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password" value={senha}
              onChange={(e) => setSenha(e.target.value)} required />
            <button type="button" className="botao-texto" onClick={() => setMostrarSenha(!mostrarSenha)}>
              {mostrarSenha ? 'Esconder' : 'Mostrar'}
            </button>
          </div>
        </label>
        <button className="botao botao-primario botao-grande" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="texto-apoio centro">Não tem acesso? Procure o setor de Eventos.</p>
      </form>
    </div>
  );
}
