import { MerchantAdapter } from "@/lib/merchants/types";
import { HepsiburadaAdapter } from "@/lib/merchants/hepsiburada-adapter";
import { IdefixAdapter } from "@/lib/merchants/idefix-adapter";

export const adapters: MerchantAdapter[] = [new HepsiburadaAdapter(), new IdefixAdapter()];

export function getAdapterByUrl(url: string): MerchantAdapter | null {
  return adapters.find((a) => a.canHandle(url)) ?? null;
}
