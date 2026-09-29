import type { ReactNode } from "react";
import { Label } from "@/ui/components/ui/label";
import { Switch } from "@/ui/components/ui/switch";

interface LabeledSwitchProps {
  id: string;
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const LabeledSwitch = ({
  id,
  label,
  checked,
  onCheckedChange,
}: LabeledSwitchProps) => (
  <div className="flex items-center gap-2">
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    <Label htmlFor={id} className="cursor-pointer">
      {label}
    </Label>
  </div>
);

export { LabeledSwitch };
export type { LabeledSwitchProps };
