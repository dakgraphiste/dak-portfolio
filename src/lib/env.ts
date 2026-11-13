// Variables d'environnement lues au moment de la requête (réglées dans Vercel → Settings → Environment Variables).
// Aucune n'est envoyée au navigateur.
const read = (k: string) => (typeof process !== 'undefined' ? process.env[k] : undefined) ?? (import.meta.env as Record<string, string | undefined>)[k];

export const env = {
  get supabaseUrl() { return read('SUPABASE_URL'); },
  get supabaseAnonKey() { return read('SUPABASE_ANON_KEY'); },
  get supabaseServiceKey() { return read('SUPABASE_SERVICE_ROLE_KEY'); },
  get cinetpayApiKey() { return read('CINETPAY_APIKEY'); },
  get cinetpaySiteId() { return read('CINETPAY_SITE_ID'); },
  get bunnyLibraryId() { return read('BUNNY_LIBRARY_ID'); },
  get bunnyTokenKey() { return read('BUNNY_TOKEN_KEY'); },
  /** e-mails autorisés à voir l'administration de l'école, séparés par des virgules */
  get adminEmails() { return (read('ADMIN_EMAILS') || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean); },
};

/** Vrai quand Supabase est configuré : sinon l'espace élève affiche « en cours d'ouverture ». */
export const portalReady = () => !!(env.supabaseUrl && env.supabaseAnonKey && env.supabaseServiceKey);
export const paymentsReady = () => !!(env.cinetpayApiKey && env.cinetpaySiteId);
