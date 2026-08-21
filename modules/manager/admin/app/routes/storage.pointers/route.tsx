import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { createHash } from "node:crypto";
import { useState } from "react";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const peerId = url.searchParams.get("peerId")?.trim() || "";

  let pointers: Array<{ key: string; value: string }> = [];
  let error: string | null = null;

  if (peerId) {
    try {
      const ownerHex = createHash("sha256").update(peerId).digest("hex");
      pointers = await context.storageManager.listPointersFor(ownerHex);
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    }
  }

  return { peerId, pointers, error };
}

export default function Component() {
  const { peerId, pointers, error } = useLoaderData<typeof loader>();
  const [searchValue, setSearchValue] = useState(peerId);

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">
      <h1 className="text-2xl font-bold">Pointers</h1>

      <form method="get" className="flex gap-2">
        <Input
          name="peerId"
          placeholder="Enter Peer ID"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="max-w-lg font-mono"
        />
        <Button type="submit">List Pointers</Button>
      </form>

      {error && (
        <Card>
          <CardContent className="py-4">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {pointers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {pointers.length} pointer{pointers.length !== 1 ? "s" : ""} found
          </p>
          {pointers.map((ptr) => (
            <Card key={ptr.key}>
              <CardContent className="py-4 flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex gap-2">
                    <span className="font-semibold shrink-0 w-16">Key:</span>
                    <span className="font-mono text-sm break-all">{ptr.key}</span>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="font-semibold shrink-0 w-16">Hash:</span>
                    <span className="font-mono text-sm break-all text-muted-foreground">
                      {ptr.value}
                    </span>
                  </div>
                </div>
                <Link
                  to={`/storage?hash=${ptr.value}`}
                  className="shrink-0 text-blue-600 hover:underline text-sm"
                >
                  View object
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {peerId && pointers.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">No pointers found for this peer.</p>
      )}
    </div>
  );
}