/**
 * Handles the --generate-agent CLI flag to create a Claude Code subagent.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { generateSubagentTemplate } from './template.js';

const DEFAULT_OUTPUT_PATH = '.claude/agents/meteor-performance.md';

export interface GenerateAgentOptions {
  output?: string;
  stdout?: boolean;
  force?: boolean;
}

/**
 * Parse command line arguments for the generate-agent command.
 */
export function parseGenerateAgentArgs(args: string[]): GenerateAgentOptions {
  const options: GenerateAgentOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--stdout') {
      options.stdout = true;
    } else if (arg === '--force' || arg === '-f') {
      options.force = true;
    }
  }

  return options;
}

/**
 * Ensure the directory exists for a file path.
 */
function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Prompt the user for confirmation.
 */
function promptConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.toLowerCase().trim();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

/**
 * Handle the --generate-agent command.
 */
export async function handleGenerateAgent(args: string[]): Promise<void> {
  const options = parseGenerateAgentArgs(args);
  const template = generateSubagentTemplate();

  // If --stdout, just print and return
  if (options.stdout) {
    console.log(template);
    return;
  }

  // Determine output path
  const outputPath = options.output || DEFAULT_OUTPUT_PATH;
  const absolutePath = path.isAbsolute(outputPath)
    ? outputPath
    : path.join(process.cwd(), outputPath);

  // Check if file exists
  if (fs.existsSync(absolutePath) && !options.force) {
    const shouldOverwrite = await promptConfirmation(
      `Agent already exists at ${absolutePath}. Overwrite? (y/N) `,
    );
    if (!shouldOverwrite) {
      console.log('Aborted.');
      return;
    }
  }

  // Ensure directory exists
  ensureDirectoryExists(absolutePath);

  // Write the file
  fs.writeFileSync(absolutePath, template, 'utf-8');

  console.log(`Created Meteor performance subagent at: ${absolutePath}`);
  console.log('');
  console.log('The subagent will be available in Claude Code for:');
  console.log('  - Analyzing performance issues');
  console.log('  - Investigating slow methods and publications');
  console.log('  - Getting optimization recommendations');
  console.log('');
  console.log('Claude Code will use this subagent automatically when relevant.');
}
