import React, {useMemo} from 'react'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'

// ── Types ────────────────────────────────────────────────

interface AssetDisplayed {
  _id?: string
  installDate?: string
  expectedLifespan?: number
  manualCondition?: string
  name?: string
}

interface HealthBarProps {
  document: {
    displayed: AssetDisplayed
  }
}

// ── Health Calculation ───────────────────────────────────

function calculateHealth(doc: AssetDisplayed) {
  const {installDate, expectedLifespan, manualCondition} = doc

  // Manual override takes priority
  if (manualCondition) {
    const overrides: Record<string, number> = {
      new: 100,
      good: 80,
      worn: 50,
      critical: 20,
      defect: 0,
    }
    if (manualCondition in overrides) {
      const score = overrides[manualCondition]
      return {
        score,
        age: null,
        lifespan: expectedLifespan ?? null,
        remaining: null,
        source: 'manual' as const,
      }
    }
  }

  if (!installDate || !expectedLifespan || expectedLifespan <= 0) {
    return null // Missing data
  }

  const installYear = new Date(installDate).getFullYear()
  const currentYear = new Date().getFullYear()
  const age = currentYear - installYear
  const remaining = Math.max(0, expectedLifespan - age)
  const score = Math.round(
    Math.max(0, Math.min(100, 100 - (age / expectedLifespan) * 100))
  )

  return {
    score,
    age,
    lifespan: expectedLifespan,
    remaining,
    source: 'calculated' as const,
  }
}

// ── Color Helpers ────────────────────────────────────────

function getTone(score: number): 'positive' | 'caution' | 'critical' {
  if (score >= 75) return 'positive'
  if (score >= 40) return 'caution'
  return 'critical'
}

function getBarColor(score: number): string {
  if (score >= 75) return '#22c55e'
  if (score >= 40) return '#eab308'
  return '#ef4444'
}

function getStatusLabel(score: number): string {
  if (score >= 75) return 'Gut'
  if (score >= 50) return 'Akzeptabel'
  if (score >= 25) return 'Abgenutzt'
  if (score > 0) return 'Kritisch'
  return 'Ende der Lebensdauer'
}

// ── Component ────────────────────────────────────────────

export function HealthBar(props: HealthBarProps) {
  const doc = props.document.displayed
  const health = useMemo(() => calculateHealth(doc), [doc])

  // ── Missing Data State ─────────────────────────────────
  if (!health) {
    return (
      <Box padding={4}>
        <Card padding={5} radius={3} tone="transparent" style={{textAlign: 'center'}}>
          <Stack space={4}>
            <Text size={4} style={{opacity: 0.3}}>
              --
            </Text>
            <Text size={2} weight="bold" muted>
              Keine Gesundheitsdaten
            </Text>
            <Text size={1} muted>
              Bitte Installationsdatum und erwartete Lebensdauer im Tab &quot;Lifecycle &amp; CAPEX&quot;
              eintragen, um den Zustand zu berechnen.
            </Text>
          </Stack>
        </Card>
      </Box>
    )
  }

  const {score, age, lifespan, remaining, source} = health
  const tone = getTone(score)
  const barColor = getBarColor(score)
  const statusLabel = getStatusLabel(score)

  return (
    <Box padding={4}>
      <Stack space={5}>
        {/* ── Header ──────────────────────────────────────── */}
        <Flex align="center" gap={3}>
          <Text size={2} weight="bold">
            Asset-Zustandsbewertung
          </Text>
          {source === 'manual' && (
            <Card padding={1} paddingX={2} radius={2} tone="caution">
              <Text size={0}>Manuell</Text>
            </Card>
          )}
        </Flex>

        {/* ── Score Card ──────────────────────────────────── */}
        <Card padding={5} radius={3} tone={tone} shadow={1}>
          <Stack space={4}>
            {/* Score Display */}
            <Flex align="baseline" gap={2} justify="center">
              <Text
                size={4}
                weight="bold"
                style={{fontSize: '3rem', lineHeight: 1}}
              >
                {score}
              </Text>
              <Text size={2} muted>
                / 100
              </Text>
            </Flex>

            {/* Status Label */}
            <Text size={1} weight="bold" align="center">
              {statusLabel}
            </Text>

            {/* Progress Bar */}
            <div
              style={{
                width: '100%',
                height: 12,
                borderRadius: 6,
                background: 'rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${score}%`,
                  height: '100%',
                  borderRadius: 6,
                  background: barColor,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </Stack>
        </Card>

        {/* ── Stats Grid ──────────────────────────────────── */}
        {age !== null && lifespan !== null && remaining !== null && (
          <Flex gap={3} wrap="wrap">
            <Card flex={1} padding={4} radius={2} tone="transparent" style={{minWidth: 120}}>
              <Stack space={2}>
                <Text size={0} muted>
                  Alter
                </Text>
                <Text size={2} weight="bold">
                  {age} {age === 1 ? 'Jahr' : 'Jahre'}
                </Text>
              </Stack>
            </Card>

            <Card flex={1} padding={4} radius={2} tone="transparent" style={{minWidth: 120}}>
              <Stack space={2}>
                <Text size={0} muted>
                  Lebensdauer
                </Text>
                <Text size={2} weight="bold">
                  {lifespan} Jahre
                </Text>
              </Stack>
            </Card>

            <Card flex={1} padding={4} radius={2} tone="transparent" style={{minWidth: 120}}>
              <Stack space={2}>
                <Text size={0} muted>
                  Restlaufzeit
                </Text>
                <Text size={2} weight="bold">
                  {remaining} {remaining === 1 ? 'Jahr' : 'Jahre'}
                </Text>
              </Stack>
            </Card>
          </Flex>
        )}

        {/* ── CAPEX Warning ───────────────────────────────── */}
        {score < 20 && (
          <Card padding={4} radius={2} tone="critical" shadow={1}>
            <Flex align="center" gap={3}>
              <Text size={2}>⚠️</Text>
              <Stack space={2}>
                <Text size={1} weight="bold">
                  Ersatz empfohlen (CAPEX-Planung)
                </Text>
                <Text size={1} muted>
                  Dieses Asset hat weniger als 20% seiner erwarteten Lebensdauer verbleibend.
                  Bitte Budgetierung für Ersatzbeschaffung einleiten.
                </Text>
              </Stack>
            </Flex>
          </Card>
        )}
      </Stack>
    </Box>
  )
}
