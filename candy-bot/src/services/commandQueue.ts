import prisma from "@candy/shared";
import { client } from "../client";
import { eventService } from "./eventService";
import { dropEngine } from "./dropEngine";
import { embedService } from "./embedService";

class CommandQueue {
  private isProcessing = false;

  async poll() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingCmds = await prisma.candyCommand.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: 5,
      });

      for (const cmd of pendingCmds) {
        await this.executeCommand(cmd);
      }
    } catch (err) {
      console.error("[CommandQueue] poll error:", err);
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeCommand(cmd: any) {
    await prisma.candyCommand.update({
      where: { id: cmd.id },
      data: { status: "PROCESSING" },
    });

    try {
      const payload: any = cmd.payload || {};
      let result: any = null;

      switch (cmd.type) {
        case "EVENT_START": {
          result = await eventService.startEvent(cmd.createdBy || "web-admin");
          break;
        }
        case "EVENT_PAUSE": {
          result = await eventService.pauseEvent(cmd.createdBy || "web-admin", payload.reason || "Paused from Dashboard");
          break;
        }
        case "EVENT_RESUME": {
          result = await eventService.resumeEvent(cmd.createdBy || "web-admin", payload.reason || "Resumed from Dashboard");
          break;
        }
        case "EVENT_END": {
          result = await eventService.endEvent(cmd.createdBy || "web-admin");
          break;
        }
        case "DROP_NOW": {
          result = await dropEngine.triggerManualDrop(
            payload.channelId,
            payload.amount || 1,
            payload.maxClaimers || 1,
            cmd.createdBy || "web-admin"
          );
          break;
        }
        case "DROP_CANCEL": {
          const drop = await prisma.candyDrop.findUnique({ where: { id: payload.dropId } });
          if (drop && drop.status === "ACTIVE") {
            const unclaimed = (drop.maxClaimers - drop.claimedCount) * drop.amount;
            await prisma.$transaction([
              prisma.candyDrop.update({ where: { id: drop.id }, data: { status: "CANCELLED" } }),
              prisma.candyEvent.update({ where: { id: drop.eventId }, data: { budgetReserved: { decrement: unclaimed } } }),
            ]);
            result = { success: true, message: "ยกเลิกดรอปและคืนงบเรียบร้อยแล้ว" };
          } else {
            result = { success: false, message: "ดรอปไม่อยู่ในสถานะ ACTIVE" };
          }
          break;
        }
        case "RELOAD": {
          await embedService.reloadTemplates();
          await eventService.syncEvent();
          result = { success: true, message: "รีโหลดเรียบร้อยแล้ว" };
          break;
        }
        case "TEST_SEND": {
          const channel: any = await client.channels.fetch(payload.channelId);
          if (channel && "send" in channel) {
            const rendered = embedService.render(payload.templateKey, payload.sampleVars || {}, 0, {
              userId: cmd.createdBy,
              templateKey: payload.templateKey,
            });
            await channel.send(rendered);
            result = { success: true, message: "ส่งทดสอบเรียบร้อยแล้ว" };
          } else {
            throw new Error("Channel not found or not text channel");
          }
          break;
        }
        case "POST_TEMPLATE": {
          const channel: any = await client.channels.fetch(payload.channelId);
          if (channel && "send" in channel) {
            const rendered = embedService.render(payload.templateKey, payload.vars || {}, 0, {
              userId: cmd.createdBy,
              templateKey: payload.templateKey,
            });
            const sent = await channel.send(rendered);
            await prisma.candyPostedMessage.upsert({
              where: { channelId_messageId: { channelId: payload.channelId, messageId: sent.id } },
              create: { templateKey: payload.templateKey, channelId: payload.channelId, messageId: sent.id, createdBy: cmd.createdBy },
              update: { templateKey: payload.templateKey },
            });
            result = { success: true, messageId: sent.id };
          } else {
            throw new Error("Channel not found or not text channel");
          }
          break;
        }
        case "EDIT_POSTED": {
          const posted = await prisma.candyPostedMessage.findUnique({
            where: { channelId_messageId: { channelId: payload.channelId, messageId: payload.messageId } },
          });
          if (posted) {
            const channel: any = await client.channels.fetch(payload.channelId);
            if (channel && "messages" in channel) {
              const msg = await channel.messages.fetch(payload.messageId);
              if (msg) {
                const rendered = embedService.render(posted.templateKey, payload.vars || {}, 0, {
                  userId: cmd.createdBy,
                  templateKey: posted.templateKey,
                });
                await msg.edit(rendered);
                result = { success: true };
              }
            }
          }
          break;
        }
        case "NOTIFY_USER_DM": {
          const user = await client.users.fetch(payload.userId);
          if (user) {
            await user.send(payload.message);
            result = { success: true, message: `DM sent to ${payload.userId}` };
          } else {
            throw new Error(`User ${payload.userId} not found`);
          }
          break;
        }
        default:
          result = { success: false, message: `Unknown command type: ${cmd.type}` };
      }

      await prisma.candyCommand.update({
        where: { id: cmd.id },
        data: {
          status: "DONE",
          result: result || { success: true },
          doneAt: new Date(),
        },
      });
    } catch (err: any) {
      console.error(`[CommandQueue] Command ${cmd.id} (${cmd.type}) failed:`, err);
      await prisma.candyCommand.update({
        where: { id: cmd.id },
        data: {
          status: "FAILED",
          error: err.message,
          doneAt: new Date(),
        },
      });
    }
  }
}

export const commandQueue = new CommandQueue();

