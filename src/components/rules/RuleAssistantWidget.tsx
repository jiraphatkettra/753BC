"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Send,
  RefreshCw,
  ArrowUpRight,
  ShieldAlert,
  Terminal,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  keyUsedIndex?: number;
}

const DEFAULT_PROMPTS = [
  "ส่งภาพสปอยล์เนื้อหาภาพยนตร์ผิดกฎหรือไม่",
  "ชวนเพื่อนเข้าเซิร์ฟเวอร์ดิสคอร์ดอื่นผิดกฎข้อไหน",
  "ถูกลงโทษไม่เป็นธรรม มีขั้นตอนการอุทธรณ์อย่างไร",
  "ทีมงานมีความสัมพันธ์เชิงชู้สาวกับผู้เยาว์มีบทลงโทษอย่างไร",
];

interface RuleAssistantWidgetProps {
  compact?: boolean;
  className?: string;
  showLinkToFullRules?: boolean;
}

export default function RuleAssistantWidget({
  compact = false,
  className = "",
  showLinkToFullRules = false,
}: RuleAssistantWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-welcome",
      role: "model",
      text: "ระบบ AI ผู้ช่วยวิเคราะห์กฎระเบียบ 753BC พร้อมให้บริการ คุณสามารถพิมพ์สอบถามข้อกฎระเบียบ วิธีการรายงาน หรือระบุสถานการณ์จำลองเพื่อให้ระบบวิเคราะห์ตามข้อบังคับจริงได้ทันที (ระบบจะตอบเฉพาะข้อเท็จจริงตามกฎระเบียบเท่านั้น หากไม่มีกฎระบุไว้จะแจ้งอย่างตรงไปตรงมา)",
      timestamp: new Date().toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTokenSlot, setActiveTokenSlot] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || input).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setErrorMessage(null);

    try {
      // เตรียม history สำหรับส่งไป API (ย้อนหลัง 6 ข้อความล่าสุด)
      const historyPayload = messages
        .slice(-6)
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch("/api/ai/ask-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: q,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }

      const botMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "model",
        text: data.answer,
        timestamp: new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        keyUsedIndex: data.keyUsedIndex,
      };

      if (data.keyUsedIndex) {
        setActiveTokenSlot(data.keyUsedIndex);
      }

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setErrorMessage(err.message || "ไม่สามารถวิเคราะห์ได้ชั่วคราว");
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "initial-welcome",
        role: "model",
        text: "ระบบ AI ผู้ช่วยวิเคราะห์กฎระเบียบ 753BC ได้รับการรีเซ็ตบทสนทนาแล้ว สามารถพิมพ์สอบถามสถานการณ์ใหม่ได้ทันทีครับ",
        timestamp: new Date().toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setErrorMessage(null);
  };

  return (
    <div
      className={`relative w-full bg-[#070809] border border-white/[0.12] transition-colors duration-150 ${className}`}
    >
      {/* Widget Header Strip */}
      <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-white font-semibold truncate">RULE_SENTINEL</span>
          <span className="text-neutral-600 hidden sm:inline">/</span>
          <span className="text-neutral-400 hidden sm:inline truncate">753BC AI ANALYZER</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {activeTokenSlot && (
            <span className="text-[10px] text-neutral-400 font-mono hidden md:inline-block">
              [TOKEN #{activeTokenSlot}]
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            STRICT VERIFIED
          </span>

          <button
            onClick={handleResetChat}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="ล้างการสนทนา"
            aria-label="ล้างการสนทนา"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chat Messages Display Viewport */}
      <div
        ref={chatContainerRef}
        className={`p-3.5 sm:p-6 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10 ${
          compact ? "h-[300px] sm:h-[360px]" : "h-[380px] sm:h-[480px]"
        }`}
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              {/* Message Metadata Header */}
              <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-neutral-400 px-1">
                <span>{isUser ? "YOU" : "753BC_SENTINEL"}</span>
                <span>•</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message Bubble Box */}
              <div
                className={`max-w-[94%] sm:max-w-[85%] p-3 sm:p-4 text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? "bg-white text-black font-medium border border-white"
                    : "bg-white/[0.03] text-neutral-200 border border-white/[0.1]"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-neutral-400 px-1">
              <span>753BC_SENTINEL</span>
              <span>•</span>
              <span>ANALYZING</span>
            </div>
            <div className="p-3 bg-white/[0.03] border border-white/[0.1] text-xs font-mono text-neutral-400 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400 shrink-0" />
              <span>กำลังตรวจสอบข้อกฎระเบียบและประมวลผลการวินิจฉัย...</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">[แจ้งเตือนข้อผิดพลาด]:</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Strip */}
      <div className="px-3.5 sm:px-6 py-2.5 bg-white/[0.01] border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto scrollbar-none [touch-action:pan-x]">
        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-neutral-400" />
          <span className="hidden xs:inline">คำถามแนะนำ:</span>
        </span>
        {DEFAULT_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-2.5 py-1.5 text-[11px] text-neutral-300 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 whitespace-nowrap transition-colors duration-150 shrink-0 cursor-pointer disabled:opacity-50 min-h-[30px]"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 sm:p-4 border-t border-white/[0.08] bg-[#070809] flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ข้อสงสัย หรือสถานการณ์จำลอง..."
          disabled={loading}
          className="flex-1 bg-white/[0.03] border border-white/[0.1] px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 transition-colors min-h-[40px]"
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-black font-semibold text-xs sm:text-sm hover:bg-neutral-200 transition-colors duration-150 active:scale-[0.98] border border-white flex items-center gap-1.5 whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none cursor-pointer min-h-[40px]"
        >
          <span>วิเคราะห์</span>
          <Send className="w-3.5 h-3.5 shrink-0" />
        </button>
      </form>

      {/* Optional Link to Full Rules footer */}
      {showLinkToFullRules && (
        <div className="px-3.5 sm:px-6 py-2.5 bg-white/[0.02] border-t border-white/[0.06] flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 text-xs text-neutral-400">
          <span>ต้องการศึกษาระเบียบข้อบังคับฉบับเต็มหรือไม่?</span>
          <Link
            href="/rules"
            className="text-white hover:underline flex items-center gap-1 font-medium shrink-0"
          >
            <span>อ่านกฎระเบียบฉบับเต็ม</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
