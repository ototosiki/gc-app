"use client"
import React, { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function AddTodoForm() {
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    try {
      setSubmitting(true)
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('認証情報が見つかりません。再度ログインしてください。')
        return
      }
      const { error: insertError } = await supabase
        .from('todos')
        .insert({ title: trimmed, completed: false, user_id: user.id })
      if (insertError) throw insertError
      setTitle('')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '追加時にエラーが発生しました'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mb-4">
      <div className="flex items-center gap-2">
        <input
          id="new-todo"
          name="title"
          placeholder="新しいTODO"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="新しいTODO"
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm"
        />
        <button
          type="submit"
          disabled={!title.trim() || submitting}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-disabled={!title.trim() || submitting}
        >
          {submitting ? '追加中…' : '追加'}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </form>
  )
}


