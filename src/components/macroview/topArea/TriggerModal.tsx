import {
  Button,
  Divider,
  Flex,
  HStack,
  Kbd,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue,
  VStack
} from '@chakra-ui/react'
import { useCallback, useMemo } from 'react'
import { useMacroContext } from '../../../contexts/macroContext'
import useRecordingTrigger from '../../../hooks/useRecordingTrigger'
import { HIDLookup } from '../../../constants/HIDmap'
import {
  mouseEnumLookup,
  mouseWheelDirectionLookup
} from '../../../constants/MouseMap'
import {
  checkIfModifierKey,
  checkIfMouseButtonArray,
  checkIfMouseWheelDirection,
  checkIfMouseWheelDirectionArray
} from '../../../constants/utils'
import { RecordIcon, StopIcon } from '../../icons'
import { MouseButton } from '../../../constants/enums'
import { TriggerRecordingItem } from '../../../types'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function TriggerModal({ isOpen, onClose }: Props) {
  const { macro, updateTrigger } = useMacroContext()
  const { recording, startRecording, stopRecording, items, resetItems } =
    useRecordingTrigger(macro.trigger.data)
  const isTriggerMouseInput = useMemo(() => {
    if (items.length === 0) {
      return true
    }
    return (
      checkIfMouseButtonArray(items) || checkIfMouseWheelDirectionArray(items)
    )
  }, [items])
  const secondBg = useColorModeValue('blue.50', 'gray.800')

  const getTriggerCanSave = useMemo((): boolean => {
    if (items.length === 0) {
      return false
    } else {
      if (isTriggerMouseInput) {
        return true
      } else {
        return items.some((element) => {
          if (checkIfMouseWheelDirection(element)) {
            return false
          }

          if (checkIfModifierKey(element)) {
            return false
          } else {
            return true
          }
        })
      }
    }
  }, [isTriggerMouseInput, items])

  const onModalSuccessClose = useCallback(() => {
    if (checkIfMouseButtonArray(items)) {
      updateTrigger({
        type: 'MouseEvent',
        data: items[0]
      })
    } else if (checkIfMouseWheelDirectionArray(items)) {
      updateTrigger({
        type: 'MouseWheelEvent',
        data: items[0]
      })
    } else {
      const keyItems = items.filter(
        (item): item is number => typeof item === 'number'
      )

      if (macro.trigger.type === 'KeyPressEvent') {
        updateTrigger({ ...macro.trigger, data: keyItems })
      } else {
        updateTrigger({
          ...macro.trigger,
          type: 'KeyPressEvent',
          data: keyItems,
          allow_while_other_keys: false
        })
      }
    }
    onClose()
  }, [items, macro.trigger, onClose, updateTrigger])

  const getDisplayString = useCallback(
    (element: TriggerRecordingItem): string => {
      if (checkIfMouseWheelDirection(element)) {
        return mouseWheelDirectionLookup.get(element)?.displayString ?? 'error'
      }

      return (
        mouseEnumLookup.get(element as MouseButton)?.displayString ??
        HIDLookup.get(element)?.displayString ??
        'error'
      )
    },
    []
  )

  const displayNames = useMemo((): string[] => {
    return items.map(getDisplayString)
  }, [getDisplayString, items])

  return (
    <Modal
      isOpen={isOpen}
      size={['md', 'xl', '3xl', '3xl']}
      variant="brand"
      onClose={onClose}
      isCentered
    >
      <ModalOverlay />
      <ModalContent p={2}>
        <ModalHeader fontWeight="bold">Trigger Keys</ModalHeader>
        <Divider w="90%" alignSelf="center" />
        <ModalBody>
          <VStack w="full" justifyContent="space-between">
            <VStack w="full">
              <Flex
                w="full"
                gap="4px"
                minH="42px"
                bg={secondBg}
                justifyContent="center"
                rounded="md"
                p="9px"
                shadow="inner"
              >
                {items.length === 0 && (
                  <Text textAlign="center">
                    Set up to 4 keys, a mouse button, or the scroll wheel as the
                    trigger
                  </Text>
                )}
                {items.map((element, index) => (
                  <Kbd
                    fontSize="md"
                    variant="brand"
                    h="fit-content"
                    key={element}
                  >
                    {displayNames[index]}
                  </Kbd>
                ))}
              </Flex>
              <HStack w="full" justifyContent="space-between">
                <VStack alignItems="left">
                  <Text fontSize="sm">
                    1x non-modifier, up to 3x modifiers in any order.
                  </Text>
                  <Text fontSize="sm">
                    non-modifier key must be the last in sequence.
                  </Text>
                </VStack>
                <Button
                  variant="brandRecord"
                  size="sm"
                  px={4}
                  leftIcon={recording ? <StopIcon /> : <RecordIcon />}
                  onClick={recording ? stopRecording : startRecording}
                  isActive={recording}
                >
                  {recording ? 'Stop' : 'Record'}
                </Button>
              </HStack>
            </VStack>
          </VStack>
          {/* <Divider w="full" alignSelf="center" my={['4', '8']} />
          <VStack alignItems="start">
            <HStack w="full" justifyContent="space-between" gap={4}>
              <Text fontWeight="semibold" fontSize={['xs', 'sm', 'md']}>
                Strict Mode
              </Text>
              <Switch
                variant="brand"
                defaultChecked={isAllowed}
                isChecked={isAllowed}
                isDisabled={isTriggerMouseInput}
                onChange={() => setIsAllowed(!isAllowed)}
              />
            </HStack>
            <VStack w="full" spacing={0}>
              <Text w="full" fontSize={['xs', 'sm', 'md']}>
                If enabled, the macro will activate when ONLY the trigger keys
                are pressed.
              </Text>
              <Text w="full" fontSize={['xs', 'sm', 'md']}>
                (Only matters if the trigger is a keypress(es))
              </Text>
            </VStack>
          </VStack> */}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="brand"
            mr={3}
            onClick={() => {
              resetItems()
              stopRecording()
              onClose()
            }}
          >
            Close
          </Button>
          <Button
            variant="yellowGradient"
            onClick={onModalSuccessClose}
            isDisabled={!getTriggerCanSave}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
