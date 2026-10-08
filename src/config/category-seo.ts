// Landing copy for /products?category=<slug>. Each category URL is its own
// page for search: own title, description, H1, canonical and intro.
//
// Facts here come from the products, product_size_overrides and product_sizes
// tables (2026-10-07). When a price or a product changes in Admin, update the
// matching intro. Copy describes ingredients, sizes, prices and pickup only:
// no health claims beyond the lawyer-approved product and category names.

import { PICKUP_LOCATION, HOURS_SUMMARY } from "@/config/business";

export interface CategorySeo {
  title: string;
  description: string;
  h1: string;
  intro: string[];
}

const PICKUP_LINE = `Order online and pick up at ${PICKUP_LOCATION}, Portsmouth, VA. Pickup hours are ${HOURS_SUMMARY}. We do not deliver.`;

const JUICE_SIZES =
  "Most blends come in 10 oz ($9), 16 oz ($11) and 24 oz ($14) bottles, plus half gallons ($40) and gallons ($80) for sharing.";

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  "wellness-shots": {
    title: "Ginger & Turmeric Wellness Shots | imPRESSive Portsmouth",
    description: `Cold-pressed wellness shots, $4 each: ginger, turmeric, beet and kale. Pressed fresh at 719 High St, Portsmouth, VA. Order online for pickup.`,
    h1: "Cold-Pressed Wellness Shots in Portsmouth, VA",
    intro: [
      "Our wellness shots are small, single-serve drinks pressed from a few strong ingredients. There are four on the menu, and each one is $4.",
      "The Ginger shot is ginger, lemon and apple. The Turmeric shot is turmeric, orange, black pepper and lemon. The Beet shot is beet, ginger and apple. The Kale shot is kale, lime and apple. Each one is a drink, not a supplement.",
      "Shots are made at our juice bar inside Bloom Market on High Street in Portsmouth. Add a few to an order of juice, or pick up a mix to keep in the fridge for the week.",
      PICKUP_LINE,
    ],
  },
  "energy-immunity-booster": {
    title: "Energy & Immunity Booster Juices | imPRESSive Portsmouth",
    description: `Cold-pressed juices with beet, ginger, carrot, citrus and greens. 10 oz from $9, up to gallons. Made fresh in Portsmouth, VA. Order online for pickup.`,
    h1: "Energy & Immunity Booster Juices",
    intro: [
      "This part of the menu leans on beet, ginger, carrot, citrus and greens. Four cold-pressed blends sit here.",
      "Immunity Boost is grapefruit, grape and spinach. Bleeding Heart is beet, apple and ginger. Glowin is orange, apple, carrot and ginger. Beets Me is beet, carrot, celery, apple and turmeric.",
      `Every bottle is cold-pressed at our shop on High Street in Portsmouth, VA. ${JUICE_SIZES} You can add extras to a single bottle when you order.`,
      PICKUP_LINE,
    ],
  },
  "detox-fat-burners": {
    title: "Detox & Fat Burners Juices | imPRESSive Portsmouth",
    description: `Green and citrus cold-pressed juices: cucumber, kale, lemon, pineapple, ginger. 10 oz from $9. Made fresh in Portsmouth, VA. Order online for pickup.`,
    h1: "Detox & Fat Burners Juices",
    intro: [
      "Our Detox & Fat Burners blends are the greens and citrus side of the menu, built on cucumber, kale, spinach, lemon, pineapple and ginger.",
      "Pineapple Express is pineapple, cucumber, spinach and ginger. Morning Detox is cucumber, spinach, celery, apple and kale. Kale Yea is kale, cucumber, apple and lime. Lemon Drop is lemon, pineapple, cucumber and ginger. Oh Sh*t is cucumber, carrot, apple, lemon and parsley. The Cure is orange, lemon, ginger, garlic and cayenne.",
      `Each juice is cold-pressed at our shop on High Street in Portsmouth, VA. ${JUICE_SIZES}`,
      PICKUP_LINE,
    ],
  },
  "sweet-treats": {
    title: "Sweet Treats Fruit Juices | imPRESSive Portsmouth",
    description: `Fruit-forward cold-pressed juices: berries, kiwi, mango, pomegranate, watermelon. 10 oz from $9. Made fresh in Portsmouth, VA. Order online for pickup.`,
    h1: "Sweet Treats: Fruit-Forward Cold-Pressed Juices",
    intro: [
      "Sweet Treats are our fruit-first juices, and a good place to start if you are new to cold-pressed juice.",
      "Pomegranate PEARadise is pomegranate, pear, apple and pineapple. Kiwi Kwencher is kiwi, strawberry, apple, mango and pineapple. Apple Mango Tango is apple, mango, pineapple and ginger. Very Berry is strawberry, blueberry, raspberry, apple and lime. Summer Breeze is watermelon, pineapple and mint.",
      "Every bottle is cold-pressed at our shop on High Street in Portsmouth, VA. Very Berry and Summer Breeze come in 10 oz ($9), 16 oz ($11) and 24 oz ($14). The other blends also come in half gallons ($40) and gallons ($80).",
      PICKUP_LINE,
    ],
  },
  "detox-packages": {
    title: "1-Day & 3-Day Juice Cleanse, Portsmouth VA | imPRESSive",
    description: `1-day and 3-day cold-pressed juice packages, made fresh in Portsmouth, VA. 1-day from $35, 3-day from $110. Order online for pickup at 719 High St.`,
    h1: "1-Day & 3-Day Juice Cleanse Packages",
    intro: [
      "Our detox packages bundle a full day, or three days, of cold-pressed juice into one order, so you can pick it all up at once.",
      "The 1 Day Detox comes in 16 oz bottles for $35 or 24 oz bottles for $40. The 3 Day Detox is $110 with 16 oz bottles or $125 with 24 oz bottles, and there is also a monthly subscription option at $114.95.",
      "Packages come from our shop on High Street in Portsmouth, VA. Order ahead online and choose a pickup time at checkout. If you have questions about what is in a package, call us at (757) 381-6980 before you order.",
      PICKUP_LINE,
    ],
  },
  food: {
    title: "Salads, Parfaits & Muffins | imPRESSive Juice Bar Portsmouth",
    description: `Cobb and Caesar salads from $6.50, parfaits, fruit cups and blueberry muffins. Made fresh at 719 High St, Portsmouth, VA. Order online for pickup.`,
    h1: "Salads, Parfaits, Fruit & Muffins",
    intro: [
      "Pair your juice with something to eat. Our food menu is short and simple.",
      "The Cobb Salad and Caesar Salad are $6.50, or $8.00 with chicken, and you choose Ranch, Italian or Caesar dressing. Parfaits are $5. The Fruit Cup is a seasonal fruit mix, $5 for a cup or $7.50 for a bowl. Blueberry muffins come in a 3 pack for $4 or a 6 pack for $7.",
      "Add food to a juice order and pick it all up together at our shop on High Street in Portsmouth, VA. Food is listed with its price and options on each product page.",
      PICKUP_LINE,
    ],
  },
  subscriptions: {
    title: "Juice Subscriptions & Gift Cards | imPRESSive Portsmouth",
    description: `Juice pickup plans: choose 3 cold-pressed flavors, 16 oz for $50 or 24 oz for $60, weekly or monthly. eGift cards $25 to $200. Portsmouth, VA pickup.`,
    h1: "Juice Subscriptions & Gift Cards",
    intro: [
      "A subscription keeps your favorite juices coming without placing a new order each time. Plans are for pickup at our shop.",
      "With the 3 Pack Subscription you choose three flavors. It is $50 with 16 oz bottles or $60 with 24 oz bottles, on a weekly or monthly schedule. Your juice is pressed fresh at our shop on High Street in Portsmouth, VA, and waits for you at pickup.",
      "Shopping for someone else? Our eGift Card comes in $25, $50, $100, $150 and $200 amounts. It is sent by email, and the balance can be applied at online checkout.",
      PICKUP_LINE,
    ],
  },
};
