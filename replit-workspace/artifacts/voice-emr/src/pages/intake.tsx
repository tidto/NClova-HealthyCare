import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowRight, CheckCircle2, Clock3, FileCheck2, Info, LoaderCircle, Mic2, RotateCcw, Sparkles, UserRound } from 'lucide-react';
import { useCreateEmrIntake, getGetEmrSummaryQueryKey, getListEmrRecordsQueryKey, type EmrRecord, type IntakeInput } from '@workspace/api-client-react';
import { SummaryStrip } from '@/components/voice-shell';

function formatDate(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function KeywordChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#d5e7e2] bg-[#f4faf8] px-2.5 py-1.5 text-xs font-medium text-[#397369]" data-testid={`keyword-${label}`}>
      <span className="text-[#8baaa5]">{label}</span>
      <span className="font-bold text-[#216e64]">{value}</span>
    </span>
  );
}

function ReviewPane({ record }: { record: EmrRecord | null }) {
  if (!record) {
    return (
      <section className="relative flex min-h-[510px] flex-col overflow-hidden rounded-2xl border border-[#d9e5e3] bg-[#f7fbfa] p-6 sm:p-8" data-testid="review-empty-state">
        <div className="absolute right-[-30px] top-[-44px] h-40 w-40 rounded-full border-[20px] border-[#e6f2ef]" />
        <div className="absolute bottom-[-58px] left-[-36px] h-48 w-48 rounded-full border-[24px] border-[#edf5f4]" />
        <div className="relative flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#dff1eb] text-[#2e8e7c]">
            <FileCheck2 size={29} strokeWidth={1.7} />
          </div>
          <p className="eyebrow mt-6">Review canvas</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-[-0.03em] text-[#18343b]">검토할 초안이 여기에 표시됩니다</h2>
          <p className="mt-3 max-w-[300px] text-sm leading-7 text-[#6c8888]">
            환자 정보와 대화 내용을 입력하면, 원문을 보존한 구조화 초안을 생성합니다.
          </p>
          <div className="mt-8 flex items-center gap-2 rounded-full border border-[#d8e8e4] bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#65827f]">
            <Info size={14} className="text-[#3aa892]" />
            저장 전 의료진 검토
          </div>
        </div>
      </section>
    );
  }

  const keywordEntries = Object.entries(record.keywords ?? {});
  return (
    <section className="overflow-hidden rounded-2xl border border-[#b9ddd3] bg-[#fbfdfc] shadow-[0_14px_35px_rgba(42,111,99,0.08)]" data-testid={`review-record-${record.recordId}`}>
      <div className="border-b border-[#dcebe7] bg-[#eef8f5] px-6 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#2b8d7c]">
              <CheckCircle2 size={17} />
              <span className="text-xs font-bold">초안 생성 완료 · 검토 필요</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-[-0.03em] text-[#18343b]">구조화된 진료 초안</h2>
          </div>
          <span className="mono rounded-md bg-white/75 px-2 py-1 text-[10px] text-[#668681]">#{record.recordId}</span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#67827f]">
          <span className="flex items-center gap-1.5"><UserRound size={14} />{record.patientName}</span>
          <span>{formatDate(record.birthDate)}</span>
          <span className="flex items-center gap-1.5"><Clock3 size={14} />{record.duration || '시간 미상'}</span>
        </div>
      </div>
      <div className="space-y-6 px-6 py-6 sm:px-7">
        <div>
          <p className="eyebrow">01 · Chief complaint</p>
          <p className="mt-2 text-[15px] font-bold leading-7 text-[#254a4b]" data-testid="text-review-cc">{record.cc || '주호소가 추출되지 않았습니다.'}</p>
        </div>
        <div>
          <p className="eyebrow">02 · Present illness</p>
          <p className="mt-2 text-sm leading-7 text-[#4f6e70]" data-testid="text-review-present-illness">{record.presentIllness || '현병력 내용이 추출되지 않았습니다.'}</p>
        </div>
        {keywordEntries.length > 0 && (
          <div>
            <p className="eyebrow">03 · Keywords</p>
            <div className="mt-3 flex flex-wrap gap-2" data-testid="keywords-list">
              {keywordEntries.map(([label, value]) => <KeywordChip key={label} label={label} value={value} />)}
            </div>
          </div>
        )}
        <div className="border-t border-[#e3ecea] pt-5">
          <div className="flex items-center justify-between gap-4">
            <p className="eyebrow">Original transcript</p>
            <span className="text-[11px] font-medium text-[#8ba1a0]">원문 보존 · {record.transcript.length.toLocaleString()}자</span>
          </div>
          <p className="mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#f4f8f7] p-4 text-[13px] leading-6 text-[#607b7b]" data-testid="text-review-transcript">{record.transcript}</p>
        </div>
      </div>
    </section>
  );
}

export default function IntakePage() {
  const queryClient = useQueryClient();
  const [createdRecord, setCreatedRecord] = useState<EmrRecord | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const createIntake = useCreateEmrIntake();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<IntakeInput>({
    defaultValues: { patientName: '', birthDate: '', transcript: '' },
  });
  const transcript = watch('transcript') || '';
  const transcriptLength = useMemo(() => transcript.length, [transcript]);

  useEffect(() => {
    if (!createIntake.isSuccess) return;
    const timer = window.setTimeout(() => setSuccessMessage(''), 5000);
    return () => window.clearTimeout(timer);
  }, [createIntake.isSuccess]);

  const onSubmit = (data: IntakeInput) => {
    setSuccessMessage('');
    createIntake.mutate(
      { data: { patientName: data.patientName.trim(), birthDate: data.birthDate, transcript: data.transcript.trim() } },
      {
        onSuccess: (record) => {
          setCreatedRecord(record);
          setSuccessMessage('초안을 저장했습니다. 오른쪽 결과를 검토해 주세요.');
          queryClient.invalidateQueries({ queryKey: getListEmrRecordsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetEmrSummaryQueryKey() });
        },
      },
    );
  };

  const clearForm = () => {
    reset();
    setCreatedRecord(null);
    setSuccessMessage('');
    createIntake.reset();
  };

  return (
    <div className="mx-auto w-full max-w-[1480px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <div className="fade-up flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <p className="eyebrow flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#ee956e]" />Clinician intake</p>
          <h1 className="mt-3 max-w-[700px] text-[clamp(2rem,4vw,3.45rem)] font-extrabold leading-[1.12] tracking-[-0.065em] text-[#18343b]">
            대화를 놓치지 않는<br /><span className="text-[#2e9581]">진료 기록의 시작</span>
          </h1>
          <p className="mt-4 max-w-[590px] text-sm leading-7 text-[#668183] sm:text-[15px]">
            환자와의 대화를 원문 그대로 남기고, 검토 가능한 EMR 초안으로 정리합니다.
          </p>
        </div>
        <div className="w-full shrink-0 rounded-2xl bg-[#18343b] p-4 shadow-[0_12px_30px_rgba(24,52,59,0.12)] xl:max-w-[408px]">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="flex items-center gap-2 text-xs font-bold text-[#d3e8e2]"><Sparkles size={14} className="text-[#64c5ae]" />Workspace pulse</span>
            <span className="mono text-[9px] text-[#7ea29d]">LIVE SUMMARY</span>
          </div>
          <SummaryStrip />
        </div>
      </div>

      <div className="mt-9 grid gap-6 xl:grid-cols-[minmax(360px,0.82fr)_minmax(520px,1.18fr)]">
        <section className="fade-up fade-up-delay-1 rounded-2xl border border-[#d9e5e3] bg-[#fbfcfa] p-6 shadow-[0_10px_30px_rgba(42,93,91,0.04)] sm:p-7" data-testid="intake-form-card">
          <div className="flex items-start justify-between gap-4 border-b border-[#e2ebe9] pb-5">
            <div>
              <p className="eyebrow">Step 01</p>
              <h2 className="mt-1.5 text-lg font-extrabold tracking-[-0.03em] text-[#18343b]">환자와 대화 기록하기</h2>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e4f3ef] text-[#2e8e7c]"><Mic2 size={18} /></div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label htmlFor="patientName" className="mb-2 block text-xs font-bold text-[#385c5d]">환자 이름</label>
              <input id="patientName" data-testid="input-patient-name" className="field-control h-12 px-3.5 text-sm" placeholder="이름을 입력하세요" aria-invalid={errors.patientName ? 'true' : 'false'} {...register('patientName', { required: '환자 이름을 입력해 주세요.', maxLength: { value: 50, message: '이름은 50자 이내로 입력해 주세요.' } })} />
              {errors.patientName && <p className="mt-1.5 flex items-center gap-1 text-xs text-[#bd6257]" data-testid="error-patient-name"><AlertCircle size={12} />{errors.patientName.message}</p>}
            </div>
            <div>
              <label htmlFor="birthDate" className="mb-2 block text-xs font-bold text-[#385c5d]">생년월일</label>
              <input id="birthDate" type="date" data-testid="input-birth-date" className="field-control h-12 px-3.5 text-sm" aria-invalid={errors.birthDate ? 'true' : 'false'} {...register('birthDate', { required: '생년월일을 선택해 주세요.' })} />
              {errors.birthDate && <p className="mt-1.5 flex items-center gap-1 text-xs text-[#bd6257]" data-testid="error-birth-date"><AlertCircle size={12} />{errors.birthDate.message}</p>}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="transcript" className="block text-xs font-bold text-[#385c5d]">대화 원문</label>
                <span className={`mono text-[10px] ${transcriptLength > 19000 ? 'text-[#bd6257]' : 'text-[#8aa09f]'}`} data-testid="text-transcript-count">{transcriptLength.toLocaleString()} / 20,000</span>
              </div>
              <textarea id="transcript" data-testid="input-transcript" rows={10} className="field-control resize-y p-3.5 text-sm leading-6" placeholder="환자와의 대화를 붙여넣어 주세요.&#10;&#10;예: 언제부터 어떤 증상이 있었나요?" aria-invalid={errors.transcript ? 'true' : 'false'} {...register('transcript', { required: '대화 원문을 입력해 주세요.', maxLength: { value: 20000, message: '대화 원문은 20,000자 이내로 입력해 주세요.' } })} />
              {errors.transcript && <p className="mt-1.5 flex items-center gap-1 text-xs text-[#bd6257]" data-testid="error-transcript"><AlertCircle size={12} />{errors.transcript.message}</p>}
              <p className="mt-2 text-[11px] leading-5 text-[#82999a]">원문은 구조화 결과와 함께 보존되어, 검토 시 언제든 대조할 수 있습니다.</p>
            </div>

            {createIntake.isError && (
              <div className="flex gap-2.5 rounded-xl border border-[#f0c9bf] bg-[#fff3ef] p-3.5 text-xs leading-5 text-[#a44f45]" role="alert" data-testid="status-create-error">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>초안을 만들지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.</span>
              </div>
            )}
            {successMessage && (
              <div className="flex gap-2.5 rounded-xl border border-[#b8ded3] bg-[#eff9f5] p-3.5 text-xs leading-5 text-[#287566]" role="status" data-testid="status-create-success">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}
            <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row">
              <button type="button" onClick={clearForm} data-testid="button-clear-intake" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#d4e2e0] px-4 text-sm font-bold text-[#648081] transition-colors hover:bg-[#f1f7f5]">
                <RotateCcw size={15} /> 새로 입력
              </button>
              <button type="submit" disabled={createIntake.isPending} data-testid="button-create-draft" className="group inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2e9581] px-5 text-sm font-extrabold text-white shadow-[0_7px_16px_rgba(46,149,129,0.2)] transition-all hover:bg-[#217d70] disabled:cursor-not-allowed disabled:opacity-65">
                {createIntake.isPending ? <><LoaderCircle size={16} className="animate-spin" /> 대화 분석 중...</> : <>초안 만들고 저장하기 <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>}
              </button>
            </div>
          </form>
        </section>

        <div className="fade-up fade-up-delay-2">
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2"><span className="eyebrow">Step 02</span><span className="text-[#a6b8b6]">/</span><span className="text-xs font-bold text-[#668183]">Review boundary</span></div>
            {createdRecord && <span className="flex items-center gap-1.5 text-xs font-semibold text-[#2e8e7c]" data-testid="status-review-ready"><span className="h-1.5 w-1.5 rounded-full bg-[#3aa892]" />검토 가능</span>}
          </div>
          <ReviewPane record={createdRecord} />
        </div>
      </div>
    </div>
  );
}
