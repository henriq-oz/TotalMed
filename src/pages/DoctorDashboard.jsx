import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorLayout from '../components/DoctorLayout';
import { medicoService } from '../services/MedicoService';
import { consultaService } from '../services/ConsultaService';
import { filaService } from '../services/FilaService';
import '../styles/DoctorDashboard.css';

/* ---------------------------------------------------------------- ícones */

const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3.5" y="5" width="15" height="14" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3.5 9.5h15" stroke="currentColor" strokeWidth="1.6" />
    <path d="M7.5 3v3M14.5 3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7.8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M11 6.8V11l3 1.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const QueueIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="7" r="2.8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M3 17.5c.6-2.9 2.6-4.6 5-4.6s4.4 1.7 5 4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M15.5 8.5h4M17.5 6.5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7.8" stroke="currentColor" strokeWidth="1.6" />
    <path d="M7.6 11.2 10 13.6l4.5-4.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ------------------------------------------------------- helpers de data */

// A API devolve LocalDateTime como ISO ("2026-09-14T10:30:00"), mas se a
// configuração do Jackson mudar ela pode vir como array [ano, mes, dia, h, min].
// Aceitamos os dois formatos para o dashboard não quebrar.
function paraData(valor) {
  if (!valor) return null;

  if (Array.isArray(valor)) {
    const [ano, mes, dia, hora = 0, minuto = 0] = valor;
    return new Date(ano, mes - 1, dia, hora, minuto);
  }

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function mesmoDia(data, referencia) {
  return (
    data.getFullYear() === referencia.getFullYear() &&
    data.getMonth() === referencia.getMonth() &&
    data.getDate() === referencia.getDate()
  );
}

const formatarHora = (data) =>
  data ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

const formatarData = (data) =>
  data ? data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Sem data';

/* ----------------------------------------------------------- status */

const STATUS = {
  Agendado: { rotulo: 'Agendado', classe: 'status-agendado' },
  Em_andamento: { rotulo: 'Em andamento', classe: 'status-andamento' },
  Confirmado: { rotulo: 'Confirmado', classe: 'status-confirmado' },
  Finalizado: { rotulo: 'Finalizado', classe: 'status-finalizado' },
  Cancelado: { rotulo: 'Cancelado', classe: 'status-cancelado' },
};

const lerStatus = (consulta) =>
  STATUS[consulta?.statusAgendamento] || { rotulo: 'Agendado', classe: 'status-agendado' };

const FILTROS = [
  { id: 'hoje', rotulo: 'Hoje' },
  { id: 'proximas', rotulo: 'Próximas' },
  { id: 'todas', rotulo: 'Todas' },
];

/* -------------------------------------------------------------- página */

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const [medico, setMedico] = useState(null);
  const [consultas, setConsultas] = useState([]);
  const [fila, setFila] = useState([]);
  const [filtro, setFiltro] = useState('hoje');

  const [carregando, setCarregando] = useState(true);
  const [erroAgenda, setErroAgenda] = useState('');
  const [erroFila, setErroFila] = useState('');
  const [acaoEmCurso, setAcaoEmCurso] = useState(null);

  const [consultaParaFinalizar, setConsultaParaFinalizar] = useState(null);
  const [diagnostico, setDiagnostico] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [salvandoFinalizacao, setSalvandoFinalizacao] = useState(false);
  const [erroModal, setErroModal] = useState('');

  /* --------------------------------------------------------- carregar */

  const carregarAgenda = useCallback(async (medicoId) => {
    try {
      const { data } = await medicoService.visualizarAgenda(medicoId);
      setConsultas(Array.isArray(data) ? data : []);
      setErroAgenda('');
    } catch (e) {
      console.error('Erro ao carregar a agenda do médico:', e);
      setErroAgenda('A agenda não carregou. Verifique se a API está no ar e recarregue a página.');
    }
  }, []);

  const carregarFila = useCallback(async (medicoId) => {
    try {
      const { data } = await filaService.listar();
      const lista = Array.isArray(data) ? data : [];
      // GET /fila devolve a fila de todos os médicos: filtramos a deste médico
      // e descartamos quem já foi atendido.
      setFila(
        lista
          .filter((entrada) => !entrada.atendido && Number(entrada?.medico?.id) === Number(medicoId))
          .sort((a, b) => {
            const entradaA = paraData(a.horarioEntrada);
            const entradaB = paraData(b.horarioEntrada);
            if (!entradaA) return 1;
            if (!entradaB) return -1;
            return entradaA - entradaB;
          }),
      );
      setErroFila('');
    } catch (e) {
      console.error('Erro ao carregar a fila de espera:', e);
      setErroFila('A fila de espera não carregou.');
    }
  }, []);

  useEffect(() => {
    let usuario;
    try {
      usuario = JSON.parse(localStorage.getItem('usuario'));
    } catch {
      usuario = null;
    }

    if (!usuario?.id) {
      navigate('/login');
      return;
    }
    if (usuario.role && usuario.role !== 'MEDICO') {
      navigate('/login');
      return;
    }

    setMedico(usuario);

    (async () => {
      setCarregando(true);
      await Promise.all([carregarAgenda(usuario.id), carregarFila(usuario.id)]);
      setCarregando(false);
    })();
  }, [navigate, carregarAgenda, carregarFila]);

  /* ---------------------------------------------------------- derivados */

  const hoje = useMemo(() => new Date(), []);

  const consultasOrdenadas = useMemo(() => {
    return [...consultas].sort((a, b) => {
      const dataA = paraData(a.dataHoraConsulta);
      const dataB = paraData(b.dataHoraConsulta);
      if (!dataA) return 1;
      if (!dataB) return -1;
      return dataA - dataB;
    });
  }, [consultas]);

  const consultasDeHoje = useMemo(
    () =>
      consultasOrdenadas.filter((c) => {
        const data = paraData(c.dataHoraConsulta);
        return data && mesmoDia(data, hoje);
      }),
    [consultasOrdenadas, hoje],
  );

  const consultasVisiveis = useMemo(() => {
    if (filtro === 'hoje') return consultasDeHoje;
    if (filtro === 'proximas') {
      return consultasOrdenadas.filter((c) => {
        const data = paraData(c.dataHoraConsulta);
        return data && data >= hoje && c.statusAgendamento !== 'Cancelado';
      });
    }
    return consultasOrdenadas;
  }, [filtro, consultasDeHoje, consultasOrdenadas, hoje]);

  const indicadores = useMemo(() => {
    const ativasHoje = consultasDeHoje.filter((c) => c.statusAgendamento !== 'Cancelado');
    return {
      hoje: ativasHoje.length,
      aguardandoConfirmacao: ativasHoje.filter((c) => c.statusAgendamento === 'Agendado').length,
      finalizadasHoje: consultasDeHoje.filter((c) => c.statusAgendamento === 'Finalizado').length,
      naFila: fila.length,
    };
  }, [consultasDeHoje, fila]);

  const proximaConsulta = useMemo(
    () =>
      consultasDeHoje.find(
        (c) => c.statusAgendamento !== 'Finalizado' && c.statusAgendamento !== 'Cancelado',
      ) || null,
    [consultasDeHoje],
  );

  /* ------------------------------------------------------------- ações */

  const trocarConsulta = (atualizada) => {
    if (!atualizada?.id) return;
    setConsultas((anteriores) =>
      anteriores.map((c) => (c.id === atualizada.id ? atualizada : c)),
    );
  };

  const confirmarPresenca = async (consulta) => {
    setAcaoEmCurso(`confirmar-${consulta.id}`);
    try {
      const { data } = await consultaService.confirmarPresenca(consulta.id);
      trocarConsulta(data);
    } catch (e) {
      console.error('Erro ao confirmar presença:', e);
      setErroAgenda('Não deu para confirmar a presença. Tente de novo.');
    } finally {
      setAcaoEmCurso(null);
    }
  };

  const cancelarConsulta = async (consulta) => {
    const paciente = consulta?.paciente?.nome || 'este paciente';
    if (!window.confirm(`Cancelar a consulta de ${paciente}?`)) return;

    setAcaoEmCurso(`cancelar-${consulta.id}`);
    try {
      const { data } = await consultaService.cancelar(consulta.id);
      trocarConsulta(data);
      // O cancelamento libera o horário e a API tenta encaixar alguém da fila.
      if (medico?.id) await Promise.all([carregarAgenda(medico.id), carregarFila(medico.id)]);
    } catch (e) {
      console.error('Erro ao cancelar consulta:', e);
      setErroAgenda(
        e.response?.status === 400
          ? 'Consulta finalizada não pode ser cancelada.'
          : 'Não deu para cancelar a consulta. Tente de novo.',
      );
    } finally {
      setAcaoEmCurso(null);
    }
  };

  const abrirFinalizacao = (consulta) => {
    setConsultaParaFinalizar(consulta);
    setDiagnostico(consulta.diagnostico || '');
    setObservacoes(consulta.observacoes || '');
    setErroModal('');
  };

  const fecharFinalizacao = useCallback(() => {
    setConsultaParaFinalizar(null);
    setDiagnostico('');
    setObservacoes('');
    setErroModal('');
  }, []);

  const salvarFinalizacao = async () => {
    if (!diagnostico.trim()) {
      setErroModal('Escreva o diagnóstico antes de finalizar.');
      return;
    }

    setSalvandoFinalizacao(true);
    try {
      const { data } = await medicoService.finalizarConsulta(
        medico.id,
        consultaParaFinalizar.id,
        { diagnostico: diagnostico.trim(), observacoes: observacoes.trim() },
      );
      trocarConsulta(data);
      fecharFinalizacao();
    } catch (e) {
      console.error('Erro ao finalizar consulta:', e);
      setErroModal('Não deu para finalizar a consulta. Tente de novo.');
    } finally {
      setSalvandoFinalizacao(false);
    }
  };

  const chamarDaFila = async (entrada) => {
    setAcaoEmCurso(`fila-${entrada.id}`);
    try {
      await filaService.marcarAtendido(entrada.id);
      setFila((anteriores) => anteriores.filter((item) => item.id !== entrada.id));
    } catch (e) {
      console.error('Erro ao marcar paciente como atendido:', e);
      setErroFila('Não deu para atualizar a fila. Tente de novo.');
    } finally {
      setAcaoEmCurso(null);
    }
  };

  useEffect(() => {
    if (!consultaParaFinalizar) return undefined;
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') fecharFinalizacao();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [consultaParaFinalizar, fecharFinalizacao]);

  /* -------------------------------------------------------------- view */

  const dataPorExtenso = hoje.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <DoctorLayout>
      <header className="med-header">
        <div>
          <h1 className="med-title">Dashboard do médico</h1>
          <p className="med-subtitle">
            {medico?.nome ? `Olá, Dr(a). ${medico.nome.split(' ')[0]} — ` : ''}
            {dataPorExtenso}
          </p>
        </div>
        {proximaConsulta && (
          <div className="med-next">
            <span className="med-next-label">Próximo atendimento</span>
            <strong>{formatarHora(paraData(proximaConsulta.dataHoraConsulta))}</strong>
            <span className="med-next-patient">
              {proximaConsulta.paciente?.nome || 'Paciente sem nome'}
            </span>
          </div>
        )}
      </header>

      {erroAgenda && <div className="med-alerta">{erroAgenda}</div>}

      <section className="med-stats">
        <article className="med-stat">
          <div className="med-stat-head">
            <div>
              <h2>Consultas hoje</h2>
              <p>Agenda do dia</p>
            </div>
            <span className="med-stat-icon"><CalendarIcon /></span>
          </div>
          <p className="med-stat-value">{carregando ? '—' : indicadores.hoje}</p>
          <p className="med-stat-hint">
            {indicadores.aguardandoConfirmacao} sem confirmação de presença
          </p>
        </article>

        <article className="med-stat">
          <div className="med-stat-head">
            <div>
              <h2>Na fila de espera</h2>
              <p>Aguardando encaixe</p>
            </div>
            <span className="med-stat-icon"><QueueIcon /></span>
          </div>
          <p className="med-stat-value">{carregando ? '—' : indicadores.naFila}</p>
          <p className="med-stat-hint">Entram no lugar de quem cancelar</p>
        </article>

        <article className="med-stat">
          <div className="med-stat-head">
            <div>
              <h2>Finalizadas hoje</h2>
              <p>Já atendidos</p>
            </div>
            <span className="med-stat-icon"><CheckIcon /></span>
          </div>
          <p className="med-stat-value">{carregando ? '—' : indicadores.finalizadasHoje}</p>
          <p className="med-stat-hint">Com diagnóstico registrado</p>
        </article>

        <article className="med-stat">
          <div className="med-stat-head">
            <div>
              <h2>Total na agenda</h2>
              <p>Histórico completo</p>
            </div>
            <span className="med-stat-icon"><ClockIcon /></span>
          </div>
          <p className="med-stat-value">{carregando ? '—' : consultas.length}</p>
          <p className="med-stat-hint">Consultas vinculadas a você</p>
        </article>
      </section>

      <div className="med-section-head">
        <h2 className="med-section-title">Agenda</h2>
        <div className="med-filtros" role="group" aria-label="Filtrar agenda">
          {FILTROS.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              className={`med-filtro ${filtro === opcao.id ? 'med-filtro-ativo' : ''}`}
              onClick={() => setFiltro(opcao.id)}
              aria-pressed={filtro === opcao.id}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <p className="med-carregando">Carregando agenda...</p>
      ) : consultasVisiveis.length === 0 ? (
        <div className="med-vazio">
          <p>
            {filtro === 'hoje'
              ? 'Nenhuma consulta marcada para hoje.'
              : 'Nenhuma consulta neste filtro.'}
          </p>
          {filtro !== 'todas' && (
            <button type="button" onClick={() => setFiltro('todas')}>
              Ver toda a agenda
            </button>
          )}
        </div>
      ) : (
        <ul className="med-lista">
          {consultasVisiveis.map((consulta) => {
            const data = paraData(consulta.dataHoraConsulta);
            const status = lerStatus(consulta);
            const finalizada = consulta.statusAgendamento === 'Finalizado';
            const cancelada = consulta.statusAgendamento === 'Cancelado';

            return (
              <li className="med-consulta" key={consulta.id}>
                <div className="med-consulta-hora">
                  <strong>{formatarHora(data)}</strong>
                  <span>{formatarData(data)}</span>
                </div>

                <div className="med-consulta-info">
                  <div className="med-consulta-topo">
                    <strong>{consulta.paciente?.nome || 'Paciente sem nome'}</strong>
                    <span className={`med-status ${status.classe}`}>{status.rotulo}</span>
                  </div>
                  <p className="med-consulta-motivo">
                    {consulta.motivo || 'Sem motivo informado'}
                  </p>
                  {consulta.fichaInicial?.descricaoSintomas && (
                    <p className="med-consulta-sintomas">
                      Sintomas relatados: {consulta.fichaInicial.descricaoSintomas}
                    </p>
                  )}
                  {finalizada && consulta.diagnostico && (
                    <p className="med-consulta-diagnostico">
                      Diagnóstico: {consulta.diagnostico}
                    </p>
                  )}
                </div>

                <div className="med-consulta-acoes">
                  {consulta.statusAgendamento === 'Agendado' && (
                    <button
                      type="button"
                      className="med-btn med-btn-suave"
                      onClick={() => confirmarPresenca(consulta)}
                      disabled={acaoEmCurso === `confirmar-${consulta.id}`}
                    >
                      {acaoEmCurso === `confirmar-${consulta.id}` ? 'Confirmando...' : 'Confirmar presença'}
                    </button>
                  )}

                  {!finalizada && !cancelada && (
                    <button
                      type="button"
                      className="med-btn med-btn-primario"
                      onClick={() => abrirFinalizacao(consulta)}
                    >
                      Finalizar consulta
                    </button>
                  )}

                  {!finalizada && !cancelada && (
                    <button
                      type="button"
                      className="med-btn med-btn-perigo"
                      onClick={() => cancelarConsulta(consulta)}
                      disabled={acaoEmCurso === `cancelar-${consulta.id}`}
                    >
                      {acaoEmCurso === `cancelar-${consulta.id}` ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  )}

                  {finalizada && (
                    <button
                      type="button"
                      className="med-btn med-btn-suave"
                      onClick={() => abrirFinalizacao(consulta)}
                    >
                      Ver registro
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="med-section-title med-section-title-espaco">Fila de espera</h2>

      {erroFila && <div className="med-alerta med-alerta-suave">{erroFila}</div>}

      {carregando ? (
        <p className="med-carregando">Carregando fila...</p>
      ) : fila.length === 0 ? (
        <div className="med-vazio">
          <p>Ninguém esperando encaixe no momento.</p>
        </div>
      ) : (
        <ul className="med-lista">
          {fila.map((entrada, indice) => {
            const entrou = paraData(entrada.horarioEntrada);
            return (
              <li className="med-fila-item" key={entrada.id}>
                <span className="med-fila-posicao">{indice + 1}</span>
                <div className="med-fila-info">
                  <strong>{entrada.paciente?.nome || 'Paciente sem nome'}</strong>
                  <p>
                    Entrou às {formatarHora(entrou)} · prioridade {entrada.ordemChegada || 'Normal'}
                  </p>
                </div>
                <button
                  type="button"
                  className="med-btn med-btn-primario"
                  onClick={() => chamarDaFila(entrada)}
                  disabled={acaoEmCurso === `fila-${entrada.id}`}
                >
                  {acaoEmCurso === `fila-${entrada.id}` ? 'Chamando...' : 'Chamar paciente'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {consultaParaFinalizar && (
        <div
          className="med-modal-fundo"
          role="presentation"
          onClick={(evento) => {
            if (evento.target === evento.currentTarget) fecharFinalizacao();
          }}
        >
          <div className="med-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-finalizar">
            <h3 id="titulo-finalizar">Finalizar consulta</h3>
            <p className="med-modal-paciente">
              {consultaParaFinalizar.paciente?.nome || 'Paciente sem nome'} ·{' '}
              {formatarData(paraData(consultaParaFinalizar.dataHoraConsulta))} às{' '}
              {formatarHora(paraData(consultaParaFinalizar.dataHoraConsulta))}
            </p>

            {erroModal && <div className="med-alerta">{erroModal}</div>}

            <label className="med-campo" htmlFor="diagnostico">
              Diagnóstico
              <textarea
                id="diagnostico"
                rows={3}
                maxLength={2000}
                value={diagnostico}
                onChange={(evento) => setDiagnostico(evento.target.value)}
                placeholder="O que o paciente tem"
                autoFocus
              />
            </label>

            <label className="med-campo" htmlFor="observacoes">
              Observações
              <textarea
                id="observacoes"
                rows={3}
                maxLength={2000}
                value={observacoes}
                onChange={(evento) => setObservacoes(evento.target.value)}
                placeholder="Orientações, receitas, retorno"
              />
            </label>

            <div className="med-modal-acoes">
              <button type="button" className="med-btn med-btn-suave" onClick={fecharFinalizacao}>
                Voltar
              </button>
              <button
                type="button"
                className="med-btn med-btn-primario"
                onClick={salvarFinalizacao}
                disabled={salvandoFinalizacao}
              >
                {salvandoFinalizacao ? 'Salvando...' : 'Finalizar consulta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
}
