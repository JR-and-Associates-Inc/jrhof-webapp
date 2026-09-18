# JRHOF Google Workspace Migration — Phase 0 Inventory

**Status:** Working inventory  
**Date started:** 2026-09-18  
**Purpose:** Establish the current Microsoft/Google state before any migration, DNS change, license removal, or user change.

> Keep this public-repository inventory at a **system and workflow level**. Do not record passwords, recovery codes, private email addresses, personal phone numbers, API keys, tenant IDs that are not already public, or sensitive nonprofit records here.

Detailed exports and sensitive account records belong in an access-controlled organizational system, not this repository.

## How to use this document

For each section:

- mark the item **Known**, **Needs review**, **Migrate**, **Retain**, **Archive**, or **Retire**
- link to an approved private record when details should not be public
- document the owner/role rather than credentials
- do not infer that an unused-looking account can be deleted
- complete discovery before changing MX, DNS, licenses, or identity

## 1. Platform ownership

| Platform | Current purpose | Organizational owner confirmed? | Target state | Notes |
|---|---|---|---|---|
| Google Workspace | TODO | TODO | Primary human productivity platform | Confirm Google for Nonprofits edition and super-admin ownership |
| Microsoft 365 | TODO | TODO | Migration source / retain only where justified | Confirm nonprofit licensing and renewal dates |
| GitHub | Website + technical source of truth | TODO | Retain | No productivity migration required |
| Cloudflare | DNS, web hosting, Workers/R2/D1 | TODO | Retain | No productivity migration required |
| Stripe | Payments | TODO | Retain | No productivity migration required |
| Google Analytics / Tag Manager / Ad Grants | Measurement / advertising | TODO | Retain | Validate organizational ownership separately |

## 2. Identity inventory

Do not list credentials.

| Object type | Count / summary | Owner | Proposed action | Validation needed |
|---|---:|---|---|---|
| Active Microsoft users | TODO | TODO | Review | Confirm real users vs. service/admin accounts |
| Microsoft admin accounts | TODO | TODO | Review | Map required roles to Google |
| Shared mailboxes | TODO | TODO | Map to Group / delegated mailbox / retained mailbox | Review workflow one by one |
| Microsoft 365 Groups | TODO | TODO | Map | Identify mail + SharePoint + Team dependencies |
| Distribution lists | TODO | TODO | Map to Google Groups | Preserve addresses that matter |
| Aliases | TODO | TODO | Migrate | Validate inbound mail after cutover |
| Former users with retained data | TODO | TODO | Archive / migrate as required | Determine retention requirement |
| Service/application identities | TODO | TODO | Retain or redesign | Identify integrations before disabling |
| Existing Google users | TODO | TODO | Normalize | Avoid duplicate identities |

## 3. Email inventory

Record detailed mailbox sizes and addresses in a private administrative record if necessary.

| Item | Current state | Proposed destination | Status / notes |
|---|---|---|---|
| Primary organizational mailboxes | TODO | Gmail | TODO |
| Shared mailboxes | TODO | Google Group / delegated Gmail / retained M365 | Needs workflow decision |
| Aliases | TODO | Google aliases / Groups | TODO |
| Forwarding rules | TODO | Recreate only if still required | TODO |
| Automated messages / SMTP | TODO | Supported Google or application-specific method | Identify every sender first |
| Historical mail requirement | TODO | Gmail / archive | Define retention expectations |

### Email validation checklist

- [ ] source mailbox counts/sizes captured privately
- [ ] every public-facing address accounted for
- [ ] shared mailbox behavior mapped
- [ ] SMTP/application senders identified
- [ ] SPF dependencies inventoried
- [ ] DKIM target plan documented
- [ ] DMARC current state captured
- [ ] rollback window defined before MX change

## 4. Calendar and meeting inventory

| Item | Current state | Google target | Notes |
|---|---|---|---|
| Board recurring meetings | TODO | Google Calendar + Meet | Preserve recurrence and attendees |
| Committee meetings | TODO | Google Calendar + Meet | TODO |
| Shared calendars | TODO | Shared Google calendars | Review ownership |
| Event calendars | TODO | Shared/event calendar | Decide public vs. internal |
| Room/resource calendars | TODO | Google resources if needed | Likely minimal |
| Teams meeting links in future events | TODO | Replace with Meet after cutover | Do not break historical records |

