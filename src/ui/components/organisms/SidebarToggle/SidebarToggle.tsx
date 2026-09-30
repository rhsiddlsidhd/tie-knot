"use client";

import { NAVIGATION_BY_TYPE } from "@/core/domain/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/ui/components/ui/breadcrumb";
import { SidebarTrigger } from "@/ui/components/ui/sidebar";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";

const HIDDEN_SEGMENTS = ["admin"] as const;

const NAVIGATION_LABEL_BY_HREF = Object.values(NAVIGATION_BY_TYPE).reduce<
  Record<string, string>
>((labelByHref, section) => {
  section.groups.forEach((group) => {
    group.submenu.forEach((subItem) => {
      labelByHref[subItem.href] = subItem.label;
    });
  });
  section.links.forEach((link) => {
    labelByHref[link.href] = link.label;
  });
  return labelByHref;
}, {});

const SidebarToggle = () => {
  const pathName = usePathname();

  const breadcrumbs = useMemo(() => {
    const segments = pathName.split("/").filter(Boolean);

    const visible = segments.filter(
      (segment) => !HIDDEN_SEGMENTS.some((hidden) => hidden === segment),
    );

    return [
      ...visible.map((seg) => {
        const href =
          "/" + segments.slice(0, segments.indexOf(seg) + 1).join("/");

        return { label: NAVIGATION_LABEL_BY_HREF[href] ?? seg, href };
      }),
    ];
  }, [pathName]);

  return (
    <header className="flex items-center gap-2">
      <SidebarTrigger />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((value, idx) => (
            <Fragment key={value.label}>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={value.href}>{value.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbs.length - 1 !== idx && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
};

export { SidebarToggle };
