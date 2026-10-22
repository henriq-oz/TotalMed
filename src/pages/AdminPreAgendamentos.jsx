import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import PreAgendamentoModal from '../components/admin/PreAgendamentoModal';
import { preAgendamentoService } from '../services/PreAgendamentoService';
import { unidadeService } from '../services/UnidadeService';
import { formatarData, formatarDataHora, paraData } from '../utils/datas';
import { mensagemDeErro } from '../utils/erros';
import {
  STATUS_PRE_AGENDAMENTO,
  formatarCodigo,
  lerStatus,
  lerTipoFicha,
} from '../utils/preAgendamento';
import { useUsuario } from '../utils/sessao';
import '../styles/AdminDashboard.css';
import '../styles/Recepcao.css';

// A recepção abre a tela já na caixa de entrada: só os pendentes.
const FILTROS_PADRAO = { status: 'PENDENTE', unidadeId: '', data: '' };

// Quem tem o horário mais próximo aparece primeiro; no mesmo horário, quem pediu antes.
const porDataEPedido = (a, b) =>
  a.dataPreferencial.localeCompare(b.dataPreferencial) || a.dataHoraCriacao.localeCompare(b.dataHoraCriacao);

export default function AdminPreAgendamentos() {
  const admin = useUsuario('ADMIN');

  const [itens, setItens] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [aberto, setAberto] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const [resItens, resUnidades] = await Promise.all([
        preAgendamentoService.listar(),
        unidadeService.listar(),
      ]);
      setItens(Array.isArray(resItens.data) ? resItens.data : []);
      setUnidades(Array.isArray(resUnidades.data) ? resUnidades.data : []);
      setErro('');
    } catch (e) {
      console.error('Erro ao carregar pré-agendamentos:', e);
      setErro(mensagemDeErro(e, 'Os pré-agendamentos não carregaram. Clique em Atualizar.'));
    }
  }, []);

  useEffect(() => {
    if (!admin) return;
    (async () => {
      await carregar();
      setCarregando(false);
    })();
  }, [admin, carregar]);

  const atualizar = async () => {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  };

  const mudarFiltro = (evento) => {
    const { name, value } = evento.target;
    setFiltros((anteriores) => ({ ...anteriores, [name]: value }));
  };

  const fecharModal = useCallback(() => setAberto(null), []);

  const aoDecidir = (atualizado) => {
    setItens((anteriores) => anteriores.map((item) => (item.id === atualizado.id ? atualizado : item)));
    const paciente = atualizado.paciente?.nome;
    if (atualizado.status === 'ACEITO') {
      // Fica aberto para a recepção ver o código que acabou de ser gerado.
      setAberto(atualizado);
      setAviso(`Pré-agendamento de ${paciente} aceito. Código ${formatarCodigo(atualizado.codigo)}.`);
    } else {
      setAberto(null);
      setAviso(`Pré-agendamento de ${paciente} recusado. O paciente já vê a justificativa.`);
    }
  };

  const pendentes = itens.filter((item) => item.status === 'PENDENTE').length;

  const visiveis = itens
    .filter(
      (item) =>
        (!filtros.status || item.status === filtros.status) &&
        (!filtros.unidadeId || String(item.clinica?.id) === filtros.unidadeId) &&
        (!filtros.data || item.dataPreferencial.startsWith(filtros.data)),
    )
    .sort(porDataEPedido);

  const filtrando = Object.keys(FILTROS_PADRAO).some((campo) => filtros[campo] !== FILTROS_PADRAO[campo]);

  if (!admin) return null;

  return (
    <AdminLayout>
      <div className={`adm-conteudo ${atualizando ? 'adm-conteudo-atualizando' : ''}`} aria-busy={atualizando}>
        <header className="adm-header">
          <div>
            <h1 className="adm-title">Pré-agendamentos</h1>
            <p className="adm-subtitle">Analise os pedidos dos pacientes: aceite para gerar o código ou recuse com justificativa</p>
          </div>
          <div className="adm-header-acoes">
            <button
              type="button"
              className="adm-btn adm-btn-suave"
              onClick={atualizar}
              disabled={carregando || atualizando}
            >
              {atualizando ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </header>

        {aviso && (
          <div className="adm-alerta adm-alerta-sucesso adm-alerta-fechavel" role="status">
            <span>{aviso}</span>
            <button type="button" className="adm-alerta-fechar" aria-label="Fechar aviso" onClick={() => setAviso('')}>
              ×
            </button>
          </div>
        )}

        {erro && <div className="adm-alerta" role="alert">{erro}</div>}

        <section className="adm-bloco" aria-labelledby="titulo-pre-agendamentos">
          <div className="adm-section-head">
            <div>
              <h2 id="titulo-pre-agendamentos" className="adm-section-title">
                Aguardando análise <span className="adm-contador">{pendentes}</span>
              </h2>
              <p className="adm-section-subtitle">
                {visiveis.length} de {itens.length} pedido(s) no filtro atual
              </p>
            </div>
            <div className="adm-ferramentas">
              <select
                name="status"
                className="adm-busca rec-filtro"
                aria-label="Filtrar por status"
                value={filtros.status}
                onChange={mudarFiltro}
              >
                <option value="">Todos os status</option>
                {Object.entries(STATUS_PRE_AGENDAMENTO).map(([valor, status]) => (
                  <option key={valor} value={valor}>{status.rotulo}</option>
                ))}
              </select>
              <select
                name="unidadeId"
                className="adm-busca rec-filtro"
                aria-label="Filtrar por unidade"
                value={filtros.unidadeId}
                onChange={mudarFiltro}
              >
                <option value="">Todas as unidades</option>
                {unidades.map((unidade) => (
                  <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
                ))}
              </select>
              <input
                type="date"
                name="data"
                className="adm-busca rec-filtro"
                aria-label="Filtrar por data preferencial"
                value={filtros.data}
                onChange={mudarFiltro}
              />
            </div>
          </div>

          {carregando ? (
            <p className="adm-carregando">Carregando pré-agendamentos...</p>
          ) : visiveis.length === 0 ? (
            <div className="adm-vazio">
              <p>
                {itens.length === 0
                  ? 'Nenhum pré-agendamento recebido ainda.'
                  : 'Nenhum pré-agendamento neste filtro.'}
              </p>
              {filtrando && (
                <button type="button" className="adm-btn adm-btn-suave" onClick={() => setFiltros(FILTROS_PADRAO)}>
                  Voltar aos pendentes
                </button>
              )}
            </div>
          ) : (
            <div className="adm-tabela-wrap">
              <table className="adm-tabela">
                <thead>
                  <tr>
                    <th scope="col">Paciente</th>
                    <th scope="col">Unidade</th>
                    <th scope="col">Data e hora</th>
                    <th scope="col">Ficha</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="adm-acoes-col">
                      <span className="adm-sr">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((item) => {
                    const status = lerStatus(item);
                    const ficha = lerTipoFicha(item.tipoFichaAtendimento);
                    return (
                      <tr key={item.id}>
                        <td>
                          <div className="adm-pessoa">
                            <strong>{item.paciente?.nome}</strong>
                            <span>Pedido em {formatarData(paraData(item.dataHoraCriacao))}</span>
                          </div>
                        </td>
                        <td>{item.clinica?.nome}</td>
                        <td className="adm-num-texto">{formatarDataHora(paraData(item.dataPreferencial))}</td>
                        <td>
                          <span className={`adm-status ${ficha.classe}`}>{ficha.rotulo}</span>
                        </td>
                        <td>
                          <span className={`adm-status ${status.classe}`}>{status.rotulo}</span>
                        </td>
                        <td className="adm-acoes">
                          <button
                            type="button"
                            className={`adm-btn adm-btn-pequeno ${item.status === 'PENDENTE' ? 'adm-btn-primario' : 'adm-btn-suave'}`}
                            onClick={() => setAberto(item)}
                          >
                            {item.status === 'PENDENTE' ? 'Analisar' : 'Detalhes'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {aberto && (
        <PreAgendamentoModal
          key={aberto.id}
          preAgendamento={aberto}
          onFechar={fecharModal}
          onDecidido={aoDecidir}
        />
      )}
    </AdminLayout>
  );
}
