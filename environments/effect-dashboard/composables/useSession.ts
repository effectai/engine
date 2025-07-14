import { multiaddr, type Multiaddr } from "@effectai/protocol";
import { useMutation } from "@tanstack/vue-query";

export const useSession = () => {
  const useConnect = () => {
    const { connect } = useSessionStore();

    return useMutation({
      mutationFn: async (
        multiaddr: string | Multiaddr,
        {
          account,
          nextNonce,
          managerMultiAddress,
          accessCode,
        }: {
          account: string;
          managerMultiAddress: string;
          nextNonce: bigint;
          accessCode?: string;
        },
      ): Promise<Awaited<ReturnType<typeof connect>>> => {
        return await connect({
          multiaddr:
            typeof multiaddr === "string" ? multiaddr : multiaddr.toString(),
          account,
          currentNonce: nextNonce,
          accessCode,
        });
      },
    });
  };

  const useDisconnect = () => {
    const { disconnect } = useSessionStore();

    return useMutation({
      mutationFn: async (): Promise<Awaited<ReturnType<typeof disconnect>>> => {
        return await disconnect();
      },
    });
  };

  return {
    useConnect,
    useDisconnect,
  };
};
