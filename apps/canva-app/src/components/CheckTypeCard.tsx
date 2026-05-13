/* eslint-disable formatjs/no-literal-string-in-jsx -- Phase 1 placeholder copy. Wrap strings in <FormattedMessage>/useIntl before submitting to Canva. */
import { Box, Button, Rows, Text, Title } from "@canva/app-ui-kit";
import type { CheckTypeMeta } from "../types";

type Props = {
  meta: CheckTypeMeta;
  onSelect: () => void;
};

export const CheckTypeCard = ({ meta, onSelect }: Props) => {
  return (
    <Box
      background="neutralSubtle"
      border="ui"
      borderRadius="standard"
      padding="2u"
    >
      <Rows spacing="1u">
        <Title size="small">{meta.name}</Title>
        <Text size="small" tone="tertiary">
          {meta.description}
        </Text>
        <Button variant="primary" onClick={onSelect} stretch>
          Select
        </Button>
      </Rows>
    </Box>
  );
};