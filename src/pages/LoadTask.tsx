import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const TASKS = [
  "Send QR1",
  "Enter Cost",
  "Enter Price",
  "Client Confirmed",
  "Enter Pick-up Number",
  "Enter Drop-off Number",
  "Prepare BOL and send CPTAMVW03 to Account Manager",
  "Account Manager sends DIBTC02",
  "Prepare Load Confirmation + LCB02 in additional information",
  "Send DIBTCARRIER02 + Load Confirmation (COPY ACCOUNT MANAGER)",
  "Carrier Confirmed Reception Of Contract",
  "Upload Documents to TODO (BOL - LC - CUSTOMS DOCS)",
  "Updates",
  "Set Next Reminder for Pick Up",
  "Onsite"
];

export default function LoadTaskSteps() {
  const [completed, setCompleted] = useState<boolean[]>(Array(TASKS.length).fill(false));

  const toggle = (index: number) => {
    setCompleted((prev) => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const lastCheckedIndex = completed.lastIndexOf(true);
  const nextIndex = completed.findIndex((c, i) => !c && i > lastCheckedIndex);
  const currentIndex = nextIndex === -1 ? lastCheckedIndex + 1 : nextIndex;

  const visibleIndices = [];
  if (lastCheckedIndex >= 0) visibleIndices.push(lastCheckedIndex);
  if (currentIndex < TASKS.length) visibleIndices.push(currentIndex);

  const resetTasks = () => {
    setCompleted(Array(TASKS.length).fill(false));
  };

  return (
    <div className="border rounded p-4 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Load Task Checklist</h3>
        <Button variant="outline" onClick={resetTasks}>
          Reset
        </Button>
      </div>

      <div className="space-y-2">
        {visibleIndices.map((index) => (
          <div key={index} className="flex items-start space-x-2">
            <Checkbox
              checked={completed[index]}
              onCheckedChange={() => toggle(index)}
            />
            <span>{TASKS[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
