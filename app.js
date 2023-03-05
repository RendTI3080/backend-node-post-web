const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const { clearImage } = require('./util/clearImage');
const  { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolver');
const auth = require("./middleware/auth");

const app = express();

// multer 
const fileStorage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'images');
    },
    filename: function(req, file, cb){
        cb(null, new Date().toISOString().replace(/:/g, "-")+ '-' +file.originalname);
    }
})

// multer filter file type
const fileFilter = (req, file, cb) => {
    if(
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ){
        cb(null, true)
    }else{
        cb(null, false)
    }
}

// body parser 
app.use(bodyParser.json())

// multer registration
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));

// Images
app.use('/images', express.static(path.join(__dirname, 'images')));


// CORS Setup
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // setiap request akan mengirimkan method options terdahulu
    // karena graphql hanya menerima post dan get maka kita harus memberikan akses ke options
    if(req.method === 'OPTIONS'){
        return res.sendStatus(200);
    }
    next()
})

// post image
app.put("/post-image", (req, res, next) => {
    if(!req.file){
        return res.status(200).json({ message: 'No file provided'})
    }

    if(req.body.oldPath){
        clearImage(req.body.oldPath);
    }

    return res.status(201).json({ message: 'File Stored', filePath: req.file.path})
})

// garphql
app.use('/graphql', graphqlHTTP({
    schema : graphqlSchema,
    rootValue : graphqlResolver,
    graphiql: true,
    formatError(err){
        if(!err.originalError){
            return err;
        }
        const data = err.originalError.data; // data error
        const message = err.message || "An error occaured"; // message = invalid input
        const code = err.originalError.code || 500;
        return { message: message, status: code, data : data}
    }
}));

// auth 
app.use(auth);


// error handling
app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({message: message, data: data})
})

// Mongodb database
mongoose.connect()
.then(() => {
   app.listen(8080);
})
.catch(err => {
    console.log(err)
});



