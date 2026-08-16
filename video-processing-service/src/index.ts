import express from "express";
import ffmpeg from "fluent-ffmpeg";


const app = express();
const port = 3000;

// app.get("/", (req, res) => {
//     res.send("Hello World");
// });

app.post("/process-video", (req, res) => {
    const inputVideoPath = req.body.inputVideoPath;
    const outputVideoPath = req.body.outputVideoPath;

    if (!inputVideoPath || !outputVideoPath) {
        res.status(400).send("Bad Request: Missing file path.")
    }
});

app.listen(port, () => {
    console.log(
        `Video Processing Service is running at http://localhost:${port}`
    );

});

