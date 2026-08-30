export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6">
        <header className="flex h-20 items-center justify-start">
          <a href="/" className="flex items-center" aria-label="Go to home">
            <img
              src="/ithinklylogo.jpeg"
              alt="ithinkly"
              className="h-24 w-auto object-contain sm:h-40"
            />
          </a>
        </header>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
                Account
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                Forgot password?
              </h1>
            </div>

            <p className="mb-6 text-sm leading-6 text-zinc-600">
              Enter the email address associated with your iThinkly account.
            </p>

            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm text-zinc-600">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-zinc-700"
              >
                Send reset email
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500">
              Remember your password? <a href="/signin" className="font-medium text-zinc-900 underline-offset-4 hover:underline">Sign in</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
