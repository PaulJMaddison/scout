export const pilotContactEmail =
  import.meta.env.VITE_PILOT_CONTACT_EMAIL?.trim() || 'hello@universalcontextlayer.com'

export const pilotLeadEndpoint =
  import.meta.env.VITE_PILOT_LEAD_ENDPOINT?.trim() || ''

export const turnstileSiteKey =
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || ''

export const siteOperatorName =
  import.meta.env.VITE_SITE_OPERATOR_NAME?.trim() || 'Paul Maddison, for the Universal Context Layer project'

export const siteOperatorLocation =
  import.meta.env.VITE_SITE_OPERATOR_LOCATION?.trim() || 'United Kingdom'
