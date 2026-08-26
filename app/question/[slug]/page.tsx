"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import {
  clearPerspectiveReaction,
  hasPerspectiveReaction,
  markPerspectiveReaction,
} from "@/app/lib/perspectiveReactions";

type Perspective = {
  id: number;
  type: string;
  text: string;
  likes: number;
  dislikes: number;
};

type QuestionMetadata = {
  slug: string;
  keyword: string;
  question: string;
};

const perspectiveTypes = [
  "thought",
  "feeling",
  "experience",
  "idea",
  "sense",
  "me",
  "view",
  "wonder",
  "seen",
  "confident",
];

const initialPerspectives: Perspective[] = [];

export default function QuestionPage() {
  const { slug } = useParams<{ slug: string }>();
const [perspectives, setPerspectives] =
  useState<Perspective[]>(initialPerspectives);

const [loaded, setLoaded] = useState(false);
const [questionMetadata, setQuestionMetadata] =
  useState<QuestionMetadata | null>(null);

useEffect(() => {
  if (!slug) {
    setLoaded(true);
    return;
  }

  const loadQuestion = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select("slug, keyword, question")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to load question:", error);
      setLoaded(true);
      return;
    }

    if (data) {
      setQuestionMetadata({
        slug: data.slug,
        keyword: data.keyword,
        question: data.question,
      });
    }

    setLoaded(true);
  };

  loadQuestion();
}, [slug]);

    useEffect(() => {
  const hash = window.location.hash;

  if (!hash) return;

  const timer = setTimeout(() => {
    const element = document.getElementById(hash.substring(1));

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, 100);

  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  if (!slug) return;

  const loadPerspectives = async () => {
    const { data, error } = await supabase
      .from("perspectives")
      .select("id, type, content, likes, dislikes")
      .eq("question", slug)
      .order("id", { ascending: true });

    if (error) {
      console.error("Failed to load perspectives:", error);
      return;
    }

    const loadedPerspectives: Perspective[] = (data ?? []).map((data) => {

      return {
        id: Number(data.id),
        type: data.type,
        text: data.content,
        likes: data.likes ?? 0,
        dislikes: data.dislikes ?? 0,
      };
    });

    setPerspectives(loadedPerspectives);
  };

  loadPerspectives();
}, [slug]);

  // Results filter
  const [selectedType, setSelectedType] = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // New post
  const [postType, setPostType] = useState<string | null>(null);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [postText, setPostText] = useState("");

  // Filter and sort perspectives
  const sortedPerspectives = useMemo(() => {
    return [...perspectives]
      .filter((perspective) => perspective.dislikes < 100)
      .filter(
        (perspective) =>
          selectedType === "all" ||
          perspective.type === selectedType
      )
      .sort((a, b) => b.likes - a.likes);
  }, [perspectives, selectedType]);

  // LIKE
  const likePerspective = async (id: number) => {
    const current = perspectives.find((perspective) => perspective.id === id);
    if (!current || !slug || hasPerspectiveReaction(id, "like")) return;

    markPerspectiveReaction(id, "like");

    const nextLikes = current.likes + 1;
    const { data, error } = await supabase
      .from("perspectives")
      .update({ likes: nextLikes })
      .eq("id", id)
      .eq("question", slug)
      .select("likes")
      .single();

    if (error) {
      clearPerspectiveReaction(id, "like");
      console.error("Failed to like perspective:", error);
      return;
    }

    setPerspectives((currentPerspectives) =>
      currentPerspectives.map((perspective) =>
        perspective.id === id
          ? { ...perspective, likes: Number(data?.likes ?? nextLikes) }
          : perspective
      )
    );
  };

  // DISLIKE
  const dislikePerspective = async (id: number) => {
    const current = perspectives.find((perspective) => perspective.id === id);
    if (!current || !slug || hasPerspectiveReaction(id, "dislike")) return;

    markPerspectiveReaction(id, "dislike");

    const nextDislikes = current.dislikes + 1;
    const { data, error } = await supabase
      .from("perspectives")
      .update({ dislikes: nextDislikes })
      .eq("id", id)
      .eq("question", slug)
      .select("dislikes")
      .single();

    if (error) {
      clearPerspectiveReaction(id, "dislike");
      console.error("Failed to dislike perspective:", error);
      return;
    }

    const dislikes = Number(data?.dislikes ?? nextDislikes);
    setPerspectives((currentPerspectives) =>
      currentPerspectives
        .map((perspective) =>
          perspective.id === id ? { ...perspective, dislikes } : perspective
        )
        .filter((perspective) => perspective.dislikes < 100)
    );
  };

  // OPEN POST TYPE MENU
  const openPostMenu = () => {
    setShowPostMenu(true);
  };

  // SELECT POST TYPE
  const choosePostType = (type: string) => {
    setPostType(type);
    setShowPostMenu(false);
  };

  // POST
 const submitPost = async () => {
  if (!postType || !postText.trim() || !slug) {
    return;
  }

  const content = postText.trim();

  // Save the perspective to Supabase
  const { data, error } = await supabase
    .from("perspectives")
    .insert({
      content,
      type: postType,
      question: slug,
      likes: 0,
      dislikes: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to save perspective:", error);
    return;
  }

  const newPerspective: Perspective = {
    id: Number(data.id),
    type: data.type,
    text: data.content,
    likes: data.likes ?? 0,
    dislikes: data.dislikes ?? 0,
  };

  setPerspectives((current) => {
    const updated = [...current, newPerspective];

    localStorage.setItem(
      "curious-perspectives",
      JSON.stringify(updated)
    );

    return updated;
  });

  setPostText("");
  setPostType(null);
  setShowPostMenu(false);

    setPostText("");
    setPostType(null);
    setShowPostMenu(false);
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
         CURIOSITY   
          </a>

          <span className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Human perspectives
          </span>
        </header>

<div className="pt-10">
  {questionMetadata ? (
    <>
      <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">
        {questionMetadata.keyword
          ? questionMetadata.keyword.charAt(0).toUpperCase() +
            questionMetadata.keyword.slice(1)
          : slug.replace(/-/g, " ")}
        <span className="ml-2 text-xl font-normal text-zinc-400">
          /{questionMetadata.keyword}/
        </span>
      </h1>

      <p className="mt-4 text-lg text-zinc-500">
        Question: {questionMetadata.question}
      </p>
    </>
  ) : (
    <h1 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">
      {slug.replace(/-/g, " ")}
    </h1>
  )}
</div>

{/* DICTIONARY ENTRY */}
<section className="pt-10 pb-8">

          {/* RESULTS + FILTER */}
          <div className="relative mt-6 flex items-center gap-2 text-sm text-zinc-400">

            <span>
              {sortedPerspectives.length} anonymous perspectives / results /
            </span>

            {/* ALL BUTTON */}
            <button
              onClick={() =>
                setShowFilterMenu((current) => !current)
              }
              className="font-medium text-zinc-700 transition hover:text-black"
            >
              [ {selectedType} ]
            </button>

            {/* FILTER MENU */}
            {showFilterMenu && (
              <div className="absolute left-0 top-7 z-30 w-52 border border-zinc-200 bg-[#fafaf8] py-2 shadow-sm">

                {/* ALL */}
                <button
                  onClick={() => {
                    setSelectedType("all");
                    setShowFilterMenu(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm hover:bg-zinc-100"
                >
                  All
                </button>

                {/* TYPES */}
                {perspectiveTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedType(type);
                      setShowFilterMenu(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm capitalize hover:bg-zinc-100"
                  >
                    {type}
                  </button>
                ))}

              </div>
            )}

          </div>
        </section>

        {/* PERSPECTIVES */}
        <section className="text-[16px] leading-8 text-zinc-700">

      {sortedPerspectives.map((perspective, index) => (
  <span
  key={`${perspective.id}-${index}`}
    id={`perspective-${perspective.id}`}
 className={`break-words ${
  perspective.likes >= 1000 ? "bg-yellow-100" : ""
}`}
  >

              {/* TYPE */}
              <span className="font-semibold italic text-zinc-900">
                /{perspective.type}/
              </span>

              {/* P FORMAT */}
              <span className="ml-2 text-sm italic text-zinc-500">
                (p)/!/
              </span>

              <button
  type="button"
  onClick={() => {
    const link = `${window.location.origin}${window.location.pathname}#perspective-${perspective.id}`;
    navigator.clipboard.writeText(link);
  }}
  title="Copy link to this perspective"
  aria-label="Copy link to this perspective"
  className="relative -top-1 ml-1 inline-flex text-[11px] text-zinc-400 transition hover:text-zinc-800"
>
  🔗
</button>

           {/* TEXT */}
<span className="ml-2 break-words whitespace-normal">
  {perspective.text}
</span>

              {/* ACTIONS */}
              <span className="ml-3 inline-flex items-center gap-3 align-middle">

                {/* LIKE */}
                <button
                  onClick={() =>
                    likePerspective(perspective.id)
                  }
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
                    {perspective.likes}
                  </span>
                </button>

                {/* DISLIKE */}
                <button
                  onClick={() =>
                    dislikePerspective(perspective.id)
                  }
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
                    {perspective.dislikes}
                  </span>
                </button>

              </span>

              {index < sortedPerspectives.length - 1 && (
                <span> </span>
              )}

            </span>
          ))}

        </section>

        {/* YOUR PERSPECTIVE */}
        <section className="mt-12 pb-16">

          <div className="flex items-baseline gap-3">

            <h2 className="text-2xl font-bold tracking-tight">
              Your perspective
            </h2>

            <span className="text-sm italic text-zinc-400">
              /anonymous/
            </span>

          </div>

          <p className="mt-2 text-sm text-zinc-500">
            Add your perspective to this question.
          </p>

          {/* WRITE BUTTON */}
          {!postType && !showPostMenu && (
            <button
              onClick={openPostMenu}
 className="mt-6 block w-full bg-transparent px-0 py-4 text-left text-base text-zinc-400 outline-none transition hover:text-zinc-700"
            >
              Write what you think...
            </button>
          )}

          {/* POST TYPE MENU */}
       {showPostMenu && (
            <div className="mt-6 w-52 border border-zinc-200 bg-[#fafaf8] py-2 shadow-sm">

              {perspectiveTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => choosePostType(type)}
                  className="block w-full px-4 py-2 text-left text-sm capitalize hover:bg-zinc-100"
                >
                  {type}
                </button>
              ))}

            </div>
          )}

          {/* WRITING AREA */}
          {postType && (
            <div className="mt-6">

              {/* AUTOMATIC FORMAT */}
              <div className="mb-3 text-sm">
               <button
  type="button"
  onClick={openPostMenu}
  className="font-semibold italic text-zinc-900 hover:underline"
>
  /{postType}/
</button>

<span className="ml-2 italic text-zinc-500">
  (p)//
</span>
              </div>

              {/* TEXT */}
<textarea
  autoFocus
  value={postText}
  onChange={(event) =>
    setPostText(event.target.value)
  }
  placeholder="Write what you think..."
  wrap="soft"
  className="min-h-36 w-full resize-none border-0 bg-transparent px-0 py-4 text-base leading-7 outline-none whitespace-pre-wrap break-words overflow-y-auto"
/>

              {/* POST */}
              <button
                onClick={submitPost}
                disabled={!postText.trim()}
                className="mt-5 border border-zinc-900 px-6 py-3 text-sm font-medium transition hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Post
              </button>

            </div>
          )}

        </section>

        {/* FOOTER */}
        <footer className="py-10 text-center text-xs text-zinc-400">
          Questions have many perspectives.
        </footer>

      </div>
    </main>
  );
}
