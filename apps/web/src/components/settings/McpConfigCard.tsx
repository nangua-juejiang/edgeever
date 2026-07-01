import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Copy, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";
import type { ApiToken } from "@edgeever/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { cn, formatDateTime } from "@/lib/utils";
import { AppConfirmDialog } from "@/components/dialogs/ConfirmDialogs";
import {
  ALL_TOKEN_SCOPES,
  buildMcpRemoteConfig,
  copyTextToClipboard,
  getEdgeEverBaseUrl,
  getTokenScopeLabel,
} from "./settings-utils";

interface CreatedTokenNoticeProps {
  token: string;
}

const CreatedTokenNotice = ({ token }: CreatedTokenNoticeProps) => {
  const [copiedAction, setCopiedAction] = useState<"token" | "config" | null>(null);

  const handleCopy = async (action: "token" | "config") => {
    const value = action === "token" ? token : buildMcpRemoteConfig(token);
    if (!(await copyTextToClipboard(value))) {
      return;
    }

    setCopiedAction(action);
    window.setTimeout(() => {
      setCopiedAction((current) => (current === action ? null : current));
    }, 1600);
  };

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-900">
        <ShieldCheck className="h-4 w-4 text-emerald-700" />
        API Token 已成功生成
      </div>
      <div className="flex flex-col gap-2 xl:flex-row">
        <div className="flex h-8 min-w-0 flex-1 items-center rounded-md border border-emerald-200 bg-white px-3 font-mono text-xs text-slate-900">
          <span className="min-w-0 truncate">{token}</span>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button
            size="sm"
            variant="solid"
            className="w-full whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
            type="button"
            onClick={() => void handleCopy("token")}
          >
            {copiedAction === "token" ? "已复制" : "复制 Token"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-full whitespace-nowrap border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50 sm:w-auto"
            type="button"
            onClick={() => void handleCopy("config")}
          >
            {copiedAction === "config" ? "已复制" : "复制完整 MCP 配置"}
          </Button>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium leading-4 text-emerald-800">安全提醒：此 Token 属于高危凭证，请勿对外泄露。</p>
    </div>
  );
};

