const User = require("../models/User");
const { error, success } = require("../utils/responseWrapper");
const jwt = require("jsonwebtoken");

const requireUser = async (req, res, next) => {
    console.log("In require User");
    if (
        !req.headers ||
        !req.headers.authorization ||
        !req.headers.authorization.startsWith("Bearer")
    ) {
        console.log("Headers does not contain Authorization");
        return res.send(error(401, "Authorization token is required"));
    }

    console.log("Authorization Header : ", req.headers.authorization);
    const accessToken = req.headers.authorization.split(" ")[1];

    try {
        console.log("Access Token : ", accessToken);
        const decoded = jwt.verify(
            accessToken,
            process.env.ACCESS_TOKEN_PRIVATE_KEY
        );
        req._id = decoded._id;
        console.log("Successfully decoded", decoded);

        const user = await User.findById({ _id: req._id });

        if (!user) {
            return res.send(error(404, "User not found"));
        }

        // console.log("In req user User : ", user);
        next();
    } catch (e) {
        ``;
        console.log("Error in require user : ", e);
        return res.send(error(401, "AccessToken is not correct"));
    }
};

module.exports = { requireUser };
