const postsController = require("../controllers/postsController");
const { requireUser } = require("../middlewares/requireUser");

const router = require("express").Router();

router.post("/", requireUser, postsController.createPostController);
router.post("/like", requireUser, postsController.likeOrUnlikePostController);
router.put("/", requireUser, postsController.updatePostController);
router.delete("/", requireUser, postsController.deletePostController);

module.exports = router;
