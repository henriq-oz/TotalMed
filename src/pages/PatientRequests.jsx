import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientLayout from '../components/PatientLayout';
import { preAgendamentoService } from '../services/PreAgendamentoService';
import { formatarData, formatarDataHora, paraData } from '../utils/datas';
import { mensagemDeErro } from '../utils/erros';
import { formatarCodigo, lerStatus, lerTipoFicha } from '../utils/preAgendamento';
import { useUsuario } from '../utils/sessao';
import '../styles/PatientRequests.css';

// A API só deixa o paciente cancelar enquanto o pedido está em aberto.
const CANCELAVEIS = ['PENDENTE', 'ACEITO'];

// O que o paciente precisa saber em cada etapa do pedido.
function Situacao({ item }) {
  if (item.status === 'ACEITO') {
    return (
      <div className="request-codigo">
        <span className="request-codigo-rotulo">Seu código</span>
        <strong className="request-codigo-valor">{formatarCodigo(item.codigo)}</strong>
        <p>
          Apresente este código na recepção da unidade em{' '}
          {formatarDataHora(paraData(item.dataPreferencial))}. Ele vale até 15 minutos depois do horário.
        </p>
      </div>
    );
  }

  if (item.status === 'RECUSADO') {
    return (
      <div className="request-recusa">
        <span>Motivo da recusa</span>
        <p>{item.justificativaRecusa}</p>
      </div>
    );
  }

  if (item.status === 'VALIDADO') {
    return (
      <p className="request-detalhe">
        Check-in feito. Você está na fila de triagem; aguarde ser chamado pela equipe.
      </p>
    );
  }

  if (item.status === 'CANCELADO') {
    return <p className="request-detalhe">Este pedido foi cancelado.</p>;
  }

  if (item.status === 'EXPIRADO') {
    return (
      <p className="request-detalhe">
        O horário escolhido passou e o pedido expirou. Faça um novo pré-agendamento se ainda precisar.
      </p>
    );
  }

  return <p className="request-detalhe">Aguardando a análise da recepção.</p>;
}

export default function PatientRequests() {
  const navigate = useNavigate();
  const usuario = useUsuario('PACIENTE');
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [cancelandoId, setCancelandoId] = useState(null);

  useEffect(() => {
    if (!usuario) return;

    preAgendamentoService.listarPorPaciente(usuario.id)
      .then(({ data }) => setItens(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error('Erro ao carregar pré-agendamentos:', e);
        setErro(mensagemDeErro(e, 'Não foi possível carregar seus pré-agendamentos agora.'));
      })
      .finally(() => setCarregando(false));
  }, [usuario]);

  const cancelar = async (item) => {
    const quando = formatarDataHora(paraData(item.dataPreferencial));
    if (!window.confirm(`Cancelar o pré-agendamento de ${quando} na unidade ${item.clinica?.nome}?`)) return;

    setCancelandoId(item.id);
    setErro('');
    try {
      const { data } = await preAgendamentoService.cancelar(item.id);
      setItens((anteriores) => anteriores.map((anterior) => (anterior.id === data.id ? data : anterior)));
    } catch (e) {
      console.error('Erro ao cancelar pré-agendamento:', e);
      setErro(mensagemDeErro(e, 'Não foi possível cancelar o pré-agendamento. Tente de novo.'));
    } finally {
      setCancelandoId(null);
    }
  };

  if (!usuario) return null;

  return (
    <PatientLayout>
      <h1 className="dashboard-title">Meus Pré-agendamentos</h1>
      <p className="dashboard-greeting">Acompanhe a análise da recepção e o código de cada pedido</p>

      {erro && <div className="dashboard-erro" role="alert">{erro}</div>}

      {carregando ? (
        <p className="requests-empty">Carregando...</p>
      ) : itens.length === 0 ? (
        !erro && (
          <div className="requests-empty-card">
            <p>Você ainda não fez nenhum pré-agendamento.</p>
            <button type="button" onClick={() => navigate('/ficha-saude')}>Fazer pré-agendamento</button>
          </div>
        )
      ) : (
        <div className="requests-list">
          {itens.map((item) => {
            const status = lerStatus(item);
            return (
              <article className="request-card" key={item.id}>
                <div className="request-topo">
                  <div>
                    <strong>{item.clinica?.nome}</strong>
                    <p>
                      Para {formatarDataHora(paraData(item.dataPreferencial))} · Ficha{' '}
                      {lerTipoFicha(item.tipoFichaAtendimento).rotulo.toLowerCase()} · Pedido em{' '}
                      {formatarData(paraData(item.dataHoraCriacao))}
                    </p>
                  </div>
                  <span className={`request-status ${status.classe}`}>{status.rotulo}</span>
                </div>
                <Situacao item={item} />
                {CANCELAVEIS.includes(item.status) && (
                  <button
                    type="button"
                    className="request-cancelar"
                    onClick={() => cancelar(item)}
                    disabled={cancelandoId === item.id}
                  >
                    {cancelandoId === item.id ? 'Cancelando...' : 'Cancelar pedido'}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </PatientLayout>
  );
}
