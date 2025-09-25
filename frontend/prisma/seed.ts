import { PrismaClient, GamePhase, QRRarity } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Phase 1 - Normal QR codes with new hints (100 tokens each)
  // Using random codes to prevent sequence guessing
  const qrCodesWithHints = [
    {
      code: 'CRUNCH_7X9K',
      name: 'Check-in Counter',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 1,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Location Hint',
        content: 'check in to check-out:eyes:'
      }
    },
    {
      code: 'TOKEN_M4R8',
      name: 'Suspicious Houses',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 2,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Location Hint',
        content: 'those little houses look sus... maybe check em out?'
      }
    },
    {
      code: 'HUNT_3P5L',
      name: 'Food Court Secret',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 3,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Location Hint',
        content: 'grab some food and maybe grab something else too :eyes:'
      }
    },
    {
      code: 'BEAT_9W2N',
      name: 'Beat Drop Zone',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 4,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Location Hint',
        content: 'where the beats drop, tokens might drop too :musical_note:'
      }
    },
    {
      code: 'TRAIL_6H4Q',
      name: 'Trail Convergence',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 5,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Location Hint',
        content: 'All trails eventually crunch back here.'
      }
    },
    {
      code: 'OCEAN_8F1V',
      name: 'Ocean Splash',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 6,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Location Hint',
        content: 'go splash around the ocean, might find more than salt'
      }
    },
    {
      code: 'POND_5T7R',
      name: 'Silent Pond Watcher',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 7,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Location Hint',
        content: 'A silent pond watching from the sidelines'
      }
    },
    {
      code: 'TAIL_2K9S',
      name: 'Silent Tails',
      phase: GamePhase.PHASE_1,
      sequenceOrder: 8,
      rarity: QRRarity.NORMAL,
      tokenReward: '100',
      hint: {
        title: 'Location Hint',
        content: 'Silent Tails'
      }
    }
  ]

  // Create QR codes with hints
  for (const qrData of qrCodesWithHints) {
    const { hint, ...qrCodeData } = qrData
    
    // Check if QR code already exists by code OR by phase+sequenceOrder
    const existingQR = await prisma.qRCode.findFirst({
      where: {
        OR: [
          { code: qrCodeData.code },
          { 
            phase: qrCodeData.phase,
            sequenceOrder: qrCodeData.sequenceOrder
          }
        ]
      },
      include: { hint: true }
    })

    if (existingQR) {
      console.log(`⏭️  QR code ${qrCodeData.name} already exists (${existingQR.code}), updating hint if needed...`)
      
      // Update hint if it doesn't exist or is different
      if (!existingQR.hint) {
        await prisma.hint.create({
          data: {
            ...hint,
            qrCodeId: existingQR.id
          }
        })
        console.log(`✅ Added hint to existing QR code: ${existingQR.name}`)
      } else if (existingQR.hint.content !== hint.content) {
        await prisma.hint.update({
          where: { id: existingQR.hint.id },
          data: hint
        })
        console.log(`✅ Updated hint for QR code: ${existingQR.name}`)
      } else {
        console.log(`ℹ️  Hint already up to date for: ${existingQR.name}`)
      }
      continue
    }

    // Create QR code with hint
    const qrCode = await prisma.qRCode.create({
      data: {
        ...qrCodeData,
        hint: {
          create: hint
        }
      },
      include: {
        hint: true
      }
    })

    console.log(`✅ Created QR code: ${qrCode.name} with hint: "${qrCode.hint?.content}"`)
  }


  // Phase 2 - Rare QR codes with new hints (250 tokens each)
  // Using random codes to prevent sequence guessing
  const phase2QRs = [
    {
      code: 'FLOAT_X7M3',
      name: 'Floating Swimmer',
      phase: GamePhase.PHASE_2,
      sequenceOrder: 9,
      rarity: QRRarity.RARE,
      tokenReward: '250',
      hint: {
        title: 'Location Hint',
        content: 'A swimmer that only floats'
      }
    },
    {
      code: 'RING_K9P4',
      name: 'Pocket Loot',
      phase: GamePhase.PHASE_2,
      sequenceOrder: 10,
      rarity: QRRarity.RARE,
      tokenReward: '250',
      hint: {
        title: 'Location Hint',
        content: 'The real loot might be ringing in someone\'s pocket'
      }
    },
    {
      code: 'MERCY_L2W8',
      name: 'Godfather\'s Mercy',
      phase: GamePhase.PHASE_2,
      sequenceOrder: 11,
      rarity: QRRarity.RARE,
      tokenReward: '250',
      hint: {
        title: 'Location Hint',
        content: 'Ask Godfather, maybe he can show some mercy'
      }
    },
    {
      code: 'SUPREME_V5N1',
      name: 'Supreme Secrets',
      phase: GamePhase.PHASE_2,
      sequenceOrder: 12,
      rarity: QRRarity.RARE,
      tokenReward: '250',
      hint: {
        title: 'Location Hint',
        content: 'Supreme leader knows supreme secrets'
      }
    }
  ]

  for (const qrData of phase2QRs) {
    const { hint, ...qrCodeData } = qrData
    
    const existingQR = await prisma.qRCode.findFirst({
      where: {
        OR: [
          { code: qrCodeData.code },
          { 
            phase: qrCodeData.phase,
            sequenceOrder: qrCodeData.sequenceOrder
          }
        ]
      },
      include: { hint: true }
    })

    if (existingQR) {
      console.log(`⏭️  QR code ${qrCodeData.name} already exists, skipping...`)
      continue
    }

    const qrCode = await prisma.qRCode.create({
      data: {
        ...qrCodeData,
        hint: {
          create: hint
        }
      },
      include: {
        hint: true
      }
    })

    console.log(`✅ Created rare QR code: ${qrCode.name}`)
  }

  // Phase 3 - Legendary QR code with new hint (500 tokens)
  // Using random code to prevent sequence guessing
  const phase3QR = {
    code: 'LEGEND_Z8Q6',
    name: 'Legend Never Dies',
    phase: GamePhase.PHASE_3,
    sequenceOrder: 13,
    rarity: QRRarity.LEGENDARY,
    tokenReward: '500',
    hint: {
      title: 'Location Hint',
      content: 'Legend never dies'
    }
  }

  const existingLegendary = await prisma.qRCode.findFirst({
    where: {
      OR: [
        { code: phase3QR.code },
        { 
          phase: phase3QR.phase,
          sequenceOrder: phase3QR.sequenceOrder
        }
      ]
    },
    include: { hint: true }
  })

  if (!existingLegendary) {
    const { hint, ...qrCodeData } = phase3QR
    
    const legendaryQR = await prisma.qRCode.create({
      data: {
        ...qrCodeData,
        hint: {
          create: hint
        }
      },
      include: {
        hint: true
      }
    })

    console.log(`✅ Created legendary QR code: ${legendaryQR.name}`)
  } else {
    console.log(`⏭️  Legendary QR code already exists, skipping...`)
  }

  console.log('🎉 Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
