
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

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        message: "Method not allowed"
      })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const code = String(body.code || "").trim().toUpperCase();

    if (!/^ASHRY-\d{3,6}$/.test(code)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "الكود غير صحيح"
        })
      };
    }

    const store = getStore({
      name: "ashry-scratch-cards",
      consistency: "strong"
    });

    const key = `code:${code}`;

    const existing = await store.get(key, {
      type: "json",
      consistency: "strong"
    });

    if (existing) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "الكارت ده اتستخدم قبل كده ❤️"
        })
      };
    }

    const record = {
      usedAt: new Date().toISOString(),
      prize: prizeFor(code)
    };

    const result = await store.set(
      key,
      JSON.stringify(record),
      { onlyIfNew: true }
    );

    if (!result.modified) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          message: "الكارت ده اتستخدم قبل كده ❤️"
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        prize: record.prize
      })
    };

  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "حصل عطل بسيط. جرّب مرة تانية."
      })
    };
  }
};
