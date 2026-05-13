/* eslint-disable formatjs/no-literal-string-in-jsx -- Phase 1 placeholder copy. Wrap strings in <FormattedMessage>/useIntl before submitting to Canva. */
import { LinkButton, Rows, Text, Title } from "@canva/app-ui-kit";
import * as styles from "styles/components.css";
import { CheckTypeCard } from "../components/CheckTypeCard";
import type { CheckType } from "../types";
import { CHECK_TYPES } from "../types";

type Props = {
  onSelectCheckType: (type: CheckType) => void;
  onViewHistory: () => void;
};

export const HomeScreen = ({ onSelectCheckType, onViewHistory }: Props) => {
  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Rows spacing="0.5u">
          <Title size="medium">Design Feedback</Title>
          <Text size="small" tone="tertiary">
            Powered by Effect AI
          </Text>
        </Rows>
        <Rows spacing="1.5u">
          {CHECK_TYPES.map((meta) => (
            <CheckTypeCard
              key={meta.id}
              meta={meta}
              onSelect={() => onSelectCheckType(meta.id)}
            />
          ))}
        </Rows>
        <Text alignment="center" size="small">
          <LinkButton onClick={onViewHistory}>View History</LinkButton>
        </Text>
      </Rows>
    </div>
  );
};