// Valores do enum StatusAgendamento da API.
export const STATUS_CONSULTA = {
  Agendado: { rotulo: 'Agendado', classe: 'status-agendado' },
  Em_andamento: { rotulo: 'Em andamento', classe: 'status-andamento' },
  Confirmado: { rotulo: 'Confirmado', classe: 'status-confirmado' },
  Finalizado: { rotulo: 'Finalizado', classe: 'status-finalizado' },
  Cancelado: { rotulo: 'Cancelado', classe: 'status-cancelado' },
};

export const STATUS_EM_ABERTO = ['Agendado', 'Confirmado', 'Em_andamento'];

export const lerStatusConsulta = (consulta) =>
  STATUS_CONSULTA[consulta?.statusAgendamento] || STATUS_CONSULTA.Agendado;
