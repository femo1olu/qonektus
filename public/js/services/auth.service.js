//Load in all environment variables
if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config();
}
//All account related services
const JWT = require("jsonwebtoken");
const User = require("../../../models/Users.model");
const Token = require("../../../models/token.model");
const sendEmail = require("../sendEmail"); 
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mysql = require('mysql');
const mongojs = require('mongojs');
const db = mongojs('qonektusdb', ['users']);
const mongoose = require("mongoose");
var newuser ;

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
    console.error('Result: Home route Error connecting to MySQL DB through Signup service: ' + err.stack + ' ' + JSON.stringify(err, undefined, 5));
    return;
  }
  console.log('Result: Home route connected to MySQL DB through Signup service as id ' + connection.threadId + ' ' + 'Error:' + ' ' + JSON.stringify(err, undefined, 5));
});// End DB instatiation.


//Clean way of taking care of sign-up
const signup = async (data, res) => {
  console.log(data);
  newuser = await User.findOne({ email: data.email });

  if (newuser) {
    //throw new Error("Email already exist");
    res.render('createaccount', {msg: 'Sorry...email already has an account!'});
  }
  newuser = new User(data);
  console.log(newuser);
  const token = JWT.sign({ id: newuser._id }, process.env.JWT_SECRET);
  newuser.token = token;
  newuser.paid_afolami = "false";
  newuser.paid_omoniyi = "false";
  newuser.paid_adeyemo = "false";

  //Hash before saving introduced by Femi
  bcrypt.genSalt().then(salt => {
    bcrypt.hash(newuser.password1, salt, function(err, hash){
    console.log(hash);
    console.log(salt);
    bcrypt.compare(newuser.password2, hash).then(result => console.log(result));

  newuser.password1 = hash;
  newuser.password2 = hash;

  console.log(newuser);
db.users.insert(newuser); // This does not take advantage of the pre-save hashing. Hashing done before ttempting to save
 //await newuser.save(); // saved in MongoDB Note ( await newuser.save( )  is another way to save in Mongo without all the declarations)

  //return newuser;
  // Alternate Storage in MySql DB
  let sql = "SET @id = ?; SET @firstname = ?; SET @lastname = ?; SET @email = ?; SET @password1 = ?; SET @password2 = ?;  SET @areacode = ?; SET @exchangecode = ?; SET @lineid = ?; SET @location = ?; SET @gender = ?; SET @interest1 = ?; SET @interest2 = ?; SET @paid_afolami = ?; SET @paid_omoniyi = ?; SET @paid_adeyemo = ?; \
  CALL  insert_users(@id, @firstname, @lastname, @email, @password1, @password2,  @areacode, @exchangecode, @lineid, @location, @gender, @interest1, @interest2, @paid_afolami, @paid_omoniyi, @paid_adeyemo );";
  // Input "hash" for both password1 and password2
  connection.query(sql,[data.id, newuser.firstname, newuser.lastname, newuser.email, newuser.password1, newuser.password2, newuser.areacode, newuser.exchangecode, newuser.lineid, newuser.location, newuser.gender, newuser.interest1, newuser.interest1, newuser.paid_afolami, newuser.paid_omoniyi, newuser.paid_adeyemo ], (err, rows, fields) => {
  if(!err){ //data.id ensures integer goes to SQL/ newuser.id uses string
            console.log('Result: User added to account table in the MySql database through Signup Service');
          }else{
                  console.log(err);
                }
    }); //sql connection ends
  });//brcypt hashing ends
});// Salt generation ends
  res.redirect('signin');  // was users/signin
};

var newtoken = [];

