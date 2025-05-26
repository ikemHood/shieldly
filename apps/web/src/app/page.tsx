import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeLayout } from "@/components/theme-layout";
import Link from "next/link";

export default function Home() {
  return (
    <ThemeLayout>
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <div className="max-w-3xl w-full text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Shieldly</h1>
          <p className="text-xl text-muted-foreground">Micro-Insurance Platform for Emerging Markets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Funders</CardTitle>
              <CardDescription>For investors staking funds in the community reserve</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Stake funds, earn yield, and participate in policy voting and reserve management.</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/funder">Funder Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Administrators</CardTitle>
              <CardDescription>Platform management and oversight</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Manage users, policies, claims, and monitor system health.</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/admin">Admin Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <footer className="mt-16 text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} Shieldly. All rights reserved.</p>
        </footer>
      </main>
    </ThemeLayout>
  );
}
