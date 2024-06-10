const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const filename = req.params.id;
    try {
      const result = await cloudinary.api.resource(filename);
      if (result) {
        await cloudinary.uploader.destroy(filename);
      }
    } catch (error) {
      console.log(error);
    }
    return {
      folder: "whatsapp-clone",
      public_id: filename,
      allowed_formats: ["jpg", "jpeg", "png"],
    };
  },
});

module.exports = { storage };
