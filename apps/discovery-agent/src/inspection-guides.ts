export type InspectionDomain =
  | 'local-codebase-shape'
  | 'database-schema-metadata'
  | 'crm-metadata'
  | 'website-conversion-points'
  | 'analytics-property-event-metadata'
  | 'support-metadata'
  | 'billing-metadata'
  | 'product-metadata'
  | 'ecommerce-metadata'
  | 'docs-system-metadata'

export interface InspectionGuide {
  id: InspectionDomain
  title: string
  purpose: string
  allowedMetadata: string[]
  excludedData: string[]
  suggestedApproach: string[]
}

const commonExcludedData = [
  'No credentials, tokens, private keys, connection strings, service-account JSON, or local licence files.',
  'No database rows, exported records, raw payloads, support bundle contents, transcripts, message bodies, or attachments.',
  'No personal data values such as customer email addresses, phone numbers, postal addresses, payment identifiers, or subject IDs.',
  'No dependency folders, build outputs, raw exports, database dumps, or support bundles.',
]

const guides: InspectionGuide[] = [
  {
    id: 'local-codebase-shape',
    title: 'Local Codebase Shape',
    purpose: 'Map the application shape enough to plan a synthetic KynticAI Scout demo without reading private data.',
    allowedMetadata: [
      'Project name, languages, frameworks, package ecosystems, entry point types, API route shapes, schema object names, and relative file paths.',
      'Counts of endpoints, schema objects, source modules, and detected package managers.',
      'High-level security and governance surfaces, for example authentication present or webhook boundary present.',
    ],
    excludedData: commonExcludedData,
    suggestedApproach: [
      'Run the local audit tool at the lowest useful tier and keep the report on the buyer machine.',
      'Review relative file names and inferred system shape before approving any signature.',
      'Do not paste source snippets or raw configuration values into the Discovery Signature draft.',
    ],
  },
  {
    id: 'database-schema-metadata',
    title: 'Database Schema Metadata',
    purpose: 'Capture schema shape without exposing rows or database dumps.',
    allowedMetadata: [
      'Database engine family, schema names, table names, column names, column types, nullable flags, primary or foreign key markers, and row-count bands.',
      'Freshness notes such as last schema migration date or known read replica availability.',
      'Candidate subject keys described as field names only, not values.',
    ],
    excludedData: commonExcludedData,
    suggestedApproach: [
      'Use schema-only exports, information_schema queries, migration files, or ORM metadata.',
      'Replace exact record counts with bands such as 0, 1-1k, 1k-100k, or 100k+.',
      'Mark any uncertain fields as review-needed rather than sampling rows.',
    ],
  },
  {
    id: 'crm-metadata',
    title: 'CRM Metadata',
    purpose: 'Describe account, contact, opportunity, and activity shapes without vendor-specific private connector details.',
    allowedMetadata: [
      'Object names, field API names, field labels, field types, relationship names, pipeline or stage names, and update-frequency bands.',
      'Business concepts such as account health, renewal date, lead source, opportunity stage, or stakeholder role as metadata labels.',
      'Connector manifest fields and safe sample configuration placeholders.',
    ],
    excludedData: commonExcludedData,
    suggestedApproach: [
      'Export object and field definitions only, or document them manually from admin screens.',
      'Keep example values fictional if an example is needed for review.',
      'Map candidate fields to public KynticAI Scout semantic attributes only after IT-manager approval.',
    ],
  },
  {
    id: 'website-conversion-points',
    title: 'Website Conversion Points',
    purpose: 'Identify where conversion intent appears without collecting visitor-level data.',
    allowedMetadata: [
      'Public page categories, form names, CTA labels, funnel step names, URL path patterns, cookie categories, and conversion event names.',
      'Consent mode, tag manager container presence, and analytics property names when approved.',
      'Aggregate-only conversion bands and known attribution windows.',
    ],
    excludedData: commonExcludedData,
    suggestedApproach: [
      'Inspect public site structure, tag names, and form metadata rather than submissions.',
      'Use route patterns such as /pricing or /demo-request, not full URLs containing tracking identifiers.',
      'Keep any screenshots or page text out of the Discovery Signature unless explicitly approved as public marketing material.',
    ],
  },
  {
    id: 'analytics-property-event-metadata',
    title: 'Analytics Property And Event Metadata',
    purpose: 'Collect event taxonomy shape for synthetic journey modelling.',
    allowedMetadata: [
      'Property names, stream names, event names, parameter names, user-property names, conversion flags, and retention settings.',
      'Aggregate event-volume bands and collection-platform names.',
      'Identity stitching approach described at policy level only.',
    ],
    excludedData: commonExcludedData,
    suggestedApproach: [
      'Use analytics admin metadata or tracking-plan documents.',
      'Do not export event logs or user-level property values.',
      'Flag events that need consent or governance review before any production mapping.',
    ],
  },
  {
    id: 'support-metadata',
    title: 'Support Metadata',
    purpose: 'Map support signals without reading ticket content or support bundles.',
    allowedMetadata: [
      'Ticket object names, queue names, status values, priority values, SLA policy names, tag names, macro names, and field definitions.',
      'Aggregate volume bands by queue or status.',
      'Safe field labels that could inform customer-health signals.',
    ],
    excludedData: commonExcludedData,
    suggestedApproach: [
      'Use admin metadata, exported field definitions, or manually reviewed screenshots of settings only.',
      'Never include ticket bodies, chat transcripts, attachments, internal notes, or customer identifiers.',
      'Separate support taxonomy from any future approved exact-data integration.',
    ],
  },
  {
    id: 'billing-metadata',
    title: 'Billing Metadata',
    purpose: 'Describe billing and subscription signal shape without exposing invoices or payment data.',
    allowedMetadata: [
      'Plan names, subscription status values, invoice object names, field names, renewal cadence, payment-status taxonomy, and aggregate bands.',
      'Non-secret configuration fields needed by a public connector manifest.',
      'Governance notes about finance-system ownership and approval path.',
    ],
    excludedData: commonExcludedData,
    suggestedApproach: [
      'Collect billing object definitions and status taxonomies only.',
      'Avoid invoice PDFs, card data, payment identifiers, billing addresses, and ledger exports.',
      'Use fictional examples for synthetic demo planning.',
    ],
  },
  {
    id: 'product-metadata',
    title: 'Product Metadata',
    purpose: 'Map product usage concepts for synthetic demo journeys.',
    allowedMetadata: [
      'Feature names, event names, account-level usage metric names, entitlement names, plan names, and aggregate activity bands.',
      'Product areas, workflow names, and lifecycle stage labels.',
      'Schema field names for product database objects, without row values.',
    ],
    excludedData: commonExcludedData,
    suggestedApproach: [
      'Start with tracking plans, product analytics schemas, and admin-level feature catalogues.',
      'Keep user IDs, account IDs, session IDs, and behavioural event logs out of the Discovery Signature draft.',
      'Prefer counts and bands over exact usage facts.',
    ],
  },
  {
    id: 'ecommerce-metadata',
    title: 'Ecommerce Metadata',
    purpose: 'Capture commerce journey shape without exposing orders or customer records.',
    allowedMetadata: [
      'Product catalogue field names, basket event names, order-status values, promotion taxonomy, fulfilment status values, and aggregate bands.',
      'Conversion steps such as product view, add to basket, checkout started, purchase completed, and return requested.',
      'Connector manifest metadata for approved commerce-like sources.',
    ],
    excludedData: commonExcludedData,
    suggestedApproach: [
      'Use schema definitions and event taxonomies, not order exports.',
      'Exclude SKUs if they reveal confidential product launches; use category labels instead.',
      'Keep payment, shipping, and customer contact values out of the signature.',
    ],
  },
  {
    id: 'docs-system-metadata',
    title: 'Docs-System Metadata',
    purpose: 'Understand documentation systems as metadata sources without copying private documents.',
    allowedMetadata: [
      'Space names, collection names, content type names, public/private flags, taxonomy labels, owner group names, and update cadence.',
      'Search event names and documentation journey event names when collected as metadata only.',
      'Aggregate page-count or article-count bands.',
    ],
    excludedData: commonExcludedData,
    suggestedApproach: [
      'Use content model metadata and access-policy summaries.',
      'Do not include document bodies, private roadmap pages, customer material, or exported knowledge bases.',
      'Mark public documentation separately from internal documentation in the Discovery Signature draft.',
    ],
  },
]

