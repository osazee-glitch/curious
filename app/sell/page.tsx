"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { saveCreatorProfile, saveUserProfile } from "../lib/supabase-data";
import { supabase } from "../lib/supabase";

const ACCOUNT_KEY = "ithinkly_account";
const SELLER_PROFILE_KEY = "ithinkly_seller_profile";

const sellOptions = [
  "Off-the-shelf electronic hardware",
  "Custom-designed PCB hardware",
];

const sellOptionDetails: Record<string, string> = {
  "Off-the-shelf electronic hardware":
    "I am building my product using existing electronic hardware or modules, such as Arduino boards, sensors, motors, drivers, microcontrollers, displays or other electronic components purchased from suppliers or retailers.",
  "Custom-designed PCB hardware":
    "I have designed my own PCB or electronic circuit board, combining components such as the microcontroller, drivers, sensors or other electronics into custom-designed hardware.",
};

const powerOptions = [
  "Rechargeable",
  "Non-rechargeable",
  "AC-to-DC adapter — maximum 12V DC",
  "Multiple power options",
];

const deliveryOptions = ["Royal Mail", "Evri"];

const toggleSelection = <T,>(
  selected: T[],
  value: T,
  setSelected: (next: T[]) => void,
) => {
  const isSelected = selected.includes(value);
  const next = isSelected ? selected.filter((item) => item !== value) : [...selected, value];
  setSelected(next);
};

export default function SellPage() {
  const router = useRouter();
  const [selling, setSelling] = useState<string[]>([]);
  const [productType, setProductType] = useState("");
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
    const productTypeList = productType.trim() ? [productType.trim()] : [];
    const isComplete =
      selling.length > 0 &&
      productTypeList.length > 0 &&
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
          productType: productTypeList,
          powered,
          delivery,
          agreed,
        },
      };

      const nextUserProfile = {
        ...parsedAccount,
        id: data.session.user.id,
        username: parsedAccount.username ?? "",
        age: Number(parsedAccount.age ?? 0),
        country: parsedAccount.country || "United Kingdom",
        deliveryAddress: parsedAccount.deliveryAddress ?? "",
        postcode: parsedAccount.postcode ?? "",
        profilePicture: parsedAccount.profilePicture ?? "",
        email: data.session.user.email || parsedAccount.email || "",
        isCreator: true,
      };

      window.localStorage.setItem(
        `${ACCOUNT_KEY}_${data.session.user.id}`,
        JSON.stringify(nextAccount),
      );
      window.localStorage.setItem(
        `${SELLER_PROFILE_KEY}_${data.session.user.id}`,
        JSON.stringify(nextAccount.creatorProfile),
      );

      await saveUserProfile(data.session.user.id, nextUserProfile);

      await saveCreatorProfile(data.session.user.id, {
        userId: data.session.user.id,
        sellingOptions: selling,
        productTypes: productTypeList,
        powerOptions: powered,
        deliveryOptions: delivery,
        bankDetails: parsedAccount.bankDetails || null,
      });
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
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                SELL ON iThinkly
              </h1>
            </div>

            <div className="space-y-3 text-base leading-relaxed text-zinc-700">
              <p>Bring your creativity to life.</p>
              <p>Find a problem. Create a solution. Sell it to people who need it.</p>
              <p>The iThinkly Creator Market is for creators and makers who build useful electronic products and devices.</p>
              <p>
                Important: The iThinkly Creator Market is strictly for electronics-based products and devices. Products must contain electronic components or hardware that are part of the product&apos;s function. Standalone 3D-printed products or products without electronic components will not be accepted and may be removed or result in your creator account being banned.
              </p>
              <p>
                iThinkly Creator Market products must use permitted low-voltage DC power sources. Products requiring direct AC/mains power or operating above 12V DC are not permitted.
              </p>
            </div>

            <div className="my-8 h-px bg-zinc-200" />

            <form className="space-y-6" onSubmit={(event) => event.preventDefault()} noValidate>
              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-700">1. What are you making your product with?</label>
                <div className="space-y-3">
                  {sellOptions.map((option) => {
                    const isSelected = selling.includes(option);
                    return (
                      <div key={option} className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <label
                          className={[
                            "flex cursor-pointer items-start gap-3 text-sm transition",
                            isSelected ? "text-zinc-900" : "text-zinc-700",
                          ].join(" ")}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              toggleSelection(selling, option, setSelling);
                              setValidationMessage("");
                              setReadyForNextStep(false);
                            }}
                            className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                          />
                          <span>
                            <span className="block font-medium">{option}</span>
                            <span className="mt-1 block text-sm text-zinc-600">{sellOptionDetails[option]}</span>
                          </span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="product-type" className="mb-2 block text-sm font-medium text-zinc-700">
                  2. What type of product are you making?
                </label>
                <div className="space-y-2">
                  <textarea
                    id="product-type"
                    value={productType}
                    onChange={(event) => {
                      setProductType(event.target.value);
                      setValidationMessage("");
                      setReadyForNextStep(false);
                    }}
                    placeholder="Tell us what you are making..."
                    rows={4}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                  />
                  <p className="text-sm text-zinc-500">Product type / description</p>
                  <p className="text-sm text-zinc-500">Example: Smart plant monitor, accessibility device, educational robot, home sensor, electronic desk device.</p>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-700">3. How is your product powered?</label>
                <div className="space-y-2">
                  {renderChecklist(powerOptions, powered, (value) => {
                    toggleSelection(powered, value, setPowered);
                    setValidationMessage("");
                    setReadyForNextStep(false);
                  })}
                </div>
                <p className="mt-3 text-sm text-zinc-500">
                  Products must operate at a maximum of 12V DC. AC-to-DC adapters are permitted only when their DC output does not exceed 12V. Adapters or power supplies exceeding 12V DC are prohibited.
                </p>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-zinc-700">4. How will you deliver orders to customers?</label>
                <div className="space-y-2">
                  {renderChecklist(deliveryOptions, delivery, (value) => {
                    toggleSelection(delivery, value, setDelivery);
                    setValidationMessage("");
                    setReadyForNextStep(false);
                  })}
                </div>
              </div>

              <div className="pt-2">
                <p className="mb-4 text-sm uppercase tracking-[0.18em] text-zinc-400">
                  ITHINKLY CREATOR MARKET RULES
                </p>

                <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700">
                  <p>By submitting a product to the iThinkly Creator Market, I confirm that:</p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>My product contains electronic components or electronic hardware and is designed to perform a useful function.</li>
                    <li>I understand that standalone 3D-printed products or products without electronic components are not permitted and may be removed.</li>
                    <li>My product does not require direct AC/mains power and is designed to operate using permitted low-voltage DC power sources.</li>
                    <li>Products intended to come into direct contact with food or the mouth are prohibited on iThinkly.</li>
                    <li>Sexual products, sexual content or products intended for sexual use are prohibited on iThinkly.</li>
                    <li>I will not submit products that are illegal, dangerous, harmful, or otherwise prohibited under applicable UK laws or regulations.</li>
                    <li>I am responsible for ensuring that my products comply with applicable UK product safety requirements, laws and regulations.</li>
                    <li>I will provide accurate information about my product, its components, power source and intended use.</li>
                    <li>I understand that iThinkly may reject, remove or ban products and/or creator accounts that violate these rules or the iThinkly Creator Market requirements.</li>
                  </ul>
                </div>

                <label className="mt-4 flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-700">
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
                  <span>I agree to the iThinkly Creator Market Rules.</span>
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
