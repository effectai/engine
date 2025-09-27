import MigrationFlow from "@/components/MigrationFlow";
import { AppHeader, Toaster } from "@effectai/react";

function App() {
  return (
    <div className="grid">
      <main className="flex mt-10 flex-col">
        <div className="container mx-auto w-full max-w-6xl p-4">
          <AppHeader />
          <div className="mx-auto mt-20 max-w-3xl px-4">
            <MigrationFlow />
          </div>
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
