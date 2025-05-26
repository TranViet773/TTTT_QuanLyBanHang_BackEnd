const uploadService = require('../services/upload.service');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadImgage = async (req, res) => {
  try {
    const { type, id, oldFileUrl } = req.body;

    const result = await uploadService.handleUploadImage(req.file, type, id, oldFileUrl);
    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
        data: null
      });
    }
    return res.status(200).json({ 
      success: true,
      message: "Upload image successfully",
      data: { url: result.url }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: result.error,
      data: null 
    });
  }
};

const uploadImgages = async (req, res) => {
  try {
    const { type, id } = req.body;

    const result = await uploadService.handleUploadImages(req.files, type, id);
    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
        data: null
      });
    }
    return res.status(200).json({ 
      success: true,
      message: "Upload image successfully",
      data: { urls: result.urls }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: result.error,
      data: null 
    });
  }
};

const deleteFile = async (req, res) => {
  try {
    const { fileUrl } = req.body;

    const result = await uploadService.handleDeleteFile(fileUrl);
    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
        data: null
      });
    }
    return res.status(200).json({ 
      success: true,
      message: "Delete file successfully",
      data: { message: result.message }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message,
      data: null 
    });
  }
}

module.exports = {
    uploadImgage,
    uploadImgages,
    deleteFile
}