const guideById = new Map(guides.map((guide) => [guide.id, guide]))

export function listInspectionGuides(): InspectionGuide[] {
  return [...guides]
}

export function getInspectionGuide(id: InspectionDomain): InspectionGuide {
  const guide = guideById.get(id)
  if (guide === undefined) {
    throw new Error(`Unknown inspection guide '${id}'.`)
  }

  return guide
}

export function renderInspectionGuideMarkdown(guide: InspectionGuide): string {
  return [
    `# ${guide.title}`,
    '',
    guide.purpose,
    '',
    '## Allowed metadata',
    ...guide.allowedMetadata.map((item) => `- ${item}`),
    '',
    '## Excluded data',
    ...guide.excludedData.map((item) => `- ${item}`),
    '',
    '## Suggested approach',
    ...guide.suggestedApproach.map((item) => `- ${item}`),
    '',
  ].join('\n')
}

export function renderBuyerWorkflowPrompt(): string {
  return [
    'You are helping an IT manager run KynticAI Discovery MCP safely.',
    '',
    'Follow this journey:',
    '1. Run local discovery only on approved paths.',
    '2. Inspect connector catalogue metadata and validate any connector manifest locally.',
    '3. Build a Discovery Signature draft using metadata labels, field names, event names, counts, and bands only.',
    '4. Validate and export the Discovery Signature draft locally.',
    '5. Ask the IT manager to review the signature before any optional handoff.',
    '6. If handoff is approved, send only the Discovery Signature to the approved KynticAI endpoint configured by IT.',
    '',
    'Never read or request raw customer records, secrets, exported datasets, database dumps, support bundles, or private implementation details.',
  ].join('\n')
}
