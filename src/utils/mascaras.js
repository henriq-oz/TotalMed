// Máscaras de digitação usadas nos formulários de cadastro.
// Cada função recebe o valor bruto do input e devolve o valor já formatado,
// aceitando apagar (backspace) sem travar o campo.

export const apenasDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');

// 000.000.000-00
export const mascaraCPF = (valor) => {
  const d = apenasDigitos(valor).substring(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

// RG sem máscara: 8 dígitos + dígito verificador, que pode ser número ou letra (ex: X)
export const limparRG = (valor) => {
  const chars = String(valor ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  const digitos = chars.replace(/\D/g, '').substring(0, 8);
  if (digitos.length < 8) return digitos;
  // O verificador é o primeiro caractere depois do 8º dígito
  let vistos = 0;
  for (let i = 0; i < chars.length; i++) {
    if (/\d/.test(chars[i]) && ++vistos === 8) return digitos + (chars[i + 1] ?? '');
  }
  return digitos;
};

// 00.000.000-0 (o último caractere aceita letra)
export const mascaraRG = (valor) => {
  const d = limparRG(valor);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}-${d.slice(8)}`;
};

// 00000-000
export const mascaraCEP = (valor) => {
  const d = apenasDigitos(valor).substring(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
};

// dd/mm/aaaa
export const mascaraData = (valor) => {
  const d = apenasDigitos(valor).substring(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

// (11) 99999-9999 para celular e (11) 9999-9999 para fixo
export const mascaraTelefone = (valor) => {
  const d = apenasDigitos(valor).substring(0, 11);
  if (!d) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

// O CRM é gravado como número no backend, então aceita só dígitos (até 6)
export const mascaraCRM = (valor) => apenasDigitos(valor).substring(0, 6);

// 08:00 - 17:00
export const mascaraHorario = (valor) => {
  const d = apenasDigitos(valor).substring(0, 8);
  if (!d) return '';
  const hora = (h) => (h.length === 2 && Number(h) > 23 ? '23' : h);
  const minuto = (m) => (m.length === 2 && Number(m) > 59 ? '59' : m);

  const horaInicio = hora(d.slice(0, 2));
  if (d.length <= 2) return horaInicio;

  const minutoInicio = minuto(d.slice(2, 4));
  if (d.length <= 4) return `${horaInicio}:${minutoInicio}`;

  const horaFim = hora(d.slice(4, 6));
  if (d.length <= 6) return `${horaInicio}:${minutoInicio} - ${horaFim}`;

  return `${horaInicio}:${minutoInicio} - ${horaFim}:${minuto(d.slice(6, 8))}`;
};

// 1,70 (metros): a vírgula entra sozinha depois do primeiro dígito
export const mascaraAltura = (valor) => {
  const d = apenasDigitos(valor).substring(0, 3);
  return d.length <= 1 ? d : `${d[0]},${d.slice(1)}`;
};

// 70 ou 70,5 (kg): até 3 dígitos inteiros e 1 decimal; aceita ponto como vírgula
export const mascaraPeso = (valor) => {
  const [inteiro, ...resto] = String(valor ?? '').replace(/\./g, ',').replace(/[^\d,]/g, '').split(',');
  const kg = inteiro.substring(0, 3);
  return resto.length ? `${kg},${resto.join('').substring(0, 1)}` : kg;
};

const MASCARAS = {
  altura: mascaraAltura,
  peso: mascaraPeso,
  cpf: mascaraCPF,
  rg: mascaraRG,
  cep: mascaraCEP,
  dataNascimento: mascaraData,
  tell: mascaraTelefone,
  crm: mascaraCRM,
  horario: mascaraHorario,
};

// Aplica a máscara do campo (pelo name do input); devolve o valor intacto se não houver
export const aplicarMascara = (campo, valor) =>
  MASCARAS[campo] ? MASCARAS[campo](valor) : valor;
