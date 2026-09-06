import { Router, type IRouter } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db, emrRecordsTable, patientsTable } from "@workspace/db";
import {
  CreateEmrIntakeBody,
  GetEmrRecordParams,
  GetEmrRecordResponse,
  GetEmrSummaryResponse,
  ListEmrRecordsQueryParams,
  ListEmrRecordsResponse,
} from "@workspace/api-zod";
import { extractEmrDraft, getAiConfig } from "../lib/emr-ai";

const router: IRouter = Router();

const recordSelection = {
  recordId: emrRecordsTable.recordId,
  patientId: patientsTable.patientId,
  patientName: patientsTable.name,
  birthDate: patientsTable.birthDate,
  cc: emrRecordsTable.ccSymptom,
  duration: emrRecordsTable.duration,
  presentIllness: emrRecordsTable.presentIllness,
  keywords: emrRecordsTable.symptomKeywords,
  transcript: emrRecordsTable.rawTranscript,
  createdAt: emrRecordsTable.createdAt,
};

router.get("/emr/summary", async (req, res): Promise<void> => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalResult, todayResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(emrRecordsTable),
    db
      .select({ count: sql<number>`count(*)` })
      .from(emrRecordsTable)
      .where(gte(emrRecordsTable.createdAt, startOfToday)),
  ]);

  const data = GetEmrSummaryResponse.parse({
    totalRecords: Number(totalResult[0]?.count ?? 0),
    todayRecords: Number(todayResult[0]?.count ?? 0),
    ...getAiConfig(),
  });
  req.log.info({ totalRecords: data.totalRecords }, "EMR summary loaded");
  res.json(data);
});

router.get("/emr/records", async (req, res): Promise<void> => {
  const parsed = ListEmrRecordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const records = await db
    .select(recordSelection)
    .from(emrRecordsTable)
    .innerJoin(patientsTable, eq(emrRecordsTable.patientId, patientsTable.patientId))
    .orderBy(desc(emrRecordsTable.createdAt))
    .limit(parsed.data.limit);
  res.json(ListEmrRecordsResponse.parse(records));
});

router.post("/emr/intake", async (req, res): Promise<void> => {
  const parsed = CreateEmrIntakeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const draft = await extractEmrDraft(parsed.data.transcript);
  const birthDate = parsed.data.birthDate.toISOString().slice(0, 10);
  const created = await db.transaction(async (tx) => {
    const [patient] = await tx
      .insert(patientsTable)
      .values({
        name: parsed.data.patientName.trim(),
        birthDate,
      })
      .returning();

    const [record] = await tx
      .insert(emrRecordsTable)
      .values({
        patientId: patient.patientId,
        ccSymptom: draft.cc,
        duration: draft.duration,
        presentIllness: draft.presentIllness,
        symptomKeywords: draft.keywords,
        rawTranscript: parsed.data.transcript,
      })
      .returning();

    return {
      ...recordSelection,
      recordId: record.recordId,
      patientId: patient.patientId,
      patientName: patient.name,
      birthDate: patient.birthDate,
      cc: record.ccSymptom,
      duration: record.duration,
      presentIllness: record.presentIllness,
      keywords: record.symptomKeywords,
      transcript: record.rawTranscript,
      createdAt: record.createdAt,
    };
  });

  const response = GetEmrRecordResponse.parse(created);
  req.log.info({ recordId: response.recordId }, "EMR draft created");
  res.status(201).json(response);
});

router.get("/emr/records/:recordId", async (req, res): Promise<void> => {
  const params = GetEmrRecordParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db
    .select(recordSelection)
    .from(emrRecordsTable)
    .innerJoin(patientsTable, eq(emrRecordsTable.patientId, patientsTable.patientId))
    .where(eq(emrRecordsTable.recordId, params.data.recordId));

  if (!record) {
    res.status(404).json({ error: "EMR record not found" });
    return;
  }

  res.json(GetEmrRecordResponse.parse(record));
});

export default router;