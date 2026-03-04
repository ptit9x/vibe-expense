import { Button } from '@/components/ui/button';
import { ServerCrash } from 'lucide-react';

const ServerError = () => {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
            <div className="flex flex-col items-center space-y-6 text-center">
                <div className="flex bg-destructive/10 p-6 rounded-full">
                    <ServerCrash className="h-16 w-16 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">500</h1>
                    <h2 className="text-2xl font-semibold tracking-tight">Internal Server Error</h2>
                </div>
                <p className="max-w-[600px] text-muted-foreground">
                    We're sorry, something went wrong on our end. Please try refreshing the page or come back later.
                </p>
                <div className="flex gap-4 mt-4">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={() => window.location.reload()}
                    >
                        Try again
                    </Button>
                    <Button
                        size="lg"
                        onClick={() => window.location.href = '/'}
                    >
                        Go to home
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ServerError;
