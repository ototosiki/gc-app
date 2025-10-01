"use client"
import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Todo = {
  id: number
  title: string
  completed: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export default function TodoContainer() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const fetchTodos = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('認証が必要です')
        return
      }

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: true })

      if (error) throw error
      setTodos(data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Todoの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodos()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addTodo = async (title: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('todos')
        .insert({ title, completed: false, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      
      // 楽観的UI更新
      setTodos(prev => [...prev, data])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '追加に失敗しました')
    }
  }

  const toggleTodo = async (id: number, completed: boolean) => {
    // 楽観的UI更新
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !completed } : todo
    ))

    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)

      if (error) throw error
    } catch (err: unknown) {
      // エラー時は元の状態に戻す
      setTodos(prev => prev.map(todo => 
        todo.id === id ? { ...todo, completed: completed } : todo
      ))
      setError(err instanceof Error ? err.message : '更新に失敗しました')
    }
  }

  const deleteTodo = async (id: number) => {
    // 楽観的UI更新
    setTodos(prev => prev.filter(todo => todo.id !== id))

    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (err: unknown) {
      // エラー時は元の状態に戻す
      fetchTodos()
      setError(err instanceof Error ? err.message : '削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-600 text-sm">{error}</p>
        <button 
          onClick={fetchTodos}
          className="mt-2 text-red-600 hover:text-red-700 text-sm underline"
        >
          再試行
        </button>
      </div>
    )
  }

  return (
    <>
      <AddTodoForm onAddTodo={addTodo} />
      <TodoList 
        todos={todos} 
        onToggleTodo={toggleTodo} 
        onDeleteTodo={deleteTodo} 
      />
    </>
  )
}

// AddTodoForm コンポーネント
function AddTodoForm({ onAddTodo }: { onAddTodo: (title: string) => void }) {
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    
    try {
      setSubmitting(true)
      setError(null)
      await onAddTodo(trimmed)
      setTitle('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '追加時にエラーが発生しました')
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

// TodoList コンポーネント
function TodoList({ 
  todos, 
  onToggleTodo, 
  onDeleteTodo 
}: { 
  todos: Todo[]
  onToggleTodo: (id: number, completed: boolean) => void
  onDeleteTodo: (id: number) => void
}) {
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

  const handleToggle = async (id: number, completed: boolean) => {
    setUpdatingIds(prev => new Set(prev).add(id))
    await onToggleTodo(id, completed)
    setUpdatingIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  const handleDelete = async (id: number) => {
    setDeletingIds(prev => new Set(prev).add(id))
    await onDeleteTodo(id)
    setDeletingIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }

  return (
    <ul className="space-y-2">
      {todos.map((todo) => {
        const isUpdating = updatingIds.has(todo.id)
        const isDeleting = deletingIds.has(todo.id)
        
        return (
          <li 
            key={todo.id} 
            className={`flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm transition-opacity ${
              isDeleting ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggle(todo.id, todo.completed)}
                disabled={isUpdating || isDeleting}
                className={`w-6 h-6 inline-flex items-center justify-center rounded border text-sm transition-colors ${
                  isUpdating 
                    ? 'border-blue-300 bg-blue-50 cursor-wait' 
                    : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUpdating ? (
                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  todo.completed ? '☑' : '☐'
                )}
              </button>
              <span className={`text-sm transition-all ${
                todo.completed ? 'line-through text-gray-400' : 'text-gray-800'
              } ${isDeleting ? 'opacity-50' : ''}`}>
                {todo.title}
              </span>
            </div>
            <button
              onClick={() => handleDelete(todo.id)}
              disabled={isDeleting || isUpdating}
              className={`text-sm transition-colors ${
                isDeleting 
                  ? 'text-gray-400 cursor-wait' 
                  : 'text-red-600 hover:text-red-700'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isDeleting ? '削除中...' : '削除'}
            </button>
          </li>
        )
      })}
      {todos.length === 0 && (
        <li className="text-center text-gray-500 py-8">
          Todoがありません。新しいTodoを追加してください。
        </li>
      )}
    </ul>
  )
}
