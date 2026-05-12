/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Braces,
  Building2,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  GitBranch,
  Layers3,
  LockKeyhole,
  Mail,
  Map,
  Network,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Workflow,
} from 'lucide-react'
import {
  aiRecommendation,
  auditTimeline,
  contextFacts,
  faqItems,
  featuredAccount,
  featuredPerson,
  interactionTimeline,
  rawSignals,
  selectors,
  semanticTimeline,
  type ContextFact,
  type RawSignal,
  type SelectorDefinition,
} from './data'
import './styles.css'

const sectionLinks = [
  ['Home', 'home'],
  ['Why UCL', 'why-ucl'],
  ['Signals', 'legacy-signals'],
  ['Timeline', 'semantic-timeline'],
  ['Context', 'context-viewer'],
  ['Selectors', 'selector-builder'],
  ['AI', 'ai-playground'],
  ['Architecture', 'architecture'],
  ['FAQ', 'faq'],
] as const

function formatConfidence(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(new Date(value))
}

function App() {
  return (
    <div className="site-shell">
      <Header />
      <main>
        <HomeSection />
        <WhySection />
        <LegacySignalsSection />
        <SemanticTimelineSection />
        <AiInteractionTimelineSection />
        <CustomerContextSection />
        <SelectorBuilderSection />
        <AiPlaygroundSection />
        <OpenCoreSection />
        <ArchitectureSection />
        <FaqSection />
      </main>
    </div>
  )
}

