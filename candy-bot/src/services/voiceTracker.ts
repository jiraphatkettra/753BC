import { Guild, VoiceState } from "discord.js";

interface TrackedVoiceUser {
  joinedAt: number;
  channelId: string;
  isDeafened: boolean;
}

class VoiceTracker {
  private userVoice: Map<string, TrackedVoiceUser> = new Map();

  initFromGuild(guild: Guild) {
    const now = Date.now();
    for (const [userId, vs] of guild.voiceStates.cache) {
      if (vs.channelId) {
        this.userVoice.set(userId, {
          joinedAt: now, // Safe initial timestamp on bot startup
          channelId: vs.channelId,
          isDeafened: Boolean(vs.selfDeaf || vs.serverDeaf),
        });
      }
    }
    console.log(`[VoiceTracker] Initialized ${this.userVoice.size} users currently in voice.`);
  }

  handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    const userId = newState.id;

    // 1. User left voice entirely
    if (!newState.channelId) {
      this.userVoice.delete(userId);
      return;
    }

    const isDeaf = Boolean(newState.selfDeaf || newState.serverDeaf);
    const existing = this.userVoice.get(userId);

    // 2. User changed channels but remained in voice
    if (existing && oldState.channelId && newState.channelId) {
      existing.channelId = newState.channelId;
      existing.isDeafened = isDeaf;
      // Do NOT reset joinedAt on channel switch (§6.7)
      return;
    }

    // 3. User freshly joined voice
    this.userVoice.set(userId, {
      joinedAt: Date.now(),
      channelId: newState.channelId,
      isDeafened: isDeaf,
    });
  }

  getVoiceState(guild: Guild, userId: string): {
    inVoice: boolean;
    channelId?: string;
    isAfk: boolean;
    isDeafened: boolean;
    secondsInVoice: number;
  } {
    const tracked = this.userVoice.get(userId);
    const liveVs = guild.voiceStates.cache.get(userId);

    if (!liveVs || !liveVs.channelId) {
      this.userVoice.delete(userId);
      return {
        inVoice: false,
        isAfk: false,
        isDeafened: false,
        secondsInVoice: 0,
      };
    }

    const channelId = liveVs.channelId;
    const isAfk = Boolean(guild.afkChannelId && channelId === guild.afkChannelId);
    const isDeafened = Boolean(liveVs.selfDeaf || liveVs.serverDeaf);

    let joinedAt = tracked?.joinedAt;
    if (!joinedAt) {
      joinedAt = Date.now();
      this.userVoice.set(userId, {
        joinedAt,
        channelId,
        isDeafened,
      });
    }

    const secondsInVoice = Math.max(0, Math.floor((Date.now() - joinedAt) / 1000));

    return {
      inVoice: true,
      channelId,
      isAfk,
      isDeafened,
      secondsInVoice,
    };
  }
}

export const voiceTracker = new VoiceTracker();

