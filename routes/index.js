//Load in all environment variables
//if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config(); // needed to allow non-app.js files to find .env
//}
//import Required Packages
var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const mysql = require('mysql');
const mongoose = require('mongoose');
var {check, validationResult} = require('express-validator');
const sendEmail = require("../public/js/sendEmail");
const mongojs = require('mongojs');
const db = mongojs('qonektusdb', ['users']);
const bcrypt = require('bcryptjs');
/* Another way to import config information through .env
const dotenv = require('dotenv');
dotenv.config({path: '.env'}); // needed to allow non-app.js files to find .env
*/
const User = require('../models/Users.model');

const {
  signUpController
} = require('../controllers/auth.controller');

router.use(bodyParser.json());
const urlencodedParser = bodyParser.urlencoded({extended: false});

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
    console.error('Result: Home route Error connecting to MySQL DB through Create Account: ' + err.stack + ' ' + JSON.stringify(err, undefined, 5));
    return;
  }
  console.log('Result: Home route connected to MySQL DB through Create Account as id ' + connection.threadId + ' ' + 'Error:' + ' ' + JSON.stringify(err, undefined, 5));
});// End DB instatiation.

/*Omitting Connection to Mongo from non users route - connection handled in user.js
// Connect to the database
//const db = config.MongoURI;
//Instantiate your MongoDB using mongoose
mongoose.connect('mongodb://localhost/qonektusdb', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.connection
  .once("open", () => console.log('Result: Connected to MongoDB'))
  .on("error", (error)=> {
    console.log("Result: Error connecting to MongoDB", error)
  });
// End MongoDB instatiation.
*/


//Input to Directory route chosen to specific file mapping
//Add route -- This is route for home/index page
router.get('/', function(req, res){
 // Landing page is served from Client index.html instead of index.ejs
 //console.log('almost there')
 res.render('index');
});

router.get('/about', function(req, res){
 // Landing page is served from Client index.html instead of index.ejs
 //console.log('almost there')
 res.render('about');
});

router.get('/services', function(req, res){
 // Landing page is served from Client index.html instead of index.ejs
 //console.log('almost there')
 res.render('services');
});

router.get('/contact', function(req, res){
 // Landing page is served from Client index.html instead of index.ejs
 //console.log('almost there')
 res.render('contact', {msg: 'Please fill out this form to contact us...'});
});

router.get('/createaccount', function(req, res){
 // Landing page is served from Client index.html instead of index.ejs
 //console.log('almost there')
 res.render('createaccount', {msg: 'Please fill out this form to create your account...'} );
});

router.get('/tutors', function(req, res){
 // Landing page is served from Client index.html instead of index.ejs
 //console.log('almost there')
 res.render('tutors');
});

router.get('/testimonials', function(req, res){
 // Landing page is served from Client index.html instead of index.ejs
 //console.log('almost there')
 res.render('testimonials');
});
 
//Page to initiate password reset
 router.get('/forgot_password', function(req, res){
 res.render('forgot_password', {msg: 'Please provide your email'});
});

