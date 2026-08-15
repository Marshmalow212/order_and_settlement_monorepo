import {config} from "../src/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/prisma/generated/client";

const connectionString = `${config.database.url}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
  const user = await prisma.user.upsert({
    where: { email: "alice.cane@tingting.com" },
    update: {},
    create: {
      email: "alice.cane@tingting.com",
      name: "Alice Cane",
      password: "alice123",
    },
  });

  if (user) {
    console.log("User created:", user);
  } else {
    console.log("User already exists.");
  }
}


main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });