import { Bold, Check, ChevronDown, ImagePlus, List, Minus, Quote } from "lucide-react";
import type { NotebookMoveOption } from "@/lib/app-helpers";
import type { MobileEditorSaveState } from "@/lib/mobile-editor-standalone";

export const MobileEditorHeader = ({
  saveLabel,
  statusClassName,
  saveState,
  onLeave,
}: {
  saveLabel: string;
  statusClassName: string;
  saveState: MobileEditorSaveState;
  onLeave: () => void;
}) => (
  <header className="mobile-editor-header">
    <button className="mobile-editor-back" type="button" aria-label="返回" onClick={onLeave}>
      ‹
    </button>
    <div className="mobile-editor-actions">
      <span className={`mobile-editor-status ${statusClassName}`}>{saveLabel}</span>
      <button className="mobile-editor-done" type="button" disabled={saveState === "loading"} onClick={onLeave}>
        完成
      </button>
    </div>
  </header>
);

export const MobileEditorToolbar = ({
  disabled,
  boldActive,
  bulletListActive,
  blockquoteActive,
  onPickImage,
  onToggleBold,
  onToggleBulletList,
  onToggleBlockquote,
  onSetHorizontalRule,
}: {
  disabled: boolean;
  boldActive: boolean;
  bulletListActive: boolean;
  blockquoteActive: boolean;
  onPickImage: () => void;
  onToggleBold: () => void;
  onToggleBulletList: () => void;
  onToggleBlockquote: () => void;
  onSetHorizontalRule: () => void;
}) => (
  <div className="mobile-editor-tool-row">
    <button
      className="mobile-editor-tool-button"
      type="button"
      aria-label="上传图片"
      title="上传图片"
      disabled={disabled}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onPickImage}
    >
      <ImagePlus aria-hidden="true" size={18} strokeWidth={2} />
    </button>
    <button
      className="mobile-editor-tool-button"
      type="button"
      aria-label="加粗"
      title="加粗"
      aria-pressed={boldActive}
      disabled={disabled}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onToggleBold}
    >
      <Bold aria-hidden="true" size={17} strokeWidth={2.4} />
    </button>
    <button
      className="mobile-editor-tool-button"
      type="button"
      aria-label="无序列表"
      title="无序列表"
      aria-pressed={bulletListActive}
      disabled={disabled}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onToggleBulletList}
    >
      <List aria-hidden="true" size={18} strokeWidth={2.2} />
    </button>
    <button
      className="mobile-editor-tool-button"
      type="button"
      aria-label="引用"
      title="引用"
      aria-pressed={blockquoteActive}
      disabled={disabled}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onToggleBlockquote}
    >
      <Quote aria-hidden="true" size={17} strokeWidth={2.2} />
    </button>
    <button
      className="mobile-editor-tool-button"
      type="button"
      aria-label="分割线"
      title="分割线"
      disabled={disabled}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onSetHorizontalRule}
    >
      <Minus aria-hidden="true" size={18} strokeWidth={2.4} />
    </button>
  </div>
);

export const MobileEditorNotebookButton = ({
  label,
  disabled,
  onOpen,
}: {
  label: string;
  disabled: boolean;
  onOpen: () => void;
}) => (
  <button className="mobile-editor-notebook-button" type="button" aria-label="所在笔记本" disabled={disabled} onClick={onOpen}>
    <span>{label}</span>
    <ChevronDown aria-hidden="true" size={14} strokeWidth={2.2} />
  </button>
);

export const MobileEditorNotebookSheet = ({
  options,
  selectedNotebookId,
  updating,
  onClose,
  onSelect,
}: {
  options: NotebookMoveOption[];
  selectedNotebookId?: string;
  updating: boolean;
  onClose: () => void;
  onSelect: (notebookId: string) => void;
}) => (
  <div className="mobile-editor-sheet-backdrop" role="presentation" onClick={onClose}>
    <section
      className="mobile-editor-notebook-sheet"
      role="dialog"
      aria-modal="true"
      aria-label="选择笔记本"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mobile-editor-notebook-sheet-handle" aria-hidden="true" />
      <div className="mobile-editor-notebook-sheet-header">
        <h2>所在笔记本</h2>
        <button type="button" onClick={onClose}>
          关闭
        </button>
      </div>
      <div className="mobile-editor-notebook-list">
        {options.map((notebook) => {
          const selected = notebook.id === selectedNotebookId;

          return (
            <button
              key={notebook.id}
              className="mobile-editor-notebook-option"
              type="button"
              aria-current={selected ? "page" : undefined}
              disabled={updating}
              style={{ paddingLeft: `${16 + notebook.depth * 18}px` }}
              onClick={() => onSelect(notebook.id)}
            >
              <span>{notebook.name}</span>
              {selected && <Check aria-hidden="true" size={16} strokeWidth={2.4} />}
            </button>
          );
        })}
      </div>
    </section>
  </div>
);

export const MobileEditorFallback = ({ markdown }: { markdown: string }) => (
  <details className="mobile-editor-fallback">
    <summary>查看当前正文 Markdown 备份</summary>
    <pre>{markdown}</pre>
  </details>
);
