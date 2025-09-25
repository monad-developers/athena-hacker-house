import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)
    const sortBy = searchParams.get('sortBy') || 'totalTokens' // totalTokens, qrCodesScanned, rareQRsScanned
    
    // Validate sortBy parameter
    const validSortFields = ['totalTokens', 'qrCodesScanned', 'rareQRsScanned', 'legendaryQRsScanned']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'totalTokens'

    // Get leaderboard entries with ranking
    // Primary sort: Max tokens/QRs first (desc)
    // Secondary sort: For ties, earliest achiever wins (asc) - competitive fairness
    // Tertiary sort: Most recent activity as final tie-breaker (desc)
    const leaderboardEntries = await prisma.leaderboardEntry.findMany({
      orderBy: [
        { [sortField]: 'desc' },     // Primary: Highest score first
        { updatedAt: 'asc' },        // Secondary: Earliest achiever wins ties
        { lastScanAt: 'desc' }       // Tertiary: Most recent activity
      ],
      skip: offset,
      take: limit,
      select: {
        userId: true,
        nickname: true,
        totalTokens: true,
        qrCodesScanned: true,
        rareQRsScanned: true,
        legendaryQRsScanned: true,
        lastScanAt: true,
        updatedAt: true
      }
    })

    // Add rank to each entry
    const rankedEntries = leaderboardEntries.map((entry, index) => ({
      ...entry,
      rank: offset + index + 1,
      totalTokens: entry.totalTokens.toString()
    }))

    // Get total count for pagination
    const totalCount = await prisma.leaderboardEntry.count()

    // Get some statistics
    const stats = await getLeaderboardStats()

    return NextResponse.json({
      success: true,
      leaderboard: rankedEntries,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      },
      stats,
      sortBy: sortField
    })

  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}

async function getLeaderboardStats() {
  try {
    // Get aggregate statistics
    const [
      totalUsers,
      totalTokensDistributed,
      totalQRsScanned,
      topPlayer,
      _phaseDistribution
    ] = await Promise.all([
      // Total registered users
      prisma.user.count(),
      
      // Total tokens distributed
      prisma.userQRScan.aggregate({
        where: { transferStatus: 'CONFIRMED' },
        _sum: { tokensEarned: true }
      }),
      
      // Total QR codes scanned successfully
      prisma.userQRScan.count({
        where: { transferStatus: 'CONFIRMED' }
      }),
      
      // Top player - same sorting logic as main leaderboard
      prisma.leaderboardEntry.findFirst({
        orderBy: [
          { totalTokens: 'desc' },     // Highest tokens first
          { updatedAt: 'asc' },        // Earliest achiever wins ties
          { lastScanAt: 'desc' }       // Most recent activity
        ],
        select: {
          nickname: true,
          totalTokens: true,
          qrCodesScanned: true
        }
      }),
      
      // No phase distribution in simplified system
      Promise.resolve([])
    ])

    return {
      totalUsers,
      totalTokensDistributed: totalTokensDistributed._sum.tokensEarned?.toString() || '0',
      totalQRsScanned,
      topPlayer: topPlayer ? {
        ...topPlayer,
        totalTokens: topPlayer.totalTokens.toString()
      } : null,
      phaseDistribution: {} // No phases in simplified system
    }
  } catch (error) {
    console.error('Stats calculation error:', error)
    return {
      totalUsers: 0,
      totalTokensDistributed: '0',
      totalQRsScanned: 0,
      topPlayer: null,
      phaseDistribution: {}
    }
  }
}
