import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  TELEGRAM_API_SECRET: z.string().min(1),
  ASISTENCIA_API_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Variables de entorno inválidas");
}

export const env = parsed.data;