import { Box, Button, Rows, Text, Title } from "@canva/app-ui-kit";
import { useIntl } from "react-intl";
import type { CheckTypeMeta } from "../types";

type Props = {
  meta: CheckTypeMeta;
  onSelect: () => void;
};

export const CheckTypeCard = ({ meta, onSelect }: Props) => {
  const intl = useIntl();
  return (
    <Box
      background="neutralSubtle"
      border="ui"
      borderRadius="standard"
      padding="2u"
    >
      <Rows spacing="1u">
        <Title size="small">{intl.formatMessage(meta.name)}</Title>
        <Text size="small" tone="tertiary">
          {intl.formatMessage(meta.description)}
        </Text>
        <Button variant="primary" onClick={onSelect} stretch>
          {intl.formatMessage({
            defaultMessage: "Select",
            description: "Button to select a check type",
          })}
        </Button>
      </Rows>
    </Box>
  );
};
