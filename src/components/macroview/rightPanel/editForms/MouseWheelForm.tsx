import {
  Button,
  Divider,
  Flex,
  Grid,
  GridItem,
  Input,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react'
import React, { useCallback, useEffect, useState } from 'react'
import { useMacroContext } from '../../../../contexts/macroContext'
import { MouseWheelEventAction } from '../../../../types'
import { DownArrowIcon, UpArrowIcon } from '../../../icons'
import { BoxText } from '../EditArea'

interface Props {
  selectedElementId: number
  selectedElement: MouseWheelEventAction
}

export default function MouseWheelForm({
  selectedElementId,
  selectedElement
}: Props) {
  const [scrollAmount, setScrollAmount] = useState(
    Math.max(1, Math.abs(selectedElement.data.delta_y))
  )
  const { updateElement } = useMacroContext()
  const toast = useToast()
  const isScrollUp = selectedElement.data.delta_y > 0

  useEffect(() => {
    setScrollAmount(Math.max(1, Math.abs(selectedElement.data.delta_y)))
  }, [selectedElement])

  const updateDelta = useCallback(
    (deltaY: number) => {
      updateElement(
        {
          ...selectedElement,
          data: {
            ...selectedElement.data,
            delta_y: deltaY
          }
        },
        selectedElementId
      )
    },
    [selectedElement, selectedElementId, updateElement]
  )

  const onDirectionChange = useCallback(
    (direction: 'up' | 'down') => {
      const amount = Math.max(1, Math.abs(scrollAmount))
      updateDelta(direction === 'up' ? amount : -amount)
    },
    [scrollAmount, updateDelta]
  )

  const onScrollAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setScrollAmount(Number(event.target.value))
    },
    []
  )

  const onInputBlur = useCallback(() => {
    if (
      !Number.isSafeInteger(scrollAmount) ||
      scrollAmount < 1 ||
      scrollAmount > 1000
    ) {
      toast({
        title: 'Invalid scroll delta',
        description: 'Delta must be a whole number between 1 and 1000 steps.',
        status: 'warning',
        duration: 4000,
        isClosable: true
      })
      setScrollAmount(Math.max(1, Math.abs(selectedElement.data.delta_y)))
      return
    }

    updateDelta(isScrollUp ? scrollAmount : -scrollAmount)
  }, [isScrollUp, scrollAmount, selectedElement, toast, updateDelta])

  return (
    <>
      <BoxText>{isScrollUp ? 'Scroll Up' : 'Scroll Down'}</BoxText>
      <Divider />
      <Grid templateRows="20px 1fr" gap="2" w="full">
        <GridItem w="full" h="8px" alignItems="center" justifyContent="center">
          <Text fontSize={['xs', 'sm', 'md']} fontWeight="semibold">
            Direction
          </Text>
        </GridItem>
        <GridItem w="full">
          <Flex
            flexDir={['column', 'column', 'column', 'row']}
            gap="4px"
            justifyContent="space-around"
          >
            <Button
              variant="brandTertiary"
              leftIcon={<UpArrowIcon />}
              w="full"
              size={['sm', 'md']}
              onClick={() => onDirectionChange('up')}
              isActive={isScrollUp}
            >
              <Text fontSize={['md', 'md', 'sm']}>Scroll Up</Text>
            </Button>
            <Button
              variant="brandTertiary"
              leftIcon={<DownArrowIcon />}
              w="full"
              size={['sm', 'md']}
              onClick={() => onDirectionChange('down')}
              isActive={!isScrollUp}
            >
              <Text fontSize={['md', 'md', 'sm']}>Scroll Down</Text>
            </Button>
          </Flex>
        </GridItem>
      </Grid>
      <Grid templateRows="20px 1fr" gap="2" w="full">
        <GridItem w="full" h="8px" alignItems="center" justifyContent="center">
          <Text fontSize={['xs', 'sm', 'md']} fontWeight="semibold">
            Delta (steps)
          </Text>
        </GridItem>
        <VStack w="full">
          <Input
            type="number"
            min={1}
            max={1000}
            step={1}
            variant="brandAccent"
            value={scrollAmount}
            onChange={onScrollAmountChange}
            onBlur={onInputBlur}
            isInvalid={
              !Number.isSafeInteger(scrollAmount) ||
              scrollAmount < 1 ||
              scrollAmount > 1000
            }
          />
          <Text w="full" fontSize="xs">
            The delta controls how many wheel steps are sent.
          </Text>
        </VStack>
      </Grid>
    </>
  )
}
