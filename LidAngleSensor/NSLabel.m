//
//  NSLabel.m
//  LidAngleSensor
//
//  Created by Sam on 2025-09-06.
//

#import "NSLabel.h"

@implementation NSLabel

- (instancetype)init {
    self = [super init];
    if (self) {
        [self configureAsLabel];
    }
    return self;
}

- (instancetype)initWithFrame:(NSRect)frameRect {
    self = [super initWithFrame:frameRect];
    if (self) {
        [self configureAsLabel];
    }
    return self;
}

- (void)configureAsLabel {
    [self setBezeled:NO];
    [self setDrawsBackground:NO];
    [self setEditable:NO];
    [self setSelectable:NO];
    [self setTranslatesAutoresizingMaskIntoConstraints:NO];
}

@end
