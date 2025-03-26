const { error, success } = require("../utils/responseWrapper");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config("../.env");

const validatePassword = (password) => {
    const minLength = 8; // Minimum length requirement
    const maxLength = 20; // Optional maximum length requirement

    // Check password length
    if (password.length < minLength || password.length > maxLength) {
        return "Password must be between 8 and 20 characters.";
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }

    // Check for at least one digit
    if (!/\d/.test(password)) {
        return "Password must contain at least one number.";
    }

    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return "Password must contain at least one special character.";
    }

    // Password meets all conditions
    return "Valid";
};

const signupController = async (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;

    if (!name || !email || !password) {
        return res.send(error(400, "Required fields are not filled"));
    }

    const passwordCheck = validatePassword(password);
    if (passwordCheck !== "Valid") {
        return res.send(error(400, passwordCheck));
    }
    
    const user = await User.findOne({ email });

    if (user) {
        return res.send(error(409, "User is already registered"));
    }

    try {
        const newUser = await User.create({
            name,
            email,
            password,
        });

        // const accessToken = generateAccessToken({ _id: newUser._id });
        // const refreshToken = generateRefreshToken({ _id: newUser._id });

        // res.cookie("jwt", refreshToken, {
        //     httpOnly: true,
        //     secure: true,
        // });

        return res.send(success(201, "New User Created"));
    } catch (e) {
        res.send(error(500, e.message));
    }
};

const loginController = async (req, res, next) => {
    console.log("In login controller");

    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
        return res.send(error(400, "All fields are required"));
    }

    const user = await User.findOne({ email }).select("+password"); //.select('+password') so that password is also returned

    if (!user) {
        return res.send(error(404, "User is not registered"));
    }

    if (password != user.password) {
        return res.send(error(403, "Incorrect password"));
    }
    console.log("User Id : ", user._id);
    const accessToken = generateAccessToken({ _id: user._id });
    const refreshToken = generateRefreshToken({ _id: user._id });

    res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
    });

    return res.send(success(200, { accessToken }));
};

const refreshController = async (req, res) => {
    // const {refreshToken} = req.body;
    const cookies = req.cookies;

    console.log("Cookies : ", cookies);

    if (!cookies) {
        return res.send(error(401, "Refresh Token in cookie is required"));
    }

    const refreshToken = cookies.jwt;

    if (!refreshToken) {
        return res.send(error(401, "Refresh Token is required"));
    }

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_PRIVATE_KEY
        );
        const _id = decoded._id;

        console.log("ID : ", _id);

        const accessToken = generateAccessToken({ _id });
        return res.send(success(200, { accessToken }));
    } catch (e) {
        return res.send(error(401, "Invalid refresh token"));
    }
};

const logoutController = async (req, res) => {
    try {
        // Clear cookie on server side
        res.clearCookie("jwt", {
            httpOnly: true,
            secure: true,
        });

        return res.send(success(200, "User logged out successfully"));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

const generateAccessToken = (data) => {
    const accessToken = jwt.sign(data, process.env.ACCESS_TOKEN_PRIVATE_KEY, {
        expiresIn: "1d",
    });
    console.log("Private Key : ", process.env.ACCESS_TOKEN_PRIVATE_KEY);
    console.log("Access Token : ", accessToken);
    return accessToken;
};

const generateRefreshToken = (data) => {
    const refreshToken = jwt.sign(data, process.env.REFRESH_TOKEN_PRIVATE_KEY, {
        expiresIn: "1y",
    });
    console.log("Private Key : ", process.env.REFRESH_TOKEN_PRIVATE_KEY);
    console.log("Refresh Token : ", refreshToken);
    return refreshToken;
};

module.exports = {
    signupController,
    loginController,
    refreshController,
    logoutController,
};
