import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AppLoading() {
  return (
    <div className="grid gap-12 xl:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <div className="h-5 w-32 rounded-md bg-[color:var(--surface-muted)]" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-12 rounded-lg bg-[color:var(--surface-muted)]"
            />
          ))}
        </CardContent>
      </Card>
      <Card className="hidden xl:block">
        <CardHeader>
          <div className="h-5 w-40 rounded-md bg-[color:var(--surface-muted)]" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-20 rounded-lg bg-[color:var(--surface-muted)]"
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
