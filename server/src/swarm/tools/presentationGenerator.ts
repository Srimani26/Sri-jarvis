/**
 * presentationGenerator.ts — Sovereign Automated PowerPoint Presentation Generator
 * Target: server/src/swarm/tools/presentationGenerator.ts & src/swarm/tools/presentationGenerator.ts
 *
 * Implements:
 * 1. generate_presentation(fileName, title, slides) using pptxgenjs.
 * 2. Dark slate theme (#0F172A), accent cyan (#06B6D4), secondary accent (#38BDF8),
 *    crisp typography, and visual card layouts.
 * 3. Saves deliverables directly to artifacts/documents/{fileName}.
 * 4. Exposes download link (/api/artifacts/download?file={fileName}) and preview URL.
 */

import pptxgen from 'pptxgenjs'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface SlideMetric {
  label: string
  value: string
}

export interface SlideColumn {
  heading: string
  points: string[]
}

export interface SlideDefinition {
  title: string
  subtitle?: string
  bulletPoints?: string[]
  visualLayout?: 'standard' | 'two-column' | 'hero' | 'metric-cards' | 'timeline'
  speakerNotes?: string
  metrics?: SlideMetric[]
  columns?: SlideColumn[]
}

export interface GeneratePresentationParams {
  fileName: string
  title: string
  subtitle?: string
  author?: string
  slides: SlideDefinition[]
}

export interface GeneratePresentationResult {
  success: boolean
  fileName: string
  filePath: string
  fileSizeBytes: number
  slidesCount: number
  downloadUrl: string
  previewUrl: string
  title: string
  theme: string
}

const THEME_COLORS = {
  background: '0F172A', // Dark Slate
  card: '1E293B',       // Slate 800
  cardBorder: '334155', // Slate 700
  accentCyan: '06B6D4', // Cyan 500
  accentSky: '38BDF8',  // Sky 400
  textPrimary: 'F8FAFC',// Slate 50
  textMuted: '94A3B8',  // Slate 400
  textBody: 'E2E8F0'    // Slate 200
}

/**
 * Generates an executive PPTX presentation file with a dark slate theme
 */
