export interface RawSignal {
  id: string
  system: string
  source: string
  timestamp: string
  rawField: string
  rawValue: string
  interpretation: string
}

export interface ContextFact {
  id: string
  attributeKey: string
  displayName: string
  value: string
  type: string
  confidence: number
  timestamp: string
  provenance: string[]
  freshness: string
  explanation: string
  selector: string
}

export interface SelectorDefinition {
  id: string
  name: string
  mappingKind: string
  sourceSystem: string
  targetAttribute: string
  rule: string
  confidence: number
  freshnessWindow: string
  previewValue: string
  provenance: string
}

export interface InteractionBeat {
  time: string
  rawDataPoint: string
  semanticFact: string
  aiRecommendation: string
  action: string
  result: string
}

export interface DataPlaneStep {
  label: string
  description: string
}

export interface IntegrationExample {
  name: string
  consumer: string
  contract: string
  sample: string
}

export interface CommercialProofPoint {
  label: string
  metric: string
  evidence: string
  buyerValue: string
}

export const featuredAccount = {
  accountId: 'ACC-DEMO-0123',
  accountName: 'Northstar Logistics',
  industry: 'Logistics',
  segment: 'Enterprise',
  region: 'UK and Europe',
  lifecycleStage: 'Expansion evaluation',
  owner: 'Dana Mercer',
}

export const featuredPerson = {
  externalUserId: '123',
  fullName: 'Avery Stone',
  email: 'a***@northstar-logistics.example',
  jobTitle: 'VP Revenue Operations',
  department: 'Revenue Operations',
  seniority: 'VP',
  isDecisionMaker: true,
  note: 'Fictional demo profile using example-domain style data.',
}

export const rawSignals: RawSignal[] = [
  {
    id: 'crm-01',
    system: 'CRM',
    source: 'crm.contacts.preferred_channel',
    timestamp: '2026-05-11T09:20:00Z',
    rawField: 'preferred_channel',
    rawValue: 'email',
    interpretation: 'Avery consistently replies to structured email threads before booking calls.',
  },
  {
    id: 'crm-02',
    system: 'CRM',
    source: 'crm.opportunities.stage',
    timestamp: '2026-05-11T14:10:00Z',
    rawField: 'open_opportunity_stage',
    rawValue: 'proposal',
    interpretation: 'The commercial conversation is active and already beyond discovery.',
  },
  {
    id: 'usage-01',
    system: 'Product usage',
    source: 'telemetry.workspace.activity_score',
    timestamp: '2026-05-12T07:45:00Z',
    rawField: 'activity_score',
    rawValue: '91 / 100',
    interpretation: 'High activity across multiple workspaces indicates the account is testing repeatable rollout.',
  },
  {
    id: 'sql-01',
    system: 'SQL warehouse',
    source: 'warehouse.account_context_rollup.implementation_phase',
    timestamp: '2026-05-12T07:55:00Z',
    rawField: 'implementation_phase',
    rawValue: 'cross-region rollout planning',
    interpretation: 'A legacy warehouse rollup adds operational rollout context without requiring the source estate to be replaced.',
  },
  {
    id: 'support-01',
    system: 'Support',
    source: 'support.tickets.open_critical',
    timestamp: '2026-05-10T16:35:00Z',
    rawField: 'open_critical_tickets',
    rawValue: '0',
    interpretation: 'No critical support blocker is currently suppressing expansion motion.',
  },
  {
    id: 'billing-01',
    system: 'Billing',
    source: 'billing.metrics.expansion_seat_delta',
    timestamp: '2026-05-11T08:15:00Z',
    rawField: 'requested_additional_seats',
    rawValue: '28',
    interpretation: 'Seat growth suggests budget and operational demand are moving together.',
  },
  {
    id: 'email-01',
    system: 'Email engagement',
    source: 'engagement.sequence.enterprise_rollout',
    timestamp: '2026-05-09T10:05:00Z',
    rawField: 'reply_sentiment',
    rawValue: 'interested',
    interpretation: 'The buying group is responding positively to enterprise rollout messaging.',
  },
  {
    id: 'web-01',
    system: 'Web events',
    source: 'web.pricing.enterprise',
    timestamp: '2026-05-12T08:25:00Z',
    rawField: 'pricing_page_visits_30d',
    rawValue: '11',
    interpretation: 'Repeated enterprise pricing visits are a strong timing and budget-readiness signal.',
  },
]

