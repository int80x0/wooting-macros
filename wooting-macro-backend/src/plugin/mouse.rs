use anyhow::Result;
use log::*;
use serde_repr;
use tokio::sync::mpsc::UnboundedSender;

pub use rdev;

use std::time;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq, Hash, Eq)]
#[serde(tag = "type")]
/// Mouse action: Press presses a defined button, Move moves to absolute coordinates X and Y,
/// and Wheel scrolls horizontally and/or vertically by the given number of steps.
///
/// ! **UNIMPLEMENTED** - Moving a mouse is only implemented on the backend and no frontend implementation exists yet. Feel free to contribute.
pub enum MouseAction {
    Press { data: MousePressAction },
    Move { x: i32, y: i32 },
    Wheel { delta_x: i64, delta_y: i64 },
}

#[derive(
    Debug, Clone, serde_repr::Serialize_repr, serde_repr::Deserialize_repr, PartialEq, Hash, Eq,
)]
#[serde(tag = "type")]
#[repr(u16)]
/// Mouse buttons have a specified non-collisional number with the HID codes internally used within the library.
pub enum MouseButton {
    Left = 0x101,
    Right = 0x102,
    Middle = 0x103,
    Mouse4 = 0x104,
    Mouse5 = 0x105,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq, Hash, Eq)]
#[serde(tag = "type")]
/// Mouse press action: Press presses a defined button. Release releases a defined button.
/// DownUp presses and releases a defined button.
pub enum MousePressAction {
    Down { button: MouseButton },
    Up { button: MouseButton },
    DownUp { button: MouseButton, duration: u32 },
}

impl MouseAction {
    /// Creates a new MouseAction from a rdev event and sends it to the channel for async execution.
    pub async fn execute(&self, send_channel: UnboundedSender<rdev::EventType>) -> Result<()> {
        match &self {
            MouseAction::Press { data } => match data {
                MousePressAction::Down { button } => {
                    send_channel.send(rdev::EventType::ButtonPress(button.into()))?;
                }
                MousePressAction::Up { button } => {
                    send_channel.send(rdev::EventType::ButtonRelease(button.into()))?;
                }
                MousePressAction::DownUp { button, duration } => {
                    send_channel.send(rdev::EventType::ButtonPress(button.into()))?;

                    tokio::time::sleep(time::Duration::from_millis(*duration as u64)).await;

                    send_channel.send(rdev::EventType::ButtonRelease(button.into()))?;
                }
            },

            MouseAction::Move { x, y } => {
                let display_size = rdev::display_size().map_err(|err| {
                    anyhow::Error::msg(format!("Error getting displays: {:?}", err))
                })?;
                info!("Display size: {:?}", display_size);

                send_channel.send(rdev::EventType::MouseMove {
                    x: *x as f64,
                    y: *y as f64,
                })?;
            }
            MouseAction::Wheel { delta_x, delta_y } => {
                send_channel.send(rdev::EventType::Wheel {
                    delta_x: *delta_x,
                    delta_y: *delta_y,
                })?;
            }
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn serializes_wheel_action_for_frontend() {
        let action = MouseAction::Wheel {
            delta_x: 0,
            delta_y: -2,
        };

        let json = serde_json::to_value(&action).unwrap();
        assert_eq!(
            json,
            serde_json::json!({
                "type": "Wheel",
                "delta_x": 0,
                "delta_y": -2
            })
        );
        assert_eq!(serde_json::from_value::<MouseAction>(json).unwrap(), action);
    }

    #[tokio::test]
    async fn executes_vertical_wheel_actions() {
        for delta_y in [1, -3] {
            let (sender, mut receiver) = tokio::sync::mpsc::unbounded_channel();
            let action = MouseAction::Wheel {
                delta_x: 0,
                delta_y,
            };

            action.execute(sender).await.unwrap();

            assert_eq!(
                receiver.recv().await,
                Some(rdev::EventType::Wheel {
                    delta_x: 0,
                    delta_y,
                })
            );
        }
    }
}
