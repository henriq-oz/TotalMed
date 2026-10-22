import API from './Api';

export const filaService = {
  // POST /fila/entrar
  // body: { pacienteId, medicoId, ordemChegada }
  // ordemChegada: texto livre (a API usa "Normal" quando não vem nada)
  entrar: (dados) =>
    API.post('/fila/entrar', dados),

  // GET /fila
  // retorna a fila inteira (todos os médicos) — filtre por medico.id no front
  listar: () =>
    API.get('/fila'),

  // PUT /fila/:id/atendido
  marcarAtendido: (id) =>
    API.put(`/fila/${id}/atendido`),
};
