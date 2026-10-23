// CONTEÚDO DA AJUDA do AgendaUNI.
// - TUTORIAIS: passo a passo de uma ação. Os passos mudam conforme o perfil de quem está vendo
//   (visitante, solicitante ou administrador) e o botão "Fazer agora" leva direto para a tela certa.
// - DUVIDAS: perguntas frequentes que só explicam um conceito (não exigem nenhuma ação).
// Para mudar um texto da ajuda, basta editar este arquivo.

/** perfil: 'VISITANTE' | 'SOLICITANTE' | 'ADMIN' */
export const TUTORIAIS = {
  solicitar: {
    titulo: 'Como solicitar um evento',
    resumo: 'Do primeiro clique até o envio do pedido para análise.',
    perfis: ['VISITANTE', 'SOLICITANTE'],
    passos: (perfil) => [
      ...(perfil === 'VISITANTE'
        ? ['Clique em "Entrar" (canto de cima) e use o e-mail e a senha que o setor de Eventos enviou para você.']
        : []),
      'Toque em "Novo pedido".',
      'Etapa 1: escreva o nome do evento, escolha o tipo (tema), o palestrante e para quem é o evento.',
      'Etapa 2: escolha a data, o horário e o local. O sistema mostra na hora se o local já está ocupado e sugere horários livres.',
      'Etapa 3: confira o responsável (já vem com o seu nome) e escolha o curso. O centro de custo aparece sozinho.',
      'Etapa 4: responda à justificativa, ao objetivo e às três perguntas de Sim/Não.',
      'Se quiser, anexe a arte (cartaz) do evento.',
      'Toque em "Enviar pedido". Se ainda não terminou, use "Salvar rascunho" e continue depois.',
    ],
    acao: (perfil) => (perfil === 'VISITANTE' ? { texto: 'Entrar', para: '/entrar' } : { texto: 'Fazer um pedido agora', para: '/solicitacoes/nova' }),
    duvidas: ['rascunho', 'conflito', 'centro-custo', 'acesso'],
  },
  horario: {
    titulo: 'Como escolher um horário livre',
    resumo: 'Evite que o pedido seja recusado por conflito de agenda.',
    perfis: ['SOLICITANTE', 'ADMIN'],
    passos: () => [
      'No formulário, preencha primeiro a data e o local.',
      'Logo abaixo aparece a ocupação do local naquele dia.',
      'Uma faixa vermelha significa que o horário escolhido já está ocupado: o envio será bloqueado.',
      'Uma faixa amarela significa que há outro pedido em análise no mesmo horário: você pode enviar, mas só um será aprovado.',
      'Toque em um dos "Horários livres" para preencher o início e o término automaticamente.',
    ],
    duvidas: ['conflito', 'pendente', 'bloqueio'],
  },
  acompanhar: {
    titulo: 'Como acompanhar meus pedidos',
    resumo: 'Saiba em que situação está cada solicitação.',
    perfis: ['SOLICITANTE'],
    passos: () => [
      'Toque em "Meus pedidos".',
      'Use as abas (Rascunhos, Em análise, Aprovados…) para filtrar.',
      'Cada cartão mostra o status e uma frase explicando o que acontece agora.',
      'Toque no pedido para ver os detalhes e o histórico (quem fez o quê e quando).',
    ],
    acao: () => ({ texto: 'Ver meus pedidos', para: '/minhas' }),
    duvidas: ['status', 'cancelar-excluir'],
  },
  corrigir: {
    titulo: 'Como corrigir um pedido rejeitado',
    resumo: 'Veja o motivo, ajuste e envie de novo.',
    perfis: ['SOLICITANTE'],
    passos: () => [
      'Em "Meus pedidos", abra o pedido com o selo vermelho "Rejeitado".',
      'Leia o motivo escrito pelo setor de Eventos.',
      'Toque em "Corrigir e reenviar", ajuste o que foi pedido e toque em "Enviar pedido".',
      'O pedido volta para "Aguardando aprovação".',
    ],
    acao: () => ({ texto: 'Ver meus pedidos', para: '/minhas' }),
    duvidas: ['status'],
  },
  arte: {
    titulo: 'Como anexar a arte do evento',
    resumo: 'Coloque o cartaz para aparecer na agenda pública.',
    perfis: ['SOLICITANTE', 'ADMIN'],
    passos: () => [
      'No formulário do pedido, vá até a etapa "Arte do evento".',
      'Toque na área tracejada e escolha a imagem (JPG, PNG ou WEBP, até 5 MB).',
      'Confira a prévia. Dá para trocar ou remover antes de salvar.',
      'Salve ou envie o pedido normalmente: a imagem é enviada junto.',
    ],
    duvidas: ['imagem'],
  },
  calendario: {
    titulo: 'Como salvar um evento no meu calendário',
    resumo: 'Leve o evento para o Google Agenda ou para o celular.',
    perfis: ['VISITANTE', 'SOLICITANTE', 'ADMIN'],
    passos: () => [
      'Na Agenda, toque no cartão do evento.',
      'Toque em "Adicionar ao calendário" para baixar o arquivo (abre no Outlook, iPhone ou Android) ou em "Google Agenda".',
      'Para avisar alguém, use "Compartilhar no WhatsApp" ou "Copiar link".',
    ],
    acao: () => ({ texto: 'Abrir a agenda', para: '/' }),
    duvidas: ['periodo-agenda'],
  },
  senha: {
    titulo: 'Como trocar minha senha',
    resumo: 'Defina uma senha só sua.',
    perfis: ['SOLICITANTE', 'ADMIN'],
    passos: () => [
      'Toque no círculo com as suas iniciais, no canto de cima.',
      'Escolha "Trocar minha senha".',
      'Digite a senha atual e a nova duas vezes (mínimo de 8 caracteres, com letras e números).',
    ],
    duvidas: ['acesso'],
  },
  analisar: {
    titulo: 'Como aprovar ou rejeitar um pedido',
    resumo: 'Analise com segurança e publique na agenda.',
    perfis: ['ADMIN'],
    passos: () => [
      'Abra "Solicitações". A aba "Aguardando aprovação" mostra o que precisa de você.',
      'Cartões com faixa vermelha já conflitam com um evento aprovado.',
      'Abra o pedido: ao lado aparece a ocupação do local naquele dia.',
      'Toque em "Aprovar e publicar" e confirme. O sistema confere o conflito de novo e publica na agenda.',
      'Para recusar, toque em "Rejeitar", escolha um motivo rápido ou escreva o seu. O solicitante vê esse texto.',
    ],
    acao: () => ({ texto: 'Abrir solicitações', para: '/admin/solicitacoes' }),
    duvidas: ['conflito', 'status'],
  },
  ocupacao: {
    titulo: 'Como ver a ocupação e bloquear um local',
    resumo: 'Enxergue o dia de cada sala e impeça pedidos em manutenção.',
    perfis: ['ADMIN'],
    passos: () => [
      'Abra "Ocupação". Cada linha é um local, das 7h às 23h.',
      'Use as setas ou o campo de data para trocar o dia.',
      'Verde sólido = aprovado; amarelo tracejado = aguardando análise; listrado = bloqueado.',
      'Para bloquear, em "Novo bloqueio" escolha o local, as datas e o motivo, e toque em "Bloquear local".',
    ],
    acao: () => ({ texto: 'Abrir ocupação', para: '/admin/ocupacao' }),
    duvidas: ['bloqueio'],
  },
  cadastros: {
    titulo: 'Como manter os cadastros',
    resumo: 'Temas, locais, recursos, cursos e centros de custo.',
    perfis: ['ADMIN'],
    passos: () => [
      'Abra "Cadastros" e escolha a aba (Temas, Locais, Recursos, Cursos ou Centros de custo).',
      'Preencha o formulário da esquerda e toque em "Cadastrar".',
      'Para alterar, toque no lápis do item. Para apagar, toque na lixeira.',
      'Nos locais, informe a capacidade e marque os recursos que a sala oferece.',
    ],
    acao: () => ({ texto: 'Abrir cadastros', para: '/admin/cadastros' }),
    duvidas: ['excluir-cadastro', 'centro-custo', 'recursos'],
  },
  usuarios: {
    titulo: 'Como dar acesso a uma pessoa',
    resumo: 'Crie, altere ou desative usuários.',
    perfis: ['ADMIN'],
    passos: () => [
      'Abra "Usuários" e toque em "Novo usuário".',
      'Preencha nome, e-mail e uma senha inicial, e escolha o perfil.',
      'Envie o e-mail e a senha para a pessoa. Ela pode trocar a senha depois.',
      'Para tirar o acesso, toque em "Desativar". O histórico dos pedidos dela é mantido.',
    ],
    acao: () => ({ texto: 'Abrir usuários', para: '/admin/usuarios' }),
    duvidas: ['acesso', 'perfis'],
  },
  relatorio: {
    titulo: 'Como gerar um relatório',
    resumo: 'Filtre os eventos e exporte para planilha.',
    perfis: ['ADMIN'],
    passos: () => [
      'Abra "Relatório".',
      'Use os atalhos (Este mês, Próximos 30 dias…) ou escolha datas, curso, tema, local e status.',
      'Os números e a lista atualizam na hora.',
      'Toque em "Exportar CSV" para baixar exatamente o que está na tela (abre no Excel).',
    ],
    acao: () => ({ texto: 'Abrir relatório', para: '/admin/relatorio' }),
    duvidas: ['centro-custo'],
  },
};

