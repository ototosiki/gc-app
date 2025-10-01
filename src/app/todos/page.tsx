import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import React from 'react'
import { cookies } from 'next/headers';
import Link from 'next/link';
import AddTodoForm from '../../components/AddTodoForm'
import TodoList from '../../components/TodoList'

export default async function TodoPage() {
const supabase = createServerComponentClient({ cookies });
const {
    data : { session },
}= await supabase.auth.getSession();

if (!session?.user){
    return(
        <div>
            <h1>Todoアプリ</h1>
            <p>ログインしてください</p>
            <Link href="/login">ログイン</Link>
        </div>
    )
}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Todos</h2>
        <AddTodoForm />
        <TodoList />
      </div>
    </div>
  )
}