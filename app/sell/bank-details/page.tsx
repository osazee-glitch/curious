"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function SellerBankDetailsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: "",
    bankName: "",
    sortCode: "",
    accountNumber: "",
  });
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/account");
    });
  }, [router]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationMessage("");
  };

  const handleContinue = async () => {
    const hasMissingField = Object.values(form).some((value) => value.trim() === "");

    if (hasMissingField) {
      setValidationMessage("Please complete all required fields before continuing.");
      return;
    }

    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/account");
        return;
      }
      const existingAccount = window.localStorage.getItem("ithinkly_account");
      const parsedAccount = existingAccount ? JSON.parse(existingAccount) : {};

      window.localStorage.setItem(
        "ithinkly_account",
        JSON.stringify({
          ...parsedAccount,
          accountId: data.session.user.id,
          isCreator: true,
          bankDetails: { ...form },
        }),
      );
    }

    setValidationMessage("");
    router.push("/creator-profile");
  };

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
                Seller setup
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                SET UP YOUR SELLER ACCOUNT
              </h1>
            </div>

            <p className="mb-8 text-sm leading-6 text-zinc-600">
              Add your bank details so iThinkly can send you your earnings from Creator Market sales.
            </p>

            <form className="space-y-4" onSubmit={(event) => event.preventDefault()} noValidate>
              <div>
                <label htmlFor="full-name" className="mb-2 block text-sm text-zinc-600">
                  Full name
                </label>
                <input
                  id="full-name"
                  type="text"
                  value={form.fullName}
                  onChange={(event) => handleChange("fullName", event.target.value)}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div>
                <label htmlFor="bank-name" className="mb-2 block text-sm text-zinc-600">
                  Bank name
                </label>
                <input
                  id="bank-name"
                  type="text"
                  value={form.bankName}
                  onChange={(event) => handleChange("bankName", event.target.value)}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div>
                <label htmlFor="sort-code" className="mb-2 block text-sm text-zinc-600">
                  Sort code
                </label>
                <input
                  id="sort-code"
                  type="text"
                  value={form.sortCode}
                  onChange={(event) => handleChange("sortCode", event.target.value)}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <div>
                <label htmlFor="account-number" className="mb-2 block text-sm text-zinc-600">
                  Account number
                </label>
                <input
                  id="account-number"
                  type="text"
                  value={form.accountNumber}
                  onChange={(event) => handleChange("accountNumber", event.target.value)}
                  className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                />
              </div>

              <p className="text-sm text-zinc-500">
                Your bank details are private and will not be displayed to customers.
              </p>

              {validationMessage && (
                <p className="text-sm text-red-600">{validationMessage}</p>
              )}

              <button
                type="button"
                onClick={handleContinue}
                className="mt-2 block w-full rounded-full bg-zinc-900 px-4 py-3 text-center text-sm font-medium uppercase tracking-[0.16em] text-white transition hover:bg-zinc-700"
              >
                Continue
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
