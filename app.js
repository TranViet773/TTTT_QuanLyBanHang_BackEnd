// Call in installed dependencies
const express = require('express');
require('dotenv').config()

const cookieParser = require('cookie-parser');
const cors = require('cors');
const session = require('express-session');


const app = express();
const port = process.env.PORT || 5000;
const authRoute = require('./app/routes/auth.route');
const userRoute = require('./app/routes/user.route');
const accountDeviceRoute = require('./app/routes/accountDevice.route')
const supplierRoute = require('./app/routes/supplier.route');
const itemTypeRoute = require('./app/routes/itemType.route');
const itemRoute = require('./app/routes/item.route');
const unitItemRoute = require('./app/routes/unitItem.route');
const unitInvoiceRoute = require('./app/routes/unitInvoice.route');
const uploadRoute = require('./app/routes/upload.route');
const accountRoute = require('./app/routes/account.route');
const purchaseInvoiceRoute = require('./app/routes/purchaseInvoice.route');
const salesInvoiceRoute = require('./app/routes/salesInvoice.route');
const voucherRoute = require("./app/routes/voucher.route");
const cartRoute = require('./app/routes/cart.route');


app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); // Xử lý x-www-form-urlencoded nếu có

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, // Không lưu session nếu không được sửa đổi
  saveUninitialized: false,  // Lưu session ngay cả khi chưa có dữ liệu
  cookie: { 
    secure: false, // Để true nếu dùng HTTPS
    maxAge: 30 * 24 * 60 * 60 * 1000
   } 
}))

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/account-devices', accountDeviceRoute)
app.use('/api/supplier', supplierRoute);
app.use('/api/item-types', itemTypeRoute);
app.use('/api/items', itemRoute);
app.use('/api/unit-items', unitItemRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/purchase-invoices', purchaseInvoiceRoute);
app.use('/api/sales-invoices', salesInvoiceRoute)
app.use('/api/unit-invoices', unitInvoiceRoute);
app.use('/api/account', accountRoute);
app.use('/api/vouchers', voucherRoute);
app.use('/api/carts', cartRoute);

app.get('/', (request, respond) => {
  respond.status(200).json({
    message: 'Welcome to Project Support',
  });
});
app.listen(port, (request, respond) => {
  console.log(`Our server is live on ${port}. Yay!`);
});

const connectDB = require('./app/configs/db.config');
// const session = require('express-session');
connectDB()