import API from './Api';

export const adminService = {
  // POST /admin
  // body: { nome, email, password, ... }
  cadastrar: (dados) =>
    API.post('/admin', dados),

  // POST /admin/medicos
  // body: { nome, email, password, cpf, rg, tell, horario, dataNascimento,
  //         crm (número), sexo, role, especialidade, endereco }
  cadastrarMedico: (dados) =>
    API.post('/admin/medicos', dados),

  // GET /admin/medicos
  listarMedicos: () =>
    API.get('/admin/medicos'),

  // GET /admin/pacientes
  listarPacientes: () =>
    API.get('/admin/pacientes'),

  // GET /admin
  listarAdmins: () =>
    API.get('/admin'),

  // GET /admin/:id
  buscar: (id) =>
    API.get(`/admin/${id}`),

  // GET /admin/relatorio
  gerarRelatorio: () =>
    API.get('/admin/relatorio'),

  // PUT /admin/:id
  redefinir: (id, dados) =>
    API.put(`/admin/${id}`, dados),

  // PUT /admin/medicos/:id
  redefinirMedico: (id, dados) =>
    API.put(`/admin/medicos/${id}`, dados),

  // PATCH /admin/:id
  atualizar: (id, dados) =>
    API.patch(`/admin/${id}`, dados),

  // PATCH /admin/medicos/:id
  atualizarMedico: (id, dados) =>
    API.patch(`/admin/medicos/${id}`, dados),

  // DELETE /admin/:id  →  204  (422 se for o último administrador)
  deletar: (id) =>
    API.delete(`/admin/${id}`),

  // DELETE /admin/medicos/:id
  deletarMedico: (id) =>
    API.delete(`/admin/medicos/${id}`),
};
