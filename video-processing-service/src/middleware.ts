import { Request, Response, NextFunction } from 'express';
import { adminAuth } from './firebase-admin';

export interface AuthenticatedRequest extends Request {
    user?: {
            uid: string;
                    email?: string;
                            name?: string;
                                    picture?: string;
                                        };
                                        }

                                        export async function verifyFirebaseToken(
                                            req: AuthenticatedRequest,
                                                res: Response,
                                                    next: NextFunction
                                                    ): Promise<void> {
                                                        try {
                                                                const authHeader = req.headers.authorization;

                                                                        if (!authHeader?.startsWith('Bearer ')) {
                                                                                    res.status(401).json({
                                                                                                    error: 'Missing or invalid authorization token',
                                                                                                                });
                                                                                                                            return;
                                                                                                                                    }

                                                                                                                                            const idToken = authHeader.split(' ')[1];
                                                                                                                                                    const decodedToken = await adminAuth.verifyIdToken(idToken);

                                                                                                                                                            req.user = {
                                                                                                                                                                        uid: decodedToken.uid,
                                                                                                                                                                                    email: decodedToken.email,
                                                                                                                                                                                                name: decodedToken.name,
                                                                                                                                                                                                            picture: decodedToken.picture,
                                                                                                                                                                                                                    };

                                                                                                                                                                                                                            next();
                                                                                                                                                                                                                                } catch (error) {
                                                                                                                                                                                                                                        console.error('Firebase token verification failed:', error);

                                                                                                                                                                                                                                                res.status(401).json({
                                                                                                                                                                                                                                                            error: 'Unauthorized: invalid or expired token',
                                                                                                                                                                                                                                                                    });
                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                        }