import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Landing from "@/components/seo/Landing";
import { brandLanding, brandParams } from "@/lib/seo-pages";

export const dynamicParams = false;
export function generateStaticParams() {
  return brandParams("car");
}

type Props = { params: Promise<{ brand: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return brandLanding("car", (await params).brand)?.meta || {};
}

export default async function Page({ params }: Props) {
  const page = brandLanding("car", (await params).brand);
  if (!page) notFound();
  return <Landing {...page.props} />;
}
