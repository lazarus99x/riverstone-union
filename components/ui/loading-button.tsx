"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

function LoadingButton({
  loading = false,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      className={cn("relative", className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      )}
      {loading && loadingText ? loadingText : children}
      {loading && <span className="sr-only">Loading</span>}
    </Button>
  );
}

export { LoadingButton };
export type { LoadingButtonProps };