//Password Reset Request
const requestPasswordReset = async (email, res) => {

  const user = await User.findOne({ email });
  console.log("requestPWDReset: " + user);
  if (!user) throw new Error("User does not exist");
  let token = user.token; //await Token.findOne({ userId: user._id });
  console.log("requestPswdReset Token pulled per user found: "+ token);
  if (token) await Token.deleteOne();

  console.log("requestPswdReset Token pulled per user found after deleteOne: "+ token);
  let resetToken = crypto.randomBytes(32).toString("hex");
  console.log("resetToken before Hash was created and sent: "+ resetToken);
  const hash = await bcrypt.hash(resetToken, Number(process.env.BCRYPT_SALT));
  console.log("Hash of resetToken: " + hash);


  await new Token({
    userId: user._id,
    token: hash,
    createdAt: Date.now(),
  }).save();
 

 /* //Hash reset token before saving introduced by Femi
  bcrypt.genSalt().then(salt => {
    bcrypt.hash(resetToken, salt, function(err, hash){
    console.log("Hash of resetToken: " + hash);
    console.log("Salt for resetToken Hash: " + salt);

    newtoken = {
      userId: user._id,
      token: hash,
      createdAt: Date.now(),
      }

    });
  });
*/

  //const link = `${process.env.CLIENT_URL}/users/resetPassword?token=${resetToken}&id=${user._id}`;
  const link = `${process.env.CLIENT_URL}/users/new_password?token=${resetToken}&id=${user._id}&email=${email}`;
  sendEmail(user.email,'Password Reset Request',{name: user.firstname,link: link},'../js/email_template/requestResetPassword.ejs');
  //return link;
  res.render('forgot_password', {msg: 'Reset link sent to your email'});
};


//Reset Reset
const resetPassword = async (userId, token, password,email) => {
  let passwordResetToken = await Token.findOne({userId});
  console.log("test Femo: " + email);
  const requestor = await User.findOne({ email });
  console.log("resetPassword: User Info Pulled: " + requestor);
  //let passwordResetToken = requestor.token;
  //console.log(token);
  //console.log(password);
  console.log("resetPassword Received: userId " + userId + " token "+ token + " pswd " + password + " email " + email);
  console.log("resetPassword: Token pulled based on userId: " + passwordResetToken);
  //console.log(passwordResetToken.userId);
  if (!passwordResetToken) {
    throw new Error("Invalid or expired password reset token");
  }

  console.log("Token recieved from query string: " + token);
  console.log("Token pulled from mongodb (in Hash form): " + passwordResetToken.token);

  const isValid = await bcrypt.compare(token, passwordResetToken.token);
  console.log("resetPassword Validation:" + isValid);
  if (!isValid) {
    throw new Error("Invalid or expired password reset token - mismatch");
  }else{
          //const user = await User.findOne({ email });
          console.log("About to change this user's password: " + requestor.firstname);
  /*      
  const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT));
  //String.prototype.unquoted = function (){return this.replace (/(^")|("$)/g, '')}

  //var trimUserId = userId.unquoted();
  //var ID = JSON.parse(trimUserId); //objectID(ID) |  _id: { userId.trim()} ,
  //var mongoid = mongoose.Types.ObjectId(userId); used   _id: mongoid,
  await User.updateOne(
    {  
     $set: { password1: hash},
     $set: { password2: hash },
      new: true }
  );
  */
// Hash New Password and repalce the old with new.

  //Hash before saving introduced by Femi
  bcrypt.genSalt().then(salt => {
    bcrypt.hash(password, salt, function(err, hash){
    console.log("This is the hash of the new password: " + hash);
    console.log("This is the salt of the new password: " + salt);


  db.users.update({password1: requestor.password1 }, {$set: {password1: hash}});
  db.users.update({password2: requestor.password2 }, {$set: {password2: hash}});

 });//brcypt hashing ends
});// Salt generation ends

  const user = await User.findById({ _id: userId });
  sendEmail(
    user.email,
    'Password Reset Successfully',
    {
      name: user.name,
    },
    '/email_template/resetPassword.ejs'
  );
  await passwordResetToken.deleteOne();
  return true;
};
} // end of else for password replacement

module.exports = {
signup: signup,
requestPasswordReset: requestPasswordReset,
resetPassword: resetPassword
};