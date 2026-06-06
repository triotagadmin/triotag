import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string | ((data: any) => string)
}

import { template as otpVerification } from './otp-verification.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'otp-verification': otpVerification,
}
