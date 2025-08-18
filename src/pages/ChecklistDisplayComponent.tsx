import React, { useEffect, useState } from 'react';
import axios from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';

const ChecklistTaskViewerPage = ({
  origin,
  destination,
  originProvince,
  destinationProvince,
  equipmentIds,
  type,
  clientIds
}) => {
  const [tasks, setTasks] = useState([]);

  // Build query params helper
  const buildParams = (key, values) =>
    (values || []).filter(Boolean).map((v) => [key, v]);

  useEffect(() => {
    if (
      origin && destination &&
      originProvince?.length > 0 &&
      destinationProvince?.length > 0 &&
      type?.length > 0 &&
      equipmentIds?.length > 0 &&
      clientIds?.length > 0
    ) {
      const searchParams = new URLSearchParams([
        ['origin', origin],
        ['destination', destination],
        ...buildParams('originProvince', originProvince),
        ...buildParams('destinationProvince', destinationProvince),
        ...buildParams('type', type),
        ...buildParams('equipmentIds', equipmentIds),
        ...buildParams('clientIds', clientIds),
      ]);

      axios.get(`/api/admin/checklists/load?${searchParams.toString()}`)
        .then(res => setTasks(res.data))
        .catch(err => {
          console.error("Checklist fetch error", err);
          setTasks([]);
        });
    } else {
      setTasks([]);
    }
  }, [origin, originProvince, destination, destinationProvince, type, equipmentIds, clientIds]);

  const handleTaskCheck = async (item) => {
    if (item.task === "Request Quote") {
      try {
        await axios.post(`/api/admin/checklists/${item.checklistId}/send-quote`);
        alert("Quote request sent successfully!");
      } catch (err) {
        console.error(err);
        alert("Failed to send quote request.");
      }
    }
  };

  return (
    <Card className="p-4 mt-4">
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">Checklist Tasks</h3>
        {tasks.length > 0 ? (
          <ul className="space-y-2">
            {tasks.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`task-${index}`}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleTaskCheck(item);
                    }
                  }}
                />
                <label htmlFor={`task-${index}`}>{item.task}</label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No tasks found for this load configuration.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ChecklistTaskViewerPage;
