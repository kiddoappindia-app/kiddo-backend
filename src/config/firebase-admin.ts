import admin from 'firebase-admin';
import { env } from './env.js';
import jwt from 'jsonwebtoken';

if (admin.apps.length === 0) {
  if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    });
  } else {
    admin.initializeApp({
      projectId: env.FIREBASE_PROJECT_ID,
    });
  }
}

export const firebaseAdmin = admin;
export const firebaseAuth = admin.auth();

let googlePublicKeys: Record<string, string> = {};
let keysExpiryTime = 0;

async function getGooglePublicKeys(): Promise<Record<string, string>> {
  const now = Date.now();
  if (Object.keys(googlePublicKeys).length > 0 && now < keysExpiryTime) {
    return googlePublicKeys;
  }

  const res = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  if (!res.ok) {
    throw new Error('Failed to fetch Firebase public keys');
  }

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
  
  googlePublicKeys = await res.json();
  keysExpiryTime = now + maxAge * 1000;
  return googlePublicKeys;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<any> {
  // If service account key is available, use standard Firebase SDK verification
  if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return firebaseAuth.verifyIdToken(idToken);
  }

  // Local JWT Signature verification using Google's public certificates (Zero Service Account Key required in cloud environment)
  const decodedUnverified = jwt.decode(idToken, { complete: true });
  if (!decodedUnverified || typeof decodedUnverified === 'string') {
    throw new Error('Invalid token format');
  }

  const kid = decodedUnverified.header.kid;
  if (!kid) {
    throw new Error('Token header missing "kid"');
  }

  const publicKeys = await getGooglePublicKeys();
  const publicKey = publicKeys[kid];
  if (!publicKey) {
    throw new Error('Public key not found for kid');
  }

  return new Promise((resolve, reject) => {
    jwt.verify(
      idToken,
      publicKey,
      {
        algorithms: ['RS256'],
        audience: env.FIREBASE_PROJECT_ID,
        issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      },
      (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      }
    );
  });
}

export async function setFirebaseCustomClaims(uid: string, claims: any): Promise<void> {
  if (env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    await firebaseAuth.setCustomUserClaims(uid, claims);
  } else {
    console.log(`[Firebase-Admin] Skipped setting custom claims for ${uid} (running in service-account-key-free mode)`);
  }
}
