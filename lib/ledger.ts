export type Transaction = {
  id: string;
  customer: string;
  type: 'debt' | 'payment';
  items: { name: string; price: number }[];
  amount: number;
  date: string;
};
export const money = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
export const normalize = (s: string) =>
  s
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[أإآ]/g, 'ا')
    .replace(/[\u064B-\u065Fـ]/g, '')
    .toLowerCase();
export const total = (items: { price: number }[]) =>
  items.reduce((n, i) => n + i.price, 0);
export const balance = (tx: Transaction[]) =>
  tx.reduce((n, t) => n + (t.type === 'debt' ? t.amount : -t.amount), 0);
export function validLedger(tx: Transaction[]) {
  let amount = 0;
  return tx.every((t) => {
    amount += t.type === 'debt' ? t.amount : -t.amount;
    return (
      Number.isSafeInteger(t.amount) &&
      t.amount > 0 &&
      Number.isSafeInteger(amount) &&
      amount >= 0
    );
  });
}
export function phoneNumber(s: string) {
  let p = normalize(s).replace(/[\s()+-]/g, '');
  if (p.startsWith('00')) p = p.slice(2);
  if (/^07\d{9}$/.test(p)) p = '964' + p.slice(1);
  return /^[1-9]\d{7,14}$/.test(p) ? p : '';
}
