import { Activity, FileText, HeartPulse, Mic2, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useGetEmrSummary } from '@workspace/api-client-react';

type VoiceShellProps = {
  children: React.ReactNode;
};

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#89aaa4]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#edf7f4]" data-testid={`summary-${label}`}>{value}</p>
    </div>
  );
}

export function VoiceShell({ children }: VoiceShellProps) {
  const [location] = useLocation();
  const summaryQuery = useGetEmrSummary();
  const summary = summaryQuery.data;
  const today = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date());

  return (
    <div className="app-shell">
      <aside className="sidebar hidden w-[248px] shrink-0 flex-col px-5 py-6 lg:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#3aa892] text-[#143038] shadow-[0_8px_20px_rgba(58,168,146,0.2)]">
            <Activity size={21} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[15px] font-extrabold tracking-[-0.02em] text-[#f2faf8]">HealthyCare</p>
            <p className="mono text-[9px] tracking-[0.15em] text-[#7ea29d]">VOICE EMR</p>
          </div>
        </div>

        <div className="mt-12">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#638984]">Workspace</p>
          <nav className="mt-3 space-y-1" aria-label="주요 메뉴">
            <Link
              href="/"
              data-testid="link-intake"
              className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${location === '/' ? 'bg-[#28514f] text-[#f4fbf9]' : 'text-[#a8c3be] hover:bg-white/[0.06] hover:text-white'}`}
            >
              <Mic2 size={17} className={location === '/' ? 'text-[#64c5ae]' : 'text-[#789b95]'} />
              새 기록 만들기
              {location === '/' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#ee956e]" />}
            </Link>
            <Link
              href="/records"
              data-testid="link-records"
              className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${location === '/records' ? 'bg-[#28514f] text-[#f4fbf9]' : 'text-[#a8c3be] hover:bg-white/[0.06] hover:text-white'}`}
            >
              <FileText size={17} className={location === '/records' ? 'text-[#64c5ae]' : 'text-[#789b95]'} />
              최근 기록
              {summary && <span className="mono ml-auto text-[10px] text-[#7ea29d]">{summary.totalRecords}</span>}
            </Link>
          </nav>
        </div>

        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-[#2c5753] bg-[#1d4244] p-4">
            <div className="flex items-center gap-2 text-[#a8dcd0]">
              <ShieldCheck size={15} />
              <span className="text-xs font-bold">검토 중심 보조</span>
            </div>
            <p className="mt-2 text-[11px] leading-[1.6] text-[#91b5ae]">
              AI가 만든 초안은 진료 기록으로 저장되기 전, 반드시 의료진의 확인을 거칩니다.
            </p>
          </div>
          <div className="flex items-center gap-3 border-t border-white/10 px-2 pt-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ee956e] text-xs font-extrabold text-[#18343b]">HC</div>
            <div>
              <p className="text-xs font-bold text-[#e5f0ed]">진료 워크스페이스</p>
              <p className="mono mt-0.5 text-[9px] text-[#739691]">{today}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[70px] items-center justify-between border-b border-[#d9e5e3] bg-[#fbfcfa]/90 px-5 backdrop-blur-sm sm:px-8 lg:hidden">
          <Link href="/" data-testid="link-mobile-logo" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#3aa892] text-[#143038]"><Activity size={17} /></div>
            <div><p className="text-sm font-extrabold text-[#18343b]">HealthyCare</p><p className="mono text-[8px] tracking-[0.15em] text-[#638984]">VOICE EMR</p></div>
          </Link>
          <nav className="flex items-center gap-1 rounded-xl bg-[#e8f1ef] p-1" aria-label="모바일 주요 메뉴">
            <Link href="/" data-testid="link-mobile-intake" className={`rounded-lg px-3 py-2 text-xs font-bold ${location === '/' ? 'bg-white text-[#217d70] shadow-sm' : 'text-[#638984]'}`}>새 기록</Link>
            <Link href="/records" data-testid="link-mobile-records" className={`rounded-lg px-3 py-2 text-xs font-bold ${location === '/records' ? 'bg-white text-[#217d70] shadow-sm' : 'text-[#638984]'}`}>최근 기록</Link>
          </nav>
        </header>

        <main className="workspace-grid min-h-[calc(100dvh-70px)] flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export function SummaryStrip() {
  const query = useGetEmrSummary();
  const summary = query.data;
  if (query.isLoading) {
    return <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="skeleton h-[67px] rounded-xl" /><div className="skeleton h-[67px] rounded-xl" /><div className="skeleton h-[67px] rounded-xl" /><div className="skeleton h-[67px] rounded-xl" /></div>;
  }
  if (query.isError || !summary) return null;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="summary-strip">
      <SummaryPill label="전체 기록" value={`${summary.totalRecords}건`} />
      <SummaryPill label="오늘 생성" value={`${summary.todayRecords}건`} />
      <SummaryPill label="모델" value={summary.model} />
      <SummaryPill label="Fallback" value={summary.fallbackEnabled ? '사용 가능' : '꺼짐'} />
    </div>
  );
}
