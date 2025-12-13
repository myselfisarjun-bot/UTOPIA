import { type PropsWithChildren } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { ProgressBar } from '@/components/ProgressBar'

export function OnboardingLayout(
  props: PropsWithChildren<{ title: string; step: number; totalSteps: number; percent: number }>
) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>{`Step ${props.step} of ${props.totalSteps}`}</Text>
        <Text style={styles.title}>{props.title}</Text>
        <ProgressBar percent={props.percent} />
      </View>
      <View style={styles.content}>{props.children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
    backgroundColor: '#fff',
  },
  header: {
    gap: 8,
  },
  kicker: {
    color: '#6B7280',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    gap: 12,
  },
})
