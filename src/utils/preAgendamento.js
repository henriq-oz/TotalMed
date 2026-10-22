// Rótulos e formatação do fluxo de pré-agendamento que não dependem de rede.
// As regras de negócio são da API (/fichas). Aqui ficam os rótulos, a máscara
// do código e a ordem da fila, que a API devolve só por horário de entrada.

// Valores do enum Status da API. As classes são as mesmas dos selos de status
// já usados no painel (status-*).
export const STATUS_PRE_AGENDAMENTO = {
  PENDENTE: { rotulo: 'Pendente', classe: 'status-andamento' },
  ACEITO: { rotulo: 'Aceito', classe: 'status-confirmado' },
  RECUSADO: { rotulo: 'Recusado', classe: 'status-cancelado' },
  VALIDADO: { rotulo: 'Chegou', classe: 'status-agendado' },
  CANCELADO: { rotulo: 'Cancelado', classe: 'status-finalizado' },
  EXPIRADO: { rotulo: 'Expirado', classe: 'status-finalizado' },
};

export const lerStatus = (preAgendamento) =>
  STATUS_PRE_AGENDAMENTO[preAgendamento?.status] || STATUS_PRE_AGENDAMENTO.PENDENTE;

// Valores do enum TipoFichaAtendimento da API.
export const TIPOS_FICHA = {
  NORMAL: { rotulo: 'Normal', classe: 'status-finalizado' },
  PREFERENCIAL: { rotulo: 'Preferencial', classe: 'status-andamento' },
  SUPERPREFERENCIAL: { rotulo: 'Superpreferencial', classe: 'status-cancelado' },
};

export const lerTipoFicha = (tipo) => TIPOS_FICHA[tipo] || TIPOS_FICHA.NORMAL;

/* ---------------------------------------------------------------- código */

// A API gera 8 caracteres no aceite e compara em maiúsculas.
const TAMANHO_CODIGO = 8;

// "6dfc-749d " -> "6DFC749D" (como a API guarda)
export const normalizarCodigo = (texto) =>
  String(texto ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, TAMANHO_CODIGO);

// "6DFC749D" -> "6DFC-749D". Serve tanto para exibir quanto como máscara de digitação.
export const formatarCodigo = (texto) => {
  const codigo = normalizarCodigo(texto);
  return codigo.length > 4 ? `${codigo.slice(0, 4)}-${codigo.slice(4)}` : codigo;
};

/* ------------------------------------------------------------------ fila */

// A entrada da fila guarda o tipo da ficha em ordemChegada.
const ORDEM_DE_CHAMADA = ['SUPERPREFERENCIAL', 'PREFERENCIAL', 'NORMAL'];

const prioridade = (entrada) => {
  const posicao = ORDEM_DE_CHAMADA.indexOf(entrada.ordemChegada);
  return posicao === -1 ? ORDEM_DE_CHAMADA.length : posicao;
};

// Superpreferencial, Preferencial, Normal; dentro da mesma prioridade, ordem de entrada.
export const ordenarFila = (entradas) =>
  [...entradas].sort(
    (a, b) => prioridade(a) - prioridade(b) || a.horarioEntrada.localeCompare(b.horarioEntrada),
  );
