import type {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  IHttpRequestOptions,
} from 'n8n-workflow'
import { NodeConnectionTypes } from 'n8n-workflow'

import { buildEventUrl, buildScoutEvent } from './eventMapper'

interface KynticAiCredentials {
  baseUrl: string
  apiClientId: string
  apiKey: string
}

export class KynticAi implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'KynticAI Scout',
    name: 'kynticAi',
    group: ['output'],
    version: 1,
    subtitle: '={{$parameter["eventType"]}}',
    description: 'Send provider-neutral source-system events to KynticAI Scout.',
    defaults: {
      name: 'KynticAI Scout',
    },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [
      {
        name: 'kynticAiApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Tenant Slug',
        name: 'tenantSlug',
        type: 'string',
        default: 'demo',
        required: true,
        description: 'KynticAI Scout tenant slug that should receive the event.',
      },
      {
        displayName: 'Workspace Slug',
        name: 'workspaceSlug',
        type: 'string',
        default: 'primary',
        description: 'Optional workspace slug. Leave blank to let Scout route to the default workspace.',
      },
      {
        displayName: 'Source System',
        name: 'sourceSystem',
        type: 'string',
        default: 'n8n',
        required: true,
        description: 'Provider-neutral source-system name stored with the event.',
      },
      {
        displayName: 'Event Type',
        name: 'eventType',
        type: 'string',
        default: 'source.n8n.event_received',
        required: true,
        description: 'Provider-neutral event type sent to Scout.',
      },
      {
        displayName: 'Event ID Field',
        name: 'eventIdField',
        type: 'string',
        default: '',
        description: 'Optional input item field containing a caller-assigned idempotency key.',
      },
      {
        displayName: 'External User ID Field',
        name: 'externalUserIdField',
        type: 'string',
        default: '',
        description: 'Optional input item field containing the external user identifier.',
      },
      {
        displayName: 'External Account ID Field',
        name: 'externalAccountIdField',
        type: 'string',
        default: '',
        description: 'Optional input item field containing the external account identifier.',
      },
      {
        displayName: 'Observed At Field',
        name: 'observedAtField',
        type: 'string',
        default: '',
        description: 'Optional input item field containing an ISO 8601 timestamp.',
      },
      {
        displayName: 'Include n8n Metadata',
        name: 'includeN8nMetadata',
        type: 'boolean',
        default: true,
        description: 'Whether to include n8n workflow and execution identifiers in the event payload metadata.',
      },
    ],
  }

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData()
    const credentials = (await this.getCredentials('kynticAiApi')) as unknown as KynticAiCredentials
    const tenantSlug = this.getNodeParameter('tenantSlug', 0) as string
    const workspaceSlug = this.getNodeParameter('workspaceSlug', 0, '') as string
    const sourceSystem = this.getNodeParameter('sourceSystem', 0) as string
    const eventType = this.getNodeParameter('eventType', 0) as string
    const eventIdField = this.getNodeParameter('eventIdField', 0, '') as string
    const externalUserIdField = this.getNodeParameter('externalUserIdField', 0, '') as string
    const externalAccountIdField = this.getNodeParameter('externalAccountIdField', 0, '') as string
    const observedAtField = this.getNodeParameter('observedAtField', 0, '') as string
    const includeN8nMetadata = this.getNodeParameter('includeN8nMetadata', 0, true) as boolean
    const returnData: INodeExecutionData[] = []

    for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
      const item = items[itemIndex]
      const event = buildScoutEvent(item.json, itemIndex, {
        eventIdField,
        workspaceSlug,
        sourceSystem,
        eventType,
        externalUserIdField,
        externalAccountIdField,
        observedAtField,
        includeN8nMetadata,
        workflowId: this.getWorkflow().id,
        executionId: this.getExecutionId(),
      })

      const requestOptions: IHttpRequestOptions = {
        method: 'POST',
        url: buildEventUrl(credentials.baseUrl, tenantSlug),
        headers: {
          'Content-Type': 'application/json',
          'X-API-Client-Id': credentials.apiClientId,
          'X-API-Key': credentials.apiKey,
        },
        body: event,
        json: true,
      }

      const response = await this.helpers.httpRequest(requestOptions)
      returnData.push({
        json: {
          eventId: event.eventId,
          tenantSlug,
          sourceSystem,
          eventType,
          accepted: response,
        },
        pairedItem: { item: itemIndex },
      })
    }

    return [returnData]
  }
}
