import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'
import { AuthGuard } from '@nestjs/passport'
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator'
import { ConnectService } from './connect.service'

class BookSlotDto {
  @IsString() slotId: string
  @IsString() queryType: string
  @IsOptional() @IsString() notes?: string
}

class InitiatePurchaseDto {
  @IsString() partnerId: string
  @IsOptional() @IsString() recommendationId?: string
}

@ApiTags('connect')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'connect', version: '1' })
export class ConnectController {
  constructor(private readonly connectService: ConnectService) {}

  // ── Advisor Booking ───────────────────────────────────────────

  @Get('advisor/slots')
  @ApiOperation({ summary: 'Get available advisor time slots' })
  async getSlots() {
    return this.connectService.getAvailableSlots()
  }

  @Post('advisor/book')
  @ApiOperation({ summary: 'Book an advisor slot (15-min call)' })
  async bookSlot(@CurrentUser() user: JwtPayload, @Body() dto: BookSlotDto) {
    return this.connectService.bookSlot(user.sub, dto.slotId, dto.queryType, dto.notes)
  }

  @Get('advisor/bookings')
  @ApiOperation({ summary: "Get current user's advisor bookings" })
  async getUserBookings(@CurrentUser() user: JwtPayload) {
    return this.connectService.getUserBookings(user.sub)
  }

  @Delete('advisor/bookings/:bookingId')
  @ApiOperation({ summary: 'Cancel an advisor booking' })
  async cancelBooking(@CurrentUser() user: JwtPayload, @Param('bookingId') bookingId: string) {
    return this.connectService.cancelBooking(user.sub, bookingId)
  }

  // ── Purchase Bridge ───────────────────────────────────────────

  @Get('partners')
  @ApiOperation({ summary: 'List product partners by category (term_life, health, personal_accident, critical_illness)' })
  @ApiQuery({ name: 'category', required: false })
  getPartners(@Query('category') category?: string) {
    return this.connectService.getProductPartners(category)
  }

  @Post('purchase/initiate')
  @ApiOperation({ summary: 'Initiate secure purchase redirect to insurer partner (CG-5: KIN is not the insurer)' })
  initiatePurchase(@CurrentUser() user: JwtPayload, @Body() dto: InitiatePurchaseDto) {
    return this.connectService.initiatePurchase(user.sub, dto.partnerId, dto.recommendationId)
  }
}
