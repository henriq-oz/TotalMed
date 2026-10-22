import { useRef } from 'react';
import '../styles/CentralAjuda.css';

const Icone = ({ tamanho = 20, children }) => (
  <svg
    width={tamanho}
    height={tamanho}
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    {children}
  </svg>
);

const IconeAjuda = ({ tamanho = 18 }) => (
  <Icone tamanho={tamanho}>
    <circle cx="10" cy="10" r="8" />
    <path d="M7.8 7.7a2.2 2.2 0 1 1 3.3 1.9c-.7.4-1.1.8-1.1 1.6v.3" />
    <circle cx="10" cy="14" r="0.9" fill="currentColor" stroke="none" />
  </Icone>
);

const PERGUNTAS = [
  {
    titulo: 'Como fazer um pré-agendamento?',
    resposta:
      'Acesse a opção "Novo Pré-agendamento" no menu. Escolha a unidade de atendimento, a data desejada e o tipo de ficha, que pode ser Normal ou Preferencial. Em seguida, envie sua solicitação e aguarde a análise da recepção.',
    icone: (
      <>
        <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
        <path d="M3 8.5h14M7 2.5v4M13 2.5v4M10 10.5v4M8 12.5h4" />
      </>
    ),
  },
  {
    titulo: 'Como acompanhar minha solicitação?',
    resposta:
      'Acesse "Meus Pré-agendamentos" para consultar suas solicitações e verificar o status de cada pedido. A recepção poderá aceitar ou recusar o pré-agendamento.',
    icone: (
      <>
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 6v4.2l2.8 1.8" />
      </>
    ),
  },
  {
    titulo: 'Onde encontro meu código de atendimento?',
    resposta:
      'Após a aprovação do pré-agendamento pela recepção, o sistema gera um código único de atendimento. Consulte os detalhes da solicitação aprovada para localizar esse código. Caso o código ainda não esteja disponível, verifique se o pedido já foi aprovado.',
    icone: <path d="M7.5 3 6 17M14 3l-1.5 14M3.5 7.5H17M3 12.5h13.5" />,
  },
  {
    titulo: 'O que acontece se meu pré-agendamento for recusado?',
    resposta:
      'Se a recepção recusar sua solicitação, o motivo da recusa deverá ser informado no sistema. Consulte os detalhes do pedido em "Meus Pré-agendamentos" para verificar as informações disponíveis.',
    icone: (
      <>
        <circle cx="10" cy="10" r="7.5" />
        <path d="m7.5 7.5 5 5M12.5 7.5l-5 5" />
      </>
    ),
  },
  {
    titulo: 'Qual é a diferença entre os tipos de ficha?',
    resposta:
      'O sistema permite selecionar o tipo de ficha durante o pré-agendamento. A Preferencial é para pessoas com 60 anos ou mais, gestantes, lactantes, pessoas com deficiência ou com criança de colo. A Normal é destinada aos demais atendimentos. A escolha da ficha não substitui a análise da recepção nem a validação das condições de prioridade na unidade.',
    icone: (
      <>
        <circle cx="7.5" cy="7" r="2.8" />
        <path d="M2.5 16.5c.4-2.9 2.5-4.5 5-4.5s4.6 1.6 5 4.5M13 4.4a2.8 2.8 0 0 1 0 5.2M14.8 12.3c1.5.6 2.4 2 2.7 4.2" />
      </>
    ),
  },
  {
    titulo: 'O que devo fazer quando chegar à unidade?',
    resposta:
      'Apresente o código de atendimento gerado após a aprovação do seu pré-agendamento à equipe da recepção. Após a validação do código, você entrará na fila de espera da triagem, conforme o funcionamento do sistema.',
    icone: (
      <>
        <path d="M10 17.5s5.5-4.9 5.5-9.3a5.5 5.5 0 0 0-11 0c0 4.4 5.5 9.3 5.5 9.3Z" />
        <circle cx="10" cy="8.2" r="2" />
      </>
    ),
  },
];

// O <dialog> nativo já prende o foco, fecha com Esc e devolve o foco ao botão.
export default function CentralAjuda() {
  const dialogo = useRef(null);

  return (
    <>
      <button
        type="button"
        className="help-fab"
        aria-label="Abrir Central de Ajuda"
        aria-haspopup="dialog"
        onClick={() => dialogo.current.showModal()}
      >
        <IconeAjuda />
      </button>

      <dialog
        ref={dialogo}
        className="ajuda"
        aria-labelledby="ajuda-titulo"
        // O clique no fundo (::backdrop) chega com o próprio <dialog> como alvo.
        onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget) evento.currentTarget.close();
        }}
      >
        <div className="ajuda-painel">
          <header className="ajuda-cabecalho">
            <span className="ajuda-emblema">
              <IconeAjuda tamanho={22} />
            </span>
            <h2 id="ajuda-titulo">Central de Ajuda</h2>
            <p>Como podemos ajudar?</p>
            <button
              type="button"
              className="ajuda-fechar"
              aria-label="Fechar Central de Ajuda"
              onClick={() => dialogo.current.close()}
            >
              ×
            </button>
          </header>

          <div className="ajuda-corpo">
            <div className="ajuda-lista">
              {PERGUNTAS.map((pergunta) => (
                // O mesmo name faz o navegador manter só uma resposta aberta.
                <details key={pergunta.titulo} className="ajuda-item" name="ajuda-faq">
                  <summary>
                    <span className="ajuda-item-icone">
                      <Icone>{pergunta.icone}</Icone>
                    </span>
                    <span className="ajuda-item-titulo">{pergunta.titulo}</span>
                    <span className="ajuda-seta">
                      <Icone tamanho={16}>
                        <path d="m5 7.5 5 5 5-5" />
                      </Icone>
                    </span>
                  </summary>
                  <p>{pergunta.resposta}</p>
                </details>
              ))}
            </div>

            <p className="ajuda-rodape">
              Não encontrou o que procurava? Entre em contato com a sua unidade de atendimento.
            </p>
          </div>
        </div>
      </dialog>
    </>
  );
}
