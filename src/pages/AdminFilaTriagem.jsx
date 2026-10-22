import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useUnidadeRecepcao } from '../components/admin/useUnidadeRecepcao';
import { filaTriagemService } from '../services/FilaTriagemService';
import { formatarHora, paraData } from '../utils/datas';
import { mensagemDeErro } from '../utils/erros';
import { lerTipoFicha } from '../utils/preAgendamento';
import { useUsuario } from '../utils/sessao';
import '../styles/AdminDashboard.css';
import '../styles/Recepcao.css';

// O site só organiza e mostra a fila. Chamar o paciente e fazer a triagem
// continuam por conta da clínica, fora do sistema; a recepção marca "Atendido"
// quando o paciente é chamado, e é isso que tira a entrada da fila.
export default function AdminFilaTriagem() {
  const admin = useUsuario('ADMIN');
  const { unidades, unidadeId, escolherUnidade, erro: erroUnidades } = useUnidadeRecepcao();

  const [fila, setFila] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const [atendendoId, setAtendendoId] = useState(null);

  const carregar = useCallback(async () => {
    if (!unidadeId) return;
    setCarregando(true);
    try {
      // A lista já vem na ordem de chamada: Superpreferencial, Preferencial, Normal.
      const { data } = await filaTriagemService.listar(unidadeId);
      setFila(data);
      setAtualizadoEm(new Date());
      setErro('');
    } catch (e) {
      console.error('Erro ao carregar a fila de triagem:', e);
      setErro(mensagemDeErro(e, 'A fila de triagem não carregou. Clique em Atualizar.'));
    } finally {
      setCarregando(false);
    }
  }, [unidadeId]);

  useEffect(() => {
    if (admin) carregar();
  }, [admin, carregar]);

  const marcarAtendido = async (entrada) => {
    setAtendendoId(entrada.id);
    try {
      await filaTriagemService.marcarAtendido(entrada.id);
      setFila((anteriores) => anteriores.filter((anterior) => anterior.id !== entrada.id));
      setErro('');
    } catch (e) {
      console.error('Erro ao marcar atendido:', e);
      setErro(mensagemDeErro(e, `Não foi possível marcar ${entrada.paciente?.nome} como atendido. Tente de novo.`));
    } finally {
      setAtendendoId(null);
    }
  };

  const prioritarios = fila.filter((entrada) => entrada.ordemChegada !== 'NORMAL').length;

  if (!admin) return null;

  return (
    <AdminLayout>
      <header className="adm-header">
        <div>
          <h1 className="adm-title">Fila de triagem</h1>
          <p className="adm-subtitle">Pacientes com check-in feito, na ordem de chamada</p>
        </div>
        <div className="adm-header-acoes">
          <span className="adm-atualizado">
            {atualizadoEm ? `Atualizado às ${formatarHora(atualizadoEm)}` : ''}
          </span>
          <select
            className="adm-busca rec-filtro"
            aria-label="Unidade"
            value={unidadeId}
            onChange={(evento) => escolherUnidade(evento.target.value)}
          >
            <option value="">Selecione a unidade</option>
            {unidades.map((unidade) => (
              <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
            ))}
          </select>
          <button
            type="button"
            className="adm-btn adm-btn-suave"
            onClick={carregar}
            disabled={!unidadeId || carregando}
          >
            {carregando ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </header>

      {erroUnidades && <div className="adm-alerta" role="alert">{erroUnidades}</div>}
      {erro && <div className="adm-alerta" role="alert">{erro}</div>}

      {!unidadeId ? (
        <div className="adm-vazio">
          <p>Selecione a unidade para ver a fila.</p>
        </div>
      ) : fila.length === 0 ? (
        <div className="adm-vazio">
          <p>{carregando ? 'Carregando fila...' : 'Ninguém na fila de triagem no momento.'}</p>
        </div>
      ) : (
        <section className="adm-bloco" aria-labelledby="titulo-fila">
          <div className="adm-section-head">
            <div>
              <h2 id="titulo-fila" className="adm-section-title">
                Aguardando triagem <span className="adm-contador">{fila.length}</span>
              </h2>
              <p className="adm-section-subtitle">
                {prioritarios} com prioridade na frente · {fila.length - prioritarios} normal(is)
              </p>
            </div>
          </div>

          <ol className="adm-lista rec-fila">
            {fila.map((entrada, indice) => {
              const ficha = lerTipoFicha(entrada.ordemChegada);
              const atendendo = atendendoId === entrada.id;
              return (
                <li className="adm-consulta" key={entrada.id}>
                  <span className="adm-consulta-hora" aria-label={`Posição ${indice + 1}`}>
                    {indice + 1}º
                  </span>
                  <div className="adm-consulta-info">
                    <strong>{entrada.paciente?.nome}</strong>
                    <p>Entrou na fila às {formatarHora(paraData(entrada.horarioEntrada))}</p>
                  </div>
                  <span className={`adm-status ${ficha.classe}`}>{ficha.rotulo}</span>
                  <button
                    type="button"
                    className="adm-btn adm-btn-suave adm-btn-pequeno"
                    onClick={() => marcarAtendido(entrada)}
                    disabled={atendendo}
                  >
                    {atendendo ? 'Salvando...' : 'Atendido'}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </AdminLayout>
  );
}
