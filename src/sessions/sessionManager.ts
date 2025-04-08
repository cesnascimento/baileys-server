import { makeWASocket, useMultiFileAuthState } from "@whiskeysockets/baileys";
import * as fs from "fs";
import * as path from "path";

const sessions: Record<string, any> = {};

export async function startSession(id: string) {
  const folder = path.resolve(`./auth/${id}`);
  const { state, saveCreds } = await useMultiFileAuthState(folder);

  const sock = makeWASocket({ auth: state });
  sock.ev.on("creds.update", saveCreds);

  sessions[id] = sock;

  sock.ev.on("connection.update", async (update) => {
    if (update.qr) {
      // @ts-ignore
      const qrcode = await import("qrcode");
      // @ts-ignore
      const qrcodeTerminal = await import("qrcode-terminal");
      (sock as any).__qr = await qrcode.toDataURL(update.qr);
      qrcodeTerminal.generate(update.qr, { small: true });
    }
  });

  return sock;
}

export function getSession(id: string) {
  return sessions[id];
}

export async function logoutSession(id: string) {
  const session = sessions[id];
  if (session) {
    await session.logout();
    delete sessions[id];
    fs.rmSync(`./auth/${id}`, { recursive: true, force: true });
  }
}
