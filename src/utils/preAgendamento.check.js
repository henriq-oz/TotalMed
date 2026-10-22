// Checagem rápida das regras do fluxo. Rodar com:
//   node src/utils/preAgendamento.check.js
import assert from 'node:assert/strict';
import { formatarCodigo, normalizarCodigo, ordenarFila } from './preAgendamento.js';

// Código: 8 caracteres, como a API gera e compara.
assert.equal(normalizarCodigo(' 6dfc-749d '), '6DFC749D');
assert.equal(normalizarCodigo('6dfc749d99'), '6DFC749D');
assert.equal(formatarCodigo('6dfc749d'), '6DFC-749D');
assert.equal(formatarCodigo('6dfc'), '6DFC');
assert.equal(formatarCodigo('6dfc7'), '6DFC-7');

// Fila: Superpreferencial, Preferencial, Normal; empate decide pela ordem de entrada.
const fila = ordenarFila([
  { id: 'D', ordemChegada: 'NORMAL', horarioEntrada: '2026-10-07T11:00:00' },
  { id: 'C', ordemChegada: 'PREFERENCIAL', horarioEntrada: '2026-10-07T11:20:00' },
  { id: 'E', ordemChegada: 'NORMAL', horarioEntrada: '2026-10-07T11:30:00' },
  { id: 'B', ordemChegada: 'PREFERENCIAL', horarioEntrada: '2026-10-07T11:10:00' },
  { id: 'A', ordemChegada: 'SUPERPREFERENCIAL', horarioEntrada: '2026-10-07T11:40:00' },
  { id: 'F', ordemChegada: 'Desconhecido', horarioEntrada: '2026-10-07T10:00:00' },
]);
assert.deepEqual(fila.map((entrada) => entrada.id), ['A', 'B', 'C', 'D', 'E', 'F']);

console.log('regras do pré-agendamento: ok');
