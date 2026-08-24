export default function About() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto min-h-screen w-full max-w-5xl px-6">

        {/* Header */}
       <header className="flex h-20 items-center justify-between ml-0 lg:-ml-45">
          <a href="/" className="flex items-center">
            <img
              src="/ithinklylogo.jpeg"
              alt="ithinkly"
              className="h-24 w-auto object-contain sm:h-40"
            />
          </a>

          <a
            href="/"
         className="text-sm text-zinc-500 transition hover:text-zinc-900 mr-0 lg:-mr-35"
          >
            Home
          </a>
        </header>

        {/* About */}
        <section className="flex flex-col items-center py-12 text-center">

          {/* Your photo */}
          <img
            src="/aboutpic.jpeg"
            alt="Lucky"
            className="h-56 w-56 rounded-full object-cover"
          />

          <h1 className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl">
            About ithinkly
          </h1>

          {/* Story */}
          <div className="mt-8 max-w-2xl text-lg leading-7 text-zinc-600">

            <p>
              Hi, I’m Lucky. I created <strong>ithinkly</strong> because I’ve
              always been curious about the questions that live in our minds.
              The simple ones, the difficult ones, and the ones that may never
              have a single answer.
            </p>

            <p className="mt-4">
              I wanted to create a place where people can ask questions and
              discover how other people think, feel, remember, and experience
              the world from their own perspective.
            </p>

            <p className="mt-4">
              <strong>ithinkly is for everyone.</strong> It isn’t just for
              engineers, doctors, scientists, or professionals. Sometimes the
              most interesting perspective can come from someone with no
              qualifications at all, simply because they have lived something,
              felt something, or see the world differently.
            </p>

            <p className="mt-4">
              I believe our personal experiences and perspectives can tell us
              things that facts and theories sometimes cannot. They can
              challenge what we think we know and make us look at familiar
              questions in a completely different way.
            </p>

            <p className="mt-4">
              ithinkly is also an experiment in understanding how we think in
              a world increasingly shaped by AI. As technology becomes better
              at giving us answers, I became more interested in something else.
            </p>

            <p className="mt-4 text-xl font-medium text-zinc-900">
              What happens when we ask people instead?
            </p>

            <p className="mt-4">
              Ideas, beliefs, experiences, emotions, memories, and the way we
              see the world are what make human perspectives so interesting.
              I want ithinkly to be a place where those perspectives can meet,
              challenge each other, and sometimes make us see something we
              never considered before.
            </p>

            <p className="mt-4">
              Because sometimes, the most interesting part of a question isn’t
              the answer. It’s seeing how differently another person
              experiences it.
            </p>

          </div>

          {/* What is ithinkly? */}
          <div className="mt-16 max-w-2xl">

            <h2 className="text-2xl font-semibold">
              What is ithinkly?
            </h2>

            <p className="mt-4 text-lg leading-7 text-zinc-600">
              ithinkly is a space for curiosity, questions, feelings, memories,
              ideas, and human perspectives.
            </p>

            <p className="mt-4 text-lg leading-7 text-zinc-600">
              Ask something that’s been on your mind. Explore questions other
              people have asked. Read perspectives you may never have
              considered.
            </p>

            <p className="mt-6 text-xl font-medium text-zinc-900">
              There doesn’t always have to be one right answer.
            </p>

            <p className="mt-5 text-2xl font-semibold text-zinc-900">
              One question can have a thousand perspectives.
            </p>

          </div>

        </section>
      </div>
    </main>
  );
}
