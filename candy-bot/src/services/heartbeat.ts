import prisma from "@candy/shared";
import { client } from "../client";

class HeartbeatService {
  async beat() {
    try {
      const memoryUsage = process.memoryUsage();
      const heartbeatData = {
        online: true,
        timestamp: Date.now(),
        uptimeSec: Math.floor(process.uptime()),
        memoryMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        pingMs: client.ws.ping,
        guildCount: client.guilds.cache.size,
      };

      await prisma.candySetting.upsert({
        where: { key: "bot:heartbeat" },
        create: {
          key: "bot:heartbeat",
          value: heartbeatData as any,
        },
        update: {
          value: heartbeatData as any,
        },
      });
    } catch (err) {
      // Don't crash on heartbeat write
      console.warn("[Heartbeat] Failed to write heartbeat:", err);
    }
  }
}

export const heartbeatService = new HeartbeatService();

