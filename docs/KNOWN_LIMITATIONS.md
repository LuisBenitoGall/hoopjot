# Known Limitations

These are accepted MVP pilot limitations, not hidden backlog items.

- Sync conflict handling is last-write-wins based on `updatedAt`; concurrent multi-device edits can overwrite the older write.
- The MVP does not use realtime subscriptions.
- A new device needs network for first authenticated bootstrap before it has useful local data.
- Basketball guidance is a small curated starter catalog, not a large content library.
- Hoopjot does not provide AI interpretation, video analysis, coach dashboards, social features or leaderboards.
- Physical context is optional and never drives medical clearance, rehab progression, pain interpretation or whether a player should play.
- Push notifications are not implemented.
- Legal/privacy copy still needs review before public launch in target jurisdictions.
