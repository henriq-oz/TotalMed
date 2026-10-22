import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientLayout from '../components/PatientLayout';
import { preAgendamentoService } from '../services/PreAgendamentoService';
import { mensagemDeErro } from '../utils/erros';
import { useUsuario } from '../utils/sessao';
import '../styles/PatientDashboard.css';

const ClipboardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 4h9a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8.25 3.25h5.5a.5.5 0 0 1 .5.5v1.3a.5.5 0 0 1-.5.5h-5.5a.5.5 0 0 1-.5-.5V3.75a.5.5 0 0 1 .5-.5Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 11.5h6M8 14.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const DocIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 3h6.5L16 6.5V18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12.5 3v3a1 1 0 0 0 1 1H16" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M7.5 11.5h6M7.5 14.5h6M7.5 8.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M4 10.5h18" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8.5 3.5v4M17.5 3.5v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ListIcon = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6.5" cy="7" r="1.3" fill="currentColor" />
    <circle cx="6.5" cy="13" r="1.3" fill="currentColor" />
    <circle cx="6.5" cy="19" r="1.3" fill="currentColor" />
    <path d="M10.5 7h11M10.5 13h11M10.5 19h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// Resumo do pedido mais recente, por status do pré-agendamento.
const STATUS_LABELS = {
  PENDENTE: { titulo: 'Em análise', descricao: 'A recepção está analisando seu pré-agendamento' },
  ACEITO: { titulo: 'Aceito', descricao: 'Apresente seu código na recepção da unidade' },
  RECUSADO: { titulo: 'Recusado', descricao: 'Veja o motivo em Meus Pré-agendamentos' },
  VALIDADO: { titulo: 'Na fila de triagem', descricao: 'Aguarde ser chamado pela equipe' },
  CANCELADO: { titulo: 'Cancelado', descricao: 'Faça um novo pré-agendamento quando precisar' },
  EXPIRADO: { titulo: 'Expirado', descricao: 'O horário passou; faça um novo pré-agendamento' },
  SEM_PEDIDO: { titulo: 'Nenhum pedido', descricao: 'Faça um pré-agendamento quando precisar' },
};

export default function PatientDashboard() {
  const navigate = useNavigate();
  const usuario = useUsuario('PACIENTE');
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [status, setStatus] = useState(STATUS_LABELS.SEM_PEDIDO);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!usuario) return;

    // A lista já vem do mais recente para o mais antigo.
    preAgendamentoService.listarPorPaciente(usuario.id)
      .then(({ data }) => {
        setTotalPedidos(data.length);
        setStatus(STATUS_LABELS[data[0]?.status] || STATUS_LABELS.SEM_PEDIDO);
      })
      .catch((e) => {
        console.error('Erro ao carregar dashboard do paciente:', e);
        setErro(mensagemDeErro(e, 'Não foi possível carregar seus dados agora.'));
      })
      .finally(() => setCarregando(false));
  }, [usuario]);

  if (!usuario) return null;

  return (
    <PatientLayout>
      <h1 className="dashboard-title">Dashboard do Paciente</h1>
      {usuario?.nome && <p className="dashboard-greeting">Olá, {usuario.nome.split(' ')[0]}</p>}

      {erro && <div className="dashboard-erro">{erro}</div>}

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <h2>Status do Pré-agendamento</h2>
              <p className="stat-label">Pedido mais recente</p>
            </div>
            <span className="stat-icon-badge"><ClipboardIcon /></span>
          </div>
          <p className="stat-value">{carregando ? '—' : status.titulo}</p>
          <p className="stat-hint">{status.descricao}</p>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <div>
              <h2>Meus Pré-agendamentos</h2>
              <p className="stat-label">Histórico de pedidos</p>
            </div>
            <span className="stat-icon-badge"><DocIcon /></span>
          </div>
          <p className="stat-value">{carregando ? '—' : totalPedidos}</p>
          <p className="stat-hint">Total de pedidos</p>
        </div>
      </section>

      <h2 className="section-title">Ações Rápidas</h2>
      <section className="quick-actions-grid">
        <button
          type="button"
          className="quick-action quick-action-primary"
          onClick={() => navigate('/ficha-saude')}
        >
          <span className="quick-action-icon quick-action-icon-primary"><CalendarIcon /></span>
          <span className="quick-action-text">
            <strong>Novo Pré-agendamento</strong>
            <span>Escolha a unidade, o dia e a hora</span>
          </span>
        </button>

        <button
          type="button"
          className="quick-action quick-action-secondary"
          onClick={() => navigate('/paciente/solicitacoes')}
        >
          <span className="quick-action-icon quick-action-icon-secondary"><ListIcon /></span>
          <span className="quick-action-text">
            <strong>Ver Meus Pré-agendamentos</strong>
            <span>Acompanhe o status e o código</span>
          </span>
        </button>
      </section>
    </PatientLayout>
  );
}
