import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { auditCodebase, runThreeTierAudit } from '../src/audit.js'
import { generateHandover } from '../src/handover.js'

function createFixtureProject(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'kyntic-discovery-agent-'))
  mkdirSync(path.join(root, 'src', 'Api'), { recursive: true })
  mkdirSync(path.join(root, 'src', 'Domain'), { recursive: true })
  mkdirSync(path.join(root, 'migrations'), { recursive: true })
  writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: 'fixture-service',
    version: '1.0.0',
    scripts: { start: 'node dist/index.js' },
    dependencies: { express: '^5.0.0', '@modelcontextprotocol/sdk': '^1.12.1' },
    devDependencies: { vitest: '^4.0.8' },
  }, null, 2))
  writeFileSync(path.join(root, 'src', 'Api', 'Program.cs'), `
using Microsoft.AspNetCore.Authorization;
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddAuthentication();
var app = builder.Build();
app.MapGet("/health", () => Results.Ok()).AllowAnonymous();
app.MapPost("/api/v1/events/source-system", [Authorize] () => Results.Accepted());
app.Run();
public sealed record EventAcceptedResult(string EventId);
`)
  writeFileSync(path.join(root, 'src', 'Domain', 'Customer.cs'), `
public sealed class Customer
{
    public string Id { get; set; } = "";
}
public interface ICustomerRepository
{
    Task<Customer?> FindAsync(string id);
}
`)
  writeFileSync(path.join(root, 'migrations', '001.sql'), 'CREATE TABLE customers (id text primary key, name text not null);')
  return root
}

describe('Discovery Agent audit tiers', () => {
  it('runs Tier 1 quick scan with packages, stack, and entry points', async () => {
    const root = createFixtureProject()
    const audit = await auditCodebase({ path: root, tier: 1 })

    expect(audit.tier).toBe(1)
    expect(audit.tier1.projectName).toBe('fixture-service')
    expect(audit.tier1.packages.some((item) => item.ecosystem === 'node')).toBe(true)
    expect(audit.tier1.techStack.frameworks).toContain('Model Context Protocol')
    expect(audit.tier1.entryPoints.some((item) => item.type === 'api')).toBe(true)
    expect(audit.tier2).toBeUndefined()
  })

  it('runs Tier 2 semantic index with endpoints, types, schema, and business patterns', async () => {
    const root = createFixtureProject()
    const audit = await auditCodebase({ path: root, tier: 2 })

    expect(audit.tier2?.endpoints).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: 'GET', path: '/health', auth: 'anonymous' }),
      expect.objectContaining({ method: 'POST', path: '/api/v1/events/source-system', auth: 'bearer' }),
    ]))
    expect(audit.tier2?.types).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Customer', kind: 'class' }),
      expect.objectContaining({ name: 'EventAcceptedResult', kind: 'record' }),
    ]))
    expect(audit.tier2?.schemas).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'customers', type: 'table' }),
    ]))
    expect(audit.tier2?.keyBusinessLogicPatterns.some((item) => item.includes('Webhook or event ingestion'))).toBe(true)
  })

  it('runs Tier 3 governance report with data flow, security, coupling, and scoring', async () => {
    const root = createFixtureProject()
    const audit = await runThreeTierAudit(root)

    expect(audit.tier).toBe(3)
    expect(audit.tier3?.dataFlows.length).toBeGreaterThan(0)
    expect(audit.tier3?.securitySurface.some((item) => item.area === 'Authentication')).toBe(true)
    expect(audit.tier3?.coupling.length).toBeGreaterThan(0)
    expect(audit.tier3?.techDebtScore.overall).toBeGreaterThanOrEqual(0)
    expect(audit.tier3?.techDebtScore.overall).toBeLessThanOrEqual(100)
  })

  it('generates JSON and Markdown handover suitable for prompt injection', async () => {
    const root = createFixtureProject()
    const handover = await generateHandover(root, 3)

    expect(handover.json.project_name).toBe('fixture-service')
    expect(handover.json.api_surface).toEqual(expect.arrayContaining([
      expect.objectContaining({ method: 'POST', path: '/api/v1/events/source-system' }),
    ]))
    expect(handover.json.recommended_next_agent_prompt).toContain('You are working in fixture-service')
    expect(handover.markdown).toContain('# fixture-service Handover')
    expect(handover.markdown).toContain('Recommended Next Agent Prompt')
  })
})
