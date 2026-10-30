import { Message } from "discord.js";

class ActivityTracker {
  private channelMessages: Map<string, number[]> = new Map();

  recordMessage(message: Message) {
    if (message.author.bot || message.webhookId) return;

    const channelId = message.channelId;
    const now = Date.now();
    let timestamps = this.channelMessages.get(channelId);
    if (!timestamps) {
      timestamps = [];
      this.channelMessages.set(channelId, timestamps);
    }
    timestamps.push(now);

    // Keep buffer reasonably small (clean up older than 10 mins)
    const cutoff = now - 10 * 60 * 1000;
    while (timestamps.length > 0 && timestamps[0] < cutoff) {
      timestamps.shift();
    }
  }

  getActivity(channelId: string, windowSec: number = 120): number {
    const timestamps = this.channelMessages.get(channelId);
    if (!timestamps || timestamps.length === 0) return 0;

    const cutoff = Date.now() - windowSec * 1000;
    let count = 0;
    for (let i = timestamps.length - 1; i >= 0; i--) {
      if (timestamps[i] >= cutoff) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }
}

export const activityTracker = new ActivityTracker();

