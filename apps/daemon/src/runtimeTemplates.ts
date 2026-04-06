import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { RuntimePlugin } from "@agentaction/shared";
import { nowIso } from "@agentaction/shared";
import type {
  RuntimeTemplate,
  RuntimeTemplateCheckContext,
  RuntimeTemplateInstallContext
} from "@agentaction/runtime-core";
import { runCodexTaskReply } from "./runtimeAgent";

function commandLocatorForCurrentOs(): { command: string; args: (binary: string) => string[] } {
  if (process.platform === "win32") {
    return {
      command: "where",
      args: (binary) => [binary]
    };
  }

  return {
    command: "which",
    args: (binary) => [binary]
  };
}

function firstNonEmptyLine(value: string): string | undefined {
  return value
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
}

function repoLooksRunnable(targetDir: string): string[] {
  const candidatePaths = [
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "requirements.txt",
    "README.md",
    "src/main.py",
    "src/setup.py",
    "rust/Cargo.toml"
  ];

  return candidatePaths.filter((signal) => fs.existsSync(path.join(targetDir, signal)));
}

function checkGithubReachability(runtime: RuntimePlugin, details: string[]): void {
  if (!runtime.githubUrl) {
    return;
  }

  const remote = spawnSync("git", ["ls-remote", runtime.githubUrl, "HEAD"], {
    cwd: process.cwd(),
    encoding: "utf-8"
  });

  if (remote.status === 0) {
    details.push(`GitHub 可达：${firstNonEmptyLine(remote.stdout) ?? runtime.githubUrl}`);
  } else {
    details.push(`GitHub 不可达：${runtime.githubUrl}`);
  }
}

function runExistingInstallProbe(runtime: RuntimePlugin, details: string[]) {
  let detectedCommandPath = runtime.detectedCommandPath;
  let detectedVersion = runtime.detectedVersion;
  let passed = false;

  if (!runtime.command) {
    return { detectedCommandPath, detectedVersion, passed };
  }

  const locator = commandLocatorForCurrentOs();
  const locate = spawnSync(locator.command, locator.args(runtime.command), {
    cwd: process.cwd(),
    encoding: "utf-8"
  });

  if (locate.status === 0) {
    detectedCommandPath = firstNonEmptyLine(locate.stdout);
    details.push(`命令存在：${detectedCommandPath}`);

    const probe = spawnSync(runtime.command, runtime.probeArgs ?? ["--version"], {
      cwd: process.cwd(),
      encoding: "utf-8"
    });
    const stdout = `${probe.stdout ?? ""}\n${probe.stderr ?? ""}`.trim();

    if (probe.status === 0 || stdout.length > 0) {
      passed = true;
      detectedVersion = firstNonEmptyLine(stdout) ?? detectedVersion;
      details.push(`hack 探测通过：${detectedVersion ?? "已拿到命令输出"}`);
    } else {
      details.push("hack 探测失败：命令可执行但没有拿到有效输出");
    }
  } else {
    details.push(`命令缺失：${runtime.command}`);
  }

  return { detectedCommandPath, detectedVersion, passed };
}

function runCloneProbe(runtime: RuntimePlugin, details: string[]) {
  let passed = false;

  if (runtime.pathHint && fs.existsSync(runtime.pathHint)) {
    const signals = repoLooksRunnable(runtime.pathHint);
    if (signals.length > 0) {
      passed = true;
      details.push(`clone 仓库有效：检测到 ${signals.join("、")}`);
    } else {
      details.push("clone 仓库存在，但缺少常见项目入口文件");
    }
  } else if (runtime.source === "cloned-source") {
    details.push(`clone 路径缺失：${runtime.pathHint ?? "未记录路径"}`);
  }

  return passed;
}

function buildCheckedRuntime(
  runtime: RuntimePlugin,
  details: string[],
  existingPassed: boolean,
  clonePassed: boolean,
  detectedCommandPath?: string,
  detectedVersion?: string
): RuntimePlugin {
  let checkState: RuntimePlugin["checkState"] = "failed";
  let status: RuntimePlugin["status"] = "missing";
  let checkSummary = "既没有通过 hack 检查，也没有通过 clone 检查。";

  if (existingPassed && clonePassed) {
    checkState = "passed";
    status = "ready";
    checkSummary = "hack 与 clone 检查都通过。";
  } else if (existingPassed) {
    checkState = "passed";
    status = "ready";
    checkSummary = "hack 注入探测通过。";
  } else if (clonePassed) {
    checkState = "partial";
    status = "degraded";
    checkSummary = "clone 检查通过，但 hack 注入尚未通过。";
  }

  return {
    ...runtime,
    detectedCommandPath,
    detectedVersion,
    checkState,
    checkSummary,
    checkDetails: details,
    status,
    lastCheckedAt: nowIso()
  };
}

function cloneRuntimeFromGithub(runtime: RuntimePlugin, context: RuntimeTemplateInstallContext): RuntimePlugin {
  if (!runtime.githubUrl) {
    throw new Error("Missing GitHub source");
  }

  const runtimeDir = path.join(context.stateRoot, "runtime-clones", runtime.targetRuntime);
  fs.rmSync(runtimeDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(runtimeDir), { recursive: true });

  const args = ["clone"];
  if (runtime.shallowClone) {
    args.push("--depth", "1", "--filter=blob:none");
  }
  args.push(runtime.githubUrl, runtimeDir);

  const result = spawnSync("git", args, {
    cwd: context.workspaceRoot,
    encoding: "utf-8"
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Git clone failed");
  }

  return {
    ...runtime,
    source: "cloned-source",
    status: "ready",
    pathHint: runtimeDir,
    checkState: "partial",
    checkSummary: "GitHub clone 已完成，等待进一步 hack/运行探测。",
    checkDetails: [`已克隆到 ${runtimeDir}`],
    lastCheckedAt: nowIso()
  };
}

function createCommonCheck(runtime: RuntimePlugin): RuntimePlugin {
  const details: string[] = [];
  checkGithubReachability(runtime, details);
  const existing = runExistingInstallProbe(runtime, details);
  const clonePassed = runCloneProbe(runtime, details);

  return buildCheckedRuntime(
    runtime,
    details,
    existing.passed,
    clonePassed,
    existing.detectedCommandPath,
    existing.detectedVersion
  );
}

const codexTemplate: RuntimeTemplate = {
  targetRuntime: "codex",
  check(runtime) {
    return createCommonCheck(runtime);
  },
  async runTask(context) {
    return runCodexTaskReply(context);
  }
};

const clawCodeTemplate: RuntimeTemplate = {
  targetRuntime: "claw-code",
  check(runtime) {
    return createCommonCheck(runtime);
  },
  installFromGitHub(runtime, context) {
    return cloneRuntimeFromGithub(runtime, context);
  }
};

const openclawTemplate: RuntimeTemplate = {
  targetRuntime: "openclaw",
  check(runtime) {
    return createCommonCheck(runtime);
  },
  installFromGitHub(runtime, context) {
    return cloneRuntimeFromGithub(runtime, context);
  }
};

const templates = [codexTemplate, clawCodeTemplate, openclawTemplate];

export function getRuntimeTemplate(runtime: RuntimePlugin): RuntimeTemplate | undefined {
  return templates.find((item) => item.targetRuntime === runtime.targetRuntime);
}
