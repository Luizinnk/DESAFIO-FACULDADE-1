import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { DUVIDAS, TUTORIAIS, perfilDe } from '../ajuda.js';
import { Duvida, useAjuda } from '../components/Ajuda.jsx';
import Icone from '../components/Icone.jsx';
import { TituloPagina } from '../components/Comuns.jsx';
import { CONTATO_EVENTOS } from '../util.js';

const normalizar = (t = '') => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const NOME_PERFIL = { VISITANTE: 'visitante', SOLICITANTE: 'solicitante', ADMIN: 'administrador' };

/** Central de ajuda: tutoriais do perfil de quem está usando + todas as dúvidas frequentes. */
export default function Ajuda() {
  const { usuario } = useAuth();
  const { abrirAjuda } = useAjuda();
  const perfil = perfilDe(usuario);
  const [busca, setBusca] = useState('');

  const bate = (texto) => !busca || normalizar(texto).includes(normalizar(busca));
  const tutoriais = Object.entries(TUTORIAIS)
    .filter(([, t]) => t.perfis.includes(perfil) && bate(`${t.titulo} ${t.resumo} ${t.passos(perfil).join(' ')}`));
  const duvidas = Object.entries(DUVIDAS).filter(([, d]) => bate(`${d.pergunta} ${d.resposta}`));

  return (
    <>
      <TituloPagina titulo="Ajuda" subtitulo={`Passo a passo para ${NOME_PERFIL[perfil]} e respostas para as dúvidas mais comuns.`} />

      <label className="busca busca-larga">
        <Icone nome="busca" />
        <span className="sr-only">Buscar na ajuda</span>
        <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="O que você quer saber? Ex.: centro de custo, conflito, senha" />
      </label>

      <h2 className="titulo-secao">O que você pode fazer</h2>
      {tutoriais.length === 0 && <p className="texto-apoio">Nenhum passo a passo encontrado com essa busca.</p>}
      <div className="lista-ajuda">
        {tutoriais.map(([chave, t]) => (
          <button key={chave} type="button" className="cartao-ajuda" onClick={() => abrirAjuda(chave)}>
            <span className="cartao-ajuda-icone" aria-hidden="true">?</span>
            <span>
              <strong>{t.titulo}</strong>
              <small>{t.resumo}</small>
            </span>
          </button>
        ))}
      </div>

      <h2 className="titulo-secao">Dúvidas frequentes</h2>
      {duvidas.length === 0 && <p className="texto-apoio">Nenhuma dúvida encontrada com essa busca.</p>}
      <div className="cartao lista-duvidas">
        {duvidas.map(([id]) => <Duvida key={id} id={id} aberta={!!busca} />)}
      </div>

      <p className="texto-apoio centro">
        Não encontrou o que procurava? Fale com o setor de Eventos: <a href={`mailto:${CONTATO_EVENTOS}`}>{CONTATO_EVENTOS}</a>
      </p>
    </>
  );
}
