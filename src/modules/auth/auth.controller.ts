import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginLocalBody, RegisterLocalBody } from "./auth.dto";
import { Request } from "express";
import { AccessTokenGuard, RefreshTokenGuard } from "./auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("/local/register")
  @HttpCode(201)
  async registerLocal(@Body() body: RegisterLocalBody) {
    return await this.authService.registerLocal(body);
  }

  @Post("/local/login")
  @HttpCode(200)
  async logInLocal(@Body() body: LoginLocalBody) {
    return await this.authService.logInLocal(body);
  }

  @UseGuards(AccessTokenGuard)
  @Post("/logout")
  @HttpCode(200)
  async logOut(@Req() req: Request) {
    const user = req.user as { id: string };
    await this.authService.logOut(user);
  }

  @UseGuards(RefreshTokenGuard)
  @Post("/refresh")
  @HttpCode(201)
  async refreshToken(@Req() req: Request) {
    const user = req.user as { id: string; refreshToken: string };

    const { accessToken, refreshToken } =
      await this.authService.refreshToken(user);

    return {
      accessToken,
      refreshToken
    };
  }
}
