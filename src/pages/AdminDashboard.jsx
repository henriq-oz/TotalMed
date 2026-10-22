import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import Indicadores from '../components/admin/Indicadores';
import GraficoFichas from '../components/admin/GraficoFichas';
import TabelaPacientes from '../components/admin/TabelaPacientes';
import { adminService } from '../services/AdminService';
import { pacienteService } from '../services/PacienteService';
import { preAgendamentoService } from '../services/PreAgendamentoService';
import { mensagemDeErro } from '../utils/erros';
import { formatarHora, mesmoDia, paraData } from '../utils/datas';
import { STATUS_PRE_AGENDAMENTO } from '../utils/preAgendamento';
import { useUsuario } from '../utils/sessao';
import '../styles/AdminDashboard.css';

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    <path d="M16.5 3.5v3.8h-3.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const lista = (resultado) =>
  resultado.status === 'fulfilled' && Array.isArray(resultado.value.data) ? resultado.value.data : null;

// Conta os pré-agendamentos por uma chave ({ id, rotulo }), do maior para o menor.
const contarPor = (fichas, chave) => {
  const contagem = new Map();
  fichas.forEach((ficha) => {
    const { id, rotulo } = chave(ficha);
    if (id == null) return;
    contagem.set(id, { id, rotulo, valor: (contagem.get(id)?.valor || 0) + 1 });
  });
  return [...contagem.values()].sort((a, b) => b.valor - a.valor);
};

