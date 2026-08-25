"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabase";

function CreateQuestionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const question = searchParams.get("question") || "";
  const [keyword, setKeyword] = useState("");

  const createQuestion = async () => {
    if (!question.trim()) return;

    const slug = question
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");

    const { data: existingQuestion, error: lookupError } = await supabase
      .from("questions")
      .select("slug")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.error("Error checking existing question:", lookupError);
      return;
    }

    if (existingQuestion) {
      router.push(`/question/${encodeURIComponent(slug)}`);
      return;
    }

const { error } = await supabase
  .from("questions")
  .insert({
    slug,
    keyword: keyword.trim(),
    question: question.trim(),
  });

if (error) {
  const { data: questionCreatedElsewhere } = await supabase
    .from("questions")
    .select("slug")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();

  if (questionCreatedElsewhere) {
    router.push(`/question/${encodeURIComponent(slug)}`);
    return;
  }

  console.error("Error saving question:", error);
  return;
}

router.push(`/question/${encodeURIComponent(slug)}`);
  };

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      <div className="mx-auto w-full max-w-5xl px-6">
        <header className="flex h-20 items-center justify-between">
          <a
            href="/"
            className="text-lg font-semibold tracking-tight hover:opacity-60"
          >
            CURIOSITY
          </a>

          <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Human perspectives
          </span>
        </header>

        <section className="flex min-h-[70vh] items-center justify-center">
          <div className="w-full max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
              New question
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Create a question
            </h1>

            <p className="mt-4 text-lg text-zinc-500">
              Start a new collection of human perspectives.
            </p>

           <div className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">

  {/* KEYWORD */}
  <p className="text-xs uppercase tracking-[0.15em] text-zinc-400">
    Keyword
  </p>

  <input
    value={keyword}
    onChange={(e) => setKeyword(e.target.value.toLowerCase())}
    placeholder="god"
    className="mt-3 w-full border-b border-zinc-200 bg-transparent pb-2 text-xl outline-none placeholder:text-zinc-300"
  />

  {/* QUESTION */}
  <p className="mt-8 text-xs uppercase tracking-[0.15em] text-zinc-400">
    Your question
  </p>

              <p className="mt-4 text-xl leading-8 text-zinc-800">
                “{question}”
              </p>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="rounded-full px-5 py-2 text-sm text-zinc-500 transition hover:text-zinc-900"
                >
                  Cancel
                </button>

                <button
                  onClick={createQuestion}
                  className="rounded-full bg-zinc-800 px-5 py-2 text-sm text-white transition hover:bg-zinc-700"
                >
                  Create question
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex h-16 items-center justify-center text-xs text-zinc-400">
          Questions have many perspectives.
        </footer>
      </div>
    </main>
  );
}

export default function CreateQuestionPage() {
  return (
    <Suspense fallback={null}>
      <CreateQuestionPageContent />
    </Suspense>
  );
}
