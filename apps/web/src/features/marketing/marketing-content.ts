export const graphQlContextLookup = `query AccountContext {
  contextSnapshot(
    input: {
      scope: { tenantSlug: "acme", workspaceKey: "crm-prod" }
      subject: { subjectType: "account", subjectKey: "ACC-12345" }
      includeFacts: true
      includeSources: true
    }
  ) {
    id
    summary
    overallConfidence
    facts(first: 10) {
      edges {
        node {
          attributeKey
          valueJson
          confidence
          isFresh
          isMasked
          sources {
            sourceSystemKey
            sourceRecordKey
          }
        }
      }
    }
  }
}`

export const restContextLookup = `GET /v1/tenants/acme/workspaces/crm-prod/subjects/account/ACC-12345/context
Authorization: Bearer <token>
X-Request-Id: req-123

{
  "snapshotId": "4e0f3d57-8c8e-4f01-87a7-7fc1c1e9d112",
  "summary": "Enterprise account with high expansion potential and medium renewal risk.",
  "overallConfidence": 0.86,
  "facts": [
    {
      "attributeKey": "renewalRisk",
      "valueJson": "medium",
      "confidence": 0.88,
      "status": ["FRESH"]
    }
  ]
}`

export const webhookExample = `{
  "eventId": "evt_01JV8S5J5Q3A1E4B9N4M7M3R9P",
  "eventType": "context.snapshot.published",
  "occurredAtUtc": "2026-05-11T12:45:22Z",
  "tenantSlug": "acme",
  "workspaceKey": "crm-prod",
  "subject": {
    "subjectType": "account",
    "subjectKey": "ACC-12345"
  },
  "data": {
    "snapshotId": "4e0f3d57-8c8e-4f01-87a7-7fc1c1e9d112",
    "snapshotVersion": 8,
    "factCount": 14,
    "overallConfidence": 0.86
  }
}`

export const typeScriptSdkExample = `const context = await scout.users.getContext("demo", "123")

const accountContext = await scout.accounts.getContext("acme", "ACC-12345")

const package = await scout.packages.getAiContextForUser(
  "acme",
  "123",
  "recommendation_generation",
)`

export const csharpSdkExample = `var context = await scout.Users.GetContextAsync("demo", "123");

var accountContext = await scout.Accounts.GetContextAsync("acme", "ACC-12345");

var package = await scout.Packages.GetAiContextForUserAsync(
    "acme",
    "123",
    "recommendation_generation");`

export const blueprintPrompt = `You are a senior data architect and AI integration consultant.

I will provide schema exports, sample rows, API payloads, CRM field lists, warehouse table descriptions, support ticket examples, billing records, usage events, and KPI notes.

Analyse these source systems and generate a KynticAI Scout blueprint that can be imported into the product.

The blueprint must include:
1. source systems
2. data sources
3. entities discovered
4. candidate semantic attributes
5. selector definitions
6. mapping rules
7. confidence scoring logic
8. freshness scoring logic
9. provenance requirements
10. PII masking rules
11. audit requirements
12. recommended AI context packages
13. prompt template suggestions
14. data quality warnings
15. missing fields or integration gaps

Do not invent source fields. If a field is missing, add it to dataQualityFindings.
Return valid JSON only.`

export const blueprintExample = `{
  "version": "1.0",
  "tenant": {
    "name": "Acme Industrial",
    "slug": "acme-industrial"
  },
  "dataSources": [
    {
      "name": "CRM account API",
      "sourceSystem": "crm",
      "connectorType": "restApi"
    }
  ],
  "semanticAttributes": [
    {
      "key": "renewalRisk",
      "displayName": "Renewal Risk",
      "dataType": "enum"
    }
  ],
  "selectorDefinitions": [
    {
      "name": "Renewal risk from billing and support",
      "sourceSystem": "billing",
      "targetAttributeKey": "renewalRisk",
      "mappingKind": "weighted_scoring",
      "defaultConfidence": 0.84,
      "freshnessWindowMinutes": 1440
    }
  ],
  "promptTemplates": [],
  "piiPolicies": [],
  "auditPolicies": [],
  "recommendedContextPackages": [
    {
      "key": "agent-safe-default",
      "purpose": "recommendation_generation"
    }
  ],
  "dataQualityFindings": [
    {
      "severity": "warning",
      "message": "Support exports do not include account owner identifiers."
    }
  ],
  "implementationNotes": [
    "Validate account and subscription keys before publishing selectors."
  ]
}`

