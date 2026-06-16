import {
  Alert,
  Button,
  FormField,
  Rows,
  Select,
  SurfaceHeader,
  TextInput,
  Title,
} from "@canva/app-ui-kit";
import { getDesignMetadata, requestExport } from "@canva/design";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";
import type { IntlShape } from "react-intl";
import * as styles from "styles/components.css";
import { ContextForm } from "../components/ContextForm";
import type { ContextErrors } from "../components/ContextForm";
import type { CheckType, TaskContext, TaskDraft } from "../types";
import {
  CHECK_TYPES,
  REVEAL_DURATION_OPTIONS,
} from "../types";

type Props = {
  checkType: CheckType;
  onBack: () => void;
  onSubmit: (drafts: TaskDraft[]) => void;
};

const EMPTY_CONTEXT: TaskContext = {
  designPurpose: "",
  targetAudience: "",
  mainGoal: "",
};

function checkTypeLabel(type: CheckType, intl: IntlShape): string {
  const meta = CHECK_TYPES.find((checkTypeOption) => checkTypeOption.id === type);
  return meta ? intl.formatMessage(meta.name) : type;
}

export const ConfigureScreen = ({ checkType, onBack, onSubmit }: Props) => {
  const intl = useIntl();
  const [context, setContext] = useState<TaskContext>(EMPTY_CONTEXT);
  const [workerCount, setWorkerCount] = useState<number>(5);
  const [revealDuration, setRevealDuration] = useState<number>(3);
  const [page, setPage] = useState<number>(1);
  const [pageA, setPageA] = useState<number>(1);
  const [pageB, setPageB] = useState<number>(2);
  const [versionLabelA, setVersionLabelA] = useState<string>("");
  const [versionLabelB, setVersionLabelB] = useState<string>("");
  const [pageCount, setPageCount] = useState<number>(1);
  const [errors, setErrors] = useState<ContextErrors>({});
  const [compareError, setCompareError] = useState<string | undefined>();

  useEffect(() => {
    getDesignMetadata()
      .then((meta) => {
        const count = [...meta.pageMetadata].length;
        if (count > 0) setPageCount(count);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (page > pageCount) setPage(1);
    if (pageA > pageCount) setPageA(1);
    if (pageB > pageCount) setPageB(Math.min(2, pageCount));
  }, [pageCount]);

  const PAGE_OPTIONS = Array.from({ length: pageCount }, (_, i) => ({
    label: intl.formatMessage(
      { defaultMessage: "Page {num}", description: "Page number option in the page selector" },
      { num: i + 1 },
    ),
    value: i + 1,
  }));

  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const required = intl.formatMessage({
      defaultMessage: "Required",
      description: "Validation error shown when a required field is empty",
    });
    const next: ContextErrors = {};
    if (!context.designPurpose.trim()) next.designPurpose = required;
    if (!context.targetAudience.trim()) next.targetAudience = required;
    if (!context.mainGoal.trim()) next.mainGoal = required;
    setErrors(next);

    let pagesOk = true;
    if (checkType === "compare" && pageA === pageB) {
      setCompareError(
        intl.formatMessage({
          defaultMessage: "Version A and Version B must be different pages.",
          description: "Validation error when both compare pages are the same",
        }),
      );
      pagesOk = false;
    } else {
      setCompareError(undefined);
    }

    return Object.keys(next).length === 0 && pagesOk;
  };

  const handleSubmit = async () => {
    setSubmitError(undefined);
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    try {
      const exportResult = await requestExport({
        acceptedFileTypes: [{ type: "png" as const, zipped: "never" as const }],
      });

      if (exportResult.status === "aborted") {
        setSubmitting(false);
        return;
      }

      const blobs = exportResult.exportBlobs ?? [];
      if (blobs.length === 0) {
        setSubmitError(
          intl.formatMessage({
            defaultMessage: "Could not export the design. Please try again.",
            description: "Error when the design export returns no blobs",
          }),
        );
        setSubmitting(false);
        return;
      }

      const baseDraft: TaskDraft = { checkType, context, workerCount };
      let drafts: TaskDraft[];

      if (checkType === "compare") {
        if (blobs.length < 2) {
          setSubmitError(
            intl.formatMessage({
              defaultMessage: "Compare Versions requires at least 2 pages in your design. Add a second page and try again.",
              description: "Error when a compare check is attempted on a single-page design",
            }),
          );
          setSubmitting(false);
          return;
        }
        const blobA = blobs[pageA - 1];
        const blobB = blobs[pageB - 1];
        if (!blobA || !blobB) {
          const outOfRange = !blobA ? pageA : pageB;
          setSubmitError(
            intl.formatMessage(
              {
                defaultMessage: "Your design has {count, plural, one {# page} other {# pages}}, but page {page} was selected. Please update your page selection.",
                description: "Error when the selected page is out of range for the exported design",
              },
              { count: blobs.length, page: outOfRange },
            ),
          );
          setSubmitting(false);
          return;
        }
        drafts = [
          {
            ...baseDraft,
            imageUrlA: blobA.url,
            imageUrlB: blobB.url,
            versionLabelA: versionLabelA.trim() || intl.formatMessage({ defaultMessage: "Version A", description: "Default label for version A" }),
            versionLabelB: versionLabelB.trim() || intl.formatMessage({ defaultMessage: "Version B", description: "Default label for version B" }),
            pageA,
            pageB,
          },
        ];
      } else {
        const selectedBlob = blobs[page - 1];
        if (!selectedBlob) {
          setSubmitError(
            intl.formatMessage(
              {
                defaultMessage: "Your design has {count, plural, one {# page} other {# pages}}, but page {page} was selected. Please update your page selection.",
                description: "Error when the selected page is out of range for the exported design",
              },
              { count: blobs.length, page },
            ),
          );
          setSubmitting(false);
          return;
        }
        drafts = [
          {
            ...baseDraft,
            imageUrl: selectedBlob.url,
            ...(checkType === "clickability" ? { revealDuration } : {}),
          },
        ];
      }

      onSubmit(drafts);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : intl.formatMessage({
              defaultMessage: "Unknown error during export.",
              description: "Generic error message when the export fails unexpectedly",
            });
      setSubmitError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <SurfaceHeader
          title={checkTypeLabel(checkType, intl)}
          start={{
            ariaLabel: intl.formatMessage({
              defaultMessage: "Go back",
              description: "Aria label for the back button on the configure screen",
            }),
            onClick: onBack,
          }}
        />
        <ContextForm
          context={context}
          workerCount={workerCount}
          errors={errors}
          onContextChange={setContext}
          onWorkerCountChange={setWorkerCount}
        />

        {checkType !== "compare" && pageCount > 1 ? (
          <Rows spacing="0.5u">
            <Title size="small">
              {intl.formatMessage({
                defaultMessage: "Page to check",
                description: "Label for the page selector on the configure screen",
              })}
            </Title>
            <Select<number>
              value={page}
              options={PAGE_OPTIONS}
              onChange={(value) => setPage(value)}
              stretch
            />
          </Rows>
        ) : null}

        {checkType === "clickability" ? (
          <Rows spacing="0.5u">
            <Title size="small">
              {intl.formatMessage({
                defaultMessage: "Reveal duration",
                description: "Label for the reveal duration selector",
              })}
            </Title>
            <Select<number>
              value={revealDuration}
              options={REVEAL_DURATION_OPTIONS.map((s) => ({
                label: intl.formatMessage(
                  { defaultMessage: "{seconds} seconds", description: "Reveal duration option in seconds" },
                  { seconds: s },
                ),
                value: s,
              }))}
              onChange={(value) => setRevealDuration(value)}
              stretch
            />
          </Rows>
        ) : null}

        {checkType === "compare" ? (
          <Rows spacing="1.5u">
            {pageCount < 2 ? (
              <Alert tone="warn">
                {intl.formatMessage({
                  defaultMessage: "Your design only has 1 page. Add a second page to use Compare Versions.",
                  description: "Warning shown when a single-page design is used with Compare Versions",
                })}
              </Alert>
            ) : null}
            <Rows spacing="0.5u">
              <Title size="small">
                {intl.formatMessage({
                  defaultMessage: "Version A - page",
                  description: "Label for the Version A page selector",
                })}
              </Title>
              <Select<number>
                value={pageA}
                options={PAGE_OPTIONS}
                onChange={(value) => setPageA(value)}
                stretch
              />
            </Rows>
            <Rows spacing="0.5u">
              <Title size="small">
                {intl.formatMessage({
                  defaultMessage: "Version B - page",
                  description: "Label for the Version B page selector",
                })}
              </Title>
              <Select<number>
                value={pageB}
                options={PAGE_OPTIONS}
                onChange={(value) => setPageB(value)}
                stretch
              />
            </Rows>
            <FormField<string>
              label={intl.formatMessage({
                defaultMessage: "Version A label",
                description: "Label for the Version A custom name input",
              })}
              labelMarker="optional"
              value={versionLabelA}
              control={(props) => (
                <TextInput
                  {...props}
                  placeholder={intl.formatMessage({
                    defaultMessage: "Version A",
                    description: "Placeholder for the Version A label input",
                  })}
                  onChange={(value) => setVersionLabelA(value)}
                />
              )}
            />
            <FormField<string>
              label={intl.formatMessage({
                defaultMessage: "Version B label",
                description: "Label for the Version B custom name input",
              })}
              labelMarker="optional"
              value={versionLabelB}
              control={(props) => (
                <TextInput
                  {...props}
                  placeholder={intl.formatMessage({
                    defaultMessage: "Version B",
                    description: "Placeholder for the Version B label input",
                  })}
                  onChange={(value) => setVersionLabelB(value)}
                />
              )}
            />
            {compareError ? (
              <Alert tone="critical">{compareError}</Alert>
            ) : null}
          </Rows>
        ) : null}

        {submitError ? <Alert tone="critical">{submitError}</Alert> : null}

        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting}
          stretch
        >
          {intl.formatMessage({
            defaultMessage: "Submit for feedback",
            description: "Button to submit the design for tester feedback",
          })}
        </Button>
      </Rows>
    </div>
  );
};
