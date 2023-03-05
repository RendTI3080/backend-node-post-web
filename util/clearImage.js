const path = require('path');
const fs = require('fs');

// clear image if user update image
const clearImage = (filePath) => {
    // up one level folder because we are in controller folder
    // and images in another folder
    filePath = path.join(__dirname, "..", filePath);
    fs.unlink(filePath, (err) => console.log(err));
};

exports.clearImage = clearImage;