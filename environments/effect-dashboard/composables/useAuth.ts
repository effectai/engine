import { useMutation } from "@tanstack/vue-query";

export const useAuth = () => {
  const useLogout = () => {
    const { useDisconnect } = useSession();
    const { logout } = useAuthStore();
    const { destroy } = useWorkerStore();

    const { mutateAsync: disconnect } = useDisconnect();
    const { mutateAsync: logoutWeb3Auth } = useLogout();

    return useMutation({
      mutationFn: async (): Promise<void> => {
        //disconnect from manager
        await disconnect();
        //logout from web3auth
        await logoutWeb3Auth();
        //clear auth state
        logout();
        await destroy();
      },
    });
  };

  return {
    useLogout,
  };
};
