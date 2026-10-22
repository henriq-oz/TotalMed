// Busca sem diferenciar maiúsculas nem acentos ("jose" encontra "José").
export const normalizar = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const combinaBusca = (termo, campos) => {
  const alvo = normalizar(termo);
  if (!alvo) return true;
  return campos.some((campo) => normalizar(campo).includes(alvo));
};
