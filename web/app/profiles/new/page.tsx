"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ThemeProvider } from "@/app/providers";
import { ThemeSelector } from "@/components/theme-selector";
import { Link as LinkIcon, Plus, X } from "lucide-react";

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
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="theme-border border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Link
                  href="/profiles"
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
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 opacity-0 animate-fade-in">
            <h2 className="font-display text-3xl mb-2">Create Profile</h2>
            <p className="text-muted-foreground">
              Add a new family member profile
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="theme-card p-4 text-error">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="theme-card p-6 opacity-0 animate-fade-in-up animation-delay-100">
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name <span className="text-error">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Child, Parent, Guest"
                className="w-full px-3 py-2 bg-background theme-border border rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                maxLength={255}
                required
              />
            </div>

            {/* Description */}
            <div className="theme-card p-6 opacity-0 animate-fade-in-up animation-delay-200">
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description for this profile"
                className="w-full px-3 py-2 bg-background theme-border border rounded-md focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                rows={3}
                maxLength={5000}
              />
            </div>

            {/* MAC Addresses */}
            <div className="theme-card p-6 opacity-0 animate-fade-in-up animation-delay-300">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium">
                  MAC Addresses
                </label>
                <button
                  type="button"
                  onClick={addMacField}
                  className="flex items-center gap-1 text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Device
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
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
                      className="flex-1 px-3 py-2 bg-background theme-border border rounded-md focus:outline-none focus:ring-2 focus:ring-accent font-mono text-sm"
                      style={{ textTransform: "uppercase" }}
                    />
                    {macAddresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMacField(index)}
                        className="p-2 rounded-md bg-error/10 text-error hover:bg-error/20 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between opacity-0 animate-fade-in-up animation-delay-400">
              <Link
                href="/profiles"
                className="px-4 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Profile"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </ThemeProvider>
  );
}
