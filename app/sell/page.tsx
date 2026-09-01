"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const ACCOUNT_KEY = "ithinkly_account";
const SELLER_PROFILE_KEY = "ithinkly_seller_profile";

const sellOptions = [
  "3D-printed body/case + electronic module hardware",
  "3D-printed body/case + custom electronic hardware",
];

const productTypeOptions = [
  "Assistive devices for elderly people",
  "Assistive devices for children",
  "Learning devices for kids",
  "Homeware devices (non-AC powered)",
  "Remote-controlled toy devices",
  "Hardware devices",
  "Home sensors & security devices",
  "Robotics & moving devices",
  "Educational & STEM devices",
  "Desk & workspace devices",
  "Accessibility devices",
  "Personal-use devices",
];

const powerOptions = [
  "1.5V battery — non-rechargeable",
  "3V battery — non-rechargeable",
  "6V battery — non-rechargeable",
  "9V battery — non-rechargeable",
  "Lithium battery — rechargeable",
  "5V USB cable",
  "9V DC cable",
  "12V DC cable",
];

const deliveryOptions = ["Royal Mail", "Evri"];

const toggleSelection = <T,>(
  selected: T[],
  value: T,
  allOptions: T[],
  setSelected: (next: T[]) => void,
) => {
  const isSelected = selected.includes(value);
  const next = isSelected ? selected.filter((item) => item !== value) : [...selected, value];
  setSelected(next);
};

export default function SellPage() {
  const router = useRouter();
  const [selling, setSelling] = useState<string[]>([]);
  const [productType, setProductType] = useState<string[]>([]);
  const [powered, setPowered] = useState<string[]>([]);
  const [delivery, setDelivery] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [readyForNextStep, setReadyForNextStep] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    supabase.auth.getSession().then(({ data }) => {
      const existingAccount = data.session
        ? window.localStorage.getItem(`${ACCOUNT_KEY}_${data.session.user.id}`)
        : null;
      if (!data.session || !existingAccount) {
        router.replace("/account");
      }
    });
  }, [router]);

  const handleContinue = async () => {
    const isComplete =
      selling.length > 0 &&
      productType.length > 0 &&
      powered.length > 0 &&
      delivery.length > 0 &&
      agreed;

    if (!isComplete) {
      setValidationMessage("Please select at least one option in each category and confirm the marketplace rules before continuing.");
      setReadyForNextStep(false);
      return;
    }

    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/account");
        return;
      }
      const existingAccount = window.localStorage.getItem(`${ACCOUNT_KEY}_${data.session.user.id}`);
      if (!existingAccount) {
        router.replace("/account");
        return;
      }

      const parsedAccount = JSON.parse(existingAccount);
      const nextAccount = {
        ...parsedAccount,
        accountId: data.session.user.id,
        isCreator: true,
        creatorProfile: {
          selling,
          productType,
          powered,
          delivery,
          agreed,
        },
      };

      window.localStorage.setItem(
        `${ACCOUNT_KEY}_${data.session.user.id}`,
        JSON.stringify(nextAccount),
      );
      window.localStorage.setItem(
        `${SELLER_PROFILE_KEY}_${data.session.user.id}`,
        JSON.stringify(nextAccount.creatorProfile),
      );
    }

    setValidationMessage("");
    setReadyForNextStep(true);
    router.push("/sell/bank-details");
  };

  const renderChecklist = (
    options: string[],
    selected: string[],
    onToggle: (value: string) => void,
  ) => (
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);

        return (
          <label
            key={option}
            className={[
              "flex cursor-pointer items-center gap-3 rounded-full border px-4 py-3 text-sm transition",
              isSelected
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300",
            ].join(" ")}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(option)}
              className="sr-only"
            />
            <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-current text-[10px]">
              {isSelected ? "✓" : ""}
            </span>
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );

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
          <div className="w-full max-w-3xl rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
                Sell
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                SELL ON iThinkly
              </h1>
            </div>

            <div className="space-y-3 text-base leading-relaxed text-zinc-700">
              <p>Bring your creativity to life.</p>
              <p>Find a problem. Create a solution. Sell it to people who need it.</p>
              <p>That’s the purpose of the iThinkly Creator Market.</p>
              <p>
                This program is strictly for inventors, makers and tech enthusiasts who create
                useful products and devices.
              </p>
            </div>

            <div className="my-8 h-px bg-zinc-200" />

            <form className="space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
              <div>
                <label className="mb-2 block text-sm text-zinc-600">1. What are you selling?</label>
                {renderChecklist(sellOptions, selling, (value) => {
                  toggleSelection(selling, value, sellOptions, setSelling);
                  setValidationMessage("");
                  setReadyForNextStep(false);
                })}
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600">
                  2. What type of product are you selling?
                </label>
                {renderChecklist(productTypeOptions, productType, (value) => {
                  toggleSelection(productType, value, productTypeOptions, setProductType);
                  setValidationMessage("");
                  setReadyForNextStep(false);
                })}
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600">
                  3. How is your product powered?
                </label>
                {renderChecklist(powerOptions, powered, (value) => {
                  toggleSelection(powered, value, powerOptions, setPowered);
                  setValidationMessage("");
                  setReadyForNextStep(false);
                })}
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-600">
                  4. How will you deliver orders to customers?
                </label>
                {renderChecklist(deliveryOptions, delivery, (value) => {
                  toggleSelection(delivery, value, deliveryOptions, setDelivery);
                  setValidationMessage("");
                  setReadyForNextStep(false);
                })}
              </div>

              <div className="pt-2">
                <p className="mb-3 text-sm uppercase tracking-[0.18em] text-zinc-400">
                  iThinkly Creator Market Rules
                </p>

                <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => {
                      setAgreed(event.target.checked);
                      setValidationMessage("");
                      setReadyForNextStep(false);
                    }}
                    className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <span>
                    “I agree that the product I am submitting is DC-powered and does not require
                    direct AC/mains power. Products intended to come into direct contact with food or
                    the mouth are strictly prohibited on iThinkly. I understand that products must
                    comply with applicable UK laws, safety requirements and regulations. I will not
                    list products that violate iThinkly’s marketplace rules or applicable
                    regulations.”
                  </span>
                </label>
              </div>

              {validationMessage && (
                <p className="text-sm text-red-600">{validationMessage}</p>
              )}

              {readyForNextStep && !validationMessage && (
                <p className="text-sm text-emerald-600">Ready for the next step.</p>
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
