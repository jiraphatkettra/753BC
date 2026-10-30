import prisma, { EventConfig, EventConfigSchema, DEFAULT_EVENT_CONFIG } from "@candy/shared";
import { client } from "../client";
import { embedService } from "./embedService";

class EventService {
  private cachedEvent: any = null;
  private lastSync: number = 0;

  async init() {
    await this.syncEvent();
  }

  async syncEvent() {
    try {
      const event = await prisma.candyEvent.findFirst({
        where: { status: { in: ["RUNNING", "PAUSED", "SCHEDULED"] } },
        include: { channels: true },
        orderBy: { startsAt: "asc" },
      });
      this.cachedEvent = event;
      this.lastSync = Date.now();
    } catch (err) {
      console.error("[EventService] Failed to sync event from DB:", err);
    }
  }

  async getActiveEvent() {
    if (!this.cachedEvent || Date.now() - this.lastSync > 10000) {
      await this.syncEvent();
    }
    return this.cachedEvent;
  }

  async getConfig(): Promise<EventConfig> {
    const event = await this.getActiveEvent();
    if (!event || !event.config) {
      return DEFAULT_EVENT_CONFIG;
    }
    const parsed = EventConfigSchema.safeParse(event.config);
    return parsed.success ? parsed.data : DEFAULT_EVENT_CONFIG;
  }

  async isRedeemOpen(): Promise<boolean> {
    try {
      const setting = await prisma.candySetting.findUnique({
        where: { key: "redeemOpen" },
      });
      return setting ? Boolean(setting.value) : false;
    } catch {
      return false;
    }
  }

  async startEvent(actorId: string): Promise<{ success: boolean; message: string }> {
    const event = await prisma.candyEvent.findFirst({
      where: { status: { in: ["DRAFT", "SCHEDULED", "PAUSED"] } },
      include: { channels: true },
    });

    if (!event) {
      return { success: false, message: "ไม่พบกิจกรรมที่พร้อมเริ่ม (ต้องสร้างกิจกรรมในหน้าเว็บก่อน)" };
    }

    if (event.budgetTotal <= 0) {
      return { success: false, message: "งบประมาณรวม (budgetTotal) ต้องมากกว่า 0 บาท" };
    }

    const enabledChannels = event.channels.filter((c) => c.enabled);
    if (enabledChannels.length === 0) {
      return { success: false, message: "ต้องกำหนดห้องข้อความสำหรับดรอปอย่างน้อย 1 ห้อง" };
    }

    const updated = await prisma.candyEvent.update({
      where: { id: event.id },
      data: { status: "RUNNING" },
      include: { channels: true },
    });
    this.cachedEvent = updated;

    await prisma.candyAuditLog.create({
      data: { actor: actorId, action: "event.start", target: event.id, meta: { budgetTotal: event.budgetTotal } },
    });

    // Send announcement if announceChannelId is set
    const config = await this.getConfig();
    if (config.announceChannelId) {
      try {
        const ch: any = await client.channels.fetch(config.announceChannelId);
        if (ch && "send" in ch) {
          const rendered = embedService.render("candy_event_start", {
            budgetTotal: event.budgetTotal,
            startsAt: `<t:${Math.floor(new Date(event.startsAt).getTime() / 1000)}:F>`,
            endsAt: `<t:${Math.floor(new Date(event.endsAt).getTime() / 1000)}:F>`,
          });
          await ch.send(rendered);
        }
      } catch (e) {
        console.error("[EventService] Failed to send start announcement:", e);
      }
    }

    return { success: true, message: `เริ่มต้นกิจกรรม '${event.name}' สำเร็จแล้ว!` };
  }

