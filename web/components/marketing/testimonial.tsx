import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Reveal } from "./reveal";

export function Testimonial() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <Reveal className="mx-auto max-w-3xl text-center">
        <blockquote className="text-2xl font-medium tracking-tight text-balance sm:text-3xl">
          “We ran our first campaign end to end in a week — discovery,
          negotiation, escrow, and payout. It felt like the Stripe of creator
          marketing.”
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs">JR</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-medium">Jordan Reyes</p>
            <p className="text-muted-foreground text-xs">Head of Growth · Lumen</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
