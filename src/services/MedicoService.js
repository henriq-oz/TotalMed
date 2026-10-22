import API from './Api';

export const medicoService = {
  // POST /medicos
  // body: { nome, email, password, cpf, rg, tell, horario, dataNascimento,
  //         crm (número), sexo, role, especialidade, endereco }
  // sexo: "MASCULINO" | "FEMININO" | "OUTRO"
  // role: "MEDICO"
  // especialidade: "Cirurgia" | "Pediatria" | "Urologia" | "Ginecologia" |
  //                "Otorrinolaringologia" | "Enfermagem" | "Oftalmologia" |
  //                "Psiquiatria" | "Cardiologia" | "Dermatologia" |
  //                "Ortopedia" | "Radiologia" | "Outro"
  cadastrar: (dados) =>
    API.post('/medicos', dados),

  // GET /medicos/:id
  buscar: (id) =>
    API.get(`/medicos/${id}`),

  // GET /medicos
  listar: () =>
    API.get('/medicos'),

  // GET /medicos/rg/:rg
  buscarPorRg: (rg) =>
    API.get(`/medicos/rg/${rg}`),

  // GET /medicos/nome/:nome
  buscarPorNome: (nome) =>
    API.get(`/medicos/nome/${nome}`),

  // GET /medicos/:id/agenda
  visualizarAgenda: (id) =>
    API.get(`/medicos/${id}/agenda`),

  // PATCH /medicos/:id/consultas/:consultaId/finalizar
  // body: { diagnostico, observacoes }
  finalizarConsulta: (medicoId, consultaId, dados) =>
    API.patch(`/medicos/${medicoId}/consultas/${consultaId}/finalizar`, dados),

  // PUT /medicos/:id  (redefinir todos os campos)
  redefinir: (id, dados) =>
    API.put(`/medicos/${id}`, dados),

  // PATCH /medicos/:id  (atualizar campos parciais)
  atualizar: (id, dados) =>
    API.patch(`/medicos/${id}`, dados),

  // DELETE /medicos/:id
  deletar: (id) =>
    API.delete(`/medicos/${id}`),
};
