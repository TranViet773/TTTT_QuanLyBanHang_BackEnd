const express = require("express");
const route = express.Router();
const upload = require("../middlewares/upload.middleware");
const uploadController = require("../controllers/uploadController");

route.post("/image", upload.single("file"), uploadController.uploadImage);
route.post("/images", upload.array("files"), uploadController.uploadImages);
route.post("/delete", uploadController.deleteFile);
module.exports = route;
