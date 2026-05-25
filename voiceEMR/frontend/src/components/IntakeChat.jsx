import { useMemo } from 'react'

const QUESTION_STEPS = [
  '어디가 불편해서 오셨어요?',
  '증상은 언제부터 시작됐나요?',
  '통증/분비물/열 같은 동반 증상이 있나요?',
  '최근 감기 증상이나 복용 약이 있나요?'
]

export default function IntakeChat({ transcript }) {
  const bubbles = useMemo(() => transcript.split('\n').filter(Boolean), [transcript])

  return (
    <section className="rounded-3xl bg-[#d8e6fb] p-6 shadow-lg">
      <h2 className="mb-5 text-2xl font-bold">환자 스마트 문진</h2>
      <div className="space-y-3 rounded-2xl bg-white/60 p-4">
        {QUESTION_STEPS.map((q) => (
          <div key={q} className="rounded-xl bg-slate-700 p-3 text-white">{q}</div>
        ))}
      </div>

      <h3 className="mt-6 text-lg font-semibold">실시간 대화 스크립트</h3>
      <div className="mt-3 max-h-[260px] space-y-2 overflow-auto rounded-2xl border border-slate-200 bg-white p-4">
        {bubbles.length === 0 && <p className="text-slate-500">대화 내용을 입력하면 여기에 표시됩니다.</p>}
        {bubbles.map((line, idx) => (
          <p key={`${line}-${idx}`} className="rounded-lg bg-slate-100 px-3 py-2 text-sm leading-6">
            {line}
          </p>
        ))}
      </div>
    </section>
  )
}
