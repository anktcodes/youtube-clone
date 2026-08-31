import express from "express";
import ffmpeg from "fluent-ffmpeg";


const app = express();
app.use(express.json());

// app.get("/", (req, res) => {
//     res.send("Hello World");
// });

app.post("/process-video", (req, res) => {
    const inputVideoPath = req.body.inputVideoPath;
    const outputVideoPath = req.body.outputVideoPath;

    if (!inputVideoPath || !outputVideoPath) {
        res.status(400).send("Bad Request: Missing file path.")
    }
    ffmpeg(inputVideoPath)
        .outputOptions('-vf', "scale=-1:360")
        .on("end", ()=> {
            res.status(200).send("Video processing started.")
        })
        .on("error", (err) => {
            console.log(`An error occurred: ${err.message}`);
            res.status(500).send(`Internal Server Error: ${err.message}`);
        })
        .save(outputVideoPath);
});

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(
        `Video Processing Service is running at http://localhost:${port}`
    );

});

