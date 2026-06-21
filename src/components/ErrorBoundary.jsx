import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error(error, info)
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase text-slate-500">Application error</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Something went wrong</h1>
          <p className="mt-3 text-sm text-slate-600">
            Refresh the page and try again. If this keeps happening, contact support.
          </p>
          <button
            type="button"
            className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </section>
      </main>
    )
  }
}
