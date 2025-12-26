import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseGenerateAgentArgs,
  handleGenerateAgent,
} from '../../../src/agent/generate.js';

// Mock the fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

// Mock readline module
const mockQuestion = vi.fn();
const mockClose = vi.fn();
vi.mock('node:readline', () => ({
  createInterface: vi.fn(() => ({
    question: mockQuestion,
    close: mockClose,
  })),
}));

// Import the mocked module
import * as fs from 'node:fs';

describe('parseGenerateAgentArgs', () => {
  it('should return empty options for no args', () => {
    const options = parseGenerateAgentArgs([]);
    expect(options).toEqual({});
  });

  it('should parse --output option', () => {
    const options = parseGenerateAgentArgs([
      '--generate-agent',
      '--output',
      'custom/path.md',
    ]);
    expect(options.output).toBe('custom/path.md');
  });

  it('should parse -o shorthand', () => {
    const options = parseGenerateAgentArgs(['-o', 'custom/path.md']);
    expect(options.output).toBe('custom/path.md');
  });

  it('should parse --stdout option', () => {
    const options = parseGenerateAgentArgs(['--stdout']);
    expect(options.stdout).toBe(true);
  });

  it('should parse --force option', () => {
    const options = parseGenerateAgentArgs(['--force']);
    expect(options.force).toBe(true);
  });

  it('should parse -f shorthand', () => {
    const options = parseGenerateAgentArgs(['-f']);
    expect(options.force).toBe(true);
  });

  it('should parse multiple options', () => {
    const options = parseGenerateAgentArgs([
      '--generate-agent',
      '--output',
      'path.md',
      '--force',
    ]);
    expect(options.output).toBe('path.md');
    expect(options.force).toBe(true);
  });
});

describe('handleGenerateAgent', () => {
  const mockExistsSync = vi.mocked(fs.existsSync);
  const mockMkdirSync = vi.mocked(fs.mkdirSync);
  const mockWriteFileSync = vi.mocked(fs.writeFileSync);

  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as () => never);
    mockExistsSync.mockReturnValue(false);
    mockQuestion.mockReset();
    mockClose.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should output to stdout when --stdout is passed', async () => {
    await handleGenerateAgent(['--stdout']);

    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0][0];
    expect(output).toContain('---');
    expect(output).toContain('name: meteor-performance');
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('should create file at default path', async () => {
    await handleGenerateAgent(['--generate-agent']);

    expect(mockMkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('.claude'),
      { recursive: true },
    );
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('meteor-performance.md'),
      expect.stringContaining('name: meteor-performance'),
      'utf-8',
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Created Meteor performance subagent'),
    );
  });

  it('should create file at custom path', async () => {
    await handleGenerateAgent([
      '--generate-agent',
      '--output',
      'custom/agent.md',
    ]);

    expect(mockMkdirSync).toHaveBeenCalledWith(expect.stringContaining('custom'), {
      recursive: true,
    });
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.stringContaining('agent.md'),
      expect.any(String),
      'utf-8',
    );
  });

  it('should prompt and abort when file exists and user declines', async () => {
    mockExistsSync.mockReturnValue(true);
    mockQuestion.mockImplementation((_question: string, callback: (answer: string) => void) => {
      callback('n');
    });

    await handleGenerateAgent(['--generate-agent']);

    expect(mockQuestion).toHaveBeenCalledWith(
      expect.stringContaining('Overwrite?'),
      expect.any(Function),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith('Aborted.');
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('should prompt and overwrite when file exists and user confirms', async () => {
    mockExistsSync.mockReturnValue(true);
    mockQuestion.mockImplementation((_question: string, callback: (answer: string) => void) => {
      callback('y');
    });

    await handleGenerateAgent(['--generate-agent']);

    expect(mockQuestion).toHaveBeenCalledWith(
      expect.stringContaining('Overwrite?'),
      expect.any(Function),
    );
    expect(mockWriteFileSync).toHaveBeenCalled();
  });

  it('should overwrite when file exists and --force is passed', async () => {
    mockExistsSync.mockReturnValue(true);

    await handleGenerateAgent(['--generate-agent', '--force']);

    expect(mockWriteFileSync).toHaveBeenCalled();
    expect(processExitSpy).not.toHaveBeenCalled();
  });

  it('should handle absolute paths', async () => {
    const absolutePath = '/absolute/path/to/agent.md';

    await handleGenerateAgent(['--generate-agent', '--output', absolutePath]);

    expect(mockWriteFileSync).toHaveBeenCalledWith(
      absolutePath,
      expect.any(String),
      'utf-8',
    );
  });

  it('should ensure directory exists before writing', async () => {
    await handleGenerateAgent([
      '--generate-agent',
      '--output',
      'deep/nested/path/agent.md',
    ]);

    expect(mockMkdirSync).toHaveBeenCalledWith(
      expect.stringContaining('deep'),
      { recursive: true },
    );
  });

  it('should include helpful output messages', async () => {
    await handleGenerateAgent(['--generate-agent']);

    // Check that helpful information is logged
    const allLogCalls = consoleLogSpy.mock.calls.map(call => call[0]);
    expect(allLogCalls.some(msg => msg.includes('Analyzing performance issues'))).toBe(true);
    expect(allLogCalls.some(msg => msg.includes('optimization recommendations'))).toBe(true);
  });
});
