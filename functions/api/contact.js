// Fonction Cloudflare Pages - reception du formulaire de devis Créances Ramonage Services.
// Remplace Netlify Forms : meme routage qu'avant (Mikael en direct, copie Thibaut), via Resend.
// Le marqueur [TEST-CRS] dans le message ou le sujet = essai (jamais chez l'artisan).
// Variables d'environnement Cloudflare (jamais dans le code) :
//   RESEND_API_KEY (obligatoire)
//   MAIL_FROM, NOTIFY_TO_TEST, NOTIFY_TO_PROD, NOTIFY_CC_PROD (defauts ci-dessous)

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function field(d, ...names) {
  for (const n of names) { const v = d[n]; if (v != null && String(v).trim() !== '') return String(v).trim(); }
  return '';
}

const buckets = new Map();
function rateLimited(ip) {
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b || now - b.start > 60000) b = { start: now, n: 0 };
  b.n++; buckets.set(ip, b);
  return b.n > 10;
}

function jsonOk() {
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
function jsonErr(msg) {
  return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost({ request, env }) {
  try {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    if (rateLimited(ip)) return jsonOk();

    const d = {};
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/x-www-form-urlencoded')) {
      const params = new URLSearchParams(await request.text());
      for (const [k, v] of params.entries()) d[k] = v;
    } else {
      const form = await request.formData();
      for (const [k, v] of form.entries()) { if (typeof v === 'string') d[k] = v; }
    }

    // Honeypot : un bot qui remplit 'adresse-web' croit reussir, rien n'est envoye.
    if (String(d['adresse-web'] || '').trim() !== '') return jsonOk();

    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) { console.error('RESEND_API_KEY absente'); return jsonErr('Configuration incomplete.'); }

    const nom = field(d, 'nom', 'name') || 'Non precise';
    const tel = field(d, 'tel', 'telephone');
    const email = field(d, 'email');
    const commune = field(d, 'commune') || 'Non precisee';
    const prestations = field(d, 'prestations', 'prestation') || 'Non precisee';
    const appareil = field(d, 'appareil') || 'Non precise';
    const message = field(d, 'message');
    const subjectForm = field(d, 'subject');

    // Convention interne stricte : [TEST-CRS] = essai, jamais chez l'artisan.
    const isTest = /\[TEST-CRS\]/i.test(message) || /\[TEST-CRS\]/i.test(subjectForm);
    const toVar = isTest ? (env.NOTIFY_TO_TEST || 'contact@localiapro.fr')
                         : (env.NOTIFY_TO_PROD || 'creancesramonageservices@bbox.fr');
    const ccVar = isTest ? '' : (env.NOTIFY_CC_PROD || 'contact@thibautmarie-web.fr');
    const to = toVar.split(',').map(s => s.trim()).filter(Boolean);
    const cc = ccVar.split(',').map(s => s.trim()).filter(Boolean);
    const from = env.MAIL_FROM || 'Créances Ramonage Services <notifications@ms-plomberie-manche.fr>';

    const dateFr = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const submissionId = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    const lignes = [
      ['Prestation(s)', prestations], ['Installation', appareil], ['Nom', nom],
      ['Téléphone', tel || '-'], ['Commune', commune], ['E-mail', email || '-'], ['Message', message || '-'],
    ].map(([k, v]) => `<tr><td width="130" style="color:#5a6b80;">${k}</td><td style="font-weight:bold;">${esc(v)}</td></tr>`).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:20px;">
<table width="100%" style="max-width:560px;background:#fff;border-radius:8px;padding:20px;">
  <tr><td><h2 style="color:#b3541e;margin:0 0 12px;">${isTest ? '[TEST] ' : ''}Demande de devis - creances-ramonage-services.fr</h2>
  <table>${lignes}</table>
  <p style="color:#5a6b80;font-size:12px;margin-top:16px;">Recue le ${esc(dateFr)} - demande n° ${esc(submissionId)}<br>
  Repondez directement a ce mail : votre reponse ira au client (reply-to deja rempli).</p></td></tr>
</table></body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to, ...(cc.length ? { cc } : {}),
        ...(email ? { reply_to: email } : {}),
        subject: `${isTest ? 'TEST - ' : ''}${subjectForm || `Demande de devis - ${prestations} - ${commune} - ${nom}`}`,
        html,
      }),
    });
    if (!res.ok) {
      console.error('Resend a refuse:', res.status);
      return jsonErr('L\'envoi n\'a pas abouti.');
    }
    return jsonOk();
  } catch (e) {
    console.error('contact erreur:', e && e.message);
    return jsonErr('L\'envoi n\'a pas abouti.');
  }
}
