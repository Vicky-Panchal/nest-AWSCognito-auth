import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerRequest: { name: string; password: string; email: string },
  ) {
    return await this.authService.registerUser(registerRequest);
  }

  @Post('login')
  async login(@Body() authenticateRequest: { name: string; password: string }) {
    try {
      return await this.authService.authenticateUser(authenticateRequest);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('forgotpassword')
  async forgotPassword(
    @Body() resetPassword: { name: string; password: string },
  ) {
    try {
      return await this.authService.resetPassword(resetPassword);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('confirmpassword')
  async confirmPassword(
    @Body()
    confirmPassword: {
      name: string;
      verificationCode: string;
      newPassword: string;
    },
  ) {
    try {
      return await this.authService.confirmPassword(confirmPassword);
    } catch (e) {
      throw new BadRequestException(e.message);
    }
  }

  @Post('admincreate')
  async adminCreateUser(
    @Body() createUser: { name: string; password: string; email: string },
  ) {
    return await this.authService.adminCreateUser(createUser);
  }

  @Post('initiateauth')
  async adminInitiateAuth(
    @Body()
    createUser: {
      name: string;
      password: string;
      email: string;
    },
  ) {
    return await this.authService.adminInitiateAuth(createUser);
  }

  @Post('authresponse')
  async authResponse(
    @Body() authResponse: { session: string; password: string; name: string },
  ) {
    return await this.authService.respondToAuthChallenge(authResponse);
  }
}