// A API não tem mais médico, consulta nem exame: o painel mostra o que ela
// conhece hoje (pacientes e pré-agendamentos). Os componentes antigos de
// médico continuam em components/admin, sem uso.
export default function AdminDashboard() {
  const admin = useUsuario('ADMIN');

  const [relatorio, setRelatorio] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  // null = a lista de pré-agendamentos não carregou
  const [fichas, setFichas] = useState(null);
  const [erros, setErros] = useState({ relatorio: '', pacientes: '' });

  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState(() => new Date());
  const [aviso, setAviso] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);

  /* --------------------------------------------------------- carregar */

  const carregarTudo = useCallback(async () => {
    // A listagem vence as fichas atrasadas antes de responder; por isso vem
    // primeiro, para o relatório já contar com elas expiradas.
    const [resFichas] = await Promise.allSettled([preAgendamentoService.listar()]);
    const [resRelatorio, resPacientes] = await Promise.allSettled([
      adminService.gerarRelatorio(),
      adminService.listarPacientes(),
    ]);

    setFichas(lista(resFichas));

    const listaPacientes = lista(resPacientes);
    if (listaPacientes) setPacientes(listaPacientes);

    const relatorioOk = resRelatorio.status === 'fulfilled';
    if (relatorioOk) setRelatorio(resRelatorio.value.data);

    [resFichas, resRelatorio, resPacientes]
      .filter((resultado) => resultado.status === 'rejected')
      .forEach((resultado) => console.error('Erro ao carregar o painel:', resultado.reason));

    setErros({
      relatorio: relatorioOk
        ? ''
        : 'Os indicadores não carregaram. Verifique se a API está no ar e clique em Atualizar.',
      pacientes: listaPacientes ? '' : 'A lista de pacientes não carregou.',
    });
    setAtualizadoEm(new Date());
  }, []);

  useEffect(() => {
    if (!admin) return;
    (async () => {
      await carregarTudo();
      setCarregando(false);
    })();
  }, [admin, carregarTudo]);

  useEffect(() => {
    if (aviso?.tipo !== 'sucesso') return undefined;
    const timer = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(timer);
  }, [aviso]);

  const atualizar = async () => {
    setAtualizando(true);
    await carregarTudo();
    setAtualizando(false);
  };

  /* ---------------------------------------------------------- derivados */

  const todas = fichas || [];

  const fichasPorPaciente = new Map(
    contarPor(todas, (ficha) => ({ id: ficha.paciente?.id })).map((item) => [item.id, item.valor]),
  );

  const porStatus = Object.entries(STATUS_PRE_AGENDAMENTO).map(([valor, status]) => ({
    id: valor,
    rotulo: status.rotulo,
    valor: todas.filter((ficha) => ficha.status === valor).length,
  }));

  const porUnidade = contarPor(todas, (ficha) => ({ id: ficha.clinica?.id, rotulo: ficha.clinica?.nome }));

  const aceitosParaHoje = fichas
    ? fichas.filter((ficha) => {
        const data = paraData(ficha.dataPreferencial);
        return ficha.status === 'ACEITO' && data && mesmoDia(data, atualizadoEm);
      }).length
    : null;

  /* ------------------------------------------------------------- ações */

  const excluirPaciente = async (paciente) => {
    const qtdFichas = fichasPorPaciente.get(paciente.id) ?? 0;
    const confirmado = window.confirm(
      `Excluir definitivamente o paciente ${paciente.nome}?` +
        (qtdFichas > 0 ? ` Os pré-agendamentos desse paciente (${qtdFichas}) e as entradas na fila também serão apagados.` : '') +
        ' Esta ação não pode ser desfeita.',
    );
    if (!confirmado) return;

    setExcluindoId(paciente.id);
    try {
      await pacienteService.deletar(paciente.id);
      setAviso({ tipo: 'sucesso', texto: `O paciente ${paciente.nome} foi excluído.` });
      // A API apagou os pré-agendamentos dele junto: indicadores e gráficos mudam.
      await carregarTudo();
    } catch (e) {
      console.error('Erro ao excluir paciente:', e);
      if (e.response?.status === 404) {
        await carregarTudo();
        setAviso({ tipo: 'erro', texto: `O paciente ${paciente.nome} já tinha sido removido.` });
      } else {
        setAviso({
          tipo: 'erro',
          texto: mensagemDeErro(e, 'Não foi possível excluir o paciente. Tente de novo.'),
        });
      }
    } finally {
      setExcluindoId(null);
    }
  };

  /* -------------------------------------------------------------- view */

  if (!admin) return null;

  const dataPorExtenso = atualizadoEm.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <AdminLayout>
      <div className={`adm-conteudo ${atualizando ? 'adm-conteudo-atualizando' : ''}`} aria-busy={atualizando}>
        <section id="visao-geral" className="adm-ancora" aria-labelledby="titulo-painel">
          <header className="adm-header">
            <div>
              <h1 id="titulo-painel" className="adm-title">Painel do administrador</h1>
              <p className="adm-subtitle">
                {admin.nome ? `Olá, ${admin.nome.split(' ')[0]} — ` : ''}
                {dataPorExtenso}
              </p>
            </div>
            <div className="adm-header-acoes">
              <span className="adm-atualizado">
                {carregando ? 'Carregando...' : `Atualizado às ${formatarHora(atualizadoEm)}`}
              </span>
              <button
                type="button"
                className="adm-btn adm-btn-suave adm-btn-icone"
                onClick={atualizar}
                disabled={carregando || atualizando}
              >
                <RefreshIcon />
                {atualizando ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </header>

          {aviso && (
            <div
              className={`adm-alerta ${aviso.tipo === 'sucesso' ? 'adm-alerta-sucesso' : ''} adm-alerta-fechavel`}
              role={aviso.tipo === 'erro' ? 'alert' : 'status'}
            >
              <span>{aviso.texto}</span>
              <button type="button" className="adm-alerta-fechar" aria-label="Fechar aviso" onClick={() => setAviso(null)}>
                ×
              </button>
            </div>
          )}

          {erros.relatorio && <div className="adm-alerta">{erros.relatorio}</div>}

          <Indicadores relatorio={relatorio} carregando={carregando} aceitosParaHoje={aceitosParaHoje} />

          <div className="adm-graficos">
            <GraficoFichas
              titulo="Pré-agendamentos por status"
              itens={porStatus}
              total={todas.length}
              carregando={carregando}
              falhou={fichas === null}
            />
            <GraficoFichas
              titulo="Pré-agendamentos por unidade"
              itens={porUnidade}
              total={todas.length}
              carregando={carregando}
              falhou={fichas === null}
            />
          </div>
        </section>

        <TabelaPacientes
          pacientes={pacientes}
          fichasPorPaciente={fichasPorPaciente}
          carregando={carregando}
          erro={erros.pacientes}
          excluindoId={excluindoId}
          onExcluir={excluirPaciente}
        />
      </div>
    </AdminLayout>
  );
}
