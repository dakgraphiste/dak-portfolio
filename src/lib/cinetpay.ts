// Paiement CinetPay (Mobile Money Orange, MTN, Moov, Wave et carte bancaire).
// Règle d'or : on ne croit jamais une notification sur parole. Avant de donner un accès,
// le serveur redemande le statut à CinetPay avec sa propre clé (checkPayment) et compare le montant.
import { randomBytes } from 'node:crypto';
import { env } from './env';

const API = (typeof process !== 'undefined' && process.env.CINETPAY_API_URL) || 'https://api-checkout.cinetpay.com/v2'; // CINETPAY_API_URL : tests uniquement

export const newTransactionId = () => `DSS-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;

type InitInput = { transactionId: string; amount: number; description: string; notifyUrl: string; returnUrl: string; customer: { name: string; surname: string; email: string; phone?: string } };

export async function initPayment(i: InitInput): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const body = {
    apikey: env.cinetpayApiKey, site_id: env.cinetpaySiteId, transaction_id: i.transactionId,
    amount: i.amount, currency: 'XOF', description: i.description.replace(/[^\p{L}\p{N} .,'-]/gu, ' ').slice(0, 120),
    notify_url: i.notifyUrl, return_url: i.returnUrl, channels: 'ALL', lang: 'FR',
    customer_name: i.customer.name || 'Eleve', customer_surname: i.customer.surname || 'Dak Studio School',
    customer_email: i.customer.email, customer_phone_number: i.customer.phone || '',
    customer_address: 'Abidjan', customer_city: 'Abidjan', customer_country: 'CI', customer_state: 'CI', customer_zip_code: '00225',
  };
  try {
    const r = await fetch(`${API}/payment`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (j?.code === '201' && j?.data?.payment_url) return { ok: true, url: j.data.payment_url };
    return { ok: false, error: j?.description || j?.message || `Erreur ${r.status}` };
  } catch {
    return { ok: false, error: 'Service de paiement injoignable' };
  }
}

export type CheckResult = { status: 'ACCEPTED' | 'REFUSED' | 'PENDING'; amount: number; currency: string; method?: string };

export async function checkPayment(transactionId: string): Promise<CheckResult | null> {
  try {
    const r = await fetch(`${API}/payment/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apikey: env.cinetpayApiKey, site_id: env.cinetpaySiteId, transaction_id: transactionId }) });
    const j = await r.json().catch(() => null);
    const d = j?.data;
    if (!d) return null;
    const status = d.status === 'ACCEPTED' ? 'ACCEPTED' : d.status === 'REFUSED' ? 'REFUSED' : 'PENDING';
    return { status, amount: Number(d.amount), currency: d.currency, method: d.payment_method };
  } catch {
    return null;
  }
}
