"use client";

import { Home, Trophy } from "lucide-react";
import { Tabs, TabsTriggerList, TabsTrigger } from "@/components/retroui/Tab";
import { Text } from "../retroui/Text";

interface TabNavigationProps {
  activeTab: "home" | "leaderboard";
  onTabChange: (tab: "home" | "leaderboard") => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    {
      id: "home" as const,
      label: "Home",
      icon: Home,
      description: "Your dashboard",
    },
    {
      id: "leaderboard" as const,
      label: "Leaderboard",
      icon: Trophy,
      description: "View rankings",
    },
  ];

  const selectedIndex = tabs.findIndex((tab) => tab.id === activeTab);

  return (
    <div className="bg-white border-t-2 border-black px-4 py-2">
      <Tabs
        selectedIndex={selectedIndex}
        onChange={(index) => onTabChange(tabs[index].id)}
      >
        <TabsTriggerList className="flex w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <TabsTrigger
                key={tab.id}
                className="flex-1 flex flex-col items-center py-3 px-2 data-selected:bg-[#ffdb33] data-selected:rounded-sm data-selected:text-black data-selected:border-2 data-selected:border-black text-gray-500 hover:text-black hover:bg-gray-100 transition-colors duration-200"
              >
                <Icon className="w-5 h-5 mb-1" />
                <Text className="text-xs font-bold">{tab.label}</Text>
              </TabsTrigger>
            );
          })}
        </TabsTriggerList>
      </Tabs>
    </div>
  );
}
