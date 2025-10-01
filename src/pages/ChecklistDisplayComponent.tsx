import React, { useEffect, useMemo, useState } from "react";
import axios from "@/lib/axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

type Props = {
  // storage key to keep per-load progress (pass your loadId / nextId)
  loadKey?: string;

  // REQUIRED filters for your endpoint
  origin: string | null;        // e.g. "CANADA" | "USA"
  destination: string | null;   // e.g. "CANADA" | "USA"
  equipmentIds: number[];       // selected equipment ids
  type: string[];               // e.g. ["LTL"] or ["FTL"]

  // EXTRA required-by-server query params
  originProvince?: string | null;        // single selection from your form
  destinationProvince?: string | null;   // single selection from your form
  clientId?: number | null;              // single client id from your form
};

type TaskItem = {
  checklistId?: number;
  task: string;
};

const buildParams = (
  key: string,
  values?: (string | number | null | undefined)[]
) =>
  (values ?? [])
    .filter((v) => v !== null && v !== undefined) // keep 0 and ""
    .map((v) => [key, String(v)] as [string, string]);

export default function ChecklistTaskViewer({
  loadKey = "new-load",
  origin,
  destination,
  equipmentIds,
  type,
  originProvince,
  destinationProvince,
  clientId,
}: Props) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);

  // progressive reveal count (persisted locally per load)
  const storageKey = useMemo(() => `cl:progress:${loadKey}`, [loadKey]);
  const [completed, setCompleted] = useState<number>(() => {
    const v = Number(localStorage.getItem(storageKey));
    return Number.isFinite(v) ? v : 0;
  });
  useEffect(() => localStorage.setItem(storageKey, String(completed)), [storageKey, completed]);

  // fetch only when we have the 4 core filters
  useEffect(() => {
    const hasFilters =
      (origin || "").length > 0 &&
      (destination || "").length > 0 &&
      (type?.length ?? 0) > 0 &&
      (equipmentIds?.length ?? 0) > 0;

    if (!hasFilters) {
      setTasks([]);
      setCompleted(0);
      return;
    }

    // Always include all required params for the Spring controller:
    // - originProvince: send selected value or "" (safe for List<String>)
    // - destinationProvince: send selected value or "" (safe for List<String>)
    // - clientIds: send selected id or 0 (safe for List<Integer>)
    const pairs: [string, string][] = [
      ["origin", origin!],
      ["destination", destination!],
      ...buildParams("type", type),
      ...buildParams("equipmentIds", equipmentIds as any),
      ...buildParams("originProvince", [originProvince ?? ""]),
      ...buildParams("destinationProvince", [destinationProvince ?? ""]),
      ...buildParams("clientIds", [clientId ?? 0]),
    ];

    const searchParams = new URLSearchParams(pairs);

    setLoading(true);
    axios
      .get(`/api/admin/checklists/load?${searchParams.toString()}`)
      .then((res) => {
        const list: TaskItem[] = Array.isArray(res.data) ? res.data : [];
        setTasks(list);
        setCompleted((c) => Math.min(c, list.length)); // clamp if fewer tasks now
      })
      .catch((err) => {
        console.error("Checklist fetch error", err);
        setTasks([]);
        setCompleted(0);
      })
      .finally(() => setLoading(false));
  }, [origin, destination, type, equipmentIds, originProvince, destinationProvince, clientId]);

  const visible = tasks.slice(completed, completed + 2);
  const total = tasks.length;
  const progressPct = total > 0 ? Math.min(100, (completed / total) * 100) : 0;

  const handleTaskCheck = async (item: TaskItem) => {
    if (item.task === "Request Quote" && item.checklistId) {
      try {
        await axios.post(`/api/admin/checklists/${item.checklistId}/send-quote`);
      } catch (err) {
        console.error(err);
      }
    }
    setTimeout(() => setCompleted((c) => Math.min(total, c + 1)), 150);
  };

  return (
    <Card className="border-sky-100/70 bg-white/90 backdrop-blur-sm">
      <CardContent className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Checklist</h3>
          <div className="text-[11px] text-gray-500">{completed}/{total}</div>
        </div>

        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-violet-500 transition-[width] duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {loading && <p className="text-xs text-muted-foreground">Loading tasks…</p>}
        {!loading && total === 0 && (
          <p className="text-xs text-muted-foreground">
            Select <span className="font-medium">Equipment</span>, <span className="font-medium">Type</span>, and{" "}
            <span className="font-medium">countries</span> to see checklist tasks.
          </p>
        )}

        <ul className="mt-2 space-y-2">
          <AnimatePresence initial={false}>
            {visible.map((item, idx) => {
              const key = `${item.checklistId ?? "noid"}-${completed + idx}-${item.task}`;
              return (
                <motion.li
                  key={key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="group flex items-center justify-between rounded-xl border border-sky-100 bg-white px-3 py-2 shadow-sm"
                >
                  <span className="text-sm text-gray-800">{item.task}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 border-sky-200 hover:bg-sky-50"
                    onClick={() => handleTaskCheck(item)}
                  >
                    <Check className="h-4 w-4" />
                    Done
                  </Button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        {!loading && total > 0 && completed >= total && (
          <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            All done. ✔
          </div>
        )}
      </CardContent>
    </Card>
  );
}
