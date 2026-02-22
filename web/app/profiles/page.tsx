"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, User, Trash2, Settings2, ShieldCheck } from "lucide-react";
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
    <div className="space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-mint mb-2">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Access Control</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Family Profiles</h1>
          <p className="text-white/40 mt-2 max-w-xl">
            Configure individual filtering rules, schedules, and device assignments for each family member.
          </p>
        </div>
        <Link href="/profiles/new" className="btn-primary flex items-center gap-2 w-fit">
          <Plus size={18} /> Create Profile
        </Link>
      </header>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card h-64 animate-pulse opacity-50" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass-card p-10 text-center border-critical/20">
          <p className="text-critical mb-4 font-medium">{error}</p>
          <button onClick={fetchProfiles} className="btn-secondary text-sm">
            Retry Connection
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && profiles.length === 0 && (
        <div className="glass-card p-20 text-center flex flex-col items-center">
          <div className="h-16 w-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 mb-6">
            <User size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">No profiles found</h3>
          <p className="text-white/40 mb-8 max-w-xs mx-auto">
            Get started by creating a profile for a family member.
          </p>
          <Link href="/profiles/new" className="btn-primary">
            Create your first profile
          </Link>
        </div>
      )}

      {/* Profiles Grid */}
      {!loading && !error && profiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div key={profile.id} className="glass-card p-6 flex flex-col group relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="h-12 w-12 rounded-2xl bg-mint/10 border border-mint/20 flex items-center justify-center text-mint">
                  <User size={24} />
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/profiles/${profile.id}/edit`}
                    className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                    title="Edit Profile"
                  >
                    <Settings2 size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(profile.id, profile.name)}
                    className="p-2 rounded-lg hover:bg-critical/10 text-white/40 hover:text-critical transition-colors"
                    title="Delete Profile"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-mint transition-colors">
                  {profile.name}
                </h3>
                {profile.description ? (
                  <p className="text-sm text-white/40 line-clamp-2">
                    {profile.description}
                  </p>
                ) : (
                  <p className="text-sm text-white/20 italic">No description</p>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Devices</span>
                  <span className="text-sm font-bold font-mono text-white/60">{profile.mac_addresses.length}</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5">
                  {profile.mac_addresses.slice(0, 3).map((mac) => (
                    <span
                      key={mac.id}
                      className="px-2 py-0.5 bg-white/5 text-white/40 text-[10px] font-mono rounded-md border border-white/5"
                    >
                      {mac.address.slice(-5)}
                    </span>
                  ))}
                  {profile.mac_addresses.length > 3 && (
                    <span className="text-[10px] text-white/20 ml-1">
                      +{profile.mac_addresses.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-glass-shine pointer-events-none" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
