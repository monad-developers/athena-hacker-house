import { SwapStep } from "@/types/swap";

interface ProgressStepsProps {
  steps: SwapStep[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
}

export const ProgressSteps = ({
  steps,
  currentStep,
  onStepClick,
}: ProgressStepsProps) => {
  return (
    <div className="flex justify-center">
      <div className="flex items-center space-x-3">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`glass-card rounded-full transition-all duration-300 ${
                  isActive ? "scale-110 shadow-lg" : "opacity-50"
                }`}
              >
                <button
                  onClick={() =>
                    isActive || isCompleted ? onStepClick(step.id) : null
                  }
                  disabled={isUpcoming}
                  className={`flex items-center rounded-full transition-all duration-300 ${
                    isActive
                      ? "space-x-3 px-4 py-2 cursor-pointer hover:bg-white/10"
                      : "px-2 py-2 cursor-not-allowed"
                  } ${isCompleted ? "cursor-pointer hover:bg-white/5" : ""}`}
                  style={{
                    borderColor: isActive ? "#6E54FF" : undefined,
                  }}
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all duration-300 ${
                      isActive
                        ? "text-white"
                        : isCompleted
                        ? "bg-pastel-mint text-white"
                        : "bg-white/10 text-white/30"
                    }`}
                    style={{
                      backgroundColor: isActive ? "#6E54FF" : undefined,
                    }}
                  >
                    {isCompleted ? "✓" : step.id}
                  </div>

                  {/* Only show title for active step */}
                  {isActive && (
                    <span className="text-white text-xs font-bold ml-2 animate-fadeIn">
                      {step.title}
                    </span>
                  )}
                </button>
              </div>

              {/* Progress Line between steps */}
              {index < steps.length - 1 && (
                <div className="mx-2">
                  <div
                    className={`h-0.5 w-8 transition-all duration-500 ${
                      step.id < currentStep ? "bg-pastel-mint" : "bg-white/20"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
