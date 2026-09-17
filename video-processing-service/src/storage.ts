// 1. Google Cloud Storage file interactions --> Now using Supabase instead
// 2. Local file interactions

// import { Storage } from '@google-cloud/storage'; -- Now using supabase instead
import { createClient } from '@supabase/supabase-js';

import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';


// const storage = new Storage(); -- Now using Supabase instead
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);


const rawVideoBucketName = "raw-videos";
const processedVideoBucketName = "processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

/* Creates the local directories for raw and processed videos. */
export function setupDirectories(){
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}.
 * @returns A promise that resolves when the video has been converted.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
            .outputOptions('-vf', 'scale=-1:360')
            .on('end', () => {
                console.log('Processing finished successfully.');
                resolve(null);
            })
            .on('error', (err) => {
                console.log(`An error occurred: ${err.message}`);
                reject(err);
            })
            .save(`${localProcessedVideoPath}/${processedVideoName}`);
    });
}



// download raw video function write jsdocs here
export async function downloadRawVideo(fileName: string) {
    const { data, error } = await supabase.storage
        .from(rawVideoBucketName)
        .download(fileName);
        
    if (error) {
        console.error(`Error downloading file ${fileName}:`, error);
        throw error;
    }

    const buffer = Buffer.from(await data.arrayBuffer());

    fs.writeFileSync(`${localRawVideoPath}/${fileName}`, buffer);

    console.log(
        `${fileName} downloaded from Supabase to ${localRawVideoPath}/${fileName}`
    );
}


export async function uploadProcessedVideo(fileName: string) {
    const filePath = `${localProcessedVideoPath}/${fileName}`;
    
    console.log(`Reading processed video from ${filePath} for upload to Supabase.`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Processed video does not exist: ${filePath}`);
    }
    
    const fileBuffer = fs.readFileSync(filePath);

    console.log(`Uploading ${fileName} to Supabase (${fileBuffer.length} bytes).`);

    const { data, error } = await supabase.storage
        .from(processedVideoBucketName)
        .upload(fileName, fileBuffer, {
            upsert: true,
            contentType: 'video/mp4'
        });

    if (error) {
        console.error(`Supabase upload error:`, error);
        throw error;
    }

    console.log(
        `${fileName} uploaded to Supabase processed-videos.`
    );
    console.log(`Upload response:`, data);
}


function deleteFile(filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) =>{
                if (err) {
                    console.log(`Failed to delete file at ${filePath}`, err);
                    reject(err);
                } else {
                    console.log(`File deleted at ${filePath}`, err);
                    resolve();
                }
            })
        } else {
            console.log(`File not found at ${filePath}, skipping the delete.`);
            resolve();
        }
    })
}


export function deleteRawVideo(fileName: string){
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

export function deleteProcessedVideo(fileName: string){
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

//ensure a directory exists, if not then creating one
function ensureDirectoryExistence(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, {recursive: true}); // recursive: true enables creating nested directory
        console.log(`Directory created at ${dirPath}`);
    }
}