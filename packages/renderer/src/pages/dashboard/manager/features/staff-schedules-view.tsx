import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

export default function StaffSchedulesView() {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

  const schedules = [
    {
      id: 1,
      staff: "Alice Johnson",
      role: "Cashier",
      start: "08:00 AM",
      end: "04:00 PM",
      status: "Active",
    },
    {
      id: 2,
      staff: "Bob Smith",
      role: "Manager",
      start: "10:00 AM",
      end: "06:00 PM",
      status: "Upcoming",
    },
  ];

  const openForm = (schedule?: any) => {
    setEditingSchedule(schedule || null);
    setOpenDrawer(true);
  };

  return (
    <div className="p-6">
      {/* Page Title */}
      <h1 className="text-2xl font-semibold mb-6">Staff Schedules</h1>

      {/* Schedule List */}
      <div className="grid gap-4">
        {schedules.map((s) => (
          <Card
            key={s.id}
            className="flex justify-between items-center p-4 shadow-md"
          >
            <CardContent className="flex flex-col">
              <span className="font-medium">{s.staff}</span>
              <span className="text-sm text-gray-500">
                {s.role} • {s.start} - {s.end}
              </span>
              <span
                className={`text-xs mt-1 ${
                  s.status === "Active" ? "text-green-600" : "text-blue-600"
                }`}
              >
                {s.status}
              </span>
            </CardContent>
            <Button variant="outline" onClick={() => openForm(s)}>
              Edit
            </Button>
          </Card>
        ))}
      </div>

      {/* Add New Button */}
      <div className="mt-6">
        <Button onClick={() => openForm()}>Add Schedule</Button>
      </div>

      {/* Drawer Form */}
      {openDrawer && (
        <div className="fixed inset-0 flex justify-end bg-black bg-opacity-30">
          <div className="w-96 bg-white h-full shadow-xl p-6 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingSchedule ? "Edit Schedule" : "New Schedule"}
              </h2>
              <button onClick={() => setOpenDrawer(false)}>
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-4 flex-1">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Staff Name
                </label>
                <input
                  className="w-full border rounded-lg p-2"
                  defaultValue={editingSchedule?.staff || ""}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  className="w-full border rounded-lg p-2"
                  defaultValue={editingSchedule?.role || ""}
                >
                  <option>Cashier</option>
                  <option>Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Shift Start
                </label>
                <input
                  type="time"
                  className="w-full border rounded-lg p-2"
                  defaultValue="08:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Shift End
                </label>
                <input
                  type="time"
                  className="w-full border rounded-lg p-2"
                  defaultValue="16:00"
                />
              </div>

              <div className="mt-auto flex gap-2">
                <Button className="flex-1" onClick={() => setOpenDrawer(false)}>
                  Save
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => setOpenDrawer(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
