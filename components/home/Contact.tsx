import Mission from "./Mission";
import ContactCta from "./ContactCta";
import Visitka from "./Visitka";

export default function Contact() {
  return (
    <section className="section wrap" id="contact">
      <div className="inner">
        <Mission />
        <div className="contact-grid">
          <div className="contact-copy">
            <h2>Расскажите, о чём мечтаете</h2>
            <p className="lead">Ответим в Telegram, созвонимся или встретимся лично в Москве.</p>
            <p className="cta-note">Без анкет и форм: вы пишете нам напрямую, на сайте ничего не сохраняется.</p>
            <ContactCta />
          </div>
          <div className="rs-wrap"><Visitka /></div>
        </div>
      </div>
    </section>
  );
}
