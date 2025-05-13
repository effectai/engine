import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "./../lib/utils";

type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

interface JSONTreeViewerProps {
  data: JSONValue;
  className?: string;
  initialExpanded?: boolean;
  expandLevel?: number;
}

export function JSONTreeViewer({
  data,
  className,
  initialExpanded = true,
  expandLevel = 1,
}: JSONTreeViewerProps) {
  return (
    <div
      className={cn(
        "font-mono text-sm rounded-md bg-muted p-4 overflow-auto",
        className,
      )}
    >
      <TreeNode
        data={data}
        label="root"
        level={0}
        initialExpanded={initialExpanded}
        expandLevel={expandLevel}
        isRoot
      />
    </div>
  );
}

interface TreeNodeProps {
  data: JSONValue;
  label: string;
  level: number;
  initialExpanded: boolean;
  expandLevel: number;
  isRoot?: boolean;
}

function TreeNode({
  data,
  label,
  level,
  initialExpanded,
  expandLevel,
  isRoot = false,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(
    initialExpanded || level < expandLevel,
  );

  const isObject = data !== null && typeof data === "object";
  const isArray = Array.isArray(data);
  const isEmpty = isObject && Object.keys(data).length === 0;

  // Determine the type of the data for styling
  const getValueType = (value: JSONValue): string => {
    if (value === null) return "null";
    if (Array.isArray(value)) return "array";
    return typeof value;
  };

  // Color mapping for different data types
  const typeColors: Record<string, string> = {
    string: "text-green-600 dark:text-green-400",
    number: "text-blue-600 dark:text-blue-400",
    boolean: "text-purple-600 dark:text-purple-400",
    null: "text-gray-500 dark:text-gray-400",
    object: "text-gray-800 dark:text-gray-200",
    array: "text-gray-800 dark:text-gray-200",
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const renderValue = (value: JSONValue) => {
    const type = getValueType(value);

    if (type === "string") {
      return <span className={typeColors.string}>&quot;{value}&quot;</span>;
    }

    if (type === "null") {
      return <span className={typeColors.null}>null</span>;
    }

    return <span className={typeColors[type]}>{String(value)}</span>;
  };

  const renderCollapsibleContent = () => {
    if (!isObject) return null;

    const entries = Object.entries(data as Record<string, JSONValue>);

    if (entries.length === 0) {
      return isArray ? "[]" : "{}";
    }

    return (
      <div className="ml-4 border-l border-border pl-2">
        {entries.map(([key, value], index) => (
          <TreeNode
            key={`${key}-${index}`}
            data={value}
            label={isArray ? index.toString() : key}
            level={level + 1}
            initialExpanded={initialExpanded}
            expandLevel={expandLevel}
          />
        ))}
      </div>
    );
  };

  // Don't render the root label
  if (isRoot) {
    if (isObject) {
      return renderCollapsibleContent();
    }
    return renderValue(data);
  }

  return (
    <div className="my-1">
      {isObject ? (
        <div>
          <div
            className="flex items-center cursor-pointer hover:bg-muted/50 rounded px-1"
            onClick={toggleExpand}
          >
            <span className="mr-1">
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
            <span className="font-semibold">{label}:</span>
            <span className="ml-1">
              {isExpanded ? (
                ""
              ) : (
                <span className="text-gray-500">
                  {isArray ? "[...]" : "{...}"}
                </span>
              )}
            </span>
          </div>
          {isExpanded && renderCollapsibleContent()}
        </div>
      ) : (
        <div className="flex items-start">
          <span className="font-semibold">{label}:</span>
          <span className="ml-1">{renderValue(data)}</span>
        </div>
      )}
    </div>
  );
}
