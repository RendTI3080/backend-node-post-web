const { validationResult } = require("express-validator");
const Post = require("../models/post");
const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const io = require("../socket");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;

  try{
    const totalItems = await Post.find().populate('creator').countDocuments();
    const posts = await Post.find().populate('creator').sort({createdAt: -1}).skip((currentPage - 1) * perPage).limit(perPage);

    res.status(200).json({
      post: posts,
      totalItems: totalItems
    })
  } catch (err){
    if(!err.statusCode){
      err.statudCode = 500
    }
    next(err);
  }
  
};

exports.createPosts = async(req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    throw error;
  }

  if (!req.file) {
    const error = new Error("No image provided");
    error.statusCode = 422;
    throw error;
  }

  const imageUrl = req.file.path.replace(/\\/g, "/");
  const title = req.body.title;
  const content = req.body.content;

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    // use req.userId that we save from is-auth.js
    creator: req.userId,
  });

  try{
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    
    // Socket io
    // create action
    io.getIo().emit('posts', { action: 'create', post: {...post._doc, creator: {_id: req.userId, name: user.name}}});

    res.status(201).json({
      message: "Created post success",
      post: post,
      creator : {
        _id: user._id,
        name: user.name
      }
    });
  } catch (err){
    if(!err.statusCode){
      err.statusCode = 500;
    }

    next(err);
  }
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({
        message: "Post fetched",
        post: post,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    throw error;
  }

  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path;
  }

  // if image is empty we send error message
  if (!imageUrl) {
    const error = new Error("No File Picked");
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
    .populate('creator')
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post");
        error.statusCode = 404;
        throw error;
      }

      if(post.creator._id.toString() !== req.userId){
        const error = new Error('Not authorized');
        error.statusCode = 403;
        throw error;
      }

      // clear image
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }

      // change data dan save to database
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      return post.save();
    })
    .then((result) => {
      // Socket io
      // update data
      io.getIo().emit('posts', {
        action: 'update',
        post: result
      })
      res.status(200).json({ message: "updated success", post: result });
    })
    .catch((err) => {
      if (!err.statudCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};


exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
  .then(post => {
    // check login user
    if(!post){
      const error = new Error('Could not find post');
      error.statusCode = 404;
      throw error;
    }


    // check authorized user
    if(post.creator.toString() !== req.userId){
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    }


    // clear image
    clearImage(post.imageUrl);
    return Post.findByIdAndRemove(postId);
  })
  .then(data => {
    return User.findById(req.userId);
  })
  .then(user => {
    user.posts.pull(postId);
    return user.save();
  })
  .then(result => {

    // socket kode
    // delete 
    io.getIo().emit('posts', { action: 'delete', post: postId });
    res.status(200).json({message: "Deleted post"})
  })
  .catch(err => {
    if (!err.statudCode) {
      err.statusCode = 500;
    }
    next(err);
  })
}

// clear image if user update image
const clearImage = (filePath) => {
  // up one level folder because we are in controller folder
  // and images in another folder
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};
