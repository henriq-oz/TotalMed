// A API devolve LocalDate/LocalDateTime como ISO ("2026-09-14T10:30:00"), mas se a
// configuração do Jackson mudar eles podem vir como array [ano, mes, dia, h, min].
export function paraData(valor) {
  if (!valor) return null;

  if (Array.isArray(valor)) {
    const [ano, mes, dia, hora = 0, minuto = 0] = valor;
    return new Date(ano, mes - 1, dia, hora, minuto);
  }

  // "AAAA-MM-DD" puro seria lido como meia-noite UTC e cairia no dia anterior no Brasil.
  const soData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (soData) return new Date(Number(soData[1]), Number(soData[2]) - 1, Number(soData[3]));

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

// "dd/mm/aaaa" digitado no cadastro -> Date local. Devolve null se a data não
// existe (31/02, ano incompleto): o new Date "rolaria" 31/02 para 02/03 sem avisar.
export function lerDataBR(texto) {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto ?? '');
  if (!partes) return null;
  const [dia, mes, ano] = partes.slice(1).map(Number);
  const data = new Date(ano, mes - 1, dia);
  return data.getDate() === dia && data.getMonth() === mes - 1 ? data : null;
}

// Anos completos: só conta o ano atual depois do aniversário.
export function idade(nascimento, hoje = new Date()) {
  const anos = hoje.getFullYear() - nascimento.getFullYear();
  const jaFezAniversario =
    hoje.getMonth() > nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate());
  return jaFezAniversario ? anos : anos - 1;
}

export function mesmoDia(data, referencia) {
  return (
    data.getFullYear() === referencia.getFullYear() &&
    data.getMonth() === referencia.getMonth() &&
    data.getDate() === referencia.getDate()
  );
}

// "AAAA-MM-DD" no fuso local. O toISOString usa UTC e viraria o dia à noite no Brasil.
export const diaISO = (data = new Date()) =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;

// "AAAA-MM-DDTHH:MM" no fuso local: o valor do <input type="datetime-local"> e o
// que a API lê como LocalDateTime.
export const dataHoraISO = (data = new Date()) =>
  `${diaISO(data)}T${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;

export const formatarHora = (data) =>
  data ? data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--';

export const formatarData = (data) =>
  data ? data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export const formatarDataHora = (data) =>
  data ? `${formatarData(data)} às ${formatarHora(data)}` : '—';
