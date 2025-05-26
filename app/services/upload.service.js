const express = require('express');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config(process.env.CLOUDINARY_URL);


const handleUploadImage = (file, type, id, oldFileUrl = null) => { //oldFileUrl is optional, used for deleting old file if needed

    if(type == "AVATAR")
    {
        if (oldFileUrl) {
            const publicId = oldFileUrl.split('/upload/')[1]
            .split('/')
            .slice(1) // Bỏ "v1748229388"
            .join('/')
            .replace(/\.[^/.]+$/, ''); // Xóa đuôi mở rộng; // Lấy public ID từ URL
            console.log(`Deleting old file with public ID: ${publicId}`);
            cloudinary.uploader.destroy(publicId);
        }
    }
    
  return new Promise((resolve, reject) => {
    if (!file) {
      return resolve({ error: 'No file choosen!' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `${process.env.CLOUDINARY_FOLDER}/${type}/${id}`
      },
      (error, result) => {
        if (error) return resolve({ error: error.message });
        resolve({ url: result.secure_url });
      }
    );

    uploadStream.end(file.buffer);
  });
};


const handleUploadImages = (files, type, id) => {
  if (!files || files.length === 0) {
    return {error: 'No files choosen!'};
  }

  const uploadPromises = files.map(file => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({
        folder: `${process.env.CLOUDINARY_FOLDER}/${type}/${id}`, // Lưu vào folder được định nghĩa trong biến môi trường
      }, (error, result) => {
        if (error) {
          reject({error: error.message});
        } else {
          resolve(result.secure_url);
        }
      }).end(file.buffer);
    });
  });

  return Promise.all(uploadPromises)
    .then(urls => ({urls}))
    .catch(error => ({error: error.message}));
};

const handleDeleteFile = (fileUrl) => {
  if (!fileUrl) {
    return {error: 'No file choosen!'};
  }

  const publicId = fileUrl.split('/upload/')[1]
                          .split('/')
                          .slice(1) // Bỏ "v1748229388"
                          .join('/')
                          .replace(/\.[^/.]+$/, ''); // Xóa đuôi mở rộng; // Lấy public ID từ URL
  return cloudinary.uploader.destroy(publicId)
    .then(result => {
      if (result.result === 'ok') {
        return {message: 'File deleted successfully'};
      } else {
        throw new Error('Failed to delete file');
      }
    })
    .catch(error => ({error: error.message}));
};

module.exports = {
  handleUploadImage,
  handleUploadImages,
  handleDeleteFile
};