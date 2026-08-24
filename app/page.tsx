"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
 const [showCreateQuestion, setShowCreateQuestion] = useState(false);
const [searchedQuestion, setSearchedQuestion] = useState(""); 

const searchQuestion = (question: string) => {
  const trimmedQuestion = question.trim();

  if (!trimmedQuestion) return;

  const slug = trimmedQuestion
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");

  const savedQuestions = localStorage.getItem("curious-questions");

  let questions: string[] = [];

  if (savedQuestions) {
    try {
      questions = JSON.parse(savedQuestions);
    } catch {
      questions = [];
    }
  }

  const questionExists = questions.includes(slug);

  if (questionExists) {
    router.push(`/question/${encodeURIComponent(slug)}`);
  } else {
    setSearchedQuestion(trimmedQuestion);
    setShowCreateQuestion(true);
  }
}; 

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6">
        
        {/* Header */}
        <header className="flex h-20 items-center justify-between">
    <div className="flex items-center ml-0 lg:-ml-45">
  <img
    src="/ithinklylogo.jpeg"
    alt="ithinkly"
    className="h-24 w-auto object-contain sm:h-40"
  />
</div>

<a
  href="/about"
  className="text-sm text-zinc-500 transition hover:text-zinc-900 mr-0 lg:-mr-35"
>
  About
</a>
        </header>

        {/* Main */}
        <section className="flex flex-1 flex-col items-center justify-center pb-24">
          
          <div className="mb-8 text-center">
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
              What are you curious about?
            </h1>

            <p className="mt-5 text-lg text-zinc-500">
          Explore questions, feelings, and memories through human perspectives.
            </p>
          </div>

          {/* Search */}
          <div className="w-full max-w-2xl">
         <div className="flex h-16 items-center rounded-full border border-zinc-200 bg-white px-6 shadow-sm transition focus-within:border-zinc-400">
  <span className="mr-4 text-xl text-zinc-400">
    ⌕
  </span>

  <form
    className="flex w-full items-center"
    onSubmit={(event) => {
      event.preventDefault();

      const form = event.currentTarget;
      const input = form.elements.namedItem("search") as HTMLInputElement;

      searchQuestion(input.value);
    }}
  >
    <input
      name="search"
      type="text"
      placeholder="Search questions..."
      className="w-full bg-transparent text-lg outline-none placeholder:text-zinc-400"
    />

    <button
      type="submit"
      className="ml-3 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
    >
      Search
    </button>
  </form>
</div> 

          </div>
        </section>

        {showCreateQuestion && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-6">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
        New question
      </p>

      <h2 className="mt-3 text-xl font-semibold">
        This question doesn't exist yet.
      </h2>

      <p className="mt-2 text-zinc-500">
        Create it and start a new collection of human perspectives.
      </p>

      <p className="mt-5 text-base text-zinc-800">
        “{searchedQuestion}”
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={() => setShowCreateQuestion(false)}
          className="rounded-full px-4 py-2 text-sm text-zinc-500 hover:text-zinc-900"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            const slug = searchedQuestion
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]/g, "");

          router.push(`/create?question=${encodeURIComponent(searchedQuestion)}&slug=${encodeURIComponent(slug)}`);
          }}
          className="rounded-full bg-zinc-900 px-5 py-2 text-sm text-white"
        >
          Create question
        </button>
      </div>
    </div>
  </div>
)}

        {/* Footer */}
        <footer className="flex h-16 items-center justify-center text-xs text-zinc-400">
         Google, but for human perspectives.
        </footer>

      </div>
    </main>
  );
}
