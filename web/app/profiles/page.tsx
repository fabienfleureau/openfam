"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeProvider } from "@/app/providers";
import { ThemeSelector } from "@/components/theme-selector";
import { Link as LinkIcon } from "lucide-react";
import type { ProfileResponse } from "@/application/dtos/profile-response.dto";

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/profiles");
      if (!response.ok) {
        throw new Error("Failed to fetch profiles");
      }
      const data = await response.json();
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete profile");
      }
      await fetchProfiles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete profile");
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="theme-border border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="p-2 rounded-md bg-accent/10 hover:bg-accent/20 transition-colors"
                >
                  <LinkIcon className="w-5 h-5 text-accent" />
                </Link>
                <div>
                  <h1 className="font-display text-xl">Open-F.A.M.</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    The smart heart of your family's network
                  </p>
                </div>
              </div>
              <ThemeSelector />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8 opacity-0 animate-fade-in">
            <div>
              <h2 className="font-display text-3xl mb-2">Profiles</h2>
              <p className="text-muted-foreground">
                Manage family member profiles and device assignments
              </p>
            </div>
            <Link
              href="/profiles/new"
              className="theme-border px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Create Profile
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="theme-card p-6 text-error">
              <p>{error}</p>
              <button
                onClick={fetchProfiles}
                className="mt-4 px-4 py-2 rounded-md bg-error/10 text-error hover:bg-error/20 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Profiles Grid */}
          {!loading && !error && profiles.length === 0 && (
            <div className="theme-card p-12 text-center">
              <p className="text-muted-foreground mb-4">No profiles yet</p>
              <Link
                href="/profiles/new"
                className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create your first profile
              </Link>
            </div>
          )}

          {!loading && !error && profiles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile, index) => (
                <div
                  key={profile.id}
                  className="theme-card p-6 opacity-0 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-xl mb-1">
                        {profile.name}
                      </h3>
                      {profile.description && (
                        <p className="text-sm text-muted-foreground">
                          {profile.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {profile.mac_addresses.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Devices ({profile.mac_addresses.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {profile.mac_addresses.map((mac) => (
                          <span
                            key={mac.id}
                            className="theme-chip bg-muted/50 text-foreground text-xs font-mono"
                          >
                            {mac.address}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-4 theme-border border-t">
                    <Link
                      href={`/profiles/${profile.id}/edit`}
                      className="flex-1 text-center px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(profile.id, profile.name)}
                      className="flex-1 px-3 py-2 rounded-md bg-error/10 text-error hover:bg-error/20 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}