const McpTitleWithHelp = () => {
  const baseUrl = getEdgeEverBaseUrl();
  const [copied, setCopied] = useState(false);
  const remoteExample = JSON.stringify(
    {
      mcpServers: {
        edgeever: {
          url: `${baseUrl}/mcp`,
          headers: {
            Authorization: "Bearer 我创建的token",
          },
        },
      },
    },
    null,
    2
  );

  const handleCopy = async () => {
    if (!(await copyTextToClipboard(remoteExample))) {
      return;
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="w-fit max-w-full">
      <CardTitle className="flex items-center gap-2 text-sm">
        <KeyRound className="h-4 w-4 text-emerald-700" />
        生成 MCP 配置
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-7 bg-white px-2.5 text-xs" type="button">
              使用示例
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl gap-3 p-4 sm:p-5">
            <DialogHeader>
              <DialogTitle className="text-base">Remote MCP 示例</DialogTitle>
            </DialogHeader>
            <pre className="max-h-[55vh] overflow-auto rounded-md border border-slate-100 bg-slate-950 p-3 text-left text-[11px] leading-5 text-slate-100 sm:text-xs">
              <code>{remoteExample}</code>
            </pre>
            <div className="flex justify-end">
              <Button
                size="md"
                variant="solid"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                type="button"
                onClick={() => void handleCopy()}
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "已复制" : "复制示例"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardTitle>
    </div>
  );
};

interface ScopePickerProps {
  availableScopes: string[];
  selectedScopes: Set<string>;
  onToggleScope: (scope: string) => void;
}

const ScopePicker = ({ availableScopes, selectedScopes, onToggleScope }: ScopePickerProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left"
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-slate-700">Token 权限范围</span>
          <span className="mt-0.5 block text-[11px] font-medium text-slate-400">
            已选择 {selectedScopes.size}/{availableScopes.length}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform",
            expanded ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      {expanded && (
        <div className="grid gap-2 border-t border-slate-100 p-3 sm:grid-cols-2">
          {availableScopes.map((scope) => {
            const checked = selectedScopes.has(scope);
            const checkboxId = `token-scope-${scope.replace(/[^a-z0-9]+/gi, "-")}`;

            return (
              <label
                key={scope}
                htmlFor={checkboxId}
                className={cn(
                  "flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                  checked
                    ? "border-emerald-500/30 bg-emerald-50/70 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  onCheckedChange={() => onToggleScope(scope)}
                  className="border-emerald-300"
                />
                <span className="min-w-0 truncate text-xs font-semibold" title={scope}>
                  {getTokenScopeLabel(scope)}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface TokenListProps {
  tokens: ApiToken[];
  isLoading: boolean;
  isDeleting: boolean;
  onDelete: (token: ApiToken) => void;
}

const TokenList = ({ tokens, isLoading, isDeleting, onDelete }: TokenListProps) => {
  const [copiedAction, setCopiedAction] = useState<{ tokenId: string; action: "token" | "config" } | null>(null);

  const handleCopy = async (token: ApiToken, action: "token" | "config") => {
    if (!token.token) {
      return;
    }

    const value = action === "token" ? token.token : buildMcpRemoteConfig(token.token);
    if (!(await copyTextToClipboard(value))) {
      return;
    }

    setCopiedAction({ tokenId: token.id, action });
    window.setTimeout(() => {
      setCopiedAction((current) => (current?.tokenId === token.id && current.action === action ? null : current));
    }, 1600);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
        正在加载 Token 列表...
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
        暂无活跃的 API Token
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tokens.map((token) => (
        <div
          key={token.id}
          className={cn(
            "flex min-h-16 flex-col items-stretch gap-3 rounded-lg border p-3 transition-colors sm:p-4 lg:flex-row lg:items-center",
            token.isRevoked ? "border-slate-100 bg-slate-50/50 opacity-60" : "border-slate-200 bg-white hover:border-slate-300"
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold leading-tight text-slate-900">{token.name}</span>
            <span
              className="mt-2 block w-fit max-w-full truncate rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500"
              title={token.scopes.join(", ")}
            >
              {token.scopes.map(getTokenScopeLabel).join("、") || "无权限"}
            </span>
            <span className="mt-2 block text-[11px] font-medium text-slate-400">
              {token.lastUsedAt ? `上次调用时间：${formatDateTime(token.lastUsedAt)}` : "从未被调用"}
              {!token.token ? " · 旧 Token 无法找回明文，请重新生成" : ""}
            </span>
          </span>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:items-center">
            <Button
              size="sm"
              variant="outline"
              className="h-9 justify-center whitespace-nowrap bg-white px-3 text-xs"
              title={token.token ? "复制 Token" : "旧 Token 无法复制"}
              aria-label={token.token ? "复制 Token" : "旧 Token 无法复制"}
              disabled={token.isRevoked || !token.token}
              onClick={() => void handleCopy(token, "token")}
            >
              {copiedAction?.tokenId === token.id && copiedAction.action === "token" ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedAction?.tokenId === token.id && copiedAction.action === "token" ? "已复制" : "复制 Token"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 justify-center whitespace-nowrap bg-white px-3 text-xs"
              title={token.token ? "复制完整 MCP 配置" : "旧 Token 无法复制 MCP 配置"}
              aria-label={token.token ? "复制完整 MCP 配置" : "旧 Token 无法复制 MCP 配置"}
              disabled={token.isRevoked || !token.token}
              onClick={() => void handleCopy(token, "config")}
            >
              {copiedAction?.tokenId === token.id && copiedAction.action === "config" ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copiedAction?.tokenId === token.id && copiedAction.action === "config" ? "已复制" : "复制完整 MCP 配置"}
            </Button>
            <Button
              size="icon"
              variant="danger"
              className="h-9 w-full shrink-0 sm:w-9"
              title="删除 Token"
              aria-label="删除 Token"
              disabled={token.isRevoked || isDeleting}
              onClick={() => onDelete(token)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export const McpConfigCard = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("MCP Agent");
  const [selectedScopes, setSelectedScopes] = useState<Set<string>>(() => new Set(ALL_TOKEN_SCOPES));
  const [scopeDefaultsSynced, setScopeDefaultsSynced] = useState(false);
  const [createdToken, setCreatedToken] = useState<{ token: string; apiToken: ApiToken } | null>(null);
  const [tokenDeleteConfirmation, setTokenDeleteConfirmation] = useState<ApiToken | null>(null);

  const tokensQuery = useQuery({
    queryKey: ["api-tokens"],
    queryFn: () => api.listApiTokens(),
  });

  const availableScopes = tokensQuery.data?.availableScopes ?? ALL_TOKEN_SCOPES;
  const tokens = tokensQuery.data?.apiTokens ?? [];

  useEffect(() => {
    if (scopeDefaultsSynced || !tokensQuery.data?.availableScopes) {
      return;
    }

    setSelectedScopes(new Set(tokensQuery.data.availableScopes));
    setScopeDefaultsSynced(true);
  }, [scopeDefaultsSynced, tokensQuery.data?.availableScopes]);

  const createMutation = useMutation({
    mutationFn: api.createApiToken,
    onSuccess: async (data) => {
      setCreatedToken(data);
      setName("");
      setSelectedScopes(new Set(availableScopes));
      await queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
    },
  });

  const deleteTokenMutation = useMutation({
    mutationFn: api.revokeApiToken,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["api-tokens"] });
    },
  });

  const toggleScope = (scope: string) => {
    setSelectedScopes((current) => {
      const next = new Set(current);
      if (next.has(scope)) {
        next.delete(scope);
      } else {
        next.add(scope);
      }
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const scopes = Array.from(selectedScopes);

    if (!name.trim() || scopes.length === 0) {
      return;
    }

    createMutation.mutate({ name: name.trim(), scopes });
  };

  return (
    <>
      <Card className="w-full min-w-0 overflow-hidden shadow-none">
        <CardHeader className="p-4">
          <McpTitleWithHelp />
          <CardDescription className="text-xs leading-4">让 AI Agent 可以读取和整理你的笔记。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          {createdToken && <CreatedTokenNotice token={createdToken.token} />}

          <form className="min-w-0 space-y-4 rounded-lg border border-slate-100 bg-slate-50/70 p-3" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                className="h-9 min-w-0 flex-1 text-xs focus-visible:ring-4 focus-visible:ring-emerald-500/10"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Token 用途，例如：MCP Agent"
              />
              <Button
                size="md"
                variant="solid"
                className="h-9 w-full whitespace-nowrap bg-emerald-500 text-white hover:bg-emerald-600 sm:w-32"
                type="submit"
                disabled={createMutation.isPending}
              >
                <Plus className="h-4 w-4" />
                生成 Token
              </Button>
            </div>

            <ScopePicker
              availableScopes={availableScopes}
              selectedScopes={selectedScopes}
              onToggleScope={toggleScope}
            />
          </form>

          <div className="space-y-3">
            <span className="block text-xs font-semibold text-slate-500">活跃 Token</span>
            <TokenList
              tokens={tokens}
              isLoading={tokensQuery.isLoading}
              isDeleting={deleteTokenMutation.isPending}
              onDelete={setTokenDeleteConfirmation}
            />
          </div>
        </CardContent>
      </Card>

      {tokenDeleteConfirmation && (
        <AppConfirmDialog
          title={`确定要删除 Token「${tokenDeleteConfirmation.name}」吗？`}
          description="删除操作不可逆。一旦删除，使用此 Token 进行 API 或 MCP 调用的一切客户端将立即失效并被拒绝访问。"
          confirmLabel="确认删除"
          isWorking={deleteTokenMutation.isPending}
          tone="danger"
          onCancel={() => setTokenDeleteConfirmation(null)}
          onConfirm={() => {
            deleteTokenMutation.mutate(tokenDeleteConfirmation.id, {
              onSuccess: () => setTokenDeleteConfirmation(null),
            });
          }}
        />
      )}
    </>
  );
};
