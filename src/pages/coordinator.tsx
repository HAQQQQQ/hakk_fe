"use client";

import { useState } from "react";

export default function Coordinator() {
    const [events, setEvents] = useState([
        {
            id: 1,
            title: "Summer Networking Gala",
            date: "2025-04-20",
            location: "NYC Rooftop Lounge",
            status: "Upcoming",
        },
        {
            id: 2,
            title: "Product Launch Summit",
            date: "2025-03-15",
            location: "Chicago Tech Hub",
            status: "Completed",
        },
    ]);

    return (
        <main className="min-h-screen p-8 bg-gray-50">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Event Portal</h1>

            <div className="grid gap-6">
                {events.map((event) => (
                    <div
                        key={event.id}
                        className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition"
                    >
                        <h2 className="text-xl font-semibold text-indigo-700">
                            {event.title}
                        </h2>
                        <p className="text-gray-600 mt-2">
                            📅 <strong>Date:</strong> {event.date}
                        </p>
                        <p className="text-gray-600">
                            📍 <strong>Location:</strong> {event.location}
                        </p>
                        <p className="mt-2">
              <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      event.status === "Upcoming"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                  }`}
              >
                {event.status}
              </span>
                        </p>
                    </div>
                ))}
            </div>
        </main>
    );
}
