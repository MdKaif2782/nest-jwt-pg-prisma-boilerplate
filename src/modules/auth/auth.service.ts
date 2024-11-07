import {
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { hash, verify } from "argon2";
import { JwtService } from "@nestjs/jwt";
import { User } from "@prisma/client";
import { DatabaseService } from "../database/database.service";
import { ConfigService } from "@nestjs/config";
import { AccessToken } from "./auth.strategy";

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
    private jwtService: JwtService
  ) {}

  async registerLocal(user: Pick<User, "email" | "password">) {
    user.password = await this.createHash(user.password);

    const foundUser = await this.databaseService.user.findUnique({
      where: {
        email: user.email
      }
    });

    if (foundUser) {
      throw new ForbiddenException("Your email is already registered");
    }

    const newUser = await this.databaseService.user.create({
      data: user
    });

    const { accessToken, refreshToken } = await this.generateTokens({
      id: newUser.id
    });

    await this.storeRefreshToken({
      id: newUser.id,
      refreshToken
    });

    return { accessToken, refreshToken };
  }

  async logInLocal(user: Pick<User, "email" | "password">) {
    const foundUser = await this.databaseService.user.findUnique({
      where: {
        email: user.email
      }
    });

    if (!foundUser) {
      throw new ForbiddenException("User is not registered");
    }

    const isPasswordCorrect = await this.verifyHash(
      foundUser.password,
      user.password
    );

    if (!isPasswordCorrect) {
      throw new ForbiddenException("Incorrect password");
    }

    const { accessToken, refreshToken } = await this.generateTokens({
      id: foundUser.id
    });

    await this.storeRefreshToken({
      id: foundUser.id,
      refreshToken
    });

    return { id: foundUser.id, accessToken, refreshToken };
  }

  async logOut(user: Pick<User, "id">) {
    const foundUser = await this.databaseService.user.findUnique({
      where: {
        id: user.id
      }
    });

    if (!foundUser) {
      throw new ForbiddenException("User is not registered");
    }

    if (!foundUser.refreshToken) {
      throw new ForbiddenException("Already logged out");
    }

    await this.databaseService.user.update({
      where: {
        id: user.id
      },
      data: {
        refreshToken: null
      }
    });
  }

  async refreshToken(user: Pick<User, "id" | "refreshToken">) {
    const foundUser = await this.databaseService.user.findUnique({
      where: {
        id: user.id
      }
    });

    if (!foundUser) {
      throw new ForbiddenException("User is not registered");
    }

    if (!foundUser.refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const isRefreshTokenValid = await this.verifyHash(
      foundUser.refreshToken,
      user.refreshToken
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const { accessToken, refreshToken } = await this.generateTokens({
      id: foundUser.id
    });

    await this.storeRefreshToken({
      id: foundUser.id,
      refreshToken
    });

    return { accessToken, refreshToken };
  }

  async storeRefreshToken(user: Pick<User, "id" | "refreshToken">) {
    user.refreshToken = await this.createHash(user.refreshToken);

    await this.databaseService.user.update({
      where: {
        id: user.id
      },
      data: {
        refreshToken: user.refreshToken
      }
    });
  }

  async generateTokens(payload: AccessToken) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("ACCESS_KEY"),
      expiresIn: "7d"
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>("REFRESH_KEY"),
      expiresIn: "70d"
    });

    return { accessToken, refreshToken };
  }

  async createHash(inputString: string) {
    return await hash(inputString);
  }

  async verifyHash(referenceHash: string, inputString: string) {
    return await verify(referenceHash, inputString);
  }
}
