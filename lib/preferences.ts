import { normalize, money, type Transaction } from './ledger';
export const DEFAULT_NAME = 'مجمع الهفهاف';
export const DEFAULT_INTRO =
  'أهلًا بكم، إليكم تفاصيل حسابكم. شكرًا لتعاملكم معنا.';
export const normalizePin = (pin: string) => normalize(pin).trim();
export const validPin = (pin: string) => /^\d{4,8}$/.test(normalizePin(pin));
export async function hashPin(pin: string) {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalizePin(pin)),
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}
export function whatsappText(
  name: string,
  intro: string,
  customer: string,
  t: Transaction,
  debt: number,
) {
  return [
    name.trim(),
    intro.trim(),
    `الزبون: ${customer}`,
    `${t.type === 'debt' ? 'دين' : 'تسديد'} • ${new Date(t.date).toLocaleDateString('ar-IQ')}`,
    ...t.items.map((i) => `${i.name}: ${money(i.price)} د.ع`),
    `المبلغ: ${money(t.amount)} د.ع`,
    `الدين المتبقي: ${money(debt)} د.ع`,
  ]
    .filter(Boolean)
    .join('\n');
}

export const DEFAULT_PIN_HASH =
  'fe675fe7aaee830b6fed09b64e034f84dcbdaeb429d9cccd4ebb90e15af8dd71';
