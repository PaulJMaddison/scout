import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow'

/**
 * KynticAI Scout API credential for the n8n community node.
 *
 * Accepts the Scout base URL and a bearer API key.  The credential
 * test issues a lightweight health-check request to confirm
 * connectivity without transmitting sensitive payloads.
 */
export class KynticAiScoutApi implements ICredentialType {
  name = 'kynticAiScoutApi'
  displayName = 'KynticAI Scout API'
  documentationUrl = 'https://github.com/PaulJMaddison/scout'

  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: '',
      placeholder: 'https://scout.example.com',
      description: 'Root URL of the KynticAI Scout API (https only in production). Must not contain query strings, fragments, or embedded credentials.',
      required: true,
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'Bearer token or machine-to-machine API key for KynticAI Scout.',
      required: true,
    },
  ]

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  }

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.baseUrl}}',
      url: '/health/live',
      method: 'GET',
    },
  }
}
