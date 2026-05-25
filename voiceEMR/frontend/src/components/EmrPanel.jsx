export default function EmrPanel({ emr }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-lg">
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-extrabold">CLOVA Voice EMR 스타일 요약</h2>
        <p className="mt-1 text-sm text-slate-500">AI가 구조화한 CC / D / PL / Keywords</p>
      </div>

      <div className="grid grid-cols-[120px_1fr] gap-y-5 text-lg">
        <span className="font-semibold">CC</span>
        <span className="font-bold text-primary">{emr?.cc ?? '-'}</span>

        <span className="font-semibold">D</span>
        <span className="font-bold">{emr?.duration ?? '-'}</span>

        <span className="font-semibold">PL</span>
        <span className="leading-8">{emr?.presentIllness ?? '-'}</span>
      </div>

      <div className="mt-8 rounded-2xl bg-panel p-4">
        <h3 className="text-lg font-bold">Symptom Keywords</h3>
        <ul className="mt-3 space-y-2">
          {!emr?.keywords && <li className="text-slate-500">아직 추출된 키워드가 없습니다.</li>}
          {emr?.keywords && Object.entries(emr.keywords).map(([key, value]) => (
            <li key={key} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
              <span>{key}</span>
              <span className="font-bold">{value}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
