import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { isCommandAvailable, exec } from '../utils/shell.js';
import { CLI_TOOLS, MCP_SERVERS } from './constants.js';

export interface ToolStatus {
  name: string;
  installed: boolean;
  required: boolean;
  installCmd: string;
  description: string;
  version?: string;
}

export interface McpStatus {
  name: string;
  configured: boolean;
  recommended: boolean;
  addCmd: string;
  description: string;
}

/**
 * Detect all CLI tools and return their status.
 */
export function detectTools(): ToolStatus[] {
  const results: ToolStatus[] = [];

  for (const tool of CLI_TOOLS.required) {
    const installed = isCommandAvailable(tool.name);
    let version: string | undefined;
    if (installed) {
      const vResult = exec(`${tool.name} --version 2>/dev/null || ${tool.name} -V 2>/dev/null`);
      if (vResult.success) version = vResult.stdout.split('\n')[0];
    }
    results.push({
      name: tool.name,
      installed,
      required: true,
      installCmd: tool.installCmd,
      description: tool.description,
      version,
    });
  }

  for (const tool of CLI_TOOLS.optional) {
    const installed = isCommandAvailable(tool.name);
    let version: string | undefined;
    if (installed) {
      const vResult = exec(`${tool.name} --version 2>/dev/null || ${tool.name} -V 2>/dev/null`);
      if (vResult.success) version = vResult.stdout.split('\n')[0];
    }
    results.push({
      name: tool.name,
      installed,
      required: false,
      installCmd: tool.installCmd,
      description: tool.description,
      version,
    });
  }

  return results;
}

/**
 * Detect configured MCP servers via `claude mcp list`.
 */
export function detectMcpServers(): McpStatus[] {
  const listResult = exec('claude mcp list 2>/dev/null');
  const configuredServers = new Set<string>();

  if (listResult.success) {
    // Parse output — each line typically contains server name
    for (const line of listResult.stdout.split('\n')) {
      const trimmed = line.trim();
      if (trimmed) {
        // Extract server name (first word or before colon/space)
        const name = trimmed.split(/[\s:]/)[0];
        if (name) configuredServers.add(name);
      }
    }
  }

  const results: McpStatus[] = [];

  for (const server of MCP_SERVERS.core) {
    results.push({
      name: server.name,
      configured: configuredServers.has(server.name),
      recommended: true,
      addCmd: server.addCmd,
      description: server.description,
    });
  }

  for (const server of MCP_SERVERS.recommended) {
    results.push({
      name: server.name,
      configured: configuredServers.has(server.name),
      recommended: true,
      addCmd: server.addCmd,
      description: server.description,
    });
  }

  for (const server of MCP_SERVERS.optional) {
    results.push({
      name: server.name,
      configured: configuredServers.has(server.name),
      recommended: false,
      addCmd: server.addCmd,
      description: server.description,
    });
  }

  return results;
}

/**
 * Detect spec-kit / openspec slash commands.
 */
export function detectWorkflowCommands(projectDir: string): {
  specKit: boolean;
  openspec: boolean;
} {
  const claudeDir = join(projectDir, '.claude');
  let specKit = false;
  let openspec = false;

  // spec-kit: .claude/commands/speckit.*.md or .claude/skills/speckit*
  const commandsDir = join(claudeDir, 'commands');
  const skillsDir = join(claudeDir, 'skills');

  if (existsSync(commandsDir)) {
    const files = readdirSync(commandsDir) as string[];
    specKit = files.some((f: string) => f.startsWith('speckit.') || f.startsWith('speckit-'));
  }
  if (!specKit && existsSync(skillsDir)) {
    const dirs = readdirSync(skillsDir) as string[];
    specKit = dirs.some((d: string) => d.startsWith('speckit'));
  }

  // openspec: .claude/commands/opsx/*.md or .claude/skills/opsx*
  if (existsSync(join(commandsDir, 'opsx'))) {
    openspec = true;
  }
  if (!openspec && existsSync(skillsDir)) {
    const dirs = readdirSync(skillsDir) as string[];
    openspec = dirs.some((d: string) => d.startsWith('opsx') || d.startsWith('openspec'));
  }

  return { specKit, openspec };
}
