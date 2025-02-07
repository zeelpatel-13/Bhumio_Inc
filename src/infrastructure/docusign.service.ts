// import { Injectable } from '@nestjs/common';
// import * as docusign from 'docusign-esign';
// import * as fs from 'fs';

// @Injectable()
// export class DocuSignService {
//   private client = new docusign.ApiClient();
//   private integratorKey = 'e65acbd3-8f67-4fa0-854a-ab145b33907a	'; // Replace with your integration key
//   private userId = '3a0b0c8a-eb28-4005-9ecd-851c7819b392'; // Replace with your user ID
//   private secretKey = '7d7103bd-8854-4bab-8e18-084d5ac86d11'; // Replace with your secret key

//   constructor() {
//     this.client.setBasePath('https://demo.docusign.net/restapi');
//     this.client.addDefaultHeader('Authorization', `Bearer ${this.secretKey}`);
//   }

//   async createEnvelope(
//     filePath: string,
//   ): Promise<docusign.EnvelopeSummary | unknown> {
//     const envelopeDefinition = new docusign.EnvelopeDefinition();
//     envelopeDefinition.emailSubject = 'Please sign this document';
//     envelopeDefinition.status = 'sent'; // Status as 'sent' to send for signing

//     // Document setup (simple example)
//     const document = new docusign.Document();
//     document.documentBase64 = this.encodeFileToBase64(filePath);
//     document.name = 'Test Document';
//     document.fileExtension = 'pdf';
//     document.documentId = '1';

//     envelopeDefinition.documents = [document];

//     const recipients = new docusign.Recipients();
//     recipients.signers = [
//       {
//         email: 'signer@example.com', // Signer email
//         name: 'Signer Name', // Signer name
//         recipientId: '1',
//         routingOrder: '1',
//       },
//     ];

//     envelopeDefinition.recipients = recipients;

//     const envelopesApi = new docusign.EnvelopesApi(this.client);

//     try {
//       const results = await envelopesApi.createEnvelope(this.userId, {
//         envelopeDefinition,
//       });

//       // Return the result as the correct type (EnvelopeSummary)
//       return results as docusign.EnvelopeSummary;
//     } catch (error) {
//       console.error('Error creating envelope:', error);
//       throw error; // Or handle the error as needed
//     }
//   }

//   private encodeFileToBase64(filePath: string): string {
//     const file = fs.readFileSync(filePath);
//     return file.toString('base64');
//   }
// }

import { Injectable } from '@nestjs/common';
import * as docusign from 'docusign-esign';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocuSignService {
  private client = new docusign.ApiClient();
  private integratorKey = 'e65acbd3-8f67-4fa0-854a-ab145b33907a	'; // Replace with your integration key
  private userId = '3a0b0c8a-eb28-4005-9ecd-851c7819b392'; // Replace with your user ID
  private secretKey = '7d7103bd-8854-4bab-8e18-084d5ac86d11'; // Replace with your secret key

  constructor() {
    this.client.setBasePath('https://demo.docusign.net/restapi');
    this.client.addDefaultHeader('Authorization', `Bearer ${this.secretKey}`);
  }

  async createEnvelope(filePath: string): Promise<string> {
    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = 'Please sign this document';
    envelopeDefinition.status = 'sent';

    const document = new docusign.Document();
    document.documentBase64 = this.encodeFileToBase64(filePath);
    document.name = 'Uploaded Document';
    document.fileExtension = 'pdf';
    document.documentId = '1';

    envelopeDefinition.documents = [document];

    const recipients = new docusign.Recipients();
    recipients.signers = [
      {
        email: 'signer@example.com',
        name: 'Signer Name',
        recipientId: '1',
        routingOrder: '1',
        tabs: {
          signHereTabs: [
            {
              xPosition: '150',
              yPosition: '250',
              documentId: '1',
              pageNumber: '1',
            },
          ],
        },
      },
    ];

    envelopeDefinition.recipients = recipients;

    const envelopesApi = new docusign.EnvelopesApi(this.client);

    try {
      const result = await envelopesApi.createEnvelope(this.userId, {
        envelopeDefinition,
      });
      return result.envelopeId;
    } catch (error) {
      console.error('Error creating envelope:', error);
      throw error;
    }
  }

  async downloadSignedDocument(envelopeId: string): Promise<Buffer> {
    const envelopesApi = new docusign.EnvelopesApi(this.client);

    try {
      const result = await envelopesApi.getDocument(
        this.userId,
        envelopeId,
        '1',
      );
      return result;
    } catch (error) {
      console.error('Error downloading signed document:', error);
      throw error;
    }
  }

  private encodeFileToBase64(filePath: string): string {
    return fs.readFileSync(filePath, { encoding: 'base64' });
  }
}
