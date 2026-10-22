import { useEffect, useState } from 'react';
import { preAgendamentoService } from '../../services/PreAgendamentoService';
import { formatarData, formatarDataHora, paraData } from '../../utils/datas';
import { mensagemDeErro } from '../../utils/erros';
import { mascaraCPF, mascaraTelefone } from '../../utils/mascaras';
import { formatarCodigo, lerStatus, lerTipoFicha } from '../../utils/preAgendamento';

export default function PreAgendamentoModal({ preAgendamento, onFechar, onDecidido }) {
  const [recusando, setRecusando] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const pendente = preAgendamento.status === 'PENDENTE';
  const status = lerStatus(preAgendamento);
  // A ficha já traz o cadastro do paciente (CPF, telefone, convênio).
  const cadastro = preAgendamento.paciente || {};

  useEffect(() => {
    const aoTeclar = (evento) => {
      if (evento.key === 'Escape' && !salvando) onFechar();
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [onFechar, salvando]);

  const decidir = async (acao, padrao) => {
    setErro('');
    setSalvando(true);
    try {
      const { data } = await acao();
      onDecidido(data);
    } catch (e) {
      console.error('Erro ao decidir pré-agendamento:', e);
      setErro(mensagemDeErro(e, padrao));
    } finally {
      setSalvando(false);
    }
  };

  const aceitar = () =>
    decidir(
      () => preAgendamentoService.aceitar(preAgendamento.id),
      'Não foi possível aceitar o pré-agendamento. Tente de novo.',
    );

  const recusar = (evento) => {
    evento.preventDefault();
    if (!justificativa.trim()) {
      setErro('Escreva a justificativa: o paciente precisa saber o motivo da recusa.');
      document.getElementById('pre-justificativa')?.focus();
      return;
    }
    decidir(
      () => preAgendamentoService.recusar(preAgendamento.id, justificativa.trim()),
      'Não foi possível recusar o pré-agendamento. Tente de novo.',
    );
  };

  return (
    <div
      className="adm-modal-fundo"
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !salvando) onFechar();
      }}
    >
      <div className="adm-modal rec-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-pre">
        <header className="adm-modal-head">
          <div>
            <h3 id="titulo-modal-pre">
              Pré-agendamento <span className={`adm-status ${status.classe}`}>{status.rotulo}</span>
            </h3>
            <p>Pedido feito em {formatarDataHora(paraData(preAgendamento.dataHoraCriacao))}</p>
          </div>
          <button
            type="button"
            className="adm-modal-fechar"
            aria-label="Fechar"
            onClick={onFechar}
            disabled={salvando}
          >
            ×
          </button>
        </header>

        <dl className="adm-resumo">
          <div>
            <dt>Paciente</dt>
            <dd>{cadastro.nome}</dd>
          </div>
          <div>
            <dt>Unidade</dt>
            <dd>{preAgendamento.clinica?.nome}</dd>
          </div>
          <div>
            <dt>Data e hora preferencial</dt>
            <dd>{formatarDataHora(paraData(preAgendamento.dataPreferencial))}</dd>
          </div>
          <div>
            <dt>Tipo de ficha</dt>
            <dd>{lerTipoFicha(preAgendamento.tipoFichaAtendimento).rotulo}</dd>
          </div>
        </dl>

        <div className="rec-motivo">
          <span>Motivo informado</span>
          <p>{preAgendamento.motivoString || 'O paciente não informou o motivo.'}</p>
        </div>

        <h4 className="rec-subtitulo">Cadastro do paciente</h4>
        <dl className="adm-resumo">
          <div>
            <dt>CPF</dt>
            <dd>{cadastro.cpf ? mascaraCPF(cadastro.cpf) : '—'}</dd>
          </div>
          <div>
            <dt>Nascimento</dt>
            <dd>{formatarData(paraData(cadastro.dataNascimento))}</dd>
          </div>
          <div>
            <dt>Telefone</dt>
            <dd>{cadastro.tell ? mascaraTelefone(cadastro.tell) : '—'}</dd>
          </div>
          <div>
            <dt>Convênio</dt>
            <dd>{cadastro.convenio || '—'}</dd>
          </div>
        </dl>

        {/* O código só vale enquanto a ficha está aceita; depois do check-in fica como registro. */}
        {preAgendamento.codigo && ['ACEITO', 'VALIDADO'].includes(preAgendamento.status) && (
          <div className="rec-codigo">
            <span>Código do paciente</span>
            <strong>{formatarCodigo(preAgendamento.codigo)}</strong>
            <p>
              {preAgendamento.status === 'VALIDADO'
                ? 'Check-in já feito com este código.'
                : 'O paciente apresenta este código na chegada, até 15 minutos depois do horário.'}
            </p>
          </div>
        )}

        {preAgendamento.status === 'RECUSADO' && (
          <div className="rec-recusa">
            <span>Justificativa da recusa</span>
            <p>{preAgendamento.justificativaRecusa}</p>
          </div>
        )}

        {erro && (
          <div className="adm-alerta rec-alerta-modal" role="alert">
            {erro}
          </div>
        )}

        {pendente && !recusando && (
          <div className="adm-modal-acoes">
            <button
              type="button"
              className="adm-btn adm-btn-perigo"
              onClick={() => {
                setErro('');
                setRecusando(true);
              }}
              disabled={salvando}
            >
              Recusar
            </button>
            <button type="button" className="adm-btn adm-btn-primario" onClick={aceitar} disabled={salvando}>
              {salvando ? 'Aceitando...' : 'Aceitar e gerar código'}
            </button>
          </div>
        )}

        {pendente && recusando && (
          <form className="adm-form" onSubmit={recusar} noValidate>
            <div className="adm-campo">
              <label htmlFor="pre-justificativa">Justificativa da recusa</label>
              <textarea
                id="pre-justificativa"
                rows={3}
                maxLength={500}
                value={justificativa}
                onChange={(evento) => setJustificativa(evento.target.value)}
                placeholder="Ex.: a unidade não atende neste dia; escolha outra data."
                disabled={salvando}
                autoFocus
              />
              <p className="adm-dica rec-dica-topo">O paciente vai ler este texto exatamente como está.</p>
            </div>
            <div className="adm-modal-acoes">
              <button
                type="button"
                className="adm-btn adm-btn-suave"
                onClick={() => {
                  setErro('');
                  setRecusando(false);
                }}
                disabled={salvando}
              >
                Voltar
              </button>
              <button type="submit" className="adm-btn adm-btn-perigo" disabled={salvando}>
                {salvando ? 'Recusando...' : 'Confirmar recusa'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
