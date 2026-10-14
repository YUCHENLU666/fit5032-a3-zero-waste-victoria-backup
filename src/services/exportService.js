import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'


// ======================================================
// File name helper
// ======================================================

function createSafeFilename(
  title,
) {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}


// ======================================================
// Download Blob
// ======================================================

function downloadBlob(
  blob,
  filename,
) {
  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url
  link.download = filename

  document.body.appendChild(
    link,
  )

  link.click()

  document.body.removeChild(
    link,
  )

  URL.revokeObjectURL(url)
}


// ======================================================
// CSV escaping
// ======================================================
//
// CSV values containing:
// - commas
// - quotation marks
// - new lines
//
// must be wrapped in quotation marks.
//
// Existing quotation marks are escaped as "".
// ======================================================

function escapeCsvValue(
  value,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return ''
  }

  const text =
    String(value)

  const escapedText =
    text.replace(
      /"/g,
      '""',
    )

  if (
    /[",\n\r]/.test(
      escapedText,
    )
  ) {
    return `"${escapedText}"`
  }

  return escapedText
}


// ======================================================
// Export table to CSV
// ======================================================

export function exportTableToCsv({
  title,
  headers,
  rows,
}) {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    throw new Error(
      'There is no data available to export.',
    )
  }

  const headerRow =
    headers
      .map(
        escapeCsvValue,
      )
      .join(',')

  const dataRows =
    rows.map(
      (row) =>
        row
          .map(
            escapeCsvValue,
          )
          .join(','),
    )

  const csvContent =
    [
      headerRow,
      ...dataRows,
    ].join('\r\n')


  // UTF-8 BOM improves compatibility
  // when opening CSV files in Excel.
  const utf8Bom =
    '\uFEFF'

  const blob =
    new Blob(
      [
        utf8Bom,
        csvContent,
      ],
      {
        type:
          'text/csv;charset=utf-8;',
      },
    )


  const filename =
    `${createSafeFilename(
      title,
    )}.csv`

  downloadBlob(
    blob,
    filename,
  )
}


// ======================================================
// Export table to PDF
// ======================================================

export function exportTableToPdf({
  title,
  headers,
  rows,
}) {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    throw new Error(
      'There is no data available to export.',
    )
  }


  // Landscape works better
  // for tables with many columns.
  const document =
    new jsPDF({
      orientation:
        'landscape',

      unit:
        'mm',

      format:
        'a4',
    })


  // --------------------------------------------------
  // Document title
  // --------------------------------------------------

  document.setFontSize(
    18,
  )

  document.text(
    title,
    14,
    16,
  )


  // --------------------------------------------------
  // Metadata
  // --------------------------------------------------

  document.setFontSize(
    9,
  )

  document.setTextColor(
    100,
  )

  const generatedAt =
    new Intl.DateTimeFormat(
      'en-AU',
      {
        dateStyle:
          'medium',

        timeStyle:
          'short',
      },
    ).format(
      new Date(),
    )

  document.text(
    `Generated: ${generatedAt}`,
    14,
    23,
  )

  document.text(
    `Records exported: ${rows.length}`,
    14,
    28,
  )


  // --------------------------------------------------
  // Data table
  // --------------------------------------------------

  autoTable(
    document,
    {
      startY: 34,

      head: [
        headers,
      ],

      body:
        rows,

      theme:
        'grid',

      styles: {
        fontSize: 8,

        cellPadding: 2,

        overflow:
          'linebreak',

        valign:
          'middle',
      },

      headStyles: {
        fillColor: [
          25,
          135,
          84,
        ],

        textColor: [
          255,
          255,
          255,
        ],

        fontStyle:
          'bold',
      },

      alternateRowStyles: {
        fillColor: [
          248,
          249,
          250,
        ],
      },

      margin: {
        left: 10,
        right: 10,
      },

      didDrawPage: (
        data,
      ) => {
        const pageCount =
          document.internal
            .getNumberOfPages()

        const pageWidth =
          document.internal
            .pageSize
            .getWidth()

        const pageHeight =
          document.internal
            .pageSize
            .getHeight()

        document.setFontSize(
          8,
        )

        document.setTextColor(
          120,
        )

        document.text(
          `ZWV Circular Hub · Page ${pageCount}`,
          pageWidth - 10,
          pageHeight - 6,
          {
            align:
              'right',
          },
        )
      },
    },
  )


  const filename =
    `${createSafeFilename(
      title,
    )}.pdf`

  document.save(
    filename,
  )
}