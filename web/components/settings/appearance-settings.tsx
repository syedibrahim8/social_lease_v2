"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const current = theme ?? "system";

  return (
    <Card className="max-w-xl gap-4 p-6">
      <div>
        <h3 className="text-sm font-semibold">Appearance</h3>
        <p className="text-muted-foreground text-sm">
          Choose how the app looks. System follows your device setting.
        </p>
      </div>
      <RadioGroup
        value={current}
        onValueChange={setTheme}
        className="grid grid-cols-3 gap-3"
      >
        {options.map((o) => (
          <Label
            key={o.value}
            htmlFor={`theme-${o.value}`}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-colors",
              current === o.value
                ? "border-brand bg-brand-muted/40"
                : "border-border hover:bg-muted",
            )}
          >
            <o.icon className="text-muted-foreground size-5" />
            <span className="text-sm font-medium">{o.label}</span>
            <RadioGroupItem id={`theme-${o.value}`} value={o.value} className="sr-only" />
          </Label>
        ))}
      </RadioGroup>
    </Card>
  );
}
