import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow'
import { NodeOperationError } from 'n8n-workflow'

import { validateBaseUrl } from '../validation/url.js'
import { mapSourceEvent } from './sourceEventMapper.js'
import { redactSensitiveKeys } from '../validation/redaction.js'

/**
 * KynticAI Scout community node for n8n.
 *
 * Ingests source-system events into the Scout semantic layer with
 * field-level validation, identifier checks, and sensitive-key
 * redaction.  No credentials, API keys, bearer tokens, cookies,
 * private keys, or raw customer payloads are ever logged.
 */
export class KynticAiScout implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'KynticAI Scout',
    name: 'kynticAiScout',
    icon: 'file:kynticai.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Ingest source-system events into the KynticAI Scout semantic layer.',
    defaults: {
      name: 'KynticAI Scout',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'kynticAiScoutApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Ingest Source Event',
            value: 'ingestSourceEvent',
            description: 'Send a source-system event to Scout for semantic processing',
            action: 'Ingest a source system event',
          },
        ],
        default: 'ingestSourceEvent',
      },
      {
        displayName: 'Tenant Slug',
        name: 'tenantSlug',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'demo',
        description: 'KynticAI Scout tenant identifier (lower-case slug).',
      },
      {
        displayName: 'Workspace Slug',
        name: 'workspaceSlug',
        type: 'string',
        default: '',
        placeholder: 'default',
        description: 'Optional workspace within the tenant.',
      },
      {
        displayName: 'Source System',
        name: 'sourceSystem',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'crm',
        description: 'Name of the originating system (e.g. "crm", "product", "web").',
      },
      {
        displayName: 'Event Type',
        name: 'eventType',
        type: 'string',
        required: true,
        default: '',
        placeholder: 'source.crm.deal_updated',
        description: 'Event type URN for the source event.',
      },
      {
        displayName: 'External User ID',
        name: 'externalUserId',
        type: 'string',
        default: '',
        description: 'External user identifier the event relates to.',
      },
      {
        displayName: 'External Account ID',
        name: 'externalAccountId',
        type: 'string',
        default: '',
        description: 'External account identifier the event relates to.',
      },
      {
        displayName: 'Payload (JSON)',
        name: 'payloadJson',
        type: 'json',
        default: '{}',
        description: 'Structured event payload as JSON. Sensitive keys are redacted from logs.',
      },
      {
        displayName: 'Mapping Fields',
        name: 'mappingFields',
        type: 'string',
        default: '',
        description: 'Comma-separated list of target mapping field names to validate before ingestion.',
      },
    ],
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData()
    const results: INodeExecutionData[] = []

    const credentials = await this.getCredentials('kynticAiScoutApi')
    const baseUrlRaw = credentials['baseUrl'] as string
    const urlCheck = validateBaseUrl(baseUrlRaw)
    if (!urlCheck.valid) {
      throw new NodeOperationError(this.getNode(), `Invalid base URL: ${urlCheck.error}`)
    }
    const baseUrl = urlCheck.sanitised!

    for (let i = 0; i < items.length; i++) {
      try {
        const tenantSlug = this.getNodeParameter('tenantSlug', i) as string
        const workspaceSlug = (this.getNodeParameter('workspaceSlug', i) as string) || undefined
        const sourceSystem = this.getNodeParameter('sourceSystem', i) as string
        const eventType = this.getNodeParameter('eventType', i) as string
        const externalUserId = (this.getNodeParameter('externalUserId', i) as string) || undefined
        const externalAccountId = (this.getNodeParameter('externalAccountId', i) as string) || undefined
        const payloadJsonRaw = this.getNodeParameter('payloadJson', i) as string
        const mappingFieldsRaw = (this.getNodeParameter('mappingFields', i) as string) || ''

        let payload: Record<string, unknown> | undefined
        if (payloadJsonRaw && payloadJsonRaw.trim() !== '' && payloadJsonRaw.trim() !== '{}') {
          payload = JSON.parse(payloadJsonRaw) as Record<string, unknown>
        }

        const mappingFields = mappingFieldsRaw
          .split(',')
          .map((f) => f.trim())
          .filter((f) => f.length > 0)

        const mapped = mapSourceEvent({
          tenantSlug,
          workspaceSlug,
          sourceSystem,
          eventType,
          externalUserId,
          externalAccountId,
          payload,
          mappingFields: mappingFields.length > 0 ? mappingFields : undefined,
        })

        if (!mapped.ok) {
          throw new NodeOperationError(this.getNode(), mapped.error ?? 'Validation failed.', {
            itemIndex: i,
          })
        }

        const response = await this.helpers.httpRequestWithAuthentication.call(
          this,
          'kynticAiScoutApi',
          {
            method: 'POST',
            url: `${baseUrl}/api/tenants/${encodeURIComponent(tenantSlug)}/events/source`,
            body: mapped.payload,
            json: true,
          },
        )

        results.push({
          json: {
            success: true,
            ...(response as Record<string, unknown>),
            _redactedInput: mapped.redactedPayload as Record<string, unknown>,
          },
        })
      } catch (error) {
        if (this.continueOnFail()) {
          const safeError = error instanceof Error ? error.message : String(error)
          results.push({
            json: {
              success: false,
              error: safeError,
              _redactedInput: redactSensitiveKeys({
                tenantSlug: this.getNodeParameter('tenantSlug', i),
              }) as Record<string, unknown>,
            },
          })
        } else {
          throw error
        }
      }
    }

    return [results]
  }
}
