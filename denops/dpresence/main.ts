import { Denops } from "https://deno.land/x/denops_std@v1.10.0/mod.ts";
import { execute } from "https://deno.land/x/denops_std@v1.10.0/helper/mod.ts";
import { options } from "https://deno.land/x/denops_std@v1.10.0/variable/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v1.10.0/autocmd/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v1.10.0/function/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v1.10.0/variable/mod.ts";
import { existsSync } from "https://deno.land/x/std@0.106.0/fs/mod.ts";
import {
  createClient,
  RichPresence,
} from "https://deno.land/x/discord_rpc@0.1.0/mod.ts";

export async function main(denops: Denops): Promise<void> {
  let client: RichPresence | null;

  denops.dispatcher = {
    async connect(): Promise<void> {
      if (!existsSync("/run/user/1000/discord-ipc-0")) {
        return;
      }

      client = await createClient();
      if (fn.has(denops, "nvim")) {
        await client.login("886135498421198868"); // Neovim client id
      } else {
        await client.login("886135998889721906"); // Vim client id
      }

      await execute(
        denops,
        `call denops#request('${denops.name}', 'update', [])`
      );
    },
    async update(): Promise<void> {
      const filetype = (await options.get(denops, "filetype")) || "unknown";

      await client?.setActivity({
        details: "dpresence",
        state: `Editing ${filetype} file...`,
        assets: {
          large_image: fn.has(denops, "nvim") ? "nvim" : "vim",
        },
      });
    },
    async disconnect(): Promise<void> {
      await client?.close();
      client = null;
    },
    async register_autocmds(): Promise<void> {
      await autocmd.group(denops, "dpresence_init", (helper) => {
        helper.remove("*", "<buffer>");
        helper.define(
          [
            "FocusGained",
            "TextChanged",
            "WinEnter",
            "WinLeave",
            "BufEnter",
            "BufAdd",
          ],
          "*",
          `call denops#request('${denops.name}', 'update', [])`,
        );
      });
    },
  };

  await execute(
    denops,
    `
    call denops#request('${denops.name}', 'register_autocmds', [])
    command! DpresenceConnect call denops#request('${denops.name}', 'connect', [])
    command! DpresenceDisconnect call denops#request('${denops.name}', 'disconnect', [])`,
  );
}
