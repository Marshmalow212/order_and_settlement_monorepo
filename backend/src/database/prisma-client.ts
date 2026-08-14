import { PrismaClient } from '../prisma/generated/client.js'
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from '../config.js';

const connectionString = config.database.url;

const adapter = new PrismaPg({connectionString,
    ssl:{
        rejectUnauthorized: false
    }
});
const prisma = new PrismaClient({ adapter });

export { prisma };
