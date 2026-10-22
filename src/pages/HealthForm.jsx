import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientLayout from '../components/PatientLayout';
import { pacienteService } from '../services/PacienteService';
import { preAgendamentoService } from '../services/PreAgendamentoService';
import { unidadeService } from '../services/UnidadeService';
import { dataHoraISO, formatarDataHora, paraData } from '../utils/datas';
import { mensagemDeErro } from '../utils/erros';
import { mascaraCPF } from '../utils/mascaras';
import { TIPOS_FICHA } from '../utils/preAgendamento';
import { useUsuario } from '../utils/sessao';
import '../styles/HealthForm.css';

const HeartIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 35C20 35 4 25 4 16C4 11.6 7.6 8 12 8C14.4 8 16.8 9.2 20 11.4C23.2 9.2 25.6 8 28 8C32.4 8 36 11.6 36 16C36 25 20 35 20 35Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
    />
  </svg>
);

const FORM_VAZIO = { unidadeId: '', dataPreferencial: '', tipoFichaAtendimento: '', motivo: '' };

// A ficha digital do paciente: o pré-agendamento. O motivo é opcional e só
// adianta a informação para a recepção; a triagem continua com a enfermeira.
export default function HealthForm() {
  const navigate = useNavigate();
  const usuario = useUsuario('PACIENTE');

  const [formData, setFormData] = useState(FORM_VAZIO);
  const [unidades, setUnidades] = useState([]);
  const [cadastro, setCadastro] = useState(null);
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(null);

  useEffect(() => {
    if (!usuario) return;

    unidadeService.listar()
      // A API recusa ficha em unidade inativa.
      .then(({ data }) => setUnidades(Array.isArray(data) ? data.filter((unidade) => unidade.ativa) : []))
      .catch((e) => {
        console.error('Erro ao carregar unidades:', e);
        setErros({ geral: mensagemDeErro(e, 'As unidades não carregaram. Recarregue a página.') });
      });

    // Nome, CPF e convênio vêm do cadastro. Se a busca falhar, a ficha segue
    // só com o nome guardado na sessão.
    pacienteService.buscar(usuario.id)
      .then(({ data }) => setCadastro(data))
      .catch(() => {});
  }, [usuario]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (erros[name]) setErros((prev) => ({ ...prev, [name]: '' }));
  };

  const validarFormulario = () => {
    const e = {};
    if (!formData.unidadeId) e.unidadeId = 'Escolha a unidade';
    if (!formData.dataPreferencial) e.dataPreferencial = 'Escolha a data e a hora';
    // O minuto atual também é recusado: os segundos já passaram e a API (@FutureOrPresent) devolveria 400.
    else if (formData.dataPreferencial <= dataHoraISO()) e.dataPreferencial = 'Escolha um horário no futuro';
    if (!formData.tipoFichaAtendimento) e.tipoFichaAtendimento = 'Escolha o tipo de ficha';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setCarregando(true);
    try {
      const { data } = await preAgendamentoService.criar(usuario.id, formData);
      setEnviado(data);
    } catch (erro) {
      console.error('Erro ao criar pré-agendamento:', erro);
      setErros({ geral: mensagemDeErro(erro, 'Não deu para enviar o pré-agendamento. Tente de novo.') });
    } finally {
      setCarregando(false);
    }
  };

  if (!usuario) return null;

  if (enviado) {
    return (
      <PatientLayout>
        <div className="ficha-page">
          <div className="ficha-card ficha-card-sucesso">
            <span className="ficha-selo">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 15.5l4 4 8-8.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h1>Pré-agendamento enviado</h1>
            <p>
              Seu pedido para {formatarDataHora(paraData(enviado.dataPreferencial))} na unidade{' '}
              {enviado.clinica?.nome} está aguardando a análise da recepção. Se for aceito, o
              código para apresentar na chegada aparece em Meus Pré-agendamentos.
            </p>
            <div className="ficha-sucesso-acoes">
              <button
                type="button"
                className="ficha-btn"
                onClick={() => navigate('/paciente/solicitacoes')}
              >
                Acompanhar pedido
              </button>
              <button
                type="button"
                className="ficha-btn ficha-btn-suave"
                onClick={() => navigate('/paciente/dashboard')}
              >
                Voltar ao dashboard
              </button>
            </div>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="ficha-page">
        <div className="ficha-card">
          <header className="ficha-header">
            <span className="ficha-heart"><HeartIcon /></span>
            <h1>Pré-agendamento</h1>
            <p>
              Escolha a unidade, o dia e a hora. A recepção analisa o pedido e, se aceitar, você recebe
              um código para apresentar na chegada.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="ficha-form" noValidate>
            {erros.geral && <div className="ficha-erro-geral" role="alert">{erros.geral}</div>}

            <section className="ficha-secao">
              <h2>Seus dados</h2>
              <dl className="ficha-resumo">
                <div>
                  <dt>Paciente</dt>
                  <dd>{cadastro?.nome || usuario.nome}</dd>
                </div>
                {cadastro?.cpf && (
                  <div>
                    <dt>CPF</dt>
                    <dd>{mascaraCPF(cadastro.cpf)}</dd>
                  </div>
                )}
                {cadastro?.convenio && (
                  <div>
                    <dt>Convênio</dt>
                    <dd>{cadastro.convenio}</dd>
                  </div>
                )}
              </dl>
              <p className="ficha-dica">
                Estes dados vêm do seu cadastro. Para corrigir algo, use Minha Conta.
              </p>
            </section>

            <section className="ficha-secao">
              <h2>Quando e onde</h2>

              <div className="ficha-campo">
                <label htmlFor="unidadeId">Unidade *</label>
                <select
                  id="unidadeId"
                  name="unidadeId"
                  value={formData.unidadeId}
                  onChange={handleChange}
                  disabled={carregando}
                  className={erros.unidadeId ? 'ficha-input-erro' : ''}
                >
                  <option value="">Selecione</option>
                  {unidades.map((unidade) => (
                    <option key={unidade.id} value={unidade.id}>
                      {unidade.nome}
                      {unidade.endereco?.bairro ? ` — ${unidade.endereco.bairro}` : ''}
                    </option>
                  ))}
                </select>
                {erros.unidadeId && <span className="ficha-erro-texto">{erros.unidadeId}</span>}
              </div>

              <div className="ficha-campo">
                <label htmlFor="dataPreferencial">Data e hora preferencial *</label>
                <input
                  type="datetime-local"
                  id="dataPreferencial"
                  name="dataPreferencial"
                  min={dataHoraISO()}
                  value={formData.dataPreferencial}
                  onChange={handleChange}
                  disabled={carregando}
                  className={erros.dataPreferencial ? 'ficha-input-erro' : ''}
                />
                {erros.dataPreferencial && <span className="ficha-erro-texto">{erros.dataPreferencial}</span>}
              </div>
              <p className="ficha-dica">
                O check-in vale no dia escolhido, até 15 minutos depois deste horário.
              </p>

              <div className="ficha-campo">
                <label htmlFor="tipoFichaAtendimento">Tipo de ficha *</label>
                <select
                  id="tipoFichaAtendimento"
                  name="tipoFichaAtendimento"
                  value={formData.tipoFichaAtendimento}
                  onChange={handleChange}
                  disabled={carregando}
                  className={erros.tipoFichaAtendimento ? 'ficha-input-erro' : ''}
                >
                  <option value="">Selecione</option>
                  {Object.entries(TIPOS_FICHA)
                    .filter(([valor]) => valor !== 'SUPERPREFERENCIAL')
                    .map(([valor, tipo]) => (
                      <option key={valor} value={valor}>{tipo.rotulo}</option>
                    ))}
                </select>
                {erros.tipoFichaAtendimento && <span className="ficha-erro-texto">{erros.tipoFichaAtendimento}</span>}
              </div>

              {formData.tipoFichaAtendimento === 'PREFERENCIAL' && (
                <p className="ficha-aviso">
                  A ficha preferencial é para pessoas com 60 anos ou mais, gestantes, lactantes,
                  pessoas com deficiência ou com criança de colo. A recepção confere na chegada.
                </p>
              )}

              <div className="ficha-campo">
                <label htmlFor="motivo">Motivo do atendimento (opcional)</label>
                <textarea
                  id="motivo"
                  name="motivo"
                  rows={3}
                  maxLength={2000}
                  value={formData.motivo}
                  onChange={handleChange}
                  placeholder="Ex.: dor de cabeça há 3 dias"
                  disabled={carregando}
                />
              </div>
            </section>

            <button type="submit" className="ficha-btn" disabled={carregando}>
              {carregando ? 'Enviando...' : 'Enviar pré-agendamento'}
            </button>
          </form>
        </div>
      </div>
    </PatientLayout>
  );
}
