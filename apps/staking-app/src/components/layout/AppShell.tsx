export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid">
      <main className="flex flex-col">
        <div className="container mx-auto w-full max-w-6xl p-4">{children}</div>
      </main>
    </div>
  );
}
