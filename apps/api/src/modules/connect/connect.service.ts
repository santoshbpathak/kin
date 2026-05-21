/**
 * ConnectService — Module 10: Connect Layer
 *
 * Advisor slot booking + purchase bridge to insurer partners.
 * CG-2: Spurious calls warning in all advisor-facing content.
 * CG-5: KIN is NOT the insurer — routes to insurer's own purchase flow.
 * ULIP_RECOMMENDATIONS = false — ULIP cards never rendered (ProductCategoryGuard).
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'

interface AdvisorSlot {
  slotId: string
  datetime: string    // ISO string
  available: boolean
  advisorName: string
}

interface Booking {
  bookingId: string
  userId: string
  slotId: string
  datetime: string
  status: 'pending' | 'confirmed' | 'cancelled'
  queryType: string
  notes?: string
  bookedAt: string
}

interface ProductPartner {
  partnerId: string
  name: string
  irdaiRegNo: string
  category: 'term_life' | 'health' | 'personal_accident' | 'critical_illness'
  isUlip: false     // ULIP_RECOMMENDATIONS = false — never 'true' in MVP1
  purchaseUrlBase: string
}

// In-memory stores (Phase 2: DB with AdvisorSlotEntity, BookingEntity)
const ADVISOR_SLOTS: AdvisorSlot[] = Array.from({ length: 10 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() + Math.floor(i / 2) + 1)
  date.setHours(10 + (i % 2) * 3, 0, 0, 0)
  return {
    slotId: `slot-${i + 1}`,
    datetime: date.toISOString(),
    available: true,
    advisorName: i % 3 === 0 ? 'Priya Sharma' : i % 3 === 1 ? 'Rahul Gupta' : 'Anjali Mehta',
  }
})

const bookingStore = new Map<string, Booking>()

const PRODUCT_PARTNERS: ProductPartner[] = [
  { partnerId: 'pp-hdfc-term', name: 'HDFC Life', irdaiRegNo: '101', category: 'term_life', isUlip: false, purchaseUrlBase: 'https://www.hdfclife.com/term-insurance' },
  { partnerId: 'pp-star-health', name: 'Star Health Insurance', irdaiRegNo: '129', category: 'health', isUlip: false, purchaseUrlBase: 'https://www.starhealth.in/health-insurance' },
  { partnerId: 'pp-bajaj-pa', name: 'Bajaj Allianz General', irdaiRegNo: '113', category: 'personal_accident', isUlip: false, purchaseUrlBase: 'https://www.bajajallianz.com/personal-accident-insurance' },
]

@Injectable()
export class ConnectService {
  getAvailableSlots(): AdvisorSlot[] {
    return ADVISOR_SLOTS.filter(s => s.available)
  }

  bookSlot(userId: string, slotId: string, queryType: string, notes?: string): Booking {
    const slot = ADVISOR_SLOTS.find(s => s.slotId === slotId)
    if (!slot) throw new NotFoundException('Slot not found')
    if (!slot.available) throw new BadRequestException('Slot is no longer available')

    slot.available = false

    const booking: Booking = {
      bookingId: uuidv4(),
      userId,
      slotId,
      datetime: slot.datetime,
      status: 'confirmed',
      queryType,
      notes,
      bookedAt: new Date().toISOString(),
    }
    bookingStore.set(booking.bookingId, booking)
    return booking
  }

  getUserBookings(userId: string): Booking[] {
    return Array.from(bookingStore.values()).filter(b => b.userId === userId)
  }

  cancelBooking(userId: string, bookingId: string): Booking {
    const booking = bookingStore.get(bookingId)
    if (!booking) throw new NotFoundException('Booking not found')
    if (booking.userId !== userId) throw new BadRequestException('Booking does not belong to this user')
    if (booking.status === 'cancelled') throw new BadRequestException('Booking already cancelled')

    booking.status = 'cancelled'
    // Return slot to pool
    const slot = ADVISOR_SLOTS.find(s => s.slotId === booking.slotId)
    if (slot) slot.available = true

    bookingStore.set(bookingId, booking)
    return booking
  }

  getProductPartners(category?: string): ProductPartner[] {
    if (category) return PRODUCT_PARTNERS.filter(p => p.category === category)
    return PRODUCT_PARTNERS
  }

  /**
   * CG-5: KIN is NOT the insurer.
   * Generates a one-time secure token for the purchase redirect.
   * The actual purchase happens on the insurer's own platform.
   */
  initiatePurchase(userId: string, partnerId: string, recommendationId?: string): {
    purchaseToken: string
    redirectUrl: string
    disclaimer: string
    partnerName: string
    irdaiRegNo: string
  } {
    const partner = PRODUCT_PARTNERS.find(p => p.partnerId === partnerId)
    if (!partner) throw new NotFoundException('Partner not found')

    // Phase 2: sign a one-time token with userId + partnerId + timestamp
    const purchaseToken = uuidv4()
    const redirectUrl = `${partner.purchaseUrlBase}?ref=kin&token=${purchaseToken}`

    return {
      purchaseToken,
      redirectUrl,
      partnerName: partner.name,
      irdaiRegNo: partner.irdaiRegNo,
      disclaimer: `KIN is not the insurer. ${partner.name} (IRDAI Reg. No. ${partner.irdaiRegNo}) underwrites this policy. You are leaving KIN and entering ${partner.name}'s purchase flow. KIN does not receive any commission. Participation is purely on a voluntary basis.`,
    }
  }
}
