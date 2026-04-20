import { Role } from '../common/enums';

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  route: string;
  children?: MenuItem[];
}

const MENU_DASHBOARD: MenuItem = {
  key: 'dashboard',
  label: 'Dashboard',
  icon: 'dashboard',
  route: '/dashboard',
};

const MENU_ORDERS: MenuItem = {
  key: 'orders',
  label: 'Órdenes',
  icon: 'shopping_cart',
  route: '/orders',
};

const MENU_ORDERS_TRACKING: MenuItem = {
  key: 'orders_tracking',
  label: 'Seguimiento de Órdenes',
  icon: 'track_changes',
  route: '/orders/seguimiento',
};

const MENU_ISSUE_CATEGORY: MenuItem = {
  key: 'issue_category',
  label: 'Tipo de Novedades',
  icon: 'category',
  route: '/configuracion/categorias-novedad',
};

const MENU_USERS: MenuItem = {
  key: 'users',
  label: 'Usuarios',
  icon: 'group',
  route: '/usuarios',
};

export const MENU_POR_ROL: Record<Role, MenuItem[]> = {
  [Role.ADMIN]: [
    MENU_DASHBOARD,
    MENU_ORDERS,
    MENU_ORDERS_TRACKING,
    MENU_ISSUE_CATEGORY,
    MENU_USERS,
  ],
  [Role.OPERATIONS_ANALYST]: [
    MENU_DASHBOARD,
    MENU_ORDERS,
    MENU_ORDERS_TRACKING,
  ],
  [Role.OPERATIONS_COORDINATOR]: [],
  [Role.GROWTH]: [],
  [Role.SUPPLY]: [],
};
