import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { VillaService } from './villa.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/villas')
export class VillaController {
  constructor(private villaService: VillaService) {}

  @Public()
  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('check_in') checkIn?: string,
    @Query('check_out') checkOut?: string,
    @Query('guests') guests?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('facilities') facilities?: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('keyword') keyword?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
  ) {
    return this.villaService.findAll({
      page: page ? parseInt(page) : undefined,
      pageSize: pageSize ? parseInt(pageSize) : undefined,
      checkIn,
      checkOut,
      guests: guests ? parseInt(guests) : undefined,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      facilities: facilities
        ? facilities.split(',').map((f) => parseInt(f))
        : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      keyword,
      tag,
      sort,
    });
  }

  @Public()
  @Get(':id')
  async detail(@Param('id', ParseIntPipe) id: number) {
    return this.villaService.findById(id);
  }

  @Public()
  @Get(':id/calendar')
  async calendar(
    @Param('id', ParseIntPipe) id: number,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.villaService.getCalendar(
      id,
      parseInt(year) || new Date().getFullYear(),
      parseInt(month) || new Date().getMonth() + 1,
    );
  }

  @Public()
  @Get(':id/reviews')
  async reviews(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sort') sort?: string,
  ) {
    return this.villaService.getReviews(
      id,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 10,
      sort,
    );
  }
}
