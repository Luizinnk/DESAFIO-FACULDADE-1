import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { iniciais } from '../util.js';
import Logo from './Logo.jsx';
import Icone from './Icone.jsx';
import TrocarSenha from './TrocarSenha.jsx';

/** Itens do menu conforme o perfil de quem está logado. */
function itensDoMenu(usuario) {
  if (!usuario) return [];
  if (usuario.perfil === 'ADMIN') {
    return [
      { para: '/admin', texto: 'Painel', icone: 'painel', fim: true },
      { para: '/admin/solicitacoes', texto: 'Solicitações', icone: 'lista', contador: true },
      { para: '/admin/ocupacao', texto: 'Ocupação', icone: 'agenda' },
      { para: '/admin/cadastros', texto: 'Cadastros', icone: 'pasta' },
      { para: '/admin/usuarios', texto: 'Usuários', icone: 'pessoas', soTopo: true },
      { para: '/admin/relatorio', texto: 'Relatório', icone: 'grafico' },
    ];
  }
  return [
    { para: '/', texto: 'Agenda', icone: 'agenda', fim: true },
    { para: '/minhas', texto: 'Meus pedidos', icone: 'lista' },
    { para: '/solicitacoes/nova', texto: 'Novo pedido', icone: 'mais' },
  ];
}

export default function Cabecalho() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);
  const [pendentes, setPendentes] = useState(0);
  const menuRef = useRef(null);
  const itens = itensDoMenu(usuario);
  const admin = usuario?.perfil === 'ADMIN';

  // Número de pedidos aguardando, mostrado no menu do admin (atualiza a cada troca de tela)
  useEffect(() => {
    if (admin) api('/admin/solicitacoes/contagem').then((c) => setPendentes(c.AGUARDANDO || 0)).catch(() => {});
  }, [admin, pathname]);

  // Fecha o menu da conta ao clicar fora ou trocar de tela
  useEffect(() => { setMenuAberto(false); }, [pathname]);
  useEffect(() => {
    const fora = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false); };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, []);

  async function fazerLogout() {
    await sair();
    navegar('/');
  }

  const rotulo = (i) => (
    <>
      {i.texto}
      {i.contador && pendentes > 0 && <span className="contador" aria-label={`${pendentes} aguardando`}>{pendentes}</span>}
    </>
  );

  return (
    <>
      <header className="cabecalho">
        <div className="cabecalho-conteudo">
          <Logo />
          <nav className="menu-topo" aria-label="Menu principal">
            {itens.map((i) => <NavLink key={i.para} to={i.para} end={i.fim}>{rotulo(i)}</NavLink>)}
          </nav>
          <div className="conta">
            <NavLink to="/ajuda" className="botao-ajuda-topo" aria-label="Ajuda" title="Ajuda">
              <span className="botao-ajuda" aria-hidden="true">?</span><span className="texto-ajuda">Ajuda</span>
            </NavLink>
            {usuario ? (
              <div className="menu-conta" ref={menuRef}>
                <button className="avatar-botao" onClick={() => setMenuAberto(!menuAberto)} aria-expanded={menuAberto}
                  aria-haspopup="menu" aria-label={`Conta de ${usuario.nome}`}>
                  <span className="avatar">{iniciais(usuario.nome)}</span>
                  <span className="conta-nome">
                    <strong>{usuario.nome.split(' ')[0]}</strong>
                    <small>{admin ? 'Administrador' : 'Solicitante'}</small>
                  </span>
                </button>
                {menuAberto && (
                  <div className="menu-suspenso" role="menu">
                    <div className="menu-suspenso-topo">
                      <strong>{usuario.nome}</strong>
                      <small>{usuario.email} · {admin ? 'Administrador' : 'Solicitante'}</small>
                    </div>
                    <Link to="/" role="menuitem"><Icone nome="agenda" /> Agenda pública</Link>
                    {admin && <Link to="/admin/usuarios" role="menuitem"><Icone nome="pessoas" /> Usuários</Link>}
                    <Link to="/ajuda" role="menuitem"><Icone nome="info" /> Ajuda e dúvidas</Link>
                    <button role="menuitem" onClick={() => { setMenuAberto(false); setTrocandoSenha(true); }}><Icone nome="lapis" /> Trocar minha senha</button>
                    <button role="menuitem" onClick={fazerLogout}><Icone nome="sair" /> Sair</button>
                  </div>
                )}
              </div>
            ) : pathname !== '/entrar' && (
              <NavLink to="/entrar" className="botao botao-primario"><Icone nome="entrar" /> Entrar</NavLink>
            )}
          </div>
        </div>
      </header>

      {/* No celular, o menu vira uma barra fixa embaixo, como nos aplicativos */}
      {usuario && (
        <nav className="menu-inferior" aria-label="Menu">
          {itens.filter((i) => !i.soTopo).map((i) => (
            <NavLink key={i.para} to={i.para} end={i.fim}>
              <span className="icone-com-contador">
                <Icone nome={i.icone} tamanho={22} />
                {i.contador && pendentes > 0 && <span className="contador">{pendentes}</span>}
              </span>
              <span>{i.texto}</span>
            </NavLink>
          ))}
        </nav>
      )}

      {trocandoSenha && <TrocarSenha aoFechar={() => setTrocandoSenha(false)} />}
    </>
  );
}
