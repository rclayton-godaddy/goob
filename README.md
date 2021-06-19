# Goob (GoDaddy Observability)

Integrating logging, tracing, and metrics into an application SHOULD be easy.  So why do we struggle so much to do it?

This is a library with strong opinions.  Our intent is to make your life easier by taking away choices:

- Logs will be in JSON.
- Log will use a strongly-typed ECS (Elastic Common Schema) format.
- Log levels will use conventions established for decades (https://sematext.com/blog/logging-levels/).
- Metrics and tracing will be integrated with the logger.
- The framework supports standard backends out-of-the-box.
- Configured from the environment.

