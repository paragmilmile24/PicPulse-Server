const router = require('express').Router();
const authRouter = require('./authRouter')
const postsRouter = require('./postsRouter')
const userRouter = require('./userRouter')

router.use('/auth',authRouter)
router.use('/posts',postsRouter)
router.use('/user',userRouter);

module.exports = router;