import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './roles/schemas/role.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const usersService = app.get(UsersService);
  const config = app.get(ConfigService);
  const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));

  console.log('🚀 Starting role and user seeding...');

  // --- 1️⃣ Ensure roles exist ---
  const adminRole = await roleModel.findOneAndUpdate(
    { name: 'Admin' },
    { name: 'Admin', description: 'System administrator with full access' },
    { upsert: true, new: true },
  );

  const devRole = await roleModel.findOneAndUpdate(
    { name: 'Developer' },
    { name: 'Developer', description: 'Standard developer role with limited access' },
    { upsert: true, new: true },
  );

  // --- 2️⃣ Read credentials from .env or defaults ---
  const adminEmail = config.get<string>('ADMIN_EMAIL') || 'admin@system.local';
  const adminPassword = config.get<string>('ADMIN_PASSWORD') || 'password123';
  const devEmail = config.get<string>('DEV_EMAIL') || 'dev@system.local';
  const devPassword = config.get<string>('DEV_PASSWORD') || 'dev12345';

  // --- 3️⃣ Create users if missing ---
  const existingAdmin = await usersService.userModel.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await usersService.createUser('System Admin', adminEmail, adminPassword, adminRole.name);
    console.log(`✅ Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`✅ Admin already exists: ${adminEmail}`);
  }

  const existingDev = await usersService.userModel.findOne({ email: devEmail });
  if (!existingDev) {
    await usersService.createUser('Default Developer', devEmail, devPassword, devRole.name);
    console.log(`✅ Developer created: ${devEmail} / ${devPassword}`);
  } else {
    console.log(`✅ Developer already exists: ${devEmail}`);
  }

  console.log('🌱 Role & user seeding complete!');
  await app.close();
}

bootstrap().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
