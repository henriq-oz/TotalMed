import API from './Api';

export const unidadeService = {
  // GET /clinicas  →  [{ id, nome, telefone, ativa, endereco }]
  // As unidades de atendimento são as clínicas da API.
  listar: () =>
    API.get('/clinicas'),

  // POST /clinicas  →  body: { nome, telefone, endereco }
  // A API grava a unidade já com ativa = true.
  cadastrar: (dados) =>
    API.post('/clinicas', dados),

  // DELETE /clinicas/:id  →  204
  // Exclusão definitiva: a API apaga junto os pré-agendamentos da unidade e as entradas na fila deles.
  deletar: (id) =>
    API.delete(`/clinicas/${id}`),
};
