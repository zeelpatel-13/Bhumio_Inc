import {
  Controller,
  Post,
  UploadedFile,
  Body,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import * as express from 'express';

@Controller('pdf')
export class PdfController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './pdf-storage',
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File,
    @Body('signature') signatureData: string,
    @Res() res: express.Response,
  ) {
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      // Load the uploaded PDF
      const pdfBytes = fs.readFileSync(file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Decode signature image from base64
      const signatureBuffer = Buffer.from(
        signatureData.replace(/^data:image\/\w+;base64,/, ''),
        'base64',
      );

      // Determine image format based on data URL prefix
      let signatureImage;
      if (signatureData.startsWith('data:image/png')) {
        signatureImage = await pdfDoc.embedPng(signatureBuffer);
      } else if (signatureData.startsWith('data:image/jpeg')) {
        signatureImage = await pdfDoc.embedJpg(signatureBuffer);
      } else {
        throw new Error('Unsupported image format');
      }

      // Get the first page and draw the signature
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const signatureDims = signatureImage.scale(0.25);
      firstPage.drawImage(signatureImage, {
        x: 100, // Adjust position as needed
        y: 100,
        width: signatureDims.width,
        height: signatureDims.height,
      });

      // Save the updated PDF
      const signedPdfBytes = await pdfDoc.save();
      const signedPdfBuffer = Buffer.from(signedPdfBytes);

      // Set proper headers and send the signed PDF as a download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="signed-${file.filename}"`,
        'Content-Length': signedPdfBuffer.length,
      });

      return res.send(signedPdfBuffer);
    } catch (error) {
      console.error('Error processing PDF:', error);
      return res.status(500).json({ message: 'Error processing PDF' });
    }
  }
}
