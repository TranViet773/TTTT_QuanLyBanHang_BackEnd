const express = require('express');
const route = express.Router();
const upload = require('../middlewares/upload.middleware');
const uploadController = require('../controllers/uploadController');

route.post('/image', upload.single('file'), uploadController.uploadImgage);
route.post('/images', upload.array('files'), uploadController.uploadImgages);
route.post('/delete', uploadController.deleteFile);
module.exports = route;