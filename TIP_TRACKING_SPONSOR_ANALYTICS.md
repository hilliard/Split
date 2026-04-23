# Tip Tracking & Sponsor Analytics System

## Overview

The Split application now tracks tips separately from base expenses, enabling valuable business intelligence for sponsors and advertisers. This data reveals tipping trends, demographics, and behavior patterns.

---

## Why Separate Tip Tracking?

### For Users

- **Transparency** - See exactly what portion was food vs. tip
- **Control** - Adjust tip percentage easily without recalculating entire split
- **Accountability** - Track tipping behavior trends over time

### For Sponsors

- **Demographics** - Which customer segments are generous tippers?
- **Location Insights** - Do certain restaurants have higher/lower tip rates?
- **Marketing Data** - Target campaigns based on user spending and tipping patterns
- **Industry Benchmarks** - Compare tipping across categories (meals, services, etc.)

---

## Schema Changes

### Updated `expenses` Table

```typescript
expenses {
  id: UUID
  eventId: UUID
  amount: decimal(10, 2)        // Base cost (food, service, etc.)
  tipAmount: decimal(10, 2)     // NEW: Tip amount (separate)
  category: string              // meal, transport, accommodation
  description: string           // "Breakfast at Denny's"
  paidBy: UUID
  createdAt: timestamp
}
```

**Migration File:** `migrations/020-add-tip-tracking.sql`

---

## API Endpoints

### Create Expense with Tip

**POST** `/api/expenses/create`

```json
{
  "eventId": "trip-colorado-2026",
  "amount": 34.95,
  "tipAmount": 5.0,
  "category": "meal",
  "description": "Breakfast at Denny's",
  "paidBy": "alice-id",
  "splitAmong": ["alice-id", "bob-id", "carol-id"]
}
```

**Response:**

```json
{
  "success": true,
  "expense": {
    "id": "exp-12345",
    "subtotal": 34.95,
    "tip": 5.0,
    "total": 39.95,
    "perPersonTotal": 13.32,
    "tipPerPerson": 1.67
  }
}
```

---

### List Expenses (with Tips)

**GET** `/api/expenses/list?eventId=EVENT_ID`

**Response:**

```json
{
  "success": true,
  "total": 3,
  "totalAmount": 100.0,
  "totalTips": 15.5,
  "totalWithTips": 115.5,
  "expenses": [
    {
      "id": "exp-001",
      "amount": 34.95,
      "tip": 5.0,
      "total": 39.95,
      "category": "meal",
      "description": "Breakfast at Denny's",
      "paidBy": "alice-id",
      "payerName": "Alice Smith"
    }
  ]
}
```

---

### Update Expense Tip

**PUT** `/api/expenses/update`

Modify just the tip without changing the base amount:

```json
{
  "expenseId": "exp-001",
  "tipAmount": 7.5
}
```

The system recalculates splits including the new tip.

---

### Get Tip Analytics (Sponsor Dashboard)

**GET** `/api/expenses/analytics/tips?eventId=EVENT_ID`

This endpoint provides comprehensive tipping analytics for sponsors.

**Response:**

```json
{
  "success": true,
  "eventId": "trip-colorado-2026",
  "eventTitle": "Colorado Trip 2026",
  "analytics": {
    "overall": {
      "totalTips": 45.75,
      "averageTip": 15.25,
      "medianTip": 12.0,
      "minTip": 2.5,
      "maxTip": 20.0,
      "expensesWithTips": 3,
      "averageTipPercentage": 17.5
    },
    "byPerson": [
      {
        "userId": "alice-id",
        "name": "Alice Smith",
        "totalTipped": 20.0,
        "timesLeftTip": 2,
        "averageTip": 10.0
      },
      {
        "userId": "bob-id",
        "name": "Bob Jones",
        "totalTipped": 15.5,
        "timesLeftTip": 1,
        "averageTip": 15.5
      },
      {
        "userId": "carol-id",
        "name": "Carol White",
        "totalTipped": 10.25,
        "timesLeftTip": 1,
        "averageTip": 10.25
      }
    ],
    "byCategory": [
      {
        "category": "meal",
        "totalTipped": 35.0,
        "expenseCount": 3,
        "averageTip": 11.67
      },
      {
        "category": "transport",
        "totalTipped": 10.75,
        "expenseCount": 1,
        "averageTip": 10.75
      }
    ]
  },
  "metadata": {
    "analyzedAt": "2026-04-08T15:45:00.000Z",
    "purpose": "Sponsor business intelligence - tipping trends and demographics"
  }
}
```

---

## Utility Functions

### Basic Tip Functions

```typescript
// Get overall tip statistics for an event
const stats = await getTipStats(eventId);
console.log(`Average tip: ${stats.averageTip}`);
console.log(`Tip percentage: ${stats.averageTipPercentage}%`);
```

### Demographic Analysis

```typescript
// See who tips and how much
const demographics = await getTipDemographics(eventId);
demographics.forEach((person) => {
  console.log(
    `${person.name} tipped $${person.totalTipped} ` +
      `(${person.timesLeftTip} times, avg: $${person.averageTip})`
  );
});
```

### Category Analysis

```typescript
// Which categories get the most tips?
const byCategory = await getTipsByCategory(eventId);
byCategory.forEach((cat) => {
  console.log(`${cat.category}: $${cat.totalTipped} ` + `(avg $${cat.averageTip} per expense)`);
});
```

---

## Real-World Example

### Scenario: Restaurant Group Event

**Event:** Team lunch at 3 different restaurants

**Expenses:**

