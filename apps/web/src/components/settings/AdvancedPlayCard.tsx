import { useState } from "react";
import { ChevronDown, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { copyTextToClipboard } from "./settings-utils";

const ADVANCED_PROMPTS = [
  {
    title: "人物画像",
    prompt:
      "请通过 EdgeEver MCP 读取我的笔记，基于真实笔记内容为我整理一份人物画像。请只根据笔记中的证据判断，不要做心理诊断，不要夸张定性。输出包括：长期关注的主题、做事偏好、能力线索、反复出现的问题、近期动向，并在每条结论后列出相关笔记标题或 memo id。",
  },
  {
    title: "知识图谱",
    prompt:
      "请通过 EdgeEver MCP 读取我的笔记，为我整理一份知识地图。请找出主要知识领域、每个领域下的关键概念、相关笔记、我已经掌握的部分和还需要补齐的问题。输出结构要适合后续继续学习和写作。",
  },
  {
    title: "标签建议",
    prompt:
      "请通过 EdgeEver MCP 读取我的笔记和现有标签，帮我设计一套更清晰的标签体系。请指出重复、过细、过宽或命名不一致的标签，并给出合并、重命名和新增标签建议。先不要修改笔记，等我确认后再执行。",
  },
] as const;

export const AdvancedPlayCard = () => {
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleCopyPrompt = async (title: string, prompt: string) => {
    if (!(await copyTextToClipboard(prompt))) {
      return;
    }

    setCopiedPrompt(title);
    window.setTimeout(() => {
      setCopiedPrompt((current) => (current === title ? null : current));
    }, 1600);
  };

  return (
    <Card className="w-full min-w-0 overflow-hidden shadow-none">
      <CardHeader className="p-4">
        <button
          className="flex w-full min-w-0 items-start justify-between gap-3 text-left"
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          <span className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              进阶玩法
            </CardTitle>
            <CardDescription className="mt-1 text-xs leading-4">
              搭配AI Agent的进阶玩法。
            </CardDescription>
          </span>
          <ChevronDown
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform",
              expanded ? "rotate-180" : "rotate-0"
            )}
          />
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="grid gap-3 p-4 pt-0">
          {ADVANCED_PROMPTS.map((item) => (
            <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-bold text-slate-900">{item.title}</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-full justify-center bg-white px-3 text-xs sm:w-auto"
                  type="button"
                  onClick={() => void handleCopyPrompt(item.title, item.prompt)}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedPrompt === item.title ? "已复制" : "复制 Prompt"}
                </Button>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">{item.prompt}</p>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
};