// To Create Table in our DB through EJS
router.get('/createcontactustable', (request, response) =>{
    let sql = 'CREATE TABLE contactustable(id int AUTO_INCREMENT, name VARCHAR(50), email VARCHAR(25), areacode VARCHAR(6), exchangecode VARCHAR(6), lineid VARCHAR(10), textentered TEXT NOT NULL, PRIMARY KEY(id) )';
    connection.query(sql,(err, result) => {
      if(err) throw err;
      console.log('Result: Your "Contact Us" table now exist in the database');
      //response.send('contactus table created!');

  });
});
/*
// To Create Table in our DB through EJS
router.get('/createaccounttable', (request, response) =>{
    let sql = 'CREATE TABLE accounttable(id int AUTO_INCREMENT, firstname VARCHAR(50), lastname VARCHAR(50), email VARCHAR(25), password1 VARBINARY (255), password2 VARBINARY(255), areacode VARCHAR(6), exchangecode VARCHAR(6), lineid VARCHAR(10), location VARCHAR(3), gender VARCHAR(7), interest1 VARCHAR(6), interest2 VARCHAR(6), PRIMARY KEY(id) )';
    connection.query(sql,(err, result) => {
      if(err) throw err;
      console.log('Result: Your "Account Table" now exist in the database');
      //response.send('contactus table created!');

  });
});
*/
//Add route e.g. Contact Message page POST request
router.post('/contact',urlencodedParser,
  [check('name', 'Please provide your name')
  .exists().isLength({min: 3}),
  check('email', 'invalid email address').isEmail().normalizeEmail()
  ] ,
  function (request, res){
    let input = request.body;
    let ouremail = 'info@qonektus.com';
    let toEmail = input.email.concat(';',ouremail);
    let blendNum = input.areacode.concat('-',input.exchangecode);
    let toCall =  blendNum.concat('-', input.lineid);
    console.log("This is for testing multi-receiver e-mail: " + toEmail);
    console.log("This is for testing text entered: " + input.enteredtext);
    console.log("This is for testing telephone# entered: " + toCall);
    const errors = validationResult(request);
  if(!errors.isEmpty()){ 
      //console.log(errors)
      //return res.status(422).jsonp({errors: errors.array()})
      res.render('contact', {msg: 'Provide your valid contact information'});

    } else{
          let sql = "SET @id = ?; SET @name = ?; SET @email = ?; SET @areacode = ?; SET @exchangecode = ?; SET @lineid = ?; SET @textentered = ?; \
          CALL  insert_contactus_msg(@id, @name, @email, @areacode, @exchangecode, @lineid, @textentered );";
          connection.query(sql,[input.id, input.name, input.email, input.areacode, input.exchangecode, input.lineid, input.enteredtext], (err, rows, fields) => {
          if(!err){
          console.log('Result: Data is entered into your "contact us" table in the MySql database');
          res.render('contact', {msg: 'Message sent successfully!'});
          //response.send('contactus table created!');
/*
    console.log("This is for testing multi-receiver e-mail: " + toEmail);
    console.log("This is for testing text entered: " + input.enteredtext);
    console.log("This is for testing telephone# entered: " + toCall);
    console.log(typeof(toEmail));
*/
          sendEmail(toEmail,'Your Message to Qonektus was Received',{name: input.name, email: input.email, telephone: toCall,message: input.enteredtext},'../js/email_template/customer_contactus.ejs');
          }else{
            console.log(err);
            res.render('contact', {msg: 'Contact information could not be logged'});
          }
          });
        }
});

 
//Add route e.g. Account Creation page POST request
router.post("/signup", [check('firstname', 'First name must be at least 3 characters long')
  .exists().isLength({min: 3}),
  check('lastname', 'Last name must be at least 2 characters long')
  .exists().isLength({min: 2}), 
  check('email', 'invalid email address').isEmail().normalizeEmail(),
  check('password1', 'password cannot be empty').exists().isLength({min:6 }),
  check('password2', 'password must match').exists().isLength({min:6 }),
  check('location', 'You must select a location').isLength({min:2 }) ], 
  signUpController); //use sign-up or create accout below.

