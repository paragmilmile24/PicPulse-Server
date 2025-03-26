const Post = require("../models/Post");
const User = require("../models/User");
const { error, success } = require("../utils/responseWrapper");
const cloudinary = require("cloudinary").v2;
const { mapPostOutput } = require("../utils/Utils");

const followOrUnfollowUserController = async (req, res) => {
    try {
        const { userIdToFollow } = req.body;
        const currUserId = req._id;

        if (userIdToFollow === currUserId) {
            return res.send(error(409, "User cannot follow themselves"));
        }

        const userToFollow = await User.findById(userIdToFollow);
        const currUser = await User.findById(currUserId);

        if (!userToFollow) {
            return res.send(error(404, "user to follow not found"));
        }

        if (currUser.followings.includes(userIdToFollow)) {
            //User already follows other user
            //Action : Unfollow then

            //Removing from own following list
            const followingIndex = currUser.followings.indexOf(userIdToFollow);
            currUser.followings.splice(followingIndex, 1);

            //Removing from others follow list
            const followerIndex = userToFollow.followers.indexOf(currUserId);
            userToFollow.followers.splice(followerIndex, 1);

            // return res.send(success(200, "User Unfollowed"));
        } else {
            //User do not follow other user
            //Action : Follow

            //Adding to own followings list
            currUser.followings.push(userIdToFollow);

            //Adding own to other's followers list
            userToFollow.followers.push(currUserId);
        }

        await currUser.save();
        await userToFollow.save();
        return res.send(success(200, { user: userToFollow }));
    } catch (e) {
        res.send(error(500, e.message));
    }
};

const getFeedData = async (req, res) => {
    try {
        const currUserId = req._id;
        const currUser = await User.findById(currUserId).populate("followings");

        //Getting posts whose owner is in followings of User
        const fullPosts = await Post.find({
            owner: {
                $in: currUser.followings,
            },
        }).populate("owner");

        const posts = fullPosts
            .map((item) => mapPostOutput(item, req._id))
            .reverse();

        const followingsIds = currUser.followings.map((fw) => fw._id);
        followingsIds.push(req._id);

        const suggestions = await User.find({
            _id: {
                $nin: followingsIds,
            },
        });

        //posts will overwrite posts of ...currUser._doc
        return res.send(success(200, { ...currUser._doc, suggestions, posts }));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

const getMyPosts = async (req, res) => {
    try {
        const userId = req._id;

        const allUserPosts = await Post.find({
            owner: userId,
        }).populate("likes");
        //populate will give full details of users in likes array instead of just user id

        return res.send(success(200, { allUserPosts }));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

const getUserPosts = async (req, res) => {
    try {
        const userId = req.body.userId;

        if (!userId) {
            return res.send(error(400, "userId is required"));
        }

        const allUserPosts = await Post.find({
            owner: userId,
        }).populate("likes");
        //populate will give full details of users in likes array instead of just user id

        return res.send(success(200, { allUserPosts }));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

const deleteMyProfile = async (req, res) => {
    try {
        const currUserId = req._id;
        const currUser = await User.findById(currUserId);

        console.log("Current User", currUser);

        //Delete all posts
        await Post.deleteMany({
            owner: currUserId,
        });

        //Remove from follower's following list
        // currUser.followers.forEach(async(followerId) =>{
        //     const follower = await User.findById(followerId);

        //     const index = follower.followings.indexOf(currUserId);
        //     follower.followings.splice(index,1);
        //     await follower.save();
        // })

        //DON'T USE ABOVE METHOD BECAUSE ForEach is syncronous .
        // EVEN if we use async,forEach loop is synchronous, but the await inside the callback makes the asynchronous operation not block the loop.

        //Remove from follower's following list
        for (const followerId of currUser.followers) {
            const follower = await User.findById(followerId);

            const index = follower.followings.indexOf(currUserId);
            follower.followings.splice(index, 1);
            await follower.save();
        }

        //Remove user from following's followers
        for (const followingId of currUser.followings) {
            const following = await User.findById(followingId);

            const index = following.followers.indexOf(currUserId);
            following.followers.splice(index, 1);
            await following.save();
        }

        //Remove user from all posts likes
        // Getting all posts and removing likes from each post
        //Not best approach. To do in future scope => Main likes table (auto_id,post_id,user_id) =>get all posts liked by user
        const posts = await Post.find();
        for (const post of posts) {
            const index = await post.likes.indexOf(currUserId);
            post.likes.splice(index, 1);
            await post.save();
        }

        //Delete User
        await User.deleteOne({ _id: currUserId });

        // Delete cookie
        res.clearCookie("jwt", {
            httpOnly: true,
            secure: true,
        });

        return res.send(success(200, "User deleted"));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

const getMyInfo = async (req, res) => {
    try {
        const user = await User.findById(req._id);
        return res.send(success(200, { user }));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { name, bio, userImg } = req.body;
        const user = await User.findById(req._id);

        if (name) {
            user.name = name;
        }
        if (bio) {
            user.bio = bio;
        }
        if (userImg) {
            const cloudImg = await cloudinary.uploader.upload(userImg, {
                folder: "profileImg",
            });
            user.avatar = {
                url: cloudImg.secure_url,
                publicId: cloudImg.public_id,
            };
        }

        await user.save();
        return res.send(success(200, { user }));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};

const getUserProfile = async (req, res) => {
    try {
        const userId = req.body.userId;

        //Get all posts of a user
        const user = await User.findById(userId).populate({
            path: "posts",
            populate: {
                path: "owner",
            },
        });

        // console.log("User Details : ", user);
        const fullPosts = user.posts;
        const posts = fullPosts
            .map((item) => mapPostOutput(item, req._id))
            .reverse();

        //doc is used to get only relevant info
        return res.send(success(200, { ...user._doc, posts }));
    } catch (e) {
        return res.send(error(500, e.message));
    }
};
module.exports = {
    followOrUnfollowUserController,
    getFeedData,
    getMyPosts,
    getUserPosts,
    deleteMyProfile,
    getMyInfo,
    updateUserProfile,
    getUserProfile,
};