export const faqEntries = [
  {
    question: 'Is Scout another AI app?',
    answer:
      'No. Scout is context infrastructure for AI-enabled products, workflows, and agents. It creates trusted semantic context that a customer can use with their own AI tools, internal apps, reporting systems, and workflow automation.',
  },
  {
    question: 'Is this just a website?',
    answer:
      'No. The React application is a public product site, learning experience, demo, and admin console. The underlying product value is the backend semantic data plane that connects existing systems, computes semantic facts, and exposes context through GraphQL, REST, SDKs, governed context packages, and internal services.',
  },
  {
    question: 'Can this be used without replacing existing systems?',
    answer:
      'Yes. KynticAI Scout is designed to sit beside CRM, ERP, billing, support, telemetry, warehouse, Excel exports, SharePoint, internal apps, and older SQL estates. Those systems remain the operational source of truth while Scout provides the semantic layer above them.',
  },
  {
    question: 'Can we bring our own AI?',
    answer:
      'Yes. Scout does not need to own the model, agent, copilot, or AI orchestration layer. Customers can use their own AI stack while Scout supplies governed business context with evidence, confidence, freshness, provenance, masking, and auditability.',
  },
  {
    question: 'What can consume Scout context?',
    answer:
      'Internal copilots, CRM AI features, support automation, customer success tools, product onboarding, marketing personalisation, reporting systems, workflow automation, third party agents, and internal apps can all consume the same data plane.',
  },
  {
    question: 'Can a new product use this as an add-on backend layer?',
    answer:
      'Yes. A new application can send usage, billing, support, and account signals into Scout, request semantic profiles back, show trusted context in product, trigger recomputes, and explain recommendations without coupling itself directly to legacy schemas.',
  },
  {
    question: 'Is the open source repo enough to learn from?',
    answer:
      'Yes. The public repo is intended to be useful on its own. It contains the open source core, seeded demo, admin experience, backend-only mode, selector logic, connector interfaces, API surface, SDK examples, and the product framing needed to understand how the platform works.',
  },
  {
    question: 'What would be paid later?',
    answer:
      'Paid/private offerings cover real enterprise connectors across CRM, warehouse, email, chat, calendar, analytics, work management, and knowledge systems, plus SSO/SAML, SCIM, vault integrations, advanced governance, compliance exports, deployment packs, SLA tooling, hosted account management, billing, commercial licence portals, download portals, update channels, support portals, aggregate usage reporting, cloud operations, and implementation services. The public repo remains a credible open source core rather than a crippled teaser.',
  },
  {
    question: 'Where would paid code live?',
    answer:
      'Paid implementation code lives outside this public repo in private enterprise and cloud repositories. The public repo may describe those commercial options, but it does not ship the paid connector, identity, vault, compliance, deployment, billing, licence portal, or hosted control-plane implementations.',
  },
  {
    question: 'Would there be one website or two?',
    answer:
      'For now, one polished site is the better choice. The current React site can explain the open source core, the backend integration layer, the future private cloud/control-plane direction, the demo/admin console, and the future enterprise boundary in one coherent experience. A split into separate marketing and hosted-app sites only becomes necessary later if a managed control-plane offering grows significantly.',
  },
  {
    question: 'How would an external system call Scout?',
    answer:
      'Through GraphQL for flexible reads, REST endpoints for common integration workflows, SDKs for TypeScript and .NET, governed context packages, or direct internal service calls when Scout is deployed as part of a broader platform estate. SaaS metadata also models future webhook delivery.',
  },
  {
    question: 'What is a selector?',
    answer:
      'A selector is an admin-defined rule that maps raw source signals into semantic business meaning. It can perform direct field mapping, threshold classification, weighted scoring, enum normalisation, formula-derived metrics, and conflict resolution across sources.',
  },
  {
    question: 'What is a semantic context fact?',
    answer:
      'It is a canonical business fact such as renewal risk, preferred channel, support drag, or expansion potential. Facts are stored with value, confidence, freshness, provenance, masking status, and audit visibility so downstream systems can use them safely.',
  },
  {
    question: 'How does provenance work?',
    answer:
      'Each fact can retain the source systems, records, selectors, and timestamps that contributed to it. That allows teams to explain why a recommendation exists, identify stale or weak signals, and audit what the product or AI was actually shown.',
  },
  {
    question: 'How do AI tools use the context?',
    answer:
      'AI tools should consume governed context packages rather than raw database records. Scout can prepare structured packages containing allowed facts, citations, freshness, confidence, and masking decisions so models, agents, copilots, and recommendation flows work from supported business context.',
  },
] as const
