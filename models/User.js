const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
    {
        email: {
            type: String,
            require: true,
        },
        password: {
            type: String,
            require: true,
            select: false, //DOes not send when useing findBy
        },
        name: {
            type: String,
            required: true,
        },
        bio: {
            type: String,
        },
        avatar: {
            publicId: String,
            url: String,
        },
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        followings: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
        ],
        posts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "post",
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("user", userSchema);
