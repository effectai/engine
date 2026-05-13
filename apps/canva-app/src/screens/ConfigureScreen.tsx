/* eslint-disable formatjs/no-literal-string-in-jsx, formatjs/no-literal-string-in-object -- Phase 1 placeholder copy. Wrap strings in <FormattedMessage>/useIntl before submitting to Canva. */
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
import * as styles from "styles/components.css";
import { ContextForm } from "../components/ContextForm";
import type { ContextErrors } from "../components/ContextForm";
import type { CheckType, TaskContext, TaskDraft } from "../types";
import {
  CHECK_TYPES,
  PAGE_COUNT_OPTIONS,
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

function checkTypeLabel(type: CheckType): string {
  return CHECK_TYPES.find((checkTypeOption) => checkTypeOption.id === type)?.name ?? type;
}

export const ConfigureScreen = ({ checkType, onBack, onSubmit }: Props) => {
  const [context, setContext] = useState<TaskContext>(EMPTY_CONTEXT);
  const [workerCount, setWorkerCount] = useState<number>(5);
  const [revealDuration, setRevealDuration] = useState<number>(3);
  const [page, setPage] = useState<number>(1);
  const [pageA, setPageA] = useState<number>(1);
  const [pageB, setPageB] = useState<number>(2);
  const [versionLabelA, setVersionLabelA] = useState<string>("");
  const [versionLabelB, setVersionLabelB] = useState<string>("");
  const [pageCount, setPageCount] = useState<number>(PAGE_COUNT_OPTIONS);
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

  const PAGE_OPTIONS = Array.from({ length: pageCount }, (_, i) => ({
    label: `Page ${i + 1}`,
    value: i + 1,
  }));
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: ContextErrors = {};
    if (!context.designPurpose.trim()) {
      next.designPurpose = "Required";
    }
    if (!context.targetAudience.trim()) {
      next.targetAudience = "Required";
    }
    if (!context.mainGoal.trim()) {
      next.mainGoal = "Required";
    }
    setErrors(next);

    let pagesOk = true;
    if (checkType === "compare" && pageA === pageB) {
      setCompareError("Version A and Version B must be different pages.");
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
        setSubmitError("Could not export the design. Please try again.");
        setSubmitting(false);
        return;
      }

      const baseDraft: TaskDraft = { checkType, context, workerCount };
      let drafts: TaskDraft[];

      if (checkType === "compare") {
        if (blobs.length < 2) {
          setSubmitError(
            "Compare Versions requires at least 2 pages in your design. Add a second page and try again.",
          );
          setSubmitting(false);
          return;
        }
        const blobA = blobs[pageA - 1];
        const blobB = blobs[pageB - 1];
        if (!blobA || !blobB) {
          const outOfRange = !blobA ? pageA : pageB;
          setSubmitError(
            `Your design has ${blobs.length} page${blobs.length !== 1 ? "s" : ""}, but page ${outOfRange} was selected. Please update your page selection.`,
          );
          setSubmitting(false);
          return;
        }
        drafts = [
          {
            ...baseDraft,
            imageUrlA: blobA.url,
            imageUrlB: blobB.url,
            versionLabelA: versionLabelA.trim() || "Version A",
            versionLabelB: versionLabelB.trim() || "Version B",
            pageA,
            pageB,
          },
        ];
      } else {
        const selectedBlob = blobs[page - 1];
        if (!selectedBlob) {
          setSubmitError(
            `Your design has ${blobs.length} page${blobs.length !== 1 ? "s" : ""}, but page ${page} was selected. Please update your page selection.`,
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
        err instanceof Error ? err.message : "Unknown error during export.";
      setSubmitError(message);
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <SurfaceHeader
          title={checkTypeLabel(checkType)}
          start={{ ariaLabel: "Go back", onClick: onBack }}
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
            <Title size="small">Page to check</Title>
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
            <Title size="small">Reveal duration</Title>
            <Select<number>
              value={revealDuration}
              options={REVEAL_DURATION_OPTIONS.map((s) => ({
                label: `${s} seconds`,
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
                Your design only has 1 page. Add a second page to use Compare
                Versions.
              </Alert>
            ) : null}
            <Rows spacing="0.5u">
              <Title size="small">Version A — page</Title>
              <Select<number>
                value={pageA}
                options={PAGE_OPTIONS}
                onChange={(value) => setPageA(value)}
                stretch
              />
            </Rows>
            <Rows spacing="0.5u">
              <Title size="small">Version B — page</Title>
              <Select<number>
                value={pageB}
                options={PAGE_OPTIONS}
                onChange={(value) => setPageB(value)}
                stretch
              />
            </Rows>
            <FormField<string>
              label="Version A label"
              labelMarker="optional"
              value={versionLabelA}
              control={(props) => (
                <TextInput
                  {...props}
                  placeholder="Version A"
                  onChange={(value) => setVersionLabelA(value)}
                />
              )}
            />
            <FormField<string>
              label="Version B label"
              labelMarker="optional"
              value={versionLabelB}
              control={(props) => (
                <TextInput
                  {...props}
                  placeholder="Version B"
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
          Submit for feedback
        </Button>
      </Rows>
    </div>
  );
};