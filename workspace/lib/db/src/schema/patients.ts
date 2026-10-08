import { date, pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  patientId: serial("patient_id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  birthDate: date("birth_date", { mode: "string" }).notNull(),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({
  patientId: true,
});
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;