export const customerDataPlaneSteps: DataPlaneStep[] = [
  {
    label: 'Source access stays customer-controlled',
    description:
      'CRM, ERP, SQL, support, billing, email, telemetry, spreadsheets, SharePoint, and old applications stay where they are while UCL reads approved signals.',
  },
  {
    label: 'Selectors create governed semantics',
    description:
      'Mappings turn raw fields and events into facts with confidence, freshness windows, explanations, masking expectations, and provenance.',
  },
  {
    label: 'Snapshots become the stable contract',
    description:
      'Context facts are versioned into snapshots that downstream tools can cite instead of rebuilding joins or sending raw records into prompts.',
  },
  {
    label: 'APIs expose context to customer consumers',
    description:
      'GraphQL, REST, SDKs, and package retrieval let customer-owned apps, workflows, reports, copilots, and agents use the same business meaning.',
  },
]

export const contextFacts: ContextFact[] = [
  {
    id: 'FACT-01',
    attributeKey: 'conversionProbability',
    displayName: 'Conversion probability',
    value: '88%',
    type: 'percentage',
    confidence: 0.91,
    timestamp: '2026-05-12T08:30:00Z',
    provenance: ['CRM opportunity proposal stage', 'Product usage score 91', 'Enterprise pricing visits'],
    freshness: 'Fresh for 3 hours',
    explanation: 'Weighted scoring combines active opportunity stage, recent usage depth, pricing intent, and current support drag.',
    selector: 'Conversion Probability Score',
  },
  {
    id: 'FACT-02',
    attributeKey: 'preferredChannel',
    displayName: 'Preferred channel',
    value: 'email',
    type: 'enum',
    confidence: 0.96,
    timestamp: '2026-05-11T09:20:00Z',
    provenance: ['CRM contact preference', 'Email reply events'],
    freshness: 'Fresh for 24 hours',
    explanation: 'Direct CRM preference is reinforced by recent email replies from the same contact.',
    selector: 'Preferred Channel from CRM',
  },
  {
    id: 'FACT-03',
    attributeKey: 'planInterest',
    displayName: 'Plan interest',
    value: 'enterprise',
    type: 'enum',
    confidence: 0.94,
    timestamp: '2026-05-11T14:10:00Z',
    provenance: ['CRM opportunity plan field', 'Pricing event category'],
    freshness: 'Fresh for 24 hours',
    explanation: 'String-to-enum mapping resolves multiple source labels into the canonical enterprise plan interest.',
    selector: 'Plan Interest from CRM',
  },
  {
    id: 'FACT-04',
    attributeKey: 'engagementLevel',
    displayName: 'Engagement level',
    value: 'high',
    type: 'enum',
    confidence: 0.92,
    timestamp: '2026-05-12T07:45:00Z',
    provenance: ['Activity score 91', '42 sessions in 7 days', '58 key feature events'],
    freshness: 'Fresh for 12 hours',
    explanation: 'Threshold classification converts product telemetry into a reusable engagement level.',
    selector: 'Engagement Level from Usage',
  },
  {
    id: 'FACT-05',
    attributeKey: 'churnRisk',
    displayName: 'Churn risk',
    value: '12%',
    type: 'percentage',
    confidence: 0.88,
    timestamp: '2026-05-12T08:30:00Z',
    provenance: ['Open support tickets', 'NPS trend', 'Recent active days'],
    freshness: 'Fresh for 3 hours',
    explanation: 'Formula-derived score keeps support drag visible while giving credit for strong usage and resolved blockers.',
    selector: 'Churn Risk Formula',
  },
  {
    id: 'FACT-06',
    attributeKey: 'expansionPotential',
    displayName: 'Expansion potential',
    value: '84%',
    type: 'percentage',
    confidence: 0.9,
    timestamp: '2026-05-12T08:30:00Z',
    provenance: ['Seat delta 28', 'MRR trend', 'Feature adoption score'],
    freshness: 'Fresh for 6 hours',
    explanation: 'Billing and usage signals indicate a credible expansion motion rather than a generic upsell prompt.',
    selector: 'Expansion Potential Score',
  },
  {
    id: 'FACT-07',
    attributeKey: 'budgetReadiness',
    displayName: 'Budget readiness',
    value: '82%',
    type: 'percentage',
    confidence: 0.86,
    timestamp: '2026-05-12T08:25:00Z',
    provenance: ['Enterprise pricing visits', 'Opportunity amount', 'No payment failures'],
    freshness: 'Fresh for 6 hours',
    explanation: 'Commercial behaviour, open opportunity value, and healthy billing posture increase budget readiness.',
    selector: 'Budget Readiness Score',
  },
  {
    id: 'FACT-08',
    attributeKey: 'decisionMakerLikelihood',
    displayName: 'Decision-maker likelihood',
    value: '93%',
    type: 'percentage',
    confidence: 0.93,
    timestamp: '2026-05-11T09:20:00Z',
    provenance: ['VP seniority', 'CRM decision-maker flag', 'Revenue Operations department'],
    freshness: 'Fresh for 24 hours',
    explanation: 'Contact role and CRM stakeholder status indicate Avery can influence the rollout decision.',
    selector: 'Decision Maker Likelihood',
  },
  {
    id: 'FACT-09',
    attributeKey: 'productFit',
    displayName: 'Product fit',
    value: '91%',
    type: 'percentage',
    confidence: 0.89,
    timestamp: '2026-05-12T07:45:00Z',
    provenance: ['Automation runs', 'Key feature events', 'Seat usage ratio'],
    freshness: 'Fresh for 12 hours',
    explanation: 'Usage depth and adoption breadth suggest the product is matching an operational need.',
    selector: 'Product Fit Score',
  },
  {
    id: 'FACT-10',
    attributeKey: 'recommendedSalesMotion',
    displayName: 'Recommended sales motion',
    value: 'accelerate_enterprise',
    type: 'enum',
    confidence: 0.87,
    timestamp: '2026-05-12T08:30:00Z',
    provenance: ['Conversion probability', 'Budget readiness', 'Support drag', 'Decision-maker likelihood'],
    freshness: 'Fresh for 3 hours',
    explanation: 'Composite selector recommends a fast enterprise rollout motion with explicit support-risk guardrails.',
    selector: 'Recommended Sales Motion',
  },
]

