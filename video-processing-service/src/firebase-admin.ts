import 'dotenv/config';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin environment variables');
}

const firebaseAdminApp =
    getApps().find((app) => app.name === 'backend-admin') ??
    initializeApp(
        {
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        },
        'backend-admin'
    );

export const adminAuth = getAuth(firebaseAdminApp);