import type { Access } from 'payload'

// V1 has a single administrator role: any signed-in user is an admin.
export const authenticated: Access = ({ req: { user } }) => Boolean(user)
