//
//  LidAngleSensorBridge.m
//  WebSocket bridge for LidAngleSensor
//
//  Objective-C command line tool that reads lid angle and outputs JSON
//

#import <Foundation/Foundation.h>
#import <IOKit/hid/IOHIDManager.h>
#import <IOKit/hid/IOHIDDevice.h>

// Simplified LidAngleSensor implementation embedded in bridge
@interface SimpleLidAngleSensor : NSObject
@property (nonatomic, assign) IOHIDDeviceRef hidDevice;
@property (nonatomic, assign, readonly) BOOL isAvailable;
- (instancetype)init;
- (double)lidAngle;
- (void)stopLidAngleUpdates;
@end

@implementation SimpleLidAngleSensor

- (instancetype)init {
    self = [super init];
    if (self) {
        _hidDevice = [self findLidAngleSensor];
        if (_hidDevice) {
            IOHIDDeviceOpen(_hidDevice, kIOHIDOptionsTypeNone);
        }
    }
    return self;
}

- (BOOL)isAvailable {
    return _hidDevice != NULL;
}

- (IOHIDDeviceRef)findLidAngleSensor {
    IOHIDManagerRef manager = IOHIDManagerCreate(kCFAllocatorDefault, kIOHIDOptionsTypeNone);
    if (!manager) return NULL;

    if (IOHIDManagerOpen(manager, kIOHIDOptionsTypeNone) != kIOReturnSuccess) {
        CFRelease(manager);
        return NULL;
    }

    NSDictionary *matchingDict = @{
        @"VendorID": @(0x05AC),     // Apple
        @"ProductID": @(0x8104),    // Specific product
        @"UsagePage": @(0x0020),    // Sensor page
        @"Usage": @(0x008A),        // Orientation usage
    };

    IOHIDManagerSetDeviceMatching(manager, (__bridge CFDictionaryRef)matchingDict);
    CFSetRef devices = IOHIDManagerCopyDevices(manager);
    IOHIDDeviceRef device = NULL;

    if (devices && CFSetGetCount(devices) > 0) {
        const void **deviceArray = malloc(sizeof(void*) * CFSetGetCount(devices));
        CFSetGetValues(devices, deviceArray);

        for (CFIndex i = 0; i < CFSetGetCount(devices); i++) {
            IOHIDDeviceRef testDevice = (IOHIDDeviceRef)deviceArray[i];

            if (IOHIDDeviceOpen(testDevice, kIOHIDOptionsTypeNone) == kIOReturnSuccess) {
                uint8_t testReport[8] = {0};
                CFIndex reportLength = sizeof(testReport);

                IOReturn result = IOHIDDeviceGetReport(testDevice,
                                                      kIOHIDReportTypeFeature,
                                                      1,
                                                      testReport,
                                                      &reportLength);

                if (result == kIOReturnSuccess && reportLength >= 3) {
                    device = (IOHIDDeviceRef)CFRetain(testDevice);
                    IOHIDDeviceClose(testDevice, kIOHIDOptionsTypeNone);
                    break;
                } else {
                    IOHIDDeviceClose(testDevice, kIOHIDOptionsTypeNone);
                }
            }
        }

        free(deviceArray);
    }

    if (devices) CFRelease(devices);
    IOHIDManagerClose(manager, kIOHIDOptionsTypeNone);
    CFRelease(manager);

    return device;
}

- (double)lidAngle {
    if (!_hidDevice) return -2.0;

    uint8_t report[8] = {0};
    CFIndex reportLength = sizeof(report);

    IOReturn result = IOHIDDeviceGetReport(_hidDevice,
                                          kIOHIDReportTypeFeature,
                                          1,
                                          report,
                                          &reportLength);

    if (result == kIOReturnSuccess && reportLength >= 3) {
        uint16_t rawValue = (report[2] << 8) | report[1];
        double angle = (double)rawValue;
        return angle;
    }

    return -2.0;
}

- (void)stopLidAngleUpdates {
    if (_hidDevice) {
        IOHIDDeviceClose(_hidDevice, kIOHIDOptionsTypeNone);
        CFRelease(_hidDevice);
        _hidDevice = NULL;
    }
}

- (void)dealloc {
    [self stopLidAngleUpdates];
}

@end

@interface LidAngleSensorBridge : NSObject
@property (nonatomic, strong) SimpleLidAngleSensor *sensor;
@property (nonatomic, strong) NSTimer *updateTimer;
@property (nonatomic, assign) BOOL isRunning;
@property (nonatomic, assign) BOOL jsonOutput;
@end

@implementation LidAngleSensorBridge

- (instancetype)init {
    self = [super init];
    if (self) {
        _sensor = [[SimpleLidAngleSensor alloc] init];
        _isRunning = NO;
        _jsonOutput = NO;
    }
    return self;
}

- (void)startMonitoring {
    if (self.isRunning) return;

    self.isRunning = YES;

    if (!self.sensor.isAvailable) {
        if (self.jsonOutput) {
            printf("{\"error\":\"Lid angle sensor not available\"}\n");
        } else {
            printf("Error: Lid angle sensor not available\n");
        }
        return;
    }

    // Update every 100ms for smooth angle tracking
    self.updateTimer = [NSTimer scheduledTimerWithTimeInterval:0.1
                                                        target:self
                                                      selector:@selector(updateAngle)
                                                      userInfo:nil
                                                       repeats:YES];

    if (self.jsonOutput) {
        printf("{\"status\":\"monitoring_started\"}\n");
    } else {
        printf("Starting lid angle monitoring...\n");
    }

    fflush(stdout);
}

- (void)updateAngle {
    double angle = [self.sensor lidAngle];

    if (angle >= 0) {
        if (self.jsonOutput) {
            printf("{\"angle\":%.2f,\"timestamp\":%lld}\n",
                   angle,
                   (long long)([[NSDate date] timeIntervalSince1970] * 1000));
        } else {
            printf("Angle: %.2f degrees\n", angle);
        }
        fflush(stdout);
    }
}

- (void)stopMonitoring {
    if (!self.isRunning) return;

    self.isRunning = NO;

    if (self.updateTimer) {
        [self.updateTimer invalidate];
        self.updateTimer = nil;
    }

    if (self.jsonOutput) {
        printf("{\"status\":\"monitoring_stopped\"}\n");
    } else {
        printf("Stopped lid angle monitoring\n");
    }

    fflush(stdout);
}

- (void)dealloc {
    [self stopMonitoring];
}

@end

int main(int argc, const char * argv[]) {
    @autoreleasepool {
        LidAngleSensorBridge *bridge = [[LidAngleSensorBridge alloc] init];

        // Check for --json flag
        for (int i = 1; i < argc; i++) {
            if (strcmp(argv[i], "--json") == 0) {
                bridge.jsonOutput = YES;
                break;
            }
        }

        [bridge startMonitoring];

        // Keep running until interrupted
        [[NSRunLoop currentRunLoop] run];
    }

    return 0;
}