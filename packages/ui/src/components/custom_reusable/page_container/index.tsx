"use client";

import { cn } from "@/lib/utils";

/**
 * Comment Here
 */

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function PageContainer(props: Props) {
  return (
    <div className={cn("flex flex-1 flex-col", props.className)}>
      {props.children}
    </div>
  );
}
