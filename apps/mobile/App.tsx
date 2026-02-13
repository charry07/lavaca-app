import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { formatCOP } from '@lavaca/shared';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🐄</Text>
      <Text style={styles.logo}>La Vaca</Text>
      <Text style={styles.tagline}>Simple y sencillo de dividir y pagar cuentas</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Ejemplo rapido</Text>
        <Text style={styles.cardText}>
          Cuenta total: {formatCOP(35000)}
        </Text>
        <Text style={styles.cardText}>
          Entre 7 personas: {formatCOP(5000)} c/u
        </Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Crear Mesa</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.buttonSecondary]}>
        <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
          Unirme a Mesa
        </Text>
      </TouchableOpacity>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4ade80',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 40,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#2d3a5e',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#4ade80',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  buttonTextSecondary: {
    color: '#4ade80',
  },
});
