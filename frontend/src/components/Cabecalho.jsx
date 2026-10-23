import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Logo from './Logo.jsx';
import Icone from './Icone.jsx';

/** Itens do menu conforme o perfil de quem está logado. */
function itensDoMenu(usuario) {
  if (!usuario) return [{ para: '/', texto: 'Agenda', icone: 'agenda' }];
  if (usuario.perfil === 'ADMIN') {
    return [
      { para: '/', texto: 'Agenda', icone: 'agenda' },
      { para: '/admin/solicitacoes', texto: 'Solicitações', icone: 'lista' },
      { para: '/admin/cadastros', texto: 'Cadastros', icone: 'pasta' },
      { para: '/admin/usuarios', texto: 'Usuários', icone: 'pessoas' },
      { para: '/admin/relatorio', texto: 'Relatório', icone: 'grafico' },
    ];
  }
  return [
    { para: '/', texto: 'Agenda', icone: 'agenda' },
    { para: '/minhas', texto: 'Meus pedidos', icone: 'lista' },
    { para: '/solicitacoes/nova', texto: 'Novo pedido', icone: 'mais' },
  ];
}

export default function Cabecalho() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();
  const itens = itensDoMenu(usuario);

  async function fazerLogout() {
    await sair();
    navegar('/');
  }

  return (
    <>
      <header className="cabecalho">
        <div className="cabecalho-conteudo">
          <Logo />
          <nav className="menu-topo" aria-label="Menu principal">
            {itens.map((i) => (
              <NavLink key={i.para} to={i.para} end={i.para === '/'}>{i.texto}</NavLink>
            ))}
          </nav>
          <div className="conta">
            {usuario ? (
              <>
                <span className="conta-nome">
                  <strong>{usuario.nome.split(' ')[0]}</strong>
                  <small>{usuario.perfil === 'ADMIN' ? 'Administrador' : 'Solicitante'}</small>
                </span>
                <button className="botao botao-fantasma" onClick={fazerLogout} aria-label="Sair do sistema" title="Sair do sistema">
                  <Icone nome="sair" /> <span>Sair</span>
                </button>
              </>
            ) : (
              <NavLink to="/entrar" className="botao botao-primario">
                <Icone nome="entrar" /> Entrar
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* No celular, o menu vira uma barra fixa embaixo, como nos aplicativos */}
      {usuario && (
        <nav className="menu-inferior" aria-label="Menu">
          {itens.map((i) => (
            <NavLink key={i.para} to={i.para} end={i.para === '/'}>
              <Icone nome={i.icone} tamanho={22} />
              <span>{i.texto}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
