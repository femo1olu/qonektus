const nodemailer = require("nodemailer");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const accessToken = require('/var/www/qonektusapp/qonektusapp/token.json');

var gmailSender = require('gmail-sender-oauth');
gmailSender.setClientSecretsFile("/var/www/qonektusapp/qonektusapp/client_secret.json");
//const emailDirectory = path.join(__dirname, '../views/includes/email_template');

const sendEmail = async (email, subject, payload, email_template) => {
const source = fs.readFileSync(path.join(__dirname, email_template), "utf8");
const compiledTemplate = ejs.compile(source);
var params = {
    from: 'info@qonektus.com',
    to: email,
    subject: subject,
    body: compiledTemplate(payload)
};
gmailSender.send(accessToken, params, function (err, resp) {
  if (err) {
    return console.error('Something went wrong: ' + err);
  }
  else {
      console.log('Message sent with id: ' + resp.id);
  }
 
});

};

/*
//Example:
sendEmail(
  "femo1oba@gmail.com",
  "Password Reset trial",
  { name: "Olufemi" },
  "../views/includes/requestResetPassword.ejs"
);
*/
module.exports = sendEmail;