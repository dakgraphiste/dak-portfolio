// Valide un paiement auprès de CinetPay puis ouvre l'accès. Appelé par la notification CinetPay
// et au retour de l'élève sur le site : les deux chemins sont sûrs et peuvent se répéter sans doublon.
import { adminClient } from './supabase';
import { checkPayment } from './cinetpay';

export async function settle(transactionId: string): Promise<'ACCEPTED' | 'REFUSED' | 'PENDING' | 'UNKNOWN'> {
  if (!/^DSS-[A-Z0-9-]{6,40}$/.test(transactionId)) return 'UNKNOWN';
  const db = adminClient();
  const { data: pay } = await db.from('payments').select('*').eq('transaction_id', transactionId).maybeSingle();
  if (!pay) return 'UNKNOWN';
  if (pay.status === 'ACCEPTED') return 'ACCEPTED';

  const res = await checkPayment(transactionId);
  if (!res) return 'PENDING';
  // montant et devise doivent correspondre à ce qui a été demandé
  const valid = res.status === 'ACCEPTED' && res.currency === 'XOF' && res.amount >= pay.amount;
  const status = valid ? 'ACCEPTED' : res.status === 'ACCEPTED' ? 'REFUSED' : res.status;
  await db.from('payments').update({ status, payment_method: res.method ?? null, updated_at: new Date().toISOString() }).eq('transaction_id', transactionId);
  if (status === 'ACCEPTED') {
    await db.from('enrollments').upsert({ user_id: pay.user_id, item: pay.item, source: 'paiement', transaction_id: transactionId }, { onConflict: 'user_id,item' });
  }
  return status;
}
