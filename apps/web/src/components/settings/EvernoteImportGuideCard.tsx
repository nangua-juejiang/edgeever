import { HelpCircle, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EVERNOTE_MIGRATION_PATH } from "@/lib/routes";

interface EvernoteImportGuideCardProps {
  onShowGuide?: () => void;
}

export const EvernoteImportGuideCard = ({ onShowGuide }: EvernoteImportGuideCardProps) => (
  <Card className="hidden w-full min-w-0 overflow-hidden shadow-none lg:block">
    <CardHeader className="p-4">
      <CardTitle className="flex items-center gap-2 text-sm">
        <UploadCloud className="h-4 w-4 text-emerald-700" />
        导入印象笔记
        {onShowGuide ? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 bg-white px-2.5 text-xs gap-1"
            type="button"
            onClick={onShowGuide}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            操作指引
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-7 bg-white px-2.5 text-xs" type="button" asChild>
            <a
              href={EVERNOTE_MIGRATION_PATH}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="在新标签页打开印象笔记迁移操作指引"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              操作指引
            </a>
          </Button>
        )}
      </CardTitle>
      <CardDescription className="text-xs leading-4">
        查看从印象笔记迁移到 EdgeEver 的步骤，推荐使用 MCP 与 AI Agent 批量导入。
      </CardDescription>
    </CardHeader>
  </Card>
);
