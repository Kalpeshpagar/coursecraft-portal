const cloudinary = require("cloudinary").v2;
require("dotenv").config();

exports.uploadImageTocloudinary = async (File, folder, height, quality)=>{
    const options = {
        folder,
        resource_type:"auto",
    }
    if (height) {
        options.height = height;
    }
    if (quality) {
        options.quality = quality;
    }
    return await cloudinary.uploader.upload(File.tempFilePath, options);
}