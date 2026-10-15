import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

try {
  const name = (process.env.ADMIN_NAME ?? "").trim();
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";

  if (!name || name.length > 120) {
    throw new Error("Provide ADMIN_NAME (1–120 characters).");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Provide a valid ADMIN_EMAIL.");
  }

  if (password.length < 12 || password.length > 128) {
    throw new Error("ADMIN_PASSWORD must be 12–128 characters.");
  }

  const existingAdmin = await prisma.staff.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (existingAdmin) {
    throw new Error(
      "An administrator already exists. This one-time script will not create another.",
    );
  }

  const existingStaff = await prisma.staff.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingStaff) {
    throw new Error(
      "This email already belongs to a staff account. No account was changed.",
    );
  }

  const passwordHash = await hash(password, 12);

  await prisma.staff.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("First administrator created successfully.");
  console.log(`Login email: ${email}`);
  console.log("Password hash stored; plaintext password was not saved.");
} catch (error) {
  console.error(
    "Admin setup failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
