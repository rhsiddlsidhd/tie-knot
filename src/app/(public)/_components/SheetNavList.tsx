"use client";
import { NAVIGATION_BY_TYPE } from "@/core/domain/navigation";
import { cn } from "@/core/utils/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/components/atoms/accordion";

const SheetNavList = ({
  type,
}: {
  type: keyof typeof NAVIGATION_BY_TYPE;
}) => {
  const pathname = usePathname();
  const { groups, links } = NAVIGATION_BY_TYPE[type];

  return (
    <nav className="flex flex-1 flex-col gap-1 px-4 pt-4">
      <Accordion type="multiple">
        {groups.map((item, index) => (
          <AccordionItem key={item.id} value={item.id} className="border-b-0">
            <AccordionTrigger className="group text-muted-foreground hover:text-foreground [&>svg]:text-muted-foreground/40 relative gap-3 rounded-lg px-3 py-3.5 transition-all duration-200 hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="text-muted-foreground/40 group-hover:text-muted-foreground/60 w-4 text-right text-[11px] font-medium tabular-nums transition-colors">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium tracking-wide">
                  {item.label}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-0 pb-1">
              <div className="flex flex-col gap-0.5 pl-11">
                {item.submenu.map((subItem) => (
                  <Link
                    key={subItem.id}
                    href={subItem.href}
                    className={cn(
                      "text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm transition-colors",
                      pathname === subItem.href &&
                        "text-foreground bg-muted/50 font-medium",
                    )}
                  >
                    {subItem.label}
                  </Link>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
        {links.map((item, index) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "group text-muted-foreground hover:text-foreground hover:bg-muted/50 relative flex items-center gap-3 rounded-lg px-3 py-3.5 transition-all duration-200",
              pathname === item.href && "text-foreground bg-muted/50",
            )}
            style={{ animationDelay: `${(groups.length + index) * 60}ms` }}
          >
            <span
              className={cn(
                "bg-foreground/80 absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full transition-all duration-200",
                pathname === item.href
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100",
              )}
            />
            <span className="text-muted-foreground/40 group-hover:text-muted-foreground/60 w-4 text-right text-[11px] font-medium tabular-nums transition-colors">
              {String(groups.length + index + 1).padStart(2, "0")}
            </span>
            <span className="text-sm font-medium tracking-wide">
              {item.label}
            </span>
          </Link>
        ))}
      </Accordion>
    </nav>
  );
};

export { SheetNavList };
