
// import thư viên MongoDB
const mongoose = require('mongoose')

const connectDB = async () => {
    try {
        
        // Kết nối tới MongoDB
        await mongoose.connect(process.env.MONGO_URI)

        // Thành công
        console.log('MongoDB connected')
    }

    catch (err) {
        console.error(err.message)
        process.exit(1  )
    }
}

module.exports = connectDB