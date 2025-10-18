"use client";

import { Search, Filter } from "lucide-react";

export default function SearchAndFilters() {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search research activity..."
            className="w-full pl-12 pr-4 py-3 bg-background border border-border rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-3">
          <select className="px-4 py-3 bg-background border border-border rounded-full text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer">
            <option value="">All Tenants</option>
            <option value="acme">Acme Corp</option>
            <option value="globex">Globex Inc</option>
            <option value="initech">Initech</option>
          </select>

          <select className="px-4 py-3 bg-background border border-border rounded-full text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer">
            <option value="">All Users</option>
            <option value="kyle">Kyle Smith</option>
            <option value="jane">Jane Doe</option>
            <option value="john">John Smith</option>
          </select>

          <select className="px-4 py-3 bg-background border border-border rounded-full text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer">
            <option value="">All Dates</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select className="px-4 py-3 bg-background border border-border rounded-full text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer">
            <option value="">Niche/Location</option>
            <option value="dentist">Dentist</option>
            <option value="plumber">Plumber</option>
            <option value="lawyer">Lawyer</option>
          </select>
        </div>
      </div>
    </div>
  );
}

