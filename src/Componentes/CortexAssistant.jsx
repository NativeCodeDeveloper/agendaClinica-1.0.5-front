"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import { Minus, Send, X } from "lucide-react";

const InteractiveNebulaOrb = dynamic(
  () => import("@/components/ui/InteractiveNebulaOrb").then((module) => module.InteractiveNebulaOrb),
  {
    ssr: false,
    loading: () => <span className="block h-full w-full rounded-full bg-transparent" />,
  },
);

const MAX_CHARS = 2000;
const THINKING_LABELS = [
  "haciendo sinapsis...",
  "propagacion neuronal...",
  "mielinizando...",
  "Alcanzando el Cortex...",
];

export default function CortexAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [mockConversation, setMockConversation] = useState([]);
  const [isEvolving, setIsEvolving] = useState(false);
  const [thinkingLabelIndex, setThinkingLabelIndex] = useState(0);
  const inputRef = useRef(null);
  const conversationEndRef = useRef(null);
  const API = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!isOpen) return undefined;

    inputRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mockConversation]);

  useEffect(() => {
    if (!isEvolving) return undefined;

    setThinkingLabelIndex(0);

    const labelTimer = window.setInterval(() => {
      setThinkingLabelIndex((current) => (current + 1) % THINKING_LABELS.length);
    }, 1500);


    return () => {
      window.clearInterval(labelTimer);
    };
  }, [isEvolving]);

  const isNearLimit = message.length > MAX_CHARS * 0.85;



