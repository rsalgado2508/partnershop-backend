import { Role } from '../common/enums';

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  route: string;
  children?: MenuItem[];
}

const MENU_ORDENES: MenuItem = {
  key: 'ordenes',
  label: 'Órdenes',
  icon: 'shopping_cart',
  route: '/ordenes',
};

const MENU_NOVEDADES: MenuItem = {
  key: 'novedades',
  label: 'Novedades',
  icon: 'report_problem',
  route: '/novedades',
  children: [
    {
      key: 'novedades-listado',
      label: 'Listado de Novedades',
      route: '/novedades',
    },
    {
      key: 'novedades-registrar',
      label: 'Registrar Novedad',
      route: '/novedades/nueva',
    },
  ],
};

const MENU_NOVEDADES_READONLY: MenuItem = {
  key: 'novedades',
  label: 'Novedades',
  icon: 'report_problem',
  route: '/novedades',
  children: [
    {
      key: 'novedades-listado',
      label: 'Listado de Novedades',
      route: '/novedades',
    },
  ],
};

const MENU_CATEGORIAS: MenuItem = {
  key: 'categorias',
  label: 'Categorías de Novedad',
  icon: 'category',
  route: '/categorias-novedad',
};

const MENU_CONFIGURACION: MenuItem = {
  key: 'configuracion',
  label: 'Configuración',
  icon: 'settings',
  route: '/configuracion',
  children: [
    {
      key: 'config-categorias',
      label: 'Categorías de Novedad',
      route: '/configuracion/categorias-novedad',
    },
  ],
};

export const MENU_POR_ROL: Record<Role, MenuItem[]> = {
  [Role.ADMIN]: [
    MENU_ORDENES,
    MENU_NOVEDADES,
    MENU_CONFIGURACION,
  ],
  [Role.OPERATIONS_ANALYST]: [
    MENU_ORDENES,
    MENU_NOVEDADES,
  ],
  [Role.OPERATIONS_COORDINATOR]: [
    MENU_ORDENES,
    MENU_NOVEDADES,
  ],
  [Role.GROWTH]: [
    MENU_ORDENES,
  ],
  [Role.SUPPLY]: [
    MENU_ORDENES,
  ],
};
