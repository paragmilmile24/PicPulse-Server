const express = require("express");
const dotenv = require("dotenv");
const dbConnect = require("./dbConnect");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

dotenv.config("./.env");

const mainRouter = require("./routes/index");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const app = express();
// app.use(express.json());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));

app.use(cookieParser());
app.use(
    cors({
        credentials: true,
        origin: process.env.CLIENT_URL,
    })
);

app.use("/api", mainRouter);

app.get("/", (req, res) => {
    res.send("Welcome to PicPulse Server");
});

PORT = process.env.PORT || 4001;
CLIENT_URL = process.env.CLIENT_URL;
dbConnect();

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
    console.log(`Allowing requests from ${CLIENT_URL}`)
});
