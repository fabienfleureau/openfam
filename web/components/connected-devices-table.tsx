import { Smartphone, Laptop, Tablet, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Device {
  id: string;
  name: string;
  mac: string;
  type: "phone" | "laptop" | "tablet" | "console";
  ip: string;
  status: "online" | "offline";
  profile: string;
}

const mockDevices: Device[] = [
  {
    id: "1",
    name: "Emma's iPhone",
    mac: "AA:BB:CC:DD:EE:01",
    type: "phone",
    ip: "192.168.1.101",
    status: "online",
    profile: "Child",
  },
  {
    id: "2",
    name: "Liam's iPad",
    mac: "AA:BB:CC:DD:EE:02",
    type: "tablet",
    ip: "192.168.1.102",
    status: "online",
    profile: "Child",
  },
  {
    id: "3",
    name: "Dad's MacBook",
    mac: "AA:BB:CC:DD:EE:03",
    type: "laptop",
    ip: "192.168.1.103",
    status: "online",
    profile: "Parent",
  },
  {
    id: "4",
    name: "PlayStation 5",
    mac: "AA:BB:CC:DD:EE:04",
    type: "console",
    ip: "192.168.1.104",
    status: "offline",
    profile: "Gaming",
  },
  {
    id: "5",
    name: "Mom's Phone",
    mac: "AA:BB:CC:DD:EE:05",
    type: "phone",
    ip: "192.168.1.105",
    status: "online",
    profile: "Parent",
  },
];

const deviceIcons = {
  phone: Smartphone,
  laptop: Laptop,
  tablet: Tablet,
  console: Gamepad2,
};

const statusStyles = {
  online: "text-success",
  offline: "text-muted-foreground",
};

export function ConnectedDevicesTable() {
  return (
    <div className="theme-card opacity-0 animate-fade-in-up animation-delay-400">
      <div className="p-6 border-b border-border">
        <h3 className="font-display text-lg">Connected Devices</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {mockDevices.filter((d) => d.status === "online").length} of{" "}
          {mockDevices.length} devices online
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Device
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                IP Address
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Profile
              </th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {mockDevices.map((device, index) => {
              const Icon = deviceIcons[device.type];
              return (
                <tr
                  key={device.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-muted/50">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          {device.mac}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {device.ip}
                    </code>
                  </td>
                  <td className="p-4">
                    <span className="theme-chip bg-secondary text-secondary-foreground">
                      {device.profile}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          device.status === "online"
                            ? "bg-success"
                            : "bg-muted-foreground"
                        )}
                      />
                      <span className={cn("text-sm", statusStyles[device.status])}>
                        {device.status}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
