#!/usr/bin/env tsx

import { PrismaClient, GamePhase, QRRarity } from '../lib/generated/prisma'
import { createQRData, generateQRCode, generateQRCodeSVG, QRMetadata } from '../lib/qr-generator'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

async function generateAndSaveQRCodes() {
  console.log('🎯 Starting secure QR code generation...')
  console.log('🔒 Security Enhancement: Sequence numbers removed from QR metadata')
  
  let processedCount = 0
  
  // Create directories
  const baseDir = path.join(process.cwd(), 'generated-qr-codes')
  const pngDir = path.join(baseDir, 'png')
  const svgDir = path.join(baseDir, 'svg')
  
  await fs.mkdir(baseDir, { recursive: true })
  await fs.mkdir(pngDir, { recursive: true })
  await fs.mkdir(svgDir, { recursive: true })
  
  // Fetch all QR codes from database
  console.log('📋 Fetching QR codes from database...')
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
    return { processed: 0, total: 0 }
  }
  
  console.log(`📱 Found ${qrCodes.length} QR codes in database`)
  
  const manifest = []
  
  // Generate QR code files for each QR code from database
  for (const qrCode of qrCodes) {
    try {
      console.log(`📱 Processing QR code: ${qrCode.name} (${qrCode.code})`)
      
      // Create SECURE metadata object from database record (NO SEQUENCE NUMBER)
      const metadata = {
        code: qrCode.code,
        name: qrCode.name,
        phase: qrCode.phase,
        rarity: qrCode.rarity,
        tokenReward: qrCode.tokenReward.toString(),
        hint: qrCode.hint ? {
          title: qrCode.hint.title || 'Location Hint',
          content: qrCode.hint.content
        } : undefined
      }
      
      // Generate QR data string with embedded metadata (NO SEQUENCE NUMBER)
      const qrDataString = createQRData(metadata)
      
      // Generate PNG
      const pngDataUrl = await generateQRCode(metadata, {
        width: 2048,
        errorCorrectionLevel: 'H'
      })
      
      // Convert data URL to buffer and save
      const pngBuffer = Buffer.from(pngDataUrl.split(',')[1], 'base64')
      const pngPath = path.join(pngDir, `${qrCode.code}.png`)
      await fs.writeFile(pngPath, pngBuffer)
      
      // Generate SVG
      const svgContent = await generateQRCodeSVG(metadata, {
        width: 2048,
        errorCorrectionLevel: 'H'
      })
      
      const svgPath = path.join(svgDir, `${qrCode.code}.svg`)
      await fs.writeFile(svgPath, svgContent)
      
      // Add to manifest
      manifest.push({
        code: qrCode.code,
        name: qrCode.name,
        phase: qrCode.phase,
        sequenceOrder: qrCode.sequenceOrder,
        rarity: qrCode.rarity,
        tokenReward: qrCode.tokenReward.toString(),
        hint: qrCode.hint?.content || '',
        files: {
          png: `png/${qrCode.code}.png`,
          svg: `svg/${qrCode.code}.svg`
        },
        qrData: qrDataString
      })
      
      processedCount++
      console.log(`✅ Generated files for: ${qrCode.name}`)
      console.log(`   QR Data: ${qrDataString}`)
      console.log(`   Phase: ${qrCode.phase} | Sequence: ${qrCode.sequenceOrder} | Rarity: ${qrCode.rarity}`)
      
      if (qrCode.hint) {
        console.log(`   Hint: ${qrCode.hint.content}`)
      }
      
      console.log('') // Empty line for readability
      
    } catch (error) {
      console.error(`Failed to process QR code for ${qrCode.code}:`, error)
    }
  }
  
  // Save manifest
  const manifestPath = path.join(baseDir, 'qr-codes-manifest.json')
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2))
  
  // Generate HTML preview
  await generatePreviewHTML(manifest, baseDir)
  
  console.log('\n🎉 Secure QR Code generation completed!')
  console.log(`📱 Total processed: ${processedCount} QR codes`)
  console.log(`📁 Files saved to: ${baseDir}`)
  console.log(`🌐 View preview: ${baseDir}/qr-codes-preview.html`)
  console.log('\n🔒 Security Enhancement Applied:')
  console.log('   - Sequence numbers removed from QR metadata')
  console.log('   - Users can no longer extract and arrange QR codes')
  console.log('   - QR codes must be found physically in the correct order')
  
  return {
    processed: processedCount,
    total: processedCount
  }
}

