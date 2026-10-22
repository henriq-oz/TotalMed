import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { useUnidadeRecepcao } from '../components/admin/useUnidadeRecepcao';
import { preAgendamentoService } from '../services/PreAgendamentoService';
import { mensagemDeErro } from '../utils/erros';
import { formatarCodigo, lerTipoFicha, normalizarCodigo } from '../utils/preAgendamento';
import { useUsuario } from '../utils/sessao';
import '../styles/AdminDashboard.css';
import '../styles/Recepcao.css';

export default function AdminCheckIn() {
  const navigate = useNavigate();
  const admin = useUsuario('ADMIN');
  const { unidades, unidadeId, escolherUnidade, erro: erroUnidades } = useUnidadeRecepcao();

  const [codigo, setCodigo] = useState('');
  const [validando, setValidando] = useState(false);
  // { tipo: 'erro', texto } ou { tipo: 'sucesso', preAgendamento, posicao }
  const [resultado, setResultado] = useState(null);
  const campoCodigo = useRef(null);

  const validar = async (evento) => {
    evento.preventDefault();

    if (!unidadeId) {
      setResultado({ tipo: 'erro', texto: 'Escolha a unidade deste balcão antes de validar o código.' });
      return;
    }
    if (!normalizarCodigo(codigo)) {
      setResultado({ tipo: 'erro', texto: 'Digite o código apresentado pelo paciente.' });
      campoCodigo.current?.focus();
      return;
    }

    setValidando(true);
    try {
      const { data } = await preAgendamentoService.validarCodigo(codigo, unidadeId);
      setResultado({ tipo: 'sucesso', ...data });
      setCodigo('');
    } catch (e) {
      console.error('Erro ao validar código:', e);
      setResultado({
        tipo: 'erro',
        texto: mensagemDeErro(e, 'Não foi possível validar o código. Tente de novo.'),
      });
    } finally {
      setValidando(false);
      campoCodigo.current?.focus();
    }
  };

  if (!admin) return null;

  return (
    <AdminLayout>
      <header className="adm-header">
        <div>
          <h1 className="adm-title">Check-in</h1>
          <p className="adm-subtitle">Valide o código do paciente na chegada para colocá-lo na fila de triagem</p>
        </div>
      </header>

      {erroUnidades && <div className="adm-alerta" role="alert">{erroUnidades}</div>}

      <form className="adm-card rec-checkin" onSubmit={validar} noValidate>
        <div className="adm-campo">
          <label htmlFor="checkin-unidade">Unidade deste balcão</label>
          <select
            id="checkin-unidade"
            value={unidadeId}
            onChange={(evento) => escolherUnidade(evento.target.value)}
            disabled={validando}
          >
            <option value="">Selecione</option>
            {unidades.map((unidade) => (
              <option key={unidade.id} value={unidade.id}>{unidade.nome}</option>
            ))}
          </select>
        </div>

        <div className="adm-campo">
          <label htmlFor="checkin-codigo">Código do paciente</label>
          <input
            id="checkin-codigo"
            ref={campoCodigo}
            className="rec-checkin-codigo"
            value={codigo}
            onChange={(evento) => setCodigo(formatarCodigo(evento.target.value))}
            placeholder="ABCD-1234"
            maxLength={9}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={validando}
            autoFocus
          />
        </div>

        <button type="submit" className="adm-btn adm-btn-primario" disabled={validando}>
          {validando ? 'Validando...' : 'Validar código'}
        </button>
      </form>

      {resultado?.tipo === 'erro' && (
        <div className="adm-alerta rec-resultado" role="alert">
          <strong>Check-in recusado</strong>
          <p>{resultado.texto}</p>
        </div>
      )}

      {resultado?.tipo === 'sucesso' && (
        <div className="adm-alerta adm-alerta-sucesso rec-resultado" role="status">
          <strong>Check-in confirmado</strong>
          <p>
            {resultado.preAgendamento.paciente?.nome} entrou na fila de triagem
            {resultado.posicao > 0 && ` na posição ${resultado.posicao}`} (ficha{' '}
            {lerTipoFicha(resultado.preAgendamento.tipoFichaAtendimento).rotulo.toLowerCase()}).
            O código não pode ser usado de novo.
          </p>
          <button type="button" className="adm-btn adm-btn-suave adm-btn-pequeno" onClick={() => navigate('/admin/fila')}>
            Ver fila de triagem
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
