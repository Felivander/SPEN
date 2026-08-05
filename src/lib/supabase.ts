import { createClient, type Session, type User } from '@supabase/supabase-js'
import type { Movement } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null

export function isSupabaseConfigured(): boolean {
  return Boolean(supabase)
}

/**
 * Initiates Google OAuth login via Supabase.
 * Redirects back to the current origin URL.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Agregá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.')
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  })

  if (error) throw error
}

/**
 * Signs out the current user session.
 */
export async function signOut(): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Listens for auth state changes (login, logout, session refresh).
 */
export function onAuthStateChange(
  callback: (session: Session | null, user: User | null) => void,
) {
  if (!supabase) return () => {}

  // Trigger initial check
  supabase.auth.getSession().then(({ data }) => {
    callback(data.session, data.session?.user ?? null)
  })

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session, session?.user ?? null)
  })

  return () => {
    subscription.unsubscribe()
  }
}

interface SupabaseMovementRow {
  id: string
  user_id: string
  kind: 'gasto' | 'ingreso'
  amount: number
  description: string
  category: string
  date: string
  created_at: number
}

/**
 * Downloads all movements stored in Supabase for the authenticated user.
 */
export async function fetchRemoteMovements(userId: string): Promise<Movement[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('movements')
    .select('*')
    .eq('user_id', userId)

  if (error) {
    console.error('Error al descargar movimientos de Supabase:', error)
    return []
  }

  return (data as SupabaseMovementRow[]).map((row) => ({
    id: row.id,
    kind: row.kind,
    amount: Number(row.amount),
    description: row.description,
    category: row.category,
    date: row.date,
    createdAt: Number(row.created_at),
  }))
}

/**
 * Upserts a list of movements to Supabase associated with the authenticated user.
 */
export async function syncMovementsToCloud(
  userId: string,
  movements: Movement[],
): Promise<boolean> {
  if (!supabase || movements.length === 0) return true

  const rows: SupabaseMovementRow[] = movements.map((m) => ({
    id: m.id,
    user_id: userId,
    kind: m.kind,
    amount: m.amount,
    description: m.description,
    category: m.category,
    date: m.date,
    created_at: m.createdAt,
  }))

  const { error } = await supabase.from('movements').upsert(rows, {
    onConflict: 'id',
  })

  if (error) {
    console.error('Error al sincronizar movimientos con Supabase:', error)
    return false
  }

  return true
}

/**
 * Deletes a single movement from Supabase.
 */
export async function deleteRemoteMovement(
  userId: string,
  movementId: string,
): Promise<boolean> {
  if (!supabase) return true

  const { error } = await supabase
    .from('movements')
    .delete()
    .eq('id', movementId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error al eliminar movimiento de Supabase:', error)
    return false
  }

  return true
}

/**
 * Clears all remote movements for the user (e.g. on Clear All).
 */
export async function clearRemoteMovements(userId: string): Promise<boolean> {
  if (!supabase) return true

  const { error } = await supabase
    .from('movements')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error al limpiar movimientos en Supabase:', error)
    return false
  }

  return true
}
