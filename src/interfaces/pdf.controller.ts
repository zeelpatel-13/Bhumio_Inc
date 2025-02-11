// import {
//   Controller,
//   Post,
//   UploadedFile,
//   Body,
//   UseInterceptors,
//   Res,
// } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import * as path from 'path';
// import * as fs from 'fs';
// import { PDFDocument } from 'pdf-lib';
// import * as express from 'express';

// @Controller('pdf')
// export class PdfController {
//   @Post('upload')
//   @UseInterceptors(
//     FileInterceptor('file', {
//       storage: diskStorage({
//         destination: './pdf-storage',
//         filename: (req, file, cb) => {
//           const filename = `${Date.now()}-${file.originalname}`;
//           cb(null, filename);
//         },
//       }),
//     }),
//   )
//   async uploadPdf(
//     @UploadedFile() file: Express.Multer.File,
//     @Body('signature') signatureData: string,
//     @Res() res: express.Response,
//   ) {
//     if (!file) {
//       return res.status(400).json({ message: 'No file uploaded' });
//     }

//     try {
//       // Load the uploaded PDF
//       const pdfBytes = fs.readFileSync(file.path);
//       const pdfDoc = await PDFDocument.load(pdfBytes);

//       // Decode signature image from base64
//       const signatureBuffer = Buffer.from(
//         signatureData.replace(/^data:image\/\w+;base64,/, ''),
//         'base64',
//       );

//       // Determine image format based on data URL prefix
//       let signatureImage;
//       if (signatureData.startsWith('data:image/png')) {
//         signatureImage = await pdfDoc.embedPng(signatureBuffer);
//       } else if (signatureData.startsWith('data:image/jpeg')) {
//         signatureImage = await pdfDoc.embedJpg(signatureBuffer);
//       } else {
//         throw new Error('Unsupported image format');
//       }

//       // Get the first page and draw the signature
//       const pages = pdfDoc.getPages();
//       const firstPage = pages[0];
//       const signatureDims = signatureImage.scale(0.25);
//       firstPage.drawImage(signatureImage, {
//         x: 100, // Adjust position as needed
//         y: 100,
//         width: signatureDims.width,
//         height: signatureDims.height,
//       });

//       // Save the updated PDF
//       const signedPdfBytes = await pdfDoc.save();
//       const signedPdfBuffer = Buffer.from(signedPdfBytes);

//       // Set proper headers and send the signed PDF as a download
//       res.set({
//         'Content-Type': 'application/pdf',
//         'Content-Disposition': `attachment; filename="signed-${file.filename}"`,
//         'Content-Length': signedPdfBuffer.length,
//       });

//       return res.send(signedPdfBuffer);
//     } catch (error) {
//       console.error('Error processing PDF:', error);
//       return res.status(500).json({ message: 'Error processing PDF' });
//     }
//   }
// }

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
import * as fs from 'fs';
import { PDFDocument } from 'pdf-lib';
import * as express from 'express';
import * as nodemailer from 'nodemailer';

@Controller('pdf') // Defines the controller for the '/pdf' route
export class PdfController {
  
  @Post('upload') // Handles HTTP POST requests at '/pdf/upload'
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './pdf-storage', // Directory to store uploaded files
        filename: (req, file, cb) => {
          // Generate a unique filename with a timestamp
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
  )
  async uploadPdf(
    @UploadedFile() file: Express.Multer.File, // Extract the uploaded file
    @Body('signature') signatureData: string, // Extract the base64-encoded signature data
    @Body('email') email: string, // Extract the recipient's email
    @Res() res: express.Response, // Access the response object for custom responses
  ) {
    if (!file) {
      // Return error if no file is uploaded
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      // Load the uploaded PDF from the file system
      const pdfBytes = fs.readFileSync(file.path);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Decode the signature image from base64 format
      const signatureBuffer = Buffer.from(
        signatureData.replace(/^data:image\/\w+;base64,/, ''), // Remove the base64 prefix
        'base64',
      );

      let signatureImage;
      if (signatureData.startsWith('data:image/png')) {
        // Embed a PNG signature image
        signatureImage = await pdfDoc.embedPng(signatureBuffer);
      } else if (signatureData.startsWith('data:image/jpeg')) {
        // Embed a JPEG signature image
        signatureImage = await pdfDoc.embedJpg(signatureBuffer);
      } else {
        throw new Error('Unsupported image format'); // Handle unsupported image formats
      }

      // Get the first page of the PDF
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Scale and position the signature image on the page
      const signatureDims = signatureImage.scale(0.25);
      firstPage.drawImage(signatureImage, {
        x: 100, // X-coordinate of the signature
        y: 100, // Y-coordinate of the signature
        width: signatureDims.width,
        height: signatureDims.height,
      });

      // Save the updated PDF with the signature
      const signedPdfBytes = await pdfDoc.save();
      const signedPdfPath = `./pdf-storage/signed-${file.filename}`;
      fs.writeFileSync(signedPdfPath, signedPdfBytes); // Save the signed PDF locally

      // Configure the email transporter using Gmail
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'your-email@gmail.com', // Replace with your Gmail account
          pass: 'your-app-password', // Use an app-specific password
        },
      });

      // Define the email options
      const mailOptions = {
        from: 'your-email@gmail.com', // Sender's email
        to: email, // Recipient's email
        subject: 'Signed PDF Document', // Email subject
        text: 'Please find the signed document attached.', // Email body
        attachments: [
          {
            filename: `signed-${file.filename}`, // Attach the signed PDF
            path: signedPdfPath, // Path to the file
          },
        ],
      };

      // Send the email with the signed PDF attachment
      await transporter.sendMail(mailOptions);

      // Set headers to serve the signed PDF as a download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="signed-${file.filename}"`,
      });

      return res.send(signedPdfBytes); // Return the signed PDF to the client
    } catch (error) {
      console.error('Error processing PDF:', error);
      return res.status(500).json({ message: 'Error processing PDF' }); // Handle errors
    }
  }
}