async function llamarCortex(mensajeUsuario){
    const mensajeLimpio = mensajeUsuario.trim();

    if(!mensajeLimpio || isEvolving){
        return
    }

    const conversacionActualizada = [
        ...mockConversation,
        {
            role: "user",
            content: mensajeLimpio
        }
    ];

    setMockConversation(conversacionActualizada);
    setMessage("");
    setIsEvolving(true);

    try {
        const respuestaCortex = await fetch(`${API}/cortex/mensaje`,{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "mensaje": conversacionActualizada
            })
        });

        const data = await respuestaCortex.json().catch(() => null);

        if(!respuestaCortex.ok){
            throw new Error(data?.message || "CORTEX no pudo responder en este momento.");
        }

        if(!data?.respuesta){
            throw new Error("CORTEX no entregó una respuesta válida.");
        }

        setMockConversation((current) => [
            ...current,
            { role: "assistant", content: data.respuesta }
        ]);
    } catch (error) {
        setMockConversation((current) => [
            ...current,
            {
                role: "assistant",
                content: error.message || "No fue posible conectar con CORTEX. Intenta nuevamente."
            }
        ]);
    } finally {
        setIsEvolving(false);
    }
}



  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <div className="absolute bottom-5 right-4 flex flex-col items-end sm:bottom-7 sm:right-7">
        {isOpen ? (
          <section
            id="cortex-assistant-dialog"
            role="dialog"
            aria-modal="false"
            aria-labelledby="cortex-assistant-title"
            className="cortex-glass-shell pointer-events-auto relative isolate flex h-[min(560px,calc(100vh-48px))] w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[28px] border border-white/50 bg-[rgba(239,244,255,0.24)] shadow-[0_30px_80px_-24px_rgba(29,42,77,0.46),0_8px_30px_-14px_rgba(73,91,145,0.22),inset_0_1px_0_rgba(255,255,255,0.68)] ring-1 ring-slate-900/[0.05] backdrop-blur-[44px] backdrop-saturate-[1.5] sm:w-[390px]"
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/30 via-white/[0.06] to-transparent" />
              <div className="absolute -right-20 top-14 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(222,180,255,0.34)_0%,rgba(222,180,255,0.08)_48%,transparent_72%)] blur-2xl" />
              <div className="absolute -left-24 top-36 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(135,199,255,0.24)_0%,rgba(135,199,255,0.05)_54%,transparent_74%)] blur-2xl" />
              <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/[0.16] to-transparent" />
              <div className="absolute inset-[1px] rounded-[27px] border border-white/25" />
            </div>

            <header className="relative z-10 flex items-center justify-between gap-2 border-b border-white/35 bg-white/[0.06] px-4 py-3.5 backdrop-blur-xl">
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <div
                  className="relative shrink-0 overflow-hidden rounded-full"
                  style={{
                    width: "52px",
                    height: "52px",
                    flexBasis: "52px",
                    background:
                      "radial-gradient(circle at 38% 34%, rgba(244,114,182,0.92) 0%, rgba(168,85,247,0.88) 27%, rgba(79,70,229,0.86) 58%, rgba(30,27,75,0.9) 78%, transparent 79%)",
                    filter: "brightness(0.78) contrast(1.12) saturate(1.08)",
                    boxShadow: "0 0 18px rgba(139,92,246,0.28)",
                    maskImage: "radial-gradient(circle, black 52%, transparent 72%)",
                    WebkitMaskImage: "radial-gradient(circle, black 52%, transparent 72%)",
                  }}
                >
                  <InteractiveNebulaOrb
                    isThinking={isEvolving}
                    className="absolute inset-0 h-full w-full rounded-full"
                  />
                </div>
                <div className="min-w-0">
                  <h2
                    id="cortex-assistant-title"
                    className="text-[13px] font-black leading-tight tracking-[0.12em] text-gray-900 antialiased sm:text-[14px]"
                    style={{
                      fontFamily: "var(--font-michroma)",
                      WebkitTextStroke: "0.55px #111827",
                    }}
                  >
                    CORTEX A.I
                  </h2>
                  <p
                    className="mt-1 whitespace-nowrap text-[5px] font-medium tracking-[0.14em] text-slate-400/85 antialiased sm:text-[6px]"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    Clinical Intelligence
                  </p>
                </div>
              </div>

              <div className="ml-2 flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Minimizar CORTEX A.I"
                  title="Minimizar"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-slate-300/70 bg-white/65 text-slate-700 shadow-sm transition duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60"
                >
                  <Minus className="h-4 w-4" strokeWidth={2.4} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Cerrar CORTEX A.I"
                  title="Cerrar"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-transparent text-slate-500 transition duration-200 hover:border-white/70 hover:bg-white/50 hover:text-slate-800 hover:shadow-[0_6px_18px_-8px_rgba(30,41,59,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div
              aria-live="polite"
              className="cortex-scrollbar relative z-10 flex-1 space-y-3.5 overflow-y-auto px-4 py-5 sm:px-5"
            >
              <div className="max-w-[88%] break-words rounded-[20px] rounded-tl-md border border-white/75 bg-white/45 px-4 py-3.5 text-[13px] leading-[1.65] text-slate-700 shadow-[0_14px_34px_-22px_rgba(35,52,91,0.42),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl">
                Hola, soy la Inteligencia Artificial de AgendaClinica. Haré todo el trabajo por ti, solo pídemelo.
              </div>

              {mockConversation.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`cortex-message-enter w-fit max-w-[88%] break-words rounded-[20px] px-4 py-3.5 text-[13px] leading-[1.65] ${
                    item.role === "user"
                      ? "ml-auto rounded-tr-md border border-white/35 bg-[linear-gradient(145deg,rgba(76,85,180,0.92),rgba(94,84,180,0.82))] text-white shadow-[0_14px_30px_-18px_rgba(50,45,130,0.68),inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-xl"
                      : "rounded-tl-md border border-white/75 bg-white/45 text-slate-700 shadow-[0_14px_34px_-22px_rgba(35,52,91,0.42),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-2xl"
                  }`}
                >
                  {item.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ol: ({ children }) => (
                          <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
                        ),
                        ul: ({ children }) => (
                          <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
                        ),
                        li: ({ children }) => <li className="pl-1">{children}</li>,
                        strong: ({ children }) => (
                          <strong className="font-semibold text-slate-900">{children}</strong>
                        ),
                      }}
                    >
                      {item.content}
                    </ReactMarkdown>
                  ) : (
                    item.content
                  )}
                </div>
              ))}

              {isEvolving && (
                <div
                  className="w-fit px-1 py-2"
                  style={{ backgroundColor: "transparent" }}
                  aria-label="CORTEX A.I esta pensando"
                >
                  <svg
                    className="h-8 w-72 overflow-visible"
                    viewBox="0 0 330 42"
                    fill="none"
                    role="img"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 22H24L30 14L38 22H52L61 22L66 6L72 38L79 22H102L111 22L117 13L125 22H139L148 22L153 5L159 37L166 22H178"
                      className="cortex-heartbeat-trail"
                    />
                    <path
                      d="M2 22H24L30 14L38 22H52L61 22L66 6L72 38L79 22H102L111 22L117 13L125 22H139L148 22L153 5L159 37L166 22H178"
                      className="cortex-heartbeat-line"
                    />
                    <text x="204" y="25" className="cortex-synapse-word">
                      {THINKING_LABELS[thinkingLabelIndex]}
                    </text>
                  </svg>
                </div>
              )}
              <div ref={conversationEndRef} />
            </div>

            <footer className="relative z-10 border-t border-white/35 bg-white/[0.04] p-3.5 backdrop-blur-2xl sm:p-4">
              <form
                onSubmit={(event)=>{
                    event.preventDefault();
                     llamarCortex(message);
                }}
                className={`cortex-input-aura relative isolate flex items-end gap-2 rounded-[19px] border border-white/80 bg-white/50 p-1.5 pl-3.5 shadow-[0_14px_30px_-20px_rgba(42,56,98,0.48),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-2xl transition duration-300 focus-within:bg-white/65 focus-within:shadow-[0_18px_38px_-20px_rgba(69,74,159,0.5),inset_0_1px_0_rgba(255,255,255,1)] ${
                  isEvolving ? "is-thinking" : ""
                }`}
              >
                  <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(event) => setMessage(event.target.value.slice(0, MAX_CHARS))}
                  maxLength={MAX_CHARS}
                  disabled={isEvolving}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={1}
                  aria-label="Mensaje para CORTEX A.I"
                  placeholder={isEvolving ? "CORTEX esta respondiendo..." : "Escribe un mensaje..."}
                  className="max-h-24 min-h-9 flex-1 resize-none bg-transparent py-2 text-[13px] leading-5 text-slate-700 outline-none placeholder:text-slate-400/90 disabled:cursor-wait disabled:opacity-60"
                />
                <div className="flex shrink-0 flex-col items-end gap-1.5 pb-0.5">
                  <span
                    className={`font-mono text-[9px] tabular-nums transition-colors ${
                      isNearLimit ? "text-amber-600" : "text-slate-400"
                    }`}
                  >
                    {message.length}/{MAX_CHARS}
                  </span>
                  <button
                    type="submit"
                    aria-label="Enviar mensaje"
                    disabled={!message.trim() || isEvolving}
                    className="grid h-9 w-9 place-items-center rounded-[12px] border border-white/50 bg-[linear-gradient(145deg,#7187f4,#8b82ed)] text-white shadow-[0_8px_18px_-8px_rgba(78,85,190,0.72),inset_0_1px_0_rgba(255,255,255,0.42)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_11px_22px_-8px_rgba(78,85,190,0.78)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white/50 disabled:cursor-not-allowed disabled:border-white/30 disabled:bg-[rgba(148,163,184,0.28)] disabled:text-slate-400 disabled:shadow-none disabled:hover:translate-y-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
              <div className="mt-2.5 px-1">
                <p className="text-[9px] font-medium tracking-wide text-slate-500/70">Shift + Enter para nueva línea</p>
              </div>
            </footer>
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir CORTEX A.I"
            aria-expanded={isOpen}
            aria-controls="cortex-assistant-dialog"
            className="pointer-events-auto rounded-full bg-transparent p-0 shadow-none transition hover:scale-105 focus:outline-none focus:ring-4 focus:ring-violet-200/60"
          >
            <span className="relative block h-16 w-16 overflow-hidden rounded-full bg-transparent">
              <InteractiveNebulaOrb isThinking={isEvolving} className="h-full w-full" />
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
