import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Icone from '../components/Icone.jsx';
import { CONTATO_EVENTOS } from '../util.js';
import { BotaoAjuda } from '../components/Ajuda.jsx';

/** TELA 2 — Login. Não existe autocadastro: o setor de Eventos cria as contas. */
export default function Login() {
  const { usuario, entrar } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [esqueci, setEsqueci] = useState(false);

  if (usuario) return <Navigate to={usuario.perfil === 'ADMIN' ? '/admin' : '/minhas'} replace />;

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const u = await entrar(email, senha);
      navegar(u.perfil === 'ADMIN' ? '/admin' : '/minhas');
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <form className="cartao login-cartao" onSubmit={enviar}>
        <img src="/logo-univille.png" alt="" className="login-simbolo" />
        <h1>Entrar no AgendaUNI <BotaoAjuda topico="acesso" /></h1>
        <p className="texto-apoio">Use o e-mail e a senha que o setor de Eventos enviou para você.</p>

        {erro && <div className="caixa-erros" role="alert"><Icone nome="alerta" /> {erro}</div>}

        <div className="campo">
          <label htmlFor="login-email">E-mail</label>
          <input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="seu.email@univille.br" required autoFocus />
        </div>
        <div className="campo">
          <label htmlFor="login-senha">Senha</label>
          <div className="campo-senha">
            <input id="login-senha" type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password" value={senha}
              onChange={(e) => setSenha(e.target.value)} required />
            <button type="button" className="botao-texto" onClick={() => setMostrarSenha(!mostrarSenha)}
              aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}>
              {mostrarSenha ? 'Esconder' : 'Mostrar'}
            </button>
          </div>
        </div>
        <button className="botao botao-primario botao-grande" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
        <button type="button" className="botao-texto centro bloco" onClick={() => setEsqueci(!esqueci)} aria-expanded={esqueci}>
          Esqueci minha senha
        </button>
        {esqueci && (
          <p className="dica-caixa">
            Por segurança, a senha é redefinida pelo setor de Eventos. Envie um e-mail para{' '}
            <a href={`mailto:${CONTATO_EVENTOS}?subject=Redefinir%20senha%20do%20AgendaUNI`}>{CONTATO_EVENTOS}</a>.
            Depois de entrar, você pode trocar a senha no menu com as suas iniciais.
          </p>
        )}
        <p className="texto-apoio centro">
          Não tem acesso? Fale com o setor de Eventos: <a href={`mailto:${CONTATO_EVENTOS}`}>{CONTATO_EVENTOS}</a>
        </p>
      </form>
    </div>
  );
}
