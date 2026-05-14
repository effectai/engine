import {
  FormField,
  NumberInput,
  Rows,
  Select,
  TextInput,
} from "@canva/app-ui-kit";
import { useState } from "react";
import { useIntl } from "react-intl";
import type { TaskContext } from "../types";
import {
  DESIGN_PURPOSE_OPTIONS,
  MAIN_GOAL_OPTIONS,
  TARGET_AUDIENCE_OPTIONS,
} from "../types";

const MIN_WORKERS = 1;
const MAX_WORKERS = 20;

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
  const intl = useIntl();

  const [isOtherPurpose, setIsOtherPurpose] = useState(
    () =>
      context.designPurpose !== "" &&
      !DESIGN_PURPOSE_OPTIONS.some((option) => option.id === context.designPurpose),
  );
  const [isOtherAudience, setIsOtherAudience] = useState(
    () =>
      context.targetAudience !== "" &&
      !TARGET_AUDIENCE_OPTIONS.some((option) => option.id === context.targetAudience),
  );
  const [isOtherGoal, setIsOtherGoal] = useState(
    () =>
      context.mainGoal !== "" &&
      !MAIN_GOAL_OPTIONS.some((option) => option.id === context.mainGoal),
  );

  const otherLabel = intl.formatMessage({
    defaultMessage: "Other",
    description: "Other option in a dropdown, allows free-text entry",
  });

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
          label={intl.formatMessage({
            defaultMessage: "What is this design for?",
            description: "Label for the design purpose dropdown",
          })}
          value={isOtherPurpose ? "other" : context.designPurpose}
          error={isOtherPurpose ? undefined : errors.designPurpose}
          control={(props) => (
            <Select<string>
              {...props}
              placeholder={intl.formatMessage({
                defaultMessage: "Select a format",
                description: "Placeholder for the design purpose dropdown",
              })}
              options={[
                ...DESIGN_PURPOSE_OPTIONS.map((option) => ({
                  label: intl.formatMessage(option.label),
                  value: option.id,
                })),
                { label: otherLabel, value: "other" },
              ]}
              onChange={handlePurposeSelect}
              stretch
            />
          )}
        />
        {isOtherPurpose && (
          <FormField<string>
            label={intl.formatMessage({
              defaultMessage: "Describe the design format",
              description: "Label for the free-text design purpose input",
            })}
            value={context.designPurpose}
            error={errors.designPurpose}
            control={(props) => (
              <TextInput
                {...props}
                placeholder={intl.formatMessage({
                  defaultMessage: "Describe the design format",
                  description: "Placeholder for the free-text design purpose input",
                })}
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
          label={intl.formatMessage({
            defaultMessage: "Who is the target audience?",
            description: "Label for the target audience dropdown",
          })}
          value={isOtherAudience ? "other" : context.targetAudience}
          error={isOtherAudience ? undefined : errors.targetAudience}
          control={(props) => (
            <Select<string>
              {...props}
              placeholder={intl.formatMessage({
                defaultMessage: "Select an audience",
                description: "Placeholder for the target audience dropdown",
              })}
              options={[
                ...TARGET_AUDIENCE_OPTIONS.map((option) => ({
                  label: intl.formatMessage(option.label),
                  value: option.id,
                })),
                { label: otherLabel, value: "other" },
              ]}
              onChange={handleAudienceSelect}
              stretch
            />
          )}
        />
        {isOtherAudience && (
          <FormField<string>
            label={intl.formatMessage({
              defaultMessage: "Describe the target audience",
              description: "Label for the free-text target audience input",
            })}
            value={context.targetAudience}
            error={errors.targetAudience}
            control={(props) => (
              <TextInput
                {...props}
                placeholder={intl.formatMessage({
                  defaultMessage: "Describe the target audience",
                  description: "Placeholder for the free-text target audience input",
                })}
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
          label={intl.formatMessage({
            defaultMessage: "What is the main goal?",
            description: "Label for the main goal dropdown",
          })}
          value={isOtherGoal ? "other" : context.mainGoal}
          error={isOtherGoal ? undefined : errors.mainGoal}
          control={(props) => (
            <Select<string>
              {...props}
              placeholder={intl.formatMessage({
                defaultMessage: "Select a goal",
                description: "Placeholder for the main goal dropdown",
              })}
              options={[
                ...MAIN_GOAL_OPTIONS.map((option) => ({
                  label: intl.formatMessage(option.label),
                  value: option.id,
                })),
                { label: otherLabel, value: "other" },
              ]}
              onChange={handleGoalSelect}
              stretch
            />
          )}
        />
        {isOtherGoal && (
          <FormField<string>
            label={intl.formatMessage({
              defaultMessage: "Describe your goal",
              description: "Label for the free-text main goal input",
            })}
            value={context.mainGoal}
            error={errors.mainGoal}
            control={(props) => (
              <TextInput
                {...props}
                placeholder={intl.formatMessage({
                  defaultMessage: "Describe your goal",
                  description: "Placeholder for the free-text main goal input",
                })}
                onChange={(value) =>
                  onContextChange({ ...context, mainGoal: value })
                }
              />
            )}
          />
        )}
      </Rows>
      <FormField<number>
        label={intl.formatMessage({
          defaultMessage: "Number of workers",
          description: "Label for the worker count input",
        })}
        value={workerCount}
        error={errors.workerCount}
        control={(props) => (
          <NumberInput
            {...props}
            min={MIN_WORKERS}
            max={MAX_WORKERS}
            step={1}
            hasSpinButtons
            decrementAriaLabel={intl.formatMessage({
              defaultMessage: "Decrease worker count",
              description: "Aria label for the decrement button on the worker count input",
            })}
            incrementAriaLabel={intl.formatMessage({
              defaultMessage: "Increase worker count",
              description: "Aria label for the increment button on the worker count input",
            })}
            onChange={(valueAsNumber) => {
              if (typeof valueAsNumber !== "number" || isNaN(valueAsNumber)) {
                return;
              }
              onWorkerCountChange(
                Math.min(MAX_WORKERS, Math.max(MIN_WORKERS, valueAsNumber)),
              );
            }}
          />
        )}
      />
    </Rows>
  );
};