export const selectors: SelectorDefinition[] = [
  {
    id: 'SEL-01',
    name: 'Preferred Channel from CRM',
    mappingKind: 'Direct field mapping',
    sourceSystem: 'CRM',
    targetAttribute: 'preferredChannel',
    rule: 'Read crm.contacts.preferred_channel, trim, lower-case, and accept only approved channel enum values.',
    confidence: 0.96,
    freshnessWindow: '1,440 minutes',
    previewValue: 'email',
    provenance: 'crm.contacts.preferred_channel',
  },
  {
    id: 'SEL-02',
    name: 'Engagement Level from Usage',
    mappingKind: 'Threshold classification',
    sourceSystem: 'Product telemetry',
    targetAttribute: 'engagementLevel',
    rule: 'activity_score >= 80 => high; 50-79 => medium; below 50 => low.',
    confidence: 0.92,
    freshnessWindow: '720 minutes',
    previewValue: 'high',
    provenance: 'telemetry.workspace.activity_score',
  },
  {
    id: 'SEL-03',
    name: 'Conversion Probability Score',
    mappingKind: 'Weighted scoring',
    sourceSystem: 'Warehouse rollup',
    targetAttribute: 'conversionProbability',
    rule: 'Opportunity stage, enterprise plan interest, active days, feature events, pricing visits, and support drag are weighted into a 0-100 score.',
    confidence: 0.91,
    freshnessWindow: '180 minutes',
    previewValue: '88%',
    provenance: 'warehouse.account_context_rollup',
  },
  {
    id: 'SEL-04',
    name: 'Churn Risk Formula',
    mappingKind: 'Formula-derived metric',
    sourceSystem: 'Support and usage rollup',
    targetAttribute: 'churnRisk',
    rule: '15 + support_ticket_score + payment_penalty - active_days_credit - resolved_support_credit.',
    confidence: 0.88,
    freshnessWindow: '180 minutes',
    previewValue: '12%',
    provenance: 'warehouse.risk_rollup',
  },
  {
    id: 'SEL-05',
    name: 'Recommended Sales Motion',
    mappingKind: 'Composite threshold',
    sourceSystem: 'Semantic facts',
    targetAttribute: 'recommendedSalesMotion',
    rule: 'If conversion > 80, budget readiness > 75, support drag < 20, and decision-maker > 80, classify as accelerate_enterprise.',
    confidence: 0.87,
    freshnessWindow: '180 minutes',
    previewValue: 'accelerate_enterprise',
    provenance: 'context.fact_graph',
  },
]

