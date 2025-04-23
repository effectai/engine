import { ref, computed } from "vue";

const privateKey = ref<string | null>(null);

export const useAuth = () => {
  const loadPrivateKey = () => {
    if (process.client) {
      privateKey.value = localStorage.getItem("privateKey");
    }
  };

  const isAuthenticated = computed(() => !!privateKey.value);

  const login = (key: string) => {
    if (process.client) {
      localStorage.setItem("privateKey", key);
      privateKey.value = key;
    }
  };

  const logout = () => {
    if (process.client) {
      localStorage.removeItem("privateKey");
      privateKey.value = null;
    }
  };

  return {
    privateKey,
    isAuthenticated,
    login,
    logout,
    loadPrivateKey,
  };
};
