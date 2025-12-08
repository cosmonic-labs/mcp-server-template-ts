#!/usr/bin/env node

/**
 * Script to enable or disable a feature by uncommenting/commenting code blocks
 * marked with // START_OF Features.<FeatureName> and // END_OF Features.<FeatureName>
 *
 * Usage: node scripts/feature.js <enable|disable> <feature-name>
 * Example: node scripts/feature.js enable Auth
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve, join } from "path";

const action = process.argv[2];
const featureName = process.argv[3];

if (!action || !featureName || !["enable", "disable"].includes(action)) {
  console.error("Usage: node scripts/feature.js <enable|disable> <feature-name>");
  console.error("Example: node scripts/feature.js enable Auth");
  process.exit(1);
}

const isEnable = action === "enable";
const startMarker = `// START_OF Features.${featureName}`;
const endMarker = `// END_OF Features.${featureName}`;

/**
 * Recursively find all .ts and .wit files in a directory
 */
function findSourceFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findSourceFiles(fullPath));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".wit")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Enable: uncomment lines (remove first "// " found)
 * Pattern: "  // code" becomes "  code", "// code" becomes "code"
 */
function enableLine(line) {
  // Find and remove the first "// " occurrence
  const idx = line.indexOf("// ");
  if (idx !== -1) {
    return { line: line.slice(0, idx) + line.slice(idx + 3), modified: true };
  }
  // Handle bare "//" at end
  if (line.endsWith("//")) {
    return { line: line.slice(0, -2), modified: true };
  }
  return { line, modified: false };
}

/**
 * Disable: comment lines (add "// " after leading whitespace)
 * Pattern: "  code" becomes "  // code", "code" becomes "// code"
 */
function disableLine(line) {
  // Empty or whitespace-only lines stay as-is
  if (line.trim() === "") {
    return { line, modified: false };
  }
  // Already has a comment - keep as-is
  if (line.match(/^\s*\/\//)) {
    return { line, modified: false };
  }
  // Find leading whitespace and insert "// " after it
  const match = line.match(/^(\s*)(.*)/);
  if (match) {
    return { line: match[1] + "// " + match[2], modified: true };
  }
  return { line, modified: false };
}

/**
 * Process feature in a file
 */
function processFeatureInFile(filePath) {
  const content = readFileSync(filePath, "utf-8");

  if (!content.includes(startMarker)) {
    return false;
  }

  const lines = content.split("\n");
  let modified = false;
  let inFeatureBlock = false;
  const newLines = [];
  const processLine = isEnable ? enableLine : disableLine;

  for (const line of lines) {
    if (line.includes(startMarker)) {
      inFeatureBlock = true;
      newLines.push(line);
      continue;
    }

    if (line.includes(endMarker)) {
      inFeatureBlock = false;
      newLines.push(line);
      continue;
    }

    if (inFeatureBlock) {
      const result = processLine(line);
      newLines.push(result.line);
      if (result.modified) modified = true;
    } else {
      newLines.push(line);
    }
  }

  if (modified) {
    writeFileSync(filePath, newLines.join("\n"));
    const verb = isEnable ? "Enabled" : "Disabled";
    console.log(`${verb} feature in: ${filePath}`);
  }

  return modified;
}

// Main execution
const srcDir = resolve(process.cwd(), "src");
const witDir = resolve(process.cwd(), "wit");
const files = [
  ...(existsSync(srcDir) ? findSourceFiles(srcDir) : []),
  ...(existsSync(witDir) ? findSourceFiles(witDir) : []),
];

let filesModified = 0;

for (const file of files) {
  if (processFeatureInFile(file)) {
    filesModified++;
  }
}

const verb = isEnable ? "Enabled" : "Disabled";
if (filesModified === 0) {
  console.log(`No files found with feature: ${featureName}`);
  process.exit(1);
} else {
  console.log(`\n${verb} feature "${featureName}" in ${filesModified} file(s)`);
}
