import express from "express";
import ffmpeg from "fluent-ffmpeg";
import { convertVideo,  deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setupDirectories, uploadProcessedVideo } from "./storage";

ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

setupDirectories();

const app = express();
app.use(express.json());

// app.get("/", (req, res) => {
//     res.send("Hello World");
// });

app.post("/process-video", async (req, res) => {
    //Get the bucket and filename from the Cloud Pub/Sub message
    let data;
    try {
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error('Invalid message payload received.');
        }

    } catch (error) {
        console.error(error);
        return res.status(400).send('Bad Request: missing filename.');
    }

    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;

    //Download the raw video from Cloud storage
    await downloadRawVideo(inputFileName);

    //convert the video to 360p
    try{
        convertVideo(inputFileName, outputFileName);
    } catch (err){
        await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
        ]);

            
        console.error(err);
        return res.status(500).send('Internal Server Error: video processing failed.');
    }

    //Upload the processed video to cloud storage
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

