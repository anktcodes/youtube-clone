
import { supabase } from "./supabase";

export type VideoStatus = "processing" | "processed" | "failed";

export interface Video {
    id?: string;
    firebase_uid?: string;
    raw_file_path?: string;
    processed_file_path?: string | null;
    status?: VideoStatus;
    title?: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Fetch a video using its raw storage path.
 */
export async function getVideo(rawFilePath: string): Promise<Video | null> {
    const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("raw_file_path", rawFilePath)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

/**
 * Atomically claim a new video for processing.
 * Returns false if this video has already been registered.
 */
export async function claimVideo(
    rawFilePath: string,
    firebaseUid: string
): Promise<boolean> {
    const { error } = await supabase
        .from("videos")
        .insert({
            raw_file_path: rawFilePath,
            firebase_uid: firebaseUid,
            status: "processing"
        });

    if (error?.code === "23505") {
        return false; // Duplicate raw_file_path
    }

    if (error) {
        throw error;
    }

    return true;
}

/**
 * Update an existing video's metadata or processing status.
 */
export async function setVideo(
    rawFilePath: string,
    video: Partial<Video>
): Promise<void> {
    const { error } = await supabase
        .from("videos")
        .update({
            ...video,
            updated_at: new Date().toISOString()
        })
        .eq("raw_file_path", rawFilePath);

    if (error) {
        throw error;
    }
}
