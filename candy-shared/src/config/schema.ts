import { z } from "zod";

export const AmountTierSchema = z.object({
  amount: z.number().int().positive(),
  weight: z.number().int().positive(),
});

export const EventDropConfigSchema = z.object({
  tickSeconds: z.number().int().min(1).default(5),
  activityWindowSec: z.number().int().min(10).default(120),
  minActivityMessages: z.number().int().min(0).default(3),
  channelCooldownSec: z.number().int().min(5).default(20),
  maxActivePerChannel: z.number().int().min(1).default(1),
  maxActiveGlobal: z.number().int().min(1).default(5),
  lifetimeSec: z.number().int().min(10).default(45),
  maxClaimers: z.number().int().min(1).default(1),
  amountTiers: z.array(AmountTierSchema).min(1).default([
    { amount: 1, weight: 60 },
    { amount: 2, weight: 25 },
    { amount: 5, weight: 10 },
    { amount: 10, weight: 4 },
    { amount: 20, weight: 1 },
  ]),
  pacing: z.enum(["BUDGET_AWARE", "FIXED_RATE"]).default("BUDGET_AWARE"),
  fixedDropsPerMinute: z.number().min(0.1).default(4),
  dropWhenNoActivity: z.boolean().default(true),
});

export const EventClaimConfigSchema = z.object({
  requireVoice: z.boolean().default(true),
  allowedVoiceChannelIds: z.array(z.string()).default([]),
  excludeAfkChannel: z.boolean().default(true),
  requireNotDeafened: z.boolean().default(false),
  minVoiceSeconds: z.number().int().min(0).default(10),
  perUserCooldownSec: z.number().int().min(0).default(3),
  perUserMaxTotal: z.number().int().positive().nullable().default(null),
  perUserMaxPerHour: z.number().int().positive().nullable().default(null),
  minAccountAgeDays: z.number().int().min(0).default(0),
  minServerJoinDays: z.number().int().min(0).default(0),
});

export const EventRedeemConfigSchema = z.object({
  minRedeem: z.number().int().positive().default(1),
  maxRedeem: z.number().int().positive().nullable().default(null),
  onePendingOnly: z.boolean().default(true),
});

export const EventConfigSchema = z.object({
  announceChannelId: z.string().nullable().default(null),
  drop: EventDropConfigSchema.default({}),
  claim: EventClaimConfigSchema.default({}),
  redeem: EventRedeemConfigSchema.default({}),
});

export type EventConfig = z.infer<typeof EventConfigSchema>;
export type EventDropConfig = z.infer<typeof EventDropConfigSchema>;
export type EventClaimConfig = z.infer<typeof EventClaimConfigSchema>;
export type EventRedeemConfig = z.infer<typeof EventRedeemConfigSchema>;

export const DEFAULT_EVENT_CONFIG: EventConfig = EventConfigSchema.parse({});

