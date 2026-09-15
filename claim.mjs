import { getStore } from "@netlify/blobs";

const PRIZES = [
  "خصم 10% 🎉",
  "كوب قهوة مجانًا ☕",
  "خصم 20 جنيه 🎁",
  "كيس بن مجانًا 🫘",
  "حاول مرة تانية 😄"
];

function prizeFor(code) {
  let hash = 0;
  for (const ch of code) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return PRIZES[hash % PRIZES.length];
}

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { message: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    const { code } = await req.json();
    const normalized = String(code || "").trim().toUpperCase();

    if (!/^ASHRY-\d{3,6}$/.test(normalized)) {
      return Response.json(
        { message: "الكود غير صحيح" },
        { status: 400 }
      );
    }

    const store = getStore({
      name: "ashry-scratch-cards",
      consistency: "strong"
    });

    const key = `code:${normalized}`;

    const existing = await store.get(key, {
      type: "json",
      consistency: "strong"
    });

    if (existing) {
      return Response.json(
        { message: "الكارت ده اتستخدم قبل كده ❤️" },
        { status: 409 }
      );
    }

    const record = {
      usedAt: new Date().toISOString(),
      prize: prizeFor(normalized)
    };

    const result = await store.set(
      key,
      JSON.stringify(record),
      { onlyIfNew: true }
    );

    if (!result.modified) {
      return Response.json(
        { message: "الكارت ده اتستخدم قبل كده ❤️" },
        { status: 409 }
      );
    }

    return Response.json({ prize: record.prize });

  } catch (err) {
    console.error(err);

    return Response.json(
      { message: "حصل عطل بسيط. جرّب مرة تانية." },
      { status: 500 }
    );
  }
};
