import { eq, and, asc } from 'drizzle-orm';
import { db } from '../../../db';
import { events, activities, sessions, groupMembers } from '../../../db/schema';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const sessionId = cookies.get('sessionId')?.value;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Get session
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);

    if (!session || new Date(session.expiresAt) < new Date()) {
      return new Response(JSON.stringify({ error: 'Session expired' }), { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { eventId, format = 'text' } = body;

    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Event ID is required' }), { status: 400 });
    }

    // Get event and verify ownership
    const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
    }

    let isCreator = event.creatorId === session.userId;
    let isGroupMember = false;
    if (event.groupId) {
      const groupMember = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.userId, session.userId),
            eq(groupMembers.groupId, event.groupId)
          )
        )
        .limit(1);
      isGroupMember = groupMember.length > 0;
    }

    if (!isCreator && !isGroupMember) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    }

    // Get all activities for this event
    const eventActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.eventId, eventId))
      .orderBy(asc(activities.sequenceOrder), asc(activities.startTime));

    // Generate itinerary content
    let content = '';

    if (format === 'html') {
      content = generateHtmlItinerary(event, eventActivities);
      return new Response(content, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="itinerary-${event.title.replace(/\s+/g, '-').toLowerCase()}.html"`,
        },
      });
    } else {
      // Default to text format
      content = generateTextItinerary(event, eventActivities);
      return new Response(content, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="itinerary-${event.title.replace(/\s+/g, '-').toLowerCase()}.txt"`,
        },
      });
    }
  } catch (error) {
    console.error('Error generating itinerary:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate itinerary' }), { status: 500 });
  }
};

function generateTextItinerary(event: any, eventActivities: any[]): string {
  const lines: string[] = [];

  // Header
  lines.push('='.repeat(70));
  lines.push(`ITINERARY: ${event.title}`);
  lines.push('='.repeat(70));
  lines.push('');

  // Event dates
  if (event.startDate || event.endDate) {
    lines.push('EVENT DATES:');
    if (event.startDate) {
      lines.push(`  Start: ${new Date(event.startDate).toLocaleDateString()}`);
    }
    if (event.endDate) {
      lines.push(`  End: ${new Date(event.endDate).toLocaleDateString()}`);
    }
    lines.push('');
  }

  // Activities
  if (eventActivities.length === 0) {
    lines.push('No activities planned for this event.');
  } else {
    lines.push(`ACTIVITIES (${eventActivities.length}):`);
    lines.push('-'.repeat(70));
    lines.push('');

    eventActivities.forEach((activity: any, index: number) => {
      lines.push(`${index + 1}. ${activity.title.toUpperCase()}`);

      if (activity.locationName) {
        lines.push(`   Location: ${activity.locationName}`);
      }

      if (activity.startTime) {
        const startDate = new Date(activity.startTime);
        lines.push(
          `   Time: ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })}`
        );
      }

      // Add metadata/details
      if (activity.metadata && typeof activity.metadata === 'object') {
        const metadataEntries = Object.entries(activity.metadata);
        if (metadataEntries.length > 0) {
          lines.push('   Details:');
          metadataEntries.forEach(([key, value]: [string, any]) => {
            lines.push(`     - ${key}: ${String(value)}`);
          });
        }
      }

      lines.push('');
    });
  }

  // Footer
  lines.push('-'.repeat(70));
  lines.push(`Generated on ${new Date().toLocaleString()}`);
  lines.push('');

  return lines.join('\n');
}

function generateHtmlItinerary(event: any, eventActivities: any[]): string {
  const eventTitle = event.title
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Itinerary: ${eventTitle}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1f2937;
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .event-info {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 30px;
            border-left: 4px solid #4f46e5;
        }
        .event-dates {
            color: #666;
            font-size: 14px;
        }
        .activities-header {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-top: 30px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
        }
        .activity {
            border-left: 4px solid #4f46e5;
            padding: 15px;
            margin-bottom: 20px;
            background-color: #f9fafb;
            border-radius: 4px;
        }
        .activity-number {
            color: #4f46e5;
            font-weight: 700;
            font-size: 18px;
        }
        .activity-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin: 10px 0;
        }
        .activity-detail {
            margin: 8px 0;
            color: #4b5563;
            font-size: 14px;
        }
        .detail-label {
            font-weight: 600;
            color: #1f2937;
        }
        .metadata {
            background-color: white;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
            border: 1px solid #e5e7eb;
        }
        .metadata-item {
            margin: 6px 0;
            font-size: 13px;
            color: #4b5563;
        }
        .metadata-key {
            font-weight: 600;
            color: #2d3748;
        }
        .empty-message {
            text-align: center;
            color: #666;
            padding: 40px;
            font-style: italic;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📋 Itinerary: ${eventTitle}</h1>`;

  // Event info
  if (event.startDate || event.endDate) {
    html += `<div class="event-info">
            <div class="event-dates">`;
    if (event.startDate) {
      html += `<strong>Start:</strong> ${new Date(event.startDate).toLocaleDateString()}<br>`;
    }
    if (event.endDate) {
      html += `<strong>End:</strong> ${new Date(event.endDate).toLocaleDateString()}<br>`;
    }
    html += `</div></div>`;
  }

  // Activities
  if (eventActivities.length === 0) {
    html += `<div class="empty-message">No activities planned for this event.</div>`;
  } else {
    html += `<div class="activities-header">Activities (${eventActivities.length})</div>`;

    eventActivities.forEach((activity: any, index: number) => {
      const activityTitle = String(activity.title)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
      const location = String(activity.locationName || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');

      html += `<div class="activity">
                <span class="activity-number">${index + 1}.</span>
                <div class="activity-title">${activityTitle}</div>`;

      if (location) {
        html += `<div class="activity-detail"><span class="detail-label">📍 Location:</span> ${location}</div>`;
      }

      if (activity.startTime) {
        const startDate = new Date(activity.startTime);
        const timeStr = startDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        html += `<div class="activity-detail"><span class="detail-label">🕐 Time:</span> ${startDate.toLocaleDateString()} ${timeStr}</div>`;
      }

      // Add metadata
      if (activity.metadata && typeof activity.metadata === 'object') {
        const metadataEntries = Object.entries(activity.metadata);
        if (metadataEntries.length > 0) {
          html += `<div class="metadata">
                        <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">Details:</div>`;
          metadataEntries.forEach(([key, value]: [string, any]) => {
            const safeKey = String(key)
              .replaceAll('&', '&amp;')
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;')
              .replaceAll('"', '&quot;');
            const safeValue = String(value)
              .replaceAll('&', '&amp;')
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;')
              .replaceAll('"', '&quot;');
            html += `<div class="metadata-item"><span class="metadata-key">${safeKey}:</span> ${safeValue}</div>`;
          });
          html += `</div>`;
        }
      }

      html += `</div>`;
    });
  }

  // Footer
  html += `<div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Expense Split - Trip Coordination App</p>
        </div>
    </div>
</body>
</html>`;

  return html;
}