### Board usability test

Before standardizing on Meet:

- [ ] board member can join from browser
- [ ] board member can join from mobile
- [ ] dial-in requirement verified against actual Workspace edition/settings
- [ ] invitation arrives correctly to external addresses
- [ ] screen sharing works for expected presenters
- [ ] meeting ownership does not depend on one volunteer's personal account

## 5. Teams, SharePoint, and OneDrive inventory

Treat Teams files as SharePoint/OneDrive content.

| Source | Purpose | Owner | Approx. volume | Active? | Proposed Google destination | Action |
|---|---|---|---:|---|---|---|
| Team / SharePoint site | TODO | TODO | TODO | TODO | TODO Shared drive | Review |
| Private/shared channel site | TODO | TODO | TODO | TODO | TODO Shared drive | Review |
| Organizational OneDrive content | TODO | TODO | TODO | TODO | Shared drive or user My Drive | Review |

For each Team/site, answer:

- Is this still used?
- Who currently owns it?
- Does it contain files, conversation history, or both that matter?
- Which material is organizational versus personal working material?
- Does access differ from the rest of the board?
- Is there duplicate content elsewhere?
- What is the correct Shared drive destination?
- Is any content sensitive enough to require restricted membership?

## 6. Proposed Shared drive mapping

| Google Shared drive | Source(s) to evaluate | Access model | Status |
|---|---|---|---|
| JRHOF Board & Governance | Board Teams/SharePoint, governance folders | Board / approved officers | Proposed |
| JRHOF Operations | General operations, procedures, vendor working docs | Approved operators | Proposed |
| JRHOF Events | Golf / banquet / event planning | Event operators + relevant board | Proposed |
| JRHOF Finance & Administration | Finance/admin/contracts/state records | Restricted officers only | Proposed |
| JRHOF Media Originals | Approved photo/program/flyer originals | Approved media/operators | Proposed |

Do not create more Shared drives until a permission or ownership boundary requires one.

## 7. Applications and integrations

| Integration | Uses Microsoft identity/mail/files? | Current owner | Google impact | Action |
|---|---|---|---|---|
| jrhof.org website/contact workflow | TODO | TODO | TODO | Verify |
| Stripe | TODO | TODO | Likely independent | Verify notification addresses |
| Cloudflare | TODO | TODO | Likely independent | Verify login/recovery dependencies |
| GitHub | TODO | TODO | Likely independent | Verify org recovery/contact addresses |
| Google Analytics / GTM / Ad Grants | Google-based | TODO | Retain | Verify org ownership |
| Event / registration tools | TODO | TODO | TODO | Verify |
| Other third-party tools | TODO | TODO | TODO | Inventory |

## 8. Microsoft retention decision

Do not cancel licenses until the migration has operated successfully through the agreed validation period.

For each Microsoft workload, classify:

| Workload | Retire | Temporary retain | Long-term retain | Reason / dependency |
|---|:---:|:---:|:---:|---|
| Exchange Online | ☐ | ☐ | ☐ | TODO |
| Teams | ☐ | ☐ | ☐ | TODO |
| SharePoint | ☐ | ☐ | ☐ | TODO |
| OneDrive | ☐ | ☐ | ☐ | TODO |
| Entra ID accounts | ☐ | ☐ | ☐ | TODO |
| Other nonprofit benefits | ☐ | ☐ | ☐ | TODO |

## 9. Cutover blockers

The migration must not move beyond planning/pilot until these are resolved:

- [ ] authoritative user/mail/group inventory complete
- [ ] Shared drive destination and permissions approved
- [ ] critical Teams/SharePoint/OneDrive content mapped
- [ ] applications relying on Microsoft identity or mail identified
- [ ] Google security/admin baseline configured
- [ ] pilot accounts successfully validated
- [ ] supported current Google migration tooling reconfirmed
- [ ] DNS/mail rollback plan documented
- [ ] Microsoft license/retention timeline documented
- [ ] board communication and adoption plan ready

## 10. Phase 0 output

When this inventory is complete, create a short migration decision summary containing:

1. what moves
2. what stays
3. what is archived
4. what can be retired
5. pilot users/workloads
6. cutover sequence
7. rollback owner/process
8. board communication plan

Only then should implementation work begin.
