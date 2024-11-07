import { createParamDecorator } from "@nestjs/common";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

export const GetCurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContextHost) => {
    const request = context.switchToHttp().getRequest();
    return data ? request.user?.[data] : request.user;
  }
);
