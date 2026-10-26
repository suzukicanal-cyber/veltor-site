import type { Metadata } from "next";
import Quiz from "@/components/Quiz";

export const metadata: Metadata = {
  title: "Подбор мотоцикла из Кореи за минуту",
  description: "Ответьте на шесть вопросов — тип техники, класс или модель, бюджет под ключ, год, сроки и город — и отправьте готовую заявку менеджеру VELTOR в Telegram. Подберём мотоцикл, скутер или авто из Южной Кореи.",
  alternates: { canonical: "/podbor/" },
  openGraph: {
    type: "website", locale: "ru_RU", siteName: "VELTOR", url: "/podbor/",
    title: "Подбор мотоцикла из Кореи за минуту — VELTOR",
    description: "Шесть вопросов вместо анкеты: менеджер получит готовую заявку и ответит вариантами из Кореи с ценой под ключ.",
    images: [{ url: "/feed/f0.jpg", width: 560, height: 420 }],
  },
};

/** Standalone quiz page: a short link for Instagram bio, replies in VK, the Telegram channel (/podbor/?src=vk). */
export default function PodborPage() {
  return <Quiz as="h1" />;
}
