/* eslint-disable formatjs/no-literal-string-in-jsx -- Phase 1 placeholder copy. Wrap strings in <FormattedMessage>/useIntl before submitting to Canva. */
import {
  Button,
  FormField,
  Rows,
  Select,
  Text,
  TextInput,
  Title,
} from "@canva/app-ui-kit";
import { useState } from "react";
import * as styles from "styles/components.css";
import type { TaskContext } from "../types";

const MIN_WORKERS = 1;
const MAX_WORKERS = 20;

const DESIGN_PURPOSE_OPTIONS = [
  "Facebook / Instagram ad",
  "Event flyer",
  "Product landing page",
  "Email newsletter",
  "Presentation",
  "Poster",
  "Social media post",
  "Business card",
];

const TARGET_AUDIENCE_OPTIONS = [
  "Small business owners",
  "Fitness enthusiasts",
  "Young adults (18-25)",
  "Professionals / B2B",
  "Parents",
  "Students",
  "General public",
];

const MAIN_GOAL_OPTIONS = [
  "Drive sales",
  "Generate leads",
  "Build brand awareness",
  "Promote an event",
  "Drive website traffic",
  "Increase engagement",
  "Educate / inform",
];

export type ContextErrors = Partial<
  Record<keyof TaskContext | "workerCount", string>
>;

type Props = {
  context: TaskContext;
  workerCount: number;
  errors: ContextErrors;
  onContextChange: (next: TaskContext) => void;
  onWorkerCountChange: (next: number) => void;
};

export const ContextForm = ({
  context,
  workerCount,
  errors,
  onContextChange,
  onWorkerCountChange,
}: Props) => {
  const [isOtherPurpose, setIsOtherPurpose] = useState(
    () =>
      context.designPurpose !== "" &&
      !DESIGN_PURPOSE_OPTIONS.includes(context.designPurpose),
  );
  const [isOtherAudience, setIsOtherAudience] = useState(
    () =>
      context.targetAudience !== "" &&
      !TARGET_AUDIENCE_OPTIONS.includes(context.targetAudience),
  );
  const [isOtherGoal, setIsOtherGoal] = useState(
    () =>
      context.mainGoal !== "" && !MAIN_GOAL_OPTIONS.includes(context.mainGoal),
  );

  const makeSelectHandler = (
    field: keyof typeof context,
    setIsOther: (v: boolean) => void,
  ) =>
    (value: string) => {
      if (value === "other") {
        setIsOther(true);
        onContextChange({ ...context, [field]: "" });
      } else {
        setIsOther(false);
        onContextChange({ ...context, [field]: value });
      }
    };

  const handlePurposeSelect = makeSelectHandler("designPurpose", setIsOtherPurpose);
  const handleAudienceSelect = makeSelectHandler("targetAudience", setIsOtherAudience);
  const handleGoalSelect = makeSelectHandler("mainGoal", setIsOtherGoal);

  return (
    <Rows spacing="2u">
      <Rows spacing="1u">
        <FormField<string>
          label="What is this design for?"
          value={isOtherPurpose ? "other" : context.designPurpose}
          error={isOtherPurpose ? undefined : errors.designPurpose}
          control={(props) => (
            <Select<string>
              {...props}
              placeholder="Select a format"
              options={[
                ...DESIGN_PURPOSE_OPTIONS.map((label) => ({
                  label,
                  value: label,
                })),
                { label: "Other", value: "other" },
              ]}
              onChange={handlePurposeSelect}
              stretch
            />
          )}
        />
        {isOtherPurpose && (
          <FormField<string>
            label=""
            value={context.designPurpose}
            error={errors.designPurpose}
            control={(props) => (
              <TextInput
                {...props}
                placeholder="Describe the design format"
                onChange={(value) =>
                  onContextChange({ ...context, designPurpose: value })
                }
              />
            )}
          />
        )}
      </Rows>
      <Rows spacing="1u">
        <FormField<string>
          label="Who is the target audience?"
          value={isOtherAudience ? "other" : context.targetAudience}
          error={isOtherAudience ? undefined : errors.targetAudience}
          control={(props) => (
            <Select<string>
              {...props}
              placeholder="Select an audience"
              options={[
                ...TARGET_AUDIENCE_OPTIONS.map((label) => ({
                  label,
                  value: label,
                })),
                { label: "Other", value: "other" },
              ]}
              onChange={handleAudienceSelect}
              stretch
            />
          )}
        />
        {isOtherAudience && (
          <FormField<string>
            label=""
            value={context.targetAudience}
            error={errors.targetAudience}
            control={(props) => (
              <TextInput
                {...props}
                placeholder="Describe the target audience"
                onChange={(value) =>
                  onContextChange({ ...context, targetAudience: value })
                }
              />
            )}
          />
        )}
      </Rows>
      <Rows spacing="1u">
        <FormField<string>
          label="What is the main goal?"
          value={isOtherGoal ? "other" : context.mainGoal}
          error={isOtherGoal ? undefined : errors.mainGoal}
          control={(props) => (
            <Select<string>
              {...props}
              placeholder="Select a goal"
              options={[
                ...MAIN_GOAL_OPTIONS.map((label) => ({
                  label,
                  value: label,
                })),
                { label: "Other", value: "other" },
              ]}
              onChange={handleGoalSelect}
              stretch
            />
          )}
        />
        {isOtherGoal && (
          <FormField<string>
            label=""
            value={context.mainGoal}
            error={errors.mainGoal}
            control={(props) => (
              <TextInput
                {...props}
                placeholder="Describe your goal"
                onChange={(value) =>
                  onContextChange({ ...context, mainGoal: value })
                }
              />
            )}
          />
        )}
      </Rows>
      <Rows spacing="0.5u">
        <Title size="small">Number of workers</Title>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Button
            variant="secondary"
            onClick={() => onWorkerCountChange(Math.max(MIN_WORKERS, workerCount - 1))}
            disabled={workerCount <= MIN_WORKERS}
          >
            −
          </Button>
          <input
            type="number"
            min={MIN_WORKERS}
            max={MAX_WORKERS}
            value={workerCount}
            className={styles.workerCountInput}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              if (!isNaN(parsed)) {
                onWorkerCountChange(Math.min(MAX_WORKERS, Math.max(MIN_WORKERS, parsed)));
              }
            }}
            style={{
              width: "64px",
              textAlign: "center",
              fontSize: "1.25rem",
              fontWeight: 600,
              border: "1px solid var(--ui-kit-color-border)",
              borderRadius: "4px",
              padding: "6px 0",
            }}
          />
          <Button
            variant="secondary"
            onClick={() => onWorkerCountChange(Math.min(MAX_WORKERS, workerCount + 1))}
            disabled={workerCount >= MAX_WORKERS}
          >
            +
          </Button>
        </div>
        {errors.workerCount ? (
          <Text size="small" tone="critical">
            {errors.workerCount}
          </Text>
        ) : null}
      </Rows>
    </Rows>
  );
};