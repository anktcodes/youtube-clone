import express from "express";
import ffmpeg from "fluent-ffmpeg";
ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

const app = express();
app.use(express.json());

// app.get("/", (req, res) => {
//     res.send("Hello World");
// });

app.post("/process-video", (req, res) => {
    // yet to be filled
});

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(
        `Video Processing Service is running at http://localhost:${port}`
    );

});

