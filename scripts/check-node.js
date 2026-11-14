#!/usr/bin/env node
/**
 * Fails fast with a readable message when the Node version is too old.
 *
 * Written in ES5 on purpose: it runs *before* the toolchain, so it has to work
 * on whatever ancient Node the user happens to have on PATH (Node 10 is common
 * on older Linux images, and Next.js 15 crashes there with a cryptic
 * "Unexpected token ?" from a bundled dependency).
 */
var MIN_MAJOR = 22;
var MIN_MINOR = 5;

var parts = process.versions.node.split(".");
var major = parseInt(parts[0], 10);
var minor = parseInt(parts[1], 10);
var ok = major > MIN_MAJOR || (major === MIN_MAJOR && minor >= MIN_MINOR);

if (ok) {
  process.exit(0);
}

var rule = "────────────────────────────────────────────────────────";
var lines = [
  "",
  rule,
  "  Hana 需要 Node.js " + MIN_MAJOR + "." + MIN_MINOR + " 或更高版本",
  "  当前版本：" + process.versions.node + "（" + process.execPath + "）",
  rule,
  "",
  "  原因：Next.js 15 依赖现代语法，项目还使用了 Node 内置的 node:sqlite，",
  "  两者都无法在旧版本上运行。",
  "",
  "  解决方式（任选其一）：",
  "",
  "    # 1. 用 nvm（推荐）",
  "    nvm install 24 && nvm use 24",
  "",
  "    # 2. 机器上已经装了新版本，只是 PATH 里是旧的",
  "    export PATH=\"<指向 node 22.5+ 的 bin 目录>:$PATH\"",
  "",
  "    # 3. 不想装 Node，就用 Docker",
  "    ./deploy.sh",
  "",
  "  确认版本：node -v   （应显示 v22.5.0 或更高）",
  "",
  rule,
  "",
];

for (var i = 0; i < lines.length; i++) {
  console.error(lines[i]);
}

process.exit(1);
