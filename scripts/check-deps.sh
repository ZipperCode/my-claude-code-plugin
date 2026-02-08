#!/usr/bin/env bash
# Maestro dependency detection script
# Checks CLI tools and MCP server availability

set -euo pipefail

# Optional positional argument: target project directory (default: current directory)
TARGET_PROJECT="${1:-.}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "  Maestro Dependency Check"
echo "========================================="
echo ""

# --- CLI Tools ---
echo "--- CLI Tools ---"

check_cli() {
  local name="$1"
  local required="$2"
  if command -v "$name" &>/dev/null; then
    echo -e "${GREEN}[OK]${NC} $name: $(command -v "$name")"
    return 0
  else
    if [ "$required" = "required" ]; then
      echo -e "${RED}[MISSING]${NC} $name (required)"
    else
      echo -e "${YELLOW}[MISSING]${NC} $name (optional)"
    fi
    return 1
  fi
}

UV_OK=false
SPECIFY_OK=false
OPENSPEC_OK=false
CODEX_OK=false
GEMINI_OK=false

check_cli "uv" "recommended" && UV_OK=true
if [ "$UV_OK" = false ]; then
  echo -e "  ${YELLOW}↳ Install: curl -LsSf https://astral.sh/uv/install.sh | sh${NC}"
  echo -e "  ${YELLOW}↳ Required for codex-mcp and gemini-mcp installation${NC}"
fi
check_cli "specify" "required" && SPECIFY_OK=true
check_cli "openspec" "required" && OPENSPEC_OK=true
check_cli "codex" "optional" && CODEX_OK=true
check_cli "gemini" "optional" && GEMINI_OK=true

echo ""

# --- Slash Command Registration ---
echo "--- Slash Command Registration ---"

SPECKIT_CMDS=false
OPENSPEC_CMDS=false

# Detect spec-kit slash commands: .claude/commands/speckit.*.md
if ls "$TARGET_PROJECT"/.claude/commands/speckit.*.md &>/dev/null; then
  SPECKIT_CMDS=true
  echo -e "${GREEN}[OK]${NC} spec-kit slash commands (/speckit.*) registered"
else
  if [ "$SPECIFY_OK" = true ]; then
    echo -e "${YELLOW}[NOT INITIALIZED]${NC} spec-kit slash commands not found in project"
    echo -e "  ${YELLOW}↳ Run in target project: specify init --here --ai claude${NC}"
  else
    echo -e "${RED}[UNAVAILABLE]${NC} spec-kit slash commands (CLI not installed)"
  fi
fi