  async pauseEvent(actorId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const event = await this.getActiveEvent();
    if (!event || event.status !== "RUNNING") {
      return { success: false, message: "ไม่มีกิจกรรมที่กำลังรันอยู่" };
    }

    const updated = await prisma.candyEvent.update({
      where: { id: event.id },
      data: { status: "PAUSED" },
      include: { channels: true },
    });
    this.cachedEvent = updated;

    await prisma.candyAuditLog.create({
      data: { actor: actorId, action: "event.pause", target: event.id, meta: { reason } },
    });

    const config = await this.getConfig();
    if (config.announceChannelId) {
      try {
        const ch: any = await client.channels.fetch(config.announceChannelId);
        if (ch && "send" in ch) {
          const rendered = embedService.render("candy_event_pause", { reason });
          await ch.send(rendered);
        }
      } catch (e) {
        console.error("[EventService] Failed to send pause announcement:", e);
      }
    }

    return { success: true, message: `หยุดกิจกรรมชั่วคราวเรียบร้อยแล้ว (${reason})` };
  }

  async resumeEvent(actorId: string, reason: string): Promise<{ success: boolean; message: string }> {
    const event = await this.getActiveEvent();
    if (!event || event.status !== "PAUSED") {
      return { success: false, message: "กิจกรรมไม่ได้อยู่ในสถานะหยุดชั่วคราว" };
    }

    const updated = await prisma.candyEvent.update({
      where: { id: event.id },
      data: { status: "RUNNING" },
      include: { channels: true },
    });
    this.cachedEvent = updated;

    await prisma.candyAuditLog.create({
      data: { actor: actorId, action: "event.resume", target: event.id, meta: { reason } },
    });

    const config = await this.getConfig();
    if (config.announceChannelId) {
      try {
        const ch: any = await client.channels.fetch(config.announceChannelId);
        if (ch && "send" in ch) {
          const rendered = embedService.render("candy_event_resume", { reason });
          await ch.send(rendered);
        }
      } catch (e) {
        console.error("[EventService] Failed to send resume announcement:", e);
      }
    }

    return { success: true, message: `เปิดดำเนินกิจกรรมต่อเรียบร้อยแล้ว!` };
  }

  async endEvent(actorId: string): Promise<{ success: boolean; message: string }> {
    const event = await this.getActiveEvent();
    if (!event) {
      return { success: false, message: "ไม่พบกิจกรรมที่กำลังรันอยู่" };
    }

    const totalDrops = await prisma.candyDrop.count({ where: { eventId: event.id } });
    const topWallets = await prisma.candyWallet.findMany({
      orderBy: { totalEarned: "desc" },
      take: 5,
    });

    const topRows =
      topWallets.length === 0
        ? "ไม่มีข้อมูลผู้ล่า"
        : topWallets.map((w, idx) => `${idx + 1}. ${w.displayName || w.username || w.discordId}: ${w.totalEarned} 🍬`).join("\n");

    await prisma.candyEvent.update({
      where: { id: event.id },
      data: { status: "ENDED" },
    });
    this.cachedEvent = null;

    await prisma.candyAuditLog.create({
      data: { actor: actorId, action: "event.end", target: event.id },
    });

    const config = await this.getConfig();
    if (config.announceChannelId) {
      try {
        const ch: any = await client.channels.fetch(config.announceChannelId);
        if (ch && "send" in ch) {
          const rendered = embedService.render("candy_event_end", {
            budgetTotal: event.budgetTotal,
            totalDrops,
            totalClaimed: event.budgetClaimed,
            topRows,
          });
          await ch.send(rendered);
        }
      } catch (e) {
        console.error("[EventService] Failed to send end announcement:", e);
      }
    }

    return { success: true, message: `สิ้นสุดกิจกรรม '${event.name}' เรียบร้อยแล้ว` };
  }

  async checkScheduledTransitions() {
    const now = new Date();
    // 1. SCHEDULED -> RUNNING
    const scheduled = await prisma.candyEvent.findFirst({
      where: { status: "SCHEDULED", startsAt: { lte: now } },
      include: { channels: true },
    });
    if (scheduled && scheduled.budgetTotal > 0) {
      console.log(`[EventService] Auto-starting scheduled event '${scheduled.name}'...`);
      await this.startEvent("system");
    }

    // 2. RUNNING -> ENDED
    const running = await prisma.candyEvent.findFirst({
      where: { status: "RUNNING", endsAt: { lte: now } },
    });
    if (running) {
      console.log(`[EventService] Event '${running.name}' reached endsAt. Auto-ending event...`);
      await this.endEvent("system");
    }
  }
}

export const eventService = new EventService();

