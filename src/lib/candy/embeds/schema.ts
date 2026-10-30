import { z } from "zod";
import { CANDY_BUTTON_ACTIONS } from "../constants";

export const ButtonStyleSchema = z.enum(["primary", "secondary", "success", "danger", "link"]);
export type ButtonStyle = z.infer<typeof ButtonStyleSchema>;

export const ButtonDefSchema = z.object({
  id: z.string().min(1),
  label: z.string().max(80),
  emoji: z.string().optional(),
  style: ButtonStyleSchema.default("primary"),
  action: z.enum(CANDY_BUTTON_ACTIONS).default("none"),
  url: z.string().url().optional(),
  disabled: z.boolean().optional(),
});
export type ButtonDef = z.infer<typeof ButtonDefSchema>;

export const EmbedFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().max(256),
  value: z.string().max(1024),
  inline: z.boolean().default(false),
});
export type EmbedField = z.infer<typeof EmbedFieldSchema>;

export const EmbedAuthorSchema = z.object({
  name: z.string().max(256),
  iconUrl: z.string().url().optional().or(z.literal("")),
  url: z.string().url().optional().or(z.literal("")),
});
export type EmbedAuthor = z.infer<typeof EmbedAuthorSchema>;

export const EmbedFooterSchema = z.object({
  text: z.string().max(2048),
  iconUrl: z.string().url().optional().or(z.literal("")),
});
export type EmbedFooter = z.infer<typeof EmbedFooterSchema>;

export const EmbedPageSchema = z.object({
  color: z.string().default("#A0714F"),
  author: EmbedAuthorSchema.optional(),
  title: z.string().max(256).optional(),
  url: z.string().url().optional().or(z.literal("")),
  description: z.string().max(4096).optional(),
  thumbnail: z.string().url().optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
  fields: z.array(EmbedFieldSchema).max(25).optional(),
  footer: EmbedFooterSchema.optional(),
  timestamp: z.union([z.boolean(), z.literal("event_start"), z.literal("now")]).optional(),
});
export type EmbedPage = z.infer<typeof EmbedPageSchema>;

export const PagerConfigSchema = z.object({
  enabled: z.boolean().default(false),
  prevLabel: z.string().default("◀ ย้อนกลับ"),
  nextLabel: z.string().default("ถัดไป ▶"),
  prevStyle: ButtonStyleSchema.default("secondary"),
  nextStyle: ButtonStyleSchema.default("primary"),
  disableAtEdges: z.boolean().default(true),
});
export type PagerConfig = z.infer<typeof PagerConfigSchema>;
export const DEFAULT_PAGER_CONFIG: PagerConfig = PagerConfigSchema.parse({});

export const EmbedTemplatePayloadSchema = z.object({
  content: z.string().max(2000).optional(),
  ephemeral: z.boolean().optional(),
  pages: z.array(EmbedPageSchema).min(1),
  pager: PagerConfigSchema.default(DEFAULT_PAGER_CONFIG),
  buttons: z.array(z.array(ButtonDefSchema).max(5)).max(4).default([]),
  allowedMentions: z.enum(["NONE", "USER_ONLY"]).default("NONE"),
});
export type EmbedTemplatePayload = z.infer<typeof EmbedTemplatePayloadSchema>;

/**
 * Validates Discord total embed character limits:
 * sum of title, description, fields.name/value, footer.text, author.name <= 6000
 */
export function validateDiscordLimits(page: EmbedPage): { valid: boolean; totalChars: number; errors: string[] } {
  let totalChars = 0;
  const errors: string[] = [];

  if (page.title) totalChars += page.title.length;
  if (page.description) totalChars += page.description.length;
  if (page.author?.name) totalChars += page.author.name.length;
  if (page.footer?.text) totalChars += page.footer.text.length;

  for (const f of page.fields || []) {
    totalChars += f.name.length + f.value.length;
  }

  if (totalChars > 6000) {
    errors.push(`ผลรวมตัวอักษรของ Embed หน้าเดียว (${totalChars}) เกินขีดจำกัด Discord (6000)`);
  }

  return {
    valid: errors.length === 0,
    totalChars,
    errors,
  };
}
