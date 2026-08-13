import { useToast } from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import { MouseWheelDirection } from '../constants/enums'
import {
  webCodeLocationHidEncode,
  webCodeLocationHIDLookup
} from '../constants/HIDmap'
import { webButtonLookup } from '../constants/MouseMap'
import { checkIfKeyShouldContinueTriggerRecording } from '../constants/utils'
import { error } from 'tauri-plugin-log'
import { invoke } from '@tauri-apps/api'
import { TriggerEventType, TriggerRecordingItem } from '../types'

export default function useRecordingTrigger(
  initialItems: TriggerEventType['data']
) {
  const [recording, setRecording] = useState(false)
  const [items, setItems] = useState<TriggerRecordingItem[]>(() => {
    if (Array.isArray(initialItems)) {
      return initialItems
    } else {
      return [initialItems]
    }
  })
  const [prevItems, setPrevItems] = useState<TriggerRecordingItem[]>([])
  const toast = useToast()

  const resetItems = useCallback(() => {
    setItems(prevItems)
  }, [setItems, prevItems])

  const startRecording = useCallback(() => {
    setPrevItems(items)
    setItems([])
    setRecording(true)
  }, [setPrevItems, setItems, setRecording, items])

  const stopRecording = useCallback(() => {
    setRecording(false)
  }, [setRecording])

  const addKeypress = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault()
      event.stopPropagation()

      // Gets the ID according to the whichID, adds a separator extra digit '1' and then adds location to the end.
      const HIDIdentifier = webCodeLocationHidEncode(
        event.which,
        event.location
      )

      const HIDcode = webCodeLocationHIDLookup.get(HIDIdentifier)?.HIDcode

      if (HIDcode === undefined) {
        return
      }

      setItems((items) => {
        let newItems: TriggerRecordingItem[] = []
        if (items.filter((item) => item === HIDcode).length > 0) {
          // Prevent duplicate keys
          newItems = items
        } else {
          newItems = [...items, HIDcode]
        }
        return newItems
      })

      if (!checkIfKeyShouldContinueTriggerRecording(HIDcode)) stopRecording()
    },
    [stopRecording]
  )

  const addMousewheel = useCallback(
    (event: WheelEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (event.deltaY === 0) {
        return
      }

      setItems([
        event.deltaY < 0 ? MouseWheelDirection.Up : MouseWheelDirection.Down
      ])
      stopRecording()
    },
    [stopRecording]
  )

  const addMousepress = useCallback(
    (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      if (
        (event.target as HTMLElement).localName === 'button' ||
        (event.target as HTMLElement).localName === 'svg' ||
        (event.target as HTMLElement).localName === 'path'
      ) {
        return
      }

      const enumVal = webButtonLookup.get(event.button)?.enumVal
      if (enumVal === undefined) {
        return
      }

      setItems([enumVal])
      stopRecording()
    },
    [setItems, stopRecording]
  )

  useEffect(() => {
    if (!recording) {
      return
    }

    window.addEventListener('keydown', addKeypress, true)
    window.addEventListener('mousedown', addMousepress, true)
    window.addEventListener('wheel', addMousewheel, {
      capture: true,
      passive: false
    })
    invoke<void>('control_grabbing', { frontendBool: false }).catch((e) => {
      error(e)
      toast({
        title: 'Error disabling macro output',
        description:
          'Unable to disable macro output, please re-open the app. If that does not work, please contact us on Discord.',
        status: 'error',
        isClosable: true
      })
    })

    return () => {
      window.removeEventListener('keydown', addKeypress, true)
      window.removeEventListener('mousedown', addMousepress, true)
      window.removeEventListener('wheel', addMousewheel, true)
      invoke<void>('control_grabbing', { frontendBool: true }).catch((e) => {
        error(e)
        toast({
          title: 'Error enabling macro output',
          description:
            'Unable to enable macro output, please re-open the app. If that does not work, please contact us on Discord.',
          status: 'error',
          isClosable: true
        })
      })
    }
  }, [recording, addKeypress, addMousepress, addMousewheel, toast])

  return {
    recording,
    startRecording,
    stopRecording,
    items,
    resetItems
  }
}
