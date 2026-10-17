import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { z } from 'zod';
import { pushSubscriptionSchema, isAllowedPushEndpoint } from './push.contract';
import { PushAdminOnly, PushGuard } from './push.guard';
import { PushService } from './push.service';
import { PushConfig } from './push.config';

@Controller('api/push')
@UseGuards(PushGuard)
export class PushController {
  constructor(
    private readonly service: PushService,
    private readonly config: PushConfig,
  ) {}

  @Get('config')
  @Header('Cache-Control', 'private, no-store')
  getConfig() {
    return { publicKey: this.config.publicKey };
  }

  @Post('subscriptions')
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  async subscribe(@Body() body: unknown) {
    const result = pushSubscriptionSchema.safeParse(body);
    if (!result.success) throw new BadRequestException('Invalid subscription');
    await this.service.subscribe(result.data);
    return { subscribed: true };
  }

  @Delete('subscriptions')
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  async unsubscribe(@Body() body: unknown) {
    const result = pushSubscriptionSchema.safeParse(body);
    if (!result.success) throw new BadRequestException('Invalid subscription');
    await this.service.unsubscribe(result.data);
    return { subscribed: false };
  }

  @Post('test')
  @PushAdminOnly()
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  async sendTest(@Body() body: unknown) {
    const result = z
      .object({ endpoint: z.string().max(2048).refine(isAllowedPushEndpoint) })
      .safeParse(body);
    if (!result.success) throw new BadRequestException('Invalid subscription');
    return this.service.sendTest(result.data.endpoint);
  }
}