export const contextSnapshot = {
  snapshotId: 'SNAP-DEMO-0007',
  tenantSlug: 'demo',
  workspaceSlug: 'primary',
  externalAccountId: featuredAccount.accountId,
  externalUserId: featuredPerson.externalUserId,
  version: 7,
  generatedAtUtc: '2026-05-12T08:30:00Z',
  overallConfidence: 0.9,
  freshness: '3 hours',
  factCount: contextFacts.length,
  sourceSystems: ['CRM', 'SQL warehouse', 'Product usage', 'Support', 'Billing', 'Email', 'Web'],
  governance: ['tenant-scoped', 'masked contact data', 'provenance required', 'human review for outbound action'],
}

export const aiSafeContextPackage = {
  packageId: 'PKG-SALES-0007',
  purpose: 'Book an enterprise rollout discovery call',
  tenantSlug: 'demo',
  externalUserId: featuredPerson.externalUserId,
  generatedFromSnapshot: contextSnapshot.snapshotId,
  sentToConsumer: 'customer-owned sales workflow',
  uclCallsAiModel: false,
  allowedFacts: ['FACT-01', 'FACT-02', 'FACT-05', 'FACT-06', 'FACT-07', 'FACT-09', 'FACT-10'],
  redactions: ['masked email address', 'no message bodies', 'no named internal users', 'no raw support transcript'],
  guardrails: ['cite every recommendation', 'do not invent contract terms', 'pause if support risk changes'],
}

export const integrationExamples: IntegrationExample[] = [
  {
    name: 'GraphQL context lookup',
    consumer: 'internal account workspace',
    contract: 'userContext(input: { tenantSlug, externalUserId })',
    sample: `query {
  userContext(input: { tenantSlug: "demo", externalUserId: "123" }) {
    summary
    overallConfidence
    facts { attributeKey valueJson confidence provenanceJson }
  }
}`,
  },
  {
    name: 'REST snapshot retrieval',
    consumer: 'workflow automation',
    contract: 'GET /api/v1/context/snapshots/{snapshotId}?tenantSlug=demo',
    sample: `curl -H "Authorization: Bearer $TOKEN" \\
  "https://ucl.example/api/v1/context/snapshots/SNAP-DEMO-0007?tenantSlug=demo"`,
  },
  {
    name: 'AI-safe context package',
    consumer: 'customer-owned AI tool',
    contract: 'salesContextPackage or SDK packages.getAiContextForUser',
    sample: `const pkg = await ucl.packages.getAiContextForUser(
  "demo",
  "123",
  "Book a 20-minute enterprise rollout call."
)`,
  },
]