export async function generatePresentation(params: GeneratePresentationParams): Promise<GeneratePresentationResult> {
  const { fileName, title, subtitle, author, slides } = params

  const cleanFileName = fileName.endsWith('.pptx') ? fileName : `${fileName}.pptx`
  const docsDir = join(process.cwd(), 'artifacts', 'documents')

  if (!existsSync(docsDir)) {
    mkdirSync(docsDir, { recursive: true })
  }

  const filePath = join(docsDir, cleanFileName)
  const pres = new (pptxgen as any)()

  pres.layout = 'LAYOUT_16x9'
  pres.author = author || 'J.A.R.V.I.S. Sovereign Executive Intelligence'
  pres.company = 'Sovereign Command Core'
  pres.title = title

  // 1. Cover / Title Slide
  const titleSlide = pres.addSlide()
  titleSlide.background = { color: THEME_COLORS.background }

  // Subtle decorative banner
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.15,
    fill: { color: THEME_COLORS.accentCyan }
  })

  // Title Box
  titleSlide.addText(title, {
    x: 1.0,
    y: 2.2,
    w: 11.3,
    h: 1.8,
    fontSize: 40,
    bold: true,
    color: THEME_COLORS.accentCyan,
    fontFace: 'Arial'
  })

  // Subtitle
  const coverSub = subtitle || 'Autonomous Multi-Agent Systems & Executive Intelligence Briefing'
  titleSlide.addText(coverSub, {
    x: 1.0,
    y: 4.1,
    w: 11.3,
    h: 1.0,
    fontSize: 20,
    color: THEME_COLORS.textMuted,
    fontFace: 'Arial'
  })

  // Metadata Footer
  titleSlide.addText(`PREPARED BY: ${author || 'J.A.R.V.I.S. High Command'}  |  DATE: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, {
    x: 1.0,
    y: 6.2,
    w: 11.3,
    h: 0.5,
    fontSize: 11,
    color: THEME_COLORS.accentSky,
    bold: true,
    fontFace: 'Arial'
  })

  // 2. Iterate through Slide Definitions
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i]
    const slide = pres.addSlide()
    slide.background = { color: THEME_COLORS.background }

    // Top Header Accent Bar
    slide.addShape(pres.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 0.08,
      fill: { color: THEME_COLORS.accentCyan }
    })

    // Slide Title
    slide.addText(s.title, {
      x: 0.8,
      y: 0.45,
      w: 11.7,
      h: 0.7,
      fontSize: 24,
      bold: true,
      color: THEME_COLORS.accentCyan,
      fontFace: 'Arial'
    })

    // Slide Subtitle if present
    if (s.subtitle) {
      slide.addText(s.subtitle, {
        x: 0.8,
        y: 1.15,
        w: 11.7,
        h: 0.4,
        fontSize: 13,
        color: THEME_COLORS.textMuted,
        fontFace: 'Arial'
      })
    }

    const contentStartY = s.subtitle ? 1.65 : 1.35
    const layout = s.visualLayout || 'standard'

    if (layout === 'metric-cards' && s.metrics && s.metrics.length > 0) {
      // Metric Cards Layout
      const cardCount = Math.min(s.metrics.length, 4)
      const cardWidth = (11.7 - (cardCount - 1) * 0.3) / cardCount

      s.metrics.slice(0, cardCount).forEach((m, mIdx) => {
        const cardX = 0.8 + mIdx * (cardWidth + 0.3)

        // Card Container Shape
        slide.addShape(pres.ShapeType.roundRect, {
          x: cardX,
          y: contentStartY + 0.3,
          w: cardWidth,
          h: 3.8,
          rectRadius: 0.1,
          fill: { color: THEME_COLORS.card },
          line: { color: THEME_COLORS.cardBorder, width: 1.5 }
        })

        // Metric Value
        slide.addText(m.value, {
          x: cardX + 0.2,
          y: contentStartY + 0.8,
          w: cardWidth - 0.4,
          h: 1.2,
          fontSize: 32,
          bold: true,
          color: THEME_COLORS.accentCyan,
          align: 'center',
          fontFace: 'Arial'
        })

        // Metric Label
        slide.addText(m.label, {
          x: cardX + 0.2,
          y: contentStartY + 2.2,
          w: cardWidth - 0.4,
          h: 1.4,
          fontSize: 14,
          color: THEME_COLORS.textBody,
          align: 'center',
          fontFace: 'Arial'
        })
      })
    } else if (layout === 'two-column') {
      // Two-Column Layout
      const colWidth = 5.6
      const leftX = 0.8
      const rightX = 6.9

      // Left Column Container
      slide.addShape(pres.ShapeType.roundRect, {
        x: leftX,
        y: contentStartY,
        w: colWidth,
        h: 4.8,
        rectRadius: 0.1,
        fill: { color: THEME_COLORS.card },
        line: { color: THEME_COLORS.cardBorder, width: 1 }
      })

      // Right Column Container
      slide.addShape(pres.ShapeType.roundRect, {
        x: rightX,
        y: contentStartY,
        w: colWidth,
        h: 4.8,
        rectRadius: 0.1,
        fill: { color: THEME_COLORS.card },
        line: { color: THEME_COLORS.cardBorder, width: 1 }
      })

      const leftPoints = s.columns?.[0]?.points || (s.bulletPoints ? s.bulletPoints.slice(0, Math.ceil(s.bulletPoints.length / 2)) : [])
      const rightPoints = s.columns?.[1]?.points || (s.bulletPoints ? s.bulletPoints.slice(Math.ceil(s.bulletPoints.length / 2)) : [])

      if (s.columns?.[0]?.heading) {
        slide.addText(s.columns[0].heading, {
          x: leftX + 0.3,
          y: contentStartY + 0.3,
          w: colWidth - 0.6,
          h: 0.5,
          fontSize: 16,
          bold: true,
          color: THEME_COLORS.accentSky,
          fontFace: 'Arial'
        })
      }

      if (s.columns?.[1]?.heading) {
        slide.addText(s.columns[1].heading, {
          x: rightX + 0.3,
          y: contentStartY + 0.3,
          w: colWidth - 0.6,
          h: 0.5,
          fontSize: 16,
          bold: true,
          color: THEME_COLORS.accentSky,
          fontFace: 'Arial'
        })
      }

      const leftTextItems = leftPoints.map(p => ({
        text: p,
        options: { fontSize: 13, color: THEME_COLORS.textBody, bullet: true, breakLine: true }
      }))
      slide.addText(leftTextItems as any, {
        x: leftX + 0.4,
        y: contentStartY + (s.columns?.[0]?.heading ? 0.9 : 0.4),
        w: colWidth - 0.8,
        h: 3.6,
        fontFace: 'Arial'
      })

      const rightTextItems = rightPoints.map(p => ({
        text: p,
        options: { fontSize: 13, color: THEME_COLORS.textBody, bullet: true, breakLine: true }
      }))
      slide.addText(rightTextItems as any, {
        x: rightX + 0.4,
        y: contentStartY + (s.columns?.[1]?.heading ? 0.9 : 0.4),
        w: colWidth - 0.8,
        h: 3.6,
        fontFace: 'Arial'
      })
    } else if (layout === 'hero') {
      // Hero Callout Layout
      slide.addShape(pres.ShapeType.roundRect, {
        x: 1.5,
        y: contentStartY + 0.4,
        w: 10.3,
        h: 4.2,
        rectRadius: 0.15,
        fill: { color: THEME_COLORS.card },
        line: { color: THEME_COLORS.accentCyan, width: 2 }
      })

      const heroText = s.bulletPoints?.[0] || s.subtitle || 'Sovereign High-Level Strategic Directive'
      slide.addText(heroText, {
        x: 2.0,
        y: contentStartY + 1.2,
        w: 9.3,
        h: 2.2,
        fontSize: 26,
        bold: true,
        color: THEME_COLORS.textPrimary,
        align: 'center',
        fontFace: 'Arial'
      })
    } else {
      // Standard Executive Card Container
      slide.addShape(pres.ShapeType.roundRect, {
        x: 0.8,
        y: contentStartY,
        w: 11.7,
        h: 5.0,
        rectRadius: 0.1,
        fill: { color: THEME_COLORS.card },
        line: { color: THEME_COLORS.cardBorder, width: 1 }
      })

      const bullets = s.bulletPoints && s.bulletPoints.length > 0
        ? s.bulletPoints
        : ['Autonomous multi-agent execution pipeline active', 'Continuous verification and regression testing ensured']

      const textRows = bullets.map(b => ({
        text: `${b}\n\n`,
        options: {
          fontSize: 14,
          color: THEME_COLORS.textBody,
          bullet: { type: 'bullet', color: THEME_COLORS.accentCyan },
          fontFace: 'Arial'
        }
      }))

      slide.addText(textRows as any, {
        x: 1.2,
        y: contentStartY + 0.4,
        w: 10.9,
        h: 4.2,
        fontFace: 'Arial'
      })
    }

    // Speaker Notes
    if (s.speakerNotes) {
      slide.addNotes(s.speakerNotes)
    }

    // Slide Number & Footer
    slide.addText(`Slide ${i + 2} of ${slides.length + 1}  |  J.A.R.V.I.S. Sovereign Executive Intelligence`, {
      x: 0.8,
      y: 6.8,
      w: 11.7,
      h: 0.3,
      fontSize: 9,
      color: THEME_COLORS.textMuted,
      align: 'right',
      fontFace: 'Arial'
    })
  }

  // 3. Write PPTX Buffer to Disk
  const buffer = await pres.write({ outputType: 'nodebuffer' })
  writeFileSync(filePath, buffer)

  const downloadUrl = `/api/artifacts/download?file=${encodeURIComponent(cleanFileName)}`

  return {
    success: true,
    fileName: cleanFileName,
    filePath,
    fileSizeBytes: buffer.length,
    slidesCount: slides.length + 1,
    downloadUrl,
    previewUrl: downloadUrl,
    title,
    theme: 'Dark Slate Executive (#0F172A / #06B6D4)'
  }
}

