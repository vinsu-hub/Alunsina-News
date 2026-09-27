export default function AdminLogin() {
  return <main className="mx-auto max-w-md px-4 py-16"><h1 className="font-serif text-3xl">Admin sign in</h1>
    <form action="/api/auth/admin/login" method="post" className="mt-6 flex flex-col gap-4">
      <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="border border-rule p-2" />
      <button type="submit" className="border border-ink p-2">Sign in</button>
    </form></main>;
}
