const express = require('express');

const { body } = require('express-validator')

const router = express.Router();

const feedController = require('../controllers/feed');

const isAuth = require('../middleware/is-auth');

// router


// get posting
router.get('/posts', isAuth,  feedController.getPosts);


// post new posting
router.post('/post',  isAuth,[
    body('title').trim().isLength({ min: 7}),
    body('content').trim().isLength({ min: 5})
], feedController.createPosts);


// get data from 1 posting
router.get('/post/:postId', isAuth,feedController.getPost);

// update data from 1 posting
router.put('/post/:postId', isAuth, [
    body('title').trim().isLength({ min: 7}),
    body('content').trim().isLength({ min: 5})
], feedController.updatePost);

// delete posting from database
router.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = router;