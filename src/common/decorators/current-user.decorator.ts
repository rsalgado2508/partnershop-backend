import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CognitoUser {
  sub: string;
  email: string;
  username: string;
  groups: string[];
}

export const CurrentUser = createParamDecorator(
  (data: keyof CognitoUser | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CognitoUser;
    return data ? user?.[data] : user;
  },
);