export const downstreamWorkflowDecision = {
  decision: 'Queue human-reviewed email-first enterprise rollout motion.',
  reason:
    'Conversion probability, budget readiness, usage depth, and support stability are all fresh enough to act on, but outbound copy still needs human review.',
  businessOutcome:
    'The team can prove one revenue workflow without replacing CRM, billing, support, product telemetry, or the legacy warehouse.',
}

export const commercialProofPoints: CommercialProofPoint[] = [
  {
    label: 'Pilot scope',
    metric: '1 workflow',
    evidence: 'Enterprise rollout motion from seven source families into one governed context package.',
    buyerValue: 'A buyer can fund a focused paid pilot before committing to a replatforming programme.',
  },
  {
    label: 'Integration reuse',
    metric: '4 contracts',
    evidence: 'GraphQL, REST, SDK usage, and AI-safe context packages expose the same semantic facts.',
    buyerValue: 'The same customer context can feed apps, reports, workflows, and customer-owned AI tools.',
  },
  {
    label: 'Governance proof',
    metric: '10 cited facts',
    evidence: 'Each fact carries confidence, freshness, provenance, masking notes, and selector explanation.',
    buyerValue: 'A CTO can inspect why a recommendation was made instead of accepting an opaque AI output.',
  },
  {
    label: 'Legacy preservation',
    metric: '0 replacements',
    evidence: 'CRM, SQL warehouse, support, billing, telemetry, email, and web signals remain source systems.',
    buyerValue: 'The commercial value is implementation speed and operational confidence, not ripping out working systems.',
  },
]

export const semanticTimeline = [
  {
    time: '2026-05-09 10:05',
    source: 'Email reply',
    selector: 'Preferred Channel from CRM',
    meaning: 'Email remains the safest first-touch channel for Avery.',
    facts: ['preferredChannel', 'engagementLevel'],
  },
  {
    time: '2026-05-10 16:35',
    source: 'Support ticket resolved',
    selector: 'Churn Risk Formula',
    meaning: 'Support drag falls; recommendations can discuss rollout but should still cite operational stability.',
    facts: ['churnRisk', 'productFit'],
  },
  {
    time: '2026-05-11 14:10',
    source: 'CRM opportunity moved to proposal',
    selector: 'Conversion Probability Score',
    meaning: 'The account is now in an active commercial window, not passive nurture.',
    facts: ['conversionProbability', 'recommendedSalesMotion'],
  },
  {
    time: '2026-05-12 07:45',
    source: 'Product usage spike',
    selector: 'Engagement Level from Usage',
    meaning: 'The product footprint is broad enough to support an enterprise rollout discussion.',
    facts: ['engagementLevel', 'productFit', 'expansionPotential'],
  },
  {
    time: '2026-05-12 08:25',
    source: 'Enterprise pricing visit',
    selector: 'Budget Readiness Score',
    meaning: 'The buyer is evaluating commercial terms now, so timing urgency increases.',
    facts: ['budgetReadiness', 'planInterest'],
  },
]

