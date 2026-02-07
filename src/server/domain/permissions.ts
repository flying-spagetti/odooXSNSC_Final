/**
 * Role-Based Access Control (RBAC)
 * Central permission map defining what each role can do
 */

export type Role = 'ADMIN' | 'INTERNAL' | 'PORTAL';

export type Permission =
  // User management
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  // Product management
  | 'products:create'
  | 'products:read'
  | 'products:update'
  | 'products:delete'
  // Plan management
  | 'plans:create'
  | 'plans:read'
  | 'plans:update'
  | 'plans:delete'
  // Subscription management
  | 'subscriptions:create'
  | 'subscriptions:read'
  | 'subscriptions:read:all'
  | 'subscriptions:update'
  | 'subscriptions:delete'
  | 'subscriptions:actions'
  // Invoice management
  | 'invoices:create'
  | 'invoices:read'
  | 'invoices:read:all'
  | 'invoices:update'
  | 'invoices:delete'
  | 'invoices:actions'
  // Payment management
  | 'payments:create'
  | 'payments:read'
  | 'payments:read:all'
  // Tax & Discount management
  | 'taxes:create'
  | 'taxes:read'
  | 'taxes:update'
  | 'taxes:delete'
  | 'discounts:create'
  | 'discounts:read'
  | 'discounts:update'
  | 'discounts:delete'
  // Reports
  | 'reports:read';

/**
 * Permission Matrix
 * Defines which permissions each role has
 */
export const RolePermissions: Record<Role, Permission[]> = {
  ADMIN: [
    // Full access to everything
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'products:create',
    'products:read',
    'products:update',
    'products:delete',
    'plans:create',
    'plans:read',
    'plans:update',
    'plans:delete',
    'subscriptions:create',
    'subscriptions:read',
    'subscriptions:read:all',
    'subscriptions:update',
    'subscriptions:delete',
    'subscriptions:actions',
    'invoices:create',
    'invoices:read',
    'invoices:read:all',
    'invoices:update',
    'invoices:delete',
    'invoices:actions',
    'payments:create',
    'payments:read',
    'payments:read:all',
    'taxes:create',
    'taxes:read',
    'taxes:update',
    'taxes:delete',
    'discounts:create',
    'discounts:read',
    'discounts:update',
    'discounts:delete',
    'reports:read',
  ],
  INTERNAL: [
    // Internal staff: can manage subscriptions, invoices, payments
    'users:read',
    'products:read',
    'plans:read',
    'subscriptions:create',
    'subscriptions:read',
    'subscriptions:read:all',
    'subscriptions:update',
    'subscriptions:actions',
    'invoices:create',
    'invoices:read',
    'invoices:read:all',
    'invoices:actions',
    'payments:create',
    'payments:read',
    'payments:read:all',
    'taxes:read',
    'discounts:read',
    'reports:read',
  ],
  PORTAL: [
    // Portal users: can only view their own subscriptions and invoices
    'products:read',
    'plans:read',
    'subscriptions:read',
    'invoices:read',
    'payments:read',
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return RolePermissions[role].includes(permission);
}

/**
 * Check if a role can access a resource
 * PORTAL users can only access their own resources
 */
export function canAccessResource(
  role: Role,
  resourceUserId: string,
  requestUserId: string
): boolean {
  if (role === 'ADMIN' || role === 'INTERNAL') {
    return true;
  }
  return resourceUserId === requestUserId;
}
