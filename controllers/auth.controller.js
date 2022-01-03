const {
  signup,
  requestPasswordReset,
  resetPassword,
} = require("../public/js/services/auth.service");
var {check, validationResult} = require('express-validator');


const signUpController = async (req, res, next) => {
    const errors = validationResult(req);
    console.log(errors);
  if(!errors.isEmpty()){ 
      res.render('createaccount', {msg: 'Provide valid information'});
    }else{ //Validation passes
           if(req.body.password1 != req.body.password2){
            res.render('createaccount', {msg: 'Your password has to match'});
           }else{
                    //console.log("Entry as seen by signUpController 1 req: " + {req});
                    //console.log("Entry as seen by signUpController 2 req.body: " + {req.body});
                try{ const signupService = await signup(req.body, res);
                     return res.json(signupService);
                    }catch(err){ //Femi added the try, catch and the console log
                               console.log(err);
                               }
                }
          }
};

const resetPasswordRequestController = async (req, res, next) => {
  // console.log(typeof (requestPasswordReset)); // typeof is a way know if the parameter is seen as a function.
try{const requestPasswordResetService = await requestPasswordReset(req.body.email, res);
  //console.log("This is a test:"+ req.body.email);
   //console.log(requestPasswordResetService);
  return res.json(requestPasswordResetService);
}catch(err){ //Femi added the try, catch and the console log
console.log(err);
}          
};
                     //I had (req, res, next)
const resetPasswordController = async (userId, token, password, email) => {
try{
  //console.log(req.body.userId);
  console.log("resetPwdController Received: UserId " + userId +" token "+ token + " pswd " + password + " email " + email);
  const resetPasswordService = await resetPassword(userId,token,password,email);
 //return res.json(resetPasswordService);

}catch(err){ //Femi added the try, catch and the console log
console.log(err);
}
};

module.exports = {
  signUpController,
  resetPasswordRequestController,
  resetPasswordController,
};