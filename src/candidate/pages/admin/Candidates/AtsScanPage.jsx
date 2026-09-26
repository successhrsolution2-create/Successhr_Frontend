import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Search, X, ChevronRight, Trophy, Target, AlertCircle, Loader2, Users } from "lucide-react"
import api from "../../../api/axios"

const RANK_COLORS = [
  { bg: "bg-yellow-50", border: "border-yellow-400", badge: "bg-yellow-400 text-yellow-900", bar: "bg-yellow-400" },
  { bg: "bg-slate-50",  border: "border-slate-300",  badge: "bg-slate-400 text-white",       bar: "bg-slate-400" },
  { bg: "bg-orange-50", border: "border-orange-300", badge: "bg-orange-400 text-white",      bar: "bg-orange-400" },
]
const getRankStyle = (index) => RANK_COLORS[index] ?? { bg: "bg-white", border: "border-slate-200", badge: "bg-slate-200 text-slate-700", bar: "bg-emerald-500" }

function ScoreBar({ percent, colorClass }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  )
}

function KeywordBadge({ text, matched }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${matched ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700 line-through opacity-70"}`}>
      {matched ? "✓" : "✗"} {text}
    </span>
  )
}

export default function AtsScanPage() {
  const navigate = useNavigate()
  const textareaRef = useRef(null)
  const [keywordsInput, setKeywordsInput] = useState("")
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleScan = async () => {
    const trimmed = keywordsInput.trim()
    if (!trimmed) { setError("Enter at least one keyword"); return }
    setError(""); setLoading(true); setResults(null)
    try {
      const { data } = await api.get("/cms/candidates/ats-scan", { params: { keywords: trimmed } })
      setResults(data)
    } catch (err) {
      setError(err.response?.data?.message || "Scan failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleScan() }
  const clearAll = () => { setKeywordsInput(""); setResults(null); setError(""); textareaRef.current?.focus() }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-2 py-4">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
          <Target className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">ATS Resume Scanner</h1>
          <p className="text-sm text-slate-500">Enter skills / keywords — candidates ranked by ATS match score, best first</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="mb-2 block text-[13px] font-semibold text-slate-600">Keywords / Skills — comma or newline separated</label>
        <textarea
          ref={textareaRef}
          value={keywordsInput}
          onChange={(e) => setKeywordsInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={"e.g.  React, Node.js, MongoDB\nOr:  Sales, Marketing, CRM\nOr:  Java, Spring Boot, AWS"}
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400"
        />
        {error && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600"><AlertCircle className="h-3.5 w-3.5" /> {error}</p>}
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={handleScan} disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 text-sm font-bold text-white shadow-md shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</> : <><Search className="h-4 w-4" /> Scan All Candidates</>}
          </button>
          {(keywordsInput || results) && (
            <button type="button" onClick={clearAll}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
              <X className="h-4 w-4" /> Clear
            </button>
          )}
          <span className="ml-auto text-[11px] text-slate-400">Ctrl+Enter to scan</span>
        </div>
      </div>

      {results && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Users className="h-4 w-4 text-slate-400" />
              Scanned <strong className="ml-1">{results.totalScanned}</strong>&nbsp;candidates
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold text-emerald-700">
              <Trophy className="mr-1 inline h-4 w-4" />{results.totalMatched} matched
            </span>
            <span className="text-slate-300">|</span>
            <span className="flex flex-wrap gap-1 text-sm text-slate-500">
              {results.keywords.map((k) => <span key={k} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">{k}</span>)}
            </span>
          </div>

          {results.totalMatched === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
              <Search className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-semibold text-slate-500">No candidates matched these keywords</p>
              <p className="mt-1 text-sm text-slate-400">Try different or broader keywords</p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.results.map((candidate, index) => {
                const style = getRankStyle(index)
                const rank = index + 1
                return (
                  <div key={candidate._id} className={`relative rounded-2xl border-2 ${style.border} ${style.bg} p-5 shadow-sm transition hover:shadow-md`}>
                    <span className={`absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold shadow-md ${style.badge}`}>#{rank}</span>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold text-slate-900">{candidate.fullName || "—"}</span>
                          {candidate.candidateCode && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-500">{candidate.candidateCode}</span>}
                          {candidate.gender && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-600">{candidate.gender}</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-[12px] text-slate-600">
                          {candidate.mobileNumber && <span>📞 {candidate.mobileNumber}</span>}
                          {(candidate.currentDesignation || candidate.appliedFor) && <span>💼 {candidate.currentDesignation || candidate.appliedFor}</span>}
                          {candidate.education && <span>🎓 {candidate.education}</span>}
                          {candidate.totalExperience != null && <span>⏱ {candidate.totalExperience} yr exp</span>}
                        </div>
                        {candidate.keySkills?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {candidate.keySkills.map((sk) => <span key={sk} className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">{sk}</span>)}
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap gap-1">
                          {candidate.atsMatchedKeywords.map((kw) => <KeywordBadge key={kw} text={kw} matched />)}
                          {candidate.atsMissedKeywords.map((kw) => <KeywordBadge key={kw} text={kw} matched={false} />)}
                        </div>
                      </div>
                      <div className="flex w-full flex-col items-center gap-2 sm:w-36">
                        <div className="text-center">
                          <span className="block text-3xl font-extrabold leading-none text-slate-900">{candidate.atsScore.toFixed(1)}</span>
                          <span className="text-[11px] font-semibold text-slate-400">ATS Score</span>
                        </div>
                        <ScoreBar percent={candidate.atsScore} colorClass={style.bar} />
                        <div className="mt-1 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${candidate.atsMatchPercent >= 80 ? "bg-emerald-100 text-emerald-800" : candidate.atsMatchPercent >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700"}`}>
                            {candidate.atsMatchPercent}% matched
                          </span>
                        </div>
                        <button type="button" onClick={() => navigate(`/candidate/admin/cms/candidates/${candidate._id}`)}
                          className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700">
                          View Profile <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
