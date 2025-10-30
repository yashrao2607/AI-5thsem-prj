import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <path
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.5 7.5C14.8969 8.21171 13.5113 9.42939 12.5334 10.9999C11.5556 12.5704 11.0366 14.4109 11.0366 16.2917C11.0366 18.1724 11.5556 20.0129 12.5334 21.5834"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.5 16.5C9.10312 15.7883 10.4887 14.5706 11.4666 13.0001C12.4444 11.4296 12.9634 9.58911 12.9634 7.70833C12.9634 5.82756 12.4444 3.98706 11.4666 2.41656"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-bold text-xl">CognitoAI</span>
    </div>
  );
}
