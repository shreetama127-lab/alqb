"use client";

import Link from "next/link";

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: "",
    body: [
      "ALQB provides a personalised subscription service that allows our members to access questions and videos (\"ALQB content\") over the Internet to certain computers and other devices (\"ALQB ready devices\").",
      "These Terms of Use govern your use of our service. As used in these Terms of Use, \"ALQB service\", \"our service\", or \"the service\" means the personalised service provided by ALQB for discovering and reading ALQB content, including all features and functionalities, recommendations, the website, and user interfaces, as well as all content and software associated with our service.",
    ],
  },
  {
    heading: "1. Membership",
    body: [
      "1.1 Your ALQB membership will continue until terminated. To use the ALQB service you must have Internet access and an ALQB ready device, and provide us with one or more Payment Methods. \"Payment Method\" means a current, valid, accepted method of payment, as may be updated from time to time, and which may include payment through your account with a third party. Unless you cancel your membership before your billing date, you authorise us to charge the membership fee for the next billing cycle to your Payment Method.",
      "1.2 We may offer a number of membership plans, including memberships offered by third parties in conjunction with the provision of their own products and services. We are not responsible for the products and services provided by such third parties. Some membership plans may have differing conditions and limitations, which will be disclosed at your sign-up or in other communications made available to you.",
      "Promotional Offers. We may from time to time offer special promotional offers, plans or memberships (\"Offers\"). Offer eligibility is determined by ALQB at its sole discretion and we reserve the right to revoke an Offer and put your account on hold in the event that we determine you are not eligible. The eligibility requirements and other limitations and conditions will be disclosed when you sign up for the Offer.",
    ],
  },
  {
    heading: "2. Billing and Cancellation",
    body: [
      "2.1 Billing Cycle. The membership fee for the ALQB service and any other charges you may incur in connection with your use of the service, such as taxes and possible transaction fees, will be charged to your Payment Method on the specific payment date indicated on the \"Settings\" page. The length of your billing cycle will depend on the type of subscription that you choose when you signed up for the service.",
      "2.2 Payment Methods. To use the ALQB service you must provide one or more Payment Methods. You authorise us to charge any Payment Method associated with your account in case your primary Payment Method is declined or is no longer available. You remain responsible for any uncollected amounts. If a payment is not successfully settled and you do not cancel your account, we may suspend your access to the service until we have successfully charged a valid Payment Method.",
      "2.3 Updating your Payment Methods. You can update your Payment Methods by going to the \"Settings\" page. We may also update your Payment Methods using information provided by the payment service providers. Following any update, you authorise us to continue to charge the applicable Payment Method(s).",
      "2.4 Cancellation. You can cancel your ALQB membership at any time, and you will continue to have access to the ALQB service through the end of your billing period. To the extent permitted by applicable law, payments are non-refundable and we do not provide refunds or credits for any partial membership periods or incomplete ALQB content. If you cancel your membership, your account will automatically close at the end of your current billing period.",
      "2.5 Changes to the Price and Subscription Plans. We may change our subscription plans and the price of our service from time to time; however, any price changes or changes to your subscription plans will apply no earlier than 30 days following notice to you.",
    ],
  },
  {
    heading: "3. ALQB Service",
    body: [
      "3.1 You must be at least 16 years of age to become a member of the ALQB service. People under this age may only use the service under the supervision and/or consent of an adult.",
      "3.2 The ALQB service and any content viewed through the service are for your personal and non-commercial use only and may not be shared with individuals not subscribed to the ALQB service. During your ALQB membership we grant you a limited, non-exclusive, non-transferable right to access the ALQB service and view ALQB content. Except for the foregoing, no right, title or interest shall be transferred to you.",
      "3.3 The ALQB service, including the content library, is regularly updated. In addition, we continually test various aspects of our service, including our website, user interfaces, promotional features and availability of ALQB content.",
      "3.4 You agree to use the ALQB service in accordance with all applicable laws, rules and regulations. You agree not to archive, reproduce, distribute, modify, display, perform, publish, license, create derivative works from, offer for sale, or use (except as explicitly authorised in these Terms of Use) content and information contained on or obtained from or through the ALQB service. You also agree not to: circumvent, remove, alter, deactivate, degrade or thwart any of the content protections in the ALQB service; use any robot, spider, scraper or other automated means to access the service; decompile, reverse engineer or disassemble any software accessible through the service; or use any data mining, data gathering or extraction method. We may terminate or restrict your use of our service if you violate these Terms of Use or are engaged in illegal or fraudulent use of the service.",
      "3.5 ALQB software is developed by, or for, ALQB and may solely be used for authorised viewing of ALQB content through ALQB ready devices. This software may vary by device and medium, and functionalities and features may also differ between devices.",
    ],
  },
  {
    heading: "Passwords and Account Access",
    body: [
      "The member who created the ALQB account and whose Payment Method is charged (the \"Account Owner\") is responsible for any activity that occurs through the ALQB account. To maintain control over the account, the Account Owner should maintain control over the ALQB ready devices that are used to access the service and not reveal the password or details of the Payment Method associated with the account to anyone. You are responsible for updating and maintaining the accuracy of the information you provide to us relating to your account. We can terminate your account or place your account on hold in order to protect you, ALQB or our partners from identity theft or other fraudulent activity.",
    ],
  },
  {
    heading: "Warranties and Limitations on Liability",
    body: [
      "The ALQB service is provided \"as is\" and without warranty or condition. In particular, our service may not be uninterrupted or error-free. You waive all special, indirect and consequential damages against us. These terms will not limit any non-waivable warranties or consumer protection rights that you may be entitled to under the mandatory laws of your country of residence.",
    ],
  },
  {
    heading: "Class Action Waiver",
    body: [
      "Where permitted under the applicable law, you and ALQB agree that each may bring claims against the other only in your or its individual capacity, and not as a plaintiff or class member in any purported class or representative proceeding. Further, where permitted under the applicable law, unless both you and ALQB agree otherwise, the court may not consolidate more than one person's claims with your claims.",
    ],
  },
  {
    heading: "4. Miscellaneous",
    body: [
      "4.1 Governing Law. These Terms of Use shall be governed by and construed in accordance with the laws of the United Kingdom.",
      "4.2 Unsolicited Materials. ALQB does not accept unsolicited materials or ideas for ALQB content and is not responsible for the similarity of any of its content or programming in any media to materials or ideas transmitted to ALQB.",
      "4.3 Customer Support. To find more information about our service and its features, or if you need assistance with your account, please email info.alqb@gmail.com.",
      "4.4 Survival. If any provision or provisions of these Terms of Use shall be held to be invalid, illegal, or unenforceable, the validity, legality and enforceability of the remaining provisions shall remain in full force and effect.",
      "4.5 Changes to Terms of Use and Assignment. ALQB may, from time to time, change these Terms of Use. We will notify you at least 30 days before such changes apply to you.",
      "4.6 Electronic Communications. We will send you information relating to your account (e.g. payment authorisations, invoices, changes in password or Payment Method, confirmation messages, notices) in electronic form only, for example via emails to your email address provided during registration.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Terms of Use</h1>
      <p className="mt-2 text-sm text-zinc-500">Last updated: July 2026</p>

      <div className="mt-8 flex flex-col gap-8">
        {SECTIONS.map((s, i) => (
          <section key={i}>
            {s.heading && <h2 className="text-xl font-bold text-zinc-900">{s.heading}</h2>}
            <div className={`flex flex-col gap-3 ${s.heading ? "mt-3" : ""}`}>
              {s.body.map((p, j) => (
                <p key={j} className="text-sm leading-relaxed text-zinc-600">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-10 flex justify-center gap-3">
        <Link href="/privacy" className="rounded-full border-2 border-zinc-200 bg-white px-6 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          Privacy Policy
        </Link>
        <Link href="/" className="rounded-full border-2 border-zinc-200 bg-white px-6 py-3 font-bold text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-300">
          ← Home
        </Link>
      </div>
    </main>
  );
}