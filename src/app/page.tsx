import { redirect } from 'next/navigation'

export default function Home() {
  // ホームページは認証済みユーザーをtodosにリダイレクト
  redirect('/todos')
}
