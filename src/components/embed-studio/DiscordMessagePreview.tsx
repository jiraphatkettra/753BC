"use client";

import React, { useState } from "react";
import { EmbedTemplatePayload, renderTemplate } from "@/lib/candy";
import { Smartphone, Monitor } from "lucide-react";

interface DiscordMessagePreviewProps {
  payload: EmbedTemplatePayload;
  sampleVars?: Record<string, any>;
  botName?: string;
  botAvatar?: string;
}

export default function DiscordMessagePreview({
  payload,
  sampleVars = {},
  botName = "ลูกกระจ๊อกบัง",
  botAvatar = "https://cdn.discordapp.com/embed/avatars/0.png",
}: DiscordMessagePreviewProps) {
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isMobileView, setIsMobileView] = useState<boolean>(false);

  // Render using the exact same pipeline as the bot
  const rendered = renderTemplate(
    payload,
    {
      amount: 5,
      maxClaimers: 1,
      claimedCount: 0,
      expiresR: "ในอีก 45 วินาที",
      channel: "ห้องแชท-ทั่วไป",
      dropShortId: "cndy99",
      winners: "@สมาชิกผู้โชคดี",
      winner: "@สมาชิกผู้โชคดี",
      user: "@คุณเอง",
      balance: 15,
      baht: 15,
      totalEarned: 25,
      claimCount: 5,
      rank: 3,
      redeemStatus: "ปกติ",
      voiceChannel: "ห้องพูดคุย 01",
      minVoiceSeconds: 10,
      remainingVoiceSec: 7,
      cap: 100,
      cooldownSec: 3,
      error: "ตัวอย่างข้อผิดพลาด",
      rows: "1. Lynn : 45 🍬\n2. Jack : 30 🍬\n3. You : 15 🍬",
      minRedeem: 1,
      maxRedeem: "ไม่จำกัด",
      payoutTarget: "081-234-5678",
      accountName: "นาย สมชาย ใจดี",
      redemptionId: "rdm_8877",
      budgetTotal: 1000,
      startsAt: "30 ต.ค. 23:30",
      endsAt: "31 ต.ค. 00:30",
      reason: "ปรับปรุงระบบชั่วคราว",
      totalDrops: 24,
      totalClaimed: 750,
      topRows: "1. Lynn (45)\n2. Jack (30)",
      message: "ดำเนินการสำเร็จ",
      ...sampleVars,
    },
    currentPage,
    { templateKey: "preview" }
  );

  const embed = rendered.embeds[0] || {};
  const embedColorHex = embed.color ? `#${embed.color.toString(16).padStart(6, "0")}` : "#A0714F";

  const renderMarkdown = (text?: string) => {
    if (!text) return null;
    const lines = text.split("\n");

    let inDiffBlock = false;
    let diffLines: string[] = [];

    const elements: React.ReactNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith("```diff")) {
        inDiffBlock = true;
        diffLines = [];
        continue;
      }

      if (inDiffBlock) {
        if (line.trim() === "```") {
          inDiffBlock = false;
          elements.push(
            <div key={`diff-${i}`} className="my-2 p-2.5 rounded bg-[#1e1f22] font-mono text-[13px] leading-relaxed border border-white/5">
              {diffLines.map((dl, idx) => {
                if (dl.startsWith("+")) {
                  return (
                    <div key={idx} className="text-[#57f287]">
                      {dl}
                    </div>
                  );
                }
                if (dl.startsWith("-")) {
                  return (
                    <div key={idx} className="text-[#ed4245]">
                      {dl}
                    </div>
                  );
                }
                return (
                  <div key={idx} className="text-[#dbdee1]">
                    {dl}
                  </div>
                );
              })}
            </div>
          );
        } else {
          diffLines.push(line);
        }
        continue;
      }

      if (line.trim().startsWith("```")) {
        // Generic codeblock
        elements.push(
          <pre key={`code-${i}`} className="my-2 p-2 rounded bg-[#1e1f22] font-mono text-xs text-[#dbdee1] overflow-x-auto">
            {line.replace(/```[a-z]*/, "").replace(/```/, "")}
          </pre>
        );
        continue;
      }

      // H1 Header
      if (line.startsWith("# ")) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-xl sm:text-2xl font-bold text-white mt-1 mb-1.5">
            {line.replace("# ", "")}
          </h1>
        );
        continue;
      }

      // H2 Header
      if (line.startsWith("## ")) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-lg font-bold text-white mt-2 mb-1">
            {line.replace("## ", "")}
          </h2>
        );
        continue;
      }

      // H3 Header
      if (line.startsWith("### ")) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm font-semibold text-neutral-200 mt-2 mb-1">
            {line.replace("### ", "")}
          </h3>
        );
        continue;
      }

      // Inline code chip `...`
      const chipMatch = line.match(/^`([^`]+)`$/);
      if (chipMatch) {
        elements.push(
          <div key={`chip-${i}`} className="my-1 inline-block px-2.5 py-0.5 rounded bg-[#2b2d31] text-[13px] text-[#dbdee1] font-mono border border-white/10">
            {chipMatch[1]}
          </div>
        );
        continue;
      }

      // Subtext -#
      if (line.startsWith("-# ")) {
        elements.push(
          <p key={`sub-${i}`} className="text-xs text-neutral-400 mt-1">
            {line.replace("-# ", "")}
          </p>
        );
        continue;
      }

      // Empty line
      if (!line.trim()) {
        elements.push(<div key={`sp-${i}`} className="h-1.5" />);
        continue;
      }

      // Normal text line
      elements.push(
        <p key={`p-${i}`} className="text-[14px] leading-relaxed text-[#dbdee1]">
          {line}
        </p>
      );
    }

    return elements;
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1f22] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Top bar */}
      <div className="px-4 py-3 bg-[#2b2d31] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Discord Live Preview</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#1e1f22] p-1 rounded-lg border border-white/5">
          <button
            onClick={() => setIsMobileView(false)}
            className={`p-1.5 rounded transition ${!isMobileView ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"}`}
            title="Desktop View"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMobileView(true)}
            className={`p-1.5 rounded transition ${isMobileView ? "bg-white/10 text-white" : "text-neutral-400 hover:text-white"}`}
            title="Mobile View"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Discord message container */}
      <div className={`p-4 sm:p-6 flex-1 overflow-y-auto bg-[#313338] transition-all duration-300 ${isMobileView ? "max-w-[360px] mx-auto border-x border-white/10" : "w-full"}`}>
        <div className="flex items-start gap-3.5">
          {/* Bot Avatar */}
          <img src={botAvatar} alt="bot avatar" className="w-10 h-10 rounded-full flex-shrink-0 select-none bg-neutral-800" />

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            {/* Header info */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-semibold text-sm text-white hover:underline cursor-pointer">{botName}</span>
              <span className="text-[10px] uppercase font-bold bg-[#5865f2] text-white px-1.5 py-0.5 rounded">APP</span>
              <span className="text-xs text-[#949ba4]">วันนี้ เวลา 23:30</span>
            </div>

            {/* Optional message content text outside embed */}
            {rendered.content && (
              <div className="text-[15px] text-[#dbdee1] mb-2 leading-relaxed whitespace-pre-wrap">
                {rendered.content}
              </div>
            )}

            {/* Discord Embed Card */}
            <div
              className="rounded bg-[#2b2d31] overflow-hidden max-w-[520px] border-l-4 shadow-sm"
              style={{ borderLeftColor: embedColorHex }}
            >
              <div className="p-3.5 sm:p-4 space-y-2">
                {/* Author */}
                {embed.author && (
                  <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-white">
                    {embed.author.icon_url && <img src={embed.author.icon_url} alt="" className="w-5 h-5 rounded-full" />}
                    <span>{embed.author.name}</span>
                  </div>
                )}

                {/* Title */}
                {embed.title && (
                  <div className="font-semibold text-sm sm:text-base text-white hover:underline cursor-pointer">
                    {embed.title}
                  </div>
                )}

                {/* Description */}
                {embed.description && <div>{renderMarkdown(embed.description)}</div>}

                {/* Fields */}
                {embed.fields && embed.fields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    {embed.fields.map((f: any, idx: number) => (
                      <div key={idx} className={f.inline ? "col-span-1" : "col-span-full"}>
                        <div className="text-xs font-bold text-[#b5bac1] uppercase tracking-wide">{f.name}</div>
                        <div className="text-xs text-[#dbdee1] mt-0.5 whitespace-pre-wrap">{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image */}
                {embed.image?.url && (
                  <div className="mt-2 rounded overflow-hidden max-h-60 bg-black/20">
                    <img src={embed.image.url} alt="embed poster" className="w-full object-cover" />
                  </div>
                )}

                {/* Footer */}
                {embed.footer && (
                  <div className="pt-2 text-[11px] text-[#949ba4] flex items-center gap-1.5 border-t border-white/5">
                    {embed.footer.icon_url && <img src={embed.footer.icon_url} alt="" className="w-4 h-4 rounded-full" />}
                    <span>{embed.footer.text}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Discord Action Rows & Buttons */}
            {rendered.components && rendered.components.length > 0 && (
              <div className="mt-2.5 space-y-2 max-w-[520px]">
                {rendered.components.map((row: any, rIdx: number) => (
                  <div key={rIdx} className="flex flex-wrap items-center gap-2">
                    {row.components.map((btn: any, bIdx: number) => {
                      let btnStyleClasses = "bg-[#5865f2] hover:bg-[#4752c4] text-white"; // Primary
                      if (btn.style === 2) btnStyleClasses = "bg-[#4e5058] hover:bg-[#6d6f78] text-white"; // Secondary
                      if (btn.style === 3) btnStyleClasses = "bg-[#248046] hover:bg-[#1a6334] text-white"; // Success
                      if (btn.style === 4) btnStyleClasses = "bg-[#da373c] hover:bg-[#a1282c] text-white"; // Danger
                      if (btn.style === 5) btnStyleClasses = "bg-[#4e5058] hover:bg-[#6d6f78] text-white"; // Link

                      // Interactive working Pager in preview!
                      const isPagerBtn = btn.custom_id?.startsWith("candy:pg:");
                      const isPrev = btn.label.includes("ย้อนกลับ");
                      const isNext = btn.label.includes("ถัดไป");

                      const handleClick = () => {
                        if (isPagerBtn) {
                          if (isPrev && currentPage > 0) setCurrentPage(currentPage - 1);
                          if (isNext && currentPage < rendered.totalPages - 1) setCurrentPage(currentPage + 1);
                        }
                      };

                      return (
                        <button
                          key={bIdx}
                          type="button"
                          disabled={btn.disabled}
                          onClick={handleClick}
                          className={`px-3.5 py-1.5 text-xs font-medium rounded-[4px] transition active:scale-[0.98] select-none flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${btnStyleClasses}`}
                        >
                          {btn.emoji && <span>{btn.emoji.name}</span>}
                          <span>{btn.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

