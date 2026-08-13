import {
  Heading,
  ListItem,
  Text,
  UnorderedList,
  useColorModeValue,
  VStack
} from '@chakra-ui/react'

export default function PatchNotesPanel() {
  const whatsNewTextColour = useColorModeValue('green.600', 'green.300')
  const textColour = useColorModeValue('primary-light.900', 'primary-dark.100')
  const highlightedTextColour = useColorModeValue(
    'primary-accent.800',
    'primary-accent.300'
  )
  return (
    <VStack w="full" spacing={4}>
      <Text w="full" fontWeight="bold" fontSize="sm">
        August 13th, 2026, v. 1.1.6
      </Text>
      <VStack w="full">
        <Heading w="full" size="lg" textColor={whatsNewTextColour}>
          What's New
        </Heading>
        <UnorderedList
          w="full"
          px="8"
          spacing={2}
          textColor={textColour}
          fontWeight="semibold"
        >
          <ListItem>
            <Text
              as="span"
              fontFamily="Montserrat"
              textColor={highlightedTextColour}
            >
              Mouse wheel actions.&nbsp;
            </Text>
            Add scroll up or scroll down actions to a macro and choose the
            number of wheel steps to send.
          </ListItem>
          <ListItem>
            <Text
              as="span"
              fontFamily="Montserrat"
              textColor={highlightedTextColour}
            >
              Mouse wheel triggers.&nbsp;
            </Text>
            Bind macros directly to scrolling up or down, including on Windows.
          </ListItem>
          <ListItem>
            <Text
              as="span"
              fontFamily="Montserrat"
              textColor={highlightedTextColour}
            >
              Record scrolling.&nbsp;
            </Text>
            Macro recording now captures mouse wheel up and down events with
            their timing.
          </ListItem>
          <ListItem>
            <Text
              as="span"
              fontFamily="Montserrat"
              textColor={highlightedTextColour}
            >
              Active development.&nbsp;
            </Text>
            Wootomation Active is maintained with regular fixes, features, and
            Windows and Linux release builds.
          </ListItem>
        </UnorderedList>
      </VStack>
    </VStack>
  )
}
