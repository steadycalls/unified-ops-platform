# Outgoing Webhooks Guide

## Overview

**Outgoing webhooks** allow your Unified Operations Platform to automatically send data to external services when events occur. This enables powerful integrations with automation platforms like n8n, Zapier, Make (Integromat), or custom endpoints.

### Key Differences

| Feature | Incoming Webhooks | Outgoing Webhooks |
|---------|-------------------|-------------------|
| Direction | External → Platform | Platform → External |
| Purpose | Receive data | Send data |
| Trigger | External system calls your webhook | Platform events trigger sending |
| Use Case | Accept data from forms, APIs | Trigger automations, sync data |

---

## How Outgoing Webhooks Work

### Event Flow

```
1. User creates/updates/deletes data in platform
   ↓
2. Database trigger detects the change
   ↓
3. Platform checks for matching outgoing webhooks
   ↓
4. HTTP request sent to configured URL
   ↓
5. Response logged and retry if needed
```

### Supported Events

The platform automatically triggers webhooks for these events:

**Clients:**
- `clients.created` - When a new client is created
- `clients.updated` - When a client is updated
- `clients.deleted` - When a client is deleted

**Projects:**
- `projects.created` - When a new project is created
- `projects.updated` - When a project is updated
- `projects.deleted` - When a project is deleted

**Opportunities:**
- `opportunities.created` - When a new opportunity is created
- `opportunities.updated` - When an opportunity is updated
- `opportunities.deleted` - When an opportunity is deleted

**Notes:**
- `notes.created` - When a new note is created
- `notes.updated` - When a note is updated
- `notes.deleted` - When a note is deleted

---

## Creating an Outgoing Webhook

### Step 1: Get Your Target URL

**For n8n:**
1. Create a new workflow in n8n
2. Add a "Webhook" trigger node
3. Set method to POST
4. Copy the webhook URL (e.g., `https://your-n8n.com/webhook/abc123`)

**For Zapier:**
1. Create a new Zap
2. Choose "Webhooks by Zapier" as trigger
3. Select "Catch Hook"
4. Copy the webhook URL

**For Make (Integromat):**
1. Create a new scenario
2. Add a "Webhooks" module
3. Choose "Custom webhook"
4. Copy the webhook URL

**For Custom Endpoint:**
- Use any URL that accepts POST requests
- Ensure it returns 2xx status codes for success

### Step 2: Configure in Platform

1. Navigate to **Outgoing Webhooks** page
2. Click **+ Add Outgoing Webhook**
3. Fill in the form:

**Basic Information:**
- **Name:** Descriptive name (e.g., "New Client to n8n")
- **Description:** What this webhook does
- **Target URL:** The URL from Step 1

**HTTP Configuration:**
- **Method:** Usually POST (PUT/PATCH also supported)
- **Authentication:** Choose based on your endpoint requirements

**Event Selection:**
- Check all events you want to trigger this webhook
- You can select multiple events

**Retry Configuration:**
- **Enable Retry:** Recommended for reliability
- **Retry Attempts:** 3 is default (max 5)

### Step 3: Test the Webhook

1. Click the **Test** button on your webhook
2. Check the response status
3. Verify data received in your external platform
4. Review delivery logs if there are issues

---

## Authentication Options

### None
No authentication required. Use for public endpoints or when authentication is handled via URL parameters.

```javascript
// No additional headers
```

### Bearer Token
Send a token in the Authorization header. Common for APIs.

**Configuration:**
- Token: `your-secret-token`

**Result:**
```
Authorization: Bearer your-secret-token
```

### Basic Auth
Username and password authentication.

**Configuration:**
- Username: `admin`
- Password: `secret123`

**Result:**
```
Authorization: Basic YWRtaW46c2VjcmV0MTIz
```

### API Key (Header)
Custom header with API key. Flexible for various APIs.

**Configuration:**
- Header Name: `X-API-Key`
- Header Value: `your-api-key`

**Result:**
```
X-API-Key: your-api-key
```

---

## Payload Structure

### Standard Payload

When an event triggers, the platform sends this JSON structure:

