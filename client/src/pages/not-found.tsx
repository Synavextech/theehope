import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
    return (
        <div className="min-h-[80vh] w-full flex items-center justify-center bg-background text-foreground">
            <Card className="w-full max-w-md mx-4 bg-card border-border">
                <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-[#b8240d]" />
                        <h1 className="text-2xl font-bold text-foreground">404 Page Not Found</h1>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        The page you are looking for does not exist or has been moved.
                    </p>
                    <Button asChild className="w-full bg-primary text-primary-foreground">
                        <Link href="/">Return Home</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
