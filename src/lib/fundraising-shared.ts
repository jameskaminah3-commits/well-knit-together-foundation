export const donationAmounts = [500, 1000, 2500, 5000];

export function formatMoney(amount: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
