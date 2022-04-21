import { AuthConfig } from './auth.config';
import { Inject, Injectable } from '@nestjs/common';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute,
  ICognitoUserPoolData,
} from 'amazon-cognito-identity-js';

@Injectable()
export class AuthService {
  private userPool: CognitoUserPool;
  private sessionUserAttributes: {};
  constructor(private authConfig: AuthConfig) {
    this.userPool = new CognitoUserPool({
      UserPoolId: this.authConfig.userPoolId,
      ClientId: this.authConfig.clientId,
    });
  }

  async registerUser(registerRequest: {
    name: string;
    email: string;
    password: string;
  }) {
    const { name, email, password } = registerRequest;
    return new Promise((resolve, reject) => {
      return this.userPool.signUp(
        name,
        password,
        [new CognitoUserAttribute({ Name: 'email', Value: email })],
        null,
        (err, result) => {
          if (!result) {
            reject(err);
          } else {
            console.log('----------------------');
            result.userConfirmed = true;
            console.log(result);
            resolve(result);
          }
        },
      );
    });
  }

  authenticateUser(user: { name: string; password: string }) {
    const { name, password } = user;

    const authenticationDetails = new AuthenticationDetails({
      Username: name,
      Password: password,
    });
    const userData = {
      Username: name,
      Pool: this.userPool,
    };

    const newUser = new CognitoUser(userData);
    return new Promise((resolve, reject) => {
      return newUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          resolve(result);
        },
        onFailure: (err) => {
          reject(err);
        },
        newPasswordRequired: function (userAttributes, requiredAttributes) {
          delete userAttributes.email_verified;
          //res.redirect('/changepass');
          //var newpass = req.body.new_password;
          //This newpass variable would take the place of "hardcodedpassword" below
          newUser.completeNewPasswordChallenge(
            'hardcodedpassword',
            userAttributes,
            this,
          );
          //User then needs to be redirected to another page
        },
      });
    });
  }

  resetPassword(user: { name: string; password: string }) {
    const { name, password } = user;

    const userData = {
      Username: name,
      Pool: this.userPool,
    };
    const newUser = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      return newUser.forgotPassword({
        onSuccess: function (result) {
          console.log('call result: ' + JSON.stringify(result));
          return resolve('hi');
        },
        onFailure: function (err) {
          console.log(err);
        },
      });
    });
  }

  confirmPassword(user: {
    name: string;
    verificationCode: string;
    newPassword: string;
  }) {
    const { name, verificationCode, newPassword } = user;
    const newUser = new CognitoUser({
      Username: name,
      Pool: this.userPool,
    });

    return new Promise((resolve, reject) => {
      newUser.confirmPassword(verificationCode, newPassword, {
        onFailure(err) {
          reject(err);
        },
        onSuccess(result) {
          resolve(result);
        },
      });
    });
  }
}
