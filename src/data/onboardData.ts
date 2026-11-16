export type Slide = {
  id: string;
  kind: "stock" | "orders" | "team";
  eyebrow: string;
  title: string;
  description: string;
};

export const onboardingData: Slide[] = [
  {
    id: "1",
    kind: "stock",
    eyebrow: "01 · INVENTORY",
    title: "Know exactly what is on every shelf",
    description: "Track stock levels, set reorder points and get a nudge before an item runs out, not after a customer asks for it.",
  },
  {
    id: "2",
    kind: "orders",
    eyebrow: "02 · ORDERS",
    title: "From first call to final delivery",
    description: "Create orders in seconds, watch stock update automatically and move each order from pending to delivered.",
  },
  {
    id: "3",
    kind: "team",
    eyebrow: "03 · TEAM",
    title: "Run the day with your whole team",
    description: "Keep staff, shifts and suppliers in one place, and see who handled which order at a glance.",
  },
];
