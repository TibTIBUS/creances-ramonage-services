const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// ── Base de réponses factuelles de Créances Ramonage Services ──
// Ces questions ne passent JAMAIS par le modèle IA : les réponses sont figées
// pour garantir qu'aucun tarif, horaire ou engagement n'est inventé.
function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const KB = [
  {
    keywords: ['feu de cheminee', 'ca brule', 'ça brule', 'incendie', 'degage beaucoup de fumee', 'monoxyde', 'intoxication'],
    reply: "⚠️ Si vous avez un feu de cheminée ou une suspicion d'intoxication au monoxyde de carbone, appelez immédiatement les pompiers au **18** ou le **112**. N'attendez pas.\n\nUne fois le danger écarté, Mikael peut vérifier votre conduit : 06 89 37 61 51."
  },
  {
    keywords: ['tarif', 'prix', 'combien', 'coute', 'cout', 'cher', '85', '170'],
    reply: "Voici les tarifs de Mikael :\n\n- **85 €** le ramonage d'un conduit bois (cheminée ouverte, insert ou poêle à bois), certificat pour votre assurance inclus\n- **170 €** l'entretien complet d'un poêle à granulés avec ramonage\n- **À partir de 8 € le m²** pour le démoussage de toiture et le nettoyage de façade\n- Petits travaux : sur devis\n\nLe devis est gratuit : [formulaire de devis](/#devis)."
  },
  {
    keywords: ['horaire', 'ouvert', 'quand', 'disponible', 'dispo', 'samedi', 'dimanche', 'jours'],
    reply: "Mikael intervient **du lundi au vendredi, de 8h à 12h et de 13h30 à 18h**. Le samedi, il peut intervenir sur demande particulière. Dimanche : fermé.\n\nPour caler un passage : 06 89 37 61 51 ou le [formulaire de devis](/#devis)."
  },
  {
    keywords: ['zone', 'secteur', 'intervenez', 'intervient', 'deplace', 'deplacement', 'lessay', 'coutances', 'periers', 'la haye', 'pirou', 'saint-lo', 'granville', 'agence', 'km', 'kilometre', 'loin'],
    reply: "Mikael intervient dans un **rayon de 50 km autour de Créances** : Lessay, Coutances, Périers, La Haye, Pirou et les communes alentour.\n\nAu-delà de 50 km, c'est possible sur demande : appelez le 06 89 37 61 51 ou faites une [demande de devis](/#devis)."
  },
  {
    keywords: ['telephone', 'appeler', 'appel', 'numero', 'joindre', 'contacter', 'contact', 'sms'],
    reply: "Vous pouvez joindre Mikael directement :\n\n- **06 89 37 61 51** (appel ou SMS)\n- creancesramonageservices@bbox.fr\n- Ou le [formulaire de devis](/#devis), gratuit et sans engagement — il vous rappelle rapidement."
  },
  {
    keywords: ['email', 'e-mail', 'mail', 'adresse mail'],
    reply: "L'adresse e-mail de Créances Ramonage Services est **creancesramonageservices@bbox.fr**.\n\nMikael est aussi joignable au 06 89 37 61 51 (appel ou SMS)."
  },
  {
    keywords: ['adresse', 'situe', 'localise', 'paperie', 'ou etes'],
    reply: "Créances Ramonage Services est basé au **131 rue de la Paperie, 50710 Créances** (Manche). Mikael intervient à domicile dans un rayon de 50 km."
  },
  {
    keywords: ['paiement', 'payer', 'regler', 'reglement', 'cheque', 'carte', 'virement', 'espece'],
    reply: "Mikael accepte la **carte bancaire, le virement et le chèque**. Vous choisissez ce qui vous arrange."
  },
  {
    keywords: ['certificat', 'attestation', 'assurance', 'justificatif'],
    reply: "Oui. Mikael vous remet une **attestation (certificat) de ramonage** après chaque intervention. Conservez-la : votre assureur peut vous la demander."
  },
  {
    keywords: ['frequence', 'souvent', 'tous les combien', 'obligatoire', 'obligation', '1 fois par an', 'une fois par an'],
    reply: "Au minimum **une fois tous les 12 mois** : c'est la règle nationale depuis le 1er octobre 2023 pour les appareils au bois et aux granulés. Un deuxième passage est conseillé si vous vous chauffez beaucoup, et votre commune ou votre assureur peuvent en demander davantage."
  },
  {
    keywords: ['granule', 'pellet'],
    reply: "Oui, Mikael entretient les poêles à granulés : le poêle demande un entretien annuel de l'appareil et un ramonage du conduit, et il fait les deux lors du même passage (**170 €** l'entretien + ramonage).\n\nPour caler un passage : [formulaire de devis](/#devis) ou 06 89 37 61 51."
  },
  {
    keywords: ['demoussage', 'demousser', 'mousse', 'toiture', 'facade', 'pignon', 'algue'],
    reply: "Oui, Mikael démousse les toitures et nettoie les façades et pignons (algues rouges et vertes) : **à partir de 8 € le m²**.\n\nUn nettoyage régulier protège votre toiture, vos gouttières et vos murs. Devis gratuit : [formulaire de devis](/#devis)."
  },
  {
    keywords: ['preparer', 'preparation', 'avant la venue', 'avant votre venue', 'avant l intervention', 'avant le ramonage'],
    reply: "Avant le passage de Mikael : laissez l'appareil **éteint et froid**, et dégagez l'accès autour de la cheminée ou du poêle. Il s'occupe du reste."
  },
  {
    keywords: ['devis', 'rdv', 'rendez-vous', 'rendez vous', 'reserver', 'reservation', 'planifier'],
    reply: "Le devis est **gratuit et sans engagement** : remplissez le [formulaire de devis](/#devis) (2 minutes), et Mikael vous rappelle rapidement pour convenir d'un rendez-vous.\n\nPour une urgence, appelez directement le 06 89 37 61 51."
  },
  {
    keywords: ['robot', 'ia', 'intelligence artificielle', 'humain', 'vrai personne', 'es-tu', 'qui es tu', 'braise'],
    reply: "Je suis Braise, l'assistant IA du site de Créances Ramonage Services 🤖 Je réponds aux questions courantes à partir des informations du site.\n\nPour échanger avec un humain : Mikael, au **06 89 37 61 51**."
  },
  {
    keywords: ['qui est mikael', 'mikael qui', 'l artisan', 'entreprise', 'siret', 'societe'],
    reply: "Mikael Guillotte est **artisan ramoneur à Créances** (Manche), accompagné par la Chambre de métiers pour la création de son entreprise. Ramonage, chauffage bois et granulés, démoussage et petits travaux : un seul interlocuteur, lui.\n\nPour toute question administrative précise : creancesramonageservices@bbox.fr."
  },
  {
    keywords: ['petit travaux', 'bricolage', 'travaux maison'],
    reply: "Oui, Mikael fait aussi les **petits travaux d'entretien et de bricolage** de la maison — pratique quand vous le connaissez déjà. Le tarif est établi sur devis : [formulaire de devis](/#devis) ou 06 89 37 61 51."
  },
  {
    keywords: ['merci', 'bonjour', 'bonsoir', 'salut', 'au revoir'],
    reply: "Avec plaisir ! 😊 Si vous avez besoin d'un ramonage, d'un entretien de poêle ou d'un démoussage, le devis est gratuit : [formulaire de devis](/#devis). Mikael vous rappelle rapidement."
  }
];

