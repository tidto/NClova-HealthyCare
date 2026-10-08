import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowUpRight, CalendarDays, CheckCircle2, ChevronRight, Clock3, FileText, Inbox, Mic2, RefreshCw, UserRound } from 'lucide-react';
import { Link } from 'wouter';
import { getGetEmrRecordQueryKey, useGetEmrRecord, useListEmrRecords, type EmrRecord } from '@workspace/api-client-react';

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '날짜 미상';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatBirthDate(value: string) {
  if (!value) return '생년월일 미상';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function DetailPanel({ record, isLoading, isError, onRetry }: { record?: EmrRecord; isLoading: boolean; isError: boolean; onRetry: () => void }) {
  if (isLoading) {
    return (
      <div className="space-y-5 rounded-2xl border border-[#d9e5e3] bg-[#fbfcfa] p-6 sm:p-8" data-testid="record-detail-loading">
        <div className="skeleton h-5 w-28 rounded" /><div className="skeleton h-9 w-64 rounded" /><div className="skeleton h-20 w-full rounded-xl" /><div className="skeleton h-36 w-full rounded-xl" />
      </div>
    );
  }
  if (isError || !record) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-[#e6d6d1] bg-[#fffaf8] p-8 text-center" data-testid="record-detail-error">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbe8e2] text-[#bd6257]"><AlertCircle size={22} /></div>
        <h2 className="mt-4 text-base font-extrabold text-[#4e3635]">기록을 불러오지 못했습니다</h2>
        <p className="mt-2 text-sm text-[#876c69]">잠시 후 다시 시도해 주세요.</p>
        <button type="button" onClick={onRetry} data-testid="button-retry-detail" className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4c5bd] bg-white px-4 text-xs font-bold text-[#a6534a] hover:bg-[#fff2ee]"><RefreshCw size={14} /> 다시 시도</button>
      </div>
    );
  }
  const keywords = Object.entries(record.keywords ?? {});
  return (
    <article className="overflow-hidden rounded-2xl border border-[#d9e5e3] bg-[#fbfcfa] shadow-[0_10px_30px_rgba(42,93,91,0.04)]" data-testid={`record-detail-${record.recordId}`}>
      <div className="border-b border-[#dcebe7] bg-[#eef8f5] px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="eyebrow">Record detail · #{record.recordId}</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.045em] text-[#18343b]" data-testid="text-detail-patient-name">{record.patientName}</h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[#65827f]">
              <span className="flex items-center gap-1.5"><CalendarDays size={13} />{formatBirthDate(record.birthDate)}</span>
              <span className="flex items-center gap-1.5"><Clock3 size={13} />{record.duration || '시간 미상'}</span>
              <span className="flex items-center gap-1.5"><FileText size={13} />{formatDateTime(record.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-[#b7ded3] bg-white/80 px-3 py-1.5 text-[11px] font-bold text-[#2b846f]"><CheckCircle2 size={14} />검토 대기 초안</div>
        </div>
      </div>
      <div className="space-y-7 px-6 py-7 sm:px-8">
        <section>
          <div className="flex items-center justify-between"><p className="eyebrow">Chief complaint</p><span className="text-[10px] text-[#9bb0ae]">주호소</span></div>
          <p className="mt-2 text-[15px] font-bold leading-7 text-[#254a4b]" data-testid="text-detail-cc">{record.cc || '주호소 내용이 없습니다.'}</p>
        </section>
        <section>
          <div className="flex items-center justify-between"><p className="eyebrow">Present illness</p><span className="text-[10px] text-[#9bb0ae]">현병력</span></div>
          <p className="mt-2 text-sm leading-7 text-[#4f6e70]" data-testid="text-detail-present-illness">{record.presentIllness || '현병력 내용이 없습니다.'}</p>
        </section>
        {keywords.length > 0 && (
          <section>
            <p className="eyebrow">Keywords</p>
            <div className="mt-3 flex flex-wrap gap-2" data-testid="detail-keywords-list">{keywords.map(([key, value]) => <span key={key} className="rounded-lg bg-[#f1f7f5] px-2.5 py-1.5 text-xs font-bold text-[#397369]">{key}: <span className="font-medium">{value}</span></span>)}</div>
          </section>
        )}
        <section className="border-t border-[#e2ebe9] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2"><p className="eyebrow">Original transcript</p><span className="text-[11px] text-[#91a5a3]" data-testid="text-detail-transcript-length">{record.transcript.length.toLocaleString()}자 · 원문 보존</span></div>
          <div className="mt-3 max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#f4f8f7] p-4 text-[13px] leading-7 text-[#607b7b]" data-testid="text-detail-transcript">{record.transcript}</div>
        </section>
      </div>
    </article>
  );
}

export default function RecordsPage() {
  const recordsQuery = useListEmrRecords({ limit: 50 });
  const records = recordsQuery.data ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (records.length === 0) {
      setSelectedId(null);
      return;
    }
    if (selectedId === null || !records.some((record) => record.recordId === selectedId)) setSelectedId(records[0].recordId);
  }, [records, selectedId]);

  const detailQuery = useGetEmrRecord(selectedId ?? 0, {
    query: {
      enabled: selectedId !== null,
      queryKey: getGetEmrRecordQueryKey(selectedId ?? 0),
    },
  });

  const groupedLabel = useMemo(() => {
    if (!records.length) return '';
    const firstDate = new Date(records[0].createdAt);
    if (Number.isNaN(firstDate.getTime())) return '최근 기록';
    return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(firstDate);
  }, [records]);

  return (
    <div className="mx-auto w-full max-w-[1480px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <div className="fade-up flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#ee956e]" />Record library</p>
          <h1 className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-[1.1] tracking-[-0.065em] text-[#18343b]">최근 진료 기록</h1>
          <p className="mt-3 max-w-[620px] text-sm leading-7 text-[#668183]">생성된 초안을 다시 열어 원문과 구조화 내용을 나란히 확인하세요.</p>
        </div>
        <Link href="/" data-testid="link-new-record-from-library" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2e9581] px-4 text-sm font-extrabold text-white shadow-[0_7px_16px_rgba(46,149,129,0.18)] transition-colors hover:bg-[#217d70]"><Mic2 size={16} /> 새 기록 만들기</Link>
      </div>

      {recordsQuery.isLoading ? (
        <div className="mt-9 grid gap-6 lg:grid-cols-[minmax(290px,0.78fr)_minmax(500px,1.22fr)]">
          <div className="space-y-3 rounded-2xl border border-[#d9e5e3] bg-[#fbfcfa] p-4"><div className="skeleton h-5 w-24 rounded" /><div className="skeleton h-16 w-full rounded-xl" /><div className="skeleton h-16 w-full rounded-xl" /><div className="skeleton h-16 w-full rounded-xl" /></div>
          <DetailPanel record={undefined} isLoading isError={false} onRetry={() => undefined} />
        </div>
      ) : recordsQuery.isError ? (
        <div className="mt-9 flex min-h-[330px] flex-col items-center justify-center rounded-2xl border border-[#e6d6d1] bg-[#fffaf8] p-8 text-center" data-testid="records-list-error">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fbe8e2] text-[#bd6257]"><AlertCircle size={22} /></div>
          <h2 className="mt-4 text-base font-extrabold text-[#4e3635]">기록 목록을 불러오지 못했습니다</h2>
          <p className="mt-2 text-sm text-[#876c69]">네트워크 상태를 확인하고 다시 시도해 주세요.</p>
          <button type="button" onClick={() => recordsQuery.refetch()} data-testid="button-retry-records" className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-[#e4c5bd] bg-white px-4 text-xs font-bold text-[#a6534a] hover:bg-[#fff2ee]"><RefreshCw size={14} /> 다시 시도</button>
        </div>
      ) : records.length === 0 ? (
        <div className="fade-up mt-9 flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#b9d5cf] bg-[#f7fbfa] p-8 text-center" data-testid="records-empty-state">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#dff1eb] text-[#2e8e7c]"><Inbox size={29} strokeWidth={1.7} /></div>
          <p className="eyebrow mt-6">Nothing filed yet</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-[-0.03em] text-[#18343b]">첫 번째 기록을 남겨보세요</h2>
          <p className="mt-3 max-w-[330px] text-sm leading-7 text-[#6c8888]">환자와의 대화를 입력하면 검토 가능한 초안으로 정리해 드립니다.</p>
          <Link href="/" data-testid="link-create-first-record" className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-[#2e9581] px-5 text-sm font-extrabold text-white hover:bg-[#217d70]"><Mic2 size={16} /> 새 기록 만들기</Link>
        </div>
      ) : (
        <div className="mt-9 grid items-start gap-6 lg:grid-cols-[minmax(290px,0.78fr)_minmax(500px,1.22fr)]">
          <section className="fade-up fade-up-delay-1 rounded-2xl border border-[#d9e5e3] bg-[#fbfcfa] p-4 shadow-[0_10px_30px_rgba(42,93,91,0.04)]" data-testid="records-list">
            <div className="flex items-center justify-between px-2 pb-3">
              <div><p className="eyebrow">Filed drafts</p><p className="mt-1 text-sm font-extrabold text-[#315759]">{records.length}개의 초안</p></div>
              <span className="mono text-[10px] text-[#94a9a6]">{groupedLabel}</span>
            </div>
            <div className="space-y-2">
              {records.map((record) => (
                <button type="button" key={record.recordId} onClick={() => setSelectedId(record.recordId)} data-testid={`button-select-record-${record.recordId}`} className={`record-row flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left ${selectedId === record.recordId ? 'is-selected' : 'border-transparent'}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5f2ef] text-[#368b7d]"><UserRound size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-[#315759]" data-testid={`text-record-name-${record.recordId}`}>{record.patientName}</p>
                    <p className="mt-1 truncate text-[11px] text-[#7e9694]">{record.cc || '주호소 미상'} · {formatDateTime(record.createdAt)}</p>
                  </div>
                  <ChevronRight size={16} className={selectedId === record.recordId ? 'text-[#2e9581]' : 'text-[#abc0bd]'} />
                </button>
              ))}
            </div>
          </section>
          <div className="fade-up fade-up-delay-2">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2"><span className="eyebrow">Selected record</span><ArrowUpRight size={14} className="text-[#7d9995]" /></div>
              {detailQuery.data && <span className="text-[11px] font-semibold text-[#64817d]" data-testid="status-detail-loaded">원문과 함께 표시 중</span>}
            </div>
            <DetailPanel record={detailQuery.data} isLoading={detailQuery.isLoading} isError={detailQuery.isError} onRetry={() => detailQuery.refetch()} />
          </div>
        </div>
      )}
    </div>
  );
}
