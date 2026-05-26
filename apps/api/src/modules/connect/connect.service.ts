/**
 * ConnectService — Module 10: Connect Layer
 *
 * Advisor slot booking + purchase bridge to insurer partners.
 *   CG-2: Spurious calls warning in all advisor-facing content.
 *   CG-5: KIN is NOT the insurer. Purchase routes to the insurer's own flow.
 *   CG-3: ULIPs are gated off (isUlip: false on every partner).
 *
 * Advisor slots are derived from a deterministic rolling 5-day window so they
 * survive serverless cold starts. Bookings are persisted to advisor_bookings
 * which provides the per-slot uniqueness constraint at the DB level.
 */
import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { AdvisorBooking } from '../../database/entities/advisor-booking.entity'

export interface AdvisorSlot {
  slotId: string
  datetime: string
  available: boolean
  advisorName: string
}

export interface Booking {
  bookingId: string
  userId: string
  slotId: string
  datetime: string
  status: 'pending' | 'confirmed' | 'cancelled'
  queryType: string
  notes?: string
  bookedAt: string
}

export interface ProductPartner {
  partnerId: string
  name: string
  irdaiRegNo: string
  category: 'term_life' | 'health' | 'personal_accident' | 'critical_illness'
  isUlip: false
  purchaseUrlBase: string
}

const ADVISORS = ['Priya Sharma', 'Rahul Gupta', 'Anjali Mehta']
const SLOTS_PER_DAY = 2 // 10:00 and 13:00 IST
const ROLLING_DAYS = 5

const PRODUCT_PARTNERS: ProductPartner[] = [
  { partnerId: 'pp-hdfc-term',   name: 'HDFC Life',                irdaiRegNo: '101', category: 'term_life',          isUlip: false, purchaseUrlBase: 'https://www.hdfclife.com/term-insurance' },
  { partnerId: 'pp-star-health', name: 'Star Health Insurance',     irdaiRegNo: '129', category: 'health',             isUlip: false, purchaseUrlBase: 'https://www.starhealth.in/health-insurance' },
  { partnerId: 'pp-bajaj-pa',    name: 'Bajaj Allianz General',     irdaiRegNo: '113', category: 'personal_accident',  isUlip: false, purchaseUrlBase: 'https://www.bajajallianz.com/personal-accident-insurance' },
]

@Injectable()
export class ConnectService {
  constructor(
    @InjectRepository(AdvisorBooking)
    private readonly bookingRepo: Repository<AdvisorBooking>,
  ) {}

  /**
   * Slots are computed deterministically from today's date so they are
   * consistent across function invocations. Returns the rolling 5-day window
   * minus already-booked slots.
   */
  async getAvailableSlots(): Promise<AdvisorSlot[]> {
    const allSlots = generateSlots()
    const slotIds = allSlots.map(s => s.slotId)
    const booked = await this.bookingRepo.find({
      where: slotIds.map(slotId => ({ slotId, status: 'confirmed' as const })),
      select: ['slotId'],
    })
    const bookedSet = new Set(booked.map(b => b.slotId))
    return allSlots.filter(s => !bookedSet.has(s.slotId))
  }

  async bookSlot(userId: string, slotId: string, queryType: string, notes?: string): Promise<Booking> {
    const allSlots = generateSlots()
    const slot = allSlots.find(s => s.slotId === slotId)
    if (!slot) throw new NotFoundException('Slot not found')

    const existing = await this.bookingRepo.findOne({ where: { slotId, status: 'confirmed' } })
    if (existing) throw new ConflictException('Slot is no longer available')

    const booking = await this.bookingRepo.save(
      this.bookingRepo.create({
        userId,
        slotId,
        datetime: new Date(slot.datetime),
        status: 'confirmed',
        queryType,
        notes,
      }),
    )
    return toBookingView(booking)
  }

  async getUserBookings(userId: string): Promise<Booking[]> {
    const rows = await this.bookingRepo.find({ where: { userId }, order: { bookedAt: 'DESC' } })
    return rows.map(toBookingView)
  }

  async cancelBooking(userId: string, bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { bookingId } })
    if (!booking) throw new NotFoundException('Booking not found')
    if (booking.userId !== userId) throw new BadRequestException('Booking does not belong to this user')
    if (booking.status === 'cancelled') throw new BadRequestException('Booking already cancelled')

    booking.status = 'cancelled'
    const saved = await this.bookingRepo.save(booking)
    return toBookingView(saved)
  }

  getProductPartners(category?: string): ProductPartner[] {
    if (category) return PRODUCT_PARTNERS.filter(p => p.category === category)
    return PRODUCT_PARTNERS
  }

  /**
   * CG-5: KIN is not the insurer. This produces a one-time secure redirect
   * to the insurer's own purchase flow.
   */
  initiatePurchase(userId: string, partnerId: string, _recommendationId?: string): {
    purchaseToken: string
    redirectUrl: string
    disclaimer: string
    partnerName: string
    irdaiRegNo: string
  } {
    void userId // reserved for audit logging in Phase 2
    const partner = PRODUCT_PARTNERS.find(p => p.partnerId === partnerId)
    if (!partner) throw new NotFoundException('Partner not found')

    const purchaseToken = uuidv4()
    const redirectUrl = `${partner.purchaseUrlBase}?ref=kin&token=${purchaseToken}`

    return {
      purchaseToken,
      redirectUrl,
      partnerName: partner.name,
      irdaiRegNo: partner.irdaiRegNo,
      disclaimer:
        `KIN is not the insurer. ${partner.name} (IRDAI Reg. No. ${partner.irdaiRegNo}) ` +
        `underwrites this policy. You are leaving KIN and entering ${partner.name}'s ` +
        `purchase flow. KIN does not receive any commission. Participation is purely on a voluntary basis.`,
    }
  }
}

function generateSlots(): AdvisorSlot[] {
  const slots: AdvisorSlot[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let d = 1; d <= ROLLING_DAYS; d++) {
    const day = new Date(today)
    day.setDate(today.getDate() + d)
    for (let h = 0; h < SLOTS_PER_DAY; h++) {
      const slot = new Date(day)
      slot.setHours(10 + h * 3, 0, 0, 0)
      const id = `slot-${day.toISOString().slice(0, 10)}-${h}`
      slots.push({
        slotId: id,
        datetime: slot.toISOString(),
        available: true,
        advisorName: ADVISORS[(d + h) % ADVISORS.length],
      })
    }
  }
  return slots
}

function toBookingView(b: AdvisorBooking): Booking {
  return {
    bookingId: b.bookingId,
    userId: b.userId,
    slotId: b.slotId,
    datetime: b.datetime.toISOString(),
    status: b.status,
    queryType: b.queryType,
    notes: b.notes ?? undefined,
    bookedAt: b.bookedAt.toISOString(),
  }
}
