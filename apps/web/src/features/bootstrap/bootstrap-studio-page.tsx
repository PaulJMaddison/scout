import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Bot,
  CheckCircle2,
  Copy,
  DatabaseZap,
  Download,
  FileCog,
  FileUp,
  ShieldCheck,
  Sparkles,
  Upload,
  WandSparkles,
} from 'lucide-react'
import { queryClient } from '@/app/providers'
import { JsonViewer } from '@/components/data-display/json-viewer'
import { Badge, Button, Card, EmptyState, MetricCard, PageHeader, Panel, Textarea } from '@/components/ui/primitives'
import { api } from '@/lib/api'
import { useAuthSession } from '@/lib/auth'
import { prettyJson } from '@/lib/utils'
import {
  bootstrapArtifacts,
  codexBootstrapPrompt,
  contextLayerBlueprintSchema,
  sampleBlueprint,
} from '@/features/bootstrap/bootstrap-studio-data'

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function BootstrapStudioPage() {
  const { session } = useAuthSession()
  const tenantSlug = session?.tenantSlug ?? 'demo'
  const [blueprintText, setBlueprintText] = useState(() => prettyJson(sampleBlueprint))
  const [importMessages, setImportMessages] = useState<string[]>([])
  const [clipboardMessage, setClipboardMessage] = useState<string | null>(null)

  const dataSourcesQuery = useQuery({
    queryKey: ['dataSources', tenantSlug],
    queryFn: () => api.getDataSources(tenantSlug),
    enabled: Boolean(session),
  })
  const semanticAttributesQuery = useQuery({
    queryKey: ['semanticAttributes', tenantSlug],
    queryFn: () => api.getSemanticAttributes(tenantSlug),
    enabled: Boolean(session),
  })
  const selectorsQuery = useQuery({
    queryKey: ['selectors', tenantSlug],
    queryFn: () => api.getSelectors(tenantSlug),
    enabled: Boolean(session),
  })
  const promptTemplatesQuery = useQuery({
    queryKey: ['promptTemplates', tenantSlug],
    queryFn: () => api.getPromptTemplates(tenantSlug),
    enabled: Boolean(session),
  })

  const parsedBlueprintResult = useMemo(() => {
    try {
      const parsed = JSON.parse(blueprintText) as unknown
      return contextLayerBlueprintSchema.safeParse(parsed)
    } catch (error) {
      return {
        success: false as const,
        error: {
          issues: [
            {
              path: ['blueprintText'],
              message: error instanceof Error ? error.message : 'Blueprint JSON could not be parsed.',
            },
          ],
        },
      }
    }
  }, [blueprintText])

  const blueprint = parsedBlueprintResult.success ? parsedBlueprintResult.data : null
  const validationIssues = parsedBlueprintResult.success
    ? []
    : parsedBlueprintResult.error.issues.map((issue) => `${issue.path.join('.') || 'blueprint'}: ${issue.message}`)

  const importPlan = useMemo(() => {
    if (!blueprint) {
      return null
    }

    const existingSourceNames = new Set((dataSourcesQuery.data ?? []).map((item) => item.name))
    const existingAttributeKeys = new Set((semanticAttributesQuery.data ?? []).map((item) => item.key))
    const existingSelectorNames = new Set((selectorsQuery.data ?? []).map((item) => item.name))
    const existingPromptNames = new Set((promptTemplatesQuery.data ?? []).map((item) => item.name))

    return {
      newSources: blueprint.dataSources.filter((item) => !existingSourceNames.has(item.name)).length,
      updatedSources: blueprint.dataSources.filter((item) => existingSourceNames.has(item.name)).length,
      newAttributes: blueprint.semanticAttributes.filter((item) => !existingAttributeKeys.has(item.key)).length,
      updatedAttributes: blueprint.semanticAttributes.filter((item) => existingAttributeKeys.has(item.key)).length,
      newSelectors: blueprint.selectors.filter((item) => !existingSelectorNames.has(item.name)).length,
      updatedSelectors: blueprint.selectors.filter((item) => existingSelectorNames.has(item.name)).length,
      newPromptTemplates: blueprint.promptTemplates.filter((item) => !existingPromptNames.has(item.name)).length,
      updatedPromptTemplates: blueprint.promptTemplates.filter((item) => existingPromptNames.has(item.name)).length,
    }
  }, [blueprint, dataSourcesQuery.data, promptTemplatesQuery.data, selectorsQuery.data, semanticAttributesQuery.data])

  const importMutation = useMutation({
    onMutate: () => {
      setImportMessages([])
    },
    mutationFn: async () => {
      if (!blueprint) {
        throw new Error('Load a valid ContextLayerBlueprint JSON file before importing.')
      }

      const logMessages: string[] = []
      const currentDataSources = await api.getDataSources(tenantSlug)
      const currentAttributes = await api.getSemanticAttributes(tenantSlug)
      const currentSelectors = await api.getSelectors(tenantSlug)
      const currentPromptTemplates = await api.getPromptTemplates(tenantSlug)

      const dataSourceByName = new Map(currentDataSources.map((item) => [item.name, item]))
      const attributeByKey = new Map(currentAttributes.map((item) => [item.key, item]))
      const selectorByName = new Map(currentSelectors.map((item) => [item.name, item]))
      const promptTemplateByName = new Map(currentPromptTemplates.map((item) => [item.name, item]))

      for (const source of blueprint.dataSources) {
        const existing = dataSourceByName.get(source.name)
        const saved = await api.upsertDataSource({
          id: existing?.id ?? null,
          tenantSlug,
          name: source.name,
          description: source.description,
          kind: source.kind,
          connectionConfigJson: prettyJson(source.connectionConfig),
        })
        dataSourceByName.set(saved.name, saved)
        logMessages.push(`${existing ? 'Updated' : 'Created'} data source: ${saved.name}`)
      }

      for (const attribute of blueprint.semanticAttributes) {
        const existing = attributeByKey.get(attribute.key)
        const saved = await api.upsertSemanticAttribute({
          id: existing?.id ?? null,
          tenantSlug,
          key: attribute.key,
          displayName: attribute.displayName,
          description: attribute.description,
          dataType: attribute.dataType,
          exampleValueJson: attribute.exampleValueJson,
          isSystem: attribute.isSystem,
        })
        attributeByKey.set(saved.key, saved)
        logMessages.push(`${existing ? 'Updated' : 'Created'} semantic attribute: ${saved.displayName}`)
      }

      for (const template of blueprint.promptTemplates) {
        const existing = promptTemplateByName.get(template.name)
        const saved = await api.upsertPromptTemplate({
          id: existing?.id ?? null,
          tenantSlug,
          name: template.name,
          description: template.description,
          systemPrompt: template.systemPrompt,
          developerPrompt: template.developerPrompt,
          userPromptTemplate: template.userPromptTemplate,
          outputSchemaJson: prettyJson(template.outputSchema),
          guardrailsJson: prettyJson(template.guardrails),
        })
        promptTemplateByName.set(saved.name, saved)
        logMessages.push(`${existing ? 'Updated' : 'Created'} prompt template: ${saved.name}`)
      }

      for (const selector of blueprint.selectors) {
        const targetAttribute = attributeByKey.get(selector.targetAttributeKey)
        if (!targetAttribute) {
          throw new Error(`Missing semantic attribute '${selector.targetAttributeKey}' for selector '${selector.name}'.`)
        }

        const dataSource = dataSourceByName.get(selector.dataSourceName)
        if (!dataSource) {
          throw new Error(`Missing data source '${selector.dataSourceName}' for selector '${selector.name}'.`)
        }

        const existing = selectorByName.get(selector.name)
        const saved = await api.upsertSelector({
          id: existing?.id ?? null,
          tenantSlug,
          dataSourceId: dataSource.id,
          targetAttributeDefinitionId: targetAttribute.id,
          name: selector.name,
          description: selector.description,
          mappingKind: selector.mappingKind,
          expressionJson: prettyJson(selector.expression),
          explanationTemplate: selector.explanationTemplate,
          validationSchemaJson: prettyJson(selector.validationSchema),
          defaultConfidence: selector.defaultConfidence,
          freshnessWindowMinutes: selector.freshnessWindowMinutes,
          priority: selector.priority,
          scheduleIntervalMinutes: selector.scheduleIntervalMinutes ?? null,
        })
        selectorByName.set(saved.name, saved)
        logMessages.push(`${existing ? 'Updated' : 'Created'} selector: ${saved.name}`)

        if (selector.publish) {
          await api.publishSelector({
            tenantSlug,
            selectorDefinitionId: saved.id,
          })
          logMessages.push(`Published selector: ${saved.name}`)
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dataSources', tenantSlug] }),
        queryClient.invalidateQueries({ queryKey: ['semanticAttributes', tenantSlug] }),
        queryClient.invalidateQueries({ queryKey: ['selectors', tenantSlug] }),
        queryClient.invalidateQueries({ queryKey: ['promptTemplates', tenantSlug] }),
      ])

      return logMessages
    },
    onSuccess: (messages) => {
      setImportMessages(messages)
    },
    onError: (error) => {
      setImportMessages([
        `Import failed: ${error instanceof Error ? error.message : 'Unknown import error.'}`,
      ])
    },
  })

  if (!session) {
    return null
  }

  const stats = blueprint
    ? [
        { label: 'Input artifacts', value: String(blueprint.sourceArtifacts.length), footnote: 'Files or exports uploaded into Codex or Claude.', accent: 'copper' as const },
        { label: 'Data sources', value: String(blueprint.dataSources.length), footnote: 'Operational systems that will feed the UCL.', accent: 'sage' as const },
        { label: 'Semantic attributes', value: String(blueprint.semanticAttributes.length), footnote: 'Canonical business facts the product can now depend on.', accent: 'gold' as const },
        { label: 'Selectors', value: String(blueprint.selectors.length), footnote: 'Governed mappings that turn operational signals into meaning.', accent: 'copper' as const },
      ]
    : []

  return (
    <div className="grid gap-8">
      <PageHeader
        eyebrow="AI-assisted onboarding"
        title="Use Codex or Claude to draft your first context layer"
        description="Give an AI tool your schemas, CRM exports, usage logs, and KPI notes, then import its ContextLayerBlueprint so teams can review and govern the generated model."
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => downloadTextFile('context-layer-bootstrap-prompt.txt', codexBootstrapPrompt, 'text/plain')}
            >
              <Download className="size-4" />
              Download prompt
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => downloadTextFile('northstar-context-layer-blueprint.json', prettyJson(sampleBlueprint), 'application/json')}
            >
              <FileUp className="size-4" />
              Download sample blueprint
            </Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {stats.map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} footnote={item.footnote} accent={item.accent} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.94fr_1.06fr]">
        <Panel eyebrow="Step 1" title="Upload these source artifacts into Codex or Claude">
          <div className="grid gap-3">
            {bootstrapArtifacts.map((artifact) => (
              <Card key={artifact.label} className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <DatabaseZap className="mt-1 size-5 text-copper-700" />
                  <div>
                    <p className="font-semibold text-ink-950">{artifact.label}</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">{artifact.purpose}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink-500">Example: {artifact.example}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Panel>

        <Panel
          eyebrow="Step 2"
          title="Use this exact prompt to generate the import file"
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(codexBootstrapPrompt)
                setClipboardMessage('Prompt copied to clipboard.')
                window.setTimeout(() => setClipboardMessage(null), 2500)
              }}
            >
              <Copy className="size-4" />
              Copy prompt
            </Button>
          }
        >
          <Card className="bg-ink-950 text-ivory-50">
            <div className="flex items-start gap-3">
              <Bot className="mt-1 size-5 text-copper-300" />
              <div>
                <p className="font-semibold text-ivory-50">Prompt for Codex or Claude</p>
                <p className="mt-2 text-sm leading-7 text-ivory-200">
                  This tells the model to inspect source-system evidence, design a governed semantic blueprint, and return one import-ready JSON file instead of prose.
                </p>
              </div>
            </div>
            <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words text-sm leading-7 text-ivory-100">
              {codexBootstrapPrompt}
            </pre>
          </Card>
          {clipboardMessage ? (
            <Badge tone="success">{clipboardMessage}</Badge>
          ) : null}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.04fr_0.96fr]">
        <Panel
          eyebrow="Step 3"
          title="Upload the generated ContextLayerBlueprint into this workspace"
          action={
            blueprint ? (
              <Badge tone="success">Blueprint valid</Badge>
            ) : (
              <Badge tone="warning">Blueprint needs attention</Badge>
            )
          }
        >
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setBlueprintText(prettyJson(sampleBlueprint))
                  setImportMessages([])
                }}
              >
                <Sparkles className="size-4" />
                Load seeded example
              </Button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-ink-900/10 bg-ivory-50 px-4 py-2.5 text-sm font-semibold text-ink-950 transition hover:bg-ivory-100">
                <Upload className="size-4" />
                Upload blueprint JSON
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) {
                      return
                    }

                    setBlueprintText(await file.text())
                    setImportMessages([])
                  }}
                />
              </label>
            </div>

            <Textarea
              value={blueprintText}
              onChange={(event) => {
                setBlueprintText(event.target.value)
                setImportMessages([])
              }}
              className="min-h-[320px] font-mono text-xs leading-6"
            />

            {blueprint && blueprint.tenantSlug !== tenantSlug ? (
              <Card className="border-gold-500/30 bg-gold-500/10">
                <p className="font-semibold text-ink-950">Workspace safety note</p>
                <p className="mt-2 text-sm leading-7 text-ink-700">
                  This file was drafted for tenant <strong>{blueprint.tenantSlug}</strong>, but imports always apply to the currently signed-in workspace <strong>{tenantSlug}</strong>.
                </p>
              </Card>
            ) : null}

            {validationIssues.length > 0 ? (
              <Card className="border-rosewood-500/30 bg-rosewood-500/8">
                <p className="font-semibold text-rosewood-800">Validation issues</p>
                <div className="mt-3 grid gap-2 text-sm text-rosewood-800">
                  {validationIssues.map((issue) => (
                    <p key={issue}>{issue}</p>
                  ))}
                </div>
              </Card>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => importMutation.mutate()}
                disabled={!blueprint || importMutation.isPending}
              >
                <WandSparkles className="size-4" />
                {importMutation.isPending ? 'Importing blueprint…' : 'Import blueprint into this workspace'}
              </Button>
            </div>
          </div>
        </Panel>

        <Panel eyebrow="Step 4" title="Import plan and governance posture">
          {blueprint && importPlan ? (
            <div className="grid gap-3">
              <Card className="bg-ink-950 text-ivory-50">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 size-5 text-copper-300" />
                  <div>
                    <p className="font-semibold text-ivory-50">How this stays governed</p>
                    <p className="mt-2 text-sm leading-7 text-ivory-200">
                      The blueprint imports into the current tenant only, resolves sources and attributes deterministically, and still requires humans to review the resulting selectors and prompts before wider rollout.
                    </p>
                  </div>
                </div>
              </Card>
              <div className="grid gap-3 md:grid-cols-2">
                <Card className="bg-ivory-25">
                  <p className="font-semibold text-ink-950">Data sources</p>
                  <p className="mt-2 text-sm text-ink-700">
                    {importPlan.newSources} new, {importPlan.updatedSources} updated
                  </p>
                </Card>
                <Card className="bg-ivory-25">
                  <p className="font-semibold text-ink-950">Semantic attributes</p>
                  <p className="mt-2 text-sm text-ink-700">
                    {importPlan.newAttributes} new, {importPlan.updatedAttributes} updated
                  </p>
                </Card>
                <Card className="bg-ivory-25">
                  <p className="font-semibold text-ink-950">Selectors</p>
                  <p className="mt-2 text-sm text-ink-700">
                    {importPlan.newSelectors} new, {importPlan.updatedSelectors} updated
                  </p>
                </Card>
                <Card className="bg-ivory-25">
                  <p className="font-semibold text-ink-950">Prompt templates</p>
                  <p className="mt-2 text-sm text-ink-700">
                    {importPlan.newPromptTemplates} new, {importPlan.updatedPromptTemplates} updated
                  </p>
                </Card>
              </div>
              <Card className="bg-ivory-25">
                <p className="text-xs uppercase tracking-[0.18em] text-sage-700">Rollout notes</p>
                <div className="mt-3 grid gap-2 text-sm text-ink-700">
                  {blueprint.rolloutNotes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <EmptyState
              title="Load a blueprint"
              body="Paste or upload a valid ContextLayerBlueprint JSON file to see the import plan before you apply it."
            />
          )}
        </Panel>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.98fr_1.02fr]">
        <Panel eyebrow="Blueprint preview" title="What Codex or Claude should return">
          {blueprint ? (
            <JsonViewer value={blueprint} title="ContextLayerBlueprint JSON" height="h-[420px]" />
          ) : (
            <EmptyState
              title="Blueprint preview unavailable"
              body="Fix the validation issues above to preview the generated import file."
            />
          )}
        </Panel>

        <Panel eyebrow="Import result" title="What Context Layer did with the uploaded file">
          {importMessages.length > 0 ? (
            <div className="grid gap-3">
              {importMessages.map((message, index) => (
                <Card
                  key={`${message}-${index}`}
                  className={message.startsWith('Import failed:') ? 'bg-rosewood-500/8' : 'bg-ivory-25'}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className={`mt-1 size-5 ${message.startsWith('Import failed:') ? 'text-rosewood-800' : 'text-sage-700'}`}
                    />
                    <p className={`text-sm leading-7 ${message.startsWith('Import failed:') ? 'text-rosewood-800' : 'text-ink-800'}`}>{message}</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              <Card className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <FileCog className="mt-1 size-5 text-copper-700" />
                  <div>
                    <p className="font-semibold text-ink-950">This is now a real import surface</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      Upload a JSON blueprint produced by Codex or Claude and Context Layer will upsert data sources, semantic attributes, selectors, and prompt templates into the current tenant.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="bg-ivory-25">
                <div className="flex items-start gap-3">
                  <Bot className="mt-1 size-5 text-sage-700" />
                  <div>
                    <p className="font-semibold text-ink-950">Why this helps the demo</p>
                    <p className="mt-2 text-sm leading-7 text-ink-700">
                      You can now show both the executive story and the operational path for buyers who want to use their own databases, CRMs, and warehouse models with the product.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </Panel>
      </section>
    </div>
  )
}
