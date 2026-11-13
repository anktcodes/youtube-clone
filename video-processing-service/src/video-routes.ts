
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


router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select(`
                id,
                title,
                description,
                processed_file_path,
                created_at
                `)
            .eq('status', 'processed')
            .not('processed_file_path', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            throw error;
        }

        return res.status(200).json({
            videos:data
        });

    } catch (error){
        console.error('Error fetching videos:', error);
        return res.status(500).json({
            error: 'Error fetching videos'
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const {data:video, error } = await supabase
        .from('videos')
        .select(`
            id,
            title,
            description,
            processed_file_path,
            created_at
        `)
        .eq('id', id)
        .eq('status', 'processed')
        .not('processed_file_path', 'is', null)
        .single();

    if (error || !video) {
        return res.status(404).json({
            error: `Video not found`
        });
    }
    const {data} = supabase.storage
        .from('processed-videos')
        .getPublicUrl(video.processed_file_path!);

    return res.status(200).json({
        video: {
            ...video,
            video_url: data.publicUrl
        }
    });

    } catch (error) {
        console.error('Error fetching video:', error);

        return res.status(500).json({
            error: 'Error fetching video'
        });
    }
});

export default router;