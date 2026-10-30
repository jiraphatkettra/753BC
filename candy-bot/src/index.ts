import { client } from "./client";
import { ENV, validateEnv } from "./env";
import { embedService } from "./services/embedService";
import { eventService } from "./services/eventService";
import { voiceTracker } from "./services/voiceTracker";
import { activityTracker } from "./services/activityTracker";
import { dropEngine } from "./services/dropEngine";
import { commandQueue } from "./services/commandQueue";
import { heartbeatService } from "./services/heartbeat";
import { handleCandyCommand } from "./commands/candy";
import { handleInteraction } from "./interactions/router";

async function main() {
  console.log("-----------------------------------------");
  console.log("🎃 753BC Trick or Treat CandyBot Starting...");
  console.log("-----------------------------------------");

  validateEnv();

  // 1. Initialize DB Cache & Seed Embeds
  await embedService.init();
  await eventService.init();

  // 2. Client Event Listeners
  client.once("ready", async () => {
    console.log(`[CandyBot] Logged in as ${client.user?.tag} (ID: ${client.user?.id})`);

    const guild = client.guilds.cache.get(ENV.GUILD_ID);
    if (guild) {
      console.log(`[CandyBot] Connected to target Guild: ${guild.name} (${guild.id})`);
      voiceTracker.initFromGuild(guild);
    } else {
      console.warn(`[CandyBot] Target guild ${ENV.GUILD_ID} not found in client cache yet.`);
    }

    // Startup recovery for expired drops
    await dropEngine.initRecovery();

    // Setup periodic jobs
    setInterval(() => dropEngine.tick(), 5000);
    setInterval(() => dropEngine.sweeper(), 5000);
    setInterval(() => commandQueue.poll(), 2000);
    setInterval(() => eventService.checkScheduledTransitions(), 2000);
    setInterval(() => heartbeatService.beat(), 10000);
    setInterval(() => embedService.reloadTemplates(), 10000);

    // Initial heartbeat
    await heartbeatService.beat();
    console.log("[CandyBot] All background engines, sweepers, and telemetry jobs started.");
  });

  // 3. Interactions Listener
  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "candy") {
          await handleCandyCommand(interaction);
        }
        return;
      }

      await handleInteraction(interaction);
    } catch (err: any) {
      console.error("[CandyBot] Unhandled interaction error:", err);
      if (interaction.isRepliable() && !interaction.replied) {
        if (interaction.deferred) {
          await interaction.editReply({ content: "⚠️ เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง" }).catch(() => {});
        } else {
          await interaction.reply({ content: "⚠️ เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง", ephemeral: true }).catch(() => {});
        }
      }
    }
  });

  // 4. Voice States Listener
  client.on("voiceStateUpdate", (oldState, newState) => {
    voiceTracker.handleVoiceStateUpdate(oldState, newState);
  });

  // 5. Activity Tracker Listener (human messages in text channels)
  client.on("messageCreate", (msg) => {
    activityTracker.recordMessage(msg);
  });

  // 6. Graceful shutdown
  const shutdown = async () => {
    console.log("\n[CandyBot] Shutting down gracefully...");
    client.destroy();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // 7. Login
  await client.login(ENV.BOT_TOKEN);
}

main().catch((err) => {
  console.error("[CandyBot] Fatal startup crash:", err);
  process.exit(1);
});