export const interactionTimeline: InteractionBeat[] = [
  {
    time: '09:00',
    rawDataPoint: 'CRM opportunity stage changed to proposal for Northstar Logistics.',
    semanticFact: 'conversionProbability = 88% with 91% confidence.',
    aiRecommendation: 'Lead with enterprise rollout value and ask for a 20-minute discovery call within seven days.',
    action: 'Sales workflow queues a human-reviewed email draft for Avery.',
    result: 'The workflow acts on a cited commercial signal instead of a generic lead score.',
  },
  {
    time: '09:05',
    rawDataPoint: 'Product telemetry shows 42 sessions and 58 key feature events in seven days.',
    semanticFact: 'engagementLevel = high and productFit = 91%.',
    aiRecommendation: 'Reference recent operational momentum, but avoid naming unprovided internal users.',
    action: 'The email copy mentions team adoption patterns, not individual activity.',
    result: 'Personalisation is grounded without exposing unnecessary raw telemetry.',
  },
  {
    time: '09:08',
    rawDataPoint: 'Support system has zero critical open tickets and one resolved onboarding issue.',
    semanticFact: 'churnRisk = 12%, support drag controlled.',
    aiRecommendation: 'Acknowledge the resolved onboarding issue before proposing expansion.',
    action: 'Rep opens with operational trust, then suggests next rollout milestone.',
    result: 'The recommendation balances urgency with credibility.',
  },
  {
    time: '09:12',
    rawDataPoint: 'Billing rollup shows 28 requested additional seats and healthy payment status.',
    semanticFact: 'expansionPotential = 84%, budgetReadiness = 82%.',
    aiRecommendation: 'Use ROI and rollout readiness rather than a feature tour.',
    action: 'Workflow attaches a business-case talking point and citations FACT-06 and FACT-07.',
    result: 'The next action is commercially relevant and auditable.',
  },
]

export const aiRecommendation = {
  contextPackageSummary:
    'Avery Stone at Northstar Logistics is evaluating enterprise rollout. UCL found high product engagement, active proposal-stage opportunity, strong pricing intent, low current churn risk, and a preference for email-first outreach.',
  outreachStrategy: {
    summary:
      'Use a concise email-first enterprise rollout motion while the proposal-stage and pricing signals are fresh. Lead with operational momentum, acknowledge resolved support friction, and ask for a focused discovery call.',
    recommendedChannel: 'email',
    timing: 'Within 24 hours while pricing and usage signals are fresh.',
    confidence: 0.89,
  },
  personalisedEmail: {
    subject: 'Avery, a focused path to enterprise rollout at Northstar',
    preview: "Your team's recent rollout signals suggest this is a useful moment to align on next steps.",
    body:
      "Hi Avery,\n\nNorthstar's recent usage depth and enterprise pricing activity suggest your team is actively evaluating a broader rollout. Because the latest support signal looks controlled, it may be a good moment to align on the practical path from current adoption to an enterprise plan.\n\nWould a 20-minute call next week be useful to map the rollout milestones, commercial assumptions, and any remaining operational risks?\n\nBest,\nUniversal Context Layer team",
  },
  followUps: [
    'If Avery replies, send a short rollout checklist tied to productFit, expansionPotential, and budgetReadiness.',
    'If there is no reply after three working days, follow up with one cited business-case proof point and no new unsupported claims.',
    'If support risk changes, pause the accelerate_enterprise motion and request human review.',
  ],
  citations: ['FACT-01', 'FACT-02', 'FACT-05', 'FACT-06', 'FACT-07', 'FACT-09', 'FACT-10'],
  confidenceNotes: [
    'High confidence on channel and engagement because CRM and telemetry agree.',
    'Moderate confidence on budget readiness because pricing behaviour is intent, not a signed budget.',
    'Human review remains appropriate before sending outbound copy.',
  ],
  hallucinationGuardrails: [
    'Do not invent contract terms, named stakeholders, call recordings, or private messages.',
    'Every claim in the recommendation must cite a context fact.',
    'Missing information should be named explicitly rather than guessed.',
    'Raw operational data is summarised and masked before it reaches the AI consumer.',
  ],
}

export const auditTimeline = [
  {
    time: '2026-05-12T08:26:14Z',
    actor: 'scheduled-recompute-worker',
    event: 'Source rollup read',
    detail: 'Read CRM, usage, billing, support, email, and web-event snapshots for User 123.',
  },
  {
    time: '2026-05-12T08:27:02Z',
    actor: 'selector-engine',
    event: 'Selectors executed',
    detail: 'Published selectors generated 10 semantic facts with confidence and freshness metadata.',
  },
  {
    time: '2026-05-12T08:28:33Z',
    actor: 'context-snapshot-service',
    event: 'Snapshot generated',
    detail: 'Context snapshot v7 generated for Avery Stone with overall confidence 90%.',
  },
  {
    time: '2026-05-12T08:31:10Z',
    actor: 'sales-support-consumer',
    event: 'Context package requested',
    detail: 'AI playground consumed scoped context package with 7 cited facts and masking enabled.',
  },
]

