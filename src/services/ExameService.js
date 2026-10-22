import API from './Api';

export const exameService = {
  // POST /exames/agendar
  // body: { ... } (AgendamentoExameDTO)
  agendar: (dados) =>
    API.post('/exames/agendar', dados),

  // GET /exames/:id
  buscar: (id) =>
    API.get(`/exames/${id}`),

  // GET /exames/paciente/:pacienteId
  listarPorPaciente: (pacienteId) =>
    API.get(`/exames/paciente/${pacienteId}`),

  // DELETE /exames/:id/cancelar
  cancelar: (id) =>
    API.delete(`/exames/${id}/cancelar`),
};
