import { AuthGuard } from "@nestjs/passport";

export class AccessTokenGuard extends AuthGuard("jwt") {
  constructor() {
    super();
  }
}

export class RefreshTokenGuard extends AuthGuard("jwt-refresh") {
  constructor() {
    super();
  }
}
