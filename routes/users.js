//Load in all environment variables
//if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
//}
//import Required Packages
var express = require('express');
const mysql = require('mysql');
const mongoose = require('mongoose');
var {check, validationResult} = require('express-validator');
var router = express.Router();
const mongojs = require('mongojs');
const db = mongojs('qonektusapp', ['users']);
const bcrypt = require('bcryptjs');
const initializePassport = require('../passport-config');

const passport = require('passport');
//const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require('body-parser');
//const ejsLint = require('ejs-lint');
router.use(bodyParser.json());
const urlencodedParser = bodyParser.urlencoded({extended: false});
const flash = require('express-flash');
var session = require('express-session');
//var cookieParser = require('cookie-parser');
const methodOverride = require('method-override');  // Allows us to use the delete method at logout
// Load User model
const User = require('../models/Users.model');
const { 
  createUser, 
    getUser, 
    updateUser, 
  } = require('../models/Users.model');
//Variables to aid password reset
const JWT = require('jsonwebtoken');
//const User = require("../models/User.model");
const Token = require('../models/token.model');
const sendEmail = require("../public/js/sendEmail");
const crypto = require("crypto");

const {
  signUpController,
  resetPasswordRequestController,
  resetPasswordController,
} = require('../controllers/auth.controller');

const url = require('url');
var authorizedUserToken;
var authorizedUserName;
var UserPaidAfolami;
var UserPaidOmoniyi;
var UserPaidAdeyemo;

//router.use(express.static("/server/views"));

router.use(bodyParser.urlencoded({ extended: false }));

/* moved to app.js------Consider Refactoring DB connection for Mongo from user.js to db.js 
// Connect to the database
//Instantiate your MongoDB using mongoose
let DB_URL = process.env.DB_URL;
mongoose.connect(DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connection
  .once("open", () => console.log('Result: Connected to MongoDB'))
  .on("error", (error)=> {
    console.log("Result: Error connecting to MongoDB", error)
  });
// End MongoDB instatiation.
*/

//Instantiate your MySQL Database
const connection = mysql.createConnection({
  host     : process.env.DATABASE_HOST,
  user     : process.env.DATABASE_USER,
  password : process.env.DATABASE_PASSWORD,
  database : process.env.DATABASE,
  multipleStatements: true

});
 
connection.connect(function(err) {
  if (err) {
    console.error('Result: User route error attempt connecting to MySQL DB: ' + err.stack + ' ' + JSON.stringify(err, undefined, 5));
    return;
  }
  console.log('Result: User route connected to MySQL DB as id ' + connection.threadId + ' ' + 'Error:' + ' ' + JSON.stringify(err, undefined, 5));
});// End DB instatiation.

// To Create Sign-in Table in our DB through EJS
router.get('/createsignintable', (request, response) =>{
    let sql = 'CREATE TABLE credentialstable(id int AUTO_INCREMENT, email VARCHAR(25) NOT NULL, password VARCHAR(25) NOT NULL, PRIMARY KEY(id) )';
    connection.query(sql,(err, result) => {
      if(err) throw err;
      console.log('Result: Sign-in table now exist in the database');
      //response.send('contactus table created!');

  });
});
//Insert by leveraging Stored Procedure I created in mysql

/* Sample stored procedures, I ran on command terminal - 
DELIMITER // ;
Create PROCEDURE insert_credentials(IN id int,IN email VARCHAR(25), IN password VARCHAR(25)) 
BEGIN 
insert into credentialstable(id, email, password) values (id, email, password);  
END//
DELIMITER ; //
*/

//Add route e.g. Sign in page GET request
router.get('/signin', function(req, res){
	res.render('protected_views/signin', {msg: ''});
});

// Register from home page get
router.get('/register', IsAuthenticated, function(req, res){
res.render('registration', {msg: ' '}); // If not authenticated user made to signin
});

//Add route e.g. Sign in page GET request
router.get('/dashboard', function(req, res){
//res.render('dashboard', {msg: req.firstname});
console.log(authorizedUserName);
if (authorizedUserName != null) {
  res.render('dashboard', {data: {msg: authorizedUserName, paid_omoniyi: UserPaidOmoniyi, paid_afolami: UserPaidAfolami, paid_adeyemo: UserPaidAdeyemo }});
}
else {
  res.render('protected_views/signin', {msg: ' '});
}
         
});

// Signed in User Register from Dashboard/My Course page get -- i.e in User NAVBAR See Register 
router.get('/registration', function(req, res){
//res.render('registration', {msg: ' '}); // If not authenticated user made to signin
if (authorizedUserName != null) {
  res.render('registration', {msg: authorizedUserName});
}
else {
  res.render('protected_views/signin', {msg: ' '});
}

});

