import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 获取当前登录用户
 */
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
