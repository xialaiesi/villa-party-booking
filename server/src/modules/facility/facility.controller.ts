import { Controller, Get } from '@nestjs/common';
import { FacilityService } from './facility.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/facilities')
export class FacilityController {
  constructor(private service: FacilityService) {}

  @Public()
  @Get()
  async list() { return this.service.findAll(); }
}
