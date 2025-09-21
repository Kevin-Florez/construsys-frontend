import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export const ProductCardSkeleton = () => (
    <Card className="flex flex-col overflow-hidden animate-pulse">
        <CardHeader className="p-0">
            <div className="w-full h-48 bg-slate-200"></div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
            <div className="h-4 w-1/3 bg-slate-200 rounded mb-3"></div>
            <div className="h-6 w-3/4 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 w-full bg-slate-200 rounded"></div>
        </CardContent>
        <CardFooter className="p-4 bg-slate-50 flex justify-between items-center mt-auto">
            <div className="h-7 w-1/2 bg-slate-200 rounded"></div>
            <div className="h-10 w-1/3 bg-slate-200 rounded"></div>
        </CardFooter>
    </Card>
);