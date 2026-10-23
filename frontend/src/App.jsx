import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Cabecalho from './components/Cabecalho.jsx';
import { Carregando } from './components/Comuns.jsx';
import Agenda from './pages/Agenda.jsx';
import EventoPublico from './pages/EventoPublico.jsx';
import Ajuda from './pages/Ajuda.jsx';
import Login from './pages/Login.jsx';
import MinhasSolicitacoes from './pages/MinhasSolicitacoes.jsx';
import FormularioEvento from './pages/FormularioEvento.jsx';
import DetalheEvento from './pages/DetalheEvento.jsx';
import Painel from './pages/admin/Painel.jsx';
import Ocupacao from './pages/admin/Ocupacao.jsx';
import Solicitacoes from './pages/admin/Solicitacoes.jsx';
import Cadastros from './pages/admin/Cadastros.jsx';
import Usuarios from './pages/admin/Usuarios.jsx';
import Relatorio from './pages/admin/Relatorio.jsx';

/** Protege uma tela: exige login e, se pedido, o perfil de administrador. */
function Protegida({ admin = false, children }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Carregando />;
  if (!usuario) return <Navigate to="/entrar" replace />;
  if (admin && usuario.perfil !== 'ADMIN') return <Navigate to="/minhas" replace />;
  return children;
}

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]); // cada tela abre no topo

  return (
    <>
      <Cabecalho />
      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Agenda />} />
          <Route path="/eventos/:id" element={<EventoPublico />} />
          <Route path="/entrar" element={<Login />} />
          <Route path="/ajuda" element={<Ajuda />} />

          <Route path="/minhas" element={<Protegida><MinhasSolicitacoes /></Protegida>} />
          <Route path="/solicitacoes/nova" element={<Protegida><FormularioEvento modo="solicitante" /></Protegida>} />
          <Route path="/solicitacoes/:id" element={<Protegida><DetalheEvento modo="solicitante" /></Protegida>} />
          <Route path="/solicitacoes/:id/editar" element={<Protegida><FormularioEvento modo="solicitante" /></Protegida>} />

          <Route path="/admin" element={<Protegida admin><Painel /></Protegida>} />
          <Route path="/admin/ocupacao" element={<Protegida admin><Ocupacao /></Protegida>} />
          <Route path="/admin/solicitacoes" element={<Protegida admin><Solicitacoes /></Protegida>} />
          <Route path="/admin/solicitacoes/:id" element={<Protegida admin><DetalheEvento modo="admin" /></Protegida>} />
          <Route path="/admin/solicitacoes/:id/editar" element={<Protegida admin><FormularioEvento modo="admin" /></Protegida>} />
          <Route path="/admin/cadastros" element={<Navigate to="/admin/cadastros/temas" replace />} />
          <Route path="/admin/cadastros/:tipo" element={<Protegida admin><Cadastros /></Protegida>} />
          <Route path="/admin/usuarios" element={<Protegida admin><Usuarios /></Protegida>} />
          <Route path="/admin/relatorio" element={<Protegida admin><Relatorio /></Protegida>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="rodape">Univille · Software Engineering Challenge 2026 · Dados fictícios</footer>
    </>
  );
}
