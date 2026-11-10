import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { HishabMobileClient } from './HishabClient';
import { DashboardSummary } from '../lib/types';

// Replace with your published Next.js API domain or local IP (e.g. http://10.0.2.2:3000 for Android emulator)
const API_URL = 'http://localhost:3000';
const client = new HishabMobileClient({ baseUrl: API_URL });

export default function MobileApp() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    try {
      setLoading(true);
      await client.login(); // Authenticate mobile session
      const res = await client.getDashboard();
      setData(res);
    } catch (e) {
      console.error('Error loading mobile dashboard:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#079be8" />
        <Text style={{ marginTop: 10, color: '#888' }}>Connecting to Hishab Rakhi...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Topbar */}
        <View style={styles.topbar}>
          <View>
            <Text style={styles.greeting}>Hello {data.user.name}!</Text>
            <Text style={styles.date}>Mobile Connected</Text>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Total Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balance}>
              {hideBalance ? '••••••••' : `$${data.totalBalance.toLocaleString()}`}
            </Text>
            <TouchableOpacity onPress={() => setHideBalance(!hideBalance)}>
              <Text style={styles.eyeBtn}>{hideBalance ? 'Show' : 'Hide'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.metrics}>
            <View>
              <Text style={styles.sublabel}>Income</Text>
              <Text style={styles.metricVal}>+${data.monthlyIncome.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.sublabel}>Expense</Text>
              <Text style={styles.metricVal}>-${data.monthlyExpense.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Savings Goal */}
        {data.savingsGoals[0] && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Savings Goal</Text>
            <Text style={styles.goalTitle}>{data.savingsGoals[0].title}</Text>
            <Text style={styles.goalAmount}>
              ${data.savingsGoals[0].currentAmount.toLocaleString()} / $
              {data.savingsGoals[0].targetAmount.toLocaleString()}
            </Text>
            <Text style={styles.goalNote}>{data.savingsGoals[0].note}</Text>
          </View>
        )}

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Recent Activity</Text>
        {data.recentTransactions.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.txTitle}>{tx.title}</Text>
              <Text style={styles.txSub}>{tx.category}</Text>
            </View>
            <Text
              style={[
                styles.txAmount,
                tx.type === 'income' ? styles.positive : styles.negative,
              ]}
            >
              {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16 },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#17191d' },
  date: { fontSize: 13, color: '#a4a5a8', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  label: { fontSize: 13, color: '#888', fontWeight: '500' },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  balance: { fontSize: 32, fontWeight: '700', color: '#17191d' },
  eyeBtn: { color: '#079be8', fontWeight: '600', padding: 4 },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, borderTopWidth: 1, borderColor: '#f0f0f0', paddingTop: 12 },
  sublabel: { fontSize: 12, color: '#999' },
  metricVal: { fontSize: 17, fontWeight: '600', marginTop: 3 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 8, color: '#17191d' },
  goalTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  goalAmount: { fontSize: 14, color: '#079be8', fontWeight: '700', marginTop: 4 },
  goalNote: { fontSize: 12, color: '#888', marginTop: 4 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  txTitle: { fontSize: 15, fontWeight: '600', color: '#222' },
  txSub: { fontSize: 12, color: '#aaa', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  positive: { color: '#219b35' },
  negative: { color: '#fa4563' },
});

