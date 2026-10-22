import { useEffect, useState } from 'react';
import { unidadeService } from '../../services/UnidadeService';
import { mensagemDeErro } from '../../utils/erros';

const CHAVE = 'unidadeRecepcao';

// Unidade em que o balcão está atendendo. O admin ainda não tem unidade na API,
// então a escolha fica no localStorage para o check-in e a fila abrirem na mesma.
export function useUnidadeRecepcao() {
  const [unidades, setUnidades] = useState([]);
  const [unidadeId, setUnidadeId] = useState(() => localStorage.getItem(CHAVE) || '');
  const [erro, setErro] = useState('');

  useEffect(() => {
    unidadeService.listar()
      .then(({ data }) => {
        const lista = Array.isArray(data) ? data : [];
        setUnidades(lista);
        // A unidade guardada pode não existir mais (banco recriado, id do mock antigo).
        setUnidadeId((atual) => (lista.some((unidade) => String(unidade.id) === atual) ? atual : ''));
      })
      .catch((e) => {
        console.error('Erro ao carregar unidades:', e);
        setErro(mensagemDeErro(e, 'As unidades não carregaram. Recarregue a página.'));
      });
  }, []);

  const escolherUnidade = (id) => {
    setUnidadeId(id);
    localStorage.setItem(CHAVE, id);
  };

  return { unidades, unidadeId, escolherUnidade, erro };
}
