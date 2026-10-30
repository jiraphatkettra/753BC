import { EmbedTemplatePayload, EmbedPage, ButtonDef, validateDiscordLimits } from "./schema";
import { CANDY_INTERACTION_TYPES } from "../constants";

export interface RenderContext {
  templateKey?: string;
  dropId?: string;
  userId?: string;
  isDiscordClient?: boolean;
}

export function escapeMarkdownChars(str: string): string {
  return str.replace(/([\\*_`~|<>])/g, "\\$1");
}

export function replaceVars(text: string, vars: Record<string, any>): string {
  if (!text) return "";
  return text.replace(/{([a-zA-Z0-9_]+)}/g, (match, key) => {
    if (key in vars && vars[key] !== undefined && vars[key] !== null) {
      return String(vars[key]);
    }
    return match; // preserve unknown variables
  });
}

export function parseHexColor(hexColor?: string): number {
  if (!hexColor) return 0xa0714f;
  const clean = hexColor.replace("#", "").trim();
  const parsed = parseInt(clean, 16);
  return isNaN(parsed) ? 0xa0714f : parsed;
}

export interface RenderedDiscordMessage {
  content?: string;
  ephemeral?: boolean;
  embeds: any[];
  components: any[];
  allowed_mentions: {
    parse: ("users" | "roles" | "everyone")[];
    users?: string[];
  };
  pageIdx: number;
  totalPages: number;
}

export function renderTemplate(
  payload: EmbedTemplatePayload,
  vars: Record<string, any> = {},
  pageIdx: number = 0,
  ctx: RenderContext = {}
): RenderedDiscordMessage {
  const pages = payload.pages || [];
  const totalPages = Math.max(1, pages.length);
  const clampedPage = Math.max(0, Math.min(pageIdx, totalPages - 1));
  const page: EmbedPage = pages[clampedPage] || pages[0];

  const mergedVars = {
    ...vars,
    page: clampedPage + 1,
    pages: totalPages,
  };

  // 1. Process Embed Page
  const embedObj: any = {
    color: parseHexColor(page.color),
  };

  if (page.title) {
    embedObj.title = replaceVars(page.title, mergedVars);
    if (page.url) embedObj.url = page.url;
  }

  if (page.description) {
    embedObj.description = replaceVars(page.description, mergedVars);
  }

  if (page.author?.name) {
    embedObj.author = {
      name: replaceVars(page.author.name, mergedVars),
      icon_url: page.author.iconUrl || undefined,
      url: page.author.url || undefined,
    };
  }

  if (page.thumbnail) {
    embedObj.thumbnail = { url: page.thumbnail };
  }

  if (page.image) {
    embedObj.image = { url: page.image };
  }

  if (page.fields && page.fields.length > 0) {
    embedObj.fields = page.fields
      .filter((f) => f.name.trim() && f.value.trim())
      .map((f) => ({
        name: replaceVars(f.name, mergedVars),
        value: replaceVars(f.value, mergedVars),
        inline: Boolean(f.inline),
      }));
  }

  if (page.footer?.text) {
    embedObj.footer = {
      text: replaceVars(page.footer.text, mergedVars),
      icon_url: page.footer.iconUrl || undefined,
    };
  }

  if (page.timestamp) {
    embedObj.timestamp = new Date().toISOString();
  }

  // 2. Action Rows & Buttons
  const components: any[] = [];

  // Content buttons
  for (const row of payload.buttons || []) {
    if (row.length === 0) continue;
    const rowComponents: any[] = [];

    for (const btn of row) {
      if (btn.style === "link" && btn.url) {
        rowComponents.push({
          type: 2, // Button
          style: 5, // Link
          label: replaceVars(btn.label, mergedVars),
          url: btn.url,
          emoji: btn.emoji ? { name: btn.emoji } : undefined,
          disabled: btn.disabled,
        });
      } else {
        let styleInt = 1; // Primary
        if (btn.style === "secondary") styleInt = 2;
        if (btn.style === "success") styleInt = 3;
        if (btn.style === "danger") styleInt = 4;

        let customId = `candy:btn:${btn.action}`;
        if (btn.action === "claim" && ctx.dropId) {
          customId = `${CANDY_INTERACTION_TYPES.CLAIM}${ctx.dropId}`;
        } else if (btn.action === "claim") {
          customId = `${CANDY_INTERACTION_TYPES.CLAIM}preview`;
        }

        rowComponents.push({
          type: 2,
          style: styleInt,
          label: replaceVars(btn.label, mergedVars),
          custom_id: customId,
          emoji: btn.emoji ? { name: btn.emoji } : undefined,
          disabled: btn.disabled,
        });
      }
    }

    if (rowComponents.length > 0) {
      components.push({
        type: 1, // ActionRow
        components: rowComponents,
      });
    }
  }

  // Pager buttons (added as last row if totalPages > 1)
  if (totalPages > 1 && payload.pager) {
    const isFirstPage = clampedPage === 0;
    const isLastPage = clampedPage === totalPages - 1;
    const templateKey = ctx.templateKey || "candy_rules";

    const prevDisabled = payload.pager.disableAtEdges && isFirstPage;
    const nextDisabled = payload.pager.disableAtEdges && isLastPage;

    let prevStyleInt = payload.pager.prevStyle === "primary" ? 1 : payload.pager.prevStyle === "success" ? 3 : 2;
    let nextStyleInt = payload.pager.nextStyle === "secondary" ? 2 : payload.pager.nextStyle === "success" ? 3 : 1;

    components.push({
      type: 1,
      components: [
        {
          type: 2,
          style: prevStyleInt,
          label: payload.pager.prevLabel || "◀ ย้อนกลับ",
          custom_id: `${CANDY_INTERACTION_TYPES.PAGER}${templateKey}:${Math.max(0, clampedPage - 1)}`,
          disabled: prevDisabled,
        },
        {
          type: 2,
          style: nextStyleInt,
          label: payload.pager.nextLabel || "ถัดไป ▶",
          custom_id: `${CANDY_INTERACTION_TYPES.PAGER}${templateKey}:${Math.min(totalPages - 1, clampedPage + 1)}`,
          disabled: nextDisabled,
        },
      ],
    });
  }

  // 3. Allowed Mentions
  const allowed_mentions: any = {
    parse: [],
  };
  if (payload.allowedMentions === "USER_ONLY" && ctx.userId) {
    allowed_mentions.users = [ctx.userId];
  }

  const finalContent = payload.content ? replaceVars(payload.content, mergedVars) : undefined;

  return {
    content: finalContent,
    ephemeral: payload.ephemeral,
    embeds: [embedObj],
    components,
    allowed_mentions,
    pageIdx: clampedPage,
    totalPages,
  };
}

