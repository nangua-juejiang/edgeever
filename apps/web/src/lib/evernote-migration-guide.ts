export type MigrationGuideCommand = {
  label: string;
  language: "sh" | "powershell";
  code: string;
};

export type MigrationGuideStep = {
  index: string;
  title: string;
  paragraphs?: string[];
  commands?: MigrationGuideCommand[];
  list?: string[];
};

export const EVERNOTE_MIGRATION_GUIDE = {
  title: "印象笔记迁移指引",
  subtitle: "支持 AI Agent 一键驱动或 MCP 自动化批量导入，保留笔记本组结构",
  introTitle: "最佳实践迁移方案",
  intro: [
    "我们强烈推荐使用 AI 编程助手（如 Antigravity、Claude Code、Cursor 等）自动执行迁移，或者基于 EdgeEver MCP (Model Context Protocol) 命令行进行迁移。该方案已完成内存流式优化与空文本预处理，能安全应对数 GB 级别超大笔记库，完整保留创建/修改时间与嵌套笔记本目录层级。",
  ],
  steps: [
    {
      index: "1",
      title: "第一步：配置与安装 EdgeEver MCP（让 AI 助手配置）",
      list: [
        "登录你的 EdgeEver 网页端，点击左下角的「设置（Settings）」图标。",
        "在设置面板中复制「MCP 服务端点」（格式为 \`https://域名/mcp\`），并在「API & MCP 授权」中生成一个 MCP Token（格式为 \`eev_...\`）。",
        "将以下 Prompt 发送给你的 AI 编程助手，让它自动在你的编辑器/终端客户端（如 Claude Code, Cursor, Cline 等）中配置好 EdgeEver MCP 工具：",
      ],
      commands: [
        {
          label: "复制给 AI 助手：一键配置安装 MCP 服务",
          language: "sh",
          code: `你是 AI 编程助手。我已生成了 EdgeEver 的 MCP 端点 <ENDPOINT> 和 Token <TOKEN>。请帮我在我当前使用的客户端（如 Claude Code, Cursor, Cline 等）中配置安装这个 EdgeEver MCP 服务。
- 桥接脚本为项目根目录的：\`scripts/edgeever-mcp-stdio.mjs\`
- 运行时需要注入环境变量：\`EDGEEVER_URL="<域名地址>" \` 和 \`EDGEEVER_TOKEN="<MCP_TOKEN>"\`。`,
        },
      ],
    },
    {
      index: "2",
      title: "第二步：让 AI 助手自动执行印象笔记迁移",
      paragraphs: [
        "当 AI 助手配置好 MCP 之后，请将以下 Prompt 发送给它，让它全自动拉取印象笔记数据并导入：",
      ],
      commands: [
        {
          label: "复制给 AI 助手：一键同步并导入笔记",
          language: "sh",
          code: `你是 AI 编程助手。请帮我把本地的印象笔记全量迁移到我部署的 EdgeEver 实例中：
1. 检查本地是否安装了 \`evernote-backup\`。若未安装请使用 \`pipx install evernote-backup\` 自动安装。
2. 提示我输入印象笔记用户名密码并初始化数据库（指定 china 后端），随后同步数据并导出到 \`./evernote-export\` 目录。
3. 在 EdgeEver 项目根目录下，使用先前配置的 URL 和 Token 运行内置导入脚本完成批量导入：
   \`EDGEEVER_URL="<地址>" EDGEEVER_TOKEN="<Token>" bun scripts/import-evernote-enex-via-mcp.mjs --input "./evernote-export" --yes\``,
        },
      ],
    },
    {
      index: "3",
      title: "第三步：在网页端验证结果",
      list: [
        "导入完成后，回到 EdgeEver 网页端刷新页面。",
        "检查左侧栏，确认原有的「笔记本组（堆叠）」层级结构已完美还原。",
        "打开几篇包含多张图片的笔记，验证其中的图片是否已成功加载并能清晰显示。",
        "验证完毕后，你可以回到「设置」->「API & MCP 授权」中吊销此 Token 以保障安全。",
      ],
    },
  ] satisfies MigrationGuideStep[],
};