export const DUVIDAS = {
  'centro-custo': {
    pergunta: 'O que é centro de custo?',
    resposta: 'É o código da área da universidade que "paga" pelo evento, usado pelo setor financeiro para saber de onde sai o dinheiro (por exemplo, CC-202 - Computação). Cada curso ou coordenação já está ligado a um centro de custo, por isso ele é preenchido sozinho quando você escolhe o curso.',
  },
  status: {
    pergunta: 'O que significa cada status do pedido?',
    resposta: 'Rascunho: ainda não enviado, só você vê. Aguardando aprovação: enviado, o setor de Eventos vai analisar. Aprovado: confirmado e publicado na agenda. Rejeitado: o setor pediu ajustes; leia o motivo, corrija e reenvie. Cancelado: não vai acontecer, mas fica guardado no histórico.',
  },
  conflito: {
    pergunta: 'O que é conflito de agenda?',
    resposta: 'É quando dois eventos ficariam no mesmo local, no mesmo dia, com horários que se sobrepõem. Exemplo: se o Auditório A está aprovado das 19h às 20h, um pedido das 19h30 às 21h conflita; já das 20h às 21h não conflita (encostar pode, sobrepor não). Eventos no mesmo horário em locais diferentes são permitidos.',
  },
  pendente: {
    pergunta: 'Por que aparece "outro pedido em análise" no meu horário?',
    resposta: 'Alguém já pediu o mesmo local e horário, mas ainda não foi aprovado. Você pode enviar mesmo assim, porém só um dos dois poderá ser aprovado. Se der, escolha um horário livre.',
  },
  bloqueio: {
    pergunta: 'O que é um local bloqueado?',
    resposta: 'É um período em que o local não pode receber eventos, como manutenção, provas ou reforma. Enquanto durar o bloqueio, o sistema não aceita pedidos para aquele local nessas datas.',
  },
  capacidade: {
    pergunta: 'O que é o público estimado?',
    resposta: 'É quantas pessoas você espera no evento. Se o local tiver capacidade cadastrada e o público for maior, o sistema avisa e não deixa enviar, para evitar sala lotada. O campo é opcional.',
  },
  rascunho: {
    pergunta: 'Qual a diferença entre "Salvar rascunho" e "Enviar pedido"?',
    resposta: 'O rascunho guarda o que você já preencheu (só o nome é obrigatório) e ninguém além de você vê. "Enviar pedido" exige todos os campos com *, confere data, horário e conflito, e manda para o setor de Eventos analisar.',
  },
  responsavel: {
    pergunta: 'Qual a diferença entre "Responsável pelo evento" e "Registrado por"?',
    resposta: '"Responsável pelo evento" é o nome livre de quem responde pelo evento (pode ser um professor ou coordenador). "Registrado por" é a conta que fez o pedido no sistema. Os dois ficam guardados separadamente.',
  },
  recursos: {
    pergunta: 'Por que os recursos mudam quando troco o local?',
    resposta: 'Cada sala tem seus próprios equipamentos (projetor, som, computadores…). Por isso só aparecem os recursos que o local escolhido realmente oferece.',
  },
  perguntas: {
    pergunta: 'O que significam cerimonial, inscrições e declarações?',
    resposta: 'São informações para o setor de Eventos se organizar: se precisa de cerimonial (mestre de cerimônias, protocolo), se haverá inscrição de participantes e se será preciso emitir declarações de participação. O sistema só registra as respostas; não faz inscrições nem emite declarações.',
  },
  acesso: {
    pergunta: 'Como consigo acesso? E se eu esquecer a senha?',
    resposta: 'Não existe cadastro pelo próprio site: quem cria as contas é o setor de Eventos. Se esquecer a senha, peça para o setor redefinir. Depois de entrar, você pode trocar a senha no menu com as suas iniciais.',
  },
  perfis: {
    pergunta: 'Qual a diferença entre Solicitante e Administrador?',
    resposta: 'O Solicitante faz e acompanha os próprios pedidos de evento. O Administrador analisa os pedidos (aprova ou rejeita), mantém os cadastros e usuários, vê a ocupação das salas e emite relatórios. O visitante, sem login, só consulta a agenda.',
  },
  'cancelar-excluir': {
    pergunta: 'Qual a diferença entre cancelar e excluir?',
    resposta: 'Excluir só vale para rascunhos (que nunca foram enviados): eles somem. Cancelar vale para pedidos já enviados: o pedido sai da análise ou da agenda, mas fica guardado no histórico.',
  },
  'excluir-cadastro': {
    pergunta: 'Por que não consigo excluir um cadastro?',
    resposta: 'Porque ele já está sendo usado por algum evento ou outro cadastro (por exemplo, um tema usado em um pedido). Isso protege o histórico. Você ainda pode editar o nome.',
  },
  imagem: {
    pergunta: 'Quem vê a arte do evento?',
    resposta: 'Enquanto o pedido não é aprovado, só você e o setor de Eventos veem a imagem. Depois da aprovação, ela aparece no cartão da agenda pública e na página do evento.',
  },
  'periodo-agenda': {
    pergunta: 'Por que a agenda mostra só três meses?',
    resposta: 'A agenda pública mostra os eventos aprovados do mês atual e dos dois meses seguintes, para ficar fácil de ler. Eventos mais distantes aparecem conforme os meses avançam.',
  },
  tema: {
    pergunta: 'O que é o tema (tipo de evento)?',
    resposta: 'É a categoria do evento, como Palestra, Workshop, Congresso ou Semana Acadêmica. A lista é mantida pelo setor de Eventos e ajuda a filtrar a agenda e os relatórios.',
  },
};

/** Perfil de quem está usando agora (sem login = visitante). */
export const perfilDe = (usuario) => usuario?.perfil || 'VISITANTE';
