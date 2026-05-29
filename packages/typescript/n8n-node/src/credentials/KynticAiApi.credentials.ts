import type { ICredentialType, INodeProperties } from 'n8n-workflow'

export class KynticAiApi implements ICredentialType {
  name = 'kynticAiApi'

  displayName = 'KynticAI Scout API'

  documentationUrl = 'https://github.com/PaulJMaddison/scout'

  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'http://127.0.0.1:5198',
      required: true,
      placeholder: 'https://scout.example.internal',
      description: 'Base URL for the KynticAI Scout API.',
    },
    {
      displayName: 'API Client ID',
      name: 'apiClientId',
      type: 'string',
      default: '',
      required: true,
      description: 'Machine API client identifier with the events:ingest scope.',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Machine API key. The value is only sent to the configured Scout API endpoint.',
    },
  ]
}
