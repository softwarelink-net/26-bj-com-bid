import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  clearSession,
  loadSession,
  login as sqlLogin,
  type RoleCode,
  type UserRecord,
} from '@/utils/sqljs-engine'

type SafeUser = Omit<UserRecord, 'password_hash'>

export const useAuthStore = defineStore('auth', () => {
  const user = ref<SafeUser | null>(loadSession())
  const permissionAlert = ref('')

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.role ?? null)
  const displayName = computed(() => user.value?.full_name ?? '未登录')

  async function login(username: string, password: string) {
    const result = await sqlLogin(username, password)
    if (!result) {
      permissionAlert.value = '账号或密码错误，请核对演示账号后重试'
      return false
    }
    user.value = result
    permissionAlert.value = ''
    return true
  }

  function logout() {
    clearSession()
    user.value = null
  }

  function hasRole(roles?: RoleCode[]) {
    if (!roles || roles.length === 0) return true
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  function setPermissionAlert(msg: string) {
    permissionAlert.value = msg
  }

  return {
    user,
    permissionAlert,
    isAuthenticated,
    role,
    displayName,
    login,
    logout,
    hasRole,
    setPermissionAlert,
  }
})
