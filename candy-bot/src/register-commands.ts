import { REST, Routes } from "discord.js";
import { ENV, validateEnv } from "./env";
import { CANDY_COMMAND_DEFINITION } from "./commands/candy";

async function main() {
  validateEnv();
  const rest = new REST({ version: "10" }).setToken(ENV.BOT_TOKEN);

  console.log(`[CandyBot] Checking existing guild commands for guild ${ENV.GUILD_ID}...`);

  // Fetch all existing commands in the guild
  const existingCommands: any = await rest.get(
    Routes.applicationGuildCommands(ENV.CLIENT_ID, ENV.GUILD_ID)
  );

  const existingCandy = existingCommands.find((cmd: any) => cmd.name === "candy");

  if (existingCandy) {
    console.log(`[CandyBot] Found existing /candy command (ID: ${existingCandy.id}). Updating via PATCH (preserving other bot commands)...`);
    await rest.patch(
      Routes.applicationGuildCommand(ENV.CLIENT_ID, ENV.GUILD_ID, existingCandy.id),
      { body: CANDY_COMMAND_DEFINITION.toJSON() }
    );
    console.log(`[CandyBot] Successfully updated /candy command!`);
  } else {
    console.log(`[CandyBot] /candy command not found in guild. Creating via POST (preserving other bot commands)...`);
    await rest.post(
      Routes.applicationGuildCommands(ENV.CLIENT_ID, ENV.GUILD_ID),
      { body: CANDY_COMMAND_DEFINITION.toJSON() }
    );
    console.log(`[CandyBot] Successfully registered /candy command!`);
  }
}

main().catch((err) => {
  console.error("[CandyBot] Failed to register /candy command:", err);
  process.exit(1);
});

