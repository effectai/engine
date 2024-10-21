import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div id="splash-container"/>
      <div className="flex flex-col items-center gap-3 z-10">
        <header className="flex flex-col items-center gap-4">
          <p className="leading text-4xl font-bold text-gray-800 dark:text-gray-100 uppercase">
            Introducing<span className="sr-only">Remix</span>
          </p>
          <div className="h-[144px] text-center">
            <h1 className="title mb-4">Effect Tasks</h1>
            <h2 className="subtitle italic text-xl">A modern, decentralized Human Tasking Platform powered by AI</h2>
          </div>
        </header>
        <div className="flex gap-5">
          <button className="border-2 hover:bg-slate-200 rounded px-6 py-2 opacity-100 shadow-lg text-lg lowercase font-semibold bg-fuchsia-100 text-white-100 shadow-amber-400/50 bg-transparent border-current">Whitepaper</button>
          
          <a href=""><button className="border-2 hover:bg-slate-200 rounded px-6 py-2 opacity-100 shadow-lg text-lg lowercase font-semibold bg-fuchsia-100 text-white-100 shadow-neutral-400/50 bg-transparent border-current">Documentation</button></a>
        </div>
      </div>
    </div>
  );
}
