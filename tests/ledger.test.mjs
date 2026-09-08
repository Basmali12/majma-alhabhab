import assert from 'node:assert/strict';
import {test} from 'node:test';
import {money,total,balance,validLedger,normalize,phoneNumber} from '../lib/ledger.ts';
const d={id:'d',customer:'a',type:'debt',items:[{name:'حنفية',price:2000},{name:'أنبوب',price:3000}],amount:5000,date:'2026-09-08'};
const p={...d,id:'p',type:'payment',items:[],amount:2000};
test('multiple lines, thousands and Arabic input',()=>{assert.equal(total(d.items),5000);assert.equal(money(2000),'2,000');assert.equal(normalize('أَحمد'),'احمد');assert.equal(normalize('٢٬٠٠٠'),'2٬000')});
test('partial payment and edit/delete constraints',()=>{assert.equal(balance([d,p]),3000);assert.equal(validLedger([d,p]),true);assert.equal(validLedger([{...d,amount:1000},p]),false);assert.equal(validLedger([p]),false);assert.equal(balance([d]),5000);assert.equal(validLedger([d,{...p,amount:5000}]),true);assert.equal(validLedger([d,{...p,amount:5001}]),false);assert.equal(validLedger([d,{...p,amount:-5}]),false)});
test('cannot fund old payment with later debt',()=>assert.equal(validLedger([p,d]),false));
test('WhatsApp Iraqi normalization and invalid input',()=>{assert.equal(phoneNumber('٠٧٧٠١٢٣٤٥٦٧'),'9647701234567');assert.equal(phoneNumber('+964 770 123 4567'),'9647701234567');assert.equal(phoneNumber('abc'),'');assert.equal(phoneNumber('123'),'')});

