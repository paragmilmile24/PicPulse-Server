const {
    loginController,
    signupController,
    refreshController,
    logoutController,
} = require("../controllers/authController");
const router = require("express").Router();
const requireUser = require("../middlewares/requireUser");

router.post("/signup", signupController);
router.post("/login",loginController);
router.post("/logout", requireUser.requireUser, logoutController);
router.get("/refresh", refreshController);

module.exports = router;
