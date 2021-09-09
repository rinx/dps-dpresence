import { Denops } from "https://deno.land/x/denops_std@v1.9.0/mod.ts";
import { execute } from "https://deno.land/x/denops_std@v1.9.0/helper/mod.ts";
import { options } from "https://deno.land/x/denops_std@v1.9.0/variable/mod.ts";
import { existsSync } from "https://deno.land/x/std@0.106.0/fs/mod.ts";
import {
  createClient,
  RichPresence,
} from "https://deno.land/x/discord_rpc@0.1.0/mod.ts";

export async function main(denops: Denops): Promise<void> {
  if (!existsSync("/run/user/1000/discord-ipc-0")) {
    return;
  }

  var client: RichPresence | null;

  denops.dispatcher = {
    async connect(): Promise<unknown> {
      client = await createClient();
      await client.login("793271441293967371"); // Neovim client id

      const filetype = (await options.get(denops, "filetype")) || "unknown";
      await client.setActivity({
        details: "dpresence",
        state: `Editing ${filetype} file...`,
        assets: {
          large_image: "neovim",
        },
      });
      return await Promise.resolve();
    },
    async disconnect(): Promise<unknown> {
      await client?.close();
      client = null;
      return await Promise.resolve();
    },
  };

  await execute(
    denops,
    `
    command! DPresenceConnect call denops#request('${denops.name}', 'connect', [])
    command! DPresenceDisconnect call denops#request('${denops.name}', 'disconnect', [])`,
  );
}
