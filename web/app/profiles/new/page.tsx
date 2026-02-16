"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link as LinkIcon, Plus, X } from "lucide-react";
import { GeometricBackground } from "@/components/GeometricBackground";
import { GlassCard } from "@/components/GlassCard";

export default function NewProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [macAddresses, setMacAddresses] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

  const handleMacChange = (index: number, value: string) => {
    const newMacs = [...macAddresses];
    newMacs[index] = value;
    setMacAddresses(newMacs);
  };

  const addMacField = () => {
    setMacAddresses([...macAddresses, ""]);
  };

  const removeMacField = (index: number) => {
    const newMacs = macAddresses.filter((_, i) => i !== index);
    setMacAddresses(newMacs.length > 0 ? newMacs : [""]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    const validMacs = macAddresses
      .map((mac) => mac.trim().toUpperCase())
      .filter((mac) => mac.length > 0);

    for (const mac of validMacs) {
      if (!macRegex.test(mac)) {
        setError(`Invalid MAC address format: ${mac}`);
        return;
      }
    }

    // Check for duplicates
    const uniqueMacs = [...new Set(validMacs)];
    if (uniqueMacs.length !== validMacs.length) {
      setError("Duplicate MAC addresses detected");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          mac_addresses: uniqueMacs.length > 0 ? uniqueMacs : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create profile");
      }

      router.push("/profiles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <GeometricBackground />

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/profiles"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <LinkIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Open-F.A.M.</h1>
              <p className="text-sm text-white/70">The smart heart of your family's network</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Create Profile</h2>
            <p className="text-white/70 mt-1">Add a new family member profile</p>
          </div>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <GlassCard>
              <p className="text-red-300">{error}</p>
            </GlassCard>
          )}

          {/* Name */}
          <GlassCard>
            <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
              Name <span className="text-red-300">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Child, Parent, Guest"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              maxLength={255}
              required
            />
          </GlassCard>

          {/* Description */}
          <GlassCard>
            <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this profile"
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
              rows={3}
              maxLength={5000}
            />
          </GlassCard>

          {/* MAC Addresses */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-white">
                MAC Addresses
              </label>
              <button
                type="button"
                onClick={addMacField}
                className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Device
              </button>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Assign devices by MAC address (format: AA:BB:CC:DD:EE:FF)
            </p>

            <div className="space-y-3">
              {macAddresses.map((mac, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={mac}
                    onChange={(e) => handleMacChange(index, e.target.value)}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 font-mono text-sm"
                    style={{ textTransform: "uppercase" }}
                  />
                  {macAddresses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMacField(index)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/profiles"
              className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-white text-purple-900 font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
