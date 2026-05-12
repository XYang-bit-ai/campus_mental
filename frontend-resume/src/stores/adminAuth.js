import { createAuthStore } from '@/composables/createAuthStore'

export const useAdminAuthStore = createAuthStore(
  'adminAuth',
  {
    accessToken: 'admin_access_token',
    adminId: 'admin_id',
    adminUsername: 'admin_username',
  },
)
