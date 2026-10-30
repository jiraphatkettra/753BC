import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { isUserAdmin } from "../env";
import { embedService } from "../services/embedService";
import { eventService } from "../services/eventService";
import { walletService } from "../services/walletService";
import { dropEngine } from "../services/dropEngine";
import prisma from "@candy/shared";

export const CANDY_COMMAND_DEFINITION = new SlashCommandBuilder()
  .setName("candy")
  .setDescription("753BC Trick or Treat Event System")
  // User Commands
  .addSubcommand((sub) =>
    sub
      .setName("balance")
      .setDescription("ดูกระเป๋าลูกอมและมูลค่าเงินสดของคุณ")
      .addUserOption((opt) => opt.setName("user").setDescription("ดูยอดของผู้ใช้อื่น (สำหรับแอดมิน/ตรวจสอบ)"))
  )
  .addSubcommand((sub) => sub.setName("leaderboard").setDescription("ดูกระดานผู้นำ Top 10 ผู้ล่าลูกอมสูงสุด"))
  .addSubcommand((sub) => sub.setName("history").setDescription("ดูประวัติ 10 รายการรับและแลกลูกอมล่าสุด"))
  .addSubcommand((sub) => sub.setName("rules").setDescription("เปิดหนังสือกติกาของกิจกรรม"))
  .addSubcommand((sub) => sub.setName("redeem").setDescription("เปิดข้อมูลและฟอร์มขอแลกลูกอมเป็นเงินจริง"))
  // Admin Commands
  .addSubcommandGroup((group) =>
    group
      .setName("event")
      .setDescription("จัดการสถานะกิจกรรม (Admin)")
      .addSubcommand((sub) => sub.setName("status").setDescription("ดูสถานะ งบประมาณ และตัวเลข Telemetry"))
      .addSubcommand((sub) => sub.setName("start").setDescription("เริ่มต้นกิจกรรมทันที"))
      .addSubcommand((sub) =>
        sub
          .setName("pause")
          .setDescription("หยุดกิจกรรมชั่วคราว")
          .addStringOption((opt) => opt.setName("reason").setDescription("สาเหตุการพักกิจกรรม"))
      )
      .addSubcommand((sub) =>
        sub
          .setName("resume")
          .setDescription("เปิดดำเนินกิจกรรมต่อ")
          .addStringOption((opt) => opt.setName("reason").setDescription("ข้อความประกาศ"))
      )
      .addSubcommand((sub) => sub.setName("end").setDescription("สิ้นสุดกิจกรรมและประกาศสรุปยอด"))
  )
  .addSubcommandGroup((group) =>
    group
      .setName("drop")
      .setDescription("จัดการการดรอปลูกอม (Admin)")
      .addSubcommand((sub) =>
        sub
          .setName("now")
          .setDescription("ดรอปลูกอมทันที")
          .addChannelOption((opt) =>
            opt
              .setName("channel")
              .setDescription("ห้องที่ต้องการดรอป")
              .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          )
          .addIntegerOption((opt) => opt.setName("amount").setDescription("จำนวนลูกอม (บาท)").setMinValue(1))
          .addIntegerOption((opt) => opt.setName("claimers").setDescription("จำนวนคนที่เก็บได้").setMinValue(1))
      )
  )
  .addSubcommandGroup((group) =>
    group
      .setName("channel")
      .setDescription("จัดการห้องที่อนุญาตให้ดรอป (Admin)")
      .addSubcommand((sub) =>
        sub
          .setName("add")
          .setDescription("เพิ่มห้องดรอป")
          .addChannelOption((opt) =>
            opt
              .setName("channel")
              .setDescription("ห้องข้อความ")
              .setRequired(true)
              .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          )
          .addIntegerOption((opt) => opt.setName("weight").setDescription("ค่าน้ำหนักสุ่ม (ดีฟอลต์ 1)").setMinValue(1))
      )
      .addSubcommand((sub) =>
        sub
          .setName("remove")
          .setDescription("ลบห้องดรอป")
          .addChannelOption((opt) =>
            opt
              .setName("channel")
              .setDescription("ห้องข้อความ")
              .setRequired(true)
              .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          )
      )
      .addSubcommand((sub) => sub.setName("list").setDescription("ดูรายชื่อห้องดรอปทั้งหมด"))
  )
  .addSubcommand((sub) =>
    sub
      .setName("give")
      .setDescription("เพิ่มลูกอมให้ผู้เล่น (Admin)")
      .addUserOption((opt) => opt.setName("user").setDescription("ผู้เล่นที่ต้องการให้").setRequired(true))
      .addIntegerOption((opt) => opt.setName("amount").setDescription("จำนวนลูกอม").setRequired(true).setMinValue(1))
      .addStringOption((opt) => opt.setName("reason").setDescription("เหตุผล (บันทึกลง Ledger)").setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName("take")
      .setDescription("หักลูกอมจากผู้เล่น (Admin)")
      .addUserOption((opt) => opt.setName("user").setDescription("ผู้เล่นที่ต้องการหัก").setRequired(true))
      .addIntegerOption((opt) => opt.setName("amount").setDescription("จำนวนลูกอม").setRequired(true).setMinValue(1))
      .addStringOption((opt) => opt.setName("reason").setDescription("เหตุผล (บันทึกลง Ledger)").setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName("block")
      .setDescription("ระงับสิทธิ์ผู้เล่น (Admin)")
      .addUserOption((opt) => opt.setName("user").setDescription("ผู้เล่น").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("เหตุผล").setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName("unblock")
      .setDescription("ปลดระงับสิทธิ์ผู้เล่น (Admin)")
      .addUserOption((opt) => opt.setName("user").setDescription("ผู้เล่น").setRequired(true))
  )
  .addSubcommand((sub) =>
    sub
      .setName("panel")
      .setDescription("โพสต์ข้อความพาเนลลงห้อง (Admin)")
      .addStringOption((opt) =>
        opt
          .setName("template")
          .setDescription("Template Key ที่ต้องการโพสต์")
          .setRequired(true)
          .addChoices(
            { name: "Main Hub (ศูนย์กิจกรรม)", value: "candy_panel_main" },
            { name: "หนังสือกติกา (Rulebook Pager)", value: "candy_rules" },
            { name: "ข้อมูลการแลกเงิน", value: "candy_redeem_info" }
          )
      )
      .addChannelOption((opt) =>
        opt
          .setName("channel")
          .setDescription("ห้องที่ต้องการโพสต์")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      )
  )
  .addSubcommand((sub) => sub.setName("reload").setDescription("รีโหลด Config และ Embed Templates ทันที (Admin)"));

export async function handleCandyCommand(interaction: ChatInputCommandInteraction) {
  const subGroup = interaction.options.getSubcommandGroup(false);
  const sub = interaction.options.getSubcommand();
  const userId = interaction.user.id;
  const memberRoles = (interaction.member?.roles as any)?.cache?.map((r: any) => r.id) || [];
  const isAdmin = isUserAdmin(userId, memberRoles);

  // 1. Balance
  if (sub === "balance") {
    await interaction.deferReply({ ephemeral: true });
    const targetUser = interaction.options.getUser("user") || interaction.user;
    const wallet = await walletService.getOrCreateWallet(targetUser.id, targetUser.username, targetUser.displayAvatarURL());
    const rank = await walletService.getUserRank(targetUser.id);
    const pendingRedeem = await prisma.candyRedemption.findFirst({
      where: { discordId: targetUser.id, status: "PENDING" },
    });

    const rendered = embedService.render("candy_balance", {
      user: `<@${targetUser.id}>`,
      balance: wallet.balance,
      baht: wallet.balance,
      totalEarned: wallet.totalEarned,
      claimCount: wallet.claimCount,
      rank: rank ? `#${rank}` : "ยังไม่มีอันดับ",
      redeemStatus: pendingRedeem ? `⏳ รอโอน ฿${pendingRedeem.bahtAmount}` : "ปกติ",
    }, 0, { userId });

    return interaction.editReply(rendered);
  }

  // 2. Leaderboard
  if (sub === "leaderboard") {
    await interaction.deferReply({ ephemeral: false });
    const topWallets = await prisma.candyWallet.findMany({
      orderBy: { totalEarned: "desc" },
      take: 10,
    });
    const userRank = await walletService.getUserRank(userId);

    const rows =
      topWallets.length === 0
        ? "ยังไม่มีข้อมูลผู้ล่าลูกอม"
        : topWallets
            .map((w, idx) => {
              const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `[#${idx + 1}]`;
              const name = (w.displayName || w.username || w.discordId).padEnd(16, " ");
              return `${medal} ${name} : ${w.totalEarned} 🍬 (฿${w.totalEarned})`;
            })
            .join("\n");

    const rendered = embedService.render("candy_leaderboard", {
      rows,
      rank: userRank ? `${userRank}` : "-",
      user: `<@${userId}>`,
    }, 0, { userId });

    return interaction.editReply(rendered);
  }

  // 3. History
  if (sub === "history") {
    await interaction.deferReply({ ephemeral: true });
    const ledgers = await prisma.candyLedger.findMany({
      where: { discordId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const rows =
      ledgers.length === 0
        ? "ยังไม่มีประวัติการรับหรือแลกลูกอม"
        : ledgers
            .map((l) => {
              const sign = l.delta >= 0 ? "+" : "";
              const time = new Date(l.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
              return `[${time}] ${sign}${l.delta} 🍬 | คงเหลือ: ${l.balanceAfter} (${l.reason || l.type})`;
            })
            .join("\n");

    const rendered = embedService.render("candy_history", {
      rows,
      user: `<@${userId}>`,
    }, 0, { userId });

    return interaction.editReply(rendered);
  }

  // 4. Rules
  if (sub === "rules") {
    await interaction.deferReply({ ephemeral: true });
    const rendered = embedService.render("candy_rules", {}, 0, { userId, templateKey: "candy_rules" });
    return interaction.editReply(rendered);
  }

  // 5. Redeem Info
  if (sub === "redeem") {
    await interaction.deferReply({ ephemeral: true });
    const isRedeemOpen = await eventService.isRedeemOpen();
    if (!isRedeemOpen) {
      const closedRendered = embedService.render("candy_redeem_closed", {}, 0, { userId });
      return interaction.editReply(closedRendered);
    }

    const config = await eventService.getConfig();
    const rendered = embedService.render("candy_redeem_info", {
      minRedeem: config.redeem.minRedeem,
      maxRedeem: config.redeem.maxRedeem || "ไม่จำกัด",
      bahtPerCandy: 1,
    }, 0, { userId });

    return interaction.editReply(rendered);
  }

  // ADMIN CHECK for all other commands
  if (!isAdmin) {
    return interaction.reply({
      content: "❌ คุณไม่มีสิทธิ์ในการใช้งานคำสั่งสำหรับผู้ดูแลระบบ",
      ephemeral: true,
    });
  }

  // 6. Admin Event Group
  if (subGroup === "event") {
    await interaction.deferReply({ ephemeral: true });
    if (sub === "status") {
      const activeEvent = await eventService.getActiveEvent();
      if (!activeEvent) {
        return interaction.editReply({ content: "⚠️ ไม่มีกิจกรรมที่เปิดหรือกำหนดเวลาอยู่ในขณะนี้" });
      }
      const dropsCount = await prisma.candyDrop.count({ where: { eventId: activeEvent.id } });
      const rendered = embedService.render("candy_admin_status", {
        status: activeEvent.status,
        budgetTotal: activeEvent.budgetTotal,
        budgetClaimed: activeEvent.budgetClaimed,
        budgetReserved: activeEvent.budgetReserved,
        dropsCount,
      }, 0, { userId });
      return interaction.editReply(rendered);
    }

    if (sub === "start") {
      const res = await eventService.startEvent(userId);
      const rendered = embedService.render(res.success ? "candy_admin_ok" : "candy_admin_error", {
        message: res.message,
      }, 0, { userId });
      return interaction.editReply(rendered);
    }

    if (sub === "pause") {
      const reason = interaction.options.getString("reason") || "ผู้ดูแลสั่งหยุดกิจกรรมชั่วคราว";
      const res = await eventService.pauseEvent(userId, reason);
      const rendered = embedService.render(res.success ? "candy_admin_ok" : "candy_admin_error", {
        message: res.message,
      }, 0, { userId });
      return interaction.editReply(rendered);
    }

    if (sub === "resume") {
      const reason = interaction.options.getString("reason") || "กิจกรรมกลับมาเปิดให้บริการต่อ";
      const res = await eventService.resumeEvent(userId, reason);
      const rendered = embedService.render(res.success ? "candy_admin_ok" : "candy_admin_error", {
        message: res.message,
      }, 0, { userId });
      return interaction.editReply(rendered);
    }

    if (sub === "end") {
      const res = await eventService.endEvent(userId);
      const rendered = embedService.render(res.success ? "candy_admin_ok" : "candy_admin_error", {
        message: res.message,
      }, 0, { userId });
      return interaction.editReply(rendered);
    }
  }

  // 7. Admin Drop Now
  if (subGroup === "drop" && sub === "now") {
    await interaction.deferReply({ ephemeral: true });
    const targetChannel = interaction.options.getChannel("channel") || interaction.channel;
    const amount = interaction.options.getInteger("amount") || 1;
    const claimers = interaction.options.getInteger("claimers") || 1;

    if (!targetChannel || !("send" in targetChannel)) {
      return interaction.editReply({ content: "❌ ช่องข้อความไม่ถูกต้อง" });
    }

    const dropRes = await dropEngine.triggerManualDrop(targetChannel.id, amount, claimers, userId);
    const rendered = embedService.render(dropRes.success ? "candy_admin_ok" : "candy_admin_error", {
      message: dropRes.message,
    }, 0, { userId });
    return interaction.editReply(rendered);
  }

  // 8. Admin Channel Group
  if (subGroup === "channel") {
    await interaction.deferReply({ ephemeral: true });
    const activeEvent = await eventService.getActiveEvent();
    if (!activeEvent) {
      return interaction.editReply({ content: "⚠️ ยังไม่มีกิจกรรม โปรดสร้างหรือเริ่มกิจกรรมก่อน" });
    }

    if (sub === "add") {
      const ch = interaction.options.getChannel("channel", true);
      const weight = interaction.options.getInteger("weight") || 1;
      await prisma.candyChannel.upsert({
        where: { eventId_channelId: { eventId: activeEvent.id, channelId: ch.id } },
        create: { eventId: activeEvent.id, channelId: ch.id, name: ch.name, weight, enabled: true },
        update: { name: ch.name, weight, enabled: true },
      });
      return interaction.editReply({ content: `✅ เพิ่มห้อง <#${ch.id}> เข้าสู่รายการดรอปสำเร็จ (Weight: ${weight})` });
    }

    if (sub === "remove") {
      const ch = interaction.options.getChannel("channel", true);
      await prisma.candyChannel.deleteMany({
        where: { eventId: activeEvent.id, channelId: ch.id },
      });
      return interaction.editReply({ content: `✅ ลบห้อง <#${ch.id}> ออกจากรายการดรอปแล้ว` });
    }

    if (sub === "list") {
      const channels = await prisma.candyChannel.findMany({ where: { eventId: activeEvent.id } });
      const text = channels.length === 0 ? "ยังไม่มีห้องดรอปที่เปิดใช้งาน" : channels.map((c) => `- <#${c.channelId}> (Weight: ${c.weight}, ${c.enabled ? "เปิด" : "ปิด"})`).join("\n");
      return interaction.editReply({ content: `📋 **ห้องที่ดรอปลูกอมได้:**\n${text}` });
    }
  }

  // 9. Admin Give / Take
  if (sub === "give" || sub === "take") {
    await interaction.deferReply({ ephemeral: true });
    const targetUser = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);
    const reason = interaction.options.getString("reason", true);

    const delta = sub === "give" ? amount : -amount;
    const res = await walletService.adjustBalance(targetUser.id, delta, reason, userId);
    const rendered = embedService.render(res.success ? "candy_admin_ok" : "candy_admin_error", {
      message: res.message,
    }, 0, { userId });
    return interaction.editReply(rendered);
  }

  // 10. Admin Block / Unblock
  if (sub === "block") {
    await interaction.deferReply({ ephemeral: true });
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);
    await walletService.blockUser(targetUser.id, reason, userId);
    return interaction.editReply({ content: `🚫 ระงับสิทธิ์ <@${targetUser.id}> เรียบร้อยแล้ว (${reason})` });
  }

  if (sub === "unblock") {
    await interaction.deferReply({ ephemeral: true });
    const targetUser = interaction.options.getUser("user", true);
    await walletService.unblockUser(targetUser.id, userId);
    return interaction.editReply({ content: `✅ ปลดระงับสิทธิ์ <@${targetUser.id}> เรียบร้อยแล้ว` });
  }

  // 11. Admin Panel Post
  if (sub === "panel") {
    await interaction.deferReply({ ephemeral: true });
    const templateKey = interaction.options.getString("template", true);
    const targetChannel = interaction.options.getChannel("channel", true);

    if (!("send" in targetChannel)) {
      return interaction.editReply({ content: "❌ ช่องข้อความไม่ถูกต้อง" });
    }

    const rendered = embedService.render(templateKey, {}, 0, { userId, templateKey });
    const sentMsg = await (targetChannel as any).send(rendered);

    await prisma.candyPostedMessage.upsert({
      where: { channelId_messageId: { channelId: targetChannel.id, messageId: sentMsg.id } },
      create: { templateKey, channelId: targetChannel.id, messageId: sentMsg.id, createdBy: userId },
      update: { templateKey },
    });

    return interaction.editReply({ content: `✅ โพสต์พาเนล **${templateKey}** ลงห้อง <#${targetChannel.id}> เรียบร้อยแล้ว` });
  }

  // 12. Admin Reload
  if (sub === "reload") {
    await interaction.deferReply({ ephemeral: true });
    await embedService.reloadTemplates();
    await eventService.syncEvent();
    return interaction.editReply({ content: "🔄 รีโหลด Config และ Embed Templates ทั้งหมดจากฐานข้อมูลเรียบร้อยแล้ว" });
  }

  return interaction.reply({ content: "คำสั่งไม่ถูกต้อง", ephemeral: true });
}

