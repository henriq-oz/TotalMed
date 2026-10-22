// Traduz o erro do Api.jsx (formato ApiError do backend) numa frase para a tela.
export function mensagemDeErro(erro, padrao) {
  const resposta = erro?.response;
  if (!resposta) return 'Não foi possível conectar ao servidor. Verifique se a API está no ar.';

  const { status, data } = resposta;
  if (status === 400 && Array.isArray(data?.detalhes) && data.detalhes.length > 0) {
    return data.detalhes.join(' · ');
  }
  // Os 400 sem "detalhes" são o fallback de RuntimeException da API (ex.: erro de banco),
  // com mensagem técnica que não serve para o usuário.
  if (status !== 400 && typeof data?.message === 'string' && data.message) return data.message;
  return padrao;
}
