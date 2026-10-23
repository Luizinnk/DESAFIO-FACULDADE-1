// Única porta de comunicação com o backend (Spring Boot).
// Se a API responder erro, lança um Error com a lista de mensagens em "erros".
export async function api(caminho, { metodo = 'GET', corpo } = {}) {
  const resposta = await fetch(`/api${caminho}`, {
    method: metodo,
    headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    credentials: 'same-origin',
  });
  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const erro = new Error(dados?.erros?.join(' ') || 'Não foi possível concluir. Tente novamente.');
    erro.erros = dados?.erros || [erro.message];
    erro.status = resposta.status;
    throw erro;
  }
  return dados;
}
