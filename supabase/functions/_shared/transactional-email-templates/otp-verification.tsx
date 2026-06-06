import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  code?: string
}

const Email = ({ code = '000000' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your TrioTag verification code: {code}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>TrioTag Verification</Heading>
        <Text style={text}>
          Your 6-digit verification code for campaign submission:
        </Text>
        <Section style={codeBox}>
          <Text style={codeText}>{code}</Text>
        </Section>
        <Text style={muted}>
          This code expires in 10 minutes. If you didn't request it, ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Props) => `Your TrioTag code: ${data?.code ?? ''}`,
  displayName: 'OTP Verification',
  previewData: { code: '123456' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '480px', margin: '0 auto' }
const h1 = { color: '#111', fontSize: '22px', marginBottom: '12px' }
const text = { color: '#333', fontSize: '15px' }
const codeBox = {
  background: '#f4f4f5',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
  textAlign: 'center' as const,
}
const codeText = {
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  margin: 0,
}
const muted = { color: '#666', fontSize: '13px' }
