"use client"

import Navbar from "@/components/navbar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import FileFolderList, { FileItem, FolderItem } from "@/components/FileFolderList";

export default function Home() {
  const [data, setData] = useState<{ files: FileItem[]; folders: FolderItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/objects")
      .then((res) => res.json())
      .then((json: { files: FileItem[]; folders: FolderItem[] }) => {
        setData({ files: json.files || [], folders: json.folders || [] });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load data");
        setLoading(false);
      });
  }, []);

  return (
    <div className="container  py-8 px-4 max-w-screen max-h-screen">
      <Navbar />
      <div className="space-y-6 mt-5">
        <div className="flex flex-col items-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">S3 Bucket Explorer</h1>
          <p className="text-muted-foreground text-xl">
            Browse and manage your S3 bucket contents
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : data ? (
          <FileFolderList files={data.files} folders={data.folders} />
        ) : null}
      </div>
    </div>
  );
}
