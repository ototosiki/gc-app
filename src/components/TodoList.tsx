"use client"
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

type Todo = {
  id: number
  title: string
  completed: boolean
  user_id: string
  created_at: string
  updated_at: string
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set())
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchTodos()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTodos = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('認証が必要です')
        return router.push('/login')
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

  const toggleTodo = async (id: number, completed: boolean) => {
    // 楽観的UI更新（即座に反映）
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !completed } : todo
    ))
    
    // ローディング状態を追加
    setUpdatingIds(prev => new Set(prev).add(id))

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
    } finally {
      // ローディング状態を解除
      setUpdatingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }
  }

  const deleteTodo = async (id: number) => {
    // 楽観的UI更新（即座に反映）
    setTodos(prev => prev.filter(todo => todo.id !== id))
    
    // ローディング状態を追加
    setDeletingIds(prev => new Set(prev).add(id))

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
    } finally {
      // ローディング状態を解除
      setDeletingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
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
                onClick={() => toggleTodo(todo.id, todo.completed)}
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
              onClick={() => deleteTodo(todo.id)}
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
