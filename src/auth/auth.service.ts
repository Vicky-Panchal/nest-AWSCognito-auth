import { AuthConfig } from './auth.config';
import { Inject, Injectable } from '@nestjs/common';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute,
  ICognitoUserPoolData,
} from 'amazon-cognito-identity-js';

import { CognitoIdentityServiceProvider, config } from 'aws-sdk';

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

  adminCreateUser(createUser: { name: string; email: string }) {
    const { name, email } = createUser;
    const cognito = new CognitoIdentityServiceProvider({
      apiVersion: '2016-04-18',
      region: 'us-east-1',
      accessKeyId: '',
      secretAccessKey: '',
    });

    const USERPOOLID = process.env.COGNITO_USER_POOL_ID;
    console.log(process.env.COGNITO_USER_POOL_ID);
    config.update({
      region: 'us-east-1',
      accessKeyId: '',
      secretAccessKey: '',
    });

    const cognitoParams = {
      UserPoolId: USERPOOLID,
      Username: name,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
        {
          Name: 'email_verified',
          Value: 'true',
        },
      ],
      TemporaryPassword: 'vicky3600',
      MessageAction: 'SUPPRESS',
    };

    return new Promise((resolve, reject) => {
      return cognito.adminCreateUser(cognitoParams, (err, result) => {
        if (!result) {
          reject(err);
        } else {
          console.log('----------------------');
          console.log(result);
          resolve(result);
        }
      });
    });
  }

  adminInitiateAuth(createUser: {
    name: string;
    email: string;
    password: string;
  }) {
    const { name, email, password } = createUser;

    const params = {
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      AuthParameters: {
        USERNAME: name,
        EMAIL: email,
        PASSWORD: password,
      },
    };

    const cognitoidentityserviceprovider = new CognitoIdentityServiceProvider({
      apiVersion: '2016-04-18',
      region: 'us-east-1',
      accessKeyId: '',
      secretAccessKey: '',
    });
    return new Promise((resolve, reject) => {
      return cognitoidentityserviceprovider.adminInitiateAuth(
        params,
        (err, result) => {
          if (!result) {
            reject(err);
            console.log(err);
          } else {
            console.log('----------------------');
            resolve(result);
            console.log(result);
          }
        },
      );
    });
  }

  respondToAuthChallenge(authResponse: {
    session: string;
    password: string;
    name: string;
  }) {
    const { session, password, name } = authResponse;
    const params = {
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      ClientId: process.env.COGNITO_CLIENT_ID,
      ChallengeResponses: {
        NEW_PASSWORD: password,
        USERNAME: name,
      },
      Session: session,
    };
    console.log(params);
    const cognito = new CognitoIdentityServiceProvider({
      apiVersion: '2016-04-18',
      region: 'us-east-1',
    });
    return new Promise((resolve, reject) => {
      return cognito.respondToAuthChallenge(params, (err, data) => {
        if (err) {
          console.log(err, err.stack); // an error occurred
          reject(err);
        } else {
          console.log(data); // successful response
          resolve(data);
        }
      });
    });
  }
}
