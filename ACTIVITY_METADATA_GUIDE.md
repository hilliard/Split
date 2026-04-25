# Activity & Event Metadata/Details Feature

## Overview

The Expense Split app now supports adding custom **Details** (metadata) to activities and events. This allows you to store flexible, unstructured information like:

- Flight numbers and times
- Addresses and venue locations
- Attendee lists
- Reservation names
- Dietary restrictions
- Confirmation codes
- Or any other custom details

## How to Use

### Adding Details to an Activity

1. Open an activity for editing
2. Scroll to the **"Details (Flight #, Address, Attendees, etc.)"** section
3. To use a template:
   - Select a template from the dropdown (Flight, Hotel, Restaurant, Tourist Activity)
   - Click **"Apply Template"** to auto-populate metadata fields
   - Fill in the values (keys are pre-filled, you just add values)
4. To add details manually:
   - Click **"+ Add Detail"** to add a new key-value pair
   - Enter the detail key (e.g., "Flight Number") and value (e.g., "DL123")
5. Add as many details as needed
6. Click **"Save Changes"** to save

### Adding Details to an Event

1. Open an event for editing (click Edit on any event page)
2. Scroll to the **"Event Details (Location, Venue, Contact, etc.)"** section
3. Click **"+ Add Detail"** to add a new key-value pair
4. Enter the detail key (e.g., "Venue Name") and value (e.g., "The Grand Ballroom")
5. Add as many details as needed
6. Click **"Save Changes"** to save

### Editing Details

- Simply modify the key or value fields
- Click the **"✕" button** to remove a detail
- Add new details at any time

## Search & Filter by Details

On the Activities list page, use the **Search & Filter** section to find activities by:

- **Activity Title**: Find activities by name (e.g., "Breakfast", "Hotel Check-in")
- **Search by Detail**: Search through all activity details at once (e.g., search "DL123" to find the flight with that confirmation number, "The Plaza" to find activities with that hotel name)

Simply type in either field and matching activities appear immediately. Use **Clear Filters** to reset and see all activities again.

### Example Searches

- Search "4:00 PM" to find activities at that time
- Search "New York" to find all activities related to New York
- Search for flight numbers, hotel names, restaurant names, etc.
- Search last names of attendees stored in activity details

## Export to Itinerary

Generate a professional, downloadable itinerary document with all activities and their details:

1. Go to any event page
2. Click the **"📄 Export Itinerary"** button
3. An HTML document will download containing:
   - Event name and dates
   - All activities in order
   - Locations, times, and details for each activity
   - Professional formatting suitable for printing or sharing with group members

The exported itinerary is perfect for:

- Sharing plans with trip participants
- Printing as a reference document
- Sending via email
- Trip planning and coordination

## Activity Templates

The app includes 4 pre-built templates to save time when adding common activity types:

### ✈️ One-Way Flight Template

Includes fields for:

- Airline Company
- Flight Number
- Confirmation Number
- Take Off Time
- Arrival Time
- Seat Number

### 🔄 Round-Trip Flight Template

Includes fields for:

- Airline Company
- Confirmation Number
- Outbound Flight #
- Outbound Take Off
- Outbound Arrival
- Outbound Seat
- Return Flight #
- Return Take Off
- Return Arrival
- Return Seat

### 🚗 Car Rental Template

Includes fields for:

- Rental Company
- Reservation #
- Vehicle Type
- Pick Up Location
- Pick Up Time
- Drop Off Location
- Drop Off Time

### 🏨 Hotel Template

Includes fields for:

- Hotel Name, Address
- Check-in & Check-out Dates
- Room Type, Parking
- Confirmation Code & Contact Number

### 🍽️ Restaurant/Dinner Template

Includes fields for:

- Restaurant Name, Address, Cuisine Type
- Reservation Time, Party Size
- Reservation Name & Phone Number
- Special Requests & Dietary Restrictions

### 🎫 Tourist Activity Template

Includes fields for:

- Location/Attraction Name, Address
- Activity Duration, Meeting Point
- Suggested Time, Entrance Fee
- What to Bring & Contact Number

**To use a template:**

1. Select the template from the dropdown next to "Quick Templates"
2. Click "Apply Template"
3. A set of pre-filled detail keys will appear ready for values
4. Fill in the values and save

### Editing Details

- Simply modify the key or value fields
- Click the **"✕" button** to remove a detail
- Add new details at any time

### Examples

#### Activity - Flight

```
Flight Number: DL123
Departure Time: 2026-04-21T08:00:00Z
Arrival Time: 2026-04-21T11:30:00Z
Airline: Delta
Departure Airport: JFK
Arrival Airport: DEN
Gate: B5
```

#### Activity - Dinner

```
Restaurant: The Golden Fork
Address: 123 Main St, Westminster, CO
Reservation Name: Smith Party
Party Size: 6
Dietary Restrictions: John (vegetarian), Jane (gluten-free)
Time: 7:00 PM
```

#### Activity - Hotel

```
Hotel Name: Hilton Denver Downtown
Confirmation Code: A1B2C3D4
Check-in: 2026-04-21
Check-out: 2026-04-25
Room Type: King Bed Suite
Parking: Valet, $25/night
```

#### Event - Wedding

```
Venue: The Grand Ballroom
Address: 789 Romance Lane, Dallas TX
Contact: Event Planner - Jennifer Lee
Phone: (214) 555-4567
Capacity: 250 guests
Dress Code: Black Tie Optional
Menu Selection Due: April 1st
```

#### Event - Company Team Dinner

```
Restaurant: Capital Grille
Address: 321 Executive Dr, Denver CO
Reservation Name: Mike Chen
Party Size: 12 people
Budget Per Person: $75
Time: 6:30 PM
Dietary Restrictions: Contact organizer if needed
```

#### Event - Conference

```
Venue: Convention Center Hall A
Address: 200 Congress Ave, Austin TX
Contact: Sarah Johnson
Phone: (512) 555-0123
Capacity: 500 people
Parking: Lot B (complimentary)
WiFi Password: CONF2026
```

## Database Storage

Details are stored as **JSON** in the database for both activities and events, which means:

- ✅ Flexible: Any key-value pairs
- ✅ Queryable: Can search and filter by metadata in future
- ✅ Scalable: No need to add columns for every possible detail type
- ✅ Backed up: Automatically included in database backups

## Technical Details

### Schema

Both the `activities` and `events` tables include a `metadata` column:

```SQL
ALTER TABLE activities ADD COLUMN metadata json DEFAULT '{}'::json;
ALTER TABLE events ADD COLUMN metadata json DEFAULT '{}'::json;
```

### Activity API

The `/api/activities/update` endpoint accepts and stores metadata:

```json
{
  "activityId": "uuid",
  "title": "Flight to Denver",
  "metadata": {
    "flightNumber": "DL123",
    "airline": "Delta"
  }
}
```

### Event API

The `/api/events/update` endpoint accepts and stores metadata:

```json
{
  "eventId": "uuid",
  "name": "Team Dinner",
  "metadata": {
    "restaurant": "Capital Grille",
    "reservationName": "Mike Chen",
    "partySize": "12"
  }
}
```

## Future Enhancements

Potential improvements:

- Advanced search filters (by date range, activity type)
- Export to PDF format
- Share activity details with group members
- Integration with calendar apps (Google Calendar, Outlook)
- Recurring activity templates