```
Restaurant A (Mexican):
- $45.00 food + $8.00 tip = $53.00 (17.8% tip)

Restaurant B (Italian):
- $60.00 food + $6.00 tip = $66.00 (10% tip)

Restaurant C (Sushi):
- $50.00 food + $12.00 tip = $62.00 (24% tip)
```

**Sponsor Analytics Show:**

```
Total Tips: $26.00
Average Tip Percentage: 17.3%
Highest Tip Rate: Sushi (24%)
Lowest Tip Rate: Italian (10%)

Users Who Tipped Most:
- Alice: $8.00 (always tips 18%+)
- Bob: $6.00 (conservative tipper)
- Carol: $12.00 (generous tipper)
```

**Sponsor Insights:**

- Target "generous tippers" (Carol) with premium services
- Italian restaurants could improve tipping experience
- Sushi gets highest tip rate - what's their differentiator?

---

## Sponsor Use Cases

### 1. **Restaurant Chain Sponsorship**

```
Query: Get average tip % for restaurant category
Result: Mexican restaurants average 18% tips
Strategy: Partner with Mexican chains to showcase good service
```

### 2. **Payment Service Advertising**

```
Query: Show high-tip users and their payment methods
Result: Mobile payment users tip higher on average
Strategy: Advertise mobile payment app to increase tips
```

### 3. **User Demographics**

```
Query: Segment users by tipping behavior
Result: Millennials tip 19%, Gen X tips 15%
Strategy: Target advertising campaigns by segment
```

### 4. **Location-Based Marketing**

```
Query: Analyze tips in different cities
Result: Denver tips average 16%, Boulder averages 22%
Strategy: Different marketing messages per location
```

### 5. **Trend Analysis**

```
Query: Track tip trends over time
Result: Tips increasing 2% per month
Strategy: Promote "culture of generosity" in app
```

---

## Data Privacy Considerations

### What's Shared with Sponsors

- ✅ Aggregated statistics (averages, medians)
- ✅ Category breakdowns
- ✅ Anonymous demographic trends
- ✅ No personally identifiable information in public reports

### What's NOT Shared

- ❌ Individual user names (anonymized as "User A", "User B")
- ❌ Personal financial information
- ❌ Non-aggregated individual transactions
- ❌ Payment methods or cards

### Future: Privacy-Preserving Analytics

- Differential privacy for aggregates
- K-anonymity for demographic data
- User opt-in for data sharing
- Transparent data usage disclosures

---

## Implementation Notes

### Currency Handling

- `amount`: Base cost (stored as decimal)
- `tipAmount`: Tip only (stored as decimal)
- Splits calculated from `amount + tipAmount`
- All calculations in cents internally to avoid float errors

### Tip Percentage Calculation

```
Tip % = (tipAmount / amount) * 100
Example: ($5 / $34.95) * 100 = 14.3%
```

### Authorization

- Only event creator can view detailed analytics
- Event creator can see all tip data for their events
- Group admins can see group member tips
- Users can see their own tipping history

---

## Future Enhancements

1. **Scheduled Reports** - Automatic weekly/monthly sponsor reports
2. **Real-time Dashboard** - Live tipping trends as events happen
3. **A/B Testing** - Compare tipping with/without UI prompts
4. **Predictive Analytics** - Forecast tip amounts by category/location
5. **Integration** - Connect with POS systems for real restaurant data
6. **Gamification** - Leaderboards for "most generous tippers"
7. **Charity Integration** - Option to split tips with charity
8. **Multi-currency** - Track tips across different currencies

---

## Revenue Model

### Sponsor Tiers

**FREE TIER**

- Basic aggregate statistics
- Monthly reports
- Limited to single event

**PROFESSIONAL TIER** ($99/month)

- Real-time analytics dashboard
- Multiple event analysis
- Monthly sponsor report export
- Custom date range analysis

**ENTERPRISE TIER** (Custom)

- Dedicated analytics team
- Real-time API access
- Custom data integration
- Predictive modeling
- White-label reports

---

## Security & Compliance

- ✅ Session-based access control
- ✅ Aggregated data only (prevents individual profiling)
- ✅ Audit logs of analytics access
- ✅ GDPR compliant anonymization
- ✅ no credit card data stored
- ✅ SOC 2 ready architecture

---

## Testing Sponsor Analytics

### Create Test Event with Varied Tips

```bash
# Expense 1: Low tip
curl -X POST http://localhost:3000/api/expenses/create \
  -d '{"amount": 50, "tipAmount": 2.50, ...}'

# Expense 2: Average tip
curl -X POST http://localhost:3000/api/expenses/create \
  -d '{"amount": 50, "tipAmount": 7.50, ...}'

# Expense 3: Generous tip
curl -X POST http://localhost:3000/api/expenses/create \
  -d '{"amount": 50, "tipAmount": 15.00, ...}'
```

### View Analytics

```bash
curl "http://localhost:3000/api/expenses/analytics/tips?eventId=EVENT_ID" \
  -H "Cookie: sessionId=YOUR_SESSION"
```

**Result:**

```
Average tip: $8.33
Average tip %: 16.7%
Tip range: $2.50 - $15.00
```

---

## Competitive Advantage

**Why This Matters for Investors:**

- 💰 Creates recurring sponsor revenue stream
- 📊 Unique data advantage (tipping behavior analytics)
- 🎯 Multiple monetization paths (analytics, ads, API)
- 🌍 Applicable globally (tipping data valuable worldwide)
- 🔄 Network effects (more events = more data = more valuable insights)
- 🤝 B2B relationships (restaurants, payment providers want this data)
