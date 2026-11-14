import fs from 'fs'
import path from 'path'

import {
  Document,
  Font,
  Image,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

import type { EventRequest } from '../../payload-types'
import { requestNotes, summaryRows } from './summary'

// Booking Summary PDF, laid out like the one the old site sent: centred logo, title,
// two-column table with shaded labels, then "Pricing & Notes".

// Never hyphenate (it would split emails and names across lines).
Font.registerHyphenationCallback((word) => [word])

const logo = () => fs.readFileSync(path.join(process.cwd(), 'src/assets/logo-dark.png'))

const s = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 44,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#333333',
  },
  logo: { width: 180, alignSelf: 'center', marginBottom: 24 },
  title: { fontFamily: 'Helvetica-Bold', fontSize: 18, color: '#111827', marginBottom: 8 },
  rule: { borderBottomWidth: 2, borderBottomColor: '#eeeeee', marginBottom: 14 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  label: {
    width: '34%',
    backgroundColor: '#f7f8fa',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#333333',
  },
  value: { width: '66%', padding: 8 },
  notesTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },
  bullet: { flexDirection: 'row', marginBottom: 4 },
  dot: { width: 12 },
  bulletText: { flex: 1 },
  bold: { fontFamily: 'Helvetica-Bold' },
  small: { marginTop: 10, fontSize: 8.5, color: '#6b7280' },
  footer: {
    position: 'absolute',
    bottom: 22,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 6,
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'right',
  },
})

function Note({ text }: { text: string }) {
  const i = text.indexOf(':')
  return (
    <View style={s.bullet}>
      <Text style={s.dot}>•</Text>
      <Text style={s.bulletText}>
        {i > 0 ? (
          <>
            <Text style={s.bold}>{text.slice(0, i + 1)}</Text>
            {text.slice(i + 1)}
          </>
        ) : (
          text
        )}
      </Text>
    </View>
  )
}

function BookingSummary({ request }: { request: EventRequest }) {
  const notes = requestNotes(request)
  return (
    <Document title={`Booking Summary Request #${request.requestNumber}`} author="La Veranda">
      <Page size="A4" style={s.page}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf images have no alt text */}
        <Image src={logo()} style={s.logo} />
        <Text style={s.title}>Booking Summary Request #{request.requestNumber}</Text>
        <View style={s.rule} />
        {summaryRows(request).map((row) => (
          <View key={row.label} style={s.row} wrap={false}>
            <Text style={s.label}>{row.label}</Text>
            <Text style={s.value}>{row.value}</Text>
          </View>
        ))}
        {notes.length > 0 && (
          <View wrap={false}>
            <Text style={s.notesTitle}>Pricing &amp; Notes</Text>
            {notes.map((n) => (
              <Note key={n} text={n} />
            ))}
            <Text style={s.small}>
              Note: Exact totals depend on final guest counts, menu selections, and duration.
            </Text>
          </View>
        )}
        <Text
          style={s.footer}
          fixed
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        />
      </Page>
    </Document>
  )
}

export async function renderBookingPdf(request: EventRequest) {
  return renderToBuffer(<BookingSummary request={request} />)
}

export const pdfFilename = (request: EventRequest) => `Booking-Summary-${request.requestNumber}.pdf`
