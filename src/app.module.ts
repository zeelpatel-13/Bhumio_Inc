import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PdfController } from './interfaces/pdf.controller';
import { DocuSignService } from './infrastructure/docusign.service';

@Module({
  imports: [
    // Serve static files from the 'public' folder
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
  controllers: [PdfController], // Controller to handle PDF-related routes
  providers: [DocuSignService], // Service for interacting with DocuSign API
})
export class AppModule {}
