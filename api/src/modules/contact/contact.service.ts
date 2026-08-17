import { BadRequestException, Injectable } from '@nestjs/common';
import { MailService } from '../../mail/mail.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly mailService: MailService) {}

  async submitInquiry(dto: CreateContactDto) {
    if (dto.website) {
      throw new BadRequestException('Invalid submission');
    }

    await this.mailService.sendContactInquiry(dto);

    return {
      message: 'Thank you, we will respond within 2 business days.',
    };
  }
}
