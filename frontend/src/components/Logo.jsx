import { Link } from 'react-router-dom';

/** Símbolo da Univille + nome do sistema escrito (logotipo tipográfico). */
export default function Logo({ claro = false }) {
  return (
    <Link to="/" className={`logo ${claro ? 'logo-claro' : ''}`} aria-label="AgendaUNI — página inicial">
      <img src="/logo-univille.png" alt="" className="logo-simbolo" />
      <span className="logo-texto">
        <span className="logo-nome">agenda<strong>UNI</strong></span>
        <span className="logo-sub">Eventos Univille</span>
      </span>
    </Link>
  );
}
