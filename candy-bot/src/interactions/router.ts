import {
  Interaction,
  ButtonInteraction,
  ModalSubmitInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { CANDY_INTERACTION_PREFIX, CANDY_INTERACTION_TYPES } from "@candy/shared";
import prisma from "@candy/shared";
import { claimService } from "../services/claimService";
import { embedService } from "../services/embedService";
import { eventService } from "../services/eventService";
import { walletService } from "../services/walletService";

export async function handleInteraction(interaction: Interaction) {
  // RULE R5: Ignore everything not starting with candy:
  if (interaction.isButton()) {
    if (!interaction.customId.startsWith(CANDY_INTERACTION_PREFIX)) return;
    await handleButtonInteraction(interaction);
    return;
  }

  if (interaction.isModalSubmit()) {
    if (!interaction.customId.startsWith(CANDY_INTERACTION_PREFIX)) return;
    await handleModalSubmitInteraction(interaction);
    return;
  }
}

async function handleButtonInteraction(interaction: ButtonInteraction) {
  const customId = interaction.customId;
  const userId = interaction.user.id;

  // 1. Claim button
  if (customId.startsWith(CANDY_INTERACTION_TYPES.CLAIM)) {
    await interaction.deferReply({ ephemeral: true });
    const dropId = customId.replace(CANDY_INTERACTION_TYPES.CLAIM, "");
    if (dropId === "preview") {
      return interaction.editReply({ content: "🍬 นี่คือข้อความพรีวิวตัวอย่าง ไม่สามารถเก็บจริงได้" });
    }
    return claimService.handleClaimInteraction(interaction, dropId);
  }

  // 2. Pager buttons: candy:pg:<templateKey>:<pageIdx>
  if (customId.startsWith(CANDY_INTERACTION_TYPES.PAGER)) {
    await interaction.deferUpdate();
    const parts = customId.replace(CANDY_INTERACTION_TYPES.PAGER, "").split(":");
    const templateKey = parts[0];
    const pageIdx = parseInt(parts[1], 10) || 0;

    const rendered = embedService.render(templateKey, {}, pageIdx, { userId, templateKey });
    return interaction.editReply(rendered);
  }

  // 3. Panel Action Buttons: candy:btn:<action>
  if (customId.startsWith(CANDY_INTERACTION_TYPES.BTN)) {
    const action = customId.replace(CANDY_INTERACTION_TYPES.BTN, "");

    // Balance
    if (action === "balance") {
      await interaction.deferReply({ ephemeral: true });
      const wallet = await walletService.getOrCreateWallet(userId, interaction.user.username, interaction.user.displayAvatarURL());
      const rank = await walletService.getUserRank(userId);
      const pendingRedeem = await prisma.candyRedemption.findFirst({
        where: { discordId: userId, status: "PENDING" },
      });

      const rendered = embedService.render("candy_balance", {
        user: `<@${userId}>`,
        balance: wallet.balance,
        baht: wallet.balance,
        totalEarned: wallet.totalEarned,
        claimCount: wallet.claimCount,
        rank: rank ? `#${rank}` : "ยังไม่มีอันดับ",
        redeemStatus: pendingRedeem ? `⏳ รอโอน ฿${pendingRedeem.bahtAmount}` : "ปกติ",
      }, 0, { userId });
      return interaction.editReply(rendered);
    }

    // Leaderboard
    if (action === "leaderboard") {
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

    // Rules
    if (action === "rules") {
      await interaction.deferReply({ ephemeral: true });
      const rendered = embedService.render("candy_rules", {}, 0, { userId, templateKey: "candy_rules" });
      return interaction.editReply(rendered);
    }

    // History
    if (action === "history") {
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

    // Redeem Modal opener
    if (action === "redeem") {
      const isRedeemOpen = await eventService.isRedeemOpen();
      if (!isRedeemOpen) {
        await interaction.deferReply({ ephemeral: true });
        const closedRendered = embedService.render("candy_redeem_closed", {}, 0, { userId });
        return interaction.editReply(closedRendered);
      }

      // Check user wallet
      const wallet = await prisma.candyWallet.findUnique({ where: { discordId: userId } });
      const config = await eventService.getConfig();

      if (!wallet || wallet.balance < config.redeem.minRedeem) {
        await interaction.deferReply({ ephemeral: true });
        return interaction.editReply({
          content: `❌ คุณมียอดลูกอมคงเหลือ ${wallet?.balance || 0} ลูก (ขั้นต่ำในการแลกคือ ${config.redeem.minRedeem} ลูก)`,
        });
      }

      const pending = await prisma.candyRedemption.findFirst({
        where: { discordId: userId, status: "PENDING" },
      });
      if (pending && config.redeem.onePendingOnly) {
        await interaction.deferReply({ ephemeral: true });
        return interaction.editReply({
          content: `⏳ คุณมีคำขอแลกเงินคงค้างอยู่แล้ว ฿${pending.bahtAmount} บาท (รหัส #${pending.id.slice(-6)}) โปรดรอทีมงานดำเนินการก่อน`,
        });
      }

      // Show Discord Modal
      const modal = new ModalBuilder()
        .setCustomId("candy:redeem:submit")
        .setTitle("ขอแลกลูกอมเป็นเงินจริง (1 🍬 = ฿1)");

      const amountInput = new TextInputBuilder()
        .setCustomId("amount")
        .setLabel(`จำนวนลูกอมที่ต้องการแลก (คงเหลือ ${wallet.balance})`)
        .setStyle(TextInputStyle.Short)
        .setValue(String(wallet.balance))
        .setRequired(true);

      const targetInput = new TextInputBuilder()
        .setCustomId("payoutTarget")
        .setLabel("เบอร์พร้อมเพย์ หรือ เลขบัตรประชาชน")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("08X-XXX-XXXX หรือ 13 หลัก")
        .setRequired(true);

      const nameInput = new TextInputBuilder()
        .setCustomId("accountName")
        .setLabel("ชื่อ-นามสกุลเจ้าของบัญชีพร้อมเพย์")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("นาย/นาง/นางสาว...")
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(amountInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(targetInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput)
      );

      return interaction.showModal(modal);
    }
  }
}

async function handleModalSubmitInteraction(interaction: ModalSubmitInteraction) {
  if (interaction.customId === "candy:redeem:submit") {
    await interaction.deferReply({ ephemeral: true });
    const userId = interaction.user.id;
    const amountStr = interaction.fields.getTextInputValue("amount").trim();
    const payoutTarget = interaction.fields.getTextInputValue("payoutTarget").trim();
    const accountName = interaction.fields.getTextInputValue("accountName").trim();

    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) {
      return interaction.editReply({ content: "❌ จำนวนลูกอมต้องเป็นตัวเลขจำนวนเต็มบวก" });
    }

    const config = await eventService.getConfig();
    if (amount < config.redeem.minRedeem) {
      return interaction.editReply({ content: `❌ จำนวนขั้นต่ำในการขอแลกคือ ${config.redeem.minRedeem} ลูกอม` });
    }
    if (config.redeem.maxRedeem && amount > config.redeem.maxRedeem) {
      return interaction.editReply({ content: `❌ จำนวนสูงสุดในการขอแลกคือ ${config.redeem.maxRedeem} ลูกอม` });
    }

    try {
      const redemption = await prisma.$transaction(async (tx) => {
        const wallet = await tx.candyWallet.findUnique({ where: { discordId: userId } });
        if (!wallet || wallet.balance < amount) {
          throw new Error("ยอดลูกอมคงเหลือไม่เพียงพอ");
        }
        if (wallet.blocked) {
          throw new Error("บัญชีถูกระงับสิทธิ์");
        }

        const pending = await tx.candyRedemption.findFirst({
          where: { discordId: userId, status: "PENDING" },
        });
        if (pending && config.redeem.onePendingOnly) {
          throw new Error("คุณมีคำขอแลกเงินค้างอยู่แล้ว");
        }

        const newBalance = wallet.balance - amount;
        await tx.candyWallet.update({
          where: { discordId: userId },
          data: {
            balance: newBalance,
            totalRedeemed: { increment: amount },
          },
        });

        const redRecord = await tx.candyRedemption.create({
          data: {
            discordId: userId,
            amount,
            bahtAmount: amount * 1, // 1 Candy = 1 THB
            payoutMethod: "PROMPTPAY",
            payoutTarget,
            accountName,
            status: "PENDING",
          },
        });

        await tx.candyLedger.create({
          data: {
            discordId: userId,
            delta: -amount,
            balanceAfter: newBalance,
            type: "REDEEM_HOLD",
            refType: "redemption",
            refId: redRecord.id,
            reason: `Hold ลูกอมสำหรับคำขอแลก ฿${amount} (#${redRecord.id.slice(-6)})`,
            actor: userId,
          },
        });

        return redRecord;
      });

      const rendered = embedService.render("candy_redeem_submitted", {
        user: `<@${userId}>`,
        amount: redemption.amount,
        baht: redemption.bahtAmount,
        payoutTarget: redemption.payoutTarget,
        accountName: redemption.accountName || "ไม่ระบุ",
        redemptionId: redemption.id.slice(-6),
      }, 0, { userId });

      return interaction.editReply(rendered);
    } catch (err: any) {
      return interaction.editReply({ content: `❌ ไม่สามารถส่งคำขอแลกเงินได้: ${err.message}` });
    }
  }
}

