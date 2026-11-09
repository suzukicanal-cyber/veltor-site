"use client";
import { useState } from "react";
import { asset } from "@/lib/site";
import Lightbox from "../catalog/Lightbox";

const N = 7;
const ALT = ["BMW S 1000 R перед упаковкой в порту Инчхон", "Упакованный BMW S 1000 R в контейнере", "Упаковка мотоцикла на паллете", "BMW S 1000 RR в обрешётке перед погрузкой", "Мотоциклы в деревянных обрешётках на складе", "BMW R 1300 GS на паллете перед упаковкой", "Перевозка мотоцикла на склад консолидации"];

/** Photos of buying out and shipping, under step 4 of the process; opens full size on click. */
export default function ProcessPhotos() {
  const [lb, setLb] = useState<number | null>(null);
  const big = Array.from({ length: N }, (_, i) => asset(`process/p${i + 1}.jpg`));
  return (
    <div className="step-ph">
      <ul>
        {big.map((src, i) => (
          <li key={src}><button type="button" onClick={() => setLb(i)} aria-label={`Открыть фото: ${ALT[i]}`}>
            <img src={asset(`process/p${i + 1}-s.jpg`)} alt={ALT[i]} loading="lazy" decoding="async" />
          </button></li>
        ))}
      </ul>
      {lb !== null && <Lightbox photos={big} start={lb} name="Выкуп и отправка" onClose={() => setLb(null)} />}
    </div>
  );
}
