import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryClientContextProvider({
  client,
  children,
}: { client: QueryClient; children: React.ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
