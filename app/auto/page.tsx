import Landing from "@/components/seo/Landing";
import { typeLanding } from "@/lib/seo-pages";

const page = typeLanding("car");
export const metadata = page.meta;

export default function Page() {
  return <Landing {...page.props} />;
}
