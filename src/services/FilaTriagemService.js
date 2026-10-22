import API from './Api';
import { ordenarFila } from '../utils/preAgendamento';

// Fila de triagem = FilaAtendimento da API (/fila). Quem coloca o paciente na
// fila é o check-in (POST /fichas/validar/:codigo); não há endpoint de entrada.
//
// Formato da entrada:
//   { id, paciente, ordemChegada: tipo da ficha, horarioEntrada, atendido, fichas: [ficha] }

export const filaTriagemService = {
  // GET /fila  →  todos os não atendidos, por horário de entrada.
  // A API não filtra por unidade nem ordena por prioridade: as duas coisas são feitas aqui.
  async listar(unidadeId) {
    const { data } = await API.get('/fila');
    return {
      data: ordenarFila(
        data.filter((entrada) =>
          entrada.fichas?.some((ficha) => String(ficha.clinica?.id) === String(unidadeId)),
        ),
      ),
    };
  },

  // PUT /fila/:id/atendido  →  tira a entrada da fila
  marcarAtendido: (id) =>
    API.put(`/fila/${id}/atendido`),
};
