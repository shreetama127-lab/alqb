// Maps each bank + term to its Stripe price ID.
// OCR reuses its existing prices (the old £35/£50 are now relabelled 3 months / lifetime).
export const STRIPE_PRICES: Record<string, Record<string, string>> = {
  "ocr-biology": {
    "1month": "price_1TzdT9FQ6wQ5hk5qGylu18tc",
    "3months": "price_1TzdU1FQ6wQ5hk5qadvtmmzs",
    "lifetime": "price_1TzdUrFQ6wQ5hk5qGPgZ5mml",
  },
  "aqa-biology": {
    "1month": "price_1UaGUc438HObt9TcYeLyG6fl",
    "3months": "price_1UaGXx438HObt9TcoXqKNsmc",
    "lifetime": "price_1UaGY9438HObt9TcelHbwYHP",
  },
};