// Call in installed dependencies
const express = require('express');
require('dotenv').config()

const cookieParser = require('cookie-parser');
const cors = require('cors');



const app = express();
const port = process.env.PORT || 5000;
const authRoute = require('./app/routes/auth.route');
const userRoute = require('./app/routes/user.route');
const supplierRoute = require('./app/routes/supplier.route');
const itemTypeRoute = require('./app/routes/itemType.route');
const itemRoute = require('./app/routes/item.route');
const unitItemRoute = require('./app/routes/unitItem.route');
const uploadRoute = require('./app/routes/upload.route');


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // Xử lý x-www-form-urlencoded nếu có

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/supplier', supplierRoute);
app.use('/api/item-types', itemTypeRoute);
app.use('/api/items', itemRoute);
app.use('/api/unit-items', unitItemRoute);
app.use('/api/upload', uploadRoute);

app.get('/', (request, respond) => {
  respond.status(200).json({
    message: 'Welcome to Project Support',
  });
});
app.listen(port, (request, respond) => {
  console.log(`Our server is live on ${port}. Yay!`);
});

const connectDB = require('./app/configs/db.config')
connectDB()