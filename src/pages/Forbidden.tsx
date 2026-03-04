import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

const Forbidden = () => {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
            <div className="flex flex-col items-center space-y-6 text-center">
                <div className="flex bg-destructive/10 p-6 rounded-full">
                    <ShieldAlert className="h-16 w-16 text-destructive" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">403</h1>
                    <h2 className="text-2xl font-semibold tracking-tight">Access Denied</h2>
                </div>
                <p className="max-w-[600px] text-muted-foreground">
                    You don't have permission to access this resource. Please contact the administrator if you believe this is an error.
                </p>
                <Button asChild size="lg" className="mt-4">
                    <Link to="/">Return to Dashboard</Link>
                </Button>
            </div>
        </div>
    );
};

export default Forbidden;
