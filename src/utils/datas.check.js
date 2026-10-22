// Checagem rápida da leitura da data de nascimento e do cálculo de idade. Rodar com:
//   node src/utils/datas.check.js
import assert from 'node:assert/strict';
import { idade, lerDataBR } from './datas.js';

assert.equal(lerDataBR('31/02/2000'), null); // não existe
assert.equal(lerDataBR('29/02/2023'), null); // 2023 não é bissexto
assert.equal(lerDataBR('01/01/2'), null); // ano incompleto
assert.equal(lerDataBR(''), null);
assert.equal(lerDataBR('29/02/2024').getDate(), 29);

const hoje = new Date(2026, 9, 16); // 16/10/2026
assert.equal(idade(lerDataBR('16/10/2008'), hoje), 18); // aniversário hoje
assert.equal(idade(lerDataBR('17/10/2008'), hoje), 17); // amanhã
assert.equal(idade(lerDataBR('31/12/2008'), hoje), 17); // fim do ano
assert.equal(idade(lerDataBR('15/06/1995'), hoje), 31);

console.log('data de nascimento e idade: ok');
