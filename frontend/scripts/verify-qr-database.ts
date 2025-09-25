#!/usr/bin/env tsx

import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function verifyQRDatabase() {
  console.log('🔍 Verifying QR codes in database...')
  
  // Get all QR codes with their hints
  const qrCodes = await prisma.qRCode.findMany({
    include: {
      hint: true
    },
    orderBy: [
      { phase: 'asc' },
      { sequenceOrder: 'asc' }
    ]
  })

  console.log(`📊 Total QR codes in database: ${qrCodes.length}`)
  
  // Group by phase
  const byPhase = {
    PHASE_1: qrCodes.filter(qr => qr.phase === 'PHASE_1'),
    PHASE_2: qrCodes.filter(qr => qr.phase === 'PHASE_2'),
    PHASE_3: qrCodes.filter(qr => qr.phase === 'PHASE_3')
  }

  // Group by rarity
  const byRarity = {
    NORMAL: qrCodes.filter(qr => qr.rarity === 'NORMAL'),
    RARE: qrCodes.filter(qr => qr.rarity === 'RARE'),
    LEGENDARY: qrCodes.filter(qr => qr.rarity === 'LEGENDARY')
  }

  console.log('\n📋 Phase Distribution:')
  console.log(`  Phase 1: ${byPhase.PHASE_1.length} codes`)
  console.log(`  Phase 2: ${byPhase.PHASE_2.length} codes`)
  console.log(`  Phase 3: ${byPhase.PHASE_3.length} codes`)

  console.log('\n🎯 Rarity Distribution:')
  console.log(`  Normal: ${byRarity.NORMAL.length} codes`)
  console.log(`  Rare: ${byRarity.RARE.length} codes`)
  console.log(`  Legendary: ${byRarity.LEGENDARY.length} codes`)

  console.log('\n📱 All QR Codes:')
  for (const qr of qrCodes) {
    console.log(`  ${qr.sequenceOrder}. ${qr.name} (${qr.code})`)
    console.log(`     Phase: ${qr.phase} | Rarity: ${qr.rarity} | Reward: ${qr.tokenReward} tokens`)
    if (qr.hint) {
      console.log(`     Hint: "${qr.hint.content}"`)
    }
    console.log(`     Active: ${qr.isActive}`)
    console.log('')
  }

  // Verify sequential order
  console.log('🔢 Verifying sequential order...')
  let sequenceValid = true
  
  for (const phase of ['PHASE_1', 'PHASE_2', 'PHASE_3']) {
    const phaseCodes = byPhase[phase as keyof typeof byPhase]
    for (let i = 0; i < phaseCodes.length; i++) {
      const expectedSequence = i + 1
      const actualSequence = phaseCodes[i].sequenceOrder
      if (actualSequence !== expectedSequence) {
        console.log(`❌ Sequence error in ${phase}: Expected ${expectedSequence}, got ${actualSequence}`)
        sequenceValid = false
      }
    }
  }

  if (sequenceValid) {
    console.log('✅ All sequences are valid')
  }

  // Check for any missing hints
  const missingHints = qrCodes.filter(qr => !qr.hint)
  if (missingHints.length > 0) {
    console.log(`⚠️  ${missingHints.length} QR codes missing hints:`)
    missingHints.forEach(qr => console.log(`   - ${qr.name} (${qr.code})`))
  } else {
    console.log('✅ All QR codes have hints')
  }

  console.log('\n🎉 Database verification completed!')
  return {
    total: qrCodes.length,
    phases: byPhase,
    rarities: byRarity,
    sequenceValid,
    allHaveHints: missingHints.length === 0
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifyQRDatabase()
    .catch(console.error)
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export { verifyQRDatabase }
