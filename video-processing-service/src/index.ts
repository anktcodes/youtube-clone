import express from "express";
import ffmpeg from "fluent-ffmpeg";
import { convertVideo,  deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo } from "./storage";

ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

setupDirectories();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Video Processing Service is running successfully!");
});

app.post("/process-video", async (req, res) => {
    //Get the filename from the request
    const { fileName } = req.body;

    if (!fileName) {
        return res.status(400).send("Bad Request: missing filename.");
    }

    const inputFileName = fileName;
    const outputFileName = `processed-${inputFileName}`;

    //Download the raw video from Supabase storage
    // await downloadRawVideo(inputFileName);

    try{
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

        //4. Delete raw and processed videos from local storage
        console.log(`Starting deletion of local files: ${inputFileName}, ${outputFileName}`);
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);
        console.log(`Deletion complete: ${inputFileName}, ${outputFileName}`);

        return res.status(200).send( "Processing finished successfully.");
    } catch (err){
        console.error("video processing failed:", err);
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);

        return res.status(500).send('Internal Server Error: video processing failed.');
    }
});

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(
        `Video Processing Service is running at http://localhost:${port}`
    );

});

