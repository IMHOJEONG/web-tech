import { Global, Module } from '@nestjs/common';

import { ContentConfigService } from './content-config.service';

@Global()
@Module({
  exports: [ContentConfigService],
  providers: [ContentConfigService],
})
export class ContentConfigModule {}
