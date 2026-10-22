import { useTemaEscuro } from '../utils/tema';

export const IconeLua = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.5 12.3A6.8 6.8 0 0 1 7.7 3.5a7 7 0 1 0 8.8 8.8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);

// Botão de tema das telas sem sidebar; nos painéis o item fica na própria sidebar.
export default function BotaoTema({ fixo = false }) {
  const [escuro, alternarTema] = useTemaEscuro();

  return (
    <button
      type="button"
      className={`botao-tema ${fixo ? 'botao-tema-fixo' : ''}`}
      onClick={alternarTema}
      aria-pressed={escuro}
      aria-label="Modo escuro"
      title="Modo escuro"
    >
      <IconeLua />
    </button>
  );
}
