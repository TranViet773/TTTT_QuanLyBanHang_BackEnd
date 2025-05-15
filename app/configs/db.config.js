
// import thư viên MongoDB
const mongoose = require('mongoose')
const {
    DB_USER,
    DB_HOST,
    DB_PASS,
    DB_PORT,
    DB_NAME
} = process.env;
const db_connection_string = `mongodb://${DB_USER}:${encodeURIComponent(DB_PASS)}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const connectDB = async () => {
    try {
        // Kết nối tới MongoDB
        await mongoose.connect(db_connection_string, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        // Thành công
        console.log('MongoDB connected')
    }

    catch (err) {
        console.error(err.message)
        process.exit(1  )
    }
}

module.exports = connectDB