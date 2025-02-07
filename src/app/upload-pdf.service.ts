import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadPdfService {
  async validatePdf(file: Express.Multer.File): Promise<boolean> {
    return file.mimetype === 'application/pdf';
  }
}
