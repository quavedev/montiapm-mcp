import { describe, it, expect } from 'vitest';
import { generateSubagentTemplate } from '../../../src/agent/template.js';

describe('generateSubagentTemplate', () => {
  const template = generateSubagentTemplate();

  describe('YAML frontmatter', () => {
    it('should start with YAML frontmatter', () => {
      expect(template).toMatch(/^---\n/);
    });

    it('should include name field', () => {
      expect(template).toMatch(/^---\nname: meteor-performance\n/m);
    });

    it('should include description field', () => {
      expect(template).toMatch(/description:/);
    });

    it('should include tools field with MCP tools', () => {
      expect(template).toMatch(/tools:.*mcp__montiapm__get_method_traces/);
      expect(template).toMatch(/tools:.*mcp__montiapm__get_health_summary/);
      expect(template).toMatch(/tools:.*mcp__montiapm__analyze_slow_methods/);
      expect(template).toMatch(/tools:.*mcp__montiapm__get_optimization_advice/);
      expect(template).toMatch(/tools:.*mcp__montiapm__explain_metric/);
    });

    it('should include file tools', () => {
      expect(template).toMatch(/tools:.*Read/);
      expect(template).toMatch(/tools:.*Grep/);
      expect(template).toMatch(/tools:.*Glob/);
    });

    it('should include model field', () => {
      expect(template).toMatch(/model: sonnet/);
    });

    it('should close frontmatter', () => {
      expect(template).toMatch(/^---\n[\s\S]*?\n---\n/);
    });
  });

  describe('thresholds section', () => {
    it('should include thresholds section', () => {
      expect(template).toContain('## Performance Thresholds');
    });

    it('should include method thresholds', () => {
      expect(template).toContain('### Methods');
      expect(template).toMatch(/responseTime:.*500.*1000/);
    });

    it('should include publication thresholds', () => {
      expect(template).toContain('### Publications');
    });

    it('should include system thresholds', () => {
      expect(template).toContain('### System');
      expect(template).toMatch(/cpuUsage:.*70.*90/);
    });

    it('should include observer thresholds', () => {
      expect(template).toContain('### Observers');
      expect(template).toMatch(/observerReuse:/);
    });
  });

  describe('glossary section', () => {
    it('should include glossary section', () => {
      expect(template).toContain('## Metric Glossary');
    });

    it('should include key metrics', () => {
      expect(template).toContain('### Response Time');
      expect(template).toContain('### Wait Time');
      expect(template).toContain('### Database Time');
      expect(template).toContain('### Observer Reuse');
    });

    it('should include interpretations', () => {
      expect(template).toMatch(/\*\*Interpretation:\*\*/);
    });

    it('should include optimization tips', () => {
      expect(template).toMatch(/\*\*Tips:\*\*/);
    });
  });

  describe('recommendations section', () => {
    it('should include recommendations section', () => {
      expect(template).toContain('## Optimization Recommendations');
    });

    it('should include method recommendations', () => {
      expect(template).toContain('### Methods');
      expect(template).toContain('Add MongoDB Indexes');
    });

    it('should include publication recommendations', () => {
      expect(template).toContain('### Publications');
      expect(template).toContain('Field Filtering');
    });

    it('should include redis-oplog recommendations', () => {
      expect(template).toMatch(/[Nn]amespace/);
      expect(template).toMatch(/[Cc]hannel/);
    });

    it('should include system recommendations', () => {
      expect(template).toContain('CPU Profile');
    });

    it('should include actions for recommendations', () => {
      expect(template).toMatch(/\*\*Actions:\*\*/);
    });
  });

  describe('code examples section', () => {
    it('should include code examples section', () => {
      expect(template).toContain('## Common Code Patterns');
    });

    it('should include ESR index pattern', () => {
      expect(template).toContain('ESR Index Pattern');
      expect(template).toContain('createIndex');
    });

    it('should include this.unblock() example', () => {
      expect(template).toContain('this.unblock()');
    });

    it('should include redis-oplog namespace example', () => {
      expect(template).toContain('namespace:');
    });

    it('should include field filtering example', () => {
      expect(template).toContain('fields:');
    });
  });

  describe('workflow section', () => {
    it('should include workflow section', () => {
      expect(template).toContain('## Analysis Workflow');
    });

    it('should include step-by-step workflow', () => {
      expect(template).toContain('### 1. Get Overall Health');
      expect(template).toContain('### 2. Identify Bottlenecks');
      expect(template).toContain('### 3. Deep Dive');
    });

    it('should include MCP tool reference', () => {
      expect(template).toContain('## MCP Tool Reference');
      expect(template).toContain('get_health_summary');
    });
  });

  describe('overall structure', () => {
    it('should have valid markdown structure', () => {
      // Check that headings are properly formatted
      const headings = template.match(/^#+\s+.+$/gm);
      expect(headings).not.toBeNull();
      expect(headings!.length).toBeGreaterThan(10);
    });

    it('should include documentation links', () => {
      expect(template).toMatch(/https:\/\/docs\.montiapm\.com/);
    });

    it('should be substantial in size', () => {
      // Template should be comprehensive
      expect(template.length).toBeGreaterThan(10000);
    });
  });
});
