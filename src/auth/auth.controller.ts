import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CognitoUser } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums';
import { MenuItem, MENU_POR_ROL } from './menu.config';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getProfile(@CurrentUser() user: CognitoUser) {
    return {
      sub: user.sub,
      email: user.email,
      username: user.username,
      roles: user.groups,
    };
  }

  @Get('menu')
  @ApiOperation({ summary: 'Obtener menú según roles del usuario' })
  getMenu(@CurrentUser() user: CognitoUser): MenuItem[] {
    const menuItems = new Map<string, MenuItem>();

    for (const group of user.groups) {
      const role = group as Role;
      const items = MENU_POR_ROL[role];
      if (items) {
        for (const item of items) {
          // Si ya existe, mantener el que tenga más children (más permisos)
          const existing = menuItems.get(item.key);
          if (
            !existing ||
            (item.children?.length ?? 0) > (existing.children?.length ?? 0)
          ) {
            menuItems.set(item.key, item);
          }
        }
      }
    }

    return Array.from(menuItems.values());
  }
}
