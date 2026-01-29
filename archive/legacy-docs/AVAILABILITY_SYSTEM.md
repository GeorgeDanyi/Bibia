# Availability System Documentation

## Overview

The availability system provides believable availability information for therapists without real calendar integrations. It's designed to be easily replaceable with real calendar systems in the future.

## Architecture

### Core Components

1. **Types** (`lib/types/availability.ts`)
   - `TherapistAvailability` - Main availability data structure
   - `TimeSlot` - Individual time slots
   - `DayAvailability` - Daily availability patterns
   - `AvailabilityPreferences` - User preferences for availability

2. **Mock Data** (`lib/data/mock-availability.ts`)
   - Generates believable availability patterns
   - Provides consistent data across sessions
   - Simulates real-world availability scenarios

3. **Calendar Integration** (`lib/types/calendar-integration.ts`)
   - Interfaces for future real calendar systems
   - Mock implementation for development
   - Service abstraction for calendar providers

4. **Availability Bridge** (`lib/utils/availability-bridge.ts`)
   - Seamless transition between mock and real data
   - Unified interface for availability operations
   - Future-proof architecture

## Features

### Current Implementation

- **Believable Mock Data**: Generates realistic availability patterns
- **Time Slot Management**: Handles individual time slots and daily patterns
- **Next Available Slot**: Shows when therapists are next available
- **Availability Display**: Visual indicators for therapist availability
- **Sorting by Availability**: Results can be sorted by earliest availability

### Future Calendar Integration

- **Multiple Providers**: Support for Google Calendar, Outlook, Apple Calendar
- **Real-time Sync**: Live calendar data integration
- **Booking Management**: Direct appointment booking
- **Conflict Resolution**: Handle scheduling conflicts
- **Recurring Appointments**: Support for recurring availability patterns

## Usage

### Getting Therapist Availability

```typescript
import { getTherapistAvailability } from '@/lib/types/availability';

const availability = getTherapistAvailability('therapist-id');
console.log(availability.nextAvailableSlot);
```

### Using the Availability Bridge

```typescript
import { availabilityBridge } from '@/lib/utils/availability-bridge';

// Get availability (works with both mock and real data)
const availability = await availabilityBridge.getAvailability('therapist-id');

// Get available slots for a date range
const slots = await availabilityBridge.getAvailableSlots(
  'therapist-id',
  '2024-01-01',
  '2024-01-07'
);
```

### Enabling Real Calendar Integration

```typescript
// Enable real calendar integration
availabilityBridge.enableRealCalendar();

// Disable and fallback to mock data
availabilityBridge.disableRealCalendar();
```

## Data Structure

### TherapistAvailability

```typescript
interface TherapistAvailability {
  therapistId: string;
  availability: DayAvailability[];
  nextAvailableSlot?: string; // ISO datetime
  bookingLeadTime: number; // hours
  maxAdvanceBooking: number; // days
}
```

### DayAvailability

```typescript
interface DayAvailability {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  slots: TimeSlot[];
  isAvailable: boolean;
}
```

### TimeSlot

```typescript
interface TimeSlot {
  start: string; // "09:00"
  end: string;   // "10:00"
  available: boolean;
}
```

## UI Integration

### Questionnaire

- **Time Preferences**: Users can select preferred times
- **Urgency Selection**: Choose how urgently they need help
- **Weekday Selection**: Optional specific day preferences

### Results Page

- **Availability Display**: Shows next available slots
- **Day Indicators**: Visual availability status for each day
- **Sorting Options**: Sort by earliest availability
- **Booking Integration**: Direct booking from availability info

## Future Enhancements

### Real Calendar Integration

1. **Google Calendar API**
   - OAuth2 authentication
   - Real-time calendar sync
   - Event creation and management

2. **Microsoft Outlook**
   - Graph API integration
   - Office 365 calendar access
   - Meeting room booking

3. **Apple Calendar**
   - CalDAV protocol support
   - iCloud calendar integration
   - Mobile calendar sync

### Advanced Features

1. **Smart Scheduling**
   - AI-powered slot recommendations
   - Conflict resolution
   - Optimal time suggestions

2. **Recurring Appointments**
   - Weekly/monthly patterns
   - Exception handling
   - Holiday management

3. **Multi-timezone Support**
   - Automatic timezone conversion
   - Global therapist availability
   - Local time display

## Migration Strategy

### Phase 1: Mock Data (Current)
- ✅ Believable availability patterns
- ✅ Consistent user experience
- ✅ No external dependencies

### Phase 2: Calendar Integration
- 🔄 Real calendar API integration
- 🔄 OAuth authentication
- 🔄 Live data synchronization

### Phase 3: Advanced Features
- 🔄 Smart scheduling
- 🔄 Conflict resolution
- 🔄 Multi-provider support

## Testing

### Mock Data Testing

```typescript
// Test availability generation
const availability = generateMockAvailability('test-therapist');
expect(availability.availability).toHaveLength(7); // 7 days
expect(availability.nextAvailableSlot).toBeDefined();
```

### Integration Testing

```typescript
// Test calendar integration
const calendar = await calendarService.getTherapistCalendar('therapist-id');
expect(calendar).toBeDefined();
expect(calendar.provider.isConnected).toBe(true);
```

## Performance Considerations

- **Caching**: Availability data is cached to reduce API calls
- **Lazy Loading**: Calendar data is loaded on demand
- **Debouncing**: UI updates are debounced to prevent excessive requests
- **Fallback**: Mock data is used when calendar services are unavailable

## Security

- **OAuth2**: Secure authentication for calendar providers
- **Data Encryption**: Sensitive calendar data is encrypted
- **Access Control**: Therapists control their calendar access
- **Audit Logging**: All calendar operations are logged

## Monitoring

- **Availability Metrics**: Track availability patterns
- **Booking Success Rates**: Monitor booking completion
- **Calendar Sync Status**: Monitor calendar connectivity
- **Error Rates**: Track integration failures

## Troubleshooting

### Common Issues

1. **Calendar Not Syncing**
   - Check OAuth token validity
   - Verify calendar permissions
   - Check network connectivity

2. **Availability Not Showing**
   - Verify therapist has connected calendar
   - Check working hours configuration
   - Ensure calendar has free time slots

3. **Booking Failures**
   - Check calendar permissions
   - Verify time slot availability
   - Check for scheduling conflicts

### Debug Mode

Enable debug mode to see detailed availability information:

```typescript
// Enable debug logging
localStorage.setItem('bibia-debug', 'true');
```

## Contributing

When adding new availability features:

1. **Update Types**: Add new interfaces to `lib/types/availability.ts`
2. **Mock Implementation**: Add mock data generation
3. **Real Integration**: Implement real calendar integration
4. **Bridge Update**: Update the availability bridge
5. **UI Integration**: Update questionnaire and results pages
6. **Documentation**: Update this documentation

## Support

For questions or issues with the availability system:

1. Check the troubleshooting section
2. Review the API documentation
3. Test with mock data first
4. Verify calendar permissions
5. Contact the development team
