import { Controller, Get } from '@nestjs/common';
import { PackageService } from './package.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/packages')
export class PackageController {
  constructor(private service: PackageService) {}

  @Public()
  @Get()
  async list() { return this.service.findAll(); }
}