```json
{
  "event": "clients.created",
  "timestamp": "2025-10-17T19:30:00.000Z",
  "organization": {
    "id": "uuid",
    "name": "SitePanda",
    "slug": "sitepanda"
  },
  "data": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "company_name": "Acme Corp",
    "phone": "+1234567890",
    "status": "active",
    "tags": ["vip", "enterprise"],
    "created_at": "2025-10-17T19:30:00.000Z",
    "updated_at": "2025-10-17T19:30:00.000Z"
  },
  "metadata": {
    "webhook_id": "uuid",
    "webhook_name": "New Client to n8n",
    "delivery_id": "uuid"
  }
}
```

### Event-Specific Data

**For `clients.updated`:**
```json
{
  "event": "clients.updated",
  "data": {
    // Full client object with updated values
  }
}
```

**For `clients.deleted`:**
```json
{
  "event": "clients.deleted",
  "data": {
    "id": "uuid",
    "email": "john@example.com"
    // Limited data (what was available before deletion)
  }
}
```

---

## Use Cases & Examples

### 1. Sync New Clients to CRM

**Scenario:** Automatically add new clients to external CRM when created.

**Setup:**
- Event: `clients.created`
- Target: Your CRM webhook endpoint
- Method: POST
- Auth: API Key

**n8n Workflow:**
```
Webhook Trigger → HTTP Request → CRM API
```

### 2. Trigger Email on Opportunity Won

**Scenario:** Send congratulations email when opportunity stage changes to "won".

**Setup:**
- Event: `opportunities.updated`
- Target: n8n webhook
- Method: POST

**n8n Workflow:**
```
Webhook → Filter (stage = won) → Send Email
```

### 3. Log All Changes to External Database

**Scenario:** Keep audit trail in external system.

**Setup:**
- Events: All `*.created`, `*.updated`, `*.deleted`
- Target: Your logging endpoint
- Method: POST

### 4. Slack Notifications

**Scenario:** Post to Slack when high-value opportunity created.

**Setup:**
- Event: `opportunities.created`
- Target: n8n webhook
- Method: POST

**n8n Workflow:**
```
Webhook → Filter (value > 10000) → Slack Message
```

### 5. Sync to Google Sheets

**Scenario:** Add new clients to Google Sheet automatically.

**Setup:**
- Event: `clients.created`
- Target: Zapier webhook
- Method: POST

**Zapier Workflow:**
```
Webhook → Google Sheets (Add Row)
```

---

## Monitoring & Troubleshooting

### View Delivery Logs

1. Go to **Outgoing Webhooks** page
2. Click **Logs** button on any webhook
3. See all delivery attempts with:
   - Timestamp
   - Event type
   - Status (success/failed)
   - Response code
   - Response time

### Common Issues

**❌ Webhook Not Triggering**
- Check if webhook is **Active**
- Verify event types are selected
- Ensure the event is actually occurring in platform

**❌ 404 Not Found**
- Verify target URL is correct
- Check if external service is running
- Test URL in browser or Postman

**❌ 401 Unauthorized**
- Check authentication configuration
- Verify API key/token is valid
- Ensure auth type matches endpoint requirements

**❌ Timeout**
- External service may be slow
- Check network connectivity
- Consider increasing timeout (contact support)

**❌ 500 Internal Server Error**
- Issue with external endpoint
- Check external service logs
- Verify payload structure is accepted

### Retry Behavior

When a webhook fails (non-2xx response or timeout):

1. **Attempt 1:** Immediate
2. **Attempt 2:** After 60 seconds
3. **Attempt 3:** After 120 seconds
4. **Attempt 4:** After 180 seconds (if retry_attempts = 4)

After all retries fail, the delivery is marked as **failed** and no further attempts are made.

---

## Best Practices

### 1. Use Descriptive Names
✅ Good: "New Client to HubSpot CRM"
❌ Bad: "Webhook 1"

### 2. Test Before Activating
Always use the **Test** button before relying on a webhook in production.

### 3. Monitor Regularly
Check delivery logs weekly to catch issues early.

### 4. Handle Failures Gracefully
Design your external workflows to handle missing or delayed data.

