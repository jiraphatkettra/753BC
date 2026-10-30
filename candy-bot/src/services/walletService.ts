import prisma from "@candy/shared";

class WalletService {
  async getOrCreateWallet(discordId: string, username?: string, avatar?: string) {
    return prisma.candyWallet.upsert({
      where: { discordId },
      create: {
        discordId,
        username,
        displayName: username,
        avatar,
        balance: 0,
        totalEarned: 0,
        claimCount: 0,
      },
      update: {
        username: username || undefined,
        avatar: avatar || undefined,
      },
    });
  }

  async getUserRank(discordId: string): Promise<number | null> {
    const userWallet = await prisma.candyWallet.findUnique({
      where: { discordId },
      select: { totalEarned: true },
    });
    if (!userWallet) return null;

    const countHigher = await prisma.candyWallet.count({
      where: { totalEarned: { gt: userWallet.totalEarned } },
    });
    return countHigher + 1;
  }

  async adjustBalance(
    discordId: string,
    delta: number,
    reason: string,
    actor: string
  ): Promise<{ success: boolean; message: string; balanceAfter?: number }> {
    if (delta === 0) return { success: false, message: "จำนวนการปรับยอดต้องไม่เป็น 0" };

    return prisma.$transaction(async (tx) => {
      const wallet = await tx.candyWallet.upsert({
        where: { discordId },
        create: { discordId, balance: 0, totalEarned: 0 },
        update: {},
      });

      if (wallet.balance + delta < 0) {
        return {
          success: false,
          message: `ยอดคงเหลือไม่เพียงพอ (มียอด ฿${wallet.balance} แต่ต้องการหัก ${Math.abs(delta)})`,
        };
      }

      const newBalance = wallet.balance + delta;
      const newTotalEarned = delta > 0 ? wallet.totalEarned + delta : wallet.totalEarned;

      await tx.candyWallet.update({
        where: { discordId },
        data: {
          balance: newBalance,
          totalEarned: newTotalEarned,
        },
      });

      const ledgerType = delta > 0 ? "ADMIN_GIVE" : "ADMIN_TAKE";
      await tx.candyLedger.create({
        data: {
          discordId,
          delta,
          balanceAfter: newBalance,
          type: ledgerType,
          refType: "admin",
          refId: actor,
          reason,
          actor,
        },
      });

      await tx.candyAuditLog.create({
        data: {
          actor,
          action: "wallet.adjust",
          target: discordId,
          meta: { delta, balanceAfter: newBalance, reason },
        },
      });

      return {
        success: true,
        message: `ปรับยอดยอดคงเหลือของ <@${discordId}> สำเร็จ: ${delta > 0 ? "+" : ""}${delta} 🍬 (คงเหลือ: ${newBalance} 🍬)`,
        balanceAfter: newBalance,
      };
    });
  }

  async blockUser(discordId: string, reason: string, actor: string) {
    await prisma.candyWallet.upsert({
      where: { discordId },
      create: { discordId, blocked: true, blockReason: reason },
      update: { blocked: true, blockReason: reason },
    });

    await prisma.candyAuditLog.create({
      data: { actor, action: "wallet.block", target: discordId, meta: { reason } },
    });
  }

  async unblockUser(discordId: string, actor: string) {
    await prisma.candyWallet.update({
      where: { discordId },
      data: { blocked: false, blockReason: null },
    });

    await prisma.candyAuditLog.create({
      data: { actor, action: "wallet.unblock", target: discordId },
    });
  }

  async reconcile(discordId: string): Promise<{ isBalanced: boolean; ledgerSum: number; currentBalance: number }> {
    const wallet = await prisma.candyWallet.findUnique({ where: { discordId } });
    const currentBalance = wallet ? wallet.balance : 0;

    const aggregate = await prisma.candyLedger.aggregate({
      where: { discordId },
      _sum: { delta: true },
    });
    const ledgerSum = aggregate._sum.delta || 0;

    return {
      isBalanced: ledgerSum === currentBalance,
      ledgerSum,
      currentBalance,
    };
  }
}

export const walletService = new WalletService();

