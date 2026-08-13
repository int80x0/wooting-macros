use crate::hid_table::RDEV_MODIFIER_KEYS;
use anyhow::Result;
use log::*;
use rdev;
use tokio::sync::mpsc::UnboundedSender;

#[cfg(target_os = "windows")]
fn direct_send_wheel(delta_x: i64, delta_y: i64) -> Result<()> {
    use std::mem::size_of;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
        SendInput, INPUT, INPUT_0, INPUT_MOUSE, MOUSEEVENTF_HWHEEL, MOUSEEVENTF_WHEEL,
        MOUSEINPUT,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::WHEEL_DELTA;

    let wheel_input = |flags, delta: i64| -> Result<INPUT> {
        let mouse_data = delta
            .checked_mul(i64::from(WHEEL_DELTA))
            .and_then(|value| i32::try_from(value).ok())
            .ok_or_else(|| anyhow::anyhow!("Mouse wheel delta is out of range: {}", delta))?;
        let mut input_data: INPUT_0 = unsafe { std::mem::zeroed() };
        let mouse_input = unsafe { &mut input_data.mi };
        *mouse_input = MOUSEINPUT {
            dx: 0,
            dy: 0,
            mouseData: mouse_data,
            dwFlags: flags,
            time: 0,
            dwExtraInfo: 0,
        };
        Ok(INPUT {
            r#type: INPUT_MOUSE,
            Anonymous: input_data,
        })
    };

    let mut inputs = Vec::with_capacity(2);
    if delta_x != 0 {
        inputs.push(wheel_input(MOUSEEVENTF_HWHEEL, delta_x)?);
    }
    if delta_y != 0 {
        inputs.push(wheel_input(MOUSEEVENTF_WHEEL, delta_y)?);
    }
    if inputs.is_empty() {
        return Ok(());
    }

    let sent = unsafe {
        SendInput(
            inputs.len() as u32,
            inputs.as_mut_ptr(),
            size_of::<INPUT>() as i32,
        )
    };
    if sent != inputs.len() as u32 {
        anyhow::bail!("Could not simulate mouse wheel event");
    }

    Ok(())
}

/// Sends an event to the library to Execute on an OS level. This makes it easier to implement keypresses in custom code.
pub fn direct_send_event(event_type: &rdev::EventType) -> Result<()> {
    trace!("Sending event: {:?}", event_type);

    // The pinned rdev revision rejects negative wheel deltas on Windows before
    // passing them to SendInput. Handle wheel events directly so scrolling down
    // works as well as scrolling up.
    #[cfg(target_os = "windows")]
    if let rdev::EventType::Wheel { delta_x, delta_y } = event_type {
        return direct_send_wheel(*delta_x, *delta_y);
    }

    rdev::simulate(event_type)?;
    Ok(())
}
/// Sends a vector of keys to get processed
pub async fn direct_send_key(
    send_channel: &UnboundedSender<rdev::EventType>,
    key: Vec<rdev::Key>,
) -> Result<()> {
    for press in key.iter() {
        send_channel.send(rdev::EventType::KeyPress(*press))?;

        send_channel.send(rdev::EventType::KeyRelease(*press))?;
    }
    Ok(())
}

/// Sends a vector of hotkeys to get processed
pub async fn direct_send_hotkey(
    send_channel: &UnboundedSender<rdev::EventType>,
    key: Vec<rdev::Key>,
) -> Result<()> {
    for press in key.iter() {
        send_channel.send(rdev::EventType::KeyPress(*press))?;
    }

    for press in key.iter().rev() {
        send_channel.send(rdev::EventType::KeyRelease(*press))?;
    }

    Ok(())
}

// Disabled until a better fix is done
// /// Lifts the keys pressed
pub fn lift_keys(
    pressed_events: &[u32],
    channel_sender: &UnboundedSender<rdev::EventType>,
) -> Result<()> {
    let mut pressed_events_local = pressed_events.to_owned();

    pressed_events_local.retain(|id_key| {
        RDEV_MODIFIER_KEYS
            .iter()
            .any(|rdev_key| super::super::SCANCODE_TO_RDEV[id_key] == *rdev_key)
    });

    for key in pressed_events_local.iter() {
        channel_sender.send(rdev::EventType::KeyRelease(
            super::super::SCANCODE_TO_RDEV[key],
        ))?;
    }

    Ok(())
}
