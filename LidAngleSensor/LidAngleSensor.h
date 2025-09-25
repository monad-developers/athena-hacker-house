//
//  LidAngleSensor.h
//  LidAngleSensor
//
//  Created by Sam on 2025-09-06.
//

#import <Foundation/Foundation.h>
#import <IOKit/hid/IOHIDManager.h>
#import <IOKit/hid/IOHIDDevice.h>

/**
 * LidAngleSensor provides access to the MacBook's internal lid angle sensor.
 * 
 * This class interfaces with the HID device that reports the angle between
 * the laptop lid and base, providing real-time angle measurements in degrees.
 * 
 * Device Specifications (discovered through reverse engineering):
 * - Apple device: VID=0x05AC, PID=0x8104
 * - HID Usage: Sensor page (0x0020), Orientation usage (0x008A)
 * - Data format: 16-bit angle value in centidegrees (0.01° resolution)
 * - Range: 0-360 degrees
 */
@interface LidAngleSensor : NSObject

@property (nonatomic, assign, readonly) IOHIDDeviceRef hidDevice;
@property (nonatomic, assign, readonly) BOOL isAvailable;

/**
 * Initialize and connect to the lid angle sensor.
 * @return Initialized sensor instance, or nil if sensor not available
 */
- (instancetype)init;

/**
 * Read the current lid angle.
 * @return Angle in degrees (0-360), or -2.0 if read failed
 */
- (double)lidAngle;

/**
 * Start lid angle monitoring (called automatically in init).
 */
- (void)startLidAngleUpdates;

/**
 * Stop lid angle monitoring and release resources.
 */
- (void)stopLidAngleUpdates;

@end
