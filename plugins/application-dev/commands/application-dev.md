---
name: application-dev
description: >-
  Orchestrates autonomous, long-running application development using a GAN-inspired
  three-agent architecture. Run as the /application-dev slash command. Pass a 1-4 sentence application prompt.
argument-hint: "<1-4 sentence application description>"
allowed-tools: Agent, Read
---

# Orchestrator command

Spawn the Planner, Generator, and Evaluator to build an application autonomously from the user's prompt. Pass the user's prompt verbatim to the Planner.
