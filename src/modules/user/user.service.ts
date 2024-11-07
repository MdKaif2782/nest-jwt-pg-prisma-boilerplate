import { Injectable } from "@nestjs/common";
import { hash, verify } from "argon2";
import { DatabaseService } from "src/modules/database/database.service";

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findUserById(id: string) {
    const user = await this.databaseService.user.findUnique({
      where: {
        id
      }
    });

    return user;
  }

  async findUserByEmail(email: string) {
    const user = await this.databaseService.user.findUnique({
      where: {
        email
      }
    });
    return user;
  }

  async hashPassword(password: string) {
    return await hash(password);
  }

  async verifyPassword(databasePassword: string, password: string) {
    return await verify(databasePassword, password);
  }
}