//Add route e.g. Registration page POST request with Server-side validation
//Note the serveralert is passed to registration.ejs, display not necessary...
//comment out listening in registration.ejs
// Made Global Variables intentionally
var chargeAmount;
router.post('/order',  
  function(req, res){
  let userorder = req.body;
  var total = 0 ;
  var ordermusic = "false";
  var orderyoruba = "false";
  var orderdebate = "false";
  console.log('Number check...:' + total );

  if((userorder.music != null) && (authorizedUserName != null)) { 
      //res.render('protected_views/signin',{msg: ' '});
      total = total + 50;
      ordermusic = "true";
      console.log('Registration attempted total from music...:' + total );
      console.log('Registration attempted debate music...:' + ordermusic );
  }
  if((userorder.yoruba != null) && (authorizedUserName != null)) {
      total = total + 50;
      orderyoruba = "true";
      console.log('Registration attempted total from yoruba...:' + total );
      console.log('Registration attempted yoruba ordered...:' + orderyoruba );
  }
  if((userorder.debate != null) && (authorizedUserName != null)){
      total = total + 50;
      orderdebate = "true";
      console.log('Registration attempted total from debate...:' + total );
      console.log('Registration attempted debate ordered...:' + orderdebate );
  }

  //res.json(req.body);
  console.log('Registration attempted debate ordered...: check 2 :' + orderdebate )
  res.render('order_page', {data: {msg: authorizedUserName, quote: total, ordermusic: ordermusic, orderyoruba: orderyoruba, orderdebate: orderdebate }});
   console.log('Registration attempted...');
   chargeAmount = total;
});

//Add route e.g. Sign-in page POST request... we opt to leverage local strategy with the help of passport
router.post('/signin', [check('email', 'invalid email address').isEmail().normalizeEmail(),
  check('password', 'Invalid password').exists().isLength({min:6 })],
  function(req, resquest){
  let usercredentials = req.body;
  console.log(usercredentials);
  const errors = validationResult(req);
  console.log(errors);
  if(!errors.isEmpty()){
    resquest.render('protected_views/signin', {msg: 'Invalid Username or Password'});
  }else{
          User.findOne({email: usercredentials.email })
          .then(user => {
            if(user){ console.log(user);
                      //var isValid = bcrypt.compare(usercredentials.password, user.password1);
                      //console.log(isValid);
                      console.log("This is a test");

                      bcrypt.compare(usercredentials.password, user.password1 , function(err, res) {
                        if(res){
                        console.log(user.password1);
                        console.log(usercredentials.password);
                        console.log(res);
                        authorizedUserToken =  user.token;
                        authorizedUserName = user.firstname;
                        UserPaidAfolami = user.paid_afolami;
                        UserPaidOmoniyi = user.paid_omoniyi;
                        UserPaidAdeyemo = user.paid_adeyemo;
                        //console.log(PaidUser);

                        resquest.render('dashboard', {data: {msg: user.firstname, paid_omoniyi: UserPaidOmoniyi, paid_afolami: UserPaidAfolami, paid_adeyemo: UserPaidAdeyemo}});
                        }else{
                           resquest.render('protected_views/signin', {msg: 'Invalid Username or Password'});
                           authorizedUserToken = null;
                           authorizedUserName = null;
                        }
                      });
            }else{
              resquest.render('protected_views/signin', {msg: 'Invalid Username or Password'});
            }
          });   
  }
});

router.get('/logout', (req, res) => {
  authorizedUserName = null;
  req.logOut();
  res.redirect('/');
})


function IsAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('signin');
}

var request = [];
//Password reset
router.post("/requestResetPassword", resetPasswordRequestController);
//router.get("/resetPassword", resetPasswordController);

router.get('/new_password', (req, res) => {
console.log(req.query);
res.render('new_password', {msg: "Provide New Password"});
const id = req.query.id;
const token = req.query.token;
const email = req.query.email;
        request = {
            id,
            token,
            email          
        };
}); 

router.post('/resetPassword', (req, res) => {
  console.log(request);
  console.log("This is request.id:" + request.id);
  var userId = request.id; // This one register a nul for reasons I cannot explain
  var email = request.email; 
  var usertoken = request.token;
  var update_password = req.body.password;
  console.log(" At new password submission ... This is password: " + update_password); 
  console.log(" At new password submission ... This is email: " + email); 
  console.log("At new password submission ... This is userId: " + userId);

  resetPasswordController(request.id, usertoken, update_password, email);

  res.redirect('/');
});
//make accessible to other files
module.exports = router;


