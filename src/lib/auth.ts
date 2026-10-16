import { prisma } from "./prisma.ts";
import bcrypt from "bcryptjs";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
}

export async function authenticateUser(email: string, passwordPlain: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  if (!user) return null;

  const isValid = await bcrypt.compare(passwordPlain, user.passwordHash);
  if (!isValid) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
}

export async function getDefaultUser(): Promise<SessionUser> {
  const user = await prisma.user.findFirst({
    include: { organization: true },
  });
  if (!user) throw new Error("No default user found in database");
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
}