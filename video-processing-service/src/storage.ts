// 1. Google Cloud Storage file interactions
// 2. Local file interactions

import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';


const storage = new Storage();

const rawVideoBucketName = "ac-youtube-clone-raw-videos";
const processedVideoBucketName = "ac-youtube-clone-processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

/* Creates the local directories for raw and processed videos. */
export function setupDirectories(){
}

/**
 * @param rawVideoName - The name of the file to convert from {@link localRawVideoPath}.
 * @param processedVideoName - The name of the file to convert to {@link localProcessedVideoPath}.
 * @returns A promise that resolves when the video has been converted.
 */
export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
            .outputOptions('-vf', "scale=-1:360")
            .on("end", ()=> {
                console.log("Processing finished successfully.")
            })
            .on("error", (err) => {
                console.log(`An error occurred: ${err.message}`);
            })
            .save(`${localProcessedVideoPath}/${processedVideoName}`);
    })
}