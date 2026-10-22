import API from './Api';
import { filaTriagemService } from './FilaTriagemService';
import { normalizarCodigo } from '../utils/preAgendamento';

// Pré-agendamento = FichaInicial da API (/fichas). As regras são do backend:
// quando uma é violada, o Api.jsx rejeita com erro.response = { status, data: ApiError }
// e utils/erros.js traduz para a tela.
//
// Formato da ficha:
//   { id, status, dataPreferencial: "AAAA-MM-DDTHH:MM:SS", dataHoraCriacao,
//     tipoFichaAtendimento: "NORMAL" | "PREFERENCIAL" | "SUPERPREFERENCIAL",
//     motivoEnum: "COM_MOTIVO" | "SEM_MOTIVO", motivoString,
//     codigo, justificativaRecusa, paciente: { cadastro }, clinica: { unidade } }
//   status: "PENDENTE" | "ACEITO" | "RECUSADO" | "VALIDADO" | "CANCELADO" | "EXPIRADO"

// PUT /fichas/expirar marca como EXPIRADO as fichas PENDENTE/ACEITO com mais de
// 15 min de atraso. A API não roda isso sozinha, e a ficha vencida em aberto
// impede o paciente de pedir outra na mesma unidade.
// ponytail: dispara a cada listagem; some daqui quando a API tiver um @Scheduled.
const expirarVencidas = () =>
  API.put('/fichas/expirar').catch(() => {});

const maisRecentePrimeiro = (a, b) => b.dataHoraCriacao.localeCompare(a.dataHoraCriacao);

export const preAgendamentoService = {
  // POST /fichas/pacientes/:pacienteId
  // body: { unidadeId, dataPreferencial, tipoFichaAtendimento, motivoEnum, motivoString }
  // COM_MOTIVO exige a descrição e SEM_MOTIVO proíbe: sai do texto digitado.
  async criar(pacienteId, { unidadeId, dataPreferencial, tipoFichaAtendimento, motivo }) {
    await expirarVencidas();
    const motivoString = String(motivo ?? '').trim();
    return API.post(`/fichas/pacientes/${pacienteId}`, {
      unidadeId: Number(unidadeId),
      dataPreferencial,
      tipoFichaAtendimento,
      motivoEnum: motivoString ? 'COM_MOTIVO' : 'SEM_MOTIVO',
      motivoString: motivoString || null,
    });
  },

  // GET /fichas/pacientes/:pacienteId  (devolvido do mais recente para o mais antigo)
  async listarPorPaciente(pacienteId) {
    await expirarVencidas();
    const { data } = await API.get(`/fichas/pacientes/${pacienteId}`);
    return { data: data.sort(maisRecentePrimeiro) };
  },

  // GET /fichas  (recepção; a tela filtra por status, unidade e data)
  async listar() {
    await expirarVencidas();
    return API.get('/fichas');
  },

  // PUT /fichas/:id/aceitar
  // O código de 8 caracteres nasce aqui, só no aceite.
  aceitar: (id) =>
    API.put(`/fichas/${id}/aceitar`),

  // PUT /fichas/:id/recusar
  // body: { justificativa }
  recusar: (id, justificativa) =>
    API.put(`/fichas/${id}/recusar`, { justificativa }),

  // PUT /fichas/:id/cancelar  (paciente; só ficha PENDENTE ou ACEITO)
  cancelar: (id) =>
    API.put(`/fichas/${id}/cancelar`),

  // POST /fichas/validar/:codigo  →  ficha VALIDADO e paciente na fila
  // retorna: { preAgendamento, posicao } (posição na fila da unidade; 0 se a fila não carregou)
  async validarCodigo(codigo, unidadeId) {
    const procurado = normalizarCodigo(codigo);

    // A API valida o código sem saber de qual balcão ele veio. Para ele não ser
    // gasto na unidade errada, a ficha aceita é conferida antes.
    const { data: aceitas } = await API.get('/fichas?status=ACEITO');
    const ficha = aceitas.find((item) => item.codigo === procurado);
    if (ficha && String(ficha.clinica?.id) !== String(unidadeId)) {
      const erro = new Error('Código de outra unidade');
      erro.response = {
        status: 422,
        data: {
          message: `Este código é da unidade ${ficha.clinica?.nome}. Confira a unidade selecionada no balcão.`,
        },
      };
      throw erro;
    }

    const { data: preAgendamento } = await API.post(`/fichas/validar/${procurado}`);

    // O check-in já valeu: se a fila não carregar agora, só a posição fica de fora.
    const { data: fila } = await filaTriagemService.listar(unidadeId).catch(() => ({ data: [] }));
    return {
      data: {
        preAgendamento,
        posicao: fila.findIndex((entrada) => entrada.fichas?.some((item) => item.id === preAgendamento.id)) + 1,
      },
    };
  },
};
