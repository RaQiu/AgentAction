import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface SkillPreview {
  kind: "skill";
  name: string;
  description?: string;
  bodyPreview: string;
}

export interface McpPreview {
  kind: "mcp";
  command: string;
  args: string[];
  type: string;
  startupTimeoutSec?: number;
}

export type ImportPreview = SkillPreview | McpPreview;

export function parseSkillText(content: string): SkillPreview {
  const parsed = matter(content);
  const data = parsed.data as Record<string, string | undefined>;

  return {
    kind: "skill",
    name: data.name ?? "未命名 Skill",
    description: data.description,
    bodyPreview: parsed.content.trim().slice(0, 240)
  };
}

export function parseMcpText(content: string): McpPreview {
  const parsed = JSON.parse(content) as {
    command: string;
    args?: string[];
    type?: string;
    startup_timeout_sec?: number;
  };

  return {
    kind: "mcp",
    command: parsed.command,
    args: parsed.args ?? [],
    type: parsed.type ?? "stdio",
    startupTimeoutSec: parsed.startup_timeout_sec
  };
}

export function previewImport(content: string): ImportPreview {
  const trimmed = content.trim();

  if (trimmed.startsWith("{")) {
    return parseMcpText(trimmed);
  }

  return parseSkillText(trimmed);
}

export interface DirectoryPluginSummary {
  name: string;
  relativePath: string;
  containerType: "file" | "folder";
}

export function scanPluginDirectory(rootDir: string): DirectoryPluginSummary[] {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  return fs.readdirSync(rootDir).map((entryName: string) => {
    const fullPath = path.join(rootDir, entryName);
    const stat = fs.statSync(fullPath);

    return {
      name: entryName,
      relativePath: fullPath,
      containerType: stat.isDirectory() ? "folder" : "file"
    };
  });
}
