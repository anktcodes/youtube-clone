import cors from 'cors';
import userRoutes from './user-routes';
import express from "express";
import ffmpeg from "fluent-ffmpeg";
import { convertVideo,  deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo } from "./storage";

import videoRoutes from './video-routes';
import 'dotenv/config';
// for fixing the path issue with processed videos from raw videos
import path from "path";

import { claimVideo, setVideo } from "./videos";

ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

setupDirectories();

const app = express();
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://ideal-engine-699wq645wgpvf4r5g-3000.app.github.dev",
        "https://youtube-clone-frontend-xig4.onrender.com",
        "https://youtube-clone-xi-six.vercel.app"
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use("/api/users", userRoutes);
app.use('/api/videos', videoRoutes);
app.get("/", (req, res) => {
    res.send("Video Processing Service is running successfully!");
});

app.post("/process-video", async (req, res) => {
    //Get the filename from the request
    const { fileName } = req.body;

    if (!fileName || typeof fileName !== "string") {
        return res.status(400).send("Bad Request: missing filename.");
    }

    const inputFileName = fileName;
    const outputFileName = path.join(
        path.dirname(inputFileName),
        `processed-${path.basename(inputFileName)}`
    );

    // Extract Firebase UID from the first folder in the storage path
    const firebaseUid = inputFileName.split("/")[0];

    if (!inputFileName.includes("/") || !firebaseUid) {
        return res.status(400).send("Invalid video file path.");
    }

    let videoClaimed = false;
    

    //Download the raw video from Supabase storage
    // await downloadRawVideo(inputFileName);

    try{
        //0. Claim the video to prevent duplicate processsing
        const isNewVideo = await claimVideo(inputFileName, firebaseUid);
        if (!isNewVideo) {
            console.log(`Video already registered: ${inputFileName}`);
            return res.status(200).send("Video already processing or processed.");
        }


        //1. Download the raw video from Supabase storage
        console.log(`Starting download: ${inputFileName}`);
        await downloadRawVideo(inputFileName);
        console.log(`Download complete: ${inputFileName}`);

        //2. Convert the video to 360p
        console.log(`Starting conversion: ${inputFileName}`);
        await convertVideo(inputFileName, outputFileName);
        console.log(`Conversion complete: ${outputFileName}`);

        //3. Upload processed video
        console.log(`Starting Upload: ${outputFileName}`);
        await uploadProcessedVideo(outputFileName);
        console.log(`Upload complete: ${outputFileName}`);

        //4. Update the video record in Supabase with the processed video path and status
        await setVideo(inputFileName, {
            status:"processed",
            processed_file_path: outputFileName
        });
        console.log(`Video marked as processed: ${inputFileName}`);
        

        //5. Delete raw and processed videos from local storage
        try {
            await Promise.all([
                deleteRawVideo(inputFileName),
                deleteProcessedVideo(outputFileName)
            ]);
        } catch (cleanupError) {
            console.error("Local file cleanup failed:", cleanupError);
        }

        return res.status(200).send("Processing finished successfully.");

    } catch (err) {
        console.error("Video processing failed:", err);

        // Mark video as failed in Supabase
        if (videoClaimed) {
            try {
                await setVideo(inputFileName, { status: "failed" });
            } catch (dbError) {
                console.error("Failed to update video status:", dbError);
            }
        }

        // Clean up local temporary files
        try {
            await Promise.all([
                deleteRawVideo(inputFileName),
                deleteProcessedVideo(outputFileName)
            ]);
        } catch (cleanupError) {
            console.error("Local file cleanup failed:", cleanupError);
        }

        return res.status(500).send("Internal Server Error: video processing failed.");
    }
});
const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(
        `Video Processing Service is running at http://localhost:${port}`
    );

});

