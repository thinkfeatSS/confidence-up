import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post()
  @HttpCode(HttpStatus.OK)
  submit(@Body() dto: CreateContactDto) {
    return this.contactService.submitInquiry(dto);
  }
}
