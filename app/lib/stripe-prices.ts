// Maps a plan + billing term to its Stripe Price ID.
// Only OCR Biology is live for now.
export const STRIPE_PRICES: Record<string, Record<string, string>> = {
  "ocr-biology": {
    "1month": "price_1TzdT9FQ6wQ5hk5qGylu18tc",
    "6months": "price_1TzdU1FQ6wQ5hk5qadvtmmzs",
    "1year": "price_1TzdUrFQ6wQ5hk5qGPgZ5mml",
    "exam": "price_1TzdVYFQ6wQ5hk5qSBppR3nG",
  },
};