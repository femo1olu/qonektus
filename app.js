//if(process.env.NODE_ENV !== 'production'){
//	require('dotenv').config();
//}
//import Required Packages
const http = require('http');
const https = require('https');
const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
var path = require('path');
var session = require('express-session');
const publicDirectory = path.join(__dirname, 'public');
//const bodyParser = require('body-parser');
var flash = require('express-flash');
const connection = require("./db");
//

    // Initialize path to routes
const routes = require('./routes/index'); //paths through index.js
const users = require('./routes/users');

/*
// Creating a global variable
app.get('*', function(req, res, next){
	res.local.user = req.firstname || null;
	next();
});
*/
dotenv.config();
// ensure API calls from frontend are allowed to reach the Backend
app.use(cors()); 

//False indicates we are not sending forms... Actually, it indicates we can grab data from forms
//Parse URL encoded bodies.
app.use(express.urlencoded({extended: false}));
//so we can send the traffic in json format.//Parse JSON encoded bodies
app.use(express.json({limit: '1mb'}));


// Set Static Folder path configuration, where static files (css, img etc) will be served from
  //app.use(express.static('../client')); // e.g. home for all .htmls
app.use(express.static(publicDirectory));

// Set View Engine --- // the repo for my private files routes maps on top of it.
app.set('view engine', 'ejs'); 

//Set path to public/client directory is better look into this
//app.set('views', path.join(__dirname, 'views')); 
 

// Create/ Define Routes


// DB Connection Termination
/*connection.end(function(err) {
  // The connection is terminated now
});*/

 //Input (Request string) to route directory mapping
app.use('/', routes);
app.use('/users', users);

/*  Dependent on the required for db made at the top
//Connection to Mongo DB established
(async function db() {
  await connection();
})();
*/
const host = process.env.APP_HOST;
const port = process.env.PORT;
//Launch server by getting the PORT from .env
/*
app.listen(port, host,() => {
	console.log('Server started http://${host}:on port ${port}/');
});
*/
app.listen(port, host,() => console.log('Server started on port 3000...'));




