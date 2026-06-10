"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

const UPLOAD_AVATAR_VERSION = "2";

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return initials.toUpperCase() || "?";
}

function withQueryParam(url: string, key: string, value: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

function getAvatarSrc(avatarUrl: string, retryToken: string) {
  let src = avatarUrl;

  if (avatarUrl.startsWith("/uploads/avatars/")) {
    src = withQueryParam(src, "avatar_v", UPLOAD_AVATAR_VERSION);
  }

  return retryToken ? withQueryParam(src, "retry", retryToken) : src;
}

export function UserAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl?: string;
  className?: string;
}) {
  const [retry, setRetry] = useState<{ url: string; token: string }>();
  const [failedUrl, setFailedUrl] = useState<string>();
  const retryToken = retry && retry.url === avatarUrl ? retry.token : "";
  const avatarSrc =
    avatarUrl && failedUrl !== avatarUrl
      ? getAvatarSrc(avatarUrl, retryToken)
      : "";

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full bg-[color:var(--accent-muted)] text-sm font-bold text-[color:var(--accent-strong-hover)]",
        className,
      )}
    >
      {avatarSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarSrc}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => {
            if (!avatarUrl) return;

            if (!retryToken) {
              setRetry({ url: avatarUrl, token: String(Date.now()) });
              return;
            }

            setFailedUrl(avatarUrl);
          }}
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