function Header() {
  return (
    <header className="topbar">
      <a className="brand" href="#home" aria-label="Universal Context Layer static demo home">
        <span className="brand-mark">UCL</span>
        <span>
          <strong>Universal Context Layer</strong>
          <small>Static GitHub Pages demo</small>
        </span>
      </a>
      <nav className="nav-links" aria-label="Demo sections">
        {sectionLinks.map(([label, id]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>
    </header>
  )
}

function Section({
  id,
  eyebrow,
  title,
  firstSentence,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  firstSentence: string
  children: ReactNode
}) {
  return (
    <section id={id} className="section">
      <div className="section-heading">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="first-sentence">{firstSentence}</p>
      </div>
      {children}
    </section>
  )
}

function HomeSection() {
  return (
    <section id="home" className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Static brochure and sales demo</p>
        <h1>Universal Context Layer turns existing business data into trusted semantic context for AI, apps, reports, and workflows.</h1>
        <p>
          This static site is the public demo, brochure, and marketing walkthrough. The full downloadable product is still the functional React application and backend that teams can run to use UCL with real connectors, selectors, APIs, and context workflows.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#legacy-signals">
            Explore the data story <ArrowRight aria-hidden="true" />
          </a>
          <a className="button secondary" href="#ai-playground">
            See the grounded AI output
          </a>
        </div>
      </div>
      <div className="hero-board" aria-label="Static demo data flow from raw systems to grounded recommendations">
        <div className="flow-node raw">
          <Database aria-hidden="true" />
          <span>CRM, billing, support, usage, email, web</span>
        </div>
        <ArrowRight className="flow-arrow" aria-hidden="true" />
        <div className="flow-node semantic">
          <Layers3 aria-hidden="true" />
          <span>Selectors, facts, confidence, provenance</span>
        </div>
        <ArrowRight className="flow-arrow" aria-hidden="true" />
        <div className="flow-node outcome">
          <Bot aria-hidden="true" />
          <span>Grounded AI advice and workflow actions</span>
        </div>
        <div className="hero-proof">
          <Metric label="Fictional profile" value="User 123" />
          <Metric label="Semantic facts" value={String(contextFacts.length)} />
          <Metric label="Live backend calls" value="0" />
        </div>
      </div>
    </section>
  )
}

function WhySection() {
  return (
    <Section
      id="why-ucl"
      eyebrow="Why UCL"
      title="AI is only as strong as the business context it receives."
      firstSentence="Fragmented legacy data makes AI weak because each workflow receives partial records, stale interpretation, and little evidence."
    >
      <div className="split">
        <div className="panel danger">
          <h3>Before UCL</h3>
          <ul className="story-list">
            <li>CRM notes, product events, invoices, support tickets, and web visits sit in separate systems.</li>
            <li>Replacing those systems is expensive, slow, and usually unrealistic for a first AI workflow.</li>
            <li>Teams compensate with copied exports, brittle joins, and prompts that cannot prove why they made a recommendation.</li>
          </ul>
        </div>
        <div className="panel success">
          <h3>With UCL</h3>
          <ul className="story-list">
            <li>Existing systems stay in place while selectors translate selected signals into shared business meaning.</li>
            <li>Facts carry confidence, freshness, provenance, masking, and explanations.</li>
            <li>Downstream apps and AI consumers receive a governed context package instead of raw operational sprawl.</li>
          </ul>
        </div>
      </div>
      <div className="role-grid">
        {[
          [Building2, 'CEO', 'Prove value without a systems replacement programme.'],
          [Network, 'CTO', 'Create one semantic contract over many operational sources.'],
          [Sparkles, 'Product leader', 'Ship grounded workflows that can explain their recommendations.'],
        ].map(([Icon, title, body]) => (
          <article className="mini-card" key={title as string}>
            <Icon aria-hidden="true" />
            <h3>{title as string}</h3>
            <p>{body as string}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}

function LegacySignalsSection() {
  return (
    <Section
      id="legacy-signals"
      eyebrow="Legacy data signals"
      title="The demo starts with static snapshots of operational data."
      firstSentence="Raw CRM, product usage, billing, support, email, and web signals stay recognisable before UCL turns them into semantic facts."
    >
      <div className="signal-grid">
        {rawSignals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>
    </Section>
  )
}

function SignalCard({ signal }: { signal: RawSignal }) {
  return (
    <article className="signal-card">
      <div className="card-topline">
        <span className="tag">{signal.system}</span>
        <time>{formatDateTime(signal.timestamp)}</time>
      </div>
      <h3>{signal.rawField}</h3>
      <p className="raw-value">{signal.rawValue}</p>
      <p>{signal.interpretation}</p>
      <code>{signal.source}</code>
    </article>
  )
}

function SemanticTimelineSection() {
  return (
    <Section
      id="semantic-timeline"
      eyebrow="Semantic timeline"
      title="Selectors turn time-ordered source events into reusable business meaning."
      firstSentence="Each event becomes more valuable once UCL resolves what it means, how confident it is, and which downstream consumers may cite it."
    >
      <div className="timeline">
        {semanticTimeline.map((item) => (
          <article className="timeline-item" key={`${item.time}-${item.selector}`}>
            <div className="timeline-dot" />
            <div className="timeline-card">
              <div className="card-topline">
                <span className="tag">{item.source}</span>
                <time>{item.time}</time>
              </div>
              <h3>{item.meaning}</h3>
              <p>
                <strong>{item.selector}</strong> updated {item.facts.join(', ')}.
              </p>
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}

function AiInteractionTimelineSection() {
  return (
    <Section
      id="ai-interaction-timeline"
      eyebrow="AI interaction timeline"
      title="Grounded context changes what the AI and workflow decide next."
      firstSentence="The static interaction timeline shows raw data, UCL semantic interpretation, AI advice, human or workflow action, and business result."
    >
      <div className="interaction-list">
        {interactionTimeline.map((beat) => (
          <article className="interaction-card" key={`${beat.time}-${beat.semanticFact}`}>
            <div className="interaction-time">{beat.time}</div>
            <Step label="Raw data point" body={beat.rawDataPoint} />
            <Step label="UCL semantic fact" body={beat.semanticFact} />
            <Step label="AI recommendation" body={beat.aiRecommendation} />
            <Step label="Action" body={beat.action} />
            <Step label="Result" body={beat.result} />
          </article>
        ))}
      </div>
    </Section>
  )
}

function Step({ label, body }: { label: string; body: string }) {
  return (
    <div className="step">
      <span>{label}</span>
      <p>{body}</p>
    </div>
  )
}

function CustomerContextSection() {
  return (
    <Section
      id="context-viewer"
      eyebrow="Customer context viewer"
      title="User 123 becomes a readable, auditable customer context profile."
      firstSentence="The static profile for Avery Stone shows confidence badges, provenance panels, snapshot history, and a readable agent summary without calling the backend."
    >
      <div className="context-layout">
        <aside className="profile-panel">
          <span className="tag">Featured account</span>
          <h3>{featuredAccount.accountName}</h3>
          <dl>
            <div>
              <dt>User</dt>
              <dd>
                {featuredPerson.fullName} / {featuredPerson.externalUserId}
              </dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{featuredPerson.jobTitle}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{featuredPerson.email}</dd>
            </div>
            <div>
              <dt>Lifecycle</dt>
              <dd>{featuredAccount.lifecycleStage}</dd>
            </div>
          </dl>
          <p className="fiction-note">{featuredPerson.note}</p>
        </aside>
        <div className="fact-grid">
          {contextFacts.map((fact) => (
            <FactCard key={fact.id} fact={fact} />
          ))}
        </div>
        <aside className="profile-panel">
          <span className="tag">Agent summary</span>
          <p className="summary-copy">
            Avery at Northstar Logistics is in an active enterprise rollout window. The account has high product engagement, low current support drag, healthy expansion indicators, and email is the recommended first channel. The AI consumer should cite the support and budget facts before recommending urgency.
          </p>
          <h3>Snapshot history</h3>
          <div className="snapshot-list">
            {['v7 / 90% / current', 'v6 / 86% / pricing signal added', 'v5 / 81% / support issue resolved'].map((snapshot) => (
              <div key={snapshot}>
                <Clock3 aria-hidden="true" />
                <span>{snapshot}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </Section>
  )
}

function FactCard({ fact }: { fact: ContextFact }) {
  const displayValue = fact.value.replaceAll('_', ' ')

  return (
    <article className="fact-card">
      <div className="card-topline">
        <span className="tag">{fact.id}</span>
        <span className="confidence">{formatConfidence(fact.confidence)}</span>
      </div>
      <h3>{fact.displayName}</h3>
      <p className="fact-value">{displayValue}</p>
      <p>{fact.explanation}</p>
      <details>
        <summary>Provenance and freshness</summary>
        <ul>
          {fact.provenance.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          {fact.type} / {fact.freshness} / {formatDateTime(fact.timestamp)}
        </p>
        <p>Selector: {fact.selector}</p>
      </details>
    </article>
  )
}

function SelectorBuilderSection() {
  return (
    <Section
      id="selector-builder"
      eyebrow="Selector builder demo"
      title="A static mapping studio shows how raw fields become semantic facts."
      firstSentence="The selector builder preview includes field mapping, weighted scoring, threshold classification, formula-derived metrics, confidence, freshness, and output preview."
    >
      <div className="selector-layout">
        <div className="selector-list">
          {selectors.map((selector) => (
            <SelectorCard key={selector.id} selector={selector} />
          ))}
        </div>
        <div className="builder-panel">
          <div className="builder-header">
            <SlidersHorizontal aria-hidden="true" />
            <div>
              <span className="tag">Preview selector</span>
              <h3>Conversion Probability Score</h3>
            </div>
          </div>
          <div className="mapping-grid">
            {[
              ['Field mapping', 'warehouse.opportunity_stage -> proposal'],
              ['Weighted scoring', 'proposal 60 + enterprise 10 + active usage 10 + pricing intent 8'],
              ['Threshold classification', 'score >= 80 -> high conversion probability'],
              ['Formula-derived metric', 'support drag and payment health adjust final confidence'],
              ['Confidence', '0.91 default, reduced if source freshness expires'],
              ['Preview output', 'conversionProbability = 88%, FACT-01'],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <p>{value}</p>
              </div>
            ))}
          </div>
          <pre className="code-panel">{`{
  "attributeKey": "conversionProbability",
  "value": 88,
  "confidence": 0.91,
  "freshUntil": "2026-05-12T11:30:00Z",
  "provenance": ["CRM", "Product usage", "Web events", "Support"]
}`}</pre>
        </div>
      </div>
    </Section>
  )
}

function SelectorCard({ selector }: { selector: SelectorDefinition }) {
  const previewValue = selector.previewValue.replaceAll('_', ' ')

  return (
    <article className="selector-card">
      <div className="card-topline">
        <span className="tag">{selector.mappingKind}</span>
        <span>{formatConfidence(selector.confidence)}</span>
      </div>
      <h3>{selector.name}</h3>
      <p>{selector.rule}</p>
      <dl>
        <div>
          <dt>Source</dt>
          <dd>{selector.sourceSystem}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{selector.targetAttribute}</dd>
        </div>
        <div>
          <dt>Preview</dt>
          <dd>{previewValue}</dd>
        </div>
      </dl>
    </article>
  )
}

function AiPlaygroundSection() {
  return (
    <Section
      id="ai-playground"
      eyebrow="AI playground demo"
      title="The AI receives a context package, not a pile of raw records."
      firstSentence="The static AI playground shows outreach strategy, a personalised email draft, follow-up recommendations, citations, and why the recommendation was made."
    >
      <div className="ai-layout">
        <article className="package-panel">
          <div className="builder-header">
            <Braces aria-hidden="true" />
            <div>
              <span className="tag">Context package</span>
              <h3>Scoped facts sent to the consumer</h3>
            </div>
          </div>
          <p>{aiRecommendation.contextPackageSummary}</p>
          <div className="citation-strip">
            {aiRecommendation.citations.map((citation) => (
              <span key={citation}>{citation}</span>
            ))}
          </div>
        </article>
        <article className="strategy-panel">
          <span className="tag">Outreach strategy</span>
          <h3>{aiRecommendation.outreachStrategy.summary}</h3>
          <p>
            Channel: {aiRecommendation.outreachStrategy.recommendedChannel}. Timing: {aiRecommendation.outreachStrategy.timing}
          </p>
          <span className="confidence">{formatConfidence(aiRecommendation.outreachStrategy.confidence)}</span>
        </article>
        <article className="email-panel">
          <div className="builder-header">
            <Mail aria-hidden="true" />
            <div>
              <span className="tag">Personalised email draft</span>
              <h3>{aiRecommendation.personalisedEmail.subject}</h3>
            </div>
          </div>
          <p className="preview-text">{aiRecommendation.personalisedEmail.preview}</p>
          <pre>{aiRecommendation.personalisedEmail.body}</pre>
        </article>
        <article className="guardrail-panel">
          <span className="tag">Why this was recommended</span>
          <ul>
            {aiRecommendation.confidenceNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
          <span className="tag">Hallucination guardrails</span>
          <ul>
            {aiRecommendation.hallucinationGuardrails.map((guardrail) => (
              <li key={guardrail}>{guardrail}</li>
            ))}
          </ul>
        </article>
        <article className="followup-panel">
          <span className="tag">Follow-up recommendations</span>
          {aiRecommendation.followUps.map((item) => (
            <p key={item}>
              <CheckCircle2 aria-hidden="true" />
              {item}
            </p>
          ))}
        </article>
      </div>
    </Section>
  )
}

function OpenCoreSection() {
  return (
    <Section
      id="open-core"
      eyebrow="Open core and paid pilot"
      title="The public repo proves the customer data plane, not a pretend self-serve SaaS."
      firstSentence="The static site is a polished sales and marketing layer, while the open-core repo still contains the functional downloadable product and reusable data-plane foundations."
    >
      <div className="three-column">
        <article className="info-panel">
          <GitBranch aria-hidden="true" />
          <h3>Open source</h3>
          <p>Local demo, admin console, REST, GraphQL, SDKs, generic connectors, mock connectors, selector engine, context snapshots, provenance, audit, docs, and extension points.</p>
        </article>
        <article className="info-panel">
          <LockKeyhole aria-hidden="true" />
          <h3>Paid/private</h3>
          <p>Enterprise connector implementations, SSO, advanced governance, compliance exports, SLAs, private cloud deployment packs, and future hosted control-plane services.</p>
        </article>
        <article className="info-panel">
          <Map aria-hidden="true" />
          <h3>Paid pilot</h3>
          <p>Discovery, one customer data plane, selected sources or safe exports, selectors, one useful downstream consumer, success measures, handover, and production-readiness advice.</p>
        </article>
      </div>
    </Section>
  )
}

function ArchitectureSection() {
  return (
    <Section
      id="architecture"
      eyebrow="Technical architecture"
      title="The customer data plane owns operational data and context generation."
      firstSentence="UCL separates the self-hosted customer data plane from an optional hosted control plane so raw operational data does not need to leave customer control by default."
    >
      <div className="architecture-grid">
        <div className="architecture-diagram" aria-label="Customer data plane and optional hosted control plane architecture">
          <div className="arch-zone customer">
            <h3>Customer data plane</h3>
            <p>Connectors, credentials, selectors, semantic schema, context facts, snapshots, provenance, audit, masking, REST, GraphQL, SDKs.</p>
            <div className="arch-chips">
              {['CRM', 'ERP', 'SQL', 'Billing', 'Support', 'Usage', 'Email', 'Web'].map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          </div>
          <div className="arch-bridge">
            <ArrowRight aria-hidden="true" />
            <span>Optional metadata, licence, support, update, and aggregate usage boundaries</span>
          </div>
          <div className="arch-zone hosted">
            <h3>Optional hosted control plane</h3>
            <p>Account management, commercial licence flows, downloads, support access, update channels, and future hosted operations.</p>
          </div>
        </div>
        <div className="architecture-copy">
          {[
            [ShieldCheck, 'Masking and provenance', 'Facts expose evidence and confidence without forcing raw records into prompts.'],
            [Workflow, 'Selectors and snapshots', 'Mappings can be recomputed on schedules, source events, or manual requests.'],
            [FileText, 'REST, GraphQL, SDKs', 'Consumers can call the data plane through stable APIs instead of direct source-system access.'],
            [BadgeCheck, 'Audit', 'Reads, recomputes, source events, and context package access can be traced.'],
          ].map(([Icon, title, body]) => (
            <article className="mini-card" key={title as string}>
              <Icon aria-hidden="true" />
              <h3>{title as string}</h3>
              <p>{body as string}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="audit-strip">
        {auditTimeline.map((event) => (
          <article key={`${event.time}-${event.event}`}>
            <span className="tag">{event.actor}</span>
            <h3>{event.event}</h3>
            <p>{event.detail}</p>
            <time>{formatDateTime(event.time)}</time>
          </article>
        ))}
      </div>
    </Section>
  )
}

function FaqSection() {
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="Common buyer and technical questions."
      firstSentence="The static FAQ is written for teams deciding whether UCL should sit beside their current systems and prove one high-value workflow."
    >
      <div className="faq-grid">
        {faqItems.map((item) => (
          <details key={item.question} className="faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
