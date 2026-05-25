import { useState } from 'react'
import IntakeChat from './components/IntakeChat'
import EmrPanel from './components/EmrPanel'

const initialTranscript = `환자: 귀 안쪽이 가려워요.
의사: 언제부터 증상이 있었나요?
환자: 이틀 전부터 오른쪽 귀에서 물이 나오고 가려워요.
의사: 감기 증상은 있으셨나요?
환자: 아니요. 감기는 아니에요.`

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'

export default function App() {
  const [patientName, setPatientName] = useState('홍길동')
  const [birthDate, setBirthDate] = useState('1990-01-01')
  const [transcript, setTranscript] = useState(initialTranscript)
  const [emr, setEmr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submitIntake = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName, birthDate, transcript })
      })

      if (!response.ok) {
        throw new Error(`문진 저장 실패 (${response.status})`)
      }

      const data = await response.json()
      setEmr(data.emr)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-8 rounded-3xl bg-slate-950 p-6 text-white">
        <h1 className="text-3xl font-black">AI 기반 스마트 문진 및 EMR 대시보드</h1>
        <p className="mt-2 text-slate-300">환자 대화를 실시간으로 구조화하고 의료진 차트 입력 시간을 줄입니다.</p>
      </header>

      <form onSubmit={submitIntake} className="mb-6 grid gap-3 rounded-2xl bg-white p-4 shadow md:grid-cols-4">
        <input
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2"
          placeholder="환자 이름"
        />
        <input
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          type="date"
          className="rounded-xl border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-primary px-4 py-2 font-semibold text-white disabled:opacity-70"
        >
          {loading ? '처리 중...' : 'AI 문진 정형화 실행'}
        </button>
        <span className="self-center text-sm text-slate-500">API: {API_BASE}</span>
      </form>

      {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="mb-4 h-40 w-full rounded-2xl border border-slate-300 p-3"
          />
          <IntakeChat transcript={transcript} />
        </div>
        <EmrPanel emr={emr} />
      </section>
    </main>
  )
}
