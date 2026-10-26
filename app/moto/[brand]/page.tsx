import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Landing from "@/components/seo/Landing";
import { brandLanding, brandParams } from "@/lib/seo-pages";

export const dynamicParams = false;
export function generateStaticParams() {
  return brandParams("moto");
}

type Props = { params: Promise<{ brand: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return brandLanding("moto", (await params).brand)?.meta || {};
}

export default async function Page({ params }: Props) {
  const page = brandLanding("moto", (await params).brand);
  if (!page) notFound();
  return <Landing {...page.props} />;
}
