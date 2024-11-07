import { IsEmail, IsString } from "class-validator";

export class RegisterLocalBody {
  @IsEmail()
  email: string;

  @IsString({})
  password: string;
}

export class LoginLocalBody {
  @IsEmail()
  email: string;

  @IsString({})
  password: string;
}
