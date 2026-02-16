"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";
import { GeometricBackground } from "@/components/GeometricBackground";
import { GlassCard } from "@/components/GlassCard";
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
    <div className="min-h-screen relative">
      <GeometricBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <LinkIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Open-F.A.M.</h1>
              <p className="text-sm text-white/70">The smart heart of your family's network</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Profiles</h2>
              <p className="text-white/70 mt-1">Manage family member profiles and device assignments</p>
            </div>
            <Link
              href="/profiles/new"
              className="px-6 py-3 rounded-lg bg-white text-purple-900 font-medium hover:bg-white/90 transition-colors"
            >
              Create Profile
            </Link>
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <GlassCard>
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchProfiles}
              className="mt-4 px-4 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
            >
              Retry
            </button>
          </GlassCard>
        )}

        {/* Empty State */}
        {!loading && !error && profiles.length === 0 && (
          <GlassCard>
            <p className="text-white/70 mb-4 text-center py-8">No profiles yet</p>
            <div className="text-center">
              <Link
                href="/profiles/new"
                className="inline-block px-6 py-3 rounded-lg bg-white text-purple-900 font-medium hover:bg-white/90 transition-colors"
              >
                Create your first profile
              </Link>
            </div>
          </GlassCard>
        )}

        {/* Profiles Grid */}
        {!loading && !error && profiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <GlassCard key={profile.id}>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {profile.name}
                  </h3>
                  {profile.description && (
                    <p className="text-sm text-white/70">
                      {profile.description}
                    </p>
                  )}
                </div>

                {profile.mac_addresses.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-white/50 mb-2">
                      Devices ({profile.mac_addresses.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.mac_addresses.map((mac) => (
                        <span
                          key={mac.id}
                          className="px-2 py-1 bg-white/10 text-white/80 text-xs font-mono rounded"
                        >
                          {mac.address}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                  <Link
                    href={`/profiles/${profile.id}/edit`}
                    className="flex-1 text-center px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-sm"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(profile.id, profile.name)}
                    className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
