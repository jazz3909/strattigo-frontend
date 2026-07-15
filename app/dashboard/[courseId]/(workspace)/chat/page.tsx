"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderTree, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppMarkdown } from "@/app/components/ui/GuideMarkdown";
import { useToast } from "@/app/providers/ToastProvider";
import { streamChat, type ChatMessage } from "@/app/lib/api";
import { buildCollectionTree, findNode } from "@/app/lib/collectionTree";
import { useWorkspace } from "../workspace-context";

// Ported from the monolith ChatTab — same four starters.
const SUGGESTED_QUESTIONS = [
  "Summarize the key concepts",
  "What are the most important formulas?",
  "Quiz me on the hardest topics",
  "What should I focus on for the exam?",
];

const COMPOSER_MAX_HEIGHT = 120;

export default function ChatPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const { addToast } = useToast();

  // ── Workspace-frame data — fetched once per course by the shared
  //    (workspace) layout and read here (no per-surface refetch). ──
  const {
    course,
    collections,
    materialCount,
    materialsReady,
    scopedId,
    loading,
    error: loadError,
    reloadAll,
  } = useWorkspace();

  // ── Conversation (ephemeral — the backend has no thread persistence; the
  //    last 10 messages ride along as `history` on each request) ──
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false); // waiting for first chunk
  const [chatStreaming, setChatStreaming] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Stick-to-bottom: follow the stream only while the user is at the bottom;
  // scrolling up detaches, scrolling back down re-attaches.
  const stickRef = useRef(true);

  const tree = useMemo(() => buildCollectionTree(collections), [collections]);
  const scopeName =
    (scopedId != null && findNode(tree, scopedId)?.name) || course?.name || "";
  // Optimistic gate: the materials count loads in the background, so until it's
  // known we allow chatting rather than flashing the "upload materials" gate on
  // a course that almost certainly has materials. Once the count resolves, a
  // genuinely empty course (materialsReady && count === 0) is correctly gated.
  const canChat = !materialsReady || materialCount > 0;

  // The chat stream carries no source refs (backend yields plain text chunks
  // only), so the designed citation chips are omitted. Logged per spec.
  useEffect(() => {
    console.info(
      "[chat] backend /ai/chat/stream returns no source references — citation chips omitted.",
    );
  }, []);

  // Follow the conversation while attached. Runs on every appended chunk
  // (messages is replaced per chunk) — direct scrollTop assignment, no smooth
  // behavior, so a fast stream never janks or queues animations.
  useEffect(() => {
    const el = threadRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, chatLoading]);

  function onThreadScroll() {
    const el = threadRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  // Ported verbatim from the monolith's handleChat — send + stream logic is
  // behavior, not presentation. Only addition: re-attach stick-to-bottom on
  // send and reset the composer height.
  async function handleChat(question: string) {
    if (!question.trim()) return;
    if (chatLoading || chatStreaming || !canChat) return;
    const historyToSend = messages
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));
    stickRef.current = true;
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setChatInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setChatLoading(true);

    try {
      let firstChunk = true;
      for await (const chunk of streamChat(
        courseId,
        question,
        historyToSend,
        scopedId ?? undefined,
      )) {
        if (firstChunk) {
          firstChunk = false;
          setChatLoading(false);
          setChatStreaming(true);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: chunk },
          ]);
        } else {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            return [
              ...prev.slice(0, -1),
              { ...last, content: last.content + chunk },
            ];
          });
        }
      }
      if (firstChunk) {
        // No chunks received — fall back to non-streaming
        setChatLoading(false);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "No response received." },
        ]);
      }
    } catch (err: unknown) {
      setChatLoading(false);
      addToast(err instanceof Error ? err.message : "Chat failed.", "error");
    } finally {
      setChatStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChat(chatInput);
    }
  }

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT) + "px";
  }

  const busy = chatLoading || chatStreaming;

  return loading ? (
    <ChatSkeleton />
  ) : loadError ? (
    <div className="mt-24 max-w-md px-14 max-md:px-5">
      <p className="font-read text-read-s text-error-deep">{loadError}</p>
      <div className="mt-6">
        <Button variant="secondary" onClick={() => reloadAll()}>
          Try again
        </Button>
      </div>
    </div>
  ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Thread — the conversation owns the screen */}
            <div
              ref={threadRef}
              onScroll={onThreadScroll}
              className="flex-1 overflow-y-auto"
            >
              {messages.length === 0 && !chatLoading ? (
                <EmptyState
                  canChat={canChat}
                  scopeName={scopeName}
                  onAsk={handleChat}
                  onUploadClick={() =>
                    router.push(`/dashboard/${courseId}/materials`)
                  }
                />
              ) : (
                /* Thread runs the full content width — equal 56px gutters,
                   no cap. Deliberately wider than the centered composer. */
                <div className="px-14 py-[30px] max-md:px-5">
                  {messages.map((msg, i) => {
                    const isLastAssistant =
                      chatStreaming &&
                      i === messages.length - 1 &&
                      msg.role === "assistant";
                    return msg.role === "user" ? (
                      <div key={i} className="mb-[30px] flex justify-end">
                        <div className="max-w-[78%] rounded-[14px] rounded-br-[4px] bg-accent-tint px-4 py-3 font-sans text-[14.5px] leading-normal text-accent-deep">
                          <AppMarkdown content={msg.content} />
                        </div>
                      </div>
                    ) : (
                      <div key={i} className="mb-[30px]">
                        <TutorHead />
                        {/* The tutor speaks in the reading voice — serif, considered. */}
                        <div className="font-read text-[17px] leading-[1.66] text-ink">
                          <AppMarkdown content={msg.content} isStreaming={isLastAssistant} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Thinking indicator — only while waiting for the first chunk */}
                  {chatLoading && (
                    <div className="mb-[30px]">
                      <TutorHead />
                      <div className="flex items-center gap-1.5 py-1">
                        {[0, 160, 320].map((delay) => (
                          <span
                            key={delay}
                            className="size-2 rounded-full bg-ink-faint"
                            style={{
                              animation: `bounceDot 1.2s ease-in-out ${delay}ms infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pinned composer */}
            <div className="shrink-0 border-t border-rule px-8 pt-4 pb-5 max-md:px-4 max-md:pb-3">
              {/* Centered, medium-width input — intentionally narrower than
                  the full-width thread above it. */}
              <div className="mx-auto w-full max-w-[760px]">
                <div className="flex items-end gap-2.5 rounded-lg border border-rule-strong bg-raised py-2.5 pr-2.5 pl-4 transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--color-accent-tint)]">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      autoGrow(e.currentTarget);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      canChat
                        ? messages.length === 0
                          ? `Ask anything about ${scopeName}…`
                          : "Ask a follow-up…"
                        : "Upload materials to start chatting"
                    }
                    disabled={busy || !canChat}
                    className="max-h-[120px] min-w-0 flex-1 resize-none bg-transparent py-1.5 font-sans text-[14.5px] leading-normal text-ink outline-none placeholder:text-ink-faint disabled:opacity-60"
                  />
                  <button
                    type="button"
                    aria-label="Send"
                    onClick={() => handleChat(chatInput)}
                    disabled={busy || !chatInput.trim() || !canChat}
                    className="grid size-[38px] shrink-0 cursor-pointer place-items-center rounded-[9px] bg-accent text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:bg-sunk disabled:text-ink-faint"
                  >
                    <Send className="size-[17px]" />
                  </button>
                </div>
                <div className="mt-2.5 flex items-center gap-2 px-0.5">
                  {/* Scope reminder — live view of the top-bar ScopePicker */}
                  <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-accent-tint px-[11px] py-1 font-sans text-ui-s text-accent-deep">
                    <FolderTree
                      className="size-3 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{scopeName || "…"}</span>
                  </span>
                  <span className="hidden font-sans text-ui-s text-ink-faint sm:inline">
                    The tutor draws only from these materials
                  </span>
                  <span className="flex-1" />
                  <span className="hidden shrink-0 font-sans text-ui-s text-ink-faint sm:inline">
                    Enter to send · Shift+Enter for a new line
                  </span>
                </div>
              </div>
            </div>
          </div>
  );
}

function TutorHead() {
  return (
    <div className="mb-2.5 flex items-center gap-[9px]">
      <span className="grid size-[26px] place-items-center rounded-[7px] bg-accent text-white">
        <Sparkles className="size-3.5" aria-hidden="true" />
      </span>
      <span className="font-sans text-ui-s font-semibold text-ink-soft">
        AI tutor
      </span>
    </div>
  );
}

function EmptyState({
  canChat,
  scopeName,
  onAsk,
  onUploadClick,
}: {
  canChat: boolean;
  scopeName: string;
  onAsk: (q: string) => void;
  onUploadClick: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-[22px] grid size-14 place-items-center rounded-xl bg-accent-tint text-accent-deep">
        <Sparkles className="size-[26px]" aria-hidden="true" />
      </div>
      <h2 className="mb-2.5 font-display text-display-m text-ink">
        Ask your AI tutor anything
      </h2>
      <p className="max-w-[440px] font-read text-read-s text-ink-soft">
        {canChat
          ? "Answers are drawn from your course materials — not the open internet — so they match exactly what you're studying."
          : "Upload course materials first — the tutor answers from them, not the open internet."}
      </p>
      {canChat ? (
        <>
          <span className="mt-3.5 mb-[30px] inline-flex items-center gap-[7px] rounded-full bg-accent-tint px-[13px] py-1.5 font-sans text-ui-s text-accent-deep">
            <FolderTree className="size-3.5" aria-hidden="true" />
            Currently grounded in {scopeName}
          </span>
          <div className="flex max-w-[560px] flex-wrap justify-center gap-2.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => onAsk(q)}
                className="cursor-pointer rounded-lg border border-rule-strong bg-raised px-4 py-3 text-left font-read text-[15px] text-ink-soft transition-colors hover:border-accent hover:bg-accent-tint hover:text-accent-deep"
              >
                {q}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-7">
          <Button variant="primary" onClick={onUploadClick}>
            Upload materials
          </Button>
        </div>
      )}
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex-1 px-14 py-[30px] max-md:px-5">
      <div className="mb-8 flex justify-end">
        <div className="skeleton-sheen h-11 w-1/3 rounded-[14px] bg-sunk" />
      </div>
      <div className="mb-2.5 h-[26px] w-24 rounded bg-sunk skeleton-sheen" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-4 rounded bg-sunk skeleton-sheen"
            style={{ width: `${92 - (i % 3) * 14}%` }}
          />
        ))}
      </div>
    </div>
  );
}
