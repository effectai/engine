import { LinkButton, Rows, Text, Title } from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import * as styles from "styles/components.css";
import { CheckTypeCard } from "../components/CheckTypeCard";
import type { CheckType } from "../types";
import { CHECK_TYPES } from "../types";

type Props = {
  onSelectCheckType: (type: CheckType) => void;
  onViewHistory: () => void;
};

export const HomeScreen = ({ onSelectCheckType, onViewHistory }: Props) => {
  const intl = useIntl();
  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="2u">
        <Rows spacing="0.5u">
          <Title size="medium">
            {intl.formatMessage({
              defaultMessage: "Design Feedback",
              description: "Heading on the home screen",
            })}
          </Title>
          <Text size="small" tone="tertiary">
            {intl.formatMessage({
              defaultMessage: "Powered by Effect AI",
              description: "Subtitle on the home screen",
            })}
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
          <LinkButton onClick={onViewHistory}>
            {intl.formatMessage({
              defaultMessage: "View history",
              description: "Link to the task history screen",
            })}
          </LinkButton>
        </Text>
      </Rows>
    </div>
  );
};
