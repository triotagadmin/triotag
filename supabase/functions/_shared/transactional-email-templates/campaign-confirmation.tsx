import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  campaignName?: string
  campaignType?: string
  location?: string
  startDate?: string
  endDate?: string
  budgetDisplay?: string
  subscribeUrl?: string
}

const Email = ({
  campaignName = 'Your Campaign',
  campaignType = 'OOH',
  location = '—',
  startDate = '?',
  endDate = '?',
  budgetDisplay = 'Flexible',
  subscribeUrl = '#',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your TrioTag campaign is live — confirm subscription</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Campaign Request is Live! 🎉</Heading>
        <Text style={text}>
          Your campaign has been posted on the TrioTag Marketplace. To receive proposal notifications at this email,
          click the button below to confirm your subscription.
        </Text>
        <Section style={details}>
          <Text style={row}><strong>Campaign:</strong> {campaignName}</Text>
          <Text style={row}><strong>Type:</strong> {campaignType}</Text>
          <Text style={row}><strong>Location:</strong> {location}</Text>
          <Text style={row}><strong>Dates:</strong> {startDate} → {endDate}</Text>
          <Text style={row}><strong>Budget:</strong> {budgetDisplay}</Text>
        </Section>
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={subscribeUrl} style={btn}>✓ Subscribe to Proposals</Button>
        </Section>
        <Text style={muted}>
          Once subscribed, you'll receive an email every time a retailer or ad space owner submits a proposal on your campaign.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          TrioTag · Micro Advertising · <Link href="https://triotag.com/campaigns" style={{ color: '#16a34a' }}>View Marketplace</Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Your Campaign is Live — Confirm your listing subscription',
  displayName: 'Campaign Confirmation',
  previewData: {
    campaignName: 'Sample Campaign',
    campaignType: 'OOH',
    location: 'Makati',
    startDate: '2026-06-10',
    endDate: '2026-06-30',
    budgetDisplay: '₱25,000',
    subscribeUrl: 'https://example.com',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px', maxWidth: '600px', margin: '0 auto', color: '#111' }
const h1 = { color: '#16a34a', fontSize: '22px', marginBottom: '12px' }
const text = { color: '#333', fontSize: '15px', lineHeight: '1.5' }
const details = { background: '#f5f5f5', padding: '16px', borderRadius: '8px', margin: '16px 0' }
const row = { margin: '4px 0', fontSize: '14px' }
const btn = { background: '#16a34a', color: '#fff', padding: '14px 28px', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }
const muted = { color: '#555', fontSize: '13px' }
const hr = { border: 'none', borderTop: '1px solid #eee', margin: '24px 0' }
const footer = { color: '#888', fontSize: '12px' }