# Detect openspec slash commands: .claude/commands/opsx/
if [ -d "$TARGET_PROJECT/.claude/commands/opsx" ] && ls "$TARGET_PROJECT"/.claude/commands/opsx/*.md &>/dev/null; then
  OPENSPEC_CMDS=true
  echo -e "${GREEN}[OK]${NC} openspec slash commands (/opsx:*) registered"
else
  if [ "$OPENSPEC_OK" = true ]; then
    echo -e "${YELLOW}[NOT INITIALIZED]${NC} openspec slash commands not found in project"
    echo -e "  ${YELLOW}↳ Run in target project: openspec init --tools claude${NC}"
  else
    echo -e "${RED}[UNAVAILABLE]${NC} openspec slash commands (CLI not installed)"
  fi
fi

echo ""

# --- MCP Servers ---
echo "--- MCP Servers ---"

MCP_LIST=""
if command -v claude &>/dev/null; then
  MCP_LIST=$(claude mcp list 2>/dev/null || echo "")
fi

check_mcp() {
  local name="$1"
  local pattern="$2"
  local required="$3"
  if echo "$MCP_LIST" | grep -qi "$pattern"; then
    echo -e "${GREEN}[OK]${NC} MCP: $name"
    return 0
  else
    if [ "$required" = "required" ]; then
      echo -e "${RED}[MISSING]${NC} MCP: $name (required)"
    else
      echo -e "${YELLOW}[MISSING]${NC} MCP: $name (optional)"
    fi
    return 1
  fi
}

SEQ_THINK_OK=false
SERENA_OK=false
CONTEXT7_OK=false
WEBSEARCH_OK=false
CODEX_MCP_OK=false
GEMINI_MCP_OK=false
ACE_OK=false

check_mcp "codex-mcp" "codex" "optional" && CODEX_MCP_OK=true
if [ "$CODEX_MCP_OK" = false ] && { [ "$CODEX_OK" = true ] || [ "$UV_OK" = true ]; }; then
  echo -e "  ${YELLOW}↳ Install: claude mcp add codex -s user --transport stdio -- uvx --from git+https://github.com/GuDaStudio/codexmcp.git codexmcp${NC}"
fi
check_mcp "gemini-mcp" "gemini" "optional" && GEMINI_MCP_OK=true
if [ "$GEMINI_MCP_OK" = false ] && { [ "$GEMINI_OK" = true ] || [ "$UV_OK" = true ]; }; then
  echo -e "  ${YELLOW}↳ Install: claude mcp add gemini -s user --transport stdio -- uvx --from git+https://github.com/GuDaStudio/geminimcp.git geminimcp${NC}"
fi
check_mcp "sequential-thinking" "sequential-thinking" "recommended" && SEQ_THINK_OK=true
check_mcp "serena" "serena" "optional" && SERENA_OK=true
check_mcp "context7" "context7" "recommended" && CONTEXT7_OK=true
check_mcp "open-websearch" "websearch" "recommended" && WEBSEARCH_OK=true
check_mcp "ace-tool" "ace" "optional" && ACE_OK=true

echo ""

# --- Sequential-Thinking Fix Check ---
if [ "$SEQ_THINK_OK" = true ]; then
  if echo "$MCP_LIST" | grep -i "sequential-thinking" | grep -q "cmd /c"; then
    echo -e "${YELLOW}[WARN]${NC} sequential-thinking uses 'cmd /c' (Windows artifact on WSL)"
    echo "  Fix: claude mcp remove sequential-thinking && claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking"
  fi
fi

# --- Multi-Model Status ---
echo "--- Multi-Model Collaboration ---"
MULTI_MODEL="none"
if [ "$CODEX_OK" = true ] || [ "$CODEX_MCP_OK" = true ]; then
  if [ "$GEMINI_OK" = true ] || [ "$GEMINI_MCP_OK" = true ]; then
    MULTI_MODEL="full"
    echo -e "${GREEN}[OK]${NC} Full multi-model collaboration available"
  else
    MULTI_MODEL="codex-only"
    echo -e "${YELLOW}[DEGRADED]${NC} Only codex available (gemini missing)"
  fi
elif [ "$GEMINI_OK" = true ] || [ "$GEMINI_MCP_OK" = true ]; then
  MULTI_MODEL="gemini-only"
  echo -e "${YELLOW}[DEGRADED]${NC} Only gemini available (codex missing)"
else
  MULTI_MODEL="claude-solo"
  echo -e "${YELLOW}[INFO]${NC} No external models — Claude solo mode"
fi

echo ""

# --- Output JSON Summary ---
echo "--- JSON Summary ---"
cat <<ENDJSON
{
  "cli": {
    "uv": $UV_OK,
    "specify": $SPECIFY_OK,
    "openspec": $OPENSPEC_OK,
    "codex": $CODEX_OK,
    "gemini": $GEMINI_OK
  },
  "slashCommands": {
    "speckit": $SPECKIT_CMDS,
    "openspec": $OPENSPEC_CMDS
  },
  "mcp": {
    "codex": $CODEX_MCP_OK,
    "gemini": $GEMINI_MCP_OK,
    "sequential-thinking": $SEQ_THINK_OK,
    "serena": $SERENA_OK,
    "context7": $CONTEXT7_OK,
    "open-websearch": $WEBSEARCH_OK,
    "ace-tool": $ACE_OK
  },
  "multiModelAvailable": $([ "$MULTI_MODEL" = "full" ] && echo true || echo false),
  "degradationMode": "$MULTI_MODEL"
}
ENDJSON

echo ""
echo "========================================="
echo "  Check complete"
echo "========================================="