export const faqItems = [
  {
    question: 'Is UCL the brain or the AI model?',
    answer:
      'No. UCL is the nervous system: it carries trusted business context from existing systems to the customer-owned tools, workflows, reports, apps, and AI stack that need it.',
  },
  {
    question: 'Does this replace our CRM?',
    answer:
      'No. UCL sits beside CRM, billing, support, product, warehouse, spreadsheet, and legacy systems. It turns selected signals into reusable semantic facts while systems of record continue doing their existing jobs.',
  },
  {
    question: 'Do we have to use your AI?',
    answer:
      'No. The AI playground is an example consumer. Customers can use their own applications, reports, copilots, agents, workflow tools, or non-AI decision systems against the same context layer.',
  },
  {
    question: 'Where does our data live?',
    answer:
      'By default, operational data, connector credentials, selectors, context facts, snapshots, provenance, and audit logs live in the customer data plane controlled by the customer.',
  },
  {
    question: 'Can it run self-hosted?',
    answer:
      'Yes. The public repo is oriented around a self-hosted customer data plane. Paid/private work can add deployment support, private cloud patterns, and enterprise modules without moving raw data into a hosted control plane by default.',
  },
  {
    question: 'What is the customer data plane?',
    answer:
      "It is the UCL runtime that runs near the customer's systems. It owns connectors, source access, semantic schema, selectors, recompute jobs, facts, snapshots, provenance, audit, masking, API keys, and local operational configuration.",
  },
  {
    question: 'What is included in the open source repo?',
    answer:
      'The open core includes the data-plane foundations, local demo, admin console, REST and GraphQL APIs, SDKs, generic connectors, mock demo connectors, extension points, docs, and tests.',
  },
  {
    question: 'What is paid?',
    answer:
      'Paid work can include discovery, implementation-led pilots, production-style deployment support, private enterprise connectors, SSO, advanced governance, compliance exports, SLAs, and future hosted control-plane capabilities.',
  },
  {
    question: 'Can we use this with our own applications?',
    answer:
      'Yes. Applications can consume context through REST, GraphQL, SDKs, internal service calls, or connector-specific integration patterns once the customer data plane has generated the relevant facts.',
  },
  {
    question: 'How do selectors work?',
    answer:
      'Selectors are governed mappings that convert raw source fields, events, and metrics into semantic facts. They can use direct mapping, enum mapping, threshold classification, weighted scoring, formula-derived metrics, and composite logic.',
  },
  {
    question: 'How does it help ROI?',
    answer:
      'UCL reduces duplicated integration work and helps teams ship better-grounded AI or workflow decisions sooner. A paid pilot should prove one high-value workflow with measurable time saved, improved conversion, reduced risk, or clearer operational decisions.',
  },
  {
    question: 'What should a CEO care about?',
    answer:
      'A CEO should see a practical path to value: prove one workflow, keep existing systems in place, avoid a replatforming programme, and decide whether the context layer is worth expanding.',
  },
  {
    question: 'What should a CTO verify?',
    answer:
      'A CTO should verify tenant scoping, API contracts, source boundaries, selector governance, provenance, audit events, machine-to-machine auth, backup expectations, and the open-core versus private enterprise boundary.',
  },
  {
    question: 'What should an enterprise architect check?',
    answer:
      'An enterprise architect should check how the customer data plane sits beside existing systems, which data crosses boundaries, how context packages are scoped, and which future connector or control-plane capabilities need commercial scope.',
  },
]
