import API from './Api';

export const consultaService = {
  // POST /consultas/agendar
  // body: { ... } (AgendamentoConsultaDTO)
  agendar: (dados) =>
    API.post('/consultas/agendar', dados),

  // GET /consultas/:id
  buscar: (id) =>
    API.get(`/consultas/${id}`),

  // GET /consultas/paciente/:pacienteId
  listarPorPaciente: (pacienteId) =>
    API.get(`/consultas/paciente/${pacienteId}`),

  // GET /consultas/medico/:medicoId
  listarPorMedico: (medicoId) =>
    API.get(`/consultas/medico/${medicoId}`),

  // PUT /consultas/:id/confirmar
  confirmarPresenca: (id) =>
    API.put(`/consultas/${id}/confirmar`),

  // DELETE /consultas/:id/cancelar
  cancelar: (id) =>
    API.delete(`/consultas/${id}/cancelar`),
};
