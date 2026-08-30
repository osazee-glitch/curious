export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams?: Promise<{
    from?: string | string[];
    email?: string | string[];
  }> | {
    from?: string | string[];
    email?: string | string[];
  };
}) {
  const params = searchParams ? await searchParams : {};
  const from = typeof params.from === 'string' ? params.from : Array.isArray(params.from) ? params.from[0] : 'account';
  const email =
    typeof params.email === 'string'
      ? params.email
      : Array.isArray(params.email)
        ? params.email[0] || 'username@example.com'
        : 'username@example.com';
  const backLink = from === 'edit' ? '/profile/edit' : '/account';

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
                Check your email
              </h1>
            </div>

            <p className="mb-6 text-sm leading-6 text-zinc-600">
              We sent a confirmation link to {email}. Open it to confirm your email address and
              finish signing in.
            </p>

            <a
              href={backLink}
              className="mt-2 block w-full rounded-full bg-zinc-900 px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-zinc-700"
            >
              Back
            </a>

            <div className="mt-6 text-center text-sm text-zinc-500">
              Didn&apos;t receive the email? Check your spam folder or return to sign in and try again.
            </div>

            <div className="mt-5 text-center">
              <a href={backLink} className="text-sm text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline">
                {from === 'edit' ? 'Back to edit profile' : 'Back to create account'}
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
