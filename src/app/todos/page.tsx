import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import React from 'react'
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import AddTodoForm from './AddTodoForm'

type User = {
  id: number,
  name: string,
  username: string,
  email: string,
}

export default async function TodoPage() {
const supabase = createServerComponentClient({ cookies });
const {
    data : { session },
}= await supabase.auth.getSession();

if (!session?.user){
  console.log(session);
    return(
        <div>
            <h1>Todoアプリ</h1>
            <p>ログインしてください</p>
            <Link href="./login">ログイン</Link>
        </div>
    )
}

  const { data: todos } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', session.user.id)
    .order('id', { ascending: true });

  async function addTodo(formData: FormData) {
    'use server'
    const title = String(formData.get('title') ?? '').trim()
    if (!title) return
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    await supabase.from('todos').insert({ title, completed: false, user_id: session.user.id })
    revalidatePath('/todos')
  }

  async function toggleTodo(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const completed = formData.get('completed') === 'true'
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user || !id) return
    await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id)
      .eq('user_id', session.user.id)
    revalidatePath('/todos')
  }

  async function deleteTodo(formData: FormData) {
    'use server'
    const id = formData.get('id') as string
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user || !id) return
    await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id)
    revalidatePath('/todos')
  }

  const res = await fetch('https://jsonplaceholder.typicode.com/users');
  const data: User[] = await res.json(); 

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Todos</h2>
        <AddTodoForm />
        <ul className="space-y-2">
          {(todos ?? []).map((t: any) => (
            <li key={t.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <div className="flex items-center gap-3">
                <form action={toggleTodo}>
                  <input type="hidden" name="id" value={t.id} />
                  <input type="hidden" name="completed" value={String(t.completed)} />
                  <button type="submit" className="w-6 h-6 inline-flex items-center justify-center rounded border border-gray-300 text-sm">
                    {t.completed ? '☑' : '☐'}
                  </button>
                </form>
                <span className={`text-sm ${t.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{t.title}</span>
              </div>
              <form action={deleteTodo}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="text-red-600 hover:text-red-700 text-sm">削除</button>
              </form>
            </li>
          ))}
        </ul>
        {data.map((user) => (
          <div key={user.id}>{user.name}</div>
        ))}
      </div>
    </div>
  )
}
