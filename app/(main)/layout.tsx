"use client";

import { useConvexAuth } from "convex/react";
import { redirect } from "next/navigation";

import { Spinner } from "@/components/spinner";
import { SearchCommand } from "@/components/search-command";

import { Navigation, useNavigation } from "./_components/navigation";
import { TranscriptionProvider } from "../(speech)/app/components/TranscriptionContext";

const MainLayout = ({
  children
}: {
  children: React.ReactNode;
}) => {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return redirect("/");
  }

  const [navigation, navbar] = useNavigation();

  return (
    <TranscriptionProvider>
      <div className="h-full flex dark:bg-[#1F1F1F] overflow-hidden">
        {navigation as JSX.Element}
        <main className="flex-1 h-full">
          <SearchCommand />
          {navbar as JSX.Element}
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </TranscriptionProvider>
   );
}
 
export default MainLayout;