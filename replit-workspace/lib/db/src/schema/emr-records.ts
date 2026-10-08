import { desc, eq } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

export const emrRecordsTable = pgTable(
  "emr_records",
  {
    recordId: serial("record_id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patientsTable.patientId, { onDelete: "cascade" }),
    ccSymptom: varchar("cc_symptom", { length: 255 }).notNull(),
    duration: varchar("duration", { length: 100 }).notNull(),
    presentIllness: text("present_illness").notNull(),
    symptomKeywords: jsonb("symptom_keywords")
      .$type<Record<string, string>>()
      .notNull(),
    rawTranscript: text("raw_transcript").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    patientIdIdx: index("idx_emr_patient_id").on(table.patientId),
    createdAtIdx: index("idx_emr_created_at").on(desc(table.createdAt)),
    keywordsIdx: index("idx_emr_keywords_gin").using(
      "gin",
      table.symptomKeywords,
    ),
  }),
);

export const insertEmrRecordSchema = createInsertSchema(emrRecordsTable).omit({
  recordId: true,
  createdAt: true,
});
export type InsertEmrRecord = z.infer<typeof insertEmrRecordSchema>;
export type EmrRecord = typeof emrRecordsTable.$inferSelect;

export const emrRecordPatientJoin = eq(
  emrRecordsTable.patientId,
  patientsTable.patientId,
);