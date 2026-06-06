import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string | ((data: any) => string)
}

import { template as otpVerification } from './otp-verification.tsx'
import { template as campaignConfirmation } from './campaign-confirmation.tsx'
import { template as proposalReceived } from './proposal-received.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'otp-verification': otpVerification,
  'campaign-confirmation': campaignConfirmation,
  'proposal-received': proposalReceived,
}
