"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Bell,
  CreditCard,
  Inbox,
  LayoutGrid,
  Search,
  Settings,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { StatusBadge } from "@/components/data/status-badge";
import { StatCard } from "@/components/cards/stat-card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { fade, slideUp, staggerContainer } from "@/lib/motion";
import { formatMoney, formatCompact } from "@/lib/format";

/* --------------------------------- helpers -------------------------------- */

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      variants={slideUp}
      initial="hidden"
      animate="visible"
      className="scroll-mt-20 border-t border-border py-12 first:border-t-0"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </motion.section>
  );
}

function Swatch({
  className,
  name,
  hex,
  border,
}: {
  className: string;
  name: string;
  hex: string;
  border?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={`h-14 w-full rounded-lg ${className} ${border ? "border border-border" : ""}`}
      />
      <div className="text-xs font-medium">{name}</div>
      <div className="text-muted-foreground tabular text-[11px]">{hex}</div>
    </div>
  );
}

/* --------------------------------- page ----------------------------------- */

const emailSchema = z.object({
  email: z.string().email("Enter a valid work email"),
});
type EmailForm = z.infer<typeof emailSchema>;

export default function StyleGuidePage() {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    mode: "onTouched",
  });

  return (
    <div className="min-h-screen">
      {/* Sticky header */}
      <header className="bg-background/80 sticky top-0 z-30 border-b border-border backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand flex size-6 items-center justify-center rounded-md">
              <LayoutGrid className="text-brand-foreground size-3.5" />
            </div>
            <span className="text-sm font-semibold">Design System</span>
            <Badge variant="secondary" className="ml-1">
              L0
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommandOpen(true)}
              className="gap-2"
            >
              <Search className="size-3.5" />
              Search
              <kbd className="bg-muted text-muted-foreground tabular rounded px-1 text-[10px]">
                ⌘K
              </kbd>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        {/* Intro */}
        <motion.div
          variants={fade}
          initial="hidden"
          animate="visible"
          className="py-12"
        >
          <p className="text-brand-text text-xs font-semibold tracking-wide uppercase">
            Creator Asset Marketplace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
            The foundation every screen is built on
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl text-sm">
            Tokens, typography, and components — premium, accessible, and
            theme-aware. Toggle dark mode in the header to see every token flip.
          </p>
        </motion.div>

        {/* Colors */}
        <Section
          id="colors"
          title="Color"
          description="Semantic surface roles + the emerald brand scale + status tones. Every value is a token that flips with the theme."
        >
          <div className="space-y-8">
            <div>
              <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                Surfaces
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                <Swatch className="bg-background" name="background" hex="#FAFAFA" border />
                <Swatch className="bg-card" name="card" hex="#FFFFFF" border />
                <Swatch className="bg-muted" name="muted" hex="#F4F5F7" />
                <Swatch className="bg-secondary" name="secondary" hex="#F4F5F7" />
                <Swatch className="bg-primary" name="primary" hex="#111827" />
                <Swatch className="bg-foreground" name="foreground" hex="#111827" />
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                Brand · emerald
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                <Swatch className="bg-brand-50" name="brand-50" hex="#ECFDF5" border />
                <Swatch className="bg-brand-100" name="brand-100" hex="#D1FAE5" />
                <Swatch className="bg-brand-500" name="brand-500" hex="#10B981" />
                <Swatch className="bg-brand-600" name="brand-600" hex="#059669" />
                <Swatch className="bg-brand-700" name="brand-700" hex="#047857" />
                <Swatch className="bg-brand" name="brand (fill)" hex="#059669" />
              </div>
            </div>

            <div>
              <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                Status tones
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Swatch className="bg-success" name="success" hex="#22C55E" />
                <Swatch className="bg-warning" name="warning" hex="#F59E0B" />
                <Swatch className="bg-danger" name="danger" hex="#EF4444" />
                <Swatch className="bg-info" name="info" hex="#3B82F6" />
              </div>
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section
          id="typography"
          title="Typography"
          description="Geist for UI, Geist Mono for tabular money & IDs."
        >
          <div className="space-y-4">
            <div className="text-4xl font-semibold tracking-tight">
              Display — Series-A polish
            </div>
            <div className="text-2xl font-semibold tracking-tight">
              Heading 1 — campaign performance
            </div>
            <div className="text-lg font-semibold">Heading 2 — section title</div>
            <p className="text-sm">
              Body — The marketplace where brands and creators run campaigns,
              negotiate terms, deliver proof of work, and get paid through secure
              escrow.
            </p>
            <p className="text-muted-foreground text-xs">
              Caption / muted — supporting metadata and helper text.
            </p>
            <div className="flex flex-wrap items-baseline gap-6 pt-2">
              <span className="tabular text-2xl font-semibold">
                {formatMoney(1284500)}
              </span>
              <span className="tabular text-muted-foreground text-sm">
                {formatCompact(128400)} followers
              </span>
              <span className="tabular text-muted-foreground text-sm">
                txn_8Hq2Lp
              </span>
            </div>
          </div>
        </Section>

        {/* Radii & shadows */}
        <Section
          id="elevation"
          title="Radius & elevation"
          description="Moderate radii and soft, border-led shadows — never glassy."
        >
          <div className="flex flex-wrap gap-6">
            {[
              ["rounded-md", "md · 8"],
              ["rounded-lg", "lg · 10"],
              ["rounded-xl", "xl · 12"],
              ["rounded-2xl", "2xl · 16"],
            ].map(([cls, label]) => (
              <div key={label} className="space-y-2 text-center">
                <div className={`bg-card border border-border size-16 ${cls}`} />
                <div className="text-muted-foreground text-xs">{label}</div>
              </div>
            ))}
            <Separator orientation="vertical" className="h-16" />
            {[
              ["shadow-xs", "xs"],
              ["shadow-sm", "sm"],
              ["shadow-md", "md"],
              ["shadow-lg", "lg"],
            ].map(([cls, label]) => (
              <div key={label} className="space-y-2 text-center">
                <div className={`bg-card size-16 rounded-xl ${cls}`} />
                <div className="text-muted-foreground text-xs">{label}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Buttons */}
        <Section
          id="buttons"
          title="Buttons"
          description="One system: variants, sizes, and states. Emerald is reserved for the primary path."
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="brand">Primary action</Button>
              <Button variant="default">Default</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="destructive-solid">Delete</Button>
              <Button variant="link">Link</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="brand" size="sm">
                Small
              </Button>
              <Button variant="brand">Default</Button>
              <Button variant="brand" size="lg">
                Large
              </Button>
              <Button variant="brand" size="xl">
                Extra large
              </Button>
              <Button variant="brand" loading>
                Saving
              </Button>
              <Button variant="brand" disabled>
                Disabled
              </Button>
              <Button variant="outline" size="icon" aria-label="Settings">
                <Settings />
              </Button>
            </div>
          </div>
        </Section>

        {/* Forms */}
        <Section
          id="forms"
          title="Form controls"
          description="Inputs, selects, toggles, and Zod-validated fields mapping to the backend's error envelope."
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display name</Label>
                <Input id="name" placeholder="Maya Okonkwo" />
              </div>
              <form
                className="space-y-2"
                onSubmit={handleSubmit(() =>
                  toast.success("Looks valid", { description: "Form submitted." }),
                )}
                noValidate
              >
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  placeholder="ops@brand.co"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-danger-text text-xs">{errors.email.message}</p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Try submitting empty to see the error state.
                  </p>
                )}
                <Button type="submit" variant="brand" size="sm" className="mt-1">
                  Submit
                </Button>
              </form>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="niche">Primary niche</Label>
                <Select>
                  <SelectTrigger id="niche">
                    <SelectValue placeholder="Select a niche" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" placeholder="Tell brands about your audience…" />
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="terms" defaultChecked />
                <Label htmlFor="terms" className="font-normal">
                  I agree to the marketplace terms
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="emails" defaultChecked />
                <Label htmlFor="emails" className="font-normal">
                  Email me about new campaigns
                </Label>
              </div>
            </div>
          </div>
        </Section>

        {/* Status & badges */}
        <Section
          id="status"
          title="Status badges"
          description="A single component covers every backend state-machine, so color is consistent platform-wide."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge domain="campaign" status="PUBLISHED" />
              <StatusBadge domain="campaign" status="NEGOTIATION" />
              <StatusBadge domain="campaign" status="COMPLETED" />
              <StatusBadge domain="application" status="ACCEPTED" />
              <StatusBadge domain="offer" status="COUNTERED" />
              <StatusBadge domain="contract" status="PENDING_FUNDING" />
              <StatusBadge domain="payment" status="RELEASED" />
              <StatusBadge domain="payment" status="FAILED" />
              <StatusBadge domain="submission" status="REVISION_REQUESTED" />
              <StatusBadge domain="verification" status="APPROVED" />
              <StatusBadge domain="verificationState" status="UNVERIFIED" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>
        </Section>

        {/* Cards & metrics */}
        <Section
          id="cards"
          title="Cards & metrics"
          description="The StatCard is the atom of every dashboard."
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div variants={slideUp}>
              <StatCard
                label="Available balance"
                value={formatMoney(842300)}
                icon={<Wallet className="size-4" />}
                delta={{ value: "12.4%", direction: "up" }}
                hint="Across 6 contracts"
              />
            </motion.div>
            <motion.div variants={slideUp}>
              <StatCard
                label="Active campaigns"
                value="14"
                icon={<TrendingUp className="size-4" />}
                delta={{ value: "3", direction: "up" }}
              />
            </motion.div>
            <motion.div variants={slideUp}>
              <StatCard
                label="In escrow"
                value={formatMoney(218000)}
                icon={<CreditCard className="size-4" />}
                delta={{ value: "2.1%", direction: "down" }}
              />
            </motion.div>
            <motion.div variants={slideUp}>
              <StatCard
                label="Creators reached"
                value={formatCompact(48200)}
                mono={false}
                icon={<Users className="size-4" />}
              />
            </motion.div>
          </motion.div>

          <Card className="mt-6 max-w-md">
            <CardHeader>
              <CardTitle>Northwind × Maya</CardTitle>
              <CardDescription>Instagram Reel · 30-day exclusivity</CardDescription>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Agreed price reflects a 10% platform commission held in escrow until
              the deliverable is approved.
            </CardContent>
            <CardFooter className="justify-between">
              <span className="tabular text-lg font-semibold">
                {formatMoney(150000)}
              </span>
              <Button variant="brand" size="sm">
                Fund contract
              </Button>
            </CardFooter>
          </Card>
        </Section>

        {/* Overlays */}
        <Section
          id="overlays"
          title="Overlays & menus"
          description="Accessible Radix primitives — dialog, drawer, dropdown, popover, tooltip, command, and toasts."
        >
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Release payment</DialogTitle>
                  <DialogDescription>
                    This transfers escrowed funds to the creator, minus platform
                    commission. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="brand">Release funds</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open drawer</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine the campaign marketplace.
                  </SheetDescription>
                </SheetHeader>
                <div className="text-muted-foreground px-4 text-sm">
                  Filter controls render here on mobile.
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button variant="brand">Apply</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Dropdown</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="size-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell className="size-4" /> Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="text-sm">
                <p className="font-medium">Escrow protected</p>
                <p className="text-muted-foreground mt-1">
                  Funds are held until you approve the deliverable.
                </p>
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>Commission: 10%</TooltipContent>
            </Tooltip>

            <Button variant="outline" onClick={() => setCommandOpen(true)}>
              Command (⌘K)
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                toast.success("Payment released", {
                  description: formatMoney(135000) + " sent to Maya",
                })
              }
            >
              Toast success
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.error("Checkout failed", {
                  description: "Card was declined.",
                })
              }
            >
              Toast error
            </Button>
          </div>
        </Section>

        {/* Data & states */}
        <Section
          id="data"
          title="Data & states"
          description="Tables, skeleton loaders, empty and error states — the universal surfaces behind every query."
        >
          <div className="space-y-8">
            <Card className="overflow-hidden p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Summer launch</TableCell>
                    <TableCell>
                      <StatusBadge domain="campaign" status="PUBLISHED" />
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatMoney(500000)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Holiday UGC</TableCell>
                    <TableCell>
                      <StatusBadge domain="campaign" status="NEGOTIATION" />
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatMoney(320000)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Q4 ambassador</TableCell>
                    <TableCell>
                      <StatusBadge domain="campaign" status="COMPLETED" />
                    </TableCell>
                    <TableCell className="tabular text-right">
                      {formatMoney(875000)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Loading
                </p>
                <Card className="gap-3 p-5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </Card>
              </div>
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Empty
                </p>
                <Card className="p-0">
                  <EmptyState
                    icon={<Inbox />}
                    title="No applications yet"
                    description="When creators apply to your campaign, they'll show up here."
                    action={
                      <Button variant="brand" size="sm">
                        Share campaign
                      </Button>
                    }
                  />
                </Card>
              </div>
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Error
                </p>
                <Card className="p-0">
                  <ErrorState onRetry={() => toast.message("Retrying…")} />
                </Card>
              </div>
            </div>
          </div>
        </Section>
      </main>

      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search campaigns, creators, contracts…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem>
              <LayoutGrid /> Dashboard
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <Wallet /> Wallet
            </CommandItem>
            <CommandItem>
              <Users /> Creators
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem>
              <Bell /> Notification preferences
            </CommandItem>
            <CommandItem>
              <Settings /> Settings
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
