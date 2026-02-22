"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Plus, X } from "lucide-react";

export default function NewProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [macAddresses, setMacAddresses] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
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

    const uniqueMacs = [...new Set(validMacs)];
    if (uniqueMacs.length !== validMacs.length) {
      setError("Duplicate MAC addresses detected");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          mac_addresses: uniqueMacs.length > 0 ? uniqueMacs : [],
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
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-12">
        <Link href="/profiles" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 text-sm group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Profiles
        </Link>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">New Profile</h1>
        <p className="text-white/40">Create a new family member profile and assign devices.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        {error && (
          <div className="p-4 rounded-xl bg-critical/10 border border-critical/20 text-critical text-sm font-medium">
            {error}
          </div>
        )}

        <div className="glass-card p-8 space-y-8">
          <div className="space-y-2">
            <label className="block text-[10px] font-mono text-white/30 uppercase tracking-widest ml-1">Profile Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Soren"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-mint/20 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-mono text-white/30 uppercase tracking-widest ml-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes about this profile"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-mint/20 transition-all min-h-[100px] resize-none"
            />
          </div>
        </div>

        <div className="glass-card p-8">
          <div className="flex items-center justify-between mb-6">
            <label className="block text-[10px] font-mono text-white/30 uppercase tracking-widest ml-1">Assigned Devices</label>
            <button
              type="button"
              onClick={addMacField}
              className="flex items-center gap-1.5 text-xs text-mint hover:text-mint/80 transition-colors"
            >
              <Plus size={14} /> Add MAC Address
            </button>
          </div>

          <div className="space-y-3">
            {macAddresses.map((mac, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={mac}
                  onChange={(e) => handleMacChange(index, e.target.value)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-mint/20 transition-all font-mono text-sm uppercase"
                />
                {macAddresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMacField(index)}
                    className="p-3 rounded-xl bg-critical/10 border border-critical/20 text-critical hover:bg-critical/20 transition-all"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Save size={18} /> {saving ? "Creating..." : "Create Profile"}
          </button>
          <Link href="/profiles" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
