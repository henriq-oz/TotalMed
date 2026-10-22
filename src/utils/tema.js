import { useEffect, useState } from 'react';

// Mesma chave e classe do script inline do index.html, que aplica o tema
// antes da primeira pintura.
const CHAVE = 'temaEscuro';

// ponytail: estado por instância, e cada tela tem um único botão de tema.
// Se dois botões passarem a coexistir na mesma tela, trocar por context.
export function useTemaEscuro() {
  const [escuro, setEscuro] = useState(() => localStorage.getItem(CHAVE) === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('tema-escuro', escuro);
    localStorage.setItem(CHAVE, String(escuro));
  }, [escuro]);

  return [escuro, () => setEscuro((anterior) => !anterior)];
}
