"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import {
  clearPerspectiveReaction,
  hasPerspectiveReaction,
  markPerspectiveReaction,
} from "../../../../lib/perspectiveReactions";

type QuestionMetadata = {
  keyword: string;
  question: string;
};

type Perspective = {
  id: number;
  type: string;
  text: string;
  likes: number;
  dislikes: number;
};

export default function PerspectivePage() {
  const params = useParams();
  const [questionMetadata, setQuestionMetadata] =
    useState<QuestionMetadata | null>(null);
  const [perspective, setPerspective] = useState<Perspective | null>(null);

  useEffect(() => {
    const slug = String(params.slug);
    const id = Number(params.id);

    const loadQuestion = async () => {
      const { data, error } = await supabase
        .from("questions")
        .select("keyword, question")
        .eq("slug", slug)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error loading question:", error);
        return;
      }

      if (data) {
        setQuestionMetadata({
          keyword: data.keyword ?? "",
          question: data.question ?? "",
        });
      }
    };

    const loadPerspective = async () => {
      const { data, error } = await supabase
        .from("perspectives")
        .select("id, type, content, likes, dislikes")
        .eq("id", id)
        .eq("question", slug)
        .maybeSingle();

      if (error) {
        console.error("Error loading perspective:", error);
        return;
      }

      if (data) {
        setPerspective({
          id: Number(data.id),
          type: data.type,
          text: data.content,
          likes: Number(data.likes ?? 0),
          dislikes: Number(data.dislikes ?? 0),
        });
      }
    };

    loadQuestion();
    loadPerspective();
  }, [params.id, params.slug]);

  const likePerspective = async () => {
    if (!perspective || hasPerspectiveReaction(perspective.id, "like")) return;

    markPerspectiveReaction(perspective.id, "like");

    const nextLikes = perspective.likes + 1;
    const { data, error } = await supabase
      .from("perspectives")
      .update({ likes: nextLikes })
      .eq("id", perspective.id)
      .eq("question", String(params.slug))
      .select("likes")
      .single();

    if (error) {
      clearPerspectiveReaction(perspective.id, "like");
      console.error("Failed to like perspective:", error);
      return;
    }

    setPerspective((current) =>
      current
        ? { ...current, likes: Number(data?.likes ?? nextLikes) }
        : current
    );
  };

  const dislikePerspective = async () => {
    if (!perspective || hasPerspectiveReaction(perspective.id, "dislike")) return;

    markPerspectiveReaction(perspective.id, "dislike");

    const nextDislikes = perspective.dislikes + 1;
    const { data, error } = await supabase
      .from("perspectives")
      .update({ dislikes: nextDislikes })
      .eq("id", perspective.id)
      .eq("question", String(params.slug))
      .select("dislikes")
      .single();

    if (error) {
      clearPerspectiveReaction(perspective.id, "dislike");
      console.error("Failed to dislike perspective:", error);
      return;
    }

    setPerspective((current) =>
      current
        ? { ...current, dislikes: Number(data?.dislikes ?? nextDislikes) }
        : current
    );
  };

  return (
    <main className="min-h-screen bg-[#fafaf8] text-zinc-900">
      <div className="mx-auto w-full max-w-5xl px-6">

        {/* HEADER */}
        <header className="flex h-20 items-center justify-between">
          <a
            href="/"
            className="text-lg font-semibold tracking-tight hover:opacity-60"
          >
            CURIOUS
          </a>

          <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Human perspectives
          </span>
        </header>

        {/* DICTIONARY ENTRY */}
        <section className="pt-10 pb-8">
          {/* WORD */}
          <div className="flex items-baseline gap-5">
            <h1 className="break-words text-4xl font-bold tracking-tight sm:text-6xl">
              {questionMetadata?.keyword || "..."}
            </h1>

            <span className="text-lg italic text-zinc-500">
              /{questionMetadata?.keyword?.toLowerCase() || "..."}/
            </span>
          </div>

          {/* QUESTION */}
          <p className="mt-6 text-xl leading-8 text-zinc-800">
            <span className="font-semibold">Question:</span>{" "}
            {questionMetadata?.question || "..."}
          </p>

          {/* PERSPECTIVE */}
          <section className="mt-10">
            <div className="text-[16px] leading-8 text-zinc-700 break-words">
              <span className="font-semibold italic text-zinc-900">
                /{perspective?.type || "..."}/
              </span>

              <span className="ml-2 text-sm italic text-zinc-500">
                (p)/!/
              </span>

              <button
                type="button"
                onClick={() => {
                  const link = `${window.location.origin}${window.location.pathname}`;
                  navigator.clipboard.writeText(link);
                }}
                title="Copy link to this perspective"
                aria-label="Copy link to this perspective"
                className="relative -top-1 ml-1 inline-flex text-[11px] text-zinc-400 transition hover:text-zinc-800"
              >
                ðŸ”—
              </button>

              <span className="ml-2 break-words whitespace-normal">
                {perspective?.text || ""}
              </span>

              <span className="ml-3 inline-flex items-center gap-3 align-middle">
                {/* LIKE */}
                <button
                  type="button"
                  onClick={likePerspective}
                  aria-label="Like perspective"
                  className="inline-flex items-center gap-1 text-zinc-400 transition hover:text-zinc-900"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 10v12" />
                    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.96 2.4l-2.33 10A2 2 0 0 1 17.5 24H4a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2h3l4.29-7.14A2 2 0 0 1 15 3.89v1.99Z" />
                  </svg>

                  <span className="text-xs">
                    {perspective?.likes ?? 0}
                  </span>
                </button>

                {/* DISLIKE */}
                <button
                  type="button"
                  onClick={dislikePerspective}
                  aria-label="Dislike perspective"
                  className="inline-flex items-center gap-1 text-zinc-400 transition hover:text-zinc-900"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 14V2" />
                    <path d="m9 18 1-4H4.17a2 2 0 0 1-1.96-2.4l2.33-10A2 2 0 0 1 6.5 0H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3l-4.29 7.14A2 2 0 0 1 9 20.11V18Z" />
                  </svg>

                  <span className="text-xs">
                    {perspective?.dislikes ?? 0}
                  </span>
                </button>
              </span>
            </div>
          </section>
        </section>

        {/* FOOTER */}
        <footer className="py-10 text-center text-xs text-zinc-400">
          Questions have many perspectives.
        </footer>
      </div>
    </main>
  );
}
