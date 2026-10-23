import { Children, cloneElement, isValidElement, useId } from 'react';

/**
 * Campo de formulário acessível: o rótulo fica ligado ao campo (htmlFor/id),
 * a dica e o erro são lidos pelo leitor de tela (aria-describedby) e o erro é anunciado (role="alert").
 */
export default function Campo({ rotulo, ajuda, erro, largo, opcional, children }) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const filho = Children.only(children);
  const campo = isValidElement(filho)
    ? cloneElement(filho, {
      id,
      'aria-invalid': erro ? true : undefined,
      'aria-describedby': erro || ajuda ? idAjuda : undefined,
    })
    : filho;

  return (
    <div className={`campo ${largo ? 'largo' : ''} ${erro ? 'invalido' : ''}`}>
      <label htmlFor={id}>{rotulo}{!opcional && <em className="obrigatorio" aria-hidden="true"> *</em>}</label>
      {campo}
      {erro
        ? <small id={idAjuda} className="ajuda erro" role="alert">{erro}</small>
        : ajuda && <small id={idAjuda} className="ajuda">{ajuda}</small>}
    </div>
  );
}
