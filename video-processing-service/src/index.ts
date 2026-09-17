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
    await downloadRawVideo(inputFileName);

    //convert the video to 360p
    try{
        await convertVideo(inputFileName, outputFileName);
    } catch (err){
        await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
        ]);

            
        console.error(err);
        return res.status(500).send('Internal Server Error: video processing failed.');
    }

    //Upload the processed video to supabase storage
    await uploadProcessedVideo(outputFileName);
    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ]);

    return res.status(200).send('Processing finished successfully.');
});

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(
        `Video Processing Service is running at http://localhost:${port}`
    );

});

