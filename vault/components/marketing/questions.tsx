import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Every answer here describes what the code actually does. The temptation on a
 * page like this is to answer the question the reader wishes they had asked;
 * the useful version is the one that survives contact with the product.
 */
const ITEMS = [
  {
    q: "Where is the money while a campaign is running?",
    a: "With the platform, at Stripe, from the moment the brand funds the contract until the delivery is approved. It has left the brand and it has not reached the creator, which is the whole point of escrow.",
  },
  {
    q: "When does a creator actually get paid?",
    a: "When the brand approves the delivery. Approval is what triggers the transfer to the creator's connected Stripe account, so there is no separate step to chase and no payment terms to wait out.",
  },
  {
    q: "What if the work never arrives?",
    a: "While a delivery is still outstanding the brand can refund the contract and the money comes back. Once a delivery has been approved the payment can only be released, not refunded, because approval is the moment the work was accepted.",
  },
  {
    q: "Do creators need a Stripe account?",
    a: "Yes, and it has to be finished before you can apply. The platform will not let someone take on work it would be unable to pay, which is why payout onboarding comes first rather than at the end.",
  },
  {
    q: "Can a brand change its mind after approving?",
    a: "No. Approval releases the money, so it is deliberately the point of no return. If a delivery is not right, the brand asks for a revision instead, and the escrow stays untouched while the creator reworks it.",
  },
  {
    q: "What does it cost?",
    a: "Ten percent of the contract, taken out of the payout. Nothing to browse, nothing to apply, nothing to negotiate.",
  },
];

export function Questions() {
  return (
    <section id="questions" className="border-line-2 scroll-mt-20 border-t py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <h2 className="font-display text-bone text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Questions people actually ask.
          </h2>

          <Accordion type="single" collapsible className="border-line-2 border-t">
            {ITEMS.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