function checkKB(lastUserMessage) {
  if (!lastUserMessage) return null;
  const normalized = normalize(lastUserMessage);
  for (const item of KB) {
    if (item.keywords.some(k => normalized.includes(normalize(k)))) {
      return item.reply;
    }
  }
  return null;
}

const FALLBACK_SANS_IA = "Bonne question ! Pour celle-ci, Mikael vous répond directement :\n\n- **06 89 37 61 51** (appel ou SMS)\n- creancesramonageservices@bbox.fr\n- Ou le [formulaire de devis](/#devis), gratuit et sans engagement.";

const systemPrompt = `Tu es Braise, l'assistant IA du site de Créances Ramonage Services, l'entreprise de Mikael Guillotte, artisan ramoneur basé au 131 rue de la Paperie, 50710 Créances (Manche).
Tu réponds en français, avec chaleur et simplicité, sans jargon. Tu VOUVOIES toujours le visiteur, sans exception.
Tu es une intelligence artificielle : si le visiteur te demande si tu es un robot ou une IA, réponds toujours honnêtement que oui.

IDENTITÉ IMPORTANTE :
Créances Ramonage Services, c'est Mikael, en personne — pas d'équipe, pas de standard. C'est sa force : un interlocuteur unique qui connaît la maison et l'installation de chaque client. Ne dis jamais "notre équipe" ; dis "Mikael".

FAITS DU SITE (ne JAMAIS inventer autre chose) :
- Prestations : ramonage de cheminées, inserts et poêles (nettoyage mécanique du conduit, contrôle du tirage, certificat remis) ; entretien et conseil pour poêles à bois et à granulés ; démoussage de toitures et nettoyage de façades/pignons ; petits travaux d'entretien de la maison.
- Tarifs : 85 € le ramonage d'un conduit bois ; 170 € l'entretien + ramonage d'un poêle à granulés ; démoussage et façade à partir de 8 € le m² ; petits travaux sur devis. Devis toujours gratuit et sans engagement.
- Zone : rayon de 50 km autour de Créances (Lessay, Coutances, Périers, La Haye, Pirou…), plus loin sur demande.
- Horaires : lundi-vendredi 8h-12h et 13h30-18h ; samedi sur demande ; dimanche fermé.
- Contact : 06 89 37 61 51 (appel ou SMS), creancesramonageservices@bbox.fr, formulaire de devis sur le site.
- Paiement : carte bancaire, virement ou chèque.
- Ramonage : au minimum une fois tous les 12 mois (règle nationale depuis le 1er octobre 2023), un deuxième passage conseillé en cas de fort usage.
- Avant une intervention : appareil éteint et froid, accès dégagé autour de la cheminée ou du poêle.
- Mikael est accompagné par la Chambre de métiers ; un article de Tendance Ouest a raconté la création de son entreprise.

NOTE IMPORTANTE : les questions sur les tarifs, les horaires, la zone, le contact, le paiement, le certificat, la fréquence de ramonage, les poêles à granulés, le démoussage, la préparation et le devis sont déjà gérées automatiquement AVANT de t'atteindre. Si une telle question t'arrive malgré tout, utilise UNIQUEMENT les faits ci-dessus, jamais d'autres chiffres.

RÈGLE ANTI-INVENTION (priorité absolue) :
Tu ne dois JAMAIS inventer, deviner ou extrapoler une information factuelle qui n'est pas explicitement écrite dans ce prompt — ni tarif, ni délai, ni engagement, ni certification, ni référence client. Si l'information demandée n'est pas ci-dessus, dis explicitement que tu n'as pas cette information et oriente vers Mikael (06 89 37 61 51 ou creancesramonageservices@bbox.fr). Il vaut mieux répondre "je ne sais pas" que donner une information plausible mais fausse.

SÉCURITÉ : en cas de feu de cheminée ou de suspicion d'intoxication au monoxyde, dire d'appeler immédiatement le 18 ou le 112.

RÈGLES DE RÉPONSE :
- Concis : 2 à 4 phrases. Une seule question à la fois pour relancer.
- Texte simple. Tu peux mettre **un mot important en gras**.
- Termine quand c'est pertinent en orientant vers le devis gratuit (formulaire sur le site) ou le 06 89 37 61 51.
- Ne promets JAMAIS de résultat chiffré ni de délai d'intervention précis.
- Ne réponds qu'aux questions liées au ramonage, au chauffage au bois, aux prestations de Mikael et à la maison. Pour le reste, ramène gentiment la conversation sur ses services.`;

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
  }

  let messages;
  try {
    const body = JSON.parse(event.body);
    messages = body.messages;
    if (!Array.isArray(messages)) throw new Error('messages invalide');
    messages = messages.slice(-12);
  } catch (err) {
    console.error('[chat] Erreur parsing body:', err.message);
    return {
      statusCode: 400,
      headers: HEADERS,
      body: JSON.stringify({ error: 'Requête invalide' })
    };
  }

  // ── Réponses factuelles figées AVANT tout appel au modèle ──
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const kbReply = checkKB(lastUserMsg && lastUserMsg.content);
  if (kbReply) {
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ reply: kbReply })
    };
  }

  // ── Sans clé configurée (version de test) : réponse honnête, aucun appel payant ──
  if (!process.env.MISTRAL_API_KEY) {
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ reply: FALLBACK_SANS_IA })
    };
  }

  // Si Mistral refuse un modèle (quota ou capacité saturée, statut 429), on
  // retente avec un autre modèle avant d'abandonner.
  const MODELES = ['mistral-small-latest', 'open-mistral-nemo', 'ministral-8b-latest'];

  try {
    let response;
    let errText = '';
    for (const model of MODELES) {
      response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          max_tokens: 400,
          temperature: 0.3
        })
      });
      if (response.ok) break;
      errText = await response.text();
      console.error(`[chat] Mistral API erreur ${response.status} (${model}):`, errText);
      if (response.status !== 429) break;
    }

    if (!response.ok) {
      console.error('[chat] Mistral indisponible, repli vers la réponse figée');
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ reply: FALLBACK_SANS_IA })
      };
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error('[chat] Réponse Mistral inattendue:', JSON.stringify(data));
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ reply: FALLBACK_SANS_IA })
      };
    }

    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    console.error('[chat] Erreur inattendue:', error.message);
    return {
      statusCode: 200,
      headers: HEADERS,
      body: JSON.stringify({ reply: FALLBACK_SANS_IA })
    };
  }
};
