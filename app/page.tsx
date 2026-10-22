import Hero from "@/components/home/Hero";
import Facts from "@/components/home/Facts";
import Cats from "@/components/home/Cats";
import Process from "@/components/home/Process";
import Inspect from "@/components/home/Inspect";
import Pay from "@/components/home/Pay";
import Route from "@/components/home/Route";
import Services from "@/components/home/Services";
import Stock from "@/components/home/Stock";
import Social from "@/components/home/Social";
import Faq from "@/components/home/Faq";
import Contact from "@/components/home/Contact";
import JsonLd from "@/components/JsonLd";
import { FAQ, PROCESS } from "@/data/content";

const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [...PROCESS, ...FAQ].map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
};

export default function Home() {
  return (
    <>
      <JsonLd data={FAQ_LD} />
      <Hero />
      <Facts />
      <Cats />
      <Process />
      <Inspect />
      <Pay />
      <Route />
      <Services />
      <Stock />
      <Social />
      <Faq />
      <Contact />
    </>
  );
}