### 5. Secure Your Endpoints
Use authentication when possible, especially for sensitive data.

### 6. Keep URLs Updated
If your external service URL changes, update the webhook immediately.

### 7. Limit Event Selection
Only subscribe to events you actually need to reduce noise.

### 8. Document Your Integrations
Keep notes on what each webhook does and which external service it connects to.

---

## Security Considerations

### Data Exposure
Webhooks send full entity data. Ensure target URLs are:
- HTTPS (encrypted)
- Trusted services
- Properly authenticated

### Authentication
Always use authentication when available:
- Bearer tokens for APIs
- API keys for custom endpoints
- Basic auth for simple services

### Network Security
- Webhooks are sent from platform server IP
- Whitelist platform IP if target has firewall
- Use VPN if connecting to internal services

### Audit Trail
All webhook deliveries are logged with:
- Full request/response
- Timestamps
- IP addresses
- User agents

---

## API Reference

### Create Outgoing Webhook

```http
POST /api/v1/:org/outgoing-webhooks
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Client to n8n",
  "description": "Sends new client data to n8n workflow",
  "target_url": "https://your-n8n.com/webhook/abc123",
  "http_method": "POST",
  "auth_type": "bearer",
  "auth_config": {
    "token": "your-secret-token"
  },
  "event_types": ["clients.created"],
  "retry_enabled": true,
  "retry_attempts": 3
}
```

### Update Outgoing Webhook

```http
PATCH /api/v1/:org/outgoing-webhooks/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_active": false
}
```

### Test Outgoing Webhook

```http
POST /api/v1/:org/outgoing-webhooks/:id/test
Authorization: Bearer {token}
```

### Get Delivery Logs

```http
GET /api/v1/:org/outgoing-webhooks/:id/deliveries?limit=50&status=failed
Authorization: Bearer {token}
```

### Delete Outgoing Webhook

```http
DELETE /api/v1/:org/outgoing-webhooks/:id
Authorization: Bearer {token}
```

---

## Integration Examples

### n8n Example Workflow

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "unified-ops-client",
        "method": "POST"
      }
    },
    {
      "name": "Process Data",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "const client = items[0].json.data;\nreturn [{ json: { name: `${client.first_name} ${client.last_name}`, email: client.email } }];"
      }
    },
    {
      "name": "Send to CRM",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-crm.com/api/contacts",
        "method": "POST"
      }
    }
  ]
}
```

### Zapier Example

1. **Trigger:** Webhooks by Zapier - Catch Hook
2. **Action:** Google Sheets - Create Spreadsheet Row
   - Map fields:
     - Name: `{{data__first_name}} {{data__last_name}}`
     - Email: `{{data__email}}`
     - Company: `{{data__company_name}}`

### Make (Integromat) Example

1. **Trigger:** Webhooks - Custom Webhook
2. **Action:** HTTP - Make a Request
   - URL: Your endpoint
   - Method: POST
   - Body: `{{data}}`

---

## FAQ

**Q: How quickly are webhooks sent?**
A: Immediately after the event occurs (typically < 1 second).

**Q: Can I send to multiple endpoints for the same event?**
A: Yes! Create multiple outgoing webhooks with the same event type.

**Q: What happens if my endpoint is down?**
A: The platform will retry based on your retry configuration, then mark as failed.

**Q: Can I see the full request/response?**
A: Yes, in the delivery logs. Response bodies are truncated to 5000 characters.

**Q: Is there a rate limit?**
A: No limit on outgoing webhooks, but your target endpoint may have limits.

**Q: Can I customize the payload?**
A: Currently, the payload structure is fixed. Custom templates coming in future release.

**Q: Can I filter events (e.g., only VIP clients)?**
A: Event filters are in the database schema but not yet exposed in UI. Coming soon!

**Q: What if I need to change the URL?**
A: Edit the webhook and update the target_url field.

---

## Support

For issues or questions:
- Check delivery logs for error messages
- Test with a simple endpoint like webhook.site
- Review this guide for common issues
- Contact support with webhook ID and delivery log ID

---

**Version:** 2.0
**Last Updated:** October 17, 2025

