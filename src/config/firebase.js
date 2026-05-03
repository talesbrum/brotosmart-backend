// src/config/firebase.js
// Inicializa o Firebase Admin SDK para verificação de tokens no backend

const admin = require('firebase-admin');

let firebaseApp;

function initFirebase() {
  if (firebaseApp) return firebaseApp;

  // Em produção: use Application Default Credentials ou variáveis de ambiente
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin SDK inicializado');
  return firebaseApp;
}

/**
 * Verifica um Firebase ID Token e retorna o payload decodificado.
 * @param {string} idToken - Token JWT do Firebase Auth (enviado pelo app)
 * @returns {Promise<admin.auth.DecodedIdToken>}
 */
async function verifyFirebaseToken(idToken) {
  return admin.auth().verifyIdToken(idToken);
}

module.exports = { initFirebase, verifyFirebaseToken };
