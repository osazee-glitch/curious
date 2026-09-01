"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type BasketItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type Account = {
  country?: string;
  city?: string;
  deliveryAddress?: string;
  postcode?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [basketItems, setBasketItems] = useState<BasketItem[]>([]);
  const [account, setAccount] = useState<Account>({});
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/signin");
    });

    const basketRaw = window.sessionStorage.getItem("ithinkly_checkout_basket");
    const accountRaw = window.localStorage.getItem("ithinkly_account");

    if (basketRaw) setBasketItems(JSON.parse(basketRaw));
    if (accountRaw) setAccount(JSON.parse(accountRaw));
  }, [router]);

  const subtotal = basketItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!paymentMethod || basketItems.length === 0) return;
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:py-12">
        <a href="/market" className="text-sm text-zinc-500 hover:text-zinc-900">
          Back to market
        </a>

        <div className="mt-8 border-b border-zinc-200 pb-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Checkout</h1>
        </div>

        {submitted ? (
          <section className="py-12">
            <p className="text-base text-zinc-700">Payment and order placement are ready to connect.</p>
          </section>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-12 py-10 lg:grid-cols-[1fr_360px]">
            <div className="space-y-10">
              <section>
                <h2 className="text-xl font-semibold">DELIVERY INFORMATION</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first-name" className="mb-2 block text-sm text-zinc-600">First name *</label>
                    <input id="first-name" name="firstName" required className="w-full rounded-full border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-400" />
                  </div>
                  <div>
                    <label htmlFor="middle-name" className="mb-2 block text-sm text-zinc-600">Middle name</label>
                    <input id="middle-name" name="middleName" className="w-full rounded-full border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-400" />
                  </div>
                  <div>
                    <label htmlFor="last-name" className="mb-2 block text-sm text-zinc-600">Last name *</label>
                    <input id="last-name" name="lastName" required className="w-full rounded-full border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-400" />
                  </div>
                  <div>
                    <label htmlFor="country" className="mb-2 block text-sm text-zinc-600">Country *</label>
                    <input id="country" name="country" defaultValue="United Kingdom" required readOnly className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 outline-none read-only:bg-zinc-50" />
                  </div>
                  <div>
                    <label htmlFor="city" className="mb-2 block text-sm text-zinc-600">City *</label>
                    <input id="city" name="city" defaultValue={account.city || ""} required className="w-full rounded-full border border-zinc-200 px-4 py-3 outline-none focus:border-zinc-400" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="mb-2 block text-sm text-zinc-600">Address *</label>
                    <input id="address" name="address" defaultValue={account.deliveryAddress || ""} required readOnly={Boolean(account.deliveryAddress)} className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 outline-none read-only:bg-zinc-50" />
                  </div>
                  <div>
                    <label htmlFor="postcode" className="mb-2 block text-sm text-zinc-600">Postcode *</label>
                    <input id="postcode" name="postcode" defaultValue={account.postcode || ""} required readOnly={Boolean(account.postcode)} className="w-full rounded-full border border-zinc-200 bg-white px-4 py-3 outline-none read-only:bg-zinc-50" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-zinc-500">To change your locked delivery details, edit your profile and return to checkout.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">PAYMENT METHOD</h2>
                <div className="mt-6 space-y-3">
                  {["Apple Pay", "Google Pay"].map((method) => (
                    <label key={method} className={`flex cursor-pointer items-center gap-3 rounded-full border px-4 py-3 text-sm ${paymentMethod === method ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200"}`}>
                      <input type="radio" name="paymentMethod" value={method} checked={paymentMethod === method} onChange={(event) => setPaymentMethod(event.target.value)} className="sr-only" />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>

            <aside className="h-fit rounded-2xl border border-zinc-200 p-6">
              <h2 className="text-xl font-semibold">ORDER SUMMARY</h2>
              <div className="mt-6 space-y-4">
                {basketItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                    <div><p className="font-medium">{item.name}</p><p className="mt-1 text-zinc-500">Quantity: {item.quantity}</p></div>
                    <span>£{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-zinc-200 pt-4 text-sm">
                <div className="flex justify-between text-zinc-500"><span>Order subtotal</span><span>£{subtotal}</span></div>
                <div className="mt-2 flex justify-between text-lg font-medium"><span>Total</span><span>£{subtotal}</span></div>
              </div>
              <button type="submit" disabled={!paymentMethod || basketItems.length === 0} className="mt-6 w-full rounded-full bg-zinc-900 px-4 py-3 text-sm font-medium uppercase tracking-[0.14em] text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300">PAY &amp; PLACE ORDER</button>
            </aside>
          </form>
        )}
      </div>
    </main>
  );
}
