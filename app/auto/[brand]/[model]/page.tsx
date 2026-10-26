import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Landing from "@/components/seo/Landing";
import { modelLanding, modelParams } from "@/lib/seo-pages";

export const dynamicParams = false;
export function generateStaticParams() {
  return modelParams("car");
}

type Props = { params: Promise<{ brand: string; model: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  return modelLanding("car", p.brand, p.model)?.meta || {};
}

export default async function Page({ params }: Props) {
  const p = await params;
  const page = modelLanding("car", p.brand, p.model);
  if (!page) notFound();
  return <Landing {...page.props} />;
}
