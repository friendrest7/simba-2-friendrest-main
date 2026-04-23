import type { BranchName } from "@/lib/demo-store";

const BRANCH_SEARCH_TERMS: Record<BranchName, string> = {
  Remera: "Simba Supermarket Remera Kigali Rwanda",
  Kimironko: "Simba Supermarket Kimironko Kigali Rwanda",
  Kacyiru: "Simba Supermarket Kacyiru Kigali Rwanda",
  Nyamirambo: "Simba Supermarket Nyamirambo Kigali Rwanda",
  Gikondo: "Simba Supermarket Gikondo Kigali Rwanda",
  Kanombe: "Simba Supermarket Kanombe Kigali Rwanda",
  Kinyinya: "Simba Supermarket Kinyinya Kigali Rwanda",
  Kibagabaga: "Simba Supermarket Kibagabaga Kigali Rwanda",
  Nyanza: "Simba Supermarket Nyanza Kigali Rwanda",
};

export function getBranchMapUrl(branch: BranchName) {
  const query = BRANCH_SEARCH_TERMS[branch] ?? `Simba Supermarket ${branch} Kigali Rwanda`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
