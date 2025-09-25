interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation = ({
  activeTab,
  onTabChange,
}: TabNavigationProps) => {
  return (
    <div className="flex mb-6">
      <button
        onClick={() => onTabChange("Swap")}
        className={`px-6 py-3 font-medium text-lg ${
          activeTab === "Swap"
            ? "text-white border-b-2 border-white"
            : "text-white/50"
        }`}
      >
        Swap
      </button>
      <button
        onClick={() => onTabChange("Pool")}
        className={`px-6 py-3 font-medium text-lg ${
          activeTab === "Pool"
            ? "text-white border-b-2 border-white"
            : "text-white/50"
        }`}
      >
        Pool
      </button>
    </div>
  );
};
