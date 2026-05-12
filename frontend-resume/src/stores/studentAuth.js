import { createAuthStore } from '@/composables/createAuthStore'

export const useStudentAuthStore = createAuthStore(
  'studentAuth',
  {
    accessToken: 'access_token',
    userId: 'user_id',
    username: 'username',
    role: 'role',
  },
)
