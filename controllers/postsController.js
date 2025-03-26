const { success, error } = require("../utils/responseWrapper");
const User = require("../models/User");
const Post = require("../models/Post");
const { mapPostOutput } = require("../utils/Utils");
const cloudinary = require("cloudinary").v2;

const createPostController = async (req, res) => {
    console.log("IN createPostController");
    try {
        const { caption, postImg } = req.body;
        const owner = req._id;

        if (!caption || !postImg) {
            return res.send(error(400, "Caption & image are required"));
        }

        const cloudImg = await cloudinary.uploader.upload(postImg, {
            folder: "postImg",
        });

        const user = await User.findById({ _id: owner });

        const post = await Post.create({
            owner,
            caption,
            image: {
                publicId: cloudImg.publicId,
                url: cloudImg.url,
            },
        });

        user.posts.push(post._id);
        await user.save();

        return res.send(success(201, post));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

const likeOrUnlikePostController = async (req, res) => {
    try {
        const { postId } = req.body;
        const curUserId = req._id;

        const post = await Post.findById(postId).populate('owner');

        if (!post) {
            return res.send(error(500, "Post not found"));
        }

        if (post.likes.includes(curUserId)) {
            const index = post.likes.indexOf(curUserId);
            post.likes.splice(index, 1);
        } else {
            post.likes.push(curUserId);
        }

        await post.save();

        return res.send(success(200, {post : mapPostOutput(post,req._id)}));
    } catch (e) {
        res.send(error(500, e.message));
    }
};

const updatePostController = async (req, res) => {
    try {
        const { postId, caption } = req.body;
        const currUserId = req._id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.send(error(400, "Post Not found"));
        }

        //Check if post is of currUser or not
        if (post.owner.toString() !== currUserId) {
            return res.send(error(403, "Only owner can update the post"));
        }

        if (caption) {
            post.caption = caption;
        }

        await post.save();

        return res.send(success(200, { post }));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

const deletePostController = async (req, res) => {
    try {
        const { postId } = req.body;
        const currUserId = req._id;

        const post = await Post.findById(postId);

        if (!post) {
            return res.send(error(400, "Post Not found"));
        }

        //Check if post is of currUser or not
        if (post.owner.toString() !== currUserId) {
            return res.send(error(403, "Only owner can delete the post"));
        }

        //Delete from posts_array of user
        const currUser = await User.findById(currUserId);
        const index = currUser.posts.indexOf(postId);
        currUser.posts.splice(index, 1);

        await currUser.save();
        await post.remove();

        return res.send(success(200, "Post deleted successfully"));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

module.exports = {
    createPostController,
    likeOrUnlikePostController,
    updatePostController,
    deletePostController,
};
