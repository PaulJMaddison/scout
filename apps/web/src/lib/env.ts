const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const apiBaseUrl =
  configuredApiBaseUrl === undefined || configuredApiBaseUrl.length === 0
    ? 'http://localhost:5198'
    : configuredApiBaseUrl
const configuredGraphqlEndpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT?.trim()
const env = {
  apiBaseUrl,
  graphqlEndpoint:
    configuredGraphqlEndpoint === undefined || configuredGraphqlEndpoint.length === 0
      ? apiBaseUrl
        ? `${apiBaseUrl}/graphql`
        : '/graphql'
      : configuredGraphqlEndpoint,
  demoFallbackEnabled:
    import.meta.env.VITE_DEMO_FALLBACK === undefined
      ? true
      : import.meta.env.VITE_DEMO_FALLBACK === 'true',
}

export { env }
