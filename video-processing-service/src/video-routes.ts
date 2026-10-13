
import { Router, Response } from 'express';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { supabase } from './supabase';
import {
    AuthenticatedRequest,
    verifyFirebaseToken,
} from './middleware';

const router = Router();

const RAW_VIDEOS_BUCKET = 'raw-videos';

const ALLOWED_EXTENSIONS = new Set([
    '.mp4',
    '.mov',
    '.webm',
    '.mkv',
]);

router.post(
    '/upload-url',
    verifyFirebaseToken,
    async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        try {
            const user = req.user;

            if (!user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { fileExtension } = req.body;

            if (
                typeof fileExtension !== 'string' ||
                !ALLOWED_EXTENSIONS.has(fileExtension.toLowerCase())
            ) {
                res.status(400).json({
                    error: 'Unsupported file extension',
                    allowedExtensions: [...ALLOWED_EXTENSIONS],
                });
                return;
            }

            const extension = fileExtension.toLowerCase();

            // Generate the storage path on the server.
            const fileName =
                `${user.uid}/${Date.now()}-${randomUUID()}${extension}`;

            const { data, error } = await supabase.storage
                .from(RAW_VIDEOS_BUCKET)
                .createSignedUploadUrl(fileName, {
                    upsert: false,
                });

            if (error) {
                console.error('Signed upload URL creation failed:', error);

                res.status(500).json({
                    error: 'Could not generate upload URL',
                });
                return;
            }

            res.status(200).json({
                fileName,
                signedUrl: data.signedUrl,
                token: data.token,
                path: data.path,
            });
        } catch (error) {
            console.error('Upload URL endpoint failed:', error);

            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }
);

export default router;
