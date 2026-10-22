// Checagem rápida das máscaras de altura e peso. Rodar com:
//   node src/utils/mascaras.check.js
import assert from 'node:assert/strict';
import { mascaraAltura, mascaraPeso } from './mascaras.js';

assert.equal(mascaraAltura('1'), '1');
assert.equal(mascaraAltura('17'), '1,7');
assert.equal(mascaraAltura('170'), '1,70');
assert.equal(mascaraAltura('1.705'), '1,70');
assert.equal(mascaraAltura('1,'), '1'); // apagar o decimal não trava na vírgula
assert.equal(mascaraAltura('abc'), '');

assert.equal(mascaraPeso('70'), '70');
assert.equal(mascaraPeso('70,'), '70,');
assert.equal(mascaraPeso('70.5'), '70,5');
assert.equal(mascaraPeso('70,55'), '70,5');
assert.equal(mascaraPeso('1205'), '120');
assert.equal(mascaraPeso('120,5kg'), '120,5');
assert.equal(mascaraPeso('7,0,5'), '7,0');

console.log('máscaras de altura e peso: ok');
