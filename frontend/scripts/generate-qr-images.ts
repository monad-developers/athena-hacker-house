#!/usr/bin/env tsx

import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '../lib/generated/prisma'
import { generateQRCode, generateQRCodeSVG, QRMetadata } from '../lib/qr-generator'

const prisma = new PrismaClient()

async function generatePrintableQRCodes() {
  console.log('🎨 Generating printable QR code images...')

  // Create output directories
  const outputDir = path.join(process.cwd(), 'generated-qr-codes')
  const pngDir = path.join(outputDir, 'png')
  const svgDir = path.join(outputDir, 'svg')

  await fs.mkdir(outputDir, { recursive: true })
  await fs.mkdir(pngDir, { recursive: true })
  await fs.mkdir(svgDir, { recursive: true })

  // Fetch all QR codes from database
  const qrCodes = await prisma.qRCode.findMany({
    include: {
      hint: true
    },
    orderBy: [
      { phase: 'asc' },
      { sequenceOrder: 'asc' }
    ]
  })

  if (qrCodes.length === 0) {
    console.log('❌ No QR codes found in database. Please run the seed script first.')
    return
  }

  console.log(`📱 Found ${qrCodes.length} QR codes in database`)

  const generatedCodes: Array<{
    metadata: QRMetadata
    filename: string
    phase: string
    rarity: string
  }> = []

  // Generate QR codes for each entry
  for (const qrCode of qrCodes) {
    try {
      console.log(`🖼️  Generating images for: ${qrCode.name} (${qrCode.code})`)

      // Create metadata object
      const metadata = {
        code: qrCode.code,
        name: qrCode.name,
        phase: qrCode.phase,
        sequenceOrder: qrCode.sequenceOrder,
        rarity: qrCode.rarity,
        tokenReward: qrCode.tokenReward.toString(),
        hint: qrCode.hint ? {
          title: qrCode.hint.title || qrCode.hint.content.substring(0, 30) + '...',
          content: qrCode.hint.content
        } : undefined
      }

      // Generate PNG version
      const pngDataUrl = await generateQRCode(metadata, {
        width: 2048,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // Generate SVG version
      const svgContent = await generateQRCodeSVG(metadata, {
        width: 2048,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // Create filename
      const filename = `${qrCode.code.toLowerCase()}_${qrCode.phase.toLowerCase()}_seq${qrCode.sequenceOrder.toString().padStart(2, '0')}`

      // Save PNG (extract base64 data from data URL)
      const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '')
      await fs.writeFile(
        path.join(pngDir, `${filename}.png`),
        Buffer.from(base64Data, 'base64')
      )

      // Save SVG
      await fs.writeFile(
        path.join(svgDir, `${filename}.svg`),
        svgContent
      )

      // Store metadata for HTML generation
      const fullMetadata: QRMetadata = {
        ...metadata,
        timestamp: Date.now(),
        version: '1.0'
      }

      generatedCodes.push({
        metadata: fullMetadata,
        filename,
        phase: qrCode.phase,
        rarity: qrCode.rarity
      })

      console.log(`✅ Generated: ${filename}.png and ${filename}.svg`)

    } catch (error) {
      console.error(`❌ Failed to generate QR code for ${qrCode.code}:`, error)
    }
  }

  // Generate HTML preview file
  const htmlContent = generatePreviewHTML(generatedCodes)
  await fs.writeFile(
    path.join(outputDir, 'qr-codes-preview.html'),
    htmlContent
  )

  // Generate JSON manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalCodes: generatedCodes.length,
    phases: {
      PHASE_1: generatedCodes.filter(c => c.phase === 'PHASE_1').length,
      PHASE_2: generatedCodes.filter(c => c.phase === 'PHASE_2').length,
      PHASE_3: generatedCodes.filter(c => c.phase === 'PHASE_3').length
    },
    rarities: {
      NORMAL: generatedCodes.filter(c => c.rarity === 'NORMAL').length,
      RARE: generatedCodes.filter(c => c.rarity === 'RARE').length,
      LEGENDARY: generatedCodes.filter(c => c.rarity === 'LEGENDARY').length
    },
    codes: generatedCodes.map(c => ({
      code: c.metadata.code,
      name: c.metadata.name,
      filename: c.filename,
      phase: c.phase,
      rarity: c.rarity,
      tokenReward: c.metadata.tokenReward,
      hint: c.metadata.hint
    }))
  }

  await fs.writeFile(
    path.join(outputDir, 'qr-codes-manifest.json'),
    JSON.stringify(manifest, null, 2)
  )

  console.log('\n🎉 QR Code image generation completed!')
  console.log(`📁 Output directory: ${outputDir}`)
  console.log(`🖼️  Generated ${generatedCodes.length} QR code images`)
  console.log(`📄 PNG files: ${pngDir}`)
  console.log(`🎨 SVG files: ${svgDir}`)
  console.log(`🌐 Preview: ${path.join(outputDir, 'qr-codes-preview.html')}`)
  console.log(`📋 Manifest: ${path.join(outputDir, 'qr-codes-manifest.json')}`)

  return manifest
}

function generatePreviewHTML(codes: Array<{ metadata: QRMetadata; filename: string; phase: string; rarity: string }>): string {
  const codesByPhase = {
    PHASE_1: codes.filter(c => c.phase === 'PHASE_1'),
    PHASE_2: codes.filter(c => c.phase === 'PHASE_2'),
    PHASE_3: codes.filter(c => c.phase === 'PHASE_3')
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Crunchies QR Codes</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .phase-section {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 32px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .phase-title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 3px solid #eee;
            color: #333;
        }
        .qr-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 24px;
        }
        .qr-card {
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            background: #fafafa;
            transition: transform 0.2s;
        }
        .qr-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .qr-image {
            width: 200px;
            height: 200px;
            margin: 0 auto 16px;
            border: 2px solid #ddd;
            border-radius: 8px;
            background: white;
            padding: 8px;
        }
        .qr-title {
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 8px;
            color: #333;
        }
        .qr-code {
            font-family: monospace;
            color: #666;
            font-size: 14px;
            margin-bottom: 12px;
            background: #f0f0f0;
            padding: 4px 8px;
            border-radius: 4px;
            display: inline-block;
        }
        .qr-details {
            font-size: 14px;
            color: #555;
            margin-bottom: 12px;
        }
        .rarity {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin: 4px 0;
            text-transform: uppercase;
        }
        .rarity.NORMAL {
            background: #e3f2fd;
            color: #1976d2;
        }
        .rarity.RARE {
            background: #f3e5f5;
            color: #7b1fa2;
        }
        .rarity.LEGENDARY {
            background: #fff3e0;
            color: #f57c00;
        }
        .hint {
            background: #f0f8ff;
            border-left: 4px solid #2196f3;
            padding: 12px;
            margin-top: 12px;
            text-align: left;
            font-size: 13px;
            border-radius: 4px;
        }
        .hint-title {
            font-weight: bold;
            margin-bottom: 4px;
            color: #1976d2;
        }
        .download-btn {
            display: inline-block;
            background: #4CAF50;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            border-radius: 4px;
            font-size: 12px;
            margin: 4px;
            transition: background 0.2s;
        }
        .download-btn:hover {
            background: #45a049;
        }
        .stats {
            background: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 16px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Token Crunchies QR Codes</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p><strong>${codes.length} QR codes</strong> across 3 phases</p>

            <div class="stats">
                <h3>📊 Overview</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${codesByPhase.PHASE_1.length}</div>
                        <div class="stat-label">Phase 1 Codes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${codesByPhase.PHASE_2.length}</div>
                        <div class="stat-label">Phase 2 Codes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${codesByPhase.PHASE_3.length}</div>
                        <div class="stat-label">Phase 3 Codes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${codes.filter(c => c.rarity === 'NORMAL').length}</div>
                        <div class="stat-label">Normal Codes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${codes.filter(c => c.rarity === 'RARE').length}</div>
                        <div class="stat-label">Rare Codes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${codes.filter(c => c.rarity === 'LEGENDARY').length}</div>
                        <div class="stat-label">Legendary Codes</div>
                    </div>
                </div>
            </div>
        </div>

        ${Object.entries(codesByPhase).map(([phase, phaseCodes]) => `
        <div class="phase-section">
            <div class="phase-title">
                ${phase.replace('_', ' ')}
                (${phaseCodes.length} codes)
            </div>
            <div class="qr-grid">
                ${phaseCodes.map(code => `
                <div class="qr-card">
                    <img src="png/${code.filename}.png" alt="${code.metadata.name}" class="qr-image">
                    <div class="qr-title">${code.metadata.name}</div>
                    <div class="qr-code">${code.metadata.code}</div>
                    <div class="qr-details">
                        <div>Sequence: #${code.metadata.sequenceOrder}</div>
                        <div>Reward: ${code.metadata.tokenReward} tokens</div>
                        <div class="rarity ${code.metadata.rarity}">${code.metadata.rarity}</div>
                    </div>
                    ${code.metadata.hint ? `
                    <div class="hint">
                        <div class="hint-title">${code.metadata.hint.title}</div>
                        <div>${code.metadata.hint.content}</div>
                    </div>
                    ` : ''}
                    <div style="margin-top: 12px;">
                        <a href="png/${code.filename}.png" download="${code.filename}.png" class="download-btn">📥 PNG</a>
                        <a href="svg/${code.filename}.svg" download="${code.filename}.svg" class="download-btn">🎨 SVG</a>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        `).join('')}
    </div>
</body>
</html>`
}

// Run the generator if this file is executed directly
if (require.main === module) {
  generatePrintableQRCodes()
    .catch(console.error)
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { generatePrintableQRCodes }
