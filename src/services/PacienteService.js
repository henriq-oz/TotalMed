import API from './Api';

export const pacienteService = {
  // POST /pacientes
  // body: { nome, email, cpf, rg, password, tell, dataNascimento, sexo,
  //         altura (metros), peso (kg), convenio, historicoMedico, endereco }
  // sexo: "MASCULINO" | "FEMININO" | "OUTRO"
  // endereco: { logradouro, bairro, cep, cidade, estado, complemento, uf, numero }
  cadastrar: (dados) =>
    API.post('/pacientes', dados),

  // GET /pacientes/:id
  buscar: (id) =>
    API.get(`/pacientes/${id}`),

  // GET /pacientes  (só os ativos)
  listar: () =>
    API.get('/pacientes'),

  // GET /pacientes/cpf/:cpf
  buscarPorCpf: (cpf) =>
    API.get(`/pacientes/cpf/${cpf}`),

  // GET /pacientes/nome/:nome  (busca parcial)
  buscarPorNome: (nome) =>
    API.get(`/pacientes/nome/${nome}`),

  // PUT /pacientes/:id  (redefinir todos os campos, inclusive a senha)
  redefinir: (id, dados) =>
    API.put(`/pacientes/${id}`, dados),

  // PATCH /pacientes/:id  (campos parciais)
  // aceita: nome, email, password, tell, convenio, historicoMedico, altura, peso, endereco
  atualizar: (id, dados) =>
    API.patch(`/pacientes/${id}`, dados),

  // DELETE /pacientes/:id  →  204
  // Exclusão definitiva: a API apaga junto os pré-agendamentos do paciente e as entradas na fila deles.
  deletar: (id) =>
    API.delete(`/pacientes/${id}`),
};
