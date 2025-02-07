import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3500); // Start the server on port 3500
  console.log('Server is running on http://localhost:3500');
}
bootstrap();
