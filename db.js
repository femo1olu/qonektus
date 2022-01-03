const mongoose = require("mongoose");
let DB_URL = process.env.DB_URL;// here we are using the MongoDB Url we defined in our ENV file

//mongoose.connect('mongodb://localhost:27017/qonektusdb'); ..,could not use DB_URL mongoose.connect must have a string

mongoose
.connect('mongodb://localhost:27017/qonektusdb',
      { useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
        autoIndex: true,
      });

var db = mongoose.connection;

db.on('connected', () => {
  console.log('Result: Mongoose connected to MongoDB');
});

db.once('open', () => {
  console.log('Result: Mongoose connection to MongoDB Succcessful and Open');
});

db.on('error', (error) => {
  console.log('error.message');
});

db.on('disconnected', () => {
  console.log('Result: Mongoose is disconnected from MongoDB')
});

process.on('SIGINT', async() => {
  await mongoose.connection.close();
  process.exit(0);
});

