import { Role, User } from '../models/user';

/**
 * Resolve the default application route for a given role.
 */
export function getDefaultRouteForRole(role: Role): string {
  return role === 'admin' ? '/admin' : '/catalog';
}

/**
 * Resolve the default application route for an authenticated user.
 */
export function getDefaultRouteForUser(user: Pick<User, 'role'>): string {
  return getDefaultRouteForRole(user.role);
}
