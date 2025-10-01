"use client"
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation';

const Auth = () => {
    const router = useRouter();
    const supabase = createClientComponentClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [isLoading , setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleLogin = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'ログインに成功しました。' });
      router.push('/todos');
    } catch (error: unknown) {
      console.error(error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'ログインに失敗しました。' });
    } finally {
      setIsLoading(false);
    }
 };
 
 const handleSignUp = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      if (password !== confirmPassword) {
        setMessage({ type: 'error', text: 'パスワードが一致しません。' });
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'アカウント作成に成功しました。メールを確認してください。' });
    } catch (error: unknown) {
      console.error(error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'サインアップに失敗しました。' });
    } finally {
      setIsLoading(false);
    }
};
            return (
                <div className="h-screen flex items-center justify-center bg-black p-6">
                    <div className="w-full max-w-md rounded-2xl shadow-xl border border-white/10 bg-white/5 backdrop-blur p-8">
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <button
                              type="button"
                              onClick={() => setMode('login')}
                              className={`px-3 py-1.5 rounded-lg text-sm border ${mode === 'login' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/10 text-gray-200 border-white/10 hover:bg-white/15'}`}
                              disabled={isLoading}
                            >ログイン</button>
                            <button
                              type="button"
                              onClick={() => setMode('signup')}
                              className={`px-3 py-1.5 rounded-lg text-sm border ${mode === 'signup' ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/10 text-gray-200 border-white/10 hover:bg-white/15'}`}
                              disabled={isLoading}
                            >新規登録</button>
                        </div>
                        <h2 className="text-3xl font-semibold text-white mb-2 text-center">{mode === 'login' ? 'アカウントにサインイン' : 'アカウントを作成'}</h2>
                        <p className="text-sm text-gray-400 mb-6 text-center">メールとパスワードを入力してください</p>

                        {message && (
                            <div className={`mb-4 px-4 py-2 rounded border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/20' : 'bg-rose-500/10 text-rose-300 border-rose-400/20'}`}>
                                {message.text}
                            </div>
                        )}

                        <form
                            onSubmit={(e) => e.preventDefault()}
                            className="space-y-4"
                            aria-label="Authentication form"
                        >
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">メールアドレス</label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm bg-white/5 text-white placeholder-gray-400"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">パスワード</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm bg-white/5 text-white placeholder-gray-400"
                                    placeholder="••••••••"
                                />
                            </div>

                            {mode === 'signup' && (
                              <div>
                                <label htmlFor="confirm" className="block text-sm font-medium text-gray-300 mb-1">パスワード（確認）</label>
                                <input
                                  id="confirm"
                                  type="password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  required
                                  className="w-full px-4 py-3 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-sm bg-white/5 text-white placeholder-gray-400"
                                  placeholder="••••••••"
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={mode === 'login' ? handleLogin : handleSignUp}
                                    disabled={isLoading}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                                            読み込み中...
                                        </>
                                    ) : (
                                        mode === 'login' ? 'ログイン' : '新規登録'
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 text-center mt-2">
                                続行することで利用規約に同意したものとみなされます。
                            </p>
                        </form>
                    </div>
                </div>
            )

}

export default Auth;