async function generatePreviewHTML(manifest: any[], baseDir: string) {
  console.log('🌐 Generating HTML preview...')
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Crunchies QR Codes - Secure Version</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .security-notice { background: #e8f5e8; border: 2px solid #4caf50; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .phase { margin-bottom: 40px; }
        .phase-title { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .qr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .qr-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .qr-image { text-align: center; margin-bottom: 15px; }
        .qr-image img { max-width: 200px; height: 200px; border: 1px solid #ddd; }
        .qr-info h3 { margin: 0 0 10px 0; color: #333; }
        .qr-details { font-size: 14px; color: #666; margin-bottom: 10px; }
        .hint { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; border-radius: 4px; font-style: italic; }
        .rarity-normal { border-left: 4px solid #28a745; }
        .rarity-rare { border-left: 4px solid #ffc107; }
        .rarity-legendary { border-left: 4px solid #dc3545; }
        .qr-data { font-family: monospace; font-size: 12px; background: #f8f9fa; padding: 8px; border-radius: 4px; word-break: break-all; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Token Crunchies QR Codes</h1>
            <p><strong>Secure Version - No Sequence Numbers in QR Data</strong></p>
        </div>
        
        <div class="security-notice">
            <h3>🔒 Security Enhancement</h3>
            <p><strong>Fixed:</strong> Sequence numbers are no longer included in QR code metadata to prevent users from extracting and arranging QR codes without finding them physically.</p>
            <p><strong>New Format:</strong> TOKEN_CRUNCHIES://[code]:[phase]:[reward]:[rarity]:[hint]</p>
        </div>

        ${['PHASE_1', 'PHASE_2', 'PHASE_3'].map(phase => {
          const phaseQRs = manifest.filter(qr => qr.phase === phase)
          if (phaseQRs.length === 0) return ''
          
          return `
        <div class="phase">
            <h2 class="phase-title">${phase.replace('_', ' ')} - ${phaseQRs[0].rarity} QRs (${phaseQRs[0].tokenReward} tokens each)</h2>
            <div class="qr-grid">
                ${phaseQRs.map(qr => `
                <div class="qr-card rarity-${qr.rarity.toLowerCase()}">
                    <div class="qr-image">
                        <img src="${qr.files.png}" alt="${qr.name}" />
                    </div>
                    <div class="qr-info">
                        <h3>${qr.name}</h3>
                        <div class="qr-details">
                            <strong>Code:</strong> ${qr.code}<br>
                            <strong>Phase:</strong> ${qr.phase}<br>
                            <strong>Sequence:</strong> #${qr.sequenceOrder}<br>
                            <strong>Rarity:</strong> ${qr.rarity}<br>
                            <strong>Reward:</strong> ${qr.tokenReward} tokens
                        </div>
                        <div class="hint">
                            <strong>Hint:</strong> ${qr.hint}
                        </div>
                        <div class="qr-data">
                            <strong>QR Data:</strong> ${qr.qrData}
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        `
        }).join('')}
        
        <div style="text-align: center; margin-top: 40px; color: #666;">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Total QR Codes: ${manifest.length}</p>
        </div>
    </div>
</body>
</html>`
  
  const htmlPath = path.join(baseDir, 'qr-codes-preview.html')
  await fs.writeFile(htmlPath, htmlContent)
  
  console.log('✅ HTML preview generated')
}

// Run the generator if this file is executed directly
if (require.main === module) {
  generateAndSaveQRCodes()
    .catch(console.error)
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { generateAndSaveQRCodes }
