import prisma, {
  DEFAULT_EMBED_TEMPLATES,
  EmbedTemplatePayload,
  TEMPLATE_REGISTRY,
  renderTemplate,
  RenderedDiscordMessage,
  RenderContext,
} from "@candy/shared";

class EmbedService {
  private templatesCache: Map<string, { payload: EmbedTemplatePayload; enabled: boolean; version: number }> = new Map();
  private lastSync: number = 0;

  async init() {
    await this.seedDefaults();
    await this.reloadTemplates();
  }

  async seedDefaults() {
    try {
      for (const [key, meta] of Object.entries(TEMPLATE_REGISTRY)) {
        const defaultPayload = DEFAULT_EMBED_TEMPLATES[key];
        if (!defaultPayload) continue;

        await prisma.candyEmbedTemplate.upsert({
          where: { key },
          create: {
            key,
            name: meta.name,
            category: meta.category,
            enabled: true,
            payload: defaultPayload as any,
            version: 1,
            isDefault: true,
          },
          update: {
            // Do not overwrite existing customized templates
          },
        });
      }
      console.log("[EmbedService] Seeded default embed templates into database (safe on-conflict).");
    } catch (err) {
      console.error("[EmbedService] Failed to seed default templates:", err);
    }
  }

  async reloadTemplates() {
    try {
      const records = await prisma.candyEmbedTemplate.findMany();
      for (const r of records) {
        this.templatesCache.set(r.key, {
          payload: r.payload as any,
          enabled: r.enabled,
          version: r.version,
        });
      }
      this.lastSync = Date.now();
      console.log(`[EmbedService] Loaded ${records.length} embed templates into cache.`);
    } catch (err) {
      console.error("[EmbedService] Failed to reload templates:", err);
    }
  }

  getTemplate(key: string): EmbedTemplatePayload {
    const cached = this.templatesCache.get(key);
    if (cached && cached.enabled && cached.payload) {
      return cached.payload;
    }
    // Fallback to in-code default
    if (DEFAULT_EMBED_TEMPLATES[key]) {
      return DEFAULT_EMBED_TEMPLATES[key];
    }
    // Ultimate fallback
    return DEFAULT_EMBED_TEMPLATES["candy_err_generic"] || {
      pages: [{ color: "#A0714F", title: "Error", description: "Template not found" }],
      pager: { enabled: false, prevLabel: "", nextLabel: "", prevStyle: "secondary", nextStyle: "primary", disableAtEdges: true },
      buttons: [],
      allowedMentions: "NONE",
    };
  }

  render(
    key: string,
    vars: Record<string, any> = {},
    pageIdx: number = 0,
    ctx: RenderContext = {}
  ): RenderedDiscordMessage {
    const payload = this.getTemplate(key);
    return renderTemplate(payload, vars, pageIdx, { ...ctx, templateKey: key });
  }
}

export const embedService = new EmbedService();

