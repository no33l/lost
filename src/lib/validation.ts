import { z } from "zod";

export const emailSchema = z
  .string({ required_error: "E-Mail-Adresse fehlt." })
  .trim()
  .toLowerCase()
  .email("Bitte gib eine gültige E-Mail-Adresse an.");

export const passwordSchema = z
  .string({ required_error: "Passwort fehlt." })
  .min(8, "Mindestens 8 Zeichen.")
  .max(200, "Maximal 200 Zeichen.");

export const displayNameSchema = z
  .string({ required_error: "Name fehlt." })
  .trim()
  .min(2, "Mindestens 2 Zeichen.")
  .max(60, "Maximal 60 Zeichen.");
