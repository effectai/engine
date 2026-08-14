import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";

function bytesToHex(bytes: Uint8Array): string {
  let h = "";
  for (let i = 0; i < bytes.length; i++) {
    h += bytes[i].toString(16).padStart(2, "0");
  }
  return h;
}

function bytesToBase64(bytes: Uint8Array): string {
  // Uint8Array → binary string → base64 via btoa
  let bin = "";
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const hash = url.searchParams.get("hash")?.trim() || "";

  let item: Record<string, unknown> | null = null;
  let error: string | null = null;

  if (hash) {
    try {
      const result = await context.storageManager.handleGetObject({ hash });
      const rawItems = result.getObjectResponse.items;
      if (rawItems.length > 0) {
        const raw = rawItems[0];
        // Convert Uint8Array fields to serializable strings
        item = {
          hash: raw.hash,
          type: raw.type,
          owner: bytesToHex(raw.owner as unknown as Uint8Array),
          next: raw.next,
          data: bytesToBase64(raw.data as unknown as Uint8Array),
        };
      } else {
        error = "Object not found";
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    }
  }

  const quotas = await context.storageManager.listQuotas();
  const totalObjects = quotas.reduce((sum, q) => sum + q.objectCount, 0);
  const totalBytes = quotas.reduce((sum, q) => sum + q.totalBytes, 0);

  return {
    hash,
    item,
    error,
    totalObjects,
    totalBytes,
  };
}

export default function Component() {
  const { hash, item, error, totalObjects, totalBytes } =
    useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Storage Explorer</h1>
        <a href="/storage/pointers" className="text-blue-600 hover:underline text-sm">
          View Pointers
        </a>
      </div>

      <Card>
        <CardContent className="py-4 flex gap-4">
          <div className="text-sm text-muted-foreground">
            Total objects: <span className="font-medium">{totalObjects.toLocaleString()}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Total bytes: <span className="font-medium">{totalBytes.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Form method="get" className="flex gap-2">
        <Input
          name="hash"
          placeholder="Enter content hash (SHA-256 hex)"
          defaultValue={hash}
          className="max-w-lg font-mono"
        />
        <Button type="submit">Fetch</Button>
      </Form>

      {error && (
        <Card>
          <CardContent className="py-4">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      )}

      {item && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-4 space-y-1">
              <div className="flex gap-2">
                <span className="font-semibold w-20">Hash:</span>
                <span className="font-mono text-sm break-all">{item.hash as string}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold w-20">Type:</span>
                <span>{(item.type as number) === 1 ? "linked-list" : "raw"}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold w-20">Owner:</span>
                <span className="font-mono text-sm">
                  {(item.owner as string).slice(0, 32)}..
                </span>
              </div>
              {item.next && (item.next as string).length > 0 && (
                <div className="flex gap-2">
                  <span className="font-semibold w-20">Next:</span>
                  <span className="font-mono text-sm">{(item.next as string).slice(0, 32)}..</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-semibold w-20">Data:</span>
                <span className="font-mono text-sm break-all">{item.data as string}</span>
              </div>
            </CardContent>
          </Card>

          {/* Link to follow next pointer */}
          {(item.next as string)?.length > 0 && (
            <a
              href={`/storage?hash=${item.next}`}
              className="text-blue-600 hover:underline text-sm"
            >
              Follow next &rarr;
            </a>
          )}
        </div>
      )}
    </div>
  );
}