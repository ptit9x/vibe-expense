import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4">
            <div className="flex flex-col items-center space-y-6 text-center">
                <div className="flex bg-muted p-6 rounded-full">
                    <Search className="h-16 w-16 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">404</h1>
                    <h2 className="text-2xl font-semibold tracking-tight">Page Not Found</h2>
                </div>
                <p className="max-w-[600px] text-muted-foreground">
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>
                <Button asChild size="lg" className="mt-4">
                    <Link to="/">Take me home</Link>
                </Button>
            </div>
        </div>
    );
};

export default NotFound;
