import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  campaignName?: string
  proposerName?: string
  proposerEmail?: string
  proposerVenue?: string
  proposerMessage?: string
}

const Email = ({
  campaignName = 'Your Campaign',
  proposerName = '',
  proposerEmail = '',
  proposerVenue = '',
  proposerMessage = '',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New proposal on {campaignName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You received a proposal! 📬</Heading>
        <Text style={text}>
          Someone submitted a proposal on your campaign <strong>{campaignName}</strong>.
        </Text>
        <Section style={details}>
          <Text style={row}><strong>From:</strong> {proposerName}</Text>
          <Text style={row}><strong>Email:</strong> {proposerEmail}</Text>
          {proposerVenue ? <Text style={row}><strong>Venue/Space:</strong> {proposerVenue}</Text> : null}
          {proposerMessage ? <Text style={row}><strong>Message:</strong> {proposerMessage}</Text> : null}
        </Section>
        <Text style={text}>
          Reply directly to <Link href={`mailto:${proposerEmail}`} style={{ color: '#16a34a' }}>{proposerEmail}</Link> to respond.
        </Text>
        <Text style={text}>
          <Link href="https://triotag.com/campaigns" style={{ color: '#16a34a' }}>View Marketplace</Link>
        </Text>
        <Hr style={hr} />
        <Text style={footer}>TrioTag · Micro Advertising · www.triotag.com</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Props) => `New Proposal on Your Campaign — ${data?.campaignName ?? ''}`,
  displayName: 'Proposal Received',
  previewData: {
    campaignName: 'Sample Campaign',
    proposerName: 'Jane Doe',
    proposerEmail: 'jane@example.com',
    proposerVenue: 'Cafe in BGC',
    proposerMessage: 'We have great foot traffic and would love to host your campaign.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px', margin: '0 auto', color: '#111' }
const h1 = { color: '#16a34a', fontSize: '22px', marginBottom: '12px' }
const text = { color: '#333', fontSize: '15px', lineHeight: '1.5' }
const details = { background: '#f5f5f5', padding: '16px', borderRadius: '8px', margin: '16px 0' }
const row = { margin: '4px 0', fontSize: '14px' }
const hr = { border: 'none', borderTop: '1px solid #eee', margin: '24px 0' }
const footer = { color: '#888', fontSize: '12px' }