router.post('/createaccount', urlencodedParser,[check('firstname', 'First name must be at least 3 characters long')
  .exists().isLength({min: 3}),
  check('lastname', 'Last name must be at least 2 characters long')
  .exists().isLength({min: 2}), 
  check('email', 'invalid email address').isEmail().normalizeEmail(),
  check('password1', 'password cannot be empty').exists().isLength({min:6 }),
  check('password2', 'password must match').exists().isLength({min:6 }),
  check('location', 'You must select a location').isLength({min:2 }) ], 
  
  function(req, res){
    let newuser = req.body;
    console.log(newuser);
    const errors = validationResult(req);
    console.log(errors);
  if((!errors.isEmpty())|| (newuser.password1 != newuser.password2)){ 
      res.render('createaccount', {msg: 'Provide valid information and your password has to match'});
    }else{ //Validation passes
          User.findOne({email: newuser.email })
          .then(user => {
                            let ouremail = 'info@qonektus.com';
                            let toEmail  = newuser.email.concat(';',ouremail);
                            newuser.paid_afolami = "false";
                            newuser.paid_omoniyi = "false";
                            newuser.paid_adeyemo = "false";
              if(user) { //user exist
                        res.render('createaccount', {msg: 'Sorry...email already has an account!'});
                       }else {
                                    // HASH the Passwords provided
                              //res.render('createaccount', {msg: 'Account created successfully!'});
                              bcrypt.genSalt().then(salt => {
                              bcrypt.hash(newuser.password1, salt, function(err, hash){
                              console.log(hash);
                              console.log(salt);
                              bcrypt.compare(newuser.password2, hash).then(result => console.log(result));
                                  //Primary Storage in MongoDB
                              var newuser_hash ={
                              firstname: newuser.firstname, 
                              lastname:  newuser.lastname, 
                              email: newuser.email, 
                              password1: hash,
                              password2: hash, 
                              areacode: newuser.areacode, 
                              exchange: newuser.exchangecode,
                              lineid: newuser.lineid,
                              location: newuser.location,
                              gender: newuser.gender,
                              interest1: newuser.interest1,
                              interest2: newuser.interest2,
                              paid_afolami: newuser.paid_afolami,
                              paid_omoniyi: newuser.paid_omoniyi,
                              paid_adeyemo: newuser.paid_adeyemo,
                              salt: salt
                              }
                            db.users.insert(newuser_hash, function(err, doc){
                             if(err){
                                res.send(err);
                              } else{
                                  console.log('Result: User Added to Mongo DB...');
                                   // Success Message
                                    }
                            }); //mongo insert ends
                            // Alternate Storage in MySql DB
                            let sql = "SET @id = ?; SET @firstname = ?; SET @lastname = ?; SET @email = ?; SET @password1 = ?; SET @password2 = ?;  SET @areacode = ?; SET @exchangecode = ?; SET @lineid = ?; SET @location = ?; SET @gender = ?; SET @interest1 = ?; SET @interest2 = ?; SET @paid_afolami = ?; SET @paid_omoniyi = ?; SET @paid_adeyemo = ?; \
                            CALL  insert_users(@id, @firstname, @lastname, @email, @password1, @password2,  @areacode, @exchangecode, @lineid, @location, @gender, @interest1, @interest2, @paid_afolami, @paid_omoniyi, @paid_adeyemo );";
                            // Input "hash" for both password1 and password2
                            connection.query(sql,[newuser.id, newuser.firstname, newuser.lastname, newuser.email, newuser_hash.password1, newuser_hash.password2, newuser.areacode, newuser.exchangecode, newuser.lineid, newuser.location, newuser.gender, newuser.interest1, newuser.interest1, newuser.paid_afolami, newuser.paid_omoniyi, newuser.paid_adeyemo ], (err, rows, fields) => {
                              if(!err){
                              console.log('Result: User added to account table in the MySql database');
                               }else{
                                      console.log(err);
                                    }
                            });  //sql connection ends
                            });//brcypt hashing ends
                            });// Salt generation ends 
                            res.redirect('users/signin'); 
                            sendEmail(toEmail,'Welcome to Qonektus',{name: newuser.firstname},'../js/email_template/welcome.ejs');                 
                      } //else of valid user ends
                });
          }
  //res.json(req.body);
   console.log('Account creation attempted...');

});


// Read all content of a Data 
router.get('/getAll', (request, response) =>{
  connection.query('SELECT * FROM contactustable', (err, rows, fields)=>{
    if(!err)
      //console.log(rows);
      response.send(rows);

    else
      console.log(err);
  })
});


// Update Data 
router.post('/change', (request, response) =>{
  
});

// delete Data 
router.delete('/remove', (request, response) =>{
  
});



//make accessible to other files
module.exports = router;

/* Important Stored Procedure

DELIMITER // ; \
Create PROCEDURE insert_users(IN id int, IN firstname VARCHAR(100), IN lastname VARCHAR(100), IN email VARCHAR(50), IN password1 VARCHAR(255), IN password2 VARCHAR(255), IN areacode VARCHAR(6), IN exchangecode VARCHAR(6), IN lineid VARCHAR(10), IN location VARCHAR(3), IN gender VARCHAR(7), IN interest1 VARCHAR(6), IN interest2 VARCHAR(6), IN paid_afolami VARCHAR(6), IN paid_omoniyi VARCHAR(6), IN paid_adeyemo VARCHAR(6) ) \
BEGIN \
insert into accounttable(id, firstname, lastname, email, password1, password2, areacode, exchangecode, lineid, location, gender, interest1, interest2, paid_afolami, paid_omoniyi) values (id, firstname, lastname, email, password1, password2, areacode, exchangecode, lineid, location, gender, interest1, interest2, paid_afolami, paid_omoniyi, paid_adeyemo);  \

END// \

DELIMITER ; //

*/