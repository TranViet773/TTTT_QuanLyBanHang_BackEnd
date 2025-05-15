// Call in installed dependencies
const express = require('express');
require('dotenv').config()
const authRoute = require('./app/routes/auth.route');

const app = express();
const port = process.env.PORT || 5000;



app.use(express.json());
app.use('/api/auth', authRoute